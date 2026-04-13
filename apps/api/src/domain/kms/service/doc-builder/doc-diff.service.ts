import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaudeService, AiUsageContext } from '../../../../infrastructure/external/claude/claude.service';
import { DocGeneratedEntity } from '../../entity/doc-generated.entity';
import { DocEditHistoryEntity } from '../../entity/doc-edit-history.entity';
import { ContentComparatorService, SectionDiff, DataUpdateProposal } from './content-comparator.service';
import { DocParserService } from './doc-parser.service';

export interface DiffAnalysisResult {
  documentId: string;
  editHistoryId: string;
  sectionDiffs: SectionDiff[];
  dataUpdateProposals: DataUpdateProposal[];
  summary: {
    totalSections: number;
    modifiedSections: number;
    addedSections: number;
    removedSections: number;
    overallSimilarity: number;
  };
}

@Injectable()
export class DocDiffService {
  private readonly logger = new Logger(DocDiffService.name);

  constructor(
    @InjectRepository(DocGeneratedEntity)
    private readonly generatedRepository: Repository<DocGeneratedEntity>,
    @InjectRepository(DocEditHistoryEntity)
    private readonly editHistoryRepository: Repository<DocEditHistoryEntity>,
    private readonly claudeService: ClaudeService,
    private readonly comparatorService: ContentComparatorService,
    private readonly docParser: DocParserService,
  ) {}

  async reUploadAndAnalyze(
    entityId: string,
    dgnId: string,
    userId: string,
    fileBuffer: Buffer,
    fileFormat: string,
    usageContext?: AiUsageContext,
  ): Promise<DiffAnalysisResult> {
    // 1. Get original document
    const doc = await this.generatedRepository.findOne({
      where: { dgnId, entId: entityId, dgnIsDeleted: false },
    });
    if (!doc) throw new NotFoundException(`Document ${dgnId} not found`);

    // 2. Save uploaded file
    const fs = await import('fs/promises');
    const path = await import('path');
    const tmpDir = path.join(process.cwd(), 'tmp', 'doc-builder', 'uploads');
    await fs.mkdir(tmpDir, { recursive: true });
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filePath = path.join(tmpDir, `${fileId}.${fileFormat}`);
    await fs.writeFile(filePath, fileBuffer);

    // 3. Extract text from uploaded file
    const uploadedSections = await this.extractSectionsFromFile(fileBuffer, fileFormat);

    // 4. Reconstruct original sections from snapshot
    const originalSections = this.reconstructOriginalSections(doc);

    // 5. Run structural comparison
    const sectionDiffs = this.comparatorService.compareSections(originalSections, uploadedSections);

    // 6. AI-powered data update proposal generation
    const dataUpdateProposals = await this.generateDataUpdateProposals(
      sectionDiffs,
      doc.dgnDataSnapshot,
      usageContext,
    );

    // 7. Build summary
    const summary = {
      totalSections: sectionDiffs.length,
      modifiedSections: sectionDiffs.filter((d) => d.changeType === 'MODIFIED').length,
      addedSections: sectionDiffs.filter((d) => d.changeType === 'ADDED').length,
      removedSections: sectionDiffs.filter((d) => d.changeType === 'REMOVED').length,
      overallSimilarity: sectionDiffs.length > 0
        ? sectionDiffs.reduce((sum, d) => sum + d.similarity, 0) / sectionDiffs.length
        : 1,
    };

    // 8. Save edit history
    const editHistory = this.editHistoryRepository.create({
      dgnId,
      dehAction: 'RE_UPLOADED',
      dehUploadedFileId: filePath,
      dehDiffResult: { sectionDiffs, summary },
      dehBaseDataUpdates: undefined,
      dehUserId: userId,
      dehNotes: `Re-uploaded ${fileFormat} file. ${summary.modifiedSections} sections modified.`,
    } as Partial<DocEditHistoryEntity>);
    const savedHistory = await this.editHistoryRepository.save(editHistory);

    return {
      documentId: dgnId,
      editHistoryId: savedHistory.dehId,
      sectionDiffs,
      dataUpdateProposals,
      summary,
    };
  }

  async getDiffResult(entityId: string, dgnId: string, dehId: string): Promise<DiffAnalysisResult | null> {
    const history = await this.editHistoryRepository.findOne({
      where: { dehId, dgnId },
    });
    if (!history || !history.dehDiffResult) return null;

    return {
      documentId: dgnId,
      editHistoryId: dehId,
      sectionDiffs: history.dehDiffResult.sectionDiffs || [],
      dataUpdateProposals: history.dehBaseDataUpdates || [],
      summary: history.dehDiffResult.summary || { totalSections: 0, modifiedSections: 0, addedSections: 0, removedSections: 0, overallSimilarity: 1 },
    };
  }

