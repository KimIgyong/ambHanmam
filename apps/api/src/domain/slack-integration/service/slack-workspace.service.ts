import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { SlackWorkspaceConfigEntity } from '../entity/slack-workspace-config.entity';
import { SlackChannelMappingEntity } from '../entity/slack-channel-mapping.entity';
import { SlackMessageMappingEntity } from '../entity/slack-message-mapping.entity';
import { TalkChannelEntity } from '../../amoeba-talk/entity/talk-channel.entity';
import { TalkChannelMemberEntity } from '../../amoeba-talk/entity/talk-channel-member.entity';
import { TalkMessageEntity } from '../../amoeba-talk/entity/talk-message.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { SlackApiService } from './slack-api.service';
import { CryptoService } from '../../settings/service/crypto.service';
import { CreateChannelMappingDto, UpdateChannelMappingDto } from '../dto/slack-channel-mapping.dto';

@Injectable()
export class SlackWorkspaceService {
  private readonly logger = new Logger(SlackWorkspaceService.name);

  private static readonly SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

  constructor(
    @InjectRepository(SlackWorkspaceConfigEntity)
    private readonly workspaceRepo: Repository<SlackWorkspaceConfigEntity>,
    @InjectRepository(SlackChannelMappingEntity)
    private readonly mappingRepo: Repository<SlackChannelMappingEntity>,
    @InjectRepository(SlackMessageMappingEntity)
    private readonly messageMappingRepo: Repository<SlackMessageMappingEntity>,
    @InjectRepository(TalkChannelEntity)
    private readonly talkChannelRepo: Repository<TalkChannelEntity>,
    @InjectRepository(TalkChannelMemberEntity)
    private readonly talkMemberRepo: Repository<TalkChannelMemberEntity>,
    @InjectRepository(TalkMessageEntity)
    private readonly talkMessageRepo: Repository<TalkMessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly slackApi: SlackApiService,
    private readonly cryptoService: CryptoService,
  ) {}

  // --- Workspace Management ---

  async getWorkspaces(entityId: string) {
    const workspaces = await this.workspaceRepo.find({
      where: { entId: entityId, swcDeletedAt: IsNull() },
      order: { swcCreatedAt: 'DESC' },
    });
    return workspaces.map((ws) => ({
      id: ws.swcId,
      teamId: ws.swcTeamId,
      teamName: ws.swcTeamName,
      isActive: ws.swcIsActive,
      connectedAt: ws.swcConnectedAt,
      appId: ws.swcAppId,
    }));
  }

  async connectWithBotToken(
    entityId: string,
    botToken: string,
    userId: string,
  ): Promise<{ id: string; teamId: string; teamName: string; isActive: boolean; connectedAt: Date }> {
    // Verify token with Slack API
    const authResult = await this.slackApi.authTest(botToken);
    if (!authResult.ok) {
      throw new Error(`Invalid Bot Token: ${authResult.error || 'auth.test failed'}`);
    }

    // Check duplicate
    const existing = await this.workspaceRepo.findOne({
      where: { entId: entityId, swcTeamId: authResult.teamId!, swcDeletedAt: IsNull() },
    });

    const tokenEnc = this.cryptoService.encrypt(botToken);
    const now = new Date();

    if (existing) {
      existing.swcBotTokenEnc = tokenEnc.encrypted;
      existing.swcBotTokenIv = tokenEnc.iv;
      existing.swcBotTokenTag = tokenEnc.tag;
      existing.swcBotUserId = authResult.botUserId || '';
      existing.swcTeamName = authResult.teamName || existing.swcTeamName;
      existing.swcIsActive = true;
      existing.swcConnectedAt = now;
      existing.swcConnectedBy = userId;
      const saved = await this.workspaceRepo.save(existing);
      this.logger.log(`Workspace reconnected via Bot Token: ${saved.swcTeamName}`);
      return { id: saved.swcId, teamId: saved.swcTeamId, teamName: saved.swcTeamName, isActive: true, connectedAt: now };
    }

    // Signing secret placeholder (not available in direct token mode)
    const placeholderEnc = this.cryptoService.encrypt('N/A');

    const ws = await this.workspaceRepo.save({
      entId: entityId,
      swcTeamId: authResult.teamId!,
      swcTeamName: authResult.teamName || 'Unknown',
      swcBotTokenEnc: tokenEnc.encrypted,
      swcBotTokenIv: tokenEnc.iv,
      swcBotTokenTag: tokenEnc.tag,
      swcBotUserId: authResult.botUserId || '',
      swcAppId: authResult.appId || null,
      swcSigningSecretEnc: placeholderEnc.encrypted,
      swcSigningSecretIv: placeholderEnc.iv,
      swcSigningSecretTag: placeholderEnc.tag,
      swcIsActive: true,
      swcConnectedAt: now,
      swcConnectedBy: userId,
    });

    this.logger.log(`Workspace connected via Bot Token: ${ws.swcTeamName} (${ws.swcTeamId})`);
    return { id: ws.swcId, teamId: ws.swcTeamId, teamName: ws.swcTeamName, isActive: true, connectedAt: now };
  }

