import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { TalkChannelEntity } from '../entity/talk-channel.entity';
import { TalkChannelMemberEntity } from '../entity/talk-channel-member.entity';
import { TalkMessageEntity } from '../entity/talk-message.entity';
import { TalkReadStatusEntity } from '../entity/talk-read-status.entity';
import { TalkAttachmentEntity } from '../entity/talk-attachment.entity';
import { TalkMessageHideEntity } from '../entity/talk-message-hide.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { CreateChannelRequest } from '../dto/request/create-channel.request';
import { UpdateChannelRequest } from '../dto/request/update-channel.request';
import { ChannelMapper } from '../mapper/channel.mapper';
import { TalkSseService } from './talk-sse.service';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { TalkChannelResponse, TalkChannelDetailResponse } from '@amb/types';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(TalkChannelEntity)
    private readonly channelRepo: Repository<TalkChannelEntity>,
    @InjectRepository(TalkChannelMemberEntity)
    private readonly memberRepo: Repository<TalkChannelMemberEntity>,
    @InjectRepository(TalkMessageEntity)
    private readonly messageRepo: Repository<TalkMessageEntity>,
    @InjectRepository(TalkReadStatusEntity)
    private readonly readStatusRepo: Repository<TalkReadStatusEntity>,
    @InjectRepository(TalkAttachmentEntity)
    private readonly attachmentRepo: Repository<TalkAttachmentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    @InjectRepository(TalkMessageHideEntity)
    private readonly messageHideRepo: Repository<TalkMessageHideEntity>,
    private readonly sseService: TalkSseService,
  ) {}

  async getMyChannels(userId: string, entId: string): Promise<TalkChannelResponse[]> {
    const memberships = await this.memberRepo.find({
      where: { usrId: userId, chmLeftAt: IsNull() },
    });
    const channelIds = memberships.map((m) => m.chnId);
    if (channelIds.length === 0) return [];

    // 1. 채널 일괄 조회 (entId 있으면 법인 격리 + DIRECT 채널 포함, 없으면(ADMIN) 전체)
    const channels = entId
      ? await this.channelRepo.find({
          where: [
            { chnId: In(channelIds), entId, chnDeletedAt: IsNull() },
            { chnId: In(channelIds), chnType: 'DIRECT', chnDeletedAt: IsNull() },
          ],
        })
      : await this.channelRepo.find({
          where: { chnId: In(channelIds), chnDeletedAt: IsNull() },
        });
    if (channels.length === 0) return [];
    const validIds = channels.map((c) => c.chnId);

    // 2. 멤버 수 일괄 집계
    const memberCountsRaw = await this.memberRepo
      .createQueryBuilder('m')
      .select('m.chn_id', 'chnId')
      .addSelect('COUNT(*)::int', 'count')
      .where('m.chn_id IN (:...ids)', { ids: validIds })
      .andWhere('m.chm_left_at IS NULL')
      .groupBy('m.chn_id')
      .getRawMany<{ chnId: string; count: number }>();
    const countMap = new Map(memberCountsRaw.map((r) => [r.chnId, r.count]));

    // 3. 최신 메시지 일괄 조회 (PostgreSQL DISTINCT ON)
    const lastMessages = await this.messageRepo
      .createQueryBuilder('msg')
      .distinctOn(['msg.chn_id'])
      .where('msg.chn_id IN (:...ids)', { ids: validIds })
      .andWhere('msg.msg_deleted_at IS NULL')
      .orderBy('msg.chn_id')
      .addOrderBy('msg.msg_created_at', 'DESC')
      .getMany();
    const lastMsgMap = new Map(lastMessages.map((m) => [m.chnId, m]));

    // 4. 미읽음 수 일괄 집계 (read_status LEFT JOIN, 본인 메시지 제외)
    const unreadRaw: Array<{ chnId: string; unread: number }> = await this.messageRepo.query(
      `SELECT m.chn_id AS "chnId", COUNT(*)::int AS "unread"
       FROM amb_talk_messages m
       LEFT JOIN amb_talk_read_status rs ON rs.chn_id = m.chn_id AND rs.usr_id = $1
       WHERE m.chn_id = ANY($2)
         AND m.msg_deleted_at IS NULL
         AND m.usr_id != $1
         AND (rs.trs_last_read_at IS NULL OR m.msg_created_at > rs.trs_last_read_at)
       GROUP BY m.chn_id`,
      [userId, validIds],
    );
    const unreadMap = new Map(unreadRaw.map((r) => [r.chnId, r.unread]));

    // 5. 생성자 이름 일괄 조회
    const creatorIds = [...new Set(channels.map((c) => c.chnCreatedBy))];
    const creators = await this.userRepo.find({ where: { usrId: In(creatorIds) } });
    const creatorMap = new Map(creators.map((u) => [u.usrId, u.usrName]));

    // 6. pinned/muted 상태 맵
    const pinnedMap = new Map(memberships.map((m) => [m.chnId, m.chmPinned]));
    const mutedMap = new Map(memberships.map((m) => [m.chnId, m.chmMuted]));

    // 7. DM 채널 상대방 userId 조회
    const dmChannelIds = channels.filter((c) => c.chnType === 'DIRECT').map((c) => c.chnId);
    const dmPartnerMap = new Map<string, string>();
    if (dmChannelIds.length > 0) {
      const dmMembers = await this.memberRepo.find({
        where: { chnId: In(dmChannelIds), chmLeftAt: IsNull() },
      });
      for (const chnId of dmChannelIds) {
        const partner = dmMembers.find((m) => m.chnId === chnId && m.usrId !== userId);
        if (partner) dmPartnerMap.set(chnId, partner.usrId);
      }
    }

    // 7-1. lastMessage의 첨부파일 일괄 조회 (FILE 타입만)
    const fileMessageIds = lastMessages.filter((m) => m.msgType === 'FILE').map((m) => m.msgId);
    const lastMsgAttachmentMap = new Map<string, TalkAttachmentEntity[]>();
    if (fileMessageIds.length > 0) {
      const attachments = await this.attachmentRepo.find({
        where: { msgId: In(fileMessageIds) },
      });
      for (const att of attachments) {
        const list = lastMsgAttachmentMap.get(att.msgId) || [];
        list.push(att);
        lastMsgAttachmentMap.set(att.msgId, list);
      }
    }

    // 8. lastMessage의 senderName + mentions 해석
    const lastMsgSenderIds = [...new Set(lastMessages.map((m) => m.usrId))];
    const mentionRegex = /<@([0-9a-f-]{36})>/g;
    const allMentionIds = new Set<string>();
    for (const msg of lastMessages) {
      let match: RegExpExecArray | null;
      while ((match = mentionRegex.exec(msg.msgContent)) !== null) {
        allMentionIds.add(match[1]);
      }
    }
    const lookupIds = [...new Set([...lastMsgSenderIds, ...allMentionIds])];
    const lookupUsers = lookupIds.length > 0
      ? await this.userRepo.find({ where: { usrId: In(lookupIds) } })
      : [];
    const userNameMap = new Map(lookupUsers.map((u) => [u.usrId, u.usrName]));

    const lastMsgMentionMap = new Map<string, { userId: string; userName: string }[]>();
    for (const msg of lastMessages) {
      const mentions: { userId: string; userName: string }[] = [];
      let match: RegExpExecArray | null;
      const regex = /<@([0-9a-f-]{36})>/g;
      while ((match = regex.exec(msg.msgContent)) !== null) {
        const uid = match[1];
        const name = userNameMap.get(uid);
        if (name) mentions.push({ userId: uid, userName: name });
      }
      if (mentions.length > 0) lastMsgMentionMap.set(msg.msgId, mentions);
    }

    // 9. 응답 매핑
    const results = channels.map((channel) => {
      const lastMsg = lastMsgMap.get(channel.chnId) || null;
      return ChannelMapper.toChannelResponse(
        channel,
        countMap.get(channel.chnId) || 0,
        unreadMap.get(channel.chnId) || 0,
        lastMsg,
        creatorMap.get(channel.chnCreatedBy) || null,
        pinnedMap.get(channel.chnId) || false,
        dmPartnerMap.get(channel.chnId) || null,
        lastMsg ? userNameMap.get(lastMsg.usrId) || null : null,
        lastMsg ? lastMsgMentionMap.get(lastMsg.msgId) : undefined,
        mutedMap.get(channel.chnId) || false,
        lastMsg ? lastMsgAttachmentMap.get(lastMsg.msgId) : undefined,
      );
    });

    return results.sort((a, b) => {
      // pinned 채널 우선
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  async getChannelDetail(channelId: string, userId: string, entId: string): Promise<TalkChannelDetailResponse> {
    await this.assertMember(channelId, userId);

    const channel = entId
      ? await this.channelRepo.findOne({
          where: [
            { chnId: channelId, entId, chnDeletedAt: IsNull() },
            { chnId: channelId, chnType: 'DIRECT', chnDeletedAt: IsNull() },
          ],
        })
      : await this.channelRepo.findOne({
          where: { chnId: channelId, chnDeletedAt: IsNull() },
        });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }

    const members = await this.memberRepo.find({
      where: { chnId: channelId, chmLeftAt: IsNull() },
    });

    const memberResponses = await Promise.all(
      members.map(async (m) => {
        const user = await this.userRepo.findOne({ where: { usrId: m.usrId } });
        return ChannelMapper.toChannelMemberResponse(m, user?.usrName || 'Unknown');
      }),
    );

    const memberCount = members.length;
    const creator = await this.userRepo.findOne({ where: { usrId: channel.chnCreatedBy } });

    return {
      ...ChannelMapper.toChannelResponse(channel, memberCount, 0, null, creator?.usrName || null),
      members: memberResponses,
    };
  }

  async createChannel(dto: CreateChannelRequest, userId: string, entId: string): Promise<TalkChannelResponse> {
    const channel = this.channelRepo.create({
      chnName: dto.name,
      chnType: dto.type,
      chnDescription: dto.description || null,
      entId: entId || null,
      chnCreatedBy: userId,
    });
    const saved = await this.channelRepo.save(channel);

    // Add creator as OWNER
    const ownerMember = this.memberRepo.create({
      chnId: saved.chnId,
      usrId: userId,
      chmRole: 'OWNER',
    });
    await this.memberRepo.save(ownerMember);

    // Add invited members
    if (dto.member_ids?.length) {
      for (const memberId of dto.member_ids) {
        if (memberId === userId) continue;
        const member = this.memberRepo.create({
          chnId: saved.chnId,
          usrId: memberId,
          chmRole: 'MEMBER',
        });
        await this.memberRepo.save(member);
      }
    }

    const creator = await this.userRepo.findOne({ where: { usrId: userId } });
    const memberCount = (dto.member_ids?.length || 0) + 1;

    return ChannelMapper.toChannelResponse(saved, memberCount, 0, null, creator?.usrName || null);
  }

  async findOrCreateDm(
    targetUserId: string,
    userId: string,
    entId: string,
  ): Promise<TalkChannelResponse> {
    // 1. 기존 DM 채널 검색: 두 사용자가 모두 멤버인 DIRECT 채널
    const entCondition = entId ? 'AND c.ent_id = $3' : '';
    const params = entId ? [userId, targetUserId, entId] : [userId, targetUserId];
    const existing: Array<{ chn_id: string }> = await this.channelRepo.query(
      `SELECT c.chn_id
       FROM amb_talk_channels c
       JOIN amb_talk_channel_members m1 ON m1.chn_id = c.chn_id AND m1.usr_id = $1 AND m1.chm_left_at IS NULL
       JOIN amb_talk_channel_members m2 ON m2.chn_id = c.chn_id AND m2.usr_id = $2 AND m2.chm_left_at IS NULL
       WHERE c.chn_type = 'DIRECT'
         AND c.chn_deleted_at IS NULL
         ${entCondition}
       LIMIT 1`,
      params,
    );

    if (existing.length > 0) {
      const channelId = existing[0].chn_id;
      const channel = await this.channelRepo.findOne({ where: { chnId: channelId } });
      if (channel) {
        const targetUser = await this.userRepo.findOne({ where: { usrId: targetUserId } });
        return ChannelMapper.toChannelResponse(channel, 2, 0, null, targetUser?.usrName || null);
      }
    }

    // 2. 새 DM 채널 생성
    const targetUser = await this.userRepo.findOne({ where: { usrId: targetUserId } });
    const currentUser = await this.userRepo.findOne({ where: { usrId: userId } });
    if (!targetUser) {
      throw new NotFoundException('Target user not found.');
    }

    const channelName = `${currentUser?.usrName || 'User'}, ${targetUser.usrName}`;
    const channel = this.channelRepo.create({
      chnName: channelName,
      chnType: 'DIRECT',
      chnDescription: null,
      entId: entId || null,
      chnCreatedBy: userId,
    });
    const saved = await this.channelRepo.save(channel);

    // 두 사용자를 멤버로 추가
    await this.memberRepo.save([
      this.memberRepo.create({ chnId: saved.chnId, usrId: userId, chmRole: 'OWNER' }),
      this.memberRepo.create({ chnId: saved.chnId, usrId: targetUserId, chmRole: 'MEMBER' }),
    ]);

    return ChannelMapper.toChannelResponse(saved, 2, 0, null, currentUser?.usrName || null);
  }

  async getEntityMembers(
    entId: string,
  ): Promise<Array<{ userId: string; name: string; email: string }>> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select(['u.usr_id AS "userId"', 'u.usr_name AS "name"', 'u.usr_email AS "email"'])
      .andWhere('u.usr_status = :status', { status: 'ACTIVE' })
      .orderBy('u.usr_name', 'ASC');
    if (entId) {
      qb.andWhere('u.usr_company_id = :entId', { entId });
    }
    return qb.getRawMany();
  }

  async getClientMembers(
    entId: string,
  ): Promise<Array<{ userId: string; name: string; email: string; clientName: string | null }>> {
    if (!entId) return [];
    const clients = await this.clientRepo.find({ where: { cliEntId: entId } });
    if (clients.length === 0) return [];
    const cliIds = clients.map((c) => c.cliId);
    const clientNameMap = new Map(clients.map((c) => [c.cliId, c.cliCompanyName]));

    const users = await this.userRepo
      .createQueryBuilder('u')
      .select(['u.usr_id AS "userId"', 'u.usr_name AS "name"', 'u.usr_email AS "email"', 'u.usr_cli_id AS "cliId"'])
      .where('u.usr_level_code = :level', { level: 'CLIENT_LEVEL' })
      .andWhere('u.usr_status = :status', { status: 'ACTIVE' })
      .andWhere('u.usr_cli_id IN (:...cliIds)', { cliIds })
      .orderBy('u.usr_name', 'ASC')
      .getRawMany<{ userId: string; name: string; email: string; cliId: string }>();

    return users.map((u) => ({
      userId: u.userId,
      name: u.name,
      email: u.email,
      clientName: clientNameMap.get(u.cliId) || null,
    }));
  }

  async updateChannel(channelId: string, dto: UpdateChannelRequest, userId: string, entId: string): Promise<TalkChannelResponse> {
    await this.assertMember(channelId, userId);

    const channel = await this.channelRepo.findOne({
      where: { chnId: channelId, ...(entId ? { entId } : {}), chnDeletedAt: IsNull() },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }

    if (dto.name !== undefined) channel.chnName = dto.name;
    if (dto.description !== undefined) channel.chnDescription = dto.description;

    const saved = await this.channelRepo.save(channel);
    const memberCount = await this.memberRepo.count({ where: { chnId: channelId, chmLeftAt: IsNull() } });
    const creator = await this.userRepo.findOne({ where: { usrId: channel.chnCreatedBy } });

    return ChannelMapper.toChannelResponse(saved, memberCount, 0, null, creator?.usrName || null);
  }

  async deleteChannel(channelId: string, userId: string, entId: string): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { chnId: channelId, ...(entId ? { entId } : {}), chnDeletedAt: IsNull() },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }
    if (channel.chnCreatedBy !== userId) {
      throw new ForbiddenException(ERROR_CODE.CHANNEL_ACCESS_DENIED.message);
    }

    await this.channelRepo.softRemove(channel);
  }

  async addMember(channelId: string, targetUserId: string, userId: string, entId: string): Promise<void> {
    await this.assertChannelInEntity(channelId, entId);
    await this.assertMember(channelId, userId);

    const existing = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: targetUserId, chmLeftAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(ERROR_CODE.CHANNEL_MEMBER_ALREADY_EXISTS.message);
    }

    const member = this.memberRepo.create({
      chnId: channelId,
      usrId: targetUserId,
      chmRole: 'MEMBER',
    });
    await this.memberRepo.save(member);
  }

  async removeMember(channelId: string, targetUserId: string, userId: string, entId: string): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { chnId: channelId, ...(entId ? { entId } : {}), chnDeletedAt: IsNull() },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }

    // Owner cannot be removed
    if (targetUserId === channel.chnCreatedBy) {
      throw new ForbiddenException(ERROR_CODE.CANNOT_LEAVE_OWNED_CHANNEL.message);
    }

    await this.assertMember(channelId, userId);

    const member = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: targetUserId, chmLeftAt: IsNull() },
    });
    if (member) {
      member.chmLeftAt = new Date();
      await this.memberRepo.save(member);
    }
  }

  async markAsRead(channelId: string, userId: string): Promise<void> {
    await this.assertMember(channelId, userId);

    const lastMsg = await this.messageRepo.findOne({
      where: { chnId: channelId, msgDeletedAt: IsNull() },
      order: { msgCreatedAt: 'DESC' },
    });

    let readStatus = await this.readStatusRepo.findOne({
      where: { chnId: channelId, usrId: userId },
    });

    if (readStatus) {
      readStatus.trsLastReadAt = new Date();
      readStatus.trsLastMsgId = lastMsg?.msgId || null;
    } else {
      readStatus = this.readStatusRepo.create({
        chnId: channelId,
        usrId: userId,
        trsLastReadAt: new Date(),
        trsLastMsgId: lastMsg?.msgId || null,
      });
    }
    await this.readStatusRepo.save(readStatus);

    // 읽음 처리 시 채널 내 다른 사용자의 메시지 읽음 상태 갱신용 SSE emit
    this.sseService.emit({
      channelId,
      type: 'channel:read',
      data: { userId },
    });
  }

  async getUnreadCounts(userId: string): Promise<Array<{ channelId: string; unreadCount: number }>> {
    const memberships = await this.memberRepo.find({
      where: { usrId: userId, chmLeftAt: IsNull() },
    });
    if (memberships.length === 0) return [];

    const channelIds = memberships.map((m) => m.chnId);

    const raw: Array<{ channelId: string; unreadCount: number }> = await this.messageRepo.query(
      `SELECT m.chn_id AS "channelId", COUNT(*)::int AS "unreadCount"
       FROM amb_talk_messages m
       LEFT JOIN amb_talk_read_status rs ON rs.chn_id = m.chn_id AND rs.usr_id = $1
       WHERE m.chn_id = ANY($2)
         AND m.msg_deleted_at IS NULL
         AND m.usr_id != $1
         AND (rs.trs_last_read_at IS NULL OR m.msg_created_at > rs.trs_last_read_at)
       GROUP BY m.chn_id
       HAVING COUNT(*) > 0`,
      [userId, channelIds],
    );

    return raw;
  }

  async togglePin(channelId: string, userId: string): Promise<{ isPinned: boolean }> {
    const membership = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: userId, chmLeftAt: IsNull() },
    });
    if (!membership) {
      throw new ForbiddenException(ERROR_CODE.CHANNEL_ACCESS_DENIED.message);
    }
    membership.chmPinned = !membership.chmPinned;
    await this.memberRepo.save(membership);
    return { isPinned: membership.chmPinned };
  }

  async toggleMute(channelId: string, userId: string): Promise<{ isMuted: boolean }> {
    const membership = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: userId, chmLeftAt: IsNull() },
    });
    if (!membership) {
      throw new ForbiddenException(ERROR_CODE.CHANNEL_ACCESS_DENIED.message);
    }
    membership.chmMuted = !membership.chmMuted;
    await this.memberRepo.save(membership);
    return { isMuted: membership.chmMuted };
  }

  async isMuted(channelId: string, userId: string): Promise<boolean> {
    const membership = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: userId, chmLeftAt: IsNull() },
    });
    return membership?.chmMuted ?? false;
  }

  async archiveChannel(channelId: string, userId: string, entId: string): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { chnId: channelId, ...(entId ? { entId } : {}), chnDeletedAt: IsNull() },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }
    if (channel.chnArchivedAt) {
      throw new BadRequestException(ERROR_CODE.TALK_CHANNEL_ALREADY_ARCHIVED.message);
    }
    await this.assertMember(channelId, userId);

    channel.chnArchivedAt = new Date();
    channel.chnArchivedBy = userId;
    await this.channelRepo.save(channel);
  }

  async unarchiveChannel(channelId: string, userId: string, entId: string): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { chnId: channelId, ...(entId ? { entId } : {}), chnDeletedAt: IsNull() },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }
    if (!channel.chnArchivedAt) {
      throw new BadRequestException(ERROR_CODE.TALK_CHANNEL_NOT_ARCHIVED.message);
    }
    await this.assertMember(channelId, userId);

    channel.chnArchivedAt = null;
    channel.chnArchivedBy = null;
    await this.channelRepo.save(channel);
  }

  async createSystemMessage(channelId: string, content: string): Promise<TalkMessageEntity> {
    const message = this.messageRepo.create({
      chnId: channelId,
      usrId: '00000000-0000-0000-0000-000000000000',
      msgContent: content,
      msgType: 'SYSTEM',
    });
    return this.messageRepo.save(message);
  }

  async deleteDmChannel(channelId: string, userId: string): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { chnId: channelId, chnType: 'DIRECT', chnDeletedAt: IsNull() },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }
    await this.assertMember(channelId, userId);

    // DM 채널에 메시지가 있으면 삭제 불가
    const msgCount = await this.messageRepo.count({
      where: { chnId: channelId, msgDeletedAt: IsNull() },
    });
    if (msgCount > 0) {
      throw new BadRequestException('Cannot delete DM channel with messages.');
    }
    await this.channelRepo.softRemove(channel);
  }

  private async assertChannelInEntity(channelId: string, entId: string): Promise<void> {
    const channel = await this.channelRepo.findOne({
      where: { chnId: channelId, ...(entId ? { entId } : {}), chnDeletedAt: IsNull() },
    });
    if (!channel) {
      throw new NotFoundException(ERROR_CODE.CHANNEL_NOT_FOUND.message);
    }
  }

  async assertChannelMember(channelId: string, userId: string): Promise<void> {
    const membership = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: userId, chmLeftAt: IsNull() },
    });
    if (!membership) {
      throw new ForbiddenException(ERROR_CODE.CHANNEL_ACCESS_DENIED.message);
    }
  }

  private async assertMember(channelId: string, userId: string): Promise<void> {
    return this.assertChannelMember(channelId, userId);
  }
}
