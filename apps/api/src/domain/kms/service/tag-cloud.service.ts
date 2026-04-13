import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsWorkItemTagEntity } from '../entity/kms-work-item-tag.entity';
import { KmsTagEntity } from '../entity/kms-tag.entity';
import { TagCloudItemResponse, TagCloudResponse, TagCloudScope } from '@amb/types';

interface TagCloudParams {
  userId: string;
  entityId: string;
  scope: TagCloudScope;
  level?: number;
  period?: number; // days
  maxTags?: number;
  departmentId?: string;
}

@Injectable()
export class TagCloudService {
  private readonly logger = new Logger(TagCloudService.name);

  constructor(
    @InjectRepository(KmsWorkItemTagEntity)
    private readonly witTagRepository: Repository<KmsWorkItemTagEntity>,
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
  ) {}

  async getTagCloud(params: TagCloudParams): Promise<TagCloudResponse> {
    const {
      userId,
      entityId,
      scope,
      level,
      period = 30,
      maxTags = 50,
    } = params;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - period);

    let query = this.witTagRepository
      .createQueryBuilder('wit')
      .innerJoinAndSelect('wit.tag', 'tag')
      .innerJoin('wit.workItem', 'wi')
      .where('tag.ent_id = :entityId', { entityId })
      .andWhere('wit.wtt_created_at >= :sinceDate', { sinceDate })
      .andWhere("wit.wtt_source != 'USER_REJECTED'");

    // Scope filtering
    if (scope === 'MY') {
      query = query.andWhere('wi.wit_owner_id = :userId', { userId });
    } else if (scope === 'TEAM' && params.departmentId) {
      // Team scope: items owned by users in the same department
      query = query.andWhere(
        `wi.wit_owner_id IN (
          SELECT udr.usr_id FROM amb_user_dept_roles udr
          WHERE udr.dep_id = :departmentId
          AND (udr.udr_ended_at IS NULL OR udr.udr_ended_at > NOW())
        )`,
        { departmentId: params.departmentId },
      );
    }
    // COMPANY scope: no additional filter (all entity items)

    if (level) {
      query = query.andWhere('tag.tag_level = :level', { level });
    }

    const rawItems = await query.getMany();

    // Aggregate by tag
    const tagMap = new Map<string, {
      tag: KmsTagEntity;
      count: number;
      totalWeight: number;
      dates: Date[];
    }>();

    for (const item of rawItems) {
      const existing = tagMap.get(item.tagId);
      if (existing) {
        existing.count++;
        existing.totalWeight += Number(item.wttWeight);
        existing.dates.push(item.wttCreatedAt);
      } else {
        tagMap.set(item.tagId, {
          tag: item.tag,
          count: 1,
          totalWeight: Number(item.wttWeight),
          dates: [item.wttCreatedAt],
        });
      }
    }

    // Calculate weighted scores based on scope
    const tags: TagCloudItemResponse[] = [];
    const now = Date.now();

    for (const [, value] of tagMap) {
      const avgWeight = value.totalWeight / value.count;
      const recencyScore = this.calculateRecencyScore(value.dates, now, period);

      let scopeWeight: number;
      if (scope === 'MY') {
        // MY: recency=0.30, personal_intensity=0.10
        scopeWeight = avgWeight * 0.6 + recencyScore * 0.3 + (value.count / rawItems.length) * 0.1;
      } else if (scope === 'TEAM') {
        // TEAM: team_coverage=0.10, user_diversity=0.15
        scopeWeight = avgWeight * 0.5 + recencyScore * 0.25 + (value.count / rawItems.length) * 0.25;
      } else {
        // COMPANY: cross_dept_spread=0.20, unique_users_ratio=0.20
        scopeWeight = avgWeight * 0.4 + recencyScore * 0.2 + (value.count / rawItems.length) * 0.4;
      }

      const trend = this.calculateTrend(value.dates, period);

      tags.push({
        tagId: value.tag.tagId,
        name: value.tag.tagName,
        display: value.tag.tagDisplay,
        nameLocal: value.tag.tagNameLocal || null,
        level: value.tag.tagLevel as 1 | 2 | 3,
        color: value.tag.tagColor || null,
        weight: Math.round(scopeWeight * 1000) / 1000,
        count: value.count,
        trend,
        relatedTags: [], // Populated separately if needed
      });
    }

    // Sort by weight and limit
    tags.sort((a, b) => b.weight - a.weight);
    const limitedTags = tags.slice(0, maxTags);

    return {
      scope,
      period: `${period}d`,
      tags: limitedTags,
      totalItems: rawItems.length,
      generatedAt: new Date().toISOString(),
    };
  }

  private calculateRecencyScore(dates: Date[], now: number, periodDays: number): number {
    const periodMs = periodDays * 24 * 60 * 60 * 1000;
    let score = 0;
    for (const date of dates) {
      const age = now - date.getTime();
      score += Math.max(0, 1 - age / periodMs);
    }
    return score / dates.length;
  }

  private calculateTrend(dates: Date[], periodDays: number): 'up' | 'down' | 'stable' {
    if (dates.length < 2) return 'stable';

    const midpoint = new Date();
    midpoint.setDate(midpoint.getDate() - periodDays / 2);

    const recentCount = dates.filter((d) => d >= midpoint).length;
    const olderCount = dates.filter((d) => d < midpoint).length;

    if (recentCount > olderCount * 1.3) return 'up';
    if (olderCount > recentCount * 1.3) return 'down';
    return 'stable';
  }
}
