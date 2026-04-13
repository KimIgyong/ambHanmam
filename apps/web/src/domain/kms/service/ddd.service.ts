import { apiClient } from '@/lib/api-client';

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface DddFrameworkResponse {
  fwkId: string;
  entId: string;
  fwkName: string;
  fwkDescription: string;
  fwkTemplate: {
    stages: { key: string; label: { en: string; ko: string }; icon: string; color: string; order: number }[];
    gauges: { key: string; label: { en: string; ko: string }; weight: number }[];
    strategy_steps: string[];
    service_mapping?: Record<string, any>;
  };
  fwkVersion: string;
  fwkIsActive: boolean;
  metrics?: DddMetricResponse[];
}

export interface DddMetricResponse {
  metId: string;
  fwkId: string;
  metStage: string;
  metKey: string;
  metLabel: { en: string; ko: string };
  metUnit: string;
  metDirection: string;
  metDataSource: string;
  metOrder: number;
  metIsPrimary: boolean;
}

export interface DddDashboardResponse {
  ddbId: string;
  entId: string;
  fwkId: string;
  ddbName: string;
  ddbScope: string;
  ddbScopeId: string | null;
  ddbPeriodType: string;
  ddbConfig: any;
  ddbStrategyStep: number;
  ddbIsActive: boolean;
  framework?: DddFrameworkResponse;
}

export interface DddSnapshotResponse {
  snpId: string;
  ddbId: string;
  metId: string;
  snpPeriod: string;
  snpValue: number;
  snpPrevValue: number;
  snpChangeRate: number;
  snpTarget: number;
  snpStatus: string;
  snpSourceType: string;
  snpAnnotation: string;
  snpRawData: any;
  metric?: DddMetricResponse;
}

export interface DddGaugeScoreResponse {
  gscId: string;
  ddbId: string;
  gscPeriod: string;
  gscDimension: string;
  gscScore: number;
  gscPrevScore: number;
  gscDetails: any;
  gscAssessedBy: string;
}

export interface DddAiInsightResponse {
  aisId: string;
  ddbId: string;
  aisPeriod: string;
  aisType: string;
  aisStage: string | null;
  aisSeverity: string;
  aisTitle: string;
  aisContent: string;
  aisDataRefs: any;
  aisActionItems: { action: string; priority: string }[];
  aisIsRead: boolean;
  aisIsActioned: boolean;
  aisCreatedAt: string;
}

export interface CollectionSummaryResponse {
  dashboardId: string;
  period: string;
  totalMetrics: number;
  collected: number;
  failed: number;
  results: { metricId: string; metricKey: string; stage: string; value: number | null; source: string }[];
}

export interface AnalysisResultResponse {
  dashboardId: string;
  period: string;
  insights: DddAiInsightResponse[];
}

export interface StageOverviewItem {
  stage: string;
  metrics: {
    metKey: string;
    label: { en: string; ko: string };
    value: number;
    target: number;
    changeRate: number;
    status: string;
    isPrimary: boolean;
  }[];
}

class DddService {
  private readonly basePath = '/kms/ddd';

  // Frameworks
  getFrameworks = () =>
    apiClient.get<ListResponse<DddFrameworkResponse>>(`${this.basePath}/frameworks`)
      .then((r) => r.data.data);

  getFramework = (fwkId: string) =>
    apiClient.get<SingleResponse<DddFrameworkResponse>>(`${this.basePath}/frameworks/${fwkId}`)
      .then((r) => r.data.data);

  getMetrics = (fwkId: string, stage?: string) =>
    apiClient.get<ListResponse<DddMetricResponse>>(`${this.basePath}/frameworks/${fwkId}/metrics`, {
      params: stage ? { stage } : undefined,
    }).then((r) => r.data.data);

  // Dashboards
  getDashboards = () =>
    apiClient.get<ListResponse<DddDashboardResponse>>(`${this.basePath}/dashboards`)
      .then((r) => r.data.data);

  getDashboard = (ddbId: string) =>
    apiClient.get<SingleResponse<DddDashboardResponse>>(`${this.basePath}/dashboards/${ddbId}`)
      .then((r) => r.data.data);

