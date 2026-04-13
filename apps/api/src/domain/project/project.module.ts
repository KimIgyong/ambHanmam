import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entity/project.entity';
import { ProjectMemberEntity } from './entity/project-member.entity';
import { ProjectReviewEntity } from './entity/project-review.entity';
import { ProjectFileEntity } from './entity/project-file.entity';
import { ProjectEpicEntity } from './entity/project-epic.entity';
import { ProjectComponentEntity } from './entity/project-component.entity';
import { ProjectClientEntity } from './entity/project-client.entity';
import { ProjectCommentEntity } from './entity/project-comment.entity';
import { MeetingNoteProjectEntity } from '../meeting-notes/entity/meeting-note-project.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { ClaudeModule } from '../../infrastructure/external/claude/claude.module';
import { AclModule } from '../acl/acl.module';
import { KmsModule } from '../kms/kms.module';
import { HrModule } from '../hr/hr.module';
import { IssuesModule } from '../issues/issues.module';
import { ProjectAiService } from './service/project-ai.service';
import { ProjectService } from './service/project.service';
import { ProjectMemberService } from './service/project-member.service';
import { ProjectReviewService } from './service/project-review.service';
import { EpicService } from './service/epic.service';
import { ComponentService } from './service/component.service';
import { WbsService } from './service/wbs.service';
import { ProjectController } from './controller/project.controller';
import { ProjectReviewController } from './controller/project-review.controller';
import { EpicController } from './controller/epic.controller';
import { ComponentController } from './controller/component.controller';
import { WbsController } from './controller/wbs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectMemberEntity,
      ProjectReviewEntity,
      ProjectFileEntity,
      ProjectEpicEntity,
      ProjectComponentEntity,
      ProjectClientEntity,
      ProjectCommentEntity,
      MeetingNoteProjectEntity,
      IssueEntity,
    ]),
    ClaudeModule,
    AclModule,
    KmsModule,
    HrModule,
    IssuesModule,
  ],
  controllers: [ProjectController, ProjectReviewController, EpicController, ComponentController, WbsController],
  providers: [
    ProjectAiService,
    ProjectService,
    ProjectMemberService,
    ProjectReviewService,
    EpicService,
    ComponentService,
    WbsService,
  ],
  exports: [ProjectService, ProjectAiService, EpicService, ComponentService],
})
export class ProjectModule {}
