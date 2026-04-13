import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TalkMessageEntity } from '../entity/talk-message.entity';
import { TalkChannelMemberEntity } from '../entity/talk-channel-member.entity';
import { TalkChannelEntity } from '../entity/talk-channel.entity';
import { TalkReadStatusEntity } from '../entity/talk-read-status.entity';
import { TalkReactionEntity } from '../entity/talk-reaction.entity';
import { TalkAttachmentEntity } from '../entity/talk-attachment.entity';
import { TalkMessageHideEntity } from '../entity/talk-message-hide.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { SendMessageRequest } from '../dto/request/send-message.request';
import { UpdateMessageRequest } from '../dto/request/update-message.request';
import { MessageMapper } from '../mapper/message.mapper';
import { MessageTranslateService } from './message-translate.service';
import { FileService } from '../../../infrastructure/file/file.service';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { MODULE_DATA_EVENTS, ModuleDataEvent } from '../../kms/event/module-data.event';
import { TalkMessageResponse, TalkReactionSummary } from '@amb/types';
import { PushService } from '../../notification/service/push.service';
import { NotificationSseService } from '../../notification/service/notification-sse.service';

const LANG_LABELS: Record<string, string> = {
  en: 'EN', ko: 'KO', vi: 'VI', ja: 'JA', zh: 'ZH',
};

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(TalkMessageEntity)
    private readonly messageRepo: Repository<TalkMessageEntity>,
    @InjectRepository(TalkChannelMemberEntity)
    private readonly memberRepo: Repository<TalkChannelMemberEntity>,
    @InjectRepository(TalkChannelEntity)
    private readonly channelRepo: Repository<TalkChannelEntity>,
    @InjectRepository(TalkReadStatusEntity)
    private readonly readStatusRepo: Repository<TalkReadStatusEntity>,
    @InjectRepository(TalkReactionEntity)
    private readonly reactionRepo: Repository<TalkReactionEntity>,
    @InjectRepository(TalkAttachmentEntity)
    private readonly attachmentRepo: Repository<TalkAttachmentEntity>,
    @InjectRepository(TalkMessageHideEntity)
    private readonly messageHideRepo: Repository<TalkMessageHideEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly translateService: MessageTranslateService,
    private readonly fileService: FileService,
    private readonly eventEmitter: EventEmitter2,
    private readonly pushService: PushService,
    private readonly notificationSseService: NotificationSseService,
  ) {}

  private async getUserName(userId: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { usrId: userId } });
    return user?.usrName || 'Unknown';
  }

  async getMessages(
    channelId: string,
    userId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<{ data: TalkMessageResponse[]; nextCursor: string | null }> {
    await this.assertMember(channelId, userId);

    const qb = this.messageRepo
      .createQueryBuilder('msg')
      .where('msg.chn_id = :channelId', { channelId })
      .andWhere('msg.msg_deleted_at IS NULL')
      .andWhere(
        `msg.msg_id NOT IN (SELECT h.msg_id FROM amb_talk_message_hides h WHERE h.usr_id = :hideUserId)`,
        { hideUserId: userId },
      )
      .orderBy('msg.msg_created_at', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const cursorMsg = await this.messageRepo.findOne({ where: { msgId: cursor } });
      if (cursorMsg) {
        qb.andWhere('msg.msg_created_at < :cursorDate', { cursorDate: cursorMsg.msgCreatedAt });
      }
    }

    const messages = await qb.getMany();

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const extra = messages.pop();
      nextCursor = extra!.msgId;
    }

    const userCache = new Map<string, string>();
    const msgIds = messages.map((m) => m.msgId);

    const [reactionMap, readCountMap, parentMap, attachmentMap, mentionMap, replyCountMap] = await Promise.all([
      this.buildReactionMap(msgIds, userId),
      this.buildReadCountMap(messages, channelId),
      this.buildParentMap(messages),
      this.buildAttachmentMap(msgIds),
      this.buildMentionMap(messages),
      this.buildReplyCountMap(msgIds),
    ]);

    const results: TalkMessageResponse[] = [];
    for (const msg of messages) {
      let senderName = userCache.get(msg.usrId);
      if (!senderName) {
        senderName = await this.getUserName(msg.usrId);
        userCache.set(msg.usrId, senderName);
      }
      let pinnedByName: string | null = null;
      if (msg.msgIsPinned && msg.msgPinnedBy) {
        pinnedByName = userCache.get(msg.msgPinnedBy) ?? null;
        if (!pinnedByName) {
          pinnedByName = await this.getUserName(msg.msgPinnedBy);
          userCache.set(msg.msgPinnedBy, pinnedByName);
        }
      }
      results.push(
        MessageMapper.toMessageResponse(
          msg,
          senderName,
          reactionMap.get(msg.msgId),
          readCountMap.get(msg.msgId),
          parentMap.get(msg.msgParentId ?? ''),
          attachmentMap.get(msg.msgId),
          mentionMap.get(msg.msgId),
          pinnedByName,
          replyCountMap.get(msg.msgId),
        ),
      );
    }

    return { data: results, nextCursor };
  }

  async sendMessage(
    channelId: string,
    dto: SendMessageRequest,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<TalkMessageResponse> {
    await this.assertMember(channelId, userId);

    const hasFiles = files && files.length > 0;
    let finalContent = dto.content || '';

    if (dto.translate_to && finalContent) {
      try {
        const result = await this.translateService.translateInline(
          finalContent,
          dto.translate_to,
          userId,
        );
        const langLabel = LANG_LABELS[dto.translate_to] || dto.translate_to;
        finalContent = `${finalContent}\n---\n[${langLabel}] ${result.translatedContent}`;
      } catch (error) {
        this.logger.warn(`Simultaneous translation failed, sending original: ${error}`);
      }
    }

    const message = this.messageRepo.create({
      chnId: channelId,
      usrId: userId,
      msgContent: finalContent,
      msgType: hasFiles ? 'FILE' : (dto.type || 'TEXT'),
      msgParentId: dto.parent_id || null,
    });
    const saved = await this.messageRepo.save(message);

    // 파일 첨부 저장
    let savedAttachments: TalkAttachmentEntity[] = [];
    if (hasFiles) {
      for (const file of files) {
        const fileInfo = await this.fileService.saveFile(file);
        const attachment = this.attachmentRepo.create({
          msgId: saved.msgId,
          tatOriginalName: fileInfo.originalName,
          tatStoredName: fileInfo.storedName,
          tatFileSize: fileInfo.fileSize,
          tatMimeType: fileInfo.mimeType,
        });
        savedAttachments.push(await this.attachmentRepo.save(attachment));
      }
    }

    const senderName = await this.getUserName(userId);

    // parentMessage 조회
    const parentMap = await this.buildParentMap([saved]);

    const response = MessageMapper.toMessageResponse(
      saved,
      senderName,
      [],
      0,
      parentMap.get(saved.msgParentId ?? ''),
      savedAttachments,
    );

    if (dto.translate_to) {
      this.emitKmsEvent(channelId, finalContent, userId);
    }

    // Update sender's read status (sending = reading the channel)
    this.updateSenderReadStatus(channelId, userId, saved).catch(() => {});

    // Push notification to channel members (except sender)
    this.sendMessagePush(channelId, userId, senderName, finalContent, dto.mention_user_ids).catch(() => {});

    return response;
  }

  private async updateSenderReadStatus(
    channelId: string,
    userId: string,
    message: TalkMessageEntity,
  ): Promise<void> {
    let readStatus = await this.readStatusRepo.findOne({
      where: { chnId: channelId, usrId: userId },
    });
    if (readStatus) {
      readStatus.trsLastReadAt = message.msgCreatedAt;
      readStatus.trsLastMsgId = message.msgId;
    } else {
      readStatus = this.readStatusRepo.create({
        chnId: channelId,
        usrId: userId,
        trsLastReadAt: message.msgCreatedAt,
        trsLastMsgId: message.msgId,
      });
    }
    await this.readStatusRepo.save(readStatus);
  }

  private async sendMessagePush(
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
    mentionUserIds?: string[],
  ): Promise<void> {
    try {
      const [members, channel] = await Promise.all([
        this.memberRepo.find({ where: { chnId: channelId, chmLeftAt: IsNull() } }),
        this.channelRepo.findOne({ where: { chnId: channelId } }),
      ]);
      const mentionSet = new Set(mentionUserIds || []);

      // <@all> 포함 시 → 채널 전체 활성 멤버를 mentionSet에 추가
      if (content.includes('<@all>')) {
        for (const m of members) {
          if (m.usrId !== senderId) mentionSet.add(m.usrId);
        }
      }

      // 뮤트된 사용자 필터링 (멘션된 경우 뮤트 무시)
      const recipientIds = members
        .filter((m) => m.usrId !== senderId && (!m.chmMuted || mentionSet.has(m.usrId)))
        .map((m) => m.usrId);
      if (recipientIds.length === 0) return;

      // 그룹 채널 여부 판별 (PUBLIC/PRIVATE = 그룹, DIRECT = DM)
      const isGroupChannel = channel && channel.chnType !== 'DIRECT';
      const channelName = channel?.chnName || 'Chat';

      // 멘션 코드(<@UUID>)를 사용자명으로 변환
      const resolvedContent = await this.resolveMentionsToText(content);
      const preview = resolvedContent.length > 80 ? resolvedContent.substring(0, 80) + '...' : resolvedContent;

      // SSE 실시간 알림 발행 (화면 중앙 모달)
      for (const recipientId of recipientIds) {
        const isMentioned = mentionSet.has(recipientId);
        let ntfTitle: string;
        let ntfMessage: string;

        if (isGroupChannel) {
          ntfTitle = channelName;
          ntfMessage = isMentioned
            ? `${senderName} mentioned you: ${preview}`
            : `${senderName}: ${preview}`;
        } else {
          ntfTitle = isMentioned ? `${senderName} mentioned you` : senderName;
          ntfMessage = preview;
        }

        this.notificationSseService.emit(recipientId, {
          ntfId: `talk-${channelId}-${Date.now()}`,
          ntfType: isMentioned ? 'TALK_MENTION' : 'TALK_MESSAGE',
          ntfTitle,
          ntfMessage,
          ntfRecipientId: recipientId,
          ntfSenderId: senderId,
          senderName,
          ntfResourceType: 'TALK',
          ntfResourceId: channelId,
          ntfIsRead: false,
          ntfReadAt: null,
          entId: '',
          ntfCreatedAt: new Date().toISOString(),
        });
      }

      // Web Push 알림 (브라우저/모바일)
      const pushTitle = isGroupChannel ? channelName : senderName;
      const pushBody = isGroupChannel ? `${senderName}: ${preview}` : preview;
      await this.pushService.sendPushToMany(recipientIds, {
        title: pushTitle,
        body: pushBody,
        data: { url: '/amoeba-talk' },
        tag: `talk-${channelId}`,
      });
    } catch (err) {
      this.logger.warn(`Talk push failed: ${err.message}`);
    }
  }

  private emitKmsEvent(channelId: string, content: string, userId: string): void {
    this.channelRepo.findOne({ where: { chnId: channelId } }).then((channel) => {
      this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
        module: 'talk',
        type: 'NOTE',
        refId: channelId,
        title: `[Talk] ${channel?.chnName || 'Channel Message'}`,
        content,
        ownerId: userId,
        visibility: channel?.chnType === 'PUBLIC' ? 'ENTITY' : 'CELL',
      } as ModuleDataEvent);
    }).catch((err) => {
      this.logger.warn(`KMS event emit failed: ${err.message}`);
    });
  }

  async updateMessage(
    messageId: string,
    dto: UpdateMessageRequest,
    userId: string,
  ): Promise<TalkMessageResponse> {
    const message = await this.messageRepo.findOne({
      where: { msgId: messageId, msgDeletedAt: IsNull() },
    });
    if (!message) {
      throw new NotFoundException(ERROR_CODE.TALK_MESSAGE_NOT_FOUND.message);
    }
    if (message.usrId !== userId) {
      throw new ForbiddenException(ERROR_CODE.TALK_MESSAGE_ACCESS_DENIED.message);
    }

    message.msgContent = dto.content;
    const saved = await this.messageRepo.save(message);

    const senderName = await this.getUserName(userId);
    return MessageMapper.toMessageResponse(saved, senderName);
  }

  async searchMessages(
    channelId: string,
    userId: string,
    query: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ data: TalkMessageResponse[]; nextCursor: string | null; totalCount: number }> {
    await this.assertMember(channelId, userId);

    const escapedQuery = query.replace(/[%_]/g, (m) => `\\${m}`);

    const countQb = this.messageRepo
      .createQueryBuilder('msg')
      .where('msg.chn_id = :channelId', { channelId })
      .andWhere('msg.msg_deleted_at IS NULL')
      .andWhere('msg.msg_content ILIKE :pattern', { pattern: `%${escapedQuery}%` });

    const totalCount = await countQb.getCount();

    const qb = this.messageRepo
      .createQueryBuilder('msg')
      .where('msg.chn_id = :channelId', { channelId })
      .andWhere('msg.msg_deleted_at IS NULL')
      .andWhere('msg.msg_content ILIKE :pattern', { pattern: `%${escapedQuery}%` })
      .orderBy('msg.msg_created_at', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const cursorMsg = await this.messageRepo.findOne({ where: { msgId: cursor } });
      if (cursorMsg) {
        qb.andWhere('msg.msg_created_at < :cursorDate', { cursorDate: cursorMsg.msgCreatedAt });
      }
    }

    const messages = await qb.getMany();

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const extra = messages.pop();
      nextCursor = extra!.msgId;
    }

    const userCache = new Map<string, string>();
    const results: TalkMessageResponse[] = [];

    for (const msg of messages) {
      let senderName = userCache.get(msg.usrId);
      if (!senderName) {
        senderName = await this.getUserName(msg.usrId);
        userCache.set(msg.usrId, senderName);
      }
      results.push(MessageMapper.toMessageResponse(msg, senderName));
    }

    return { data: results, nextCursor, totalCount };
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { msgId: messageId, msgDeletedAt: IsNull() },
    });
    if (!message) {
      throw new NotFoundException(ERROR_CODE.TALK_MESSAGE_NOT_FOUND.message);
    }
    if (message.usrId !== userId) {
      throw new ForbiddenException(ERROR_CODE.TALK_MESSAGE_ACCESS_DENIED.message);
    }

    // 1시간 이내에만 삭제 가능
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - message.msgCreatedAt.getTime() > oneHour) {
      throw new BadRequestException(ERROR_CODE.TALK_DELETE_TIME_EXPIRED.message);
    }

    await this.messageRepo.softRemove(message);
  }

  async hideMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepo.findOne({
      where: { msgId: messageId, msgDeletedAt: IsNull() },
    });
    if (!message) {
      throw new NotFoundException(ERROR_CODE.TALK_MESSAGE_NOT_FOUND.message);
    }

    const existing = await this.messageHideRepo.findOne({
      where: { msgId: messageId, usrId: userId },
    });
    if (!existing) {
      await this.messageHideRepo.save(
        this.messageHideRepo.create({ msgId: messageId, usrId: userId }),
      );
    }
  }

  async toggleMessagePin(
    channelId: string,
    messageId: string,
    userId: string,
  ): Promise<TalkMessageResponse> {
    await this.assertMember(channelId, userId);

    const message = await this.messageRepo.findOne({
      where: { msgId: messageId, chnId: channelId, msgDeletedAt: IsNull() },
    });
    if (!message) {
      throw new NotFoundException(ERROR_CODE.TALK_MESSAGE_NOT_FOUND.message);
    }

    if (message.msgIsPinned) {
      message.msgIsPinned = false;
      message.msgPinnedAt = null;
      message.msgPinnedBy = null;
    } else {
      message.msgIsPinned = true;
      message.msgPinnedAt = new Date();
      message.msgPinnedBy = userId;
    }
    const saved = await this.messageRepo.save(message);
    const senderName = await this.getUserName(saved.usrId);
    const pinnedByName = saved.msgPinnedBy ? await this.getUserName(saved.msgPinnedBy) : null;
    return MessageMapper.toMessageResponse(saved, senderName, undefined, undefined, undefined, undefined, undefined, pinnedByName);
  }

  async getPinnedMessages(channelId: string, userId: string): Promise<TalkMessageResponse[]> {
    await this.assertMember(channelId, userId);

    const messages = await this.messageRepo.find({
      where: { chnId: channelId, msgIsPinned: true, msgDeletedAt: IsNull() },
      order: { msgPinnedAt: 'DESC' },
    });

    const userCache = new Map<string, string>();
    const results: TalkMessageResponse[] = [];
    for (const msg of messages) {
      let senderName = userCache.get(msg.usrId);
      if (!senderName) {
        senderName = await this.getUserName(msg.usrId);
        userCache.set(msg.usrId, senderName);
      }
      let pinnedByName: string | null = null;
      if (msg.msgPinnedBy) {
        pinnedByName = userCache.get(msg.msgPinnedBy) ?? null;
        if (!pinnedByName) {
          pinnedByName = await this.getUserName(msg.msgPinnedBy);
          userCache.set(msg.msgPinnedBy, pinnedByName);
        }
      }
      results.push(MessageMapper.toMessageResponse(msg, senderName, undefined, undefined, undefined, undefined, undefined, pinnedByName));
    }
    return results;
  }

  async toggleReaction(
    messageId: string,
    reactionType: string,
    userId: string,
  ): Promise<TalkReactionSummary[]> {
    const existing = await this.reactionRepo.findOne({
      where: { msgId: messageId, usrId: userId, reaType: reactionType },
    });

    if (existing) {
      await this.reactionRepo.remove(existing);
    } else {
      await this.reactionRepo.save(
        this.reactionRepo.create({ msgId: messageId, usrId: userId, reaType: reactionType }),
      );
    }

    return this.getReactionSummary(messageId, userId);
  }

  async getReactionSummary(messageId: string, userId: string): Promise<TalkReactionSummary[]> {
    const reactions = await this.reactionRepo.find({ where: { msgId: messageId } });
    const types = ['LIKE', 'CHECK', 'PRAY', 'GRIN', 'LOVE'] as const;
    return types
      .map((type) => {
        const filtered = reactions.filter((r) => r.reaType === type);
        return { type, count: filtered.length, reacted: filtered.some((r) => r.usrId === userId) };
      })
      .filter((s) => s.count > 0);
  }

  async getMessageReaders(
    channelId: string,
    messageId: string,
    userId: string,
  ): Promise<{
    readers: { userId: string; userName: string; readAt: string }[];
    nonReaders: { userId: string; userName: string }[];
  }> {
    await this.assertMember(channelId, userId);

    const message = await this.messageRepo.findOne({
      where: { msgId: messageId, chnId: channelId, msgDeletedAt: IsNull() },
    });
    if (!message) {
      throw new NotFoundException(ERROR_CODE.TALK_MESSAGE_NOT_FOUND.message);
    }

    // 채널 활성 멤버 (발신자 제외)
    const members = await this.memberRepo.find({
      where: { chnId: channelId, chmLeftAt: IsNull() },
    });
    const otherMembers = members.filter((m) => m.usrId !== message.usrId);

    // 읽음 상태
    const readStatuses = await this.readStatusRepo.find({ where: { chnId: channelId } });
    const readStatusMap = new Map(readStatuses.map((rs) => [rs.usrId, rs]));

    // 사용자 이름 일괄 조회
    const userIds = otherMembers.map((m) => m.usrId);
    const users = userIds.length > 0
      ? await this.userRepo.find({ where: { usrId: In(userIds) } })
      : [];
    const userNameMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    const readers: { userId: string; userName: string; readAt: string }[] = [];
    const nonReaders: { userId: string; userName: string }[] = [];

    for (const member of otherMembers) {
      const rs = readStatusMap.get(member.usrId);
      const userName = userNameMap.get(member.usrId) || 'Unknown';
      if (rs && rs.trsLastReadAt >= message.msgCreatedAt) {
        readers.push({ userId: member.usrId, userName, readAt: rs.trsLastReadAt.toISOString() });
      } else {
        nonReaders.push({ userId: member.usrId, userName });
      }
    }

    return { readers, nonReaders };
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async buildReactionMap(
    msgIds: string[],
    userId: string,
  ): Promise<Map<string, TalkReactionSummary[]>> {
    if (msgIds.length === 0) return new Map();

    const reactions = await this.reactionRepo.find({ where: { msgId: In(msgIds) } });
    const map = new Map<string, TalkReactionSummary[]>();

    for (const msgId of msgIds) {
      const msgReactions = reactions.filter((r) => r.msgId === msgId);
      const types = ['LIKE', 'CHECK', 'PRAY', 'GRIN', 'LOVE'] as const;
      const summaries = types
        .map((type) => {
          const filtered = msgReactions.filter((r) => r.reaType === type);
          return { type, count: filtered.length, reacted: filtered.some((r) => r.usrId === userId) };
        })
        .filter((s) => s.count > 0);
      if (summaries.length > 0) map.set(msgId, summaries);
    }

    return map;
  }

  private async buildReadCountMap(
    messages: TalkMessageEntity[],
    channelId: string,
  ): Promise<Map<string, number>> {
    if (messages.length === 0) return new Map();

    const readStatuses = await this.readStatusRepo.find({ where: { chnId: channelId } });
    const map = new Map<string, number>();

    for (const msg of messages) {
      const count = readStatuses.filter(
        (rs) => rs.usrId !== msg.usrId && rs.trsLastReadAt >= msg.msgCreatedAt,
      ).length;
      map.set(msg.msgId, count);
    }

    return map;
  }

  private async buildParentMap(
    messages: TalkMessageEntity[],
  ): Promise<Map<string, { id: string; senderName: string; content: string; isDeleted: boolean }>> {
    const parentIds = messages.map((m) => m.msgParentId).filter(Boolean) as string[];
    if (parentIds.length === 0) return new Map();

    const parents = await this.messageRepo
      .createQueryBuilder('msg')
      .where('msg.msg_id IN (:...ids)', { ids: parentIds })
      .withDeleted()
      .getMany();

    // Collect sender IDs + mentioned user IDs from parent content
    const mentionPattern = /<@([0-9a-f-]{36})>/g;
    const mentionedIds = new Set<string>();
    for (const p of parents) {
      let m: RegExpExecArray | null;
      while ((m = mentionPattern.exec(p.msgContent)) !== null) {
        mentionedIds.add(m[1]);
      }
    }
    const userIds = [...new Set([...parents.map((p) => p.usrId), ...mentionedIds])];
    const users = userIds.length > 0
      ? await this.userRepo.find({ where: { usrId: In(userIds) } })
      : [];
    const userNameMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    const map = new Map<string, { id: string; senderName: string; content: string; isDeleted: boolean }>();
    for (const parent of parents) {
      // Replace <@UUID> mentions with @UserName in parent content
      const resolvedContent = parent.msgContent.replace(
        /<@([0-9a-f-]{36})>/g,
        (_, uid) => `@${userNameMap.get(uid) || 'Unknown'}`,
      );
      map.set(parent.msgId, {
        id: parent.msgId,
        senderName: userNameMap.get(parent.usrId) || 'Unknown',
        content: resolvedContent.slice(0, 80),
        isDeleted: !!parent.msgDeletedAt,
      });
    }

    return map;
  }

  private async buildAttachmentMap(
    msgIds: string[],
  ): Promise<Map<string, TalkAttachmentEntity[]>> {
    if (msgIds.length === 0) return new Map();

    const attachments = await this.attachmentRepo.find({
      where: { msgId: In(msgIds) },
      order: { tatCreatedAt: 'ASC' },
    });

    const map = new Map<string, TalkAttachmentEntity[]>();
    for (const att of attachments) {
      if (!map.has(att.msgId)) map.set(att.msgId, []);
      map.get(att.msgId)!.push(att);
    }
    return map;
  }

  private async buildMentionMap(
    messages: TalkMessageEntity[],
  ): Promise<Map<string, { userId: string; userName: string }[]>> {
    const mentionRegex = /<@([0-9a-f-]{36})>/g;
    const allMentionIds = new Set<string>();
    const messagesWithAll = new Set<string>(); // <@all> 포함 메시지 추적

    for (const msg of messages) {
      let match: RegExpExecArray | null;
      while ((match = mentionRegex.exec(msg.msgContent)) !== null) {
        allMentionIds.add(match[1]);
      }
      if (msg.msgContent.includes('<@all>')) {
        messagesWithAll.add(msg.msgId);
      }
    }

    if (allMentionIds.size === 0 && messagesWithAll.size === 0) return new Map();

    const users = allMentionIds.size > 0
      ? await this.userRepo.find({ where: { usrId: In([...allMentionIds]) } })
      : [];
    const userNameMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    const map = new Map<string, { userId: string; userName: string }[]>();
    for (const msg of messages) {
      const mentions: { userId: string; userName: string }[] = [];

      // <@all> 처리
      if (messagesWithAll.has(msg.msgId)) {
        mentions.push({ userId: 'all', userName: 'all' });
      }

      let match: RegExpExecArray | null;
      const regex = /<@([0-9a-f-]{36})>/g;
      while ((match = regex.exec(msg.msgContent)) !== null) {
        const uid = match[1];
        const name = userNameMap.get(uid);
        if (name) mentions.push({ userId: uid, userName: name });
      }
      if (mentions.length > 0) map.set(msg.msgId, mentions);
    }

    return map;
  }

  private async buildReplyCountMap(msgIds: string[]): Promise<Map<string, number>> {
    if (msgIds.length === 0) return new Map();
    const raw: Array<{ parentId: string; cnt: string }> = await this.messageRepo.query(
      `SELECT msg_parent_id AS "parentId", COUNT(*)::int AS "cnt"
       FROM amb_talk_messages
       WHERE msg_parent_id = ANY($1) AND msg_deleted_at IS NULL
       GROUP BY msg_parent_id`,
      [msgIds],
    );
    const map = new Map<string, number>();
    for (const r of raw) {
      map.set(r.parentId, Number(r.cnt));
    }
    return map;
  }

  private async resolveMentionsToText(content: string): Promise<string> {
    // <@all> → @all 치환
    let resolved = content.replace(/<@all>/g, '@all');

    const mentionRegex = /<@([0-9a-f-]{36})>/g;
    const mentionIds = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(resolved)) !== null) {
      mentionIds.add(match[1]);
    }
    if (mentionIds.size === 0) return resolved;

    const users = await this.userRepo.find({ where: { usrId: In([...mentionIds]) } });
    const nameMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    return resolved.replace(/<@([0-9a-f-]{36})>/g, (_, uid) => {
      const name = nameMap.get(uid);
      return name ? `@${name}` : '@Unknown';
    });
  }

  private async assertMember(channelId: string, userId: string): Promise<void> {
    const membership = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: userId, chmLeftAt: IsNull() },
    });
    if (!membership) {
      throw new ForbiddenException(ERROR_CODE.CHANNEL_ACCESS_DENIED.message);
    }
  }
}
