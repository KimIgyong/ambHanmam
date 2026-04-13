import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentAnalyzerService } from './content-analyzer.service';
import { WorkItemEntity } from '../../acl/entity/work-item.entity';

@Injectable()
export class AutoTaggingService {
  private readonly logger = new Logger(AutoTaggingService.name);

  constructor(
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepository: Repository<WorkItemEntity>,
    private readonly contentAnalyzerService: ContentAnalyzerService,
  ) {}

  /**
   * Trigger auto-tagging for a work item.
   * Called when a work item is created or updated.
   */
  async tagWorkItem(workItemId: string): Promise<void> {
    const workItem = await this.workItemRepository.findOne({
      where: { witId: workItemId },
    });

    if (!workItem) {
      this.logger.warn(`Work item ${workItemId} not found for auto-tagging`);
      return;
    }

    const content = workItem.witContent || workItem.witTitle || '';
    if (!content.trim()) {
      this.logger.debug(`Work item ${workItemId} has no content for tagging`);
      return;
    }

    try {
      await this.contentAnalyzerService.analyzeAndTag({
        entityId: workItem.entId,
        workItemId: workItem.witId,
        title: workItem.witTitle,
        content,
      });
      this.logger.log(`Auto-tagged work item ${workItemId}`);
    } catch (error) {
      this.logger.error(`Auto-tagging failed for ${workItemId}: ${error}`);
    }
  }

  /**
   * Batch tag multiple work items (for backfill).
   */
  async batchTagWorkItems(workItemIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of workItemIds) {
      try {
        await this.tagWorkItem(id);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }
}
