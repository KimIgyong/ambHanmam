import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import { DddDashboardResponse } from '../service/ddd.service';
import { useDddFramework, useDddSnapshots, useBulkCreateSnapshots, useBulkCreateGaugeScores } from '../hooks/useDdd';

interface Props {
  dashboard: DddDashboardResponse;
  period: string;
  onBack: () => void;
}

interface MetricInput {
  metId: string;
  metKey: string;
  label: { en: string; ko: string };
  stage: string;
  unit: string;
  value: string;
  target: string;
}

export default function SnapshotInputPanel({ dashboard, period, onBack }: Props) {
  const { t, i18n } = useTranslation('kms');
  const lang = i18n.language === 'ko' ? 'ko' : 'en';

  const { data: framework } = useDddFramework(dashboard.fwkId);
  const { data: existingSnapshots } = useDddSnapshots(dashboard.ddbId, period);
  const bulkSnapshots = useBulkCreateSnapshots();
  const bulkGauges = useBulkCreateGaugeScores();

  const [metricInputs, setMetricInputs] = useState<MetricInput[]>([]);
  const [gaugeInputs, setGaugeInputs] = useState<{ dimension: string; score: string }[]>([
    { dimension: 'process', score: '' },
    { dimension: 'capability', score: '' },
    { dimension: 'quality', score: '' },
  ]);

  useEffect(() => {
    if (!framework?.metrics) return;
    const inputs = framework.metrics.map((m) => {
      const existing = existingSnapshots?.find((s) => s.metId === m.metId);
      return {
        metId: m.metId,
        metKey: m.metKey,
        label: m.metLabel,
        stage: m.metStage,
        unit: m.metUnit || '',
        value: existing ? String(existing.snpValue) : '',
        target: existing?.snpTarget ? String(existing.snpTarget) : '',
      };
    });
    setMetricInputs(inputs);
  }, [framework, existingSnapshots]);

  const handleMetricChange = (index: number, field: 'value' | 'target', val: string) => {
    setMetricInputs((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: val } : m)),
    );
  };

  const handleSave = async () => {
    // Save snapshots
    const validSnapshots = metricInputs
      .filter((m) => m.value !== '')
      .map((m) => ({
        metric_id: m.metId,
        value: Number(m.value),
        target: m.target ? Number(m.target) : undefined,
      }));

    if (validSnapshots.length > 0) {
      await bulkSnapshots.mutateAsync({
        ddbId: dashboard.ddbId,
        period,
        snapshots: validSnapshots,
      });
    }

    // Save gauge scores
    const validGauges = gaugeInputs
      .filter((g) => g.score !== '')
      .map((g) => ({
        dimension: g.dimension,
        score: Number(g.score),
      }));

    if (validGauges.length > 0) {
      await bulkGauges.mutateAsync({
        ddbId: dashboard.ddbId,
        period,
        scores: validGauges,
      });
    }

    onBack();
  };

  const isSaving = bulkSnapshots.isPending || bulkGauges.isPending;

  // Group metrics by stage
  const stages = ['advertise', 'acquisition', 'activation', 'accelerate', 'advocate'];
  const groupedMetrics = stages.map((stage) => ({
    stage,
    metrics: metricInputs.filter((m) => m.stage === stage),
  }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('ddd.inputTitle')}</h2>
            <p className="text-sm text-gray-500">{period} · {dashboard.ddbName}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t('ddd.saving') : t('ddd.save')}
        </button>
      </div>

      {/* KPI Metrics by Stage */}
      <div className="space-y-6">
        {groupedMetrics.map(({ stage, metrics }) => (
          <div key={stage} className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold capitalize text-gray-700">
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </h3>
            <div className="space-y-3">
              {metrics.map((m) => {
                const globalIdx = metricInputs.indexOf(m);
                return (
                  <div key={m.metId} className="grid grid-cols-12 items-center gap-3">
                    <div className="col-span-4">
                      <label className="text-sm text-gray-600">
                        {m.label[lang] || m.metKey}
                        {m.unit && <span className="ml-1 text-xs text-gray-400">({m.unit})</span>}
                      </label>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={m.value}
                        onChange={(e) => handleMetricChange(globalIdx, 'value', e.target.value)}
                        placeholder={t('ddd.actual')}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={m.target}
                        onChange={(e) => handleMetricChange(globalIdx, 'target', e.target.value)}
                        placeholder={t('ddd.target')}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
              {metrics.length === 0 && (
                <p className="text-xs text-gray-400">{t('ddd.noMetrics')}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Gauge Scores */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('ddd.operationalReadiness')}</h3>
        <div className="space-y-3">
          {gaugeInputs.map((g, gIdx) => (
            <div key={g.dimension} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-4">
                <label className="text-sm capitalize text-gray-600">{g.dimension}</label>
              </div>
              <div className="col-span-8">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={g.score}
                  onChange={(e) =>
                    setGaugeInputs((prev) =>
                      prev.map((gi, i) => (i === gIdx ? { ...gi, score: e.target.value } : gi)),
                    )
                  }
                  placeholder="0 ~ 100"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
