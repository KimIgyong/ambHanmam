import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsWorkItemTagEntity } from '../entity/kms-work-item-tag.entity';
import { KmsTagEntity } from '../entity/kms-tag.entity';

interface WeightFactors {
  aiConfidence: number;
  termFrequency: number;
  positionScore: number;
  orgFrequency: number;
  recencyBoost: number;
}

@Injectable()
export class TagWeightService {
  constructor(
    @InjectRepository(KmsWorkItemTagEntity)
    private readonly witTagRepository: Repository<KmsWorkItemTagEntity>,
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
  ) {}

  /**
   * Calculate composite tag weight:
   * weight = 0.3*ai_confidence + 0.2*term_frequency + 0.2*position_score + 0.15*org_frequency + 0.15*recency_boost
   */
  calculateWeight(factors: WeightFactors): number {
    return (
      0.3 * factors.aiConfidence +
      0.2 * factors.termFrequency +
      0.2 * factors.positionScore +
      0.15 * factors.orgFrequency +
      0.15 * factors.recencyBoost
    );
  }

  /**
   * Recalculate weight for a specific work item tag.
   */
  async recalculateWeight(witTagId: string): Promise<number> {
    const witTag = await this.witTagRepository.findOne({
      where: { witTagId: witTagId },
      relations: ['tag'],
    });

    if (!witTag) return 0;

    const aiConfidence = witTag.wttConfidence ? Number(witTag.wttConfidence) : 0.5;
    const orgFrequency = await this.getOrgFrequencyScore(witTag.tagId);
    const recencyBoost = this.getRecencyBoost(witTag.wttCreatedAt);

    const weight = this.calculateWeight({
      aiConfidence,
      termFrequency: 0.5, // Default; can be refined with content analysis
      positionScore: 0.5, // Default; can be refined with position detection
      orgFrequency,
      recencyBoost,
    });

    await this.witTagRepository.update(witTagId, { wttWeight: weight });
    return weight;
  }

  /**
   * Get organization frequency score (how commonly the tag is used org-wide).
   * Normalized to 0-1 range.
   */
  private async getOrgFrequencyScore(tagId: string): Promise<number> {
    const tag = await this.tagRepository.findOne({ where: { tagId } });
    if (!tag) return 0;

    // Get max usage count in the entity for normalization
    const maxResult = await this.tagRepository
      .createQueryBuilder('tag')
      .select('MAX(tag.tag_usage_count)', 'maxCount')
      .where('tag.ent_id = :entId', { entId: tag.entId })
      .getRawOne();

    const maxCount = maxResult?.maxCount || 1;
    return Math.min(1, tag.tagUsageCount / maxCount);
  }

  /**
   * Calculate recency boost (recent tags get higher scores).
   * Decays over 30 days.
   */
  private getRecencyBoost(createdAt: Date): number {
    const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysSince / 30);
  }
}
