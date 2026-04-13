import { Injectable, Logger } from '@nestjs/common';
import { TagExtractionService } from './tag-extraction.service';

interface AnalysisResult {
  language: string;
  wordCount: number;
  hasCode: boolean;
  hasNumbers: boolean;
  contentType: 'text' | 'mixed' | 'code' | 'data';
}

@Injectable()
export class ContentAnalyzerService {
  private readonly logger = new Logger(ContentAnalyzerService.name);

  constructor(
    private readonly tagExtractionService: TagExtractionService,
  ) {}

  /**
   * DSED v2: Decompose, Sense, Extract, Deliver
   * Analyzes content structure, detects language, and triggers extraction.
   */
  async analyzeAndTag(params: {
    entityId: string;
    workItemId: string;
    title: string;
    content: string;
  }): Promise<void> {
    const analysis = this.analyzeContent(params.content);

    this.logger.debug(
      `Content analysis for ${params.workItemId}: lang=${analysis.language}, words=${analysis.wordCount}, type=${analysis.contentType}`,
    );

    // Skip very short content
    if (analysis.wordCount < 5) {
      this.logger.debug('Content too short for tag extraction, skipping');
      return;
    }

    await this.tagExtractionService.extractAndAssign({
      entityId: params.entityId,
      workItemId: params.workItemId,
      content: params.content,
      title: params.title,
    });
  }

  analyzeContent(text: string): AnalysisResult {
    const language = this.detectLanguage(text);
    const words = text.split(/\s+/).filter(Boolean);
    const hasCode = /```|function\s|class\s|import\s|const\s|let\s|var\s/.test(text);
    const hasNumbers = /\d{4,}|\$[\d,]+|[\d.]+%/.test(text);

    let contentType: AnalysisResult['contentType'] = 'text';
    if (hasCode && hasNumbers) contentType = 'mixed';
    else if (hasCode) contentType = 'code';
    else if (hasNumbers) contentType = 'data';

    return {
      language,
      wordCount: words.length,
      hasCode,
      hasNumbers,
      contentType,
    };
  }

  private detectLanguage(text: string): string {
    const sample = text.slice(0, 500);

    // Korean detection
    const koChars = (sample.match(/[\uAC00-\uD7AF\u3130-\u318F]/g) || []).length;
    // Vietnamese detection
    const viChars = (sample.match(/[àáảãạăắằẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi) || []).length;

    const totalChars = sample.replace(/\s/g, '').length || 1;
    const koRatio = koChars / totalChars;
    const viRatio = viChars / totalChars;

    if (koRatio > 0.15) return 'ko';
    if (viRatio > 0.05) return 'vi';
    return 'en';
  }
}
