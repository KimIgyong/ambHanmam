import { Injectable, Logger } from '@nestjs/common';
import { ClaudeService } from '../../../infrastructure/external/claude/claude.service';
import { TagNormalizationService } from './tag-normalization.service';
import { TagAssignmentService } from './tag-assignment.service';

interface ExtractedTag {
  name: string;
  level: number; // 1=DOMAIN, 2=TOPIC, 3=CONTEXT
  confidence: number;
  language?: string;
}

interface ExtractionResult {
  tags: ExtractedTag[];
  language: string;
}

const TAG_EXTRACTION_PROMPT = `You are a tag extraction specialist for a knowledge management system.
Analyze the given content and extract relevant tags organized in a 3-level taxonomy:
- Level 1 (DOMAIN): Broad business domains (e.g., finance, hr, legal, operations)
- Level 2 (TOPIC): Specific topics within a domain (e.g., payroll, contracts, recruitment)
- Level 3 (CONTEXT): Contextual details (e.g., q4-2025, urgent, review-needed)

Rules:
1. Extract 3-8 tags per content
2. Always include at least one Level 1 tag
3. Use lowercase, hyphen-separated tag names
4. Assign confidence scores (0.0-1.0) based on how relevant each tag is
5. Detect the primary language of the content
6. For multilingual content, extract tags in English but note the original language

Respond ONLY with valid JSON in this exact format:
{
  "tags": [
    {"name": "tag-name", "level": 1, "confidence": 0.95, "language": "en"},
    {"name": "tag-name", "level": 2, "confidence": 0.85}
  ],
  "language": "en"
}`;

@Injectable()
export class TagExtractionService {
  private readonly logger = new Logger(TagExtractionService.name);

  constructor(
    private readonly claudeService: ClaudeService,
    private readonly normalizationService: TagNormalizationService,
    private readonly assignmentService: TagAssignmentService,
  ) {}

  async extractTags(content: string, title?: string, entId?: string, usrId?: string): Promise<ExtractionResult> {
    const inputText = title ? `Title: ${title}\n\nContent: ${content}` : content;

    // Truncate to avoid exceeding token limits
    const truncated = inputText.slice(0, 4000);

    try {
      const usageContext = entId && usrId ? { entId, usrId, sourceType: 'TAG_EXTRACTION' } : undefined;
      const response = await this.claudeService.sendMessage(
        TAG_EXTRACTION_PROMPT,
        [{ role: 'user', content: truncated }],
        { usageContext },
      );

      return this.parseResponse(response);
    } catch (error) {
      this.logger.error(`Tag extraction failed: ${error}`);
      return { tags: [], language: 'en' };
    }
  }

  async extractAndAssign(params: {
    entityId: string;
    workItemId: string;
    content: string;
    title?: string;
  }): Promise<void> {
    const result = await this.extractTags(params.content, params.title);

    for (const extracted of result.tags) {
      try {
        const tag = await this.normalizationService.normalizeTag(
          params.entityId,
          extracted.name,
          extracted.level,
        );

        await this.assignmentService.assignTag({
          workItemId: params.workItemId,
          tagId: tag.tagId,
          source: 'AI_EXTRACTED',
          confidence: extracted.confidence,
          weight: extracted.confidence * 0.8,
        });
      } catch (error) {
        this.logger.warn(`Failed to assign extracted tag "${extracted.name}": ${error}`);
      }
    }
  }

  private parseResponse(response: string): ExtractionResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { tags: [], language: 'en' };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed.tags)) {
        return { tags: [], language: parsed.language || 'en' };
      }

      const tags: ExtractedTag[] = parsed.tags
        .filter((t: any) => t.name && typeof t.name === 'string')
        .map((t: any) => ({
          name: String(t.name).toLowerCase().trim(),
          level: [1, 2, 3].includes(t.level) ? t.level : 2,
          confidence: typeof t.confidence === 'number' ? Math.min(1, Math.max(0, t.confidence)) : 0.5,
          language: t.language,
        }));

      return { tags, language: parsed.language || 'en' };
    } catch {
      this.logger.warn('Failed to parse tag extraction response');
      return { tags: [], language: 'en' };
    }
  }
}
