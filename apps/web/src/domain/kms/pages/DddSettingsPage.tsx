import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save, Loader2, Target, BarChart3, Gauge } from 'lucide-react';

const STAGES = [
  { key: 'advertise', label: 'Advertise', color: 'bg-blue-500' },
  { key: 'acquisition', label: 'Acquisition', color: 'bg-green-500' },
  { key: 'activation', label: 'Activation', color: 'bg-yellow-500' },
  { key: 'accelerate', label: 'Accelerate', color: 'bg-red-500' },
  { key: 'advocate', label: 'Advocate', color: 'bg-purple-500' },
];

const GAUGE_DEFAULTS = [
  { key: 'process', label: 'Process Maturity', weight: 30 },
  { key: 'capability', label: 'Team Capability', weight: 40 },
  { key: 'quality', label: 'Delivery Quality', weight: 30 },
];

export default function DddSettingsPage() {
  const { t } = useTranslation('kms');
  const [activeTab, setActiveTab] = useState<'metrics' | 'targets' | 'gauges'>('metrics');
  const [gaugeWeights, setGaugeWeights] = useState(GAUGE_DEFAULTS);
  const [saving, setSaving] = useState(false);

  const handleGaugeChange = (key: string, weight: number) => {
    setGaugeWeights((prev) =>
      prev.map((g) => (g.key === key ? { ...g, weight } : g))
    );
  };

  const totalWeight = gaugeWeights.reduce((sum, g) => sum + g.weight, 0);

  const handleSave = async () => {
    setSaving(true);
    // TODO: API call to save settings
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-500" />
          <h1 className="text-xl font-bold text-gray-900">{t('ddd.settings.title', '5A Matrix Settings')}</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {t('ddd.settings.description', 'Configure metrics, targets, and gauge weights for the 5A Matrix dashboard.')}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-1.5 pb-3 text-sm font-medium ${
            activeTab === 'metrics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          {t('ddd.settings.metricsTab', 'Metrics')}
        </button>
        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center gap-1.5 pb-3 text-sm font-medium ${
            activeTab === 'targets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Target className="h-4 w-4" />
          {t('ddd.settings.targetsTab', 'Targets')}
        </button>
        <button
          onClick={() => setActiveTab('gauges')}
          className={`flex items-center gap-1.5 pb-3 text-sm font-medium ${
            activeTab === 'gauges' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Gauge className="h-4 w-4" />
          {t('ddd.settings.gaugesTab', 'Gauges')}
        </button>
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          {STAGES.map((stage) => (
            <div key={stage.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-semibold text-gray-900">{stage.label}</h3>
              </div>
              <p className="text-xs text-gray-500">
                {t(`ddd.settings.metricsHint`, 'Configure KPI metrics for this stage from the dashboard.')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Targets Tab */}
      {activeTab === 'targets' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              {t('ddd.settings.quarterlyTargets', 'Quarterly Targets')}
            </h3>
            {STAGES.map((stage) => (
              <div key={stage.key} className="mb-3 flex items-center gap-4">
                <div className="flex w-32 items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm text-gray-700">{stage.label}</span>
                </div>
                <input
                  type="number"
                  placeholder="Target"
                  className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gauges Tab */}
      {activeTab === 'gauges' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              {t('ddd.settings.gaugeWeights', 'Gauge Weights')}
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              {t('ddd.settings.gaugeWeightsHint', 'Adjust the weight of each gauge. Total must equal 100%.')}
            </p>

            {gaugeWeights.map((gauge) => (
              <div key={gauge.key} className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{gauge.label}</span>
                  <span className="text-sm text-gray-500">{gauge.weight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gauge.weight}
                  onChange={(e) => handleGaugeChange(gauge.key, parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            ))}

            <div className={`mt-4 rounded-md px-3 py-2 text-sm ${
              totalWeight === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {t('ddd.settings.totalWeight', 'Total')}: {totalWeight}%
              {totalWeight !== 100 && ` (${t('ddd.settings.mustBe100', 'must be 100%')})`}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || (activeTab === 'gauges' && totalWeight !== 100)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? t('ddd.saving') : t('ddd.save')}
        </button>
      </div>
    </div>
  );
}
