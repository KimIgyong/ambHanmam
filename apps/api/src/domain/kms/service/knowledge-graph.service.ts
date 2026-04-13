import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsTagEntity } from '../entity/kms-tag.entity';
import { KmsTagRelationEntity } from '../entity/kms-tag-relation.entity';
import { KmsWorkItemTagEntity } from '../entity/kms-work-item-tag.entity';
import {
  KnowledgeGraphResponse,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  TagRelationType,
} from '@amb/types';

@Injectable()
export class KnowledgeGraphService {
  private readonly logger = new Logger(KnowledgeGraphService.name);

  constructor(
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
    @InjectRepository(KmsTagRelationEntity)
    private readonly relationRepository: Repository<KmsTagRelationEntity>,
    @InjectRepository(KmsWorkItemTagEntity)
    private readonly witTagRepository: Repository<KmsWorkItemTagEntity>,
  ) {}

  async getKnowledgeGraph(params: {
    entityId: string;
    minUsage?: number;
    maxNodes?: number;
  }): Promise<KnowledgeGraphResponse> {
    const { entityId, minUsage = 1, maxNodes = 100 } = params;

    // Get tags with minimum usage
    const tags = await this.tagRepository.find({
      where: { entId: entityId },
      order: { tagUsageCount: 'DESC' },
      take: maxNodes,
    });

    const filteredTags = tags.filter((t) => t.tagUsageCount >= minUsage);

    const nodes: KnowledgeGraphNode[] = filteredTags.map((tag) => ({
      id: tag.tagId,
      name: tag.tagDisplay,
      level: tag.tagLevel as 1 | 2 | 3,
      color: tag.tagColor || null,
      weight: tag.tagUsageCount,
    }));

    const tagIds = filteredTags.map((t) => t.tagId);

    // Get explicit relations
    const relations = tagIds.length > 0
      ? await this.relationRepository
          .createQueryBuilder('rel')
          .where('rel.tag_source_id IN (:...tagIds)', { tagIds })
          .andWhere('rel.tag_target_id IN (:...tagIds)', { tagIds })
          .getMany()
      : [];

    const edges: KnowledgeGraphEdge[] = relations.map((rel) => ({
      source: rel.tagSourceId,
      target: rel.tagTargetId,
      type: rel.trlType as TagRelationType,
      weight: Number(rel.trlWeight),
    }));

    // Add parent-child edges from tag hierarchy
    for (const tag of filteredTags) {
      if (tag.tagParentId && tagIds.includes(tag.tagParentId)) {
        const exists = edges.some(
          (e) => e.source === tag.tagParentId && e.target === tag.tagId && e.type === 'PARENT_CHILD',
        );
        if (!exists) {
          edges.push({
            source: tag.tagParentId,
            target: tag.tagId,
            type: 'PARENT_CHILD',
            weight: 1.0,
          });
        }
      }
    }

    // Add co-occurrence edges
    if (tagIds.length > 0) {
      const coOccurrences = await this.getCoOccurrences(tagIds);
      for (const co of coOccurrences) {
        const exists = edges.some(
          (e) =>
            (e.source === co.source && e.target === co.target) ||
            (e.source === co.target && e.target === co.source),
        );
        if (!exists && co.count >= 2) {
          edges.push({
            source: co.source,
            target: co.target,
            type: 'RELATED',
            weight: Math.min(1, co.count / 10),
          });
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Analyze co-occurrence patterns and update tag relations.
   */
  async analyzeCoOccurrences(entityId: string): Promise<void> {
    const tags = await this.tagRepository.find({
      where: { entId: entityId },
    });
    const tagIds = tags.map((t) => t.tagId);

    if (tagIds.length === 0) return;

    const coOccurrences = await this.getCoOccurrences(tagIds);

    for (const co of coOccurrences) {
      if (co.count < 2) continue;

      const jaccardSimilarity = await this.calculateJaccard(co.source, co.target);

      // Update or create relation
      let relation = await this.relationRepository.findOne({
        where: { tagSourceId: co.source, tagTargetId: co.target, trlType: 'RELATED' },
      });

      if (relation) {
        relation.trlCoOccur = co.count;
        relation.trlWeight = jaccardSimilarity;
        await this.relationRepository.save(relation);
      } else if (jaccardSimilarity > 0.1) {
        await this.relationRepository.save(
          this.relationRepository.create({
            tagSourceId: co.source,
            tagTargetId: co.target,
            trlType: 'RELATED',
            trlWeight: jaccardSimilarity,
            trlCoOccur: co.count,
          }),
        );
      }
    }
  }

  private async getCoOccurrences(
    tagIds: string[],
  ): Promise<{ source: string; target: string; count: number }[]> {
    if (tagIds.length === 0) return [];

    const results = await this.witTagRepository
      .createQueryBuilder('a')
      .innerJoin(KmsWorkItemTagEntity, 'b', 'a.wit_id = b.wit_id AND a.tag_id < b.tag_id')
      .where('a.tag_id IN (:...tagIds)', { tagIds })
      .andWhere('b.tag_id IN (:...tagIds)', { tagIds })
      .select('a.tag_id', 'source')
      .addSelect('b.tag_id', 'target')
      .addSelect('COUNT(*)', 'count')
      .groupBy('a.tag_id')
      .addGroupBy('b.tag_id')
      .having('COUNT(*) >= 2')
      .orderBy('COUNT(*)', 'DESC')
      .limit(200)
      .getRawMany();

    return results.map((r) => ({
      source: r.source,
      target: r.target,
      count: parseInt(r.count, 10),
    }));
  }

  private async calculateJaccard(tagAId: string, tagBId: string): Promise<number> {
    const [countA, countB, intersection] = await Promise.all([
      this.witTagRepository.count({ where: { tagId: tagAId } }),
      this.witTagRepository.count({ where: { tagId: tagBId } }),
      this.witTagRepository
        .createQueryBuilder('a')
        .innerJoin(KmsWorkItemTagEntity, 'b', 'a.wit_id = b.wit_id')
        .where('a.tag_id = :tagAId', { tagAId })
        .andWhere('b.tag_id = :tagBId', { tagBId })
        .getCount(),
    ]);

    const union = countA + countB - intersection;
    return union === 0 ? 0 : Math.round((intersection / union) * 1000) / 1000;
  }
}
