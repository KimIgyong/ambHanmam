import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { ClientInvitationEntity } from './entity/client-invitation.entity';
import { ProjectClientEntity } from '../project/entity/project-client.entity';
import { ProjectEntity } from '../project/entity/project.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { IssueCommentEntity } from '../issues/entity/issue-comment.entity';
import { IssueParticipantEntity } from '../issues/entity/issue-participant.entity';
import { IssueStatusLogEntity } from '../issues/entity/issue-status-log.entity';
import { SvcClientEntity } from '../service-management/entity/client.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { ProjectMemberEntity } from '../project/entity/project-member.entity';
import { AuthModule } from '../auth/auth.module';
import { IssuesModule } from '../issues/issues.module';
import { ClientAuthService } from './service/client-auth.service';
import { ClientProjectService } from './service/client-project.service';
import { ClientIssueService } from './service/client-issue.service';
import { ClientAuthController } from './controller/client-auth.controller';
import { ClientProjectController } from './controller/client-project.controller';
import { ClientIssueController } from './controller/client-issue.controller';
import { ClientManagementController } from './controller/client-management.controller';
import { ClientNotificationController } from './controller/client-notification.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ClientInvitationEntity,
      ProjectClientEntity,
      ProjectEntity,
      IssueEntity,
      IssueCommentEntity,
      IssueParticipantEntity,
      IssueStatusLogEntity,
      SvcClientEntity,
      HrEntityEntity,
      ProjectMemberEntity,
    ]),
    AuthModule,
    IssuesModule,
    NotificationModule,
  ],
  controllers: [
    ClientAuthController,
    ClientProjectController,
    ClientIssueController,
    ClientManagementController,
    ClientNotificationController,
  ],
  providers: [
    ClientAuthService,
    ClientProjectService,
    ClientIssueService,
  ],
  exports: [ClientAuthService],
})
export class ClientPortalModule {}
