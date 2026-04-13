import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueEntity } from './entity/issue.entity';
import { IssueSequenceEntity } from './entity/issue-sequence.entity';
import { IssueSequenceService } from './service/issue-sequence.service';
import { UserEntity } from '../auth/entity/user.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { IssueCommentEntity } from './entity/issue-comment.entity';
import { IssueStatusLogEntity } from './entity/issue-status-log.entity';
import { IssueParticipantEntity } from './entity/issue-participant.entity';
import { IssueCommentReactionEntity } from './entity/issue-comment-reaction.entity';
import { IssueRatingEntity } from '../activity-index/entity/issue-rating.entity';
import { IssueService } from './service/issue.service';
import { IssueController } from './controller/issue.controller';
import { ProjectEntity } from '../project/entity/project.entity';
import { ProjectMemberEntity } from '../project/entity/project-member.entity';
import { HrModule } from '../hr/hr.module';
import { TranslationModule } from '../translation/translation.module';
import { ClaudeModule } from '../../infrastructure/external/claude/claude.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IssueEntity, IssueSequenceEntity, IssueCommentEntity, IssueStatusLogEntity, IssueParticipantEntity, IssueCommentReactionEntity, IssueRatingEntity, UserEntity, UserCellEntity, UserUnitRoleEntity, ProjectEntity, ProjectMemberEntity]),
    HrModule,
    TranslationModule,
    ClaudeModule,
  ],
  controllers: [IssueController],
  providers: [IssueService, IssueSequenceService],
  exports: [IssueService, IssueSequenceService],
})
export class IssuesModule {}
