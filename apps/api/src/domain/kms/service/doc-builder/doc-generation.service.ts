import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaudeService, AiUsageContext } from '../../../../infrastructure/external/claude/claude.service';
import { DocGeneratedEntity } from '../../entity/doc-generated.entity';
import { DocTypeEntity } from '../../entity/doc-type.entity';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';
import { BaseDataService } from './base-data.service';
import { DocTypeService } from './doc-type.service';
import { PptxGenerationService } from './pptx-generation.service';
import { DocxGenerationService } from './docx-generation.service';
import { PdfGenerationService } from './pdf-generation.service';

export interface GenerateDocumentDto {
  doc_type_id: string;
  audience: string; // 'CLIENT' | 'INVESTOR' | 'PARTNER' | 'GOVERNMENT'
  language: string; // 'en' | 'ko' | 'vi'
  format: string; // 'PPTX' | 'DOCX'
  title?: string;
  sections?: string[]; // section codes to include (null = all)
}

interface SectionContent {
  code: string;
  name: string;
  order: number;
  content: string; // AI-generated markdown
}

@Injectable()
export class DocGenerationService {
  private readonly logger = new Logger(DocGenerationService.name);

  constructor(
    @InjectRepository(DocGeneratedEntity)
    private readonly generatedRepository: Repository<DocGeneratedEntity>,
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepository: Repository<DocBaseDataEntity>,
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepository: Repository<DocBaseCategoryEntity>,
    private readonly claudeService: ClaudeService,
    private readonly baseDataService: BaseDataService,
    private readonly docTypeService: DocTypeService,
    private readonly pptxService: PptxGenerationService,
    private readonly docxService: DocxGenerationService,
    private readonly pdfService: PdfGenerationService,
  ) {}

  async generate(
    entityId: string,
    userId: string,
    dto: GenerateDocumentDto,
  ): Promise<DocGeneratedEntity> {
    // 1. Get doc type with inherited base data refs
    const docType = await this.docTypeService.findOne(entityId, dto.doc_type_id);
    const baseDataRefs = await this.docTypeService.getInheritedBaseDataRefs(entityId, dto.doc_type_id);

    // 2. Gather all base data
    const baseData = await this.gatherBaseData(entityId, baseDataRefs, dto.language);

    // 3. Determine sections
    const sections = docType.dtpSectionTemplate || [];
    const activeSections = dto.sections
      ? sections.filter((s: any) => dto.sections!.includes(s.code))
      : sections;

    const usageContext: AiUsageContext = { entId: entityId, usrId: userId, sourceType: 'DOC_GENERATION' };

    // 4. Generate content for each section via Claude
    const sectionContents = await this.generateSectionContents(
      docType,
      activeSections,
      baseData,
      dto,
      usageContext,
    );

    // 5. Generate document file
    let fileBuffer: Buffer;
    if (dto.format === 'DOCX') {
      fileBuffer = await this.docxService.generate(sectionContents, dto, docType);
    } else if (dto.format === 'PDF') {
      fileBuffer = await this.pdfService.generate(sectionContents, dto, docType);
    } else {
      fileBuffer = await this.pptxService.generate(sectionContents, dto, docType);
    }

    // 6. Save file to temp directory
    const fs = await import('fs/promises');
    const path = await import('path');
    const tmpDir = path.join(process.cwd(), 'tmp', 'doc-builder');
    await fs.mkdir(tmpDir, { recursive: true });
    const ext = dto.format === 'DOCX' ? 'docx' : 'pptx';
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filePath = path.join(tmpDir, `${fileId}.${ext}`);
    await fs.writeFile(filePath, fileBuffer);

    // 7. Save generated document record
    const title = dto.title || `${docType.dtpName} - ${dto.audience} (${dto.language.toUpperCase()})`;
    const entity = this.generatedRepository.create({
      entId: entityId,
      dtpId: dto.doc_type_id,
      dgnTitle: title,
      dgnAudienceType: dto.audience,
      dgnLanguage: dto.language,
      dgnFileFormat: dto.format.toLowerCase(),
      dgnStatus: 'DRAFT',
      dgnDataSnapshot: baseData,
      dgnSectionsConfig: sectionContents.map((s) => ({ code: s.code, name: s.name, order: s.order })),
      dgnAiModel: 'claude-opus-4-6',
      dgnDriveFileId: filePath, // Temporary: local file path
      dgnFileSizeBytes: fileBuffer.length,
      dgnGeneratedBy: userId,
    } as Partial<DocGeneratedEntity>);

    return this.generatedRepository.save(entity);
  }

  async findAll(entityId: string): Promise<DocGeneratedEntity[]> {
    return this.generatedRepository.find({
      where: { entId: entityId, dgnIsDeleted: false },
      order: { dgnCreatedAt: 'DESC' },
      relations: ['docType'],
    });
  }

  async findOne(entityId: string, dgnId: string): Promise<DocGeneratedEntity> {
    const doc = await this.generatedRepository.findOne({
      where: { dgnId, entId: entityId, dgnIsDeleted: false },
      relations: ['docType'],
    });
    if (!doc) throw new NotFoundException(`Document ${dgnId} not found`);
    return doc;
  }

  async getFileBuffer(entityId: string, dgnId: string): Promise<{ buffer: Buffer; filename: string; format: string }> {
    const doc = await this.findOne(entityId, dgnId);
    const fs = await import('fs/promises');
    const ext = doc.dgnFileFormat || 'pptx';
    const filename = `${doc.dgnTitle.replace(/[^a-zA-Z0-9가-힣\s]/g, '_')}.${ext}`;

    // Read from local file path stored in dgnDriveFileId
    const buffer = doc.dgnDriveFileId
      ? await fs.readFile(doc.dgnDriveFileId)
      : Buffer.alloc(0);

    return { buffer, filename, format: ext };
  }

