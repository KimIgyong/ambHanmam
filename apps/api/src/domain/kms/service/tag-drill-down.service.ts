import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsWorkItemTagEntity } from '../entity/kms-work-item-tag.entity';
import { KmsTagEntity } from '../entity/kms-tag.entity';
import { KmsTagRelationEntity } from '../entity/kms-tag-relation.entity';
import { TagCloudScope } from '@amb/types';

export interface TagDetailResponse {
  tag: {
    tagId: string;
    name: string;
    display: string;
    nameLocal: string | null;
    level: number;
    color: string | null;
    usageCount: number;
  };
  scopeStats: {
    my: { count: number; weight: number };
    team: { count: number; weight: number };
    company: { count: number; weight: number };
  };
  relatedTags: { tagId: string; name: string; display: string; coOccurrence: number }[];
  timeline: { date: string; count: number }[];
  recentItems: { witId: string; title: string; date: string }[];
}

@Injectable()
export class TagDrillDownService {
  constructor(
    @InjectRepository(KmsWorkItemTagEntity)
    private readonly witTagRepository: Repository<KmsWorkItemTagEntity>,
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
    @InjectRepository(KmsTagRelationEntity)
    private readonly relationRepository: Repository<KmsTagRelationEntity>,
  ) {}

  async getTagDetail(params: {
    tagId: string;
    userId: string;
    departmentId?: string;
    includeComparison?: boolean;
  }): Promise<TagDetailResponse> {
    const tag = await this.tagRepository.findOne({
      where: { tagId: params.tagId },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    const [scopeStats, relatedTags, timeline, recentItems] = await Promise.all([
      this.getScopeStats(params.tagId, params.userId, params.departmentId),
      this.getRelatedTags(params.tagId, tag.entId),
      this.getTimeline(params.tagId, 30),
      this.getRecentItems(params.tagId, 10),
    ]);

    return {
      tag: {
        tagId: tag.tagId,
        name: tag.tagName,
        display: tag.tagDisplay,
        nameLocal: tag.tagNameLocal || null,
        level: tag.tagLevel,
        color: tag.tagColor || null,
        usageCount: tag.tagUsageCount,
      },
      scopeStats,
      relatedTags,
      timeline,
      recentItems,
    };
  }

  private async getScopeStats(
    tagId: string,
    userId: string,
    departmentId?: string,
  ): Promise<TagDetailResponse['scopeStats']> {
    // MY scope
    const myItems = await this.witTagRepository
      .createQueryBuilder('wit')
      .innerJoin('wit.workItem', 'wi')
      .where('wit.tag_id = :tagId', { tagId })
      .andWhere('wi.wit_owner_id = :userId', { userId })
      .getMany();

    const myCount = myItems.length;
    const myWeight = myItems.reduce((sum, i) => sum + Number(i.wttWeight), 0);

    // TEAM scope
    let teamCount = 0;
    let teamWeight = 0;
    if (departmentId) {
      const teamItems = await this.witTagRepository
        .createQueryBuilder('wit')
        .innerJoin('wit.workItem', 'wi')
        .where('wit.tag_id = :tagId', { tagId })
        .andWhere(
          `wi.wit_owner_id IN (
            SELECT udr.usr_id FROM amb_user_dept_roles udr
            WHERE udr.dep_id = :departmentId
          )`,
          { departmentId },
        )
        .getMany();
      teamCount = teamItems.length;
      teamWeight = teamItems.reduce((sum, i) => sum + Number(i.wttWeight), 0);
    }

    // COMPANY scope
    const companyItems = await this.witTagRepository
      .createQueryBuilder('wit')
      .where('wit.tag_id = :tagId', { tagId })
      .getMany();
    const companyCount = companyItems.length;
    const companyWeight = companyItems.reduce((sum, i) => sum + Number(i.wttWeight), 0);

    return {
      my: { count: myCount, weight: Math.round(myWeight * 100) / 100 },
      team: { count: teamCount, weight: Math.round(teamWeight * 100) / 100 },
      company: { count: companyCount, weight: Math.round(companyWeight * 100) / 100 },
    };
  }

  private async getRelatedTags(
    tagId: string,
    entityId: string,
  ): Promise<TagDetailResponse['relatedTags']> {
    // Find tags that co-occur with this tag on the same work items
    const coOccurring = await this.witTagRepository
      .createQueryBuilder('wit1')
      .innerJoin(KmsWorkItemTagEntity, 'wit2', 'wit1.wit_id = wit2.wit_id AND wit2.tag_id != :tagId')
      .innerJoin(KmsTagEntity, 'tag', 'tag.tag_id = wit2.tag_id')
      .where('wit1.tag_id = :tagId', { tagId })
      .select('tag.tag_id', 'tagId')
      .addSelect('tag.tag_name', 'name')
      .addSelect('tag.tag_display', 'display')
      .addSelect('COUNT(*)', 'coOccurrence')
      .groupBy('tag.tag_id')
      .addGroupBy('tag.tag_name')
      .addGroupBy('tag.tag_display')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    return coOccurring.map((r) => ({
      tagId: r.tagId,
      name: r.name,
      display: r.display,
      coOccurrence: parseInt(r.coOccurrence, 10),
    }));
  }

  private async getTimeline(
    tagId: string,
    days: number,
  ): Promise<TagDetailResponse['timeline']> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const results = await this.witTagRepository
      .createQueryBuilder('wit')
      .where('wit.tag_id = :tagId', { tagId })
      .andWhere('wit.wtt_created_at >= :sinceDate', { sinceDate })
      .select("TO_CHAR(wit.wtt_created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(wit.wtt_created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
    }));
  }

  private async getRecentItems(
    tagId: string,
    limit: number,
  ): Promise<TagDetailResponse['recentItems']> {
    const items = await this.witTagRepository
      .createQueryBuilder('wit')
      .innerJoin('wit.workItem', 'wi', 'wi.wit_deleted_at IS NULL')
      .where('wit.tag_id = :tagId', { tagId })
      .select('wit.wit_id', 'witId')
      .addSelect('wi.wit_title', 'title')
      .addSelect('wit.wtt_created_at', 'date')
      .orderBy('wit.wtt_created_at', 'DESC')
      .limit(limit)
      .getRawMany();

    return items.map((i) => ({
      witId: i.witId,
      title: i.title || '',
      date: i.date ? new Date(i.date).toISOString() : new Date().toISOString(),
    }));
  }
}
