import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Loader2, Settings2, Building2, Zap, Activity, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface EntityUsageRow {
  entityId: string;
  entityName: string;
  entityCode: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  quota: {
    dailyTokenLimit: number | null;
    monthlyTokenLimit: number | null;
    actionOnExceed: string;
  } | null;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getYearMonth(offset = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

export default function AiUsageManagementPage() {
  const { t } = useTranslation(['common', 'settings']);
  const queryClient = useQueryClient();
  const [yearMonth, setYearMonth] = useState(getYearMonth());
  const [editingEntity, setEditingEntity] = useState<EntityUsageRow | null>(null);

  const { data: entities, isLoading } = useQuery({
    queryKey: ['admin-ai-usage', yearMonth],
    queryFn: async () => {
      const res = await apiClient.get('/settings/ai-usage/entities', { params: { year_month: yearMonth } });
      return res.data.data as EntityUsageRow[];
    },
  });

  const totalTokens = entities?.reduce((sum, e) => sum + e.totalTokens, 0) ?? 0;
  const totalRequests = entities?.reduce((sum, e) => sum + e.requestCount, 0) ?? 0;
  const activeEntities = entities?.filter((e) => e.totalTokens > 0).length ?? 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-purple-500" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('common:settingsPage.aiUsage.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('common:settingsPage.aiUsage.description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYearMonth(getYearMonth(-1))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('common:settingsPage.aiUsage.prevMonth')}
            </button>
            <span className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
              {yearMonth}
            </span>
            <button
              onClick={() => setYearMonth(getYearMonth())}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('common:settingsPage.aiUsage.thisMonth')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                icon={<Zap className="h-5 w-5 text-amber-500" />}
                label={t('common:settingsPage.aiUsage.totalTokens')}
                value={formatTokens(totalTokens)}
              />
              <SummaryCard
                icon={<Activity className="h-5 w-5 text-blue-500" />}
                label={t('common:settingsPage.aiUsage.totalRequests')}
                value={String(totalRequests)}
              />
              <SummaryCard
                icon={<Building2 className="h-5 w-5 text-teal-500" />}
                label={t('common:settingsPage.aiUsage.activeEntities')}
                value={String(activeEntities)}
              />
            </div>

            {/* Entity Usage Table */}
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('common:settingsPage.aiUsage.entityUsage')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-2.5 font-medium text-gray-500">
                        {t('common:settingsPage.aiUsage.entity')}
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">
                        {t('common:settingsPage.aiUsage.monthlyTokens')}
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">
                        {t('common:settingsPage.aiUsage.requests')}
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">
                        {t('common:settingsPage.aiUsage.monthlyLimit')}
                      </th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-500">
                        {t('common:settingsPage.aiUsage.usageRate')}
                      </th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-500">
                        {t('common:settingsPage.aiUsage.action')}
                      </th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-500" />
                    </tr>
                  </thead>
                  <tbody>
                    {entities?.map((entity) => {
                      const ml = entity.quota?.monthlyTokenLimit;
                      const pct = ml ? Math.min((entity.totalTokens / ml) * 100, 100) : null;
                      const barColor = pct === null ? '' : pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500';
                      return (
                        <tr key={entity.entityId} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{entity.entityName}</div>
                            <div className="text-xs text-gray-400">{entity.entityCode}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatTokens(entity.totalTokens)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {entity.requestCount}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {ml ? formatTokens(ml) : t('common:settingsPage.aiUsage.unlimited')}
                          </td>
                          <td className="px-4 py-3">
                            {pct !== null ? (
                              <div className="mx-auto w-24">
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>{pct.toFixed(0)}%</span>
                                </div>
                                <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${barColor}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-xs text-gray-400">-</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entity.quota ? (
                              <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                entity.quota.actionOnExceed === 'BLOCK'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {entity.quota.actionOnExceed}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setEditingEntity(entity)}
                              className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              title={t('common:settingsPage.aiUsage.setQuota')}
                            >
                              <Settings2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quota Setting Modal */}
      {editingEntity && (
        <QuotaModal
          entity={editingEntity}
          onClose={() => setEditingEntity(null)}
          onSaved={() => {
            setEditingEntity(null);
            queryClient.invalidateQueries({ queryKey: ['admin-ai-usage'] });
          }}
          t={t}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function QuotaModal({
  entity,
  onClose,
  onSaved,
  t,
}: {
  entity: EntityUsageRow;
  onClose: () => void;
  onSaved: () => void;
  t: (key: string) => string;
}) {
  const [dailyLimit, setDailyLimit] = useState<string>(
    entity.quota?.dailyTokenLimit ? String(entity.quota.dailyTokenLimit) : '',
  );
  const [monthlyLimit, setMonthlyLimit] = useState<string>(
    entity.quota?.monthlyTokenLimit ? String(entity.quota.monthlyTokenLimit) : '',
  );
  const [dailyUnlimited, setDailyUnlimited] = useState(!entity.quota?.dailyTokenLimit);
  const [monthlyUnlimited, setMonthlyUnlimited] = useState(!entity.quota?.monthlyTokenLimit);
  const [actionOnExceed, setActionOnExceed] = useState(entity.quota?.actionOnExceed || 'WARN');

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/settings/ai-usage/quota/${entity.entityId}`, {
        daily_token_limit: dailyUnlimited ? null : Number(dailyLimit) || null,
        monthly_token_limit: monthlyUnlimited ? null : Number(monthlyLimit) || null,
        action_on_exceed: actionOnExceed,
      });
    },
    onSuccess: onSaved,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {t('common:settingsPage.aiUsage.quotaSettings')}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {entity.entityName} ({entity.entityCode})
        </p>

        {/* Daily Limit */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('common:settingsPage.aiUsage.dailyTokenLimit')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={dailyUnlimited ? '' : dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              disabled={dailyUnlimited}
              placeholder="e.g. 100000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={dailyUnlimited}
                onChange={(e) => setDailyUnlimited(e.target.checked)}
                className="rounded border-gray-300"
              />
              {t('common:settingsPage.aiUsage.unlimited')}
            </label>
          </div>
        </div>

        {/* Monthly Limit */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('common:settingsPage.aiUsage.monthlyTokenLimit')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={monthlyUnlimited ? '' : monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              disabled={monthlyUnlimited}
              placeholder="e.g. 5000000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={monthlyUnlimited}
                onChange={(e) => setMonthlyUnlimited(e.target.checked)}
                className="rounded border-gray-300"
              />
              {t('common:settingsPage.aiUsage.unlimited')}
            </label>
          </div>
        </div>

        {/* Action on Exceed */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('common:settingsPage.aiUsage.onExceed')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="action"
                value="WARN"
                checked={actionOnExceed === 'WARN'}
                onChange={() => setActionOnExceed('WARN')}
                className="border-gray-300 text-indigo-600"
              />
              {t('common:settingsPage.aiUsage.warn')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="radio"
                name="action"
                value="BLOCK"
                checked={actionOnExceed === 'BLOCK'}
                onChange={() => setActionOnExceed('BLOCK')}
                className="border-gray-300 text-indigo-600"
              />
              {t('common:settingsPage.aiUsage.block')}
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('common:save')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