  async getEditHistory(entityId: string, dgnId: string): Promise<DocEditHistoryEntity[]> {
    return this.editHistoryRepository.find({
      where: { dgnId },
      order: { dehCreatedAt: 'DESC' },
      relations: ['user'],
    });
  }

  private async extractSectionsFromFile(
    fileBuffer: Buffer,
    fileFormat: string,
  ): Promise<{ code: string; name: string; content: string }[]> {
    // For text-based extraction: parse the file content
    // PPTX: each slide = a section, DOCX: heading-based sections
    const text = await this.extractPlainText(fileBuffer, fileFormat);
    return this.parseSectionsFromText(text);
  }

  private async extractPlainText(fileBuffer: Buffer, format: string): Promise<string> {
    const parsed = await this.docParser.parse(fileBuffer, format);

    // For PPTX, reconstruct the "--- SLIDE ---" format for backwards compatibility
    if (parsed.type === 'pptx' && parsed.slides?.length) {
      return parsed.slides
        .map((s) => `--- SLIDE ---\n${s.content}`)
        .join('\n\n');
    }

    return parsed.rawText;
  }

  private parseSectionsFromText(text: string): { code: string; name: string; content: string }[] {
    const sections: { code: string; name: string; content: string }[] = [];
    const parts = text.split(/--- SLIDE ---/g).filter(Boolean);

    if (parts.length > 1) {
      // PPTX: each slide is a section
      parts.forEach((part, i) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const firstLine = trimmed.split('\n')[0]?.trim() || `Section ${i + 1}`;
        sections.push({
          code: `SECTION_${i + 1}`,
          name: firstLine.substring(0, 100),
          content: trimmed,
        });
      });
    } else {
      // DOCX: split by headings
      const headingParts = text.split(/\n(?=[A-Z][^\n]{3,50}\n)/);
      headingParts.forEach((part, i) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const firstLine = trimmed.split('\n')[0]?.trim() || `Section ${i + 1}`;
        sections.push({
          code: `SECTION_${i + 1}`,
          name: firstLine.substring(0, 100),
          content: trimmed,
        });
      });
    }

    if (sections.length === 0) {
      sections.push({ code: 'FULL_TEXT', name: 'Full Content', content: text });
    }

    return sections;
  }

  private reconstructOriginalSections(
    doc: DocGeneratedEntity,
  ): { code: string; name: string; content: string }[] {
    const sections = doc.dgnSectionsConfig || [];
    return sections.map((s: any, i: number) => ({
      code: s.code || `SECTION_${i + 1}`,
      name: s.name || `Section ${i + 1}`,
      content: s.content || '',
    }));
  }

  private async generateDataUpdateProposals(
    sectionDiffs: SectionDiff[],
    dataSnapshot: any,
    usageContext?: AiUsageContext,
  ): Promise<DataUpdateProposal[]> {
    const modifiedDiffs = sectionDiffs.filter((d) => d.changeType === 'MODIFIED' && d.similarity < 0.9);
    if (modifiedDiffs.length === 0) return [];

    const changedContent = modifiedDiffs
      .map((d) => `Section "${d.sectionName}":\nOriginal: ${d.originalText.substring(0, 500)}\nModified: ${d.uploadedText.substring(0, 500)}`)
      .join('\n\n');

    const dataContextLines: string[] = [];
    if (dataSnapshot) {
      for (const [code, cat] of Object.entries(dataSnapshot)) {
        const c = cat as any;
        if (c.data) {
          dataContextLines.push(`${code}: ${JSON.stringify(c.data).substring(0, 300)}`);
        }
      }
    }

    const systemPrompt = `You are a document analysis AI. Compare the original and modified sections of a business document.
Identify specific data changes that should update the base data repository.

Base Data Context:
${dataContextLines.join('\n')}

Return a JSON array of proposals:
[{
  "categoryCode": "string",
  "field": "string",
  "currentValue": "any",
  "proposedValue": "any",
  "reason": "string",
  "confidence": 0.0-1.0
}]

Only propose changes where actual data values changed (numbers, names, dates), not stylistic changes.
Return [] if no data changes detected.`;

    try {
      const response = await this.claudeService.sendMessage(systemPrompt, [
        { role: 'user', content: `Analyze these changes:\n\n${changedContent}` },
      ], { usageContext });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const proposals = JSON.parse(jsonMatch[0]);
      return proposals.map((p: any) => ({
        ...p,
        categoryName: dataSnapshot?.[p.categoryCode]?.categoryName || p.categoryCode,
        source: 'AI_SUGGESTED' as const,
      }));
    } catch (error) {
      this.logger.warn(`AI data update proposal generation failed: ${error}`);
      return [];
    }
  }
}
