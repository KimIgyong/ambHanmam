import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DddGaugeScoreEntity } from '../../entity/ddd-gauge-score.entity';
import { CreateGaugeScoreDto, BulkCreateGaugeScoreDto } from '../../dto/request/create-gauge-score.dto';

@Injectable()
export class DddGaugeService {
  private readonly logger = new Logger(DddGaugeService.name);

  constructor(
    @InjectRepository(DddGaugeScoreEntity)
    private readonly gaugeRepository: Repository<DddGaugeScoreEntity>,
  ) {}

  async findByDashboard(
    ddbId: string,
    period?: string,
  ): Promise<DddGaugeScoreEntity[]> {
    const where: any = { ddbId };
    if (period) where.gscPeriod = period;

    return this.gaugeRepository.find({
      where,
      order: { gscPeriod: 'DESC', gscDimension: 'ASC' },
    });
  }

  async getLatestScores(
    ddbId: string,
  ): Promise<{ period: string; scores: { dimension: string; score: number; prevScore: number; assessedBy: string }[] } | null> {
    // Get most recent period
    const latest = await this.gaugeRepository.findOne({
      where: { ddbId },
      order: { gscPeriod: 'DESC' },
    });
    if (!latest) return null;

    const scores = await this.gaugeRepository.find({
      where: { ddbId, gscPeriod: latest.gscPeriod },
      order: { gscDimension: 'ASC' },
    });

    return {
      period: latest.gscPeriod,
      scores: scores.map((s) => ({
        dimension: s.gscDimension,
        score: Number(s.gscScore),
        prevScore: Number(s.gscPrevScore),
        assessedBy: s.gscAssessedBy,
      })),
    };
  }

  async createOrUpdate(
    ddbId: string,
    dto: CreateGaugeScoreDto,
  ): Promise<DddGaugeScoreEntity> {
    const existing = await this.gaugeRepository.findOne({
      where: { ddbId, gscPeriod: dto.period, gscDimension: dto.dimension },
    });

    if (existing) {
      existing.gscPrevScore = existing.gscScore;
      existing.gscScore = dto.score;
      existing.gscDetails = dto.details ?? existing.gscDetails;
      existing.gscAssessedBy = dto.assessed_by ?? existing.gscAssessedBy;
      return this.gaugeRepository.save(existing);
    }

    // Get previous period score
    const prev = await this.gaugeRepository.findOne({
      where: { ddbId, gscDimension: dto.dimension },
      order: { gscPeriod: 'DESC' },
    });

    const entity = this.gaugeRepository.create({
      ddbId,
      gscPeriod: dto.period,
      gscDimension: dto.dimension,
      gscScore: dto.score,
      gscPrevScore: prev?.gscScore ?? undefined,
      gscDetails: dto.details ?? undefined,
      gscAssessedBy: dto.assessed_by ?? 'MANAGER',
    } as Partial<DddGaugeScoreEntity>);

    return this.gaugeRepository.save(entity);
  }

  async bulkCreateOrUpdate(
    ddbId: string,
    dto: BulkCreateGaugeScoreDto,
  ): Promise<DddGaugeScoreEntity[]> {
    const results: DddGaugeScoreEntity[] = [];
    for (const score of dto.scores) {
      const result = await this.createOrUpdate(ddbId, {
        period: dto.period,
        dimension: score.dimension,
        score: score.score,
        details: score.details,
      });
      results.push(result);
    }
    return results;
  }

  async getTimeSeries(
    ddbId: string,
    dimension: string,
    limit = 8,
  ): Promise<DddGaugeScoreEntity[]> {
    return this.gaugeRepository.find({
      where: { ddbId, gscDimension: dimension },
      order: { gscPeriod: 'DESC' },
      take: limit,
    });
  }
}
