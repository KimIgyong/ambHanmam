import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { CellEntity } from '../members/entity/cell.entity';
import { InvitationEntity } from '../invitation/entity/invitation.entity';
import { MenuConfigEntity } from '../settings/entity/menu-config.entity';
import { UnitEntity } from '../unit/entity/unit.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { LoginHistoryEntity } from './entity/login-history.entity';
import { PageViewEntity } from './entity/page-view.entity';
import { TodoEntity } from '../todo/entity/todo.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { MeetingNoteEntity } from '../meeting-notes/entity/meeting-note.entity';
import { AiTokenUsageEntity } from '../ai-usage/entity/ai-token-usage.entity';
import { TodoCommentEntity } from '../todo/entity/todo-comment.entity';
import { IssueCommentEntity } from '../issues/entity/issue-comment.entity';
import { MeetingNoteCommentEntity } from '../meeting-notes/entity/meeting-note-comment.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { TalkMessageEntity } from '../amoeba-talk/entity/talk-message.entity';
import { TalkChannelEntity } from '../amoeba-talk/entity/talk-channel.entity';
import { EmployeeEntity } from '../hr/entity/employee.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { EntityAiConfigEntity } from './entity/entity-ai-config.entity';
import { EntityCustomAppEntity } from './entity/entity-custom-app.entity';
import { SvcClientEntity } from '../service-management/entity/client.entity';
import { PartnerEntity } from '../billing/entity/partner.entity';
import { ClientInvitationEntity } from '../client-portal/entity/client-invitation.entity';
import { InvitationModule } from '../invitation/invitation.module';
import { SettingsModule } from '../settings/settings.module';
import { AiUsageModule } from '../ai-usage/ai-usage.module';
import { UnitModule } from '../unit/unit.module';
import { MembersModule } from '../members/members.module';
import { AuthModule } from '../auth/auth.module';
import { EntityMemberService } from './service/entity-member.service';
import { EntityPermissionService } from './service/entity-permission.service';
import { WorkStatisticsService } from './service/work-statistics.service';
import { EntityCustomAppService } from './service/entity-custom-app.service';
import { EntityCustomAppController } from './controller/entity-custom-app.controller';
import { EntityMemberController } from './controller/entity-member.controller';
import { EntityPermissionController } from './controller/entity-permission.controller';
import { EntityApiKeyController } from './controller/entity-api-key.controller';
import { EntityDriveController } from './controller/entity-drive.controller';
import { EntityUsageController } from './controller/entity-usage.controller';
import { EntityOrganizationController } from './controller/entity-organization.controller';
import { WorkStatisticsController } from './controller/work-statistics.controller';
import { EntityEmailTemplateController } from './controller/entity-email-template.controller';
import { EntityClientController } from './controller/entity-client.controller';
import { EntityClientService } from './service/entity-client.service';
import { ExternalTaskToolController } from './controller/external-task-tool.controller';
import { EntitySiteConfigEntity } from './entity/entity-site-config.entity';
import { EntityMenuTipEntity } from './entity/entity-menu-tip.entity';
import { EntityMenuConfigEntity } from './entity/entity-menu-config.entity';
import { EntitySiteConfigService } from './service/entity-site-config.service';
import { EntitySiteConfigController } from './controller/entity-site-config.controller';
import { AppStoreService } from './service/app-store.service';
import { AppStoreController } from './controller/app-store.controller';
import { ExternalTaskImportModule } from '../external-task-import/external-task-import.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CellEntity,
      InvitationEntity,
      MenuConfigEntity,
      UnitEntity,
      UserUnitRoleEntity,
      UserCellEntity,
      LoginHistoryEntity,
      PageViewEntity,
      TodoEntity,
      IssueEntity,
      MeetingNoteEntity,
      AiTokenUsageEntity,
      TodoCommentEntity,
      IssueCommentEntity,
      MeetingNoteCommentEntity,
      EntityUserRoleEntity,
      TalkMessageEntity,
      TalkChannelEntity,
      EmployeeEntity,
      HrEntityEntity,
      EntityAiConfigEntity,
      EntityCustomAppEntity,
      SvcClientEntity,
      PartnerEntity,
      ClientInvitationEntity,
      EntitySiteConfigEntity,
      EntityMenuTipEntity,
      EntityMenuConfigEntity,
    ]),
    InvitationModule,
    SettingsModule,
    AiUsageModule,
    UnitModule,
    MembersModule,
    AuthModule,
    forwardRef(() => ExternalTaskImportModule),
  ],
  controllers: [
    EntityMemberController,
    EntityPermissionController,
    EntityApiKeyController,
    EntityDriveController,
    EntityUsageController,
    EntityOrganizationController,
    WorkStatisticsController,
    EntityCustomAppController,
    EntityEmailTemplateController,
    EntityClientController,
    ExternalTaskToolController,
    EntitySiteConfigController,
    AppStoreController,
  ],
  providers: [EntityMemberService, EntityPermissionService, WorkStatisticsService, EntityCustomAppService, EntityClientService, EntitySiteConfigService, AppStoreService],
  exports: [EntityCustomAppService],
})
export class EntitySettingsModule {}
