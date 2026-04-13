import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmsTagEntity } from './entity/kms-tag.entity';
import { KmsTagSynonymEntity } from './entity/kms-tag-synonym.entity';
import { KmsTagRelationEntity } from './entity/kms-tag-relation.entity';
import { KmsWorkItemTagEntity } from './entity/kms-work-item-tag.entity';
import { WorkItemEntity } from '../acl/entity/work-item.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { ClaudeModule } from '../../infrastructure/external/claude/claude.module';
import { HrModule } from '../hr/hr.module';
import { SettingsModule } from '../settings/settings.module';
// Phase 5: Core services
import { TagService } from './service/tag.service';
import { TagAssignmentService } from './service/tag-assignment.service';
import { TagNormalizationService } from './service/tag-normalization.service';
import { TagSeedService } from './service/tag-seed.service';
// Phase 6: AI services
import { TagExtractionService } from './service/tag-extraction.service';
import { EmbeddingService } from './service/embedding.service';
import { ContentAnalyzerService } from './service/content-analyzer.service';
import { AutoTaggingService } from './service/auto-tagging.service';
import { TagWeightService } from './service/tag-weight.service';
// Phase 7: Cloud + Graph services
import { TagCloudService } from './service/tag-cloud.service';
import { TagDrillDownService } from './service/tag-drill-down.service';
import { KnowledgeGraphService } from './service/knowledge-graph.service';
import { TagBatchService } from './service/tag-batch.service';
import { ModuleIntegrationService } from './service/module-integration.service';
import { BatchSyncService } from './service/batch-sync.service';
// Module entities for batch sync
import { TodoEntity } from '../todo/entity/todo.entity';
import { NoticeEntity } from '../notices/entity/notice.entity';
import { ContractEntity } from '../billing/entity/contract.entity';
// DocBuilder entities
import { DocTypeEntity } from './entity/doc-type.entity';
import { DocBaseCategoryEntity } from './entity/doc-base-category.entity';
import { DocBaseDataEntity } from './entity/doc-base-data.entity';
import { DocBaseDataHistoryEntity } from './entity/doc-base-data-history.entity';
import { DocGeneratedEntity } from './entity/doc-generated.entity';
import { DocEditHistoryEntity } from './entity/doc-edit-history.entity';
import { DocTemplateEntity } from './entity/doc-template.entity';
import { DocAssetEntity } from './entity/doc-asset.entity';
// 5A Matrix (DDD) entities
import { DddFrameworkEntity } from './entity/ddd-framework.entity';
import { DddDashboardEntity } from './entity/ddd-dashboard.entity';
import { DddMetricEntity } from './entity/ddd-metric.entity';
import { DddSnapshotEntity } from './entity/ddd-snapshot.entity';
import { DddGaugeScoreEntity } from './entity/ddd-gauge-score.entity';
import { DddAiInsightEntity } from './entity/ddd-ai-insight.entity';
// DocBuilder services
import { DocTypeService } from './service/doc-builder/doc-type.service';
import { BaseDataService } from './service/doc-builder/base-data.service';
import { DocGenerationService } from './service/doc-builder/doc-generation.service';
import { PptxGenerationService } from './service/doc-builder/pptx-generation.service';
import { DocxGenerationService } from './service/doc-builder/docx-generation.service';
import { PdfGenerationService } from './service/doc-builder/pdf-generation.service';
import { DocDiffService } from './service/doc-builder/doc-diff.service';
import { ContentComparatorService } from './service/doc-builder/content-comparator.service';
import { DocParserService } from './service/doc-builder/doc-parser.service';
import { DocLifecycleService } from './service/doc-builder/doc-lifecycle.service';
import { DocExtractionService } from './service/doc-builder/doc-extraction.service';
import { ConflictDetectionService } from './service/doc-builder/conflict-detection.service';
import { GapAnalysisService } from './service/doc-builder/gap-analysis.service';
import { DocAssetService } from './service/doc-builder/doc-asset.service';
import { BrandConfigService } from './service/doc-builder/brand-config.service';
// Cross-module bridge services
import { DddDocBridgeService } from './service/doc-builder/ddd-doc-bridge.service';
import { CrossModuleDataService } from './service/doc-builder/cross-module-data.service';
import { StaleDetectionService } from './service/doc-builder/stale-detection.service';
// 5A Matrix (DDD) services
import { DddFrameworkService } from './service/ddd/ddd-framework.service';
import { DddDashboardService } from './service/ddd/ddd-dashboard.service';
import { DddSnapshotService } from './service/ddd/ddd-snapshot.service';
import { DddGaugeService } from './service/ddd/ddd-gauge.service';
import { DddDataCollectorService } from './service/ddd/ddd-data-collector.service';
import { DddAiAnalysisService } from './service/ddd/ddd-ai-analysis.service';
// Seed services
import { DocBuilderSeedService } from './seed/doc-builder-seed.service';
import { DddFrameworkSeedService } from './seed/ddd-framework-seed.service';
// Listeners
import { WorkItemSyncListener } from './listener/work-item-sync.listener';
// Controllers
import { KmsController } from './controller/kms.controller';
import { FolksonomyController } from './controller/folksonomy.controller';
import { TagCloudController } from './controller/tag-cloud.controller';
import { DocBuilderController } from './controller/doc-builder.controller';
import { DddController } from './controller/ddd.controller';
import { AmbGraphController } from './controller/amb-graph.controller';
// AMB Graph service + entities
import { AmbGraphService } from './service/amb-graph.service';
import { ProjectEntity } from '../project/entity/project.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { MeetingNoteEntity } from '../meeting-notes/entity/meeting-note.entity';
import { ProjectEpicEntity } from '../project/entity/project-epic.entity';
import { ProjectComponentEntity } from '../project/entity/project-component.entity';
import { MeetingNoteProjectEntity } from '../meeting-notes/entity/meeting-note-project.entity';
import { MeetingNoteIssueEntity } from '../meeting-notes/entity/meeting-note-issue.entity';
import { NoteLinkEntity } from '../meeting-notes/entity/note-link.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KmsTagEntity,
      KmsTagSynonymEntity,
      KmsTagRelationEntity,
      KmsWorkItemTagEntity,
      WorkItemEntity,
      HrEntityEntity,
      EntityUserRoleEntity,
      TodoEntity,
      NoticeEntity,
      ContractEntity,
      // DocBuilder
      DocTypeEntity,
      DocBaseCategoryEntity,
      DocBaseDataEntity,
      DocBaseDataHistoryEntity,
      DocGeneratedEntity,
      DocEditHistoryEntity,
      DocTemplateEntity,
      DocAssetEntity,
      // 5A Matrix (DDD)
      DddFrameworkEntity,
      DddDashboardEntity,
      DddMetricEntity,
      DddSnapshotEntity,
      DddGaugeScoreEntity,
      DddAiInsightEntity,
      // AMB Graph
      ProjectEntity,
      IssueEntity,
      MeetingNoteEntity,
      ProjectEpicEntity,
      ProjectComponentEntity,
      MeetingNoteProjectEntity,
      MeetingNoteIssueEntity,
      NoteLinkEntity,
    ]),
    ClaudeModule,
    HrModule,
    SettingsModule,
  ],
  controllers: [KmsController, FolksonomyController, TagCloudController, DocBuilderController, DddController, AmbGraphController],
  providers: [
    // Phase 5
    TagService,
    TagAssignmentService,
    TagNormalizationService,
    TagSeedService,
    // Phase 6
    TagExtractionService,
    EmbeddingService,
    ContentAnalyzerService,
    AutoTaggingService,
    TagWeightService,
    // Phase 7
    TagCloudService,
    TagDrillDownService,
    KnowledgeGraphService,
    TagBatchService,
    ModuleIntegrationService,
    BatchSyncService,
    WorkItemSyncListener,
    // DocBuilder
    DocTypeService,
    BaseDataService,
    DocGenerationService,
    PptxGenerationService,
    DocxGenerationService,
    PdfGenerationService,
    DocParserService,
    DocDiffService,
    ContentComparatorService,
    DocLifecycleService,
    DocExtractionService,
    ConflictDetectionService,
    GapAnalysisService,
    DocAssetService,
    BrandConfigService,
    DddDocBridgeService,
    CrossModuleDataService,
    StaleDetectionService,
    DocBuilderSeedService,
    DddFrameworkSeedService,
    // 5A Matrix (DDD)
    DddFrameworkService,
    DddDashboardService,
    DddSnapshotService,
    DddGaugeService,
    DddDataCollectorService,
    DddAiAnalysisService,
    DddDocBridgeService,
    CrossModuleDataService,
    StaleDetectionService,
    // AMB Graph
    AmbGraphService,
  ],
  exports: [
    TagService,
    TagAssignmentService,
    TagNormalizationService,
    TagExtractionService,
    AutoTaggingService,
    TagCloudService,
    KnowledgeGraphService,
    ModuleIntegrationService,
    DocTypeService,
    BaseDataService,
    DocGenerationService,
    DocParserService,
    DddFrameworkService,
    DddDashboardService,
    DddSnapshotService,
    DddGaugeService,
    DddDataCollectorService,
    DddAiAnalysisService,
  ],
})
export class KmsModule {}