  async updateStatus(entityId: string, dgnId: string, status: string): Promise<DocGeneratedEntity> {
    const doc = await this.findOne(entityId, dgnId);
    doc.dgnStatus = status;
    return this.generatedRepository.save(doc);
  }

  private async gatherBaseData(
    entityId: string,
    categoryRefs: string[],
    language: string,
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const ref of categoryRefs) {
      const category = await this.categoryRepository.findOne({
        where: { entId: entityId, dbcCode: ref, dbcIsActive: true },
      });
      if (!category) continue;

      const data = await this.baseDataRepository.findOne({
        where: { dbcId: category.dbcId, entId: entityId, dbdLanguage: language, dbdIsCurrent: true },
      });

      // Mask CONFIDENTIAL fields before sending to AI
      let safeData = data?.dbdData || null;
      if (safeData && category.dbcConfidentiality === 'CONFIDENTIAL') {
        safeData = this.maskConfidentialData(safeData, category.dbcFieldSchema);
      }

      result[ref] = {
        categoryName: category.dbcName,
        categoryNameKr: category.dbcNameKr,
        fieldSchema: category.dbcFieldSchema,
        data: safeData,
        hasData: !!data,
      };
    }

    return result;
  }

  private maskConfidentialData(
    data: Record<string, any>,
    fieldSchema: any[],
  ): Record<string, any> {
    const masked = { ...data };
    const sensitiveTypes = ['password', 'secret', 'key', 'token', 'account', 'bank'];
    for (const field of (fieldSchema || [])) {
      const key = field.field;
      if (masked[key] === null || masked[key] === undefined) continue;
      const isFieldSensitive = sensitiveTypes.some(
        (t) => key.toLowerCase().includes(t) || (field.label || '').toLowerCase().includes(t),
      );
      if (isFieldSensitive) {
        masked[key] = '[REDACTED]';
      }
    }
    return masked;
  }

  private async generateSectionContents(
    docType: DocTypeEntity,
    sections: any[],
    baseData: Record<string, any>,
    dto: GenerateDocumentDto,
    usageContext?: AiUsageContext,
  ): Promise<SectionContent[]> {
    const results: SectionContent[] = [];

    // Prepare base data summary for context
    const dataContext = this.prepareDataContext(baseData);

    for (const section of sections) {
      const content = await this.generateSectionContent(
        section,
        docType,
        dataContext,
        dto,
        usageContext,
      );
      results.push({
        code: section.code,
        name: section.name,
        order: section.order,
        content,
      });
    }

    return results;
  }

  private async generateSectionContent(
    section: any,
    docType: DocTypeEntity,
    dataContext: string,
    dto: GenerateDocumentDto,
    usageContext?: AiUsageContext,
  ): Promise<string> {
    const audienceGuide = this.getAudienceGuide(dto.audience);
    const langName = dto.language === 'ko' ? 'Korean' : dto.language === 'vi' ? 'Vietnamese' : 'English';

    const systemPrompt = `You are a professional corporate document writer creating a "${docType.dtpName}" document.
Your task: Write the "${section.name}" section.

## Guidelines
- Write in ${langName}
- Audience: ${dto.audience} — ${audienceGuide}
- Tone: Professional, clear, data-driven
- Format: Output clean Markdown
- If data is missing for certain fields, write appropriate placeholder text marked with [TBD]
- Keep content concise but comprehensive
- For the COVER section: just provide the title and subtitle
- For data-heavy sections: use bullet points, tables, and statistics

## Available Base Data
${dataContext}`;

    const userMessage = `Write the "${section.name}" section for a ${docType.dtpName} document targeting ${dto.audience} audience. Use the available base data above.`;

    try {
      return await this.claudeService.sendMessage(systemPrompt, [
        { role: 'user', content: userMessage },
      ], { usageContext });
    } catch (error) {
      this.logger.warn(`AI generation failed for section ${section.code}: ${error}`);
      return `# ${section.name}\n\n[Content generation pending - please edit manually]`;
    }
  }

  private prepareDataContext(baseData: Record<string, any>): string {
    const lines: string[] = [];
    for (const [code, cat] of Object.entries(baseData)) {
      if (!cat.hasData) {
        lines.push(`### ${code} (${cat.categoryName}): No data available`);
        continue;
      }
      lines.push(`### ${code} (${cat.categoryName}):`);
      const data = cat.data;
      for (const [key, val] of Object.entries(data)) {
        if (val === null || val === undefined || val === '') continue;
        if (Array.isArray(val)) {
          lines.push(`- ${key}: ${JSON.stringify(val).substring(0, 500)}`);
        } else if (typeof val === 'object') {
          lines.push(`- ${key}: ${JSON.stringify(val).substring(0, 300)}`);
        } else {
          lines.push(`- ${key}: ${val}`);
        }
      }
    }
    return lines.join('\n');
  }

  private getAudienceGuide(audience: string): string {
    const guides: Record<string, string> = {
      CLIENT: 'Focus on service capabilities, case studies, reliability, and professionalism. Emphasize value delivery.',
      INVESTOR: 'Focus on financial metrics, growth trajectory, market opportunity, team strength, and competitive advantage. Use Sequoia-style storytelling.',
      PARTNER: 'Focus on collaboration opportunities, complementary strengths, technical compatibility, and mutual benefits.',
      GOVERNMENT: 'Focus on regulatory compliance, local presence, employment contribution, and corporate governance.',
    };
    return guides[audience] || guides.CLIENT;
  }
}