  createDashboard = (data: { framework_id: string; name: string; scope?: string }) =>
    apiClient.post<SingleResponse<DddDashboardResponse>>(`${this.basePath}/dashboards`, data)
      .then((r) => r.data.data);

  // Snapshots
  getSnapshots = (ddbId: string, params?: { period?: string; stage?: string }) =>
    apiClient.get<ListResponse<DddSnapshotResponse>>(`${this.basePath}/dashboards/${ddbId}/snapshots`, { params })
      .then((r) => r.data.data);

  getStageOverview = (ddbId: string, period: string) =>
    apiClient.get<ListResponse<StageOverviewItem>>(`${this.basePath}/dashboards/${ddbId}/overview`, {
      params: { period },
    }).then((r) => r.data.data);

  getTimeSeries = (ddbId: string, metId: string, limit = 8) =>
    apiClient.get<ListResponse<DddSnapshotResponse>>(`${this.basePath}/dashboards/${ddbId}/metrics/${metId}/timeseries`, {
      params: { limit },
    }).then((r) => r.data.data);

  createSnapshot = (ddbId: string, data: { metric_id: string; period: string; value: number; target?: number; annotation?: string }) =>
    apiClient.post<SingleResponse<DddSnapshotResponse>>(`${this.basePath}/dashboards/${ddbId}/snapshots`, data)
      .then((r) => r.data.data);

  bulkCreateSnapshots = (ddbId: string, data: { period: string; snapshots: { metric_id: string; value: number; target?: number }[] }) =>
    apiClient.post<ListResponse<DddSnapshotResponse>>(`${this.basePath}/dashboards/${ddbId}/snapshots/bulk`, data)
      .then((r) => r.data.data);

  // Gauge Scores
  getGaugeScores = (ddbId: string, period?: string) =>
    apiClient.get<ListResponse<DddGaugeScoreResponse>>(`${this.basePath}/dashboards/${ddbId}/gauges`, {
      params: period ? { period } : undefined,
    }).then((r) => r.data.data);

  getLatestGaugeScores = (ddbId: string) =>
    apiClient.get<SingleResponse<{ period: string; scores: { dimension: string; score: number; prevScore: number; assessedBy: string }[] } | null>>(
      `${this.basePath}/dashboards/${ddbId}/gauges/latest`,
    ).then((r) => r.data.data);

  createGaugeScore = (ddbId: string, data: { period: string; dimension: string; score: number; details?: any }) =>
    apiClient.post<SingleResponse<DddGaugeScoreResponse>>(`${this.basePath}/dashboards/${ddbId}/gauges`, data)
      .then((r) => r.data.data);

  bulkCreateGaugeScores = (ddbId: string, data: { period: string; scores: { dimension: string; score: number }[] }) =>
    apiClient.post<ListResponse<DddGaugeScoreResponse>>(`${this.basePath}/dashboards/${ddbId}/gauges/bulk`, data)
      .then((r) => r.data.data);

  // Data Collection
  collectData = (ddbId: string, period: string) =>
    apiClient.post<SingleResponse<CollectionSummaryResponse>>(`${this.basePath}/dashboards/${ddbId}/collect`, { period })
      .then((r) => r.data.data);

  // AI Analysis + Insights
  analyzeDashboard = (ddbId: string, period: string, types?: string[]) =>
    apiClient.post<SingleResponse<AnalysisResultResponse>>(`${this.basePath}/dashboards/${ddbId}/analyze`, { period, types })
      .then((r) => r.data.data);

  getInsights = (ddbId: string, period?: string) =>
    apiClient.get<ListResponse<DddAiInsightResponse>>(`${this.basePath}/dashboards/${ddbId}/insights`, {
      params: period ? { period } : undefined,
    }).then((r) => r.data.data);

  markInsightActioned = (aisId: string) =>
    apiClient.put<SingleResponse<DddAiInsightResponse>>(`${this.basePath}/insights/${aisId}/action`)
      .then((r) => r.data.data);

  markInsightRead = (aisId: string) =>
    apiClient.put<SingleResponse<DddAiInsightResponse>>(`${this.basePath}/insights/${aisId}/read`)
      .then((r) => r.data.data);
}

export const dddService = new DddService();
