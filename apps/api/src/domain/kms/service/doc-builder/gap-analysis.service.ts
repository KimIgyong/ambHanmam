import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { ExtractedCategory } from './doc-extraction.service';

export interface GapItem {
  categoryCode: string;
  categoryName: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface GapReport {
  totalGaps: number;
  criticalGaps: number;
  items: GapItem[];
}

@Injectable()
export class GapAnalysisService {
  private readonly logger = new Logger(GapAnalysisService.name);

  constructor(
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepo: Repository<DocBaseCategoryEntity>,
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepo: Repository<DocBaseDataEntity>,
  ) {}

  /**
   * Analyze gaps: required fields that are still missing.
   * Optionally includes extracted data to show what would still be missing after apply.
   */
  async analyze(
    entityId: string,
    language: string = 'en',
    extracted?: ExtractedCategory[],
  ): Promise<GapReport> {
    const categories = await this.categoryRepo.find({
      where: { entId: entityId, dbcIsActive: true },
      order: { dbcDisplayOrder: 'ASC' },
    });

    const items: GapItem[] = [];

    for (const category of categories) {
      const fieldSchemas = (category.dbcFieldSchema || []) as any[];

      // Get existing data
      const existing = await this.baseDataRepo.findOne({
        where: { dbcId: category.dbcId, entId: entityId, dbdLanguage: language, dbdIsCurrent: true },
      });
      const existingData = existing?.dbdData || {};

      // Merge with extracted data if provided
      const extractedCat = extracted?.find((e) => e.categoryCode === category.dbcCode);
      const mergedData = extractedCat
        ? { ...existingData, ...extractedCat.data }
        : existingData;

      for (const field of fieldSchemas) {
        const value = mergedData[field.field];
        const isEmpty = value === null || value === undefined || value === '' ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          items.push({
            categoryCode: category.dbcCode,
            categoryName: category.dbcName,
            fieldKey: field.field,
            fieldLabel: field.label || field.field,
            fieldType: field.type,
            severity: field.required ? 'critical' : 'info',
          });
        }
      }
    }

    const criticalGaps = items.filter((i) => i.severity === 'critical').length;

    return {
      totalGaps: items.length,
      criticalGaps,
      items,
    };
  }
}
