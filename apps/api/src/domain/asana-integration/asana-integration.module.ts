import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsanaProjectMappingEntity } from './entity/asana-project-mapping.entity';
import { AsanaTaskMappingEntity } from './entity/asana-task-mapping.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { AsanaAdminController } from './controller/asana-admin.controller';
import { AsanaApiService } from './service/asana-api.service';
import { AsanaImportService } from './service/asana-import.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AsanaProjectMappingEntity,
      AsanaTaskMappingEntity,
      IssueEntity,
    ]),
    SettingsModule,
  ],
  controllers: [AsanaAdminController],
  providers: [AsanaApiService, AsanaImportService],
})
export class AsanaIntegrationModule {}
