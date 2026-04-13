import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { WorkItemEntity } from '../../acl/entity/work-item.entity';
import { KmsWorkItemTagEntity } from '../../kms/entity/kms-work-item-tag.entity';
import { KmsTagEntity } from '../../kms/entity/kms-tag.entity';
import { CellAccessService } from '../../members/service/cell-access.service';

export interface SearchResult {
  id: string;
  module: string;
  type: string;
  title: string;
  snippet: string;
  tags: { tagId: string; name: string; display: string; level: number; color: string | null }[];
  createdAt: string;
  refId: string | null;
}

export interface SearchResponse {
  totalCount: number;
  results: SearchResult[];
  relatedTags: { tagId: string; name: string; display: string; usageCount: number }[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepo: Repository<WorkItemEntity>,
    @InjectRepository(KmsWorkItemTagEntity)
    private readonly workItemTagRepo: Repository<KmsWorkItemTagEntity>,
    @InjectRepository(KmsTagEntity)
    private readonly tagRepo: Repository<KmsTagEntity>,
    private readonly cellAccessService: CellAccessService,
  ) {}

  async search(params: {
    entityId: string;
    userId: string;
    q?: string;
    modules?: string[];
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<SearchResponse> {
    const limit = Math.min(params.limit || 20, 100);
    const offset = params.offset || 0;

    const qb = this.workItemRepo
      .createQueryBuilder('wi')
      .where('wi.entId = :entityId', { entityId: params.entityId })
      .andWhere('wi.witDeletedAt IS NULL');

    // Visibility: user can see their own, shared/entity/public, and CELL items they belong to
    const userCellIds = await this.cellAccessService.getUserCellIds(params.userId);
    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where('wi.witOwnerId = :userId', { userId: params.userId })
          .orWhere('wi.witVisibility IN (:...visibilities)', { visibilities: ['SHARED', 'UNIT', 'ENTITY', 'PUBLIC'] });
        if (userCellIds.length > 0) {
          sub.orWhere(
            new Brackets((grpSub) => {
              grpSub
                .where('wi.witVisibility = :cellVis', { cellVis: 'CELL' })
                .andWhere('wi.witCellId IN (:...userCellIds)', { userCellIds });
            }),
          );
        }
      }),
    );

    // Module filter
    if (params.modules?.length) {
      qb.andWhere('wi.witModule IN (:...modules)', { modules: params.modules });
    }

    // Text search
    if (params.q) {
      qb.andWhere(
        '(wi.witTitle ILIKE :search OR wi.witContent ILIKE :search)',
        { search: `%${params.q}%` },
      );
    }

    // Tag filter: find work items that have ALL specified tags
    if (params.tags?.length) {
      const tagSubQuery = this.workItemTagRepo
        .createQueryBuilder('wt')
        .select('wt.wit_id')
        .innerJoin(KmsTagEntity, 't', 't.tag_id = wt.tag_id')
        .where('t.tag_name IN (:...tagNames)', { tagNames: params.tags })
        .groupBy('wt.wit_id')
        .having('COUNT(DISTINCT t.tag_name) = :tagCount', { tagCount: params.tags.length });

      qb.andWhere(`wi.witId IN (${tagSubQuery.getQuery()})`);
      qb.setParameters(tagSubQuery.getParameters());
    }

    // Date range
    if (params.dateFrom) {
      qb.andWhere('wi.witCreatedAt >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb.andWhere('wi.witCreatedAt <= :dateTo', { dateTo: `${params.dateTo}T23:59:59` });
    }

    qb.orderBy('wi.witUpdatedAt', 'DESC');

    const totalCount = await qb.getCount();
    const workItems = await qb.skip(offset).take(limit).getMany();

    // Get tags for each work item
    const results: SearchResult[] = [];
    for (const wi of workItems) {
      const tags = await this.getTagsForWorkItem(wi.witId);
      results.push({
        id: wi.witId,
        module: wi.witModule || 'unknown',
        type: wi.witType,
        title: wi.witTitle,
        snippet: this.createSnippet(wi.witContent, params.q),
        tags,
        createdAt: wi.witCreatedAt.toISOString(),
        refId: wi.witRefId || null,
      });
    }

    // Get related tags (top tags from matching results)
    const relatedTags = await this.getRelatedTags(params.entityId, params.q);

    return { totalCount, results, relatedTags };
  }

  async searchTags(entityId: string, query: string, limit = 10) {
    return this.tagRepo
      .createQueryBuilder('t')
      .where('t.entId = :entityId', { entityId })
      .andWhere('(t.tagName ILIKE :q OR t.tagDisplay ILIKE :q OR t.tagNameLocal ILIKE :q)', { q: `%${query}%` })
      .orderBy('t.tagUsageCount', 'DESC')
      .take(limit)
      .getMany()
      .then((tags) => tags.map((t) => ({
        tagId: t.tagId,
        name: t.tagName,
        display: t.tagDisplay,
        nameLocal: t.tagNameLocal,
        level: t.tagLevel,
        usageCount: t.tagUsageCount,
      })));
  }

  private async getTagsForWorkItem(workItemId: string) {
    const wits = await this.workItemTagRepo.find({
      where: { witId: workItemId },
      relations: ['tag'],
    });
    return wits
      .filter((wt) => wt.tag)
      .map((wt) => ({
        tagId: wt.tag.tagId,
        name: wt.tag.tagName,
        display: wt.tag.tagDisplay,
        level: wt.tag.tagLevel,
        color: wt.tag.tagColor || null,
      }));
  }

  private async getRelatedTags(entityId: string, query?: string) {
    const qb = this.tagRepo
      .createQueryBuilder('t')
      .where('t.entId = :entityId', { entityId })
      .andWhere('t.tagUsageCount > 0')
      .orderBy('t.tagUsageCount', 'DESC')
      .take(10);

    if (query) {
      qb.andWhere('(t.tagName ILIKE :q OR t.tagDisplay ILIKE :q)', { q: `%${query}%` });
    }

    const tags = await qb.getMany();
    return tags.map((t) => ({
      tagId: t.tagId,
      name: t.tagName,
      display: t.tagDisplay,
      usageCount: t.tagUsageCount,
    }));
  }

  private createSnippet(content: string | null, query?: string): string {
    if (!content) return '';
    const maxLen = 200;

    if (query) {
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const idx = lowerContent.indexOf(lowerQuery);
      if (idx >= 0) {
        const start = Math.max(0, idx - 50);
        const end = Math.min(content.length, idx + query.length + 150);
        const snippet = (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
        return snippet;
      }
    }

    return content.length > maxLen ? content.slice(0, maxLen) + '...' : content;
  }
}
