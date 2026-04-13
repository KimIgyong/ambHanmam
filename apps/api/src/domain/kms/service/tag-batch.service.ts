import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsTagEntity } from '../entity/kms-tag.entity';
import { KmsWorkItemTagEntity } from '../entity/kms-work-item-tag.entity';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Injectable()
export class TagBatchService {
  private readonly logger = new Logger(TagBatchService.name);

  constructor(
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
    @InjectRepository(KmsWorkItemTagEntity)
    private readonly witTagRepository: Repository<KmsWorkItemTagEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepository: Repository<HrEntityEntity>,
    private readonly knowledgeGraphService: KnowledgeGraphService,
  ) {}

  /**
   * Daily batch job at 4 AM:
   * 1. Recalculate tag usage counts
   * 2. Analyze co-occurrences
   * 3. Clean up orphaned tags
   */
  @Cron('0 4 * * *')
  async runDailyBatch(): Promise<void> {
    this.logger.log('Starting daily tag batch job');

    try {
      await this.recalculateUsageCounts();
      await this.analyzeAllCoOccurrences();
      await this.cleanupOrphanedTags();
      this.logger.log('Daily tag batch job completed');
    } catch (error) {
      this.logger.error(`Daily tag batch job failed: ${error}`);
    }
  }

  /**
   * Recalculate usage counts for all tags.
   */
  async recalculateUsageCounts(): Promise<void> {
    this.logger.log('Recalculating tag usage counts');

    await this.tagRepository
      .createQueryBuilder()
      .update(KmsTagEntity)
      .set({
        tagUsageCount: () =>
          `(SELECT COUNT(*) FROM amb_kms_work_item_tags wit WHERE wit.tag_id = amb_kms_tags.tag_id AND wit.wtt_source != 'USER_REJECTED')`,
      })
      .execute();
  }

  /**
   * Analyze co-occurrences for all entities.
   */
  async analyzeAllCoOccurrences(): Promise<void> {
    this.logger.log('Analyzing co-occurrences');

    const entities = await this.entityRepository.find();
    for (const entity of entities) {
      try {
        await this.knowledgeGraphService.analyzeCoOccurrences(entity.entId);
      } catch (error) {
        this.logger.warn(`Co-occurrence analysis failed for entity ${entity.entId}: ${error}`);
      }
    }
  }

  /**
   * Remove tags with zero usage that are not system tags.
   * Only removes tags that have been unused for > 90 days.
   */
  async cleanupOrphanedTags(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await this.tagRepository
      .createQueryBuilder()
      .delete()
      .from(KmsTagEntity)
      .where('tag_usage_count = 0')
      .andWhere('tag_is_system = false')
      .andWhere('tag_created_at < :cutoffDate', { cutoffDate })
      .andWhere(
        `tag_id NOT IN (SELECT DISTINCT tag_id FROM amb_kms_work_item_tags)`,
      )
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} orphaned tags`);
    }
  }
}
