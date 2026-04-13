import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { SlackWorkspaceConfigEntity } from '../entity/slack-workspace-config.entity';
import { SlackChannelMappingEntity } from '../entity/slack-channel-mapping.entity';
import { SlackMessageMappingEntity } from '../entity/slack-message-mapping.entity';
import { TalkMessageEntity } from '../../amoeba-talk/entity/talk-message.entity';
import { TalkSseService } from '../../amoeba-talk/service/talk-sse.service';
import { SlackApiService } from './slack-api.service';
import { SlackWorkspaceService } from './slack-workspace.service';
import { SlackEventPayload, SlackMessageEvent } from '../dto/slack-event.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SlackEventService {
  private readonly logger = new Logger(SlackEventService.name);

  constructor(
    @InjectRepository(SlackWorkspaceConfigEntity)
    private readonly workspaceRepo: Repository<SlackWorkspaceConfigEntity>,
    @InjectRepository(SlackChannelMappingEntity)
    private readonly channelMappingRepo: Repository<SlackChannelMappingEntity>,
    @InjectRepository(SlackMessageMappingEntity)
    private readonly messageMappingRepo: Repository<SlackMessageMappingEntity>,
    @InjectRepository(TalkMessageEntity)
    private readonly talkMessageRepo: Repository<TalkMessageEntity>,
    private readonly talkSseService: TalkSseService,
    private readonly slackApi: SlackApiService,
    private readonly workspaceService: SlackWorkspaceService,
    private readonly configService: ConfigService,
  ) {}

  verifySignature(req: any): void {
    const signingSecret = this.configService.get<string>('SLACK_SIGNING_SECRET', '');
    if (!signingSecret) {
      this.logger.warn('SLACK_SIGNING_SECRET not configured, skipping verification');
      return;
    }

    const timestamp = req.headers['x-slack-request-timestamp'];
    const slackSignature = req.headers['x-slack-signature'];

    if (!timestamp || !slackSignature) {
      throw new Error('Missing Slack signature headers');
    }

    // Prevent replay attacks (5 min window)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
      throw new Error('Slack request timestamp too old');
    }

    const rawBody = req.rawBody
      || (typeof req.body === 'string' ? req.body
      : Buffer.isBuffer(req.body) ? req.body.toString('utf-8')
      : JSON.stringify(req.body));

    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    const mySignature = 'v0=' + createHmac('sha256', signingSecret)
      .update(sigBasestring)
      .digest('hex');

    const sigBuffer = Buffer.from(mySignature, 'utf-8');
    const slackSigBuffer = Buffer.from(slackSignature, 'utf-8');

    if (sigBuffer.length !== slackSigBuffer.length || !timingSafeEqual(sigBuffer, slackSigBuffer)) {
      throw new Error('Invalid Slack signature');
    }
  }

  async processEvent(payload: SlackEventPayload): Promise<void> {
    if (payload.type !== 'event_callback') return;

    const event = payload.event;
    if (!event) return;

    const teamId = payload.team_id;

    // Find workspace config by team ID
    const workspace = await this.workspaceRepo.findOne({
      where: { swcTeamId: teamId, swcIsActive: true, swcDeletedAt: IsNull() },
    });
    if (!workspace) return;

    // Bot self-message filter (loop prevention #1)
    if (event.bot_id || event.user === workspace.swcBotUserId) return;

    switch (event.type) {
      case 'message':
        if (!event.subtype) {
          await this.handleNewMessage(workspace, event);
        } else if (event.subtype === 'message_changed') {
          await this.handleMessageChanged(workspace, event);
        } else if (event.subtype === 'message_deleted') {
          await this.handleMessageDeleted(workspace, event);
        }
        break;
    }
  }

  private async handleNewMessage(
    workspace: SlackWorkspaceConfigEntity,
    event: SlackMessageEvent,
  ): Promise<void> {
    // Find active channel mapping
    const mapping = await this.findActiveMapping(workspace.swcId, event.channel);
    if (!mapping) return;
    if (mapping.scmDirection === 'OUTBOUND_ONLY') return;

    // Duplicate check (loop prevention #2)
    const existing = await this.messageMappingRepo.findOne({
      where: { scmId: mapping.scmId, smmSlackTs: event.ts },
    });
    if (existing) return;

    // Get Slack user display name
    const botToken = this.workspaceService.decryptBotToken(workspace);
    const userName = event.user ? await this.slackApi.getUserDisplayName(botToken, event.user) : 'Unknown';

    // Resolve thread parent
    const parentId = await this.resolveThreadParent(mapping.scmId, event.thread_ts);

    // Save message to AMA
    const content = `[Slack] ${userName}: ${event.text || ''}`;
    const message = this.talkMessageRepo.create({
      chnId: mapping.chnId,
      usrId: '00000000-0000-0000-0000-000000000000', // System user
      msgContent: content,
      msgType: 'TEXT',
      msgParentId: parentId,
    });
    const saved = await this.talkMessageRepo.save(message);

    // Save message mapping
    await this.messageMappingRepo.save({
      scmId: mapping.scmId,
      smmSlackTs: event.ts,
      smmSlackThreadTs: event.thread_ts || null,
      msgId: saved.msgId,
      smmDirection: 'INBOUND',
    });

    // SSE broadcast
    this.talkSseService.emit({
      channelId: mapping.chnId,
      type: 'message:new',
      data: {
        id: saved.msgId,
        channelId: saved.chnId,
        senderId: saved.usrId,
        senderName: `[Slack] ${userName}`,
        content: saved.msgContent,
        type: saved.msgType,
        parentId: saved.msgParentId,
        createdAt: saved.msgCreatedAt,
        attachments: [],
        reactions: [],
        replyCount: 0,
      },
    });
  }

  private async handleMessageChanged(
    workspace: SlackWorkspaceConfigEntity,
    event: SlackMessageEvent,
  ): Promise<void> {
    if (!event.message) return;
    const mapping = await this.findActiveMapping(workspace.swcId, event.channel);
    if (!mapping) return;

    const msgMapping = await this.messageMappingRepo.findOne({
      where: { scmId: mapping.scmId, smmSlackTs: event.message.ts },
    });
    if (!msgMapping) return;

    const botToken = this.workspaceService.decryptBotToken(workspace);
    const userName = event.message.user
      ? await this.slackApi.getUserDisplayName(botToken, event.message.user)
      : 'Unknown';

    await this.talkMessageRepo.update(
      { msgId: msgMapping.msgId },
      { msgContent: `[Slack] ${userName}: ${event.message.text || ''}` },
    );

    this.talkSseService.emit({
      channelId: mapping.chnId,
      type: 'message:update',
      data: { id: msgMapping.msgId, content: `[Slack] ${userName}: ${event.message.text || ''}` },
    });
  }

  private async handleMessageDeleted(
    workspace: SlackWorkspaceConfigEntity,
    event: SlackMessageEvent,
  ): Promise<void> {
    if (!event.previous_message) return;
    const mapping = await this.findActiveMapping(workspace.swcId, event.channel);
    if (!mapping) return;

    const msgMapping = await this.messageMappingRepo.findOne({
      where: { scmId: mapping.scmId, smmSlackTs: event.previous_message.ts },
    });
    if (!msgMapping) return;

    await this.talkMessageRepo.softDelete({ msgId: msgMapping.msgId });

    this.talkSseService.emit({
      channelId: mapping.chnId,
      type: 'message:delete',
      data: { id: msgMapping.msgId },
    });
  }

  private async findActiveMapping(
    workspaceId: string,
    slackChannelId: string,
  ): Promise<SlackChannelMappingEntity | null> {
    return this.channelMappingRepo.findOne({
      where: {
        swcId: workspaceId,
        scmSlackChannelId: slackChannelId,
        scmStatus: 'ACTIVE',
        scmDeletedAt: IsNull(),
      },
    });
  }

  private async resolveThreadParent(
    channelMappingId: string,
    slackThreadTs?: string,
  ): Promise<string | null> {
    if (!slackThreadTs) return null;

    const parentMapping = await this.messageMappingRepo.findOne({
      where: { scmId: channelMappingId, smmSlackTs: slackThreadTs },
    });
    return parentMapping?.msgId || null;
  }
}
