import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DddMetricEntity } from '../../entity/ddd-metric.entity';
import { DddDashboardEntity } from '../../entity/ddd-dashboard.entity';
import { DddSnapshotEntity } from '../../entity/ddd-snapshot.entity';

export interface CollectionResult {
  metricId: string;
  metricKey: string;
  stage: string;
  value: number | null;
  source: string;
  rawData?: any;
}

export interface CollectionSummary {
  dashboardId: string;
  period: string;
  totalMetrics: number;
  collected: number;
  failed: number;
  results: CollectionResult[];
}

@Injectable()
export class DddDataCollectorService {
  private readonly logger = new Logger(DddDataCollectorService.name);

  constructor(
    @InjectRepository(DddMetricEntity)
    private readonly metricRepository: Repository<DddMetricEntity>,
    @InjectRepository(DddDashboardEntity)
    private readonly dashboardRepository: Repository<DddDashboardEntity>,
    @InjectRepository(DddSnapshotEntity)
    private readonly snapshotRepository: Repository<DddSnapshotEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async collectForDashboard(
    ddbId: string,
    period: string,
    userId: string,
  ): Promise<CollectionSummary> {
    const dashboard = await this.dashboardRepository.findOne({ where: { ddbId } });
    if (!dashboard) throw new Error(`Dashboard ${ddbId} not found`);

    // Get all metrics with AUTO data source
    const metrics = await this.metricRepository.find({
      where: { fwkId: dashboard.fwkId },
    });

    const autoMetrics = metrics.filter(
      (m) => m.metDataSource && m.metDataSource !== 'MANUAL',
    );

    const results: CollectionResult[] = [];
    let collected = 0;
    let failed = 0;

    for (const metric of autoMetrics) {
      try {
        const value = await this.collectMetric(metric, dashboard.entId, period);
        results.push({
          metricId: metric.metId,
          metricKey: metric.metKey,
          stage: metric.metStage,
          value,
          source: metric.metDataSource,
        });

        if (value !== null) {
          // Save/update snapshot
          await this.saveSnapshot(ddbId, metric.metId, period, value, userId);
          collected++;
        }
      } catch (error) {
        this.logger.warn(`Collection failed for ${metric.metKey}: ${error}`);
        results.push({
          metricId: metric.metId,
          metricKey: metric.metKey,
          stage: metric.metStage,
          value: null,
          source: metric.metDataSource,
        });
        failed++;
      }
    }

    return {
      dashboardId: ddbId,
      period,
      totalMetrics: autoMetrics.length,
      collected,
      failed,
      results,
    };
  }

  private async collectMetric(
    metric: DddMetricEntity,
    entityId: string,
    period: string,
  ): Promise<number | null> {
    const config = metric.metQueryConfig;
    if (!config) return null;

    const { dateStart, dateEnd } = this.parsePeriodRange(period);

    switch (config.source) {
      case 'BILLING':
        return this.collectBillingMetric(config, entityId, dateStart, dateEnd);
      case 'HR':
        return this.collectHrMetric(config, entityId, dateStart, dateEnd);
      default:
        this.logger.debug(`Unknown source: ${config.source} for metric ${metric.metKey}`);
        return null;
    }
  }

  private async collectBillingMetric(
    config: any,
    entityId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<number | null> {
    const qb = this.dataSource.createQueryBuilder();

    if (config.table === 'amb_bil_contracts') {
      switch (config.aggregation) {
        case 'COUNT': {
          const result = await qb
            .select('COUNT(*)', 'cnt')
            .from('amb_bil_contracts', 'c')
            .where('c.ent_id = :entityId', { entityId })
            .andWhere('c.ctr_start_date >= :dateStart', { dateStart })
            .andWhere('c.ctr_start_date < :dateEnd', { dateEnd })
            .andWhere(config.filter?.status ? 'c.ctr_status = :status' : '1=1', {
              status: config.filter?.status,
            })
            .getRawOne();
          return parseInt(result?.cnt || '0', 10);
        }
        case 'SUM': {
          const result = await qb
            .select('COALESCE(SUM(c.ctr_amount), 0)', 'total')
            .from('amb_bil_contracts', 'c')
            .where('c.ent_id = :entityId', { entityId })
            .andWhere('c.ctr_start_date >= :dateStart', { dateStart })
            .andWhere('c.ctr_start_date < :dateEnd', { dateEnd })
            .getRawOne();
          return parseFloat(result?.total || '0');
        }
        case 'COUNT_PARTNERS': {
          const result = await qb
            .select('COUNT(DISTINCT c.ptn_id)', 'cnt')
            .from('amb_bil_contracts', 'c')
            .where('c.ent_id = :entityId', { entityId })
            .andWhere('c.ctr_start_date >= :dateStart', { dateStart })
            .andWhere('c.ctr_start_date < :dateEnd', { dateEnd })
            .getRawOne();
          return parseInt(result?.cnt || '0', 10);
        }
        default:
          return null;
      }
    }

    if (config.table === 'amb_bil_invoices') {
      switch (config.aggregation) {
        case 'SUM': {
          const field = config.field || 'inv_total';
          const result = await qb
            .select(`COALESCE(SUM(i.${field}), 0)`, 'total')
            .from('amb_bil_invoices', 'i')
            .where('i.ent_id = :entityId', { entityId })
            .andWhere('i.inv_date >= :dateStart', { dateStart })
            .andWhere('i.inv_date < :dateEnd', { dateEnd })
            .getRawOne();
          return parseFloat(result?.total || '0');
        }
        case 'COUNT': {
          const result = await qb
            .select('COUNT(*)', 'cnt')
            .from('amb_bil_invoices', 'i')
            .where('i.ent_id = :entityId', { entityId })
            .andWhere('i.inv_date >= :dateStart', { dateStart })
            .andWhere('i.inv_date < :dateEnd', { dateEnd })
            .getRawOne();
          return parseInt(result?.cnt || '0', 10);
        }
        default:
          return null;
      }
    }

    if (config.table === 'amb_bil_partners') {
      const result = await qb
        .select('COUNT(*)', 'cnt')
        .from('amb_bil_partners', 'p')
        .where('p.ent_id = :entityId', { entityId })
        .andWhere('p.ptn_status = :status', { status: config.filter?.status || 'ACTIVE' })
        .getRawOne();
      return parseInt(result?.cnt || '0', 10);
    }

    return null;
  }

  private async collectHrMetric(
    config: any,
    entityId: string,
    dateStart: string,
    dateEnd: string,
  ): Promise<number | null> {
    const qb = this.dataSource.createQueryBuilder();

    if (config.table === 'amb_hr_employees') {
      switch (config.aggregation) {
        case 'COUNT': {
          const result = await qb
            .select('COUNT(*)', 'cnt')
            .from('amb_hr_employees', 'e')
            .where('e.ent_id = :entityId', { entityId })
            .andWhere('e.emp_status = :status', { status: config.filter?.status || 'ACTIVE' })
            .andWhere('e.emp_start_date < :dateEnd', { dateEnd })
            .andWhere('(e.emp_end_date IS NULL OR e.emp_end_date >= :dateStart)', { dateStart })
            .getRawOne();
          return parseInt(result?.cnt || '0', 10);
        }
        default:
          return null;
      }
    }

    return null;
  }

  private async saveSnapshot(
    ddbId: string,
    metId: string,
    period: string,
    value: number,
    userId: string,
  ): Promise<void> {
    // Get previous value for change rate calculation
    const prevSnapshot = await this.snapshotRepository
      .createQueryBuilder('s')
      .where('s.ddbId = :ddbId', { ddbId })
      .andWhere('s.metId = :metId', { metId })
      .andWhere('s.snpPeriod < :period', { period })
      .orderBy('s.snpPeriod', 'DESC')
      .getOne();

    const prevValue = prevSnapshot?.snpValue ?? null;
    const changeRate = prevValue && prevValue !== 0
      ? ((value - prevValue) / Math.abs(prevValue)) * 100
      : undefined;

    // Upsert
    const existing = await this.snapshotRepository.findOne({
      where: { ddbId, metId, snpPeriod: period },
    });

    if (existing) {
      existing.snpValue = value;
      existing.snpPrevValue = prevValue ?? (undefined as any);
      existing.snpChangeRate = changeRate ?? (undefined as any);
      existing.snpSourceType = 'AUTO';
      await this.snapshotRepository.save(existing);
    } else {
      await this.snapshotRepository.save(
        this.snapshotRepository.create({
          ddbId,
          metId,
          snpPeriod: period,
          snpValue: value,
          snpPrevValue: prevValue ?? undefined,
          snpChangeRate: changeRate ?? undefined,
          snpSourceType: 'AUTO',
          snpCreatedBy: userId,
        } as Partial<DddSnapshotEntity>),
      );
    }
  }

  private parsePeriodRange(period: string): { dateStart: string; dateEnd: string } {
    // Quarterly: '2026-Q1' → 2026-01-01 ~ 2026-04-01
    const qMatch = period.match(/^(\d{4})-Q(\d)$/);
    if (qMatch) {
      const year = parseInt(qMatch[1], 10);
      const quarter = parseInt(qMatch[2], 10);
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 3;
      const endYear = endMonth > 12 ? year + 1 : year;
      const endM = endMonth > 12 ? endMonth - 12 : endMonth;
      return {
        dateStart: `${year}-${String(startMonth).padStart(2, '0')}-01`,
        dateEnd: `${endYear}-${String(endM).padStart(2, '0')}-01`,
      };
    }

    // Monthly: '2026-01' → 2026-01-01 ~ 2026-02-01
    const mMatch = period.match(/^(\d{4})-(\d{2})$/);
    if (mMatch) {
      const year = parseInt(mMatch[1], 10);
      const month = parseInt(mMatch[2], 10);
      const nextMonth = month + 1;
      const nextYear = nextMonth > 12 ? year + 1 : year;
      const nextM = nextMonth > 12 ? 1 : nextMonth;
      return {
        dateStart: `${year}-${String(month).padStart(2, '0')}-01`,
        dateEnd: `${nextYear}-${String(nextM).padStart(2, '0')}-01`,
      };
    }

    // Yearly fallback
    return {
      dateStart: `${period}-01-01`,
      dateEnd: `${parseInt(period, 10) + 1}-01-01`,
    };
  }
}
