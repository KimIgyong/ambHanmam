import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService, CreateNotificationDto } from './notification.service';
import { NotificationSseService } from './notification-sse.service';
import { NotificationMapper } from '../mapper/notification.mapper';
import {
  ASSIGNEE_EVENT,
  AssigneeAssignedEvent,
  ASSIGNEE_ROLE,
  MENTION_EVENT,
  CommentMentionEvent,
  ISSUE_STATUS_EVENT,
  IssueStatusChangedEvent,
  REACTION_EVENT,
  CommentReactionEvent,
  RATING_EVENT,
  ContentRatingEvent,
  NOTIFICATION_TYPE,
  NOTIFICATION_RESOURCE_TYPE,
} from '../constant/notification-type.constant';
import { PushService } from './push.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationSseService: NotificationSseService,
    private readonly pushService: PushService,
  ) {}

  @OnEvent(ASSIGNEE_EVENT, { async: true })
  async handleAssigneeAssigned(event: AssigneeAssignedEvent): Promise<void> {
    this.logger.log(
      `Handling ${event.type}: resource=${event.resourceId}, recipients=${event.recipientIds.length}`,
    );

    if (event.recipientIds.length === 0) {
      return;
    }

    try {
      const roleLabel =
        event.role === ASSIGNEE_ROLE.ASSIGNEE ? '담당자' : '참여자';

      const resourceTypeLabel = this.getResourceTypeLabel(event.resourceType);

      // 수신자별 알림 DTO 생성
      const dtos: CreateNotificationDto[] = event.recipientIds.map(
        (recipientId) => ({
          type: event.type,
          title: `${event.senderName}님이 ${resourceTypeLabel}의 ${roleLabel}로 지정했습니다.`,
          message: event.resourceTitle,
          recipientId,
          senderId: event.senderId,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          entityId: event.entityId,
        }),
      );

      // DB 저장
      const notifications = await this.notificationService.createBulk(dtos);

      // SSE 실시간 전송 + Push
      for (const notification of notifications) {
        const response = NotificationMapper.toResponse(notification);
        response.senderName = event.senderName;
        this.notificationSseService.emit(
          notification.ntfRecipientId,
          response,
        );
        // Web Push
        this.pushService.sendPush(notification.ntfRecipientId, {
          title: response.ntfTitle,
          body: response.ntfMessage || event.resourceTitle,
          data: { url: this.getResourceUrl(event.resourceType, event.resourceId) },
        }).catch(() => {});
      }

      this.logger.log(
        `Created ${notifications.length} notifications for ${event.type}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process ${event.type}: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(MENTION_EVENT, { async: true })
  async handleCommentMention(event: CommentMentionEvent): Promise<void> {
    this.logger.log(
      `Handling COMMENT_MENTION: resource=${event.resourceId}, recipients=${event.recipientIds.length}`,
    );

    if (event.recipientIds.length === 0) {
      return;
    }

    try {
      const resourceTypeLabel = this.getResourceTypeLabel(event.resourceType);

      const dtos: CreateNotificationDto[] = event.recipientIds.map(
        (recipientId) => ({
          type: NOTIFICATION_TYPE.COMMENT_MENTION,
          title: `${event.senderName}님이 ${resourceTypeLabel} 코멘트에서 멘션했습니다.`,
          message: JSON.stringify({
            commentId: event.commentId,
            text: event.resourceTitle,
          }),
          recipientId,
          senderId: event.senderId,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          entityId: event.entityId,
        }),
      );

      const notifications = await this.notificationService.createBulk(dtos);

      for (const notification of notifications) {
        const response = NotificationMapper.toResponse(notification);
        response.senderName = event.senderName;
        this.notificationSseService.emit(
          notification.ntfRecipientId,
          response,
        );
        // Web Push
        this.pushService.sendPush(notification.ntfRecipientId, {
          title: response.ntfTitle,
          body: event.resourceTitle,
          data: { url: this.getResourceUrl(event.resourceType, event.resourceId) },
        }).catch(() => {});
      }

      this.logger.log(
        `Created ${notifications.length} mention notifications`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process COMMENT_MENTION: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(ISSUE_STATUS_EVENT, { async: true })
  async handleIssueStatusChanged(event: IssueStatusChangedEvent): Promise<void> {
    this.logger.log(
      `Handling ISSUE_STATUS_CHANGED: issue=${event.issueId}, ${event.fromStatus} → ${event.toStatus}`,
    );

    // APPROVED, IN_PROGRESS, RESOLVED 상태 변경 시에만 알림
    const NOTIFIABLE_STATUSES = ['APPROVED', 'IN_PROGRESS', 'RESOLVED'];
    if (!NOTIFIABLE_STATUSES.includes(event.toStatus)) {
      this.logger.log(`Skipping notification: ${event.toStatus} is not a notifiable status`);
      return;
    }

    // 수신자: 작성자 + 담당자 + 참여자 (변경자 본인 제외, 중복 제거)
    const recipientIds = [...new Set(
      [event.reporterId, event.assigneeId, ...(event.participantIds || [])]
        .filter((id): id is string => !!id && id !== event.changerId),
    )];

    if (recipientIds.length === 0) return;

    try {
      const dtos = recipientIds.map((recipientId) => ({
        type: NOTIFICATION_TYPE.ISSUE_STATUS_CHANGED,
        title: `이슈 상태 변경: ${event.fromStatus} → ${event.toStatus}`,
        message: event.issueTitle,
        recipientId,
        senderId: event.changerId,
        resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
        resourceId: event.issueId,
        entityId: event.entityId,
      }));

      const notifications = await this.notificationService.createBulk(dtos);

      for (const notification of notifications) {
        const response = NotificationMapper.toResponse(notification);
        response.senderName = event.changerName;
        this.notificationSseService.emit(notification.ntfRecipientId, response);
        this.pushService.sendPush(notification.ntfRecipientId, {
          title: `이슈 상태 변경: ${event.fromStatus} → ${event.toStatus}`,
          body: event.issueTitle,
          data: { url: `/issues?id=${event.issueId}` },
        }).catch(() => {});
      }

      this.logger.log(`Created ${notifications.length} issue status change notifications`);
    } catch (error) {
      this.logger.error(`Failed to process ISSUE_STATUS_CHANGED: ${error.message}`, error.stack);
    }
  }

  private static readonly REACTION_EMOJI_MAP: Record<string, string> = {
    LIKE: '👍',
    CHECK: '✅',
    PRAY: '🙏',
    GRIN: '😀',
    LOVE: '❤️',
  };

  @OnEvent(REACTION_EVENT, { async: true })
  async handleCommentReaction(event: CommentReactionEvent): Promise<void> {
    this.logger.log(
      `Handling COMMENT_REACTION: comment=${event.commentId}, type=${event.reactionType}`,
    );

    try {
      const emoji = NotificationListener.REACTION_EMOJI_MAP[event.reactionType] || event.reactionType;
      const resourceTypeLabel = this.getResourceTypeLabel(event.resourceType);

      const dto: CreateNotificationDto = {
        type: NOTIFICATION_TYPE.COMMENT_REACTION,
        title: `${event.senderName}님이 ${resourceTypeLabel} 코멘트에 ${emoji}를 눌렀습니다.`,
        message: event.resourceTitle,
        recipientId: event.recipientId,
        senderId: event.senderId,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        entityId: event.entityId,
      };

      const notifications = await this.notificationService.createBulk([dto]);

      for (const notification of notifications) {
        const response = NotificationMapper.toResponse(notification);
        response.senderName = event.senderName;
        this.notificationSseService.emit(notification.ntfRecipientId, response);
        this.pushService.sendPush(notification.ntfRecipientId, {
          title: dto.title,
          body: event.resourceTitle,
          data: { url: this.getResourceUrl(event.resourceType, event.resourceId) },
        }).catch(() => {});
      }

      this.logger.log(`Created reaction notification for ${event.recipientId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process COMMENT_REACTION: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(RATING_EVENT, { async: true })
  async handleContentRating(event: ContentRatingEvent): Promise<void> {
    this.logger.log(
      `Handling CONTENT_RATING: resource=${event.resourceId}, rating=${event.rating}`,
    );

    try {
      const resourceTypeLabel = this.getResourceTypeLabel(event.resourceType);

      const dto: CreateNotificationDto = {
        type: NOTIFICATION_TYPE.CONTENT_RATING,
        title: `${event.senderName}님이 ${resourceTypeLabel}에 ⭐${event.rating}개를 주셨습니다.`,
        message: event.resourceTitle,
        recipientId: event.recipientId,
        senderId: event.senderId,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        entityId: event.entityId,
      };

      const notifications = await this.notificationService.createBulk([dto]);

      for (const notification of notifications) {
        const response = NotificationMapper.toResponse(notification);
        response.senderName = event.senderName;
        this.notificationSseService.emit(notification.ntfRecipientId, response);
        this.pushService.sendPush(notification.ntfRecipientId, {
          title: dto.title,
          body: event.resourceTitle,
          data: { url: this.getResourceUrl(event.resourceType, event.resourceId) },
        }).catch(() => {});
      }

      this.logger.log(`Created rating notification for ${event.recipientId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process CONTENT_RATING: ${error.message}`,
        error.stack,
      );
    }
  }

  private getResourceUrl(resourceType: string, resourceId: string): string {
    switch (resourceType) {
      case 'TODO': return `/todos?id=${resourceId}`;
      case 'ISSUE': return `/issues?id=${resourceId}`;
      case 'MEETING_NOTE': return `/meeting-notes/${resourceId}`;
      case 'CALENDAR': return `/calendar?event=${resourceId}`;
      default: return '/';
    }
  }

  private getResourceTypeLabel(resourceType: string): string {
    switch (resourceType) {
      case 'TODO':
        return '할일';
      case 'ISSUE':
        return '이슈';
      case 'MEETING_NOTE':
        return '회의록';
      case 'CALENDAR':
        return '일정';
      default:
        return resourceType;
    }
  }
}
