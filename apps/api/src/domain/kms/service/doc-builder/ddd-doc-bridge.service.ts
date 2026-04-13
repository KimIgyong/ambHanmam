import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { DocBaseDataHistoryEntity } from '../../entity/doc-base-data-history.entity';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';
import { DddSnapshotEntity } from '../../entity/ddd-snapshot.entity';
import { DddGaugeScoreEntity } from '../../entity/ddd-gauge-score.entity';
import { DddAiInsightEntity } from '../../entity/ddd-ai-insight.entity';
import { DddDashboardEntity } from '../../entity/ddd-dashboard.entity';
import { DddMetricEntity } from '../../entity/ddd-metric.entity';

export interface SyncResult {
  category: string;
  action: 'CREATED' | 'UPDATED' | 'SKIPPED';
  version: number;
  fieldCount: number;
}

export interface SyncSummary {
  dashboardId: string;
  period: string;
  syncedAt: string;
  results: SyncResult[];
}

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class DddDocBridgeService {
  private readonly logger = new Logger(DddDocBridgeService.name);

  constructor(
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepository: Repository<DocBaseDataEntity>,
    @InjectRepository(DocBaseDataHistoryEntity)
    private readonly historyRepository: Repository<DocBaseDataHistoryEntity>,
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepository: Repository<DocBaseCategoryEntity>,
    @InjectRepository(DddDashboardEntity)
    private readonly dashboardRepository: Repository<DddDashboardEntity>,
    @InjectRepository(DddSnapshotEntity)
    private readonly snapshotRepository: Repository<DddSnapshotEntity>,
    @InjectRepository(DddGaugeScoreEntity)
    private readonly gaugeRepository: Repository<DddGaugeScoreEntity>,
    @InjectRepository(DddAiInsightEntity)
    private readonly insightRepository: Repository<DddAiInsightEntity>,
    @InjectRepository(DddMetricEntity)
    private readonly metricRepository: Repository<DddMetricEntity>,
  ) {}

  /**
   * Sync all DDD data → DocBuilder base data for a given entity
   */
  async syncAll(entityId: string, userId?: string): Promise<SyncSummary> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { entId: entityId, ddbIsActive: true },
      order: { ddbCreatedAt: 'DESC' },
    });

    if (!dashboard) {
      this.logger.warn(`No active dashboard found for entity ${entityId}`);
      return {
        dashboardId: '',
        period: '',
        syncedAt: new Date().toISOString(),
        results: [],
      };
    }

    // Get latest period from snapshots
    const latestSnapshot = await this.snapshotRepository.findOne({
      where: { ddbId: dashboard.ddbId },
      order: { snpPeriod: 'DESC' },
    });
    const period = latestSnapshot?.snpPeriod || '';

    const results: SyncResult[] = [];
    const uid = userId || SYSTEM_USER_ID;

    // 1. Sync KPI Dashboard
    const kpiResult = await this.syncKpiDashboard(entityId, dashboard.ddbId, period, uid);
    if (kpiResult) results.push(kpiResult);

    // 2. Sync Operational Readiness
    const readinessResult = await this.syncOperationalReadiness(entityId, dashboard.ddbId, uid);
    if (readinessResult) results.push(readinessResult);

    // 3. Sync AI Insights
    const insightsResult = await this.syncAiInsights(entityId, dashboard.ddbId, period, uid);
    if (insightsResult) results.push(insightsResult);

    this.logger.log(`DDD→DocBuilder sync completed: ${results.length} categories synced for entity ${entityId}`);

    return {
      dashboardId: dashboard.ddbId,
      period,
      syncedAt: new Date().toISOString(),
      results,
    };
  }

  /**
   * Sync 5A Stage KPI snapshots → KPI_DASHBOARD category
   */
  private async syncKpiDashboard(
    entityId: string,
    ddbId: string,
    period: string,
    userId: string,
  ): Promise<SyncResult | null> {
    if (!period) return null;

    const category = await this.findCategory(entityId, 'KPI_DASHBOARD');
    if (!category) return null;

    // Get snapshots with metrics for this period
    const snapshots = await this.snapshotRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.metric', 'm')
      .where('s.ddbId = :ddbId', { ddbId })
      .andWhere('s.snpPeriod = :period', { period })
      .andWhere('m.metIsPrimary = true')
      .orderBy('m.metStage', 'ASC')
      .getMany();

    if (snapshots.length === 0) return { category: 'KPI_DASHBOARD', action: 'SKIPPED', version: 0, fieldCount: 0 };

    const stages = snapshots.map((s) => ({
      stage: s.metric.metStage,
      primary_kpi_label: s.metric.metLabel?.en || s.metric.metKey,
      value: s.snpValue,
      unit: s.metric.metUnit,
      change_rate: s.snpChangeRate,
      status: s.snpStatus,
    }));

    const data = {
      period,
      stages,
      summary: `5A Matrix KPI snapshot for ${period}. ${stages.length} stages tracked.`,
    };

    return this.upsertBaseData(entityId, category, data, userId);
  }

  /**
   * Sync Gauge scores → OPERATIONAL_READINESS category
   */
  private async syncOperationalReadiness(
    entityId: string,
    ddbId: string,
    userId: string,
  ): Promise<SyncResult | null> {
    const category = await this.findCategory(entityId, 'OPERATIONAL_READINESS');
    if (!category) return null;

    // Get latest gauge scores
    const latest = await this.gaugeRepository.findOne({
      where: { ddbId },
      order: { gscPeriod: 'DESC' },
    });
    if (!latest) return { category: 'OPERATIONAL_READINESS', action: 'SKIPPED', version: 0, fieldCount: 0 };

    const scores = await this.gaugeRepository.find({
      where: { ddbId, gscPeriod: latest.gscPeriod },
    });

    const scoreMap: Record<string, number> = {};
    for (const s of scores) {
      scoreMap[s.gscDimension] = s.gscScore;
    }

    const weights: Record<string, number> = { process: 0.3, capability: 0.4, quality: 0.3 };
    let totalScore = 0;
    for (const s of scores) {
      totalScore += s.gscScore * (weights[s.gscDimension] || 0);
    }

    const data = {
      total_score: Math.round(totalScore),
      process_score: scoreMap.process || 0,
      capability_score: scoreMap.capability || 0,
      quality_score: scoreMap.quality || 0,
      assessment_period: latest.gscPeriod,
    };

    return this.upsertBaseData(entityId, category, data, userId);
  }

  /**
   * Sync Top AI insights → 5A_INSIGHTS category
   */
  private async syncAiInsights(
    entityId: string,
    ddbId: string,
    period: string,
    userId: string,
  ): Promise<SyncResult | null> {
    const category = await this.findCategory(entityId, '5A_INSIGHTS');
    if (!category) return null;

    // Get top 5 most recent insights (prioritize by severity)
    const insights = await this.insightRepository
      .createQueryBuilder('i')
      .where('i.ddbId = :ddbId', { ddbId })
      .orderBy(
        `CASE i.ais_severity WHEN 'CRITICAL' THEN 1 WHEN 'WARNING' THEN 2 ELSE 3 END`,
        'ASC',
      )
      .addOrderBy('i.aisCreatedAt', 'DESC')
      .limit(5)
      .getMany();

    if (insights.length === 0) return { category: '5A_INSIGHTS', action: 'SKIPPED', version: 0, fieldCount: 0 };

    const data = {
      insights: insights.map((ins) => ({
        type: ins.aisType,
        severity: ins.aisSeverity,
        title: ins.aisTitle,
        content: ins.aisContent,
        stage: ins.aisStage || '',
      })),
      generated_at: new Date().toISOString().split('T')[0],
    };

    return this.upsertBaseData(entityId, category, data, userId);
  }

  // ===== Helper =====

  private async findCategory(entityId: string, code: string): Promise<DocBaseCategoryEntity | null> {
    return this.categoryRepository.findOne({
      where: { entId: entityId, dbcCode: code, dbcIsActive: true },
    });
  }

  private async upsertBaseData(
    entityId: string,
    category: DocBaseCategoryEntity,
    data: any,
    userId: string,
  ): Promise<SyncResult> {
    const existing = await this.baseDataRepository.findOne({
      where: {
        dbcId: category.dbcId,
        entId: entityId,
        dbdLanguage: 'en',
        dbdIsCurrent: true,
      },
    });

    if (existing) {
      // Save to history before update
      const history = this.historyRepository.create({
        dbdId: existing.dbdId,
        dbhVersion: existing.dbdVersion,
        dbhData: existing.dbdData,
        dbhChangeReason: 'DDD auto-sync',
        dbhChangedBy: userId,
      });
      await this.historyRepository.save(history);

      // Update existing
      existing.dbdData = data;
      existing.dbdVersion += 1;
      existing.dbdUpdatedBy = userId;
      existing.dbdUpdateSource = 'DDD_SYNC';
      existing.dbdFreshnessAt = new Date();
      await this.baseDataRepository.save(existing);

      return {
        category: category.dbcCode,
        action: 'UPDATED',
        version: existing.dbdVersion,
        fieldCount: Object.keys(data).length,
      };
    } else {
      // Create new base data
      const entity = this.baseDataRepository.create({
        dbcId: category.dbcId,
        entId: entityId,
        dbdLanguage: 'en',
        dbdData: data,
        dbdVersion: 1,
        dbdIsCurrent: true,
        dbdUpdatedBy: userId,
        dbdUpdateSource: 'DDD_SYNC',
      });
      await this.baseDataRepository.save(entity);

      return {
        category: category.dbcCode,
        action: 'CREATED',
        version: 1,
        fieldCount: Object.keys(data).length,
      };
    }
  }
}
