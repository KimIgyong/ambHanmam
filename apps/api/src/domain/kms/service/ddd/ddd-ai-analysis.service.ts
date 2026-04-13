import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaudeService, AiUsageContext } from '../../../../infrastructure/external/claude/claude.service';
import { DddAiInsightEntity } from '../../entity/ddd-ai-insight.entity';
import { DddSnapshotEntity } from '../../entity/ddd-snapshot.entity';
import { DddGaugeScoreEntity } from '../../entity/ddd-gauge-score.entity';
import { DddMetricEntity } from '../../entity/ddd-metric.entity';

export interface AnalysisRequest {
  dashboardId: string;
  period: string;
  types?: string[]; // 'TREND' | 'ANOMALY' | 'RECOMMENDATION' | 'FORECAST'
}

export interface AnalysisResult {
  dashboardId: string;
  period: string;
  insights: DddAiInsightEntity[];
}

@Injectable()
export class DddAiAnalysisService {
  private readonly logger = new Logger(DddAiAnalysisService.name);

  constructor(
    @InjectRepository(DddAiInsightEntity)
    private readonly insightRepository: Repository<DddAiInsightEntity>,
    @InjectRepository(DddSnapshotEntity)
    private readonly snapshotRepository: Repository<DddSnapshotEntity>,
    @InjectRepository(DddGaugeScoreEntity)
    private readonly gaugeRepository: Repository<DddGaugeScoreEntity>,
    @InjectRepository(DddMetricEntity)
    private readonly metricRepository: Repository<DddMetricEntity>,
    private readonly claudeService: ClaudeService,
  ) {}

  async analyze(request: AnalysisRequest, usageContext?: AiUsageContext): Promise<AnalysisResult> {
    const { dashboardId, period } = request;
    const types = request.types || ['TREND', 'ANOMALY', 'RECOMMENDATION'];

    // 1. Gather all data for analysis
    const analysisData = await this.gatherAnalysisData(dashboardId, period);

    // 2. Run AI analysis
    const rawInsights = await this.runAiAnalysis(analysisData, types, period, usageContext);

    // 3. Save insights
    const savedInsights: DddAiInsightEntity[] = [];
    for (const insight of rawInsights) {
      const entity = this.insightRepository.create({
        ddbId: dashboardId,
        aisPeriod: period,
        aisType: insight.type,
        aisStage: insight.stage || undefined,
        aisSeverity: insight.severity || 'INFO',
        aisTitle: insight.title,
        aisContent: insight.content,
        aisDataRefs: insight.dataRefs || undefined,
        aisActionItems: insight.actionItems || undefined,
      } as Partial<DddAiInsightEntity>);
      const saved = await this.insightRepository.save(entity);
      savedInsights.push(saved);
    }

    return { dashboardId, period, insights: savedInsights };
  }

  async getInsights(ddbId: string, period?: string): Promise<DddAiInsightEntity[]> {
    const qb = this.insightRepository.createQueryBuilder('i')
      .where('i.ddbId = :ddbId', { ddbId })
      .orderBy('i.aisCreatedAt', 'DESC');

    if (period) {
      qb.andWhere('i.aisPeriod = :period', { period });
    }

    return qb.getMany();
  }

  async markInsightActioned(aisId: string): Promise<DddAiInsightEntity> {
    const insight = await this.insightRepository.findOneBy({ aisId });
    if (!insight) throw new Error(`Insight ${aisId} not found`);
    insight.aisIsActioned = true;
    insight.aisIsRead = true;
    return this.insightRepository.save(insight);
  }

  async markInsightRead(aisId: string): Promise<DddAiInsightEntity> {
    const insight = await this.insightRepository.findOneBy({ aisId });
    if (!insight) throw new Error(`Insight ${aisId} not found`);
    insight.aisIsRead = true;
    return this.insightRepository.save(insight);
  }

  private async gatherAnalysisData(ddbId: string, period: string) {
    // Get snapshots for recent periods (up to 4)
    const allSnapshots = await this.snapshotRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.metric', 'm')
      .where('s.ddbId = :ddbId', { ddbId })
      .andWhere('s.snpPeriod <= :period', { period })
      .orderBy('s.snpPeriod', 'DESC')
      .getMany();

    // Group by metric
    const metricSnapshots = new Map<string, DddSnapshotEntity[]>();
    for (const snap of allSnapshots) {
      const key = snap.metId;
      if (!metricSnapshots.has(key)) metricSnapshots.set(key, []);
      metricSnapshots.get(key)!.push(snap);
    }

    // Limit to 4 periods per metric
    for (const [key, snaps] of metricSnapshots) {
      metricSnapshots.set(key, snaps.slice(0, 4));
    }

    // Get gauge scores
    const gauges = await this.gaugeRepository
      .createQueryBuilder('g')
      .where('g.ddbId = :ddbId', { ddbId })
      .andWhere('g.gscPeriod <= :period', { period })
      .orderBy('g.gscPeriod', 'DESC')
      .getMany();

    // Group gauge by dimension
    const gaugeByDimension = new Map<string, DddGaugeScoreEntity[]>();
    for (const g of gauges) {
      const key = g.gscDimension;
      if (!gaugeByDimension.has(key)) gaugeByDimension.set(key, []);
      gaugeByDimension.get(key)!.push(g);
    }

    return { metricSnapshots, gaugeByDimension, currentPeriod: period };
  }

