import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, RefreshCw, Trophy, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useActivityWeights,
  useUpdateActivityWeights,
  useMemberActivityStats,
  useAggregateStats,
} from '../hooks/useActivityIndex';
import { ActivityWeightConfig } from '../service/activity-index.service';

const CATEGORY_LABELS: Record<string, string> = {
  ISSUE: 'issues',
  MEETING_NOTE: 'meetingNotes',
  COMMENT: 'comments',
  TODO: 'todos',
  CHAT_MESSAGE: 'chat',
};

type TabType = 'stats' | 'weights';

export default function EntityActivityIndexPage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/entity-settings')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('entitySettings:activityIndex.title')}</h1>
            <p className="text-sm text-gray-500">{t('entitySettings:activityIndex.description')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'stats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            {t('entitySettings:activityIndex.tabs.stats')}
          </button>
          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'weights' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="h-4 w-4" />
            {t('entitySettings:activityIndex.tabs.weights')}
          </button>
        </div>

        {activeTab === 'stats' ? (
          <StatsTab dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} />
        ) : (
          <WeightsTab />
        )}
      </div>
    </div>
  );
}

// ─── Stats Tab ─────────────────────────────────────────────────

function StatsTab({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
}: {
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
}) {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data: stats = [], isLoading } = useMemberActivityStats({ date_from: dateFrom, date_to: dateTo });
  const aggregate = useAggregateStats();

  const sorted = [...stats].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <span className="text-gray-400">~</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <button
          onClick={() => aggregate.mutate(new Date().toISOString().slice(0, 10))}
          disabled={aggregate.isPending}
          className="ml-auto flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
        >
          <RefreshCw className={`h-4 w-4 ${aggregate.isPending ? 'animate-spin' : ''}`} />
          {t('entitySettings:activityIndex.aggregate')}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">{t('entitySettings:activityIndex.member')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.activityScore')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.engagementScore')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.totalScore')}</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">{t('entitySettings:activityIndex.unit')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.issues')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.notes')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.comments')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.todos')}</th>
              <th className="px-3 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.chats')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">{t('common:loading')}</td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">{t('entitySettings:activityIndex.noData')}</td>
              </tr>
            ) : (
              sorted.map((s, idx) => (
                <tr key={s.userId} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    {idx < 3 ? (
                      <Trophy className={`h-4 w-4 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-gray-400' : 'text-orange-400'}`} />
                    ) : (
                      <span className="text-gray-400">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-900">{s.userName}</td>
                  <td className="px-3 py-2 text-center font-medium text-blue-600">{s.activityScore.toFixed(1)}</td>
                  <td className="px-3 py-2 text-center font-medium text-green-600">{s.engagementScore.toFixed(1)}</td>
                  <td className="px-3 py-2 text-center font-bold text-indigo-600">{s.totalScore.toFixed(1)}</td>
                  <td className="px-3 py-2 text-gray-500">{s.unit || '-'}</td>
                  <td className="px-3 py-2 text-center">{s.totalIssues}</td>
                  <td className="px-3 py-2 text-center">{s.totalNotes}</td>
                  <td className="px-3 py-2 text-center">{s.totalComments}</td>
                  <td className="px-3 py-2 text-center">{s.totalTodos}</td>
                  <td className="px-3 py-2 text-center">{s.totalChats}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Weights Tab ───────────────────────────────────────────────

function WeightsTab() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data: weights, isLoading } = useActivityWeights();
  const updateWeights = useUpdateActivityWeights();
  const [editWeights, setEditWeights] = useState<ActivityWeightConfig[] | null>(null);

  const currentWeights = editWeights ?? weights ?? [];

  const handleChange = (idx: number, field: keyof ActivityWeightConfig, value: number) => {
    const updated = [...currentWeights];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditWeights(updated);
  };

  const handleSave = () => {
    if (!editWeights) return;
    updateWeights.mutate(editWeights, {
      onSuccess: () => {
        toast.success(t('common:saved'));
        setEditWeights(null);
      },
    });
  };

  if (isLoading) return <div className="py-8 text-center text-gray-400">{t('common:loading')}</div>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">{t('entitySettings:activityIndex.category')}</th>
              <th className="px-4 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.activityWeight')}</th>
              <th className="px-4 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.engagementWeight')}</th>
              <th className="px-4 py-2 text-center font-medium text-gray-600">{t('entitySettings:activityIndex.dailyCap')}</th>
            </tr>
          </thead>
          <tbody>
            {currentWeights.map((w: ActivityWeightConfig, idx: number) => (
              <tr key={w.category} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-700">
                  {t(`entitySettings:activityIndex.categories.${CATEGORY_LABELS[w.category] || w.category}`)}
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={w.weight}
                    onChange={(e) => handleChange(idx, 'weight', Number(e.target.value))}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={w.engagementWeight}
                    onChange={(e) => handleChange(idx, 'engagementWeight', Number(e.target.value))}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    step={1}
                    value={w.dailyCap}
                    onChange={(e) => handleChange(idx, 'dailyCap', Number(e.target.value))}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editWeights && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateWeights.isPending}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            {t('common:save')}
          </button>
        </div>
      )}
    </div>
  );
}
