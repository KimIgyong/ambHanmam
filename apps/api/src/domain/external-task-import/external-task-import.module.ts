import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalTaskMappingEntity } from './entity/external-task-mapping.entity';
import { ExternalImportLogEntity } from './entity/external-import-log.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { EntitySettingsModule } from '../entity-settings/entity-settings.module';
import { IssuesModule } from '../issues/issues.module';
import { ExternalTaskImportService } from './service/external-task-import.service';
import { ExternalTaskImportController } from './controller/external-task-import.controller';
import { ProviderRegistry } from './provider/provider-registry';
import { AsanaProvider } from './provider/asana.provider';
import { RedmineProvider } from './provider/redmine.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExternalTaskMappingEntity,
      ExternalImportLogEntity,
      IssueEntity,
    ]),
    forwardRef(() => EntitySettingsModule),
    IssuesModule,
  ],
  controllers: [ExternalTaskImportController],
  providers: [
    ExternalTaskImportService,
    ProviderRegistry,
    AsanaProvider,
    RedmineProvider,
  ],
  exports: [ExternalTaskImportService],
})
export class ExternalTaskImportModule {}
