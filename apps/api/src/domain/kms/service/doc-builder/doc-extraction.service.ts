import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, Subject } from 'rxjs';
import { ClaudeService, AiUsageContext } from '../../../../infrastructure/external/claude/claude.service';
import { GoogleDriveService } from '../../../../infrastructure/external/google-drive/google-drive.service';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { DocParserService, ParsedDocument } from './doc-parser.service';
import { BaseDataService } from './base-data.service';
import { Readable } from 'stream';

export interface ExtractedCategory {
  categoryCode: string;
  categoryName: string;
  data: Record<string, any>;
  confidence: number;
}

export interface ExtractionResult {
  sourceFile: string;
  categories: ExtractedCategory[];
}

export interface BatchExtractionEvent {
  type: 'progress' | 'file_done' | 'error' | 'complete';
  fileId?: string;
  fileName?: string;
  current?: number;
  total?: number;
  result?: ExtractionResult;
  error?: string;
}

export interface ApplyExtractionDto {
  extractions: {
    categoryCode: string;
    data: Record<string, any>;
    language?: string;
  }[];
}

@Injectable()
export class DocExtractionService {
  private readonly logger = new Logger(DocExtractionService.name);

  constructor(
    private readonly claudeService: ClaudeService,
    private readonly docParser: DocParserService,
    private readonly baseDataService: BaseDataService,
    private readonly googleDrive: GoogleDriveService,
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepo: Repository<DocBaseCategoryEntity>,
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepo: Repository<DocBaseDataEntity>,
  ) {}

  /**
   * Extract data from a single Drive file.
   */
  async extractFromDriveFile(entityId: string, fileId: string, usageContext?: AiUsageContext): Promise<ExtractionResult> {
    // 1. Get file metadata from Google Drive
    const fileMeta = await this.googleDrive.getFile(fileId);
    const fileName = fileMeta.name || fileId;
    const mimeType = fileMeta.mimeType || '';

    // 2. Download file content
    const stream = await this.googleDrive.downloadFile(fileId);
    const buffer = await this.streamToBuffer(stream);

    // 3. Parse the document
    const parsed = await this.docParser.parse(buffer, this.mimeToFormat(mimeType));

    // 4. Get all categories for the entity
    const categories = await this.categoryRepo.find({
      where: { entId: entityId, dbcIsActive: true },
      order: { dbcDisplayOrder: 'ASC' },
    });

    // 5. AI extraction against category schemas
    const extractedCategories = await this.aiExtract(parsed, categories, usageContext);

    return {
      sourceFile: fileName,
      categories: extractedCategories,
    };
  }

  /**
   * Extract from a raw buffer (for non-Drive uploads).
   */
  async extractFromBuffer(entityId: string, buffer: Buffer, fileName: string, mimeType: string, usageContext?: AiUsageContext): Promise<ExtractionResult> {
    const parsed = await this.docParser.parse(buffer, this.mimeToFormat(mimeType));

    const categories = await this.categoryRepo.find({
      where: { entId: entityId, dbcIsActive: true },
      order: { dbcDisplayOrder: 'ASC' },
    });

    const extractedCategories = await this.aiExtract(parsed, categories, usageContext);

    return {
      sourceFile: fileName,
      categories: extractedCategories,
    };
  }

  /**
   * Batch extraction with SSE progress events.
   */
  streamBatchExtract(entityId: string, fileIds: string[]): Observable<BatchExtractionEvent> {
    const subject = new Subject<BatchExtractionEvent>();

    (async () => {
      const total = fileIds.length;
      for (let i = 0; i < total; i++) {
        const fileId = fileIds[i];
        subject.next({ type: 'progress', fileId, current: i + 1, total });

        try {
          const result = await this.extractFromDriveFile(entityId, fileId);
          subject.next({
            type: 'file_done',
            fileId,
            fileName: result.sourceFile,
            current: i + 1,
            total,
            result,
          });
        } catch (error: any) {
          this.logger.warn(`Extraction failed for file ${fileId}: ${error.message}`);
          subject.next({
            type: 'error',
            fileId,
            current: i + 1,
            total,
            error: error.message || 'Extraction failed',
          });
        }
      }

      subject.next({ type: 'complete', current: total, total });
      subject.complete();
    })();

    return subject.asObservable();
  }

