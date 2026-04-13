import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationUserMapEntity } from './entity/migration-user-map.entity';
import { MigrationLogEntity } from './entity/migration-log.entity';
import { ProjectEntity } from '../project/entity/project.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { IssueCommentEntity } from '../issues/entity/issue-comment.entity';
import { IssueStatusLogEntity } from '../issues/entity/issue-status-log.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { HrModule } from '../hr/hr.module';
import { SettingsModule } from '../settings/settings.module';
import { IssuesModule } from '../issues/issues.module';
import { EntitySettingsModule } from '../entity-settings/entity-settings.module';
import { ExternalTaskImportModule } from '../external-task-import/external-task-import.module';
import { RedmineMigrationService } from './service/redmine-migration.service';
import { RedmineApiService } from './service/redmine-api.service';
import { MigrationController } from './controller/migration.controller';
import { EntityRedmineMigrationController } from './controller/entity-redmine-migration.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MigrationUserMapEntity,
      MigrationLogEntity,
      ProjectEntity,
      IssueEntity,
      IssueCommentEntity,
      IssueStatusLogEntity,
      UserEntity,
    ]),
    HrModule,
    SettingsModule,
    IssuesModule,
    forwardRef(() => EntitySettingsModule),
    forwardRef(() => ExternalTaskImportModule),
  ],
  controllers: [MigrationController, EntityRedmineMigrationController],
  providers: [RedmineMigrationService, RedmineApiService],
  exports: [RedmineMigrationService, RedmineApiService],
})
export class MigrationModule {}
