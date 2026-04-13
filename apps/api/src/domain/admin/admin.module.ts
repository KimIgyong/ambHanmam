import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../unit/entity/unit.entity';
import { CellEntity } from '../members/entity/cell.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { SvcClientEntity } from '../service-management/entity/client.entity';
import { SvcSubscriptionEntity } from '../service-management/entity/subscription.entity';
import { AiTokenUsageEntity } from '../ai-usage/entity/ai-token-usage.entity';
import { AiUsageModule } from '../ai-usage/ai-usage.module';
import { EntityAiConfigEntity } from '../entity-settings/entity/entity-ai-config.entity';
import { InvitationEntity } from '../invitation/entity/invitation.entity';
import { InvitationModule } from '../invitation/invitation.module';
import { SettingsModule } from '../settings/settings.module';
import { AdminController } from './controller/admin.controller';
import { SiteErrorController } from './controller/site-error.controller';
import { AdminService } from './service/admin.service';
import { SiteErrorService } from './service/site-error.service';
import { SiteErrorLogEntity } from './entity/site-error-log.entity';
import { ConversationEntity } from '../chat/entity/conversation.entity';
import { TalkChannelMemberEntity } from '../amoeba-talk/entity/talk-channel-member.entity';
import { TalkMessageEntity } from '../amoeba-talk/entity/talk-message.entity';
import { TalkReadStatusEntity } from '../amoeba-talk/entity/talk-read-status.entity';
import { TalkMessageHideEntity } from '../amoeba-talk/entity/talk-message-hide.entity';
import { TalkReactionEntity } from '../amoeba-talk/entity/talk-reaction.entity';
import { TodoEntity } from '../todo/entity/todo.entity';
import { TodoParticipantEntity } from '../todo/entity/todo-participant.entity';
import { TodoCommentEntity } from '../todo/entity/todo-comment.entity';
import { WorkItemEntity } from '../acl/entity/work-item.entity';
import { WorkItemCommentEntity } from '../acl/entity/work-item-comment.entity';
import { CalendarEntity } from '../calendar/entity/calendar.entity';
import { CalendarParticipantEntity } from '../calendar/entity/calendar-participant.entity';
import { AttendanceEntity } from '../attendance/entity/attendance.entity';
import { AttendanceAmendmentEntity } from '../attendance/entity/attendance-amendment.entity';
import { NotificationEntity } from '../notification/entity/notification.entity';
import { PushSubscriptionEntity } from '../notification/entity/push-subscription.entity';
import { NoticeEntity } from '../notices/entity/notice.entity';
import { NoticeReadEntity } from '../notices/entity/notice-read.entity';
import { MeetingNoteEntity } from '../meeting-notes/entity/meeting-note.entity';
import { MeetingNoteFolderEntity } from '../meeting-notes/entity/meeting-note-folder.entity';
import { MeetingNoteParticipantEntity } from '../meeting-notes/entity/meeting-note-participant.entity';
import { MeetingNoteCommentEntity } from '../meeting-notes/entity/meeting-note-comment.entity';
import { WorkReportEntity } from '../report/entity/work-report.entity';
import { DailyMissionEntity } from '../today/entity/daily-mission.entity';
import { LoginHistoryEntity } from '../entity-settings/entity/login-history.entity';
import { PageViewEntity } from '../entity-settings/entity/page-view.entity';
import { OAuthTokenEntity } from '../oauth/entity/oauth-token.entity';
import { OAuthAuthorizationCodeEntity } from '../oauth/entity/oauth-authorization-code.entity';
import { OpenApiLogEntity } from '../oauth/entity/open-api-log.entity';
import { PasswordResetEntity } from '../auth/entity/password-reset.entity';
import { DailyActivityStatEntity } from '../activity-index/entity/daily-activity-stat.entity';
import { IssueRatingEntity } from '../activity-index/entity/issue-rating.entity';
import { TodoRatingEntity } from '../activity-index/entity/todo-rating.entity';
import { CommentRatingEntity } from '../activity-index/entity/comment-rating.entity';
import { PgTransactionEntity } from '../payment-gateway/entity/pg-transaction.entity';
import { AiQuotaTopupEntity } from '../payment-gateway/entity/ai-quota-topup.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      EntityUserRoleEntity,
      HrEntityEntity,
      UserUnitRoleEntity,
      UnitEntity,
      CellEntity,
      UserCellEntity,
      SvcClientEntity,
      SvcSubscriptionEntity,
      AiTokenUsageEntity,
      EntityAiConfigEntity,
      InvitationEntity,
      SiteErrorLogEntity,
      ConversationEntity,
      TalkChannelMemberEntity,
      TalkMessageEntity,
      TalkReadStatusEntity,
      TalkMessageHideEntity,
      TalkReactionEntity,
      TodoEntity,
      TodoParticipantEntity,
      TodoCommentEntity,
      WorkItemEntity,
      WorkItemCommentEntity,
      CalendarEntity,
      CalendarParticipantEntity,
      AttendanceEntity,
      AttendanceAmendmentEntity,
      NotificationEntity,
      PushSubscriptionEntity,
      NoticeEntity,
      NoticeReadEntity,
      MeetingNoteEntity,
      MeetingNoteFolderEntity,
      MeetingNoteParticipantEntity,
      MeetingNoteCommentEntity,
      WorkReportEntity,
      DailyMissionEntity,
      LoginHistoryEntity,
      PageViewEntity,
      OAuthTokenEntity,
      OAuthAuthorizationCodeEntity,
      OpenApiLogEntity,
      PasswordResetEntity,
      DailyActivityStatEntity,
      IssueRatingEntity,
      TodoRatingEntity,
      CommentRatingEntity,
      PgTransactionEntity,
      AiQuotaTopupEntity,
    ]),
    AiUsageModule,
    InvitationModule,
    SettingsModule,
  ],
  controllers: [AdminController, SiteErrorController],
  providers: [AdminService, SiteErrorService],
  exports: [SiteErrorService],
})
export class AdminModule {}
