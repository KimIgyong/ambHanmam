import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useDddFrameworks, useDddDashboards, useDddStageOverview, useDddLatestGauges,
  useCreateDashboard, useCollectData, useAnalyzeDashboard, useDddInsights, useMarkInsightActioned,
} from '../hooks/useDdd';
import { DddDashboardResponse, StageOverviewItem } from '../service/ddd.service';
import SnapshotInputPanel from '../components/SnapshotInputPanel';
import AiInsightCard from '../components/AiInsightCard';
import { ArrowUpRight, ArrowDownRight, Minus, Target, TrendingUp, Activity, Plus, ChevronRight, Database, Brain, Sparkles } from 'lucide-react';

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  advertise: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  acquisition: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  activation: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  accelerate: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  advocate: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const STAGE_LABELS: Record<string, { en: string; ko: string }> = {
  advertise: { en: 'Advertise', ko: '인지' },
  acquisition: { en: 'Acquisition', ko: '획득' },
  activation: { en: 'Activation', ko: '활성화' },
  accelerate: { en: 'Accelerate', ko: '가속' },
  advocate: { en: 'Advocate', ko: '옹호' },
};

function getCurrentPeriod(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

export default function DddPage() {
  const { t, i18n } = useTranslation('kms');
  const lang = i18n.language === 'ko' ? 'ko' : 'en';

  const [selectedDashboard] = useState<DddDashboardResponse | null>(null);
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [showInput, setShowInput] = useState(false);

  const { data: frameworks } = useDddFrameworks();
  const { data: dashboards, isLoading: dbLoading } = useDddDashboards();
  const createDashboard = useCreateDashboard();

  const activeDashboard = selectedDashboard || dashboards?.[0] || null;
  const ddbId = activeDashboard?.ddbId || '';

  const { data: overview } = useDddStageOverview(ddbId, period);
  const { data: gauges } = useDddLatestGauges(ddbId);
  const { data: insights } = useDddInsights(ddbId, period);
  const collectData = useCollectData();
  const analyzeDashboard = useAnalyzeDashboard();
  const markActioned = useMarkInsightActioned();

  // Auto-create dashboard if none exists
  const handleAutoCreate = async () => {
    if (!frameworks?.[0]) return;
    await createDashboard.mutateAsync({
      framework_id: frameworks[0].fwkId,
      name: `${frameworks[0].fwkName} Dashboard`,
      scope: 'ENTITY',
    });
  };

  // Calculate weighted gauge score
  const overallGauge = useMemo(() => {
    if (!gauges?.scores) return null;
    const weights: Record<string, number> = { process: 0.3, capability: 0.4, quality: 0.3 };
    let total = 0;
    for (const s of gauges.scores) {
      total += s.score * (weights[s.dimension] || 0);
    }
    return Math.round(total);
  }, [gauges]);

  if (showInput && activeDashboard) {
    return (
      <SnapshotInputPanel
        dashboard={activeDashboard}
        period={period}
        onBack={() => setShowInput(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('ddd.title')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('ddd.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {generatePeriodOptions().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {activeDashboard && (
            <>
              <button
                onClick={() => collectData.mutate({ ddbId, period })}
                disabled={collectData.isPending}
                className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Database className="h-4 w-4" />
                {collectData.isPending ? t('ddd.collecting') : t('ddd.collect')}
              </button>
              <button
                onClick={() => analyzeDashboard.mutate({ ddbId, period })}
                disabled={analyzeDashboard.isPending}
                className="flex items-center gap-1.5 rounded-md border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
              >
                <Brain className="h-4 w-4" />
                {analyzeDashboard.isPending ? t('ddd.analyzing') : t('ddd.analyze')}
              </button>
              <button
                onClick={() => setShowInput(true)}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                {t('ddd.inputData')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* No dashboard state */}
      {dbLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : !dashboards?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16">
          <Activity className="mb-4 h-12 w-12 text-gray-300" />
          <p className="mb-2 text-lg font-medium text-gray-500">{t('ddd.noDashboard')}</p>
          <p className="mb-6 text-sm text-gray-400">{t('ddd.noDashboardDesc')}</p>
          <button
            onClick={handleAutoCreate}
            disabled={createDashboard.isPending}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('ddd.createDashboard')}
          </button>
        </div>
      ) : (
        <>
          {/* Operational Readiness Gauge */}
          {gauges && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('ddd.operationalReadiness')}</p>
                    <p className="text-xs text-gray-500">{gauges.period}</p>
                  </div>
                </div>
                {overallGauge !== null && (
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-48 rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          overallGauge >= 80 ? 'bg-green-500' : overallGauge >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${overallGauge}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-blue-600">{overallGauge}%</span>
                  </div>
                )}
              </div>
              {gauges.scores && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {gauges.scores.map((s) => (
                    <div key={s.dimension} className="rounded-md bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium capitalize text-gray-600">{s.dimension}</span>
                        <span className="text-sm font-semibold text-gray-900">{s.score}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-gray-200">
                        <div
                          className={`h-1.5 rounded-full ${
                            s.score >= 80 ? 'bg-green-500' : s.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                      {s.prevScore > 0 && (
                        <p className="mt-1 text-xs text-gray-400">
                          {t('ddd.prev')}: {s.prevScore}% ({s.score > s.prevScore ? '+' : ''}{(s.score - s.prevScore).toFixed(1)}%)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5A Funnel Overview */}
          <div className="space-y-4">
            {overview?.map((stage: StageOverviewItem) => {
              const colors = STAGE_COLORS[stage.stage] || STAGE_COLORS.advertise;
              const label = STAGE_LABELS[stage.stage]?.[lang] || stage.stage;
              const primary = stage.metrics.find((m) => m.isPrimary);

              return (
                <div
                  key={stage.stage}
                  className={`rounded-lg border ${colors.border} bg-white p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                        {label}
                      </span>
                      {primary && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-900">
                            {primary.value?.toLocaleString()} {primary.label?.[lang]}
                          </span>
                          {primary.changeRate !== null && primary.changeRate !== undefined && (
                            <span className={`flex items-center gap-0.5 text-xs ${
                              primary.changeRate > 0 ? 'text-green-600' : primary.changeRate < 0 ? 'text-red-600' : 'text-gray-400'
                            }`}>
                              {primary.changeRate > 0 ? <ArrowUpRight className="h-3 w-3" /> :
                               primary.changeRate < 0 ? <ArrowDownRight className="h-3 w-3" /> :
                               <Minus className="h-3 w-3" />}
                              {Math.abs(primary.changeRate).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>

                  {stage.metrics.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {stage.metrics.map((m) => (
                        <div key={m.metKey} className="rounded-md bg-gray-50 px-3 py-2">
                          <p className="text-xs text-gray-500">{m.label?.[lang] || m.metKey}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-gray-900">
                              {m.value?.toLocaleString() ?? '-'}
                            </span>
                            {m.target > 0 && (
                              <span className="text-xs text-gray-400">/ {m.target.toLocaleString()}</span>
                            )}
                          </div>
                          <StatusBadge status={m.status} />
                        </div>
                      ))}
                    </div>
                  )}

                  {stage.metrics.length === 0 && (
                    <p className="mt-2 text-xs text-gray-400">{t('ddd.noData')}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Strategy Position */}
          {activeDashboard && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-900">{t('ddd.strategyPosition')}</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {['Build', 'Launch', 'Scale', 'Diversify'].map((step, idx) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium ${
                      idx + 1 <= activeDashboard.ddbStrategyStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step}
                    </div>
                    {idx < 3 && (
                      <div className={`h-0.5 w-8 ${
                        idx + 1 < activeDashboard.ddbStrategyStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">{t('ddd.insights')}</h3>
              {insights && insights.length > 0 && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {insights.length}
                </span>
              )}
            </div>
            {insights && insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <AiInsightCard
                    key={insight.aisId}
                    insight={insight}
                    onAction={(aisId) => markActioned.mutate(aisId)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">{t('ddd.noInsights')}</p>
                <p className="mt-1 text-xs text-gray-300">{t('ddd.noInsightsDesc')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    ON_TRACK: 'bg-green-100 text-green-700',
    AT_RISK: 'bg-yellow-100 text-yellow-700',
    OFF_TRACK: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function generatePeriodOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  const currentQ = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();
  for (let i = -4; i <= 2; i++) {
    const totalQ = currentQ + i;
    const y = currentYear + Math.floor((totalQ - 1) / 4);
    const q = ((totalQ - 1 + 400) % 4) + 1;
    options.push(`${y}-Q${q}`);
  }
  return [...new Set(options)].sort();
}
