import { Injectable, Logger } from '@nestjs/common';
import { TagNormalizationService } from './tag-normalization.service';
import { TagAssignmentService } from './tag-assignment.service';

@Injectable()
export class ModuleIntegrationService {
  private readonly logger = new Logger(ModuleIntegrationService.name);

  constructor(
    private readonly normalizationService: TagNormalizationService,
    private readonly assignmentService: TagAssignmentService,
  ) {}

  /**
   * Auto-tag from billing: partner name, service category
   */
  async tagFromBilling(params: {
    entityId: string;
    workItemId: string;
    partnerName?: string;
    serviceCategory?: string;
    contractType?: string;
  }): Promise<void> {
    const tagNames: string[] = [];
    if (params.partnerName) tagNames.push(params.partnerName);
    if (params.serviceCategory) tagNames.push(params.serviceCategory);
    if (params.contractType) tagNames.push(params.contractType);

    await this.assignTagsByNames(params.entityId, params.workItemId, tagNames, 3);
  }

  /**
   * Auto-tag from drive: file name, folder name
   */
  async tagFromDrive(params: {
    entityId: string;
    workItemId: string;
    fileName?: string;
    folderName?: string;
  }): Promise<void> {
    const tagNames: string[] = [];
    if (params.folderName) tagNames.push(params.folderName);

    if (params.fileName) {
      // Extract meaningful parts from filename (remove extension and common prefixes)
      const name = params.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const terms = this.extractKeyTerms(name);
      tagNames.push(...terms);
    }

    await this.assignTagsByNames(params.entityId, params.workItemId, tagNames, 3);
  }

  private async assignTagsByNames(
    entityId: string,
    workItemId: string,
    tagNames: string[],
    level: number,
  ): Promise<void> {
    const uniqueNames = [...new Set(tagNames.filter(Boolean))];

    for (const name of uniqueNames) {
      try {
        const tag = await this.normalizationService.normalizeTag(entityId, name, level);
        await this.assignmentService.assignTag({
          workItemId,
          tagId: tag.tagId,
          source: 'SYSTEM',
          confidence: 0.7,
          weight: 0.5,
        });
      } catch (error) {
        this.logger.warn(`Failed to assign tag "${name}": ${error}`);
      }
    }
  }

  private extractKeyTerms(text: string): string[] {
    // Remove common stop words and extract meaningful 2+ character terms
    const stopWords = new Set([
      're', 'fw', 'fwd', 'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
      'and', 'or', 'not', 'no', 'but', 'if', 'so', 'as',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣ㄱ-ㅎ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w))
      .slice(0, 5);
  }
}
