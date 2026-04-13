import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DddSnapshotEntity } from '../../entity/ddd-snapshot.entity';
import { DddMetricEntity } from '../../entity/ddd-metric.entity';
import { CreateSnapshotDto, BulkCreateSnapshotDto } from '../../dto/request/create-snapshot.dto';

@Injectable()
export class DddSnapshotService {
  private readonly logger = new Logger(DddSnapshotService.name);

  constructor(
    @InjectRepository(DddSnapshotEntity)
    private readonly snapshotRepository: Repository<DddSnapshotEntity>,
    @InjectRepository(DddMetricEntity)
    private readonly metricRepository: Repository<DddMetricEntity>,
  ) {}

  async findByDashboard(
    ddbId: string,
    options?: { period?: string; stage?: string },
  ): Promise<DddSnapshotEntity[]> {
    const qb = this.snapshotRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.metric', 'm')
      .where('s.ddbId = :ddbId', { ddbId });

    if (options?.period) {
      qb.andWhere('s.snpPeriod = :period', { period: options.period });
    }

    if (options?.stage) {
      qb.andWhere('m.metStage = :stage', { stage: options.stage });
    }

    return qb.orderBy('m.metStage', 'ASC').addOrderBy('m.metOrder', 'ASC').getMany();
  }

  async getTimeSeries(
    ddbId: string,
    metId: string,
    limit = 8,
  ): Promise<DddSnapshotEntity[]> {
    return this.snapshotRepository.find({
      where: { ddbId, metId },
      order: { snpPeriod: 'DESC' },
      take: limit,
    });
  }

  async create(
    ddbId: string,
    userId: string,
    dto: CreateSnapshotDto,
  ): Promise<DddSnapshotEntity> {
    // Validate metric exists
    const metric = await this.metricRepository.findOne({
      where: { metId: dto.metric_id },
    });
    if (!metric) {
      throw new BadRequestException(`Metric ${dto.metric_id} not found`);
    }

    // Check if snapshot already exists for this period
    const existing = await this.snapshotRepository.findOne({
      where: { ddbId, metId: dto.metric_id, snpPeriod: dto.period },
    });
    if (existing) {
      // Update existing
      existing.snpPrevValue = existing.snpValue;
      existing.snpValue = dto.value;
      existing.snpTarget = dto.target ?? existing.snpTarget;
      existing.snpStatus = dto.status ?? existing.snpStatus;
      existing.snpAnnotation = dto.annotation ?? existing.snpAnnotation;
      existing.snpRawData = dto.raw_data ?? existing.snpRawData;
      existing.snpSourceType = 'MANUAL';

      // Calculate change rate
      if (existing.snpPrevValue && existing.snpPrevValue !== 0) {
        existing.snpChangeRate = Number(
          (((dto.value - Number(existing.snpPrevValue)) / Number(existing.snpPrevValue)) * 100).toFixed(4),
        );
      }

      return this.snapshotRepository.save(existing);
    }

    // Get previous period value
    const prevSnapshot = await this.getPreviousSnapshot(ddbId, dto.metric_id, dto.period);

    const entity = this.snapshotRepository.create({
      ddbId,
      metId: dto.metric_id,
      snpPeriod: dto.period,
      snpValue: dto.value,
      snpPrevValue: prevSnapshot?.snpValue ?? undefined,
      snpChangeRate: prevSnapshot?.snpValue
        ? Number((((dto.value - Number(prevSnapshot.snpValue)) / Number(prevSnapshot.snpValue)) * 100).toFixed(4))
        : undefined,
      snpTarget: dto.target ?? undefined,
      snpStatus: dto.status ?? 'ON_TRACK',
      snpSourceType: 'MANUAL',
      snpAnnotation: dto.annotation ?? undefined,
      snpRawData: dto.raw_data ?? undefined,
      snpCreatedBy: userId,
    } as Partial<DddSnapshotEntity>);

    return this.snapshotRepository.save(entity);
  }

  async bulkCreate(
    ddbId: string,
    userId: string,
    dto: BulkCreateSnapshotDto,
  ): Promise<DddSnapshotEntity[]> {
    const results: DddSnapshotEntity[] = [];
    for (const snap of dto.snapshots) {
      const result = await this.create(ddbId, userId, {
        metric_id: snap.metric_id,
        period: dto.period,
        value: snap.value,
        target: snap.target,
        annotation: snap.annotation,
      });
      results.push(result);
    }
    return results;
  }

  async getStageOverview(
    ddbId: string,
    period: string,
  ): Promise<{ stage: string; metrics: { metKey: string; label: any; value: number; target: number; changeRate: number; status: string; isPrimary: boolean }[] }[]> {
    const snapshots = await this.findByDashboard(ddbId, { period });

    const stageMap = new Map<string, any[]>();
    for (const snap of snapshots) {
      const stage = snap.metric?.metStage || 'unknown';
      if (!stageMap.has(stage)) stageMap.set(stage, []);
      stageMap.get(stage)!.push({
        metKey: snap.metric?.metKey,
        label: snap.metric?.metLabel,
        value: Number(snap.snpValue),
        target: Number(snap.snpTarget),
        changeRate: Number(snap.snpChangeRate),
        status: snap.snpStatus,
        isPrimary: snap.metric?.metIsPrimary || false,
      });
    }

    const stages = ['advertise', 'acquisition', 'activation', 'accelerate', 'advocate'];
    return stages.map((stage) => ({
      stage,
      metrics: stageMap.get(stage) || [],
    }));
  }

  private async getPreviousSnapshot(
    ddbId: string,
    metId: string,
    currentPeriod: string,
  ): Promise<DddSnapshotEntity | null> {
    return this.snapshotRepository.findOne({
      where: { ddbId, metId },
      order: { snpPeriod: 'DESC' },
    });
  }
}