  async disconnectWorkspace(entityId: string, workspaceId: string): Promise<void> {
    const ws = await this.workspaceRepo.findOne({
      where: { swcId: workspaceId, entId: entityId, swcDeletedAt: IsNull() },
    });
    if (!ws) throw new NotFoundException('Workspace not found');

    // Soft-delete all channel mappings for this workspace
    await this.mappingRepo.softDelete({ swcId: workspaceId });

    // Soft-delete the workspace
    await this.workspaceRepo.softDelete(workspaceId);
    this.logger.log(`Workspace disconnected: ${ws.swcTeamName} (${ws.swcTeamId})`);
  }

  async getSlackChannels(entityId: string, workspaceId: string) {
    const ws = await this.getWorkspaceOrFail(entityId, workspaceId);
    const botToken = this.decryptBotToken(ws);
    const channels = await this.slackApi.listConversations(botToken);
    return channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      isPrivate: ch.is_private,
      memberCount: ch.num_members,
    }));
  }

  // --- Channel Mapping Management ---

  async getMappings(entityId: string) {
    const mappings = await this.mappingRepo.find({
      where: { entId: entityId, scmDeletedAt: IsNull() },
      relations: ['workspace'],
      order: { scmCreatedAt: 'DESC' },
    });

    // AMA 채널 이름 조회
    const amaChannelIds = mappings.map((m) => m.chnId).filter(Boolean);
    const amaChannels = amaChannelIds.length
      ? await this.talkChannelRepo.find({ where: { chnId: In(amaChannelIds) } })
      : [];
    const channelNameMap = new Map(amaChannels.map((c) => [c.chnId, c.chnName]));

    return mappings.map((m) => ({
      id: m.scmId,
      workspaceId: m.swcId,
      workspaceName: m.workspace?.swcTeamName || '',
      slackChannelId: m.scmSlackChannelId,
      slackChannelName: m.scmSlackChannelName,
      amaChannelId: m.chnId,
      amaChannelName: channelNameMap.get(m.chnId) || '',
      status: m.scmStatus,
      direction: m.scmDirection,
      createdAt: m.scmCreatedAt,
    }));
  }

  async createMapping(entityId: string, dto: CreateChannelMappingDto) {
    const ws = await this.getWorkspaceOrFail(entityId, dto.swc_id);

    // Check duplicate mapping
    const existing = await this.mappingRepo.findOne({
      where: {
        swcId: dto.swc_id,
        scmSlackChannelId: dto.slack_channel_id,
        scmDeletedAt: IsNull(),
      },
    });
    if (existing) {
      throw new Error('This Slack channel is already mapped');
    }

    // Validate Slack channel exists
    const botToken = this.decryptBotToken(ws);
    let channelName = dto.slack_channel_name || '';
    try {
      const channelInfo = await this.slackApi.conversationsInfo(botToken, dto.slack_channel_id);
      channelName = channelInfo?.name || channelName;
    } catch {
      this.logger.warn(`Could not fetch channel info for ${dto.slack_channel_id}`);
    }

    // Join the channel
    try {
      await this.slackApi.conversationsJoin(botToken, dto.slack_channel_id);
    } catch {
      this.logger.warn(`Bot could not join channel ${dto.slack_channel_id}`);
    }

    // Determine AMA channel ID
    const amaChannelId = dto.ama_channel_id;
    if (!amaChannelId) {
      throw new Error('AMA channel ID is required');
    }

    // Save mapping
    const mapping = this.mappingRepo.create({
      swcId: dto.swc_id,
      entId: entityId,
      scmSlackChannelId: dto.slack_channel_id,
      scmSlackChannelName: channelName,
      chnId: amaChannelId,
      scmStatus: 'ACTIVE',
      scmDirection: dto.direction || 'BIDIRECTIONAL',
    });

    const saved = await this.mappingRepo.save(mapping);
    return {
      id: saved.scmId,
      slackChannelId: saved.scmSlackChannelId,
      slackChannelName: saved.scmSlackChannelName,
      amaChannelId: saved.chnId,
      status: saved.scmStatus,
      direction: saved.scmDirection,
    };
  }

  async updateMapping(entityId: string, mappingId: string, dto: UpdateChannelMappingDto) {
    const mapping = await this.mappingRepo.findOne({
      where: { scmId: mappingId, entId: entityId, scmDeletedAt: IsNull() },
    });
    if (!mapping) throw new NotFoundException('Channel mapping not found');

    if (dto.status) mapping.scmStatus = dto.status;
    if (dto.direction) mapping.scmDirection = dto.direction;

    const saved = await this.mappingRepo.save(mapping);
    return {
      id: saved.scmId,
      status: saved.scmStatus,
      direction: saved.scmDirection,
    };
  }

  async deleteMapping(entityId: string, mappingId: string): Promise<void> {
    const mapping = await this.mappingRepo.findOne({
      where: { scmId: mappingId, entId: entityId, scmDeletedAt: IsNull() },
    });
    if (!mapping) throw new NotFoundException('Channel mapping not found');

    await this.mappingRepo.softDelete(mappingId);
  }

  // --- Conversation History ---

  async getChannelHistory(
    entityId: string,
    workspaceId: string,
    slackChannelId: string,
    options?: { limit?: number; cursor?: string; latest?: string; oldest?: string },
  ) {
    const ws = await this.getWorkspaceOrFail(entityId, workspaceId);
    const botToken = this.decryptBotToken(ws);

    const result = await this.slackApi.conversationsHistory(botToken, {
      channel: slackChannelId,
      limit: options?.limit,
      cursor: options?.cursor,
      latest: options?.latest,
      oldest: options?.oldest,
    });

    // Resolve user display names
    const userCache = new Map<string, string>();
    const messages = await Promise.all(
      result.messages.map(async (msg) => {
        let userName = 'Unknown';
        if (msg.user) {
          if (userCache.has(msg.user)) {
            userName = userCache.get(msg.user)!;
          } else {
            userName = await this.slackApi.getUserDisplayName(botToken, msg.user);
            userCache.set(msg.user, userName);
          }
        }
        return {
          ts: msg.ts,
          threadTs: msg.thread_ts || null,
          user: msg.user || null,
          userName,
          text: msg.text || '',
          replyCount: msg.reply_count || 0,
          subtype: msg.subtype || null,
        };
      }),
    );

    return {
      messages,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  async getThreadReplies(
    entityId: string,
    workspaceId: string,
    slackChannelId: string,
    threadTs: string,
    options?: { limit?: number; cursor?: string },
  ) {
    const ws = await this.getWorkspaceOrFail(entityId, workspaceId);
    const botToken = this.decryptBotToken(ws);

    const result = await this.slackApi.conversationsReplies(botToken, {
      channel: slackChannelId,
      ts: threadTs,
      limit: options?.limit,
      cursor: options?.cursor,
    });

    const userCache = new Map<string, string>();
    const messages = await Promise.all(
      result.messages.map(async (msg) => {
        let userName = 'Unknown';
        if (msg.user) {
          if (userCache.has(msg.user)) {
            userName = userCache.get(msg.user)!;
          } else {
            userName = await this.slackApi.getUserDisplayName(botToken, msg.user);
            userCache.set(msg.user, userName);
          }
        }
        return {
          ts: msg.ts,
          threadTs: msg.thread_ts || null,
          user: msg.user || null,
          userName,
          text: msg.text || '',
          subtype: msg.subtype || null,
        };
      }),
    );

    return {
      messages,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  // --- Import History ---

  async importChannelHistory(
    entityId: string,
    mappingId: string,
    options?: { oldest?: string; latest?: string; limit?: number },
  ): Promise<{ total: number; imported: number; skipped: number; failed: number }> {
    const mapping = await this.mappingRepo.findOne({
      where: { scmId: mappingId, entId: entityId, scmDeletedAt: IsNull() },
      relations: ['workspace'],
    });
    if (!mapping) throw new NotFoundException('Channel mapping not found');
    if (!mapping.workspace) throw new NotFoundException('Workspace not found');

    const botToken = this.decryptBotToken(mapping.workspace);
    const maxMessages = Math.min(options?.limit || 500, 1000);
    const userCache = new Map<string, string>();

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let total = 0;
    let cursor: string | undefined;

    // Phase 1: Fetch all top-level messages (oldest first)
    const allMessages: any[] = [];
    do {
      const result = await this.slackApi.conversationsHistory(botToken, {
        channel: mapping.scmSlackChannelId,
        oldest: options?.oldest,
        latest: options?.latest,
        limit: Math.min(200, maxMessages - allMessages.length),
        cursor,
      });
      allMessages.push(...result.messages);
      cursor = result.hasMore ? result.nextCursor : undefined;
    } while (cursor && allMessages.length < maxMessages);

    // Reverse to chronological order (Slack returns newest first)
    allMessages.reverse();
    total = allMessages.length;

    // Phase 2: Import top-level messages
    for (const msg of allMessages) {
      if (msg.subtype === 'channel_join' || msg.subtype === 'channel_leave') {
        skipped++;
        continue;
      }

      try {
        // Duplicate check
        const existing = await this.messageMappingRepo.findOne({
          where: { scmId: mapping.scmId, smmSlackTs: msg.ts },
        });
        if (existing) {
          skipped++;
          continue;
        }

        // Resolve user name
        const userName = msg.user
          ? await this.resolveUserName(botToken, msg.user, userCache)
          : 'Unknown';

        // Save to AMA
        const content = `[Slack] ${userName}: ${msg.text || ''}`;
        const talkMsg = this.talkMessageRepo.create({
          chnId: mapping.chnId,
          usrId: SlackWorkspaceService.SYSTEM_USER_ID,
          msgContent: content,
          msgType: 'TEXT',
        });
        const saved = await this.talkMessageRepo.save(talkMsg);

        // Save mapping
        await this.messageMappingRepo.save({
          scmId: mapping.scmId,
          smmSlackTs: msg.ts,
          smmSlackThreadTs: null,
          msgId: saved.msgId,
          smmDirection: 'INBOUND',
        });

        imported++;

        // Phase 3: Import thread replies if any
        if (msg.reply_count && msg.reply_count > 0) {
          const threadResult = await this.importThreadReplies(
            botToken, mapping, msg.ts, saved.msgId, userCache,
          );
          total += threadResult.total;
          imported += threadResult.imported;
          skipped += threadResult.skipped;
          failed += threadResult.failed;
        }
      } catch (e) {
        this.logger.error(`Failed to import message ${msg.ts}: ${e.message}`);
        failed++;
      }
    }

    this.logger.log(`Import complete for mapping ${mappingId}: total=${total}, imported=${imported}, skipped=${skipped}, failed=${failed}`);
    return { total, imported, skipped, failed };
  }

  private async importThreadReplies(
    botToken: string,
    mapping: SlackChannelMappingEntity,
    threadTs: string,
    parentMsgId: string,
    userCache: Map<string, string>,
  ): Promise<{ total: number; imported: number; skipped: number; failed: number }> {
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    const result = await this.slackApi.conversationsReplies(botToken, {
      channel: mapping.scmSlackChannelId,
      ts: threadTs,
      limit: 200,
    });

    // Skip first message (parent, already imported)
    const replies = result.messages.slice(1);

    for (const reply of replies) {
      try {
        const existing = await this.messageMappingRepo.findOne({
          where: { scmId: mapping.scmId, smmSlackTs: reply.ts },
        });
        if (existing) {
          skipped++;
          continue;
        }

        const userName = reply.user
          ? await this.resolveUserName(botToken, reply.user, userCache)
          : 'Unknown';

        const content = `[Slack] ${userName}: ${reply.text || ''}`;
        const talkMsg = this.talkMessageRepo.create({
          chnId: mapping.chnId,
          usrId: SlackWorkspaceService.SYSTEM_USER_ID,
          msgContent: content,
          msgType: 'TEXT',
          msgParentId: parentMsgId,
        });
        const saved = await this.talkMessageRepo.save(talkMsg);

        await this.messageMappingRepo.save({
          scmId: mapping.scmId,
          smmSlackTs: reply.ts,
          smmSlackThreadTs: threadTs,
          msgId: saved.msgId,
          smmDirection: 'INBOUND',
        });

        imported++;
      } catch (e) {
        this.logger.error(`Failed to import thread reply ${reply.ts}: ${e.message}`);
        failed++;
      }
    }

    return { total: replies.length, imported, skipped, failed };
  }

  private async resolveUserName(
    botToken: string,
    userId: string,
    cache: Map<string, string>,
  ): Promise<string> {
    if (cache.has(userId)) return cache.get(userId)!;
    const name = await this.slackApi.getUserDisplayName(botToken, userId);
    cache.set(userId, name);
    return name;
  }

  // --- Channel Member Sync ---

  async syncChannelMembers(
    entityId: string,
    mappingId: string,
  ): Promise<{
    slackMembers: number;
    matched: number;
    added: number;
    alreadyMember: number;
    unmatched: Array<{ slackUserId: string; displayName: string; email: string | null }>;
  }> {
    const mapping = await this.mappingRepo.findOne({
      where: { scmId: mappingId, entId: entityId, scmDeletedAt: IsNull() },
      relations: ['workspace'],
    });
    if (!mapping) throw new NotFoundException('Channel mapping not found');
    if (!mapping.workspace) throw new NotFoundException('Workspace not found');

    const botToken = this.decryptBotToken(mapping.workspace);
    const amaChannelId = mapping.chnId;

    // 1. Slack 채널 멤버 목록 가져오기
    const { memberIds: slackMemberIds } = await this.slackApi.getChannelMembers(
      botToken,
      mapping.scmSlackChannelId,
    );

    // 봇 사용자 제외
    const botUserId = mapping.workspace.swcBotUserId;
    const filteredSlackIds = slackMemberIds.filter((id) => id !== botUserId);

    // 2. Slack 사용자 프로필(이메일) 일괄 조회
    const slackProfiles: Array<{
      slackUserId: string;
      email: string | null;
      displayName: string;
      isBot: boolean;
    }> = [];

    for (const slackUserId of filteredSlackIds) {
      try {
        const userInfo = await this.slackApi.getUserInfo(botToken, slackUserId);
        slackProfiles.push({
          slackUserId,
          email: userInfo?.profile?.email || null,
          displayName:
            userInfo?.profile?.display_name ||
            userInfo?.real_name ||
            userInfo?.name ||
            'Unknown',
          isBot: userInfo?.is_bot || false,
        });
      } catch {
        slackProfiles.push({ slackUserId, email: null, displayName: 'Unknown', isBot: false });
      }
    }

    // 봇 계정 제외
    const humanProfiles = slackProfiles.filter((p) => !p.isBot);

    // 3. 이메일로 AMA 사용자 매칭
    const emailsToMatch = humanProfiles
      .map((p) => p.email)
      .filter((e): e is string => !!e);

    const matchedUsers =
      emailsToMatch.length > 0
        ? await this.userRepo.find({
            where: { usrEmail: In(emailsToMatch), usrStatus: 'ACTIVE' },
          })
        : [];
    const emailToUserMap = new Map(matchedUsers.map((u) => [u.usrEmail.toLowerCase(), u]));

    // 4. 현재 AMA 채널 멤버 조회
    const currentMembers = await this.talkMemberRepo.find({
      where: { chnId: amaChannelId, chmLeftAt: IsNull() },
    });
    const currentMemberIds = new Set(currentMembers.map((m) => m.usrId));

    // 5. 매칭된 사용자를 AMA 채널에 추가
    let added = 0;
    let alreadyMember = 0;
    const unmatched: Array<{ slackUserId: string; displayName: string; email: string | null }> = [];

    for (const profile of humanProfiles) {
      const amaUser = profile.email
        ? emailToUserMap.get(profile.email.toLowerCase())
        : undefined;

      if (!amaUser) {
        unmatched.push({
          slackUserId: profile.slackUserId,
          displayName: profile.displayName,
          email: profile.email,
        });
        continue;
      }

      if (currentMemberIds.has(amaUser.usrId)) {
        alreadyMember++;
        continue;
      }

      // 채널에 멤버 추가
      const member = this.talkMemberRepo.create({
        chnId: amaChannelId,
        usrId: amaUser.usrId,
        chmRole: 'MEMBER',
      });
      await this.talkMemberRepo.save(member);
      added++;
    }

    this.logger.log(
      `Member sync for mapping ${mappingId}: slack=${humanProfiles.length}, matched=${humanProfiles.length - unmatched.length}, added=${added}, alreadyMember=${alreadyMember}, unmatched=${unmatched.length}`,
    );

    return {
      slackMembers: humanProfiles.length,
      matched: humanProfiles.length - unmatched.length,
      added,
      alreadyMember,
      unmatched,
    };
  }

  // --- Helpers ---

  private async getWorkspaceOrFail(entityId: string, workspaceId: string): Promise<SlackWorkspaceConfigEntity> {
    const ws = await this.workspaceRepo.findOne({
      where: { swcId: workspaceId, entId: entityId, swcDeletedAt: IsNull() },
    });
    if (!ws) throw new NotFoundException('Workspace not found');
    return ws;
  }

  decryptBotToken(ws: SlackWorkspaceConfigEntity): string {
    return this.cryptoService.decrypt(ws.swcBotTokenEnc, ws.swcBotTokenIv, ws.swcBotTokenTag);
  }

  decryptSigningSecret(ws: SlackWorkspaceConfigEntity): string {
    return this.cryptoService.decrypt(ws.swcSigningSecretEnc, ws.swcSigningSecretIv, ws.swcSigningSecretTag);
  }
}
