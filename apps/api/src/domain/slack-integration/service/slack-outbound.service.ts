import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { SlackChannelMappingEntity } from '../entity/slack-channel-mapping.entity';
import { SlackMessageMappingEntity } from '../entity/slack-message-mapping.entity';
import { SlackApiService } from './slack-api.service';
import { SlackWorkspaceService } from './slack-workspace.service';
import { SLACK_OUTBOUND_EVENTS, SlackOutboundMessageEvent } from '../event/slack-outbound.event';

@Injectable()
export class SlackOutboundService {
  private readonly logger = new Logger(SlackOutboundService.name);

  constructor(
    @InjectRepository(SlackChannelMappingEntity)
    private readonly channelMappingRepo: Repository<SlackChannelMappingEntity>,
    @InjectRepository(SlackMessageMappingEntity)
    private readonly messageMappingRepo: Repository<SlackMessageMappingEntity>,
    private readonly slackApi: SlackApiService,
    private readonly workspaceService: SlackWorkspaceService,
  ) {}

  @OnEvent(SLACK_OUTBOUND_EVENTS.MESSAGE_CREATED, { async: true })
  async handleMessageCreated(event: SlackOutboundMessageEvent): Promise<void> {
    try {
      await this.trySendToSlack(event);
    } catch (error) {
      this.logger.error(`Slack outbound failed for message ${event.messageId}: ${error.message}`);
    }
  }

  private async trySendToSlack(event: SlackOutboundMessageEvent): Promise<void> {
    // Find channel mapping
    const mapping = await this.channelMappingRepo.findOne({
      where: { chnId: event.channelId, scmStatus: 'ACTIVE', scmDeletedAt: IsNull() },
      relations: ['workspace'],
    });
    if (!mapping || !mapping.workspace) return;
    if (mapping.scmDirection === 'INBOUND_ONLY') return;

    // Don't re-send messages from Slack (loop prevention #3)
    const isFromSlack = await this.messageMappingRepo.findOne({
      where: { msgId: event.messageId, smmDirection: 'INBOUND' },
    });
    if (isFromSlack) return;

    // Decrypt bot token
    const botToken = this.workspaceService.decryptBotToken(mapping.workspace);

    // Resolve Slack thread_ts for thread replies
    let threadTs: string | undefined;
    if (event.parentId) {
      const parentMapping = await this.messageMappingRepo.findOne({
        where: { msgId: event.parentId },
      });
      threadTs = parentMapping?.smmSlackTs || undefined;
    }

    // Post to Slack
    const text = `[AMA] ${event.senderName}: ${event.content}`;
    const result = await this.slackApi.postMessage(botToken, {
      channel: mapping.scmSlackChannelId,
      text,
      thread_ts: threadTs,
    });

    // Save message mapping for loop prevention
    if (result.ok && result.ts) {
      await this.messageMappingRepo.save({
        scmId: mapping.scmId,
        smmSlackTs: result.ts,
        smmSlackThreadTs: threadTs || null,
        msgId: event.messageId,
        smmDirection: 'OUTBOUND',
      });
    }
  }
}