  private async runAiAnalysis(
    data: {
      metricSnapshots: Map<string, DddSnapshotEntity[]>;
      gaugeByDimension: Map<string, DddGaugeScoreEntity[]>;
      currentPeriod: string;
    },
    types: string[],
    period: string,
    usageContext?: AiUsageContext,
  ): Promise<any[]> {
    // Build analysis context
    const stageData: Record<string, any[]> = {};
    for (const [, snaps] of data.metricSnapshots) {
      if (snaps.length === 0) continue;
      const metric = snaps[0].metric;
      if (!metric) continue;
      const stage = metric.metStage;
      if (!stageData[stage]) stageData[stage] = [];

      stageData[stage].push({
        key: metric.metKey,
        label: metric.metLabel,
        unit: metric.metUnit,
        direction: metric.metDirection,
        current: snaps[0]?.snpValue,
        target: snaps[0]?.snpTarget,
        history: snaps.map((s) => ({
          period: s.snpPeriod,
          value: s.snpValue,
          changeRate: s.snpChangeRate,
        })),
      });
    }

    const gaugeData: any[] = [];
    for (const [dimension, scores] of data.gaugeByDimension) {
      gaugeData.push({
        dimension,
        current: scores[0]?.gscScore,
        previous: scores[1]?.gscScore,
        history: scores.slice(0, 4).map((s) => ({
          period: s.gscPeriod,
          score: s.gscScore,
        })),
      });
    }

    const systemPrompt = `You are a business analyst AI for amoeba company.
Analyze the 5A Matrix data for period ${period}.
Framework: 5A (Advertise→Acquisition→Activation→Accelerate→Advocate)

Requested analysis types: ${types.join(', ')}

For TREND: Identify direction (UP/DOWN/STABLE) per stage over available periods.
For ANOMALY: Flag deviations >20% from trend or target.
For RECOMMENDATION: Provide top 3 actionable items.
For FORECAST: Predict next period values based on trend.

Return a JSON array of insights:
[{
  "type": "TREND|ANOMALY|RECOMMENDATION|FORECAST",
  "stage": "advertise|acquisition|activation|accelerate|advocate|null",
  "severity": "INFO|WARNING|CRITICAL",
  "title": "Short title",
  "content": "Detailed markdown analysis",
  "dataRefs": {"metric": "key", "values": [...]},
  "actionItems": [{"action": "...", "priority": "HIGH|MEDIUM|LOW"}]
}]

Return at least 1 insight per requested type. Be specific with data references.`;

    const inputData = JSON.stringify({ stages: stageData, gauge: gaugeData }, null, 2);

    try {
      const response = await this.claudeService.sendMessage(systemPrompt, [
        { role: 'user', content: `Analyze this 5A Matrix data:\n\n${inputData}` },
      ], { usageContext });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn('AI analysis returned no valid JSON array');
        return this.buildFallbackInsights(data, types, period);
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.warn(`AI analysis failed: ${error}`);
      return this.buildFallbackInsights(data, types, period);
    }
  }

  private buildFallbackInsights(
    data: {
      metricSnapshots: Map<string, DddSnapshotEntity[]>;
      gaugeByDimension: Map<string, DddGaugeScoreEntity[]>;
      currentPeriod: string;
    },
    types: string[],
    period: string,
  ): any[] {
    const insights: any[] = [];

    // Simple trend detection from snapshots
    if (types.includes('TREND')) {
      const stages = new Set<string>();
      for (const [, snaps] of data.metricSnapshots) {
        const metric = snaps[0]?.metric;
        if (metric) stages.add(metric.metStage);
      }

      for (const stage of stages) {
        insights.push({
          type: 'TREND',
          stage,
          severity: 'INFO',
          title: `${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage Trend for ${period}`,
          content: `Trend analysis for ${stage} stage. Please review the KPI data manually for detailed insights.`,
          actionItems: [],
        });
      }
    }

    // Anomaly detection based on change rate
    if (types.includes('ANOMALY')) {
      for (const [, snaps] of data.metricSnapshots) {
        const current = snaps[0];
        if (!current || !current.snpChangeRate) continue;
        if (Math.abs(Number(current.snpChangeRate)) > 20) {
          insights.push({
            type: 'ANOMALY',
            stage: current.metric?.metStage || null,
            severity: Math.abs(Number(current.snpChangeRate)) > 50 ? 'CRITICAL' : 'WARNING',
            title: `Significant change detected: ${current.metric?.metKey}`,
            content: `${current.metric?.metKey} changed by ${current.snpChangeRate}% in ${current.snpPeriod}.`,
            dataRefs: { metric: current.metric?.metKey, changeRate: current.snpChangeRate },
            actionItems: [{ action: 'Review this metric and investigate root cause', priority: 'HIGH' }],
          });
        }
      }
    }

    if (types.includes('RECOMMENDATION') && insights.length === 0) {
      insights.push({
        type: 'RECOMMENDATION',
        stage: null,
        severity: 'INFO',
        title: 'Data Collection Needed',
        content: 'More data points are needed for comprehensive analysis. Continue collecting data for at least 2-3 periods.',
        actionItems: [{ action: 'Input missing KPI data for recent periods', priority: 'MEDIUM' }],
      });
    }

    return insights;
  }
}
