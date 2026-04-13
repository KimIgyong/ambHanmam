import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';
import { ExtractionResult, ExtractedCategory } from './doc-extraction.service';

export interface ConflictItem {
  categoryCode: string;
  categoryName: string;
  fieldKey: string;
  fieldLabel: string;
  values: { source: string; value: any }[];
}

export interface ConflictReport {
  totalConflicts: number;
  items: ConflictItem[];
}

export interface ComparisonItem {
  categoryCode: string;
  categoryName: string;
  fieldKey: string;
  fieldLabel: string;
  existingValue: any;
  extractedValue: any;
  isDifferent: boolean;
}

export interface ComparisonResult {
  totalDifferences: number;
  items: ComparisonItem[];
}

@Injectable()
export class ConflictDetectionService {
  private readonly logger = new Logger(ConflictDetectionService.name);

  constructor(
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepo: Repository<DocBaseCategoryEntity>,
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepo: Repository<DocBaseDataEntity>,
  ) {}

  /**
   * Detect conflicts between multiple extraction results.
   * When the same category+field has different values across sources.
   */
  async detectConflicts(extractions: ExtractionResult[]): Promise<ConflictReport> {
    const fieldMap = new Map<string, { source: string; value: any }[]>();

    for (const extraction of extractions) {
      for (const cat of extraction.categories) {
        for (const [fieldKey, value] of Object.entries(cat.data)) {
          const key = `${cat.categoryCode}::${fieldKey}`;
          if (!fieldMap.has(key)) fieldMap.set(key, []);
          fieldMap.get(key)!.push({ source: extraction.sourceFile, value });
        }
      }
    }

    const items: ConflictItem[] = [];
    for (const [key, values] of fieldMap.entries()) {
      if (values.length < 2) continue;

      // Check if values are actually different
      const uniqueValues = new Set(values.map((v) => JSON.stringify(v.value)));
      if (uniqueValues.size <= 1) continue;

      const [categoryCode, fieldKey] = key.split('::');
      items.push({
        categoryCode,
        categoryName: categoryCode,
        fieldKey,
        fieldLabel: fieldKey,
        values,
      });
    }

    return { totalConflicts: items.length, items };
  }

  /**
   * Compare extracted data with existing base data.
   */
  async compareWithExisting(
    entityId: string,
    extracted: ExtractedCategory[],
    language: string = 'en',
  ): Promise<ComparisonResult> {
    const items: ComparisonItem[] = [];

    for (const cat of extracted) {
      const category = await this.categoryRepo.findOne({
        where: { entId: entityId, dbcCode: cat.categoryCode, dbcIsActive: true },
      });
      if (!category) continue;

      const existing = await this.baseDataRepo.findOne({
        where: { dbcId: category.dbcId, entId: entityId, dbdLanguage: language, dbdIsCurrent: true },
      });

      const existingData = existing?.dbdData || {};
      const fieldSchemas = (category.dbcFieldSchema || []) as any[];

      for (const [fieldKey, extractedValue] of Object.entries(cat.data)) {
        const existingValue = existingData[fieldKey];
        const isDifferent = JSON.stringify(existingValue) !== JSON.stringify(extractedValue);
        const schema = fieldSchemas.find((f: any) => f.field === fieldKey);

        items.push({
          categoryCode: cat.categoryCode,
          categoryName: category.dbcName,
          fieldKey,
          fieldLabel: schema?.label || fieldKey,
          existingValue: existingValue ?? null,
          extractedValue,
          isDifferent,
        });
      }
    }

    const totalDifferences = items.filter((i) => i.isDifferent).length;
    return { totalDifferences, items };
  }
}
