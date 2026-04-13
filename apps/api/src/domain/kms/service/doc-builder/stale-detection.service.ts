import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';
import { DocGeneratedEntity } from '../../entity/doc-generated.entity';

export interface StaleDataItem {
  dbdId: string;
  categoryCode: string;
  categoryName: string;
  language: string;
  lastUpdated: string;
  daysSinceUpdate: number;
  dataSource: string;
}

export interface StaleDocumentItem {
  dgnId: string;
  title: string;
  status: string;
  createdAt: string;
  staleCategories: string[];
}

export interface StaleReport {
  staleData: StaleDataItem[];
  affectedDocuments: StaleDocumentItem[];
  checkedAt: string;
  thresholdDays: number;
}

@Injectable()
export class StaleDetectionService {
  private readonly logger = new Logger(StaleDetectionService.name);

  private readonly DEFAULT_THRESHOLD_DAYS = 30;
  private readonly DDD_THRESHOLD_DAYS = 90; // DDD uses quarterly data

  constructor(
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepository: Repository<DocBaseDataEntity>,
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepository: Repository<DocBaseCategoryEntity>,
    @InjectRepository(DocGeneratedEntity)
    private readonly docRepository: Repository<DocGeneratedEntity>,
  ) {}

  /**
   * Check for stale base data and affected FINALIZED documents
   */
  async checkStaleness(entityId: string, thresholdDays?: number): Promise<StaleReport> {
    const defaultThreshold = thresholdDays || this.DEFAULT_THRESHOLD_DAYS;

    // 1. Find stale base data
    const staleData = await this.findStaleBaseData(entityId, defaultThreshold);

    // 2. Find FINALIZED documents that used stale categories
    const affectedDocuments = await this.findAffectedDocuments(entityId, staleData);

    return {
      staleData,
      affectedDocuments,
      checkedAt: new Date().toISOString(),
      thresholdDays: defaultThreshold,
    };
  }

  /**
   * Find base data that hasn't been updated within the threshold
   */
  private async findStaleBaseData(entityId: string, defaultThresholdDays: number): Promise<StaleDataItem[]> {
    const now = new Date();
    const staleItems: StaleDataItem[] = [];

    const allData = await this.baseDataRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.category', 'c')
      .where('d.entId = :entityId', { entityId })
      .andWhere('d.dbdIsCurrent = true')
      .getMany();

    for (const item of allData) {
      // DDD categories use longer threshold (quarterly)
      const isDddSource = item.category?.dbcDataSource === 'DDD' || item.dbdUpdateSource === 'DDD_SYNC';
      const threshold = isDddSource ? this.DDD_THRESHOLD_DAYS : defaultThresholdDays;

      const daysSince = Math.floor(
        (now.getTime() - new Date(item.dbdFreshnessAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSince >= threshold) {
        staleItems.push({
          dbdId: item.dbdId,
          categoryCode: item.category?.dbcCode || '',
          categoryName: item.category?.dbcName || '',
          language: item.dbdLanguage,
          lastUpdated: item.dbdFreshnessAt?.toISOString() || item.dbdUpdatedAt?.toISOString(),
          daysSinceUpdate: daysSince,
          dataSource: item.dbdUpdateSource,
        });
      }
    }

    return staleItems.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
  }

  /**
   * Find FINALIZED documents that reference stale categories
   */
  private async findAffectedDocuments(
    entityId: string,
    staleData: StaleDataItem[],
  ): Promise<StaleDocumentItem[]> {
    if (staleData.length === 0) return [];

    const staleCodes = new Set(staleData.map((s) => s.categoryCode));

    // Find FINALIZED documents
    const docs = await this.docRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.docType', 'dt')
      .where('d.entId = :entityId', { entityId })
      .andWhere('d.dgnStatus = :status', { status: 'FINALIZED' })
      .getMany();

    const affected: StaleDocumentItem[] = [];

    for (const doc of docs) {
      const baseDataRefs: string[] = doc.docType?.dtpBaseDataRefs || [];
      const staleCategories = baseDataRefs.filter((ref) => staleCodes.has(ref));

      if (staleCategories.length > 0) {
        affected.push({
          dgnId: doc.dgnId,
          title: doc.dgnTitle,
          status: doc.dgnStatus,
          createdAt: doc.dgnCreatedAt?.toISOString(),
          staleCategories,
        });
      }
    }

    return affected;
  }

  /**
   * Auto-mark FINALIZED documents as OUTDATED when base data they use has been updated
   */
  async markOutdatedDocuments(entityId: string, updatedCategoryCode: string): Promise<number> {
    const docs = await this.docRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.docType', 'dt')
      .where('d.entId = :entityId', { entityId })
      .andWhere('d.dgnStatus = :status', { status: 'FINALIZED' })
      .getMany();

    let count = 0;
    for (const doc of docs) {
      const refs: string[] = doc.docType?.dtpBaseDataRefs || [];
      if (refs.includes(updatedCategoryCode)) {
        doc.dgnStatus = 'OUTDATED';
        await this.docRepository.save(doc);
        count++;
        this.logger.log(`Marked document ${doc.dgnId} as OUTDATED due to ${updatedCategoryCode} update`);
      }
    }

    return count;
  }
}
