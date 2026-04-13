import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityWeightConfigEntity } from '../entity/activity-weight-config.entity';

const DEFAULT_WEIGHTS: Record<string, { weight: number; engagementWeight: number; dailyCap: number | null }> = {
  ISSUE: { weight: 5, engagementWeight: 5, dailyCap: null },
  MEETING_NOTE: { weight: 4, engagementWeight: 4, dailyCap: null },
  COMMENT: { weight: 4, engagementWeight: 4, dailyCap: null },
  TODO: { weight: 2, engagementWeight: 2, dailyCap: null },
  CHAT_MESSAGE: { weight: 1, engagementWeight: 1, dailyCap: 50 },
};

const CATEGORIES = ['ISSUE', 'MEETING_NOTE', 'COMMENT', 'TODO', 'CHAT_MESSAGE'];

@Injectable()
export class ActivityWeightService {
  constructor(
    @InjectRepository(ActivityWeightConfigEntity)
    private readonly weightRepo: Repository<ActivityWeightConfigEntity>,
  ) {}

  async getWeights(entityId: string) {
    const configs = await this.weightRepo.find({ where: { entId: entityId } });
    return CATEGORIES.map((cat) => {
      const existing = configs.find((c) => c.awcCategory === cat);
      const def = DEFAULT_WEIGHTS[cat];
      return {
        category: cat,
        weight: existing?.awcWeight ?? def.weight,
        engagementWeight: existing?.awcEngagementWeight ?? def.engagementWeight,
        dailyCap: existing?.awcDailyCap ?? def.dailyCap,
      };
    });
  }

  async getWeightMap(entityId: string): Promise<
    Record<string, { weight: number; engagementWeight: number; dailyCap: number | null }>
  > {
    const list = await this.getWeights(entityId);
    const map: Record<string, { weight: number; engagementWeight: number; dailyCap: number | null }> = {};
    list.forEach((w) => { map[w.category] = w; });
    return map;
  }

  async updateWeights(
    entityId: string,
    userId: string,
    weights: { category: string; weight: number; engagement_weight: number; daily_cap?: number | null }[],
  ) {
    for (const w of weights) {
      if (!CATEGORIES.includes(w.category)) continue;
      const existing = await this.weightRepo.findOne({
        where: { entId: entityId, awcCategory: w.category },
      });
      if (existing) {
        existing.awcWeight = w.weight;
        existing.awcEngagementWeight = w.engagement_weight;
        existing.awcDailyCap = w.daily_cap ?? null;
        existing.awcUpdatedBy = userId;
        await this.weightRepo.save(existing);
      } else {
        await this.weightRepo.save(
          this.weightRepo.create({
            entId: entityId,
            awcCategory: w.category,
            awcWeight: w.weight,
            awcEngagementWeight: w.engagement_weight,
            awcDailyCap: w.daily_cap ?? null,
            awcUpdatedBy: userId,
          }),
        );
      }
    }
    return this.getWeights(entityId);
  }
}