  /**
   * Apply extraction results to base data.
   */
  async applyExtraction(entityId: string, userId: string, dto: ApplyExtractionDto): Promise<void> {
    for (const item of dto.extractions) {
      const category = await this.categoryRepo.findOne({
        where: { entId: entityId, dbcCode: item.categoryCode, dbcIsActive: true },
      });
      if (!category) continue;

      const language = item.language || 'en';
      const existing = await this.baseDataRepo.findOne({
        where: { dbcId: category.dbcId, entId: entityId, dbdLanguage: language, dbdIsCurrent: true },
      });

      if (existing) {
        // Merge extracted data with existing data
        const mergedData = { ...existing.dbdData, ...item.data };
        await this.baseDataService.updateData(entityId, userId, existing.dbdId, {
          data: mergedData,
          change_reason: 'AI extraction from document',
          update_source: 'AI_SUGGESTED',
        });
      } else {
        await this.baseDataService.createData(entityId, userId, {
          category_id: category.dbcId,
          language,
          data: item.data,
          update_source: 'AI_SUGGESTED',
        });
      }
    }
  }

  /**
   * Core AI extraction: sends parsed document + category schemas to Claude.
   */
  private async aiExtract(
    parsed: ParsedDocument,
    categories: DocBaseCategoryEntity[],
    usageContext?: AiUsageContext,
  ): Promise<ExtractedCategory[]> {
    // Filter out CONFIDENTIAL categories from AI extraction
    const safeCategories = categories.filter((cat) => cat.dbcConfidentiality !== 'CONFIDENTIAL');

    if (safeCategories.length === 0) return [];

    // Build category schema description for the prompt
    const schemaDesc = safeCategories.map((cat) => {
      const fields = (cat.dbcFieldSchema || []) as any[];
      const fieldDesc = fields.map((f: any) => `  - ${f.field} (${f.type}${f.required ? ', required' : ''}): ${f.label}`).join('\n');
      return `### ${cat.dbcCode} (${cat.dbcName})\n${fieldDesc}`;
    }).join('\n\n');

    // Truncate document text to fit context
    const docText = parsed.rawText.substring(0, 8000);

    const systemPrompt = `You are a data extraction AI. Extract structured data from the provided document text and map it to the given category schemas.

## Category Schemas
${schemaDesc}

## Rules
- Only extract data for fields that are clearly present in the document.
- Return a JSON array of extracted categories.
- Each item must have: categoryCode, data (matching the field keys), confidence (0.0-1.0).
- Skip categories with no relevant data found.
- confidence should reflect how certain you are about the extracted values.

Return ONLY a valid JSON array, no additional text.`;

    const userMessage = `Extract data from this document:\n\n${docText}`;

    try {
      const response = await this.claudeService.sendMessage(systemPrompt, [
        { role: 'user', content: userMessage },
      ], { usageContext });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const extracted: any[] = JSON.parse(jsonMatch[0]);
      return extracted.map((item) => ({
        categoryCode: item.categoryCode,
        categoryName: categories.find((c) => c.dbcCode === item.categoryCode)?.dbcName || item.categoryCode,
        data: item.data || {},
        confidence: item.confidence || 0.5,
      }));
    } catch (error) {
      this.logger.warn(`AI extraction failed: ${error}`);
      return [];
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  private mimeToFormat(mimeType: string): string {
    if (mimeType.includes('wordprocessingml') || mimeType.includes('docx')) return 'docx';
    if (mimeType.includes('presentationml') || mimeType.includes('pptx')) return 'pptx';
    if (mimeType.includes('pdf')) return 'pdf';
    return mimeType;
  }
}
