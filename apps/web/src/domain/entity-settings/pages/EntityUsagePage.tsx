import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Loader2, AlertTriangle, Zap, TrendingUp, CreditCard, X, Ban, Calendar } from 'lucide-react';
import { useEntityUsageSummary, useEntityDailyHistory } from '../hooks/useEntitySettings';
import { toast } from 'sonner';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const RECHARGE_PACKAGES = [
  { label: '1M', tokens: 1_000_000 },
  { label: '5M', tokens: 5_000_000 },
  { label: '10M', tokens: 10_000_000 },
  { label: '50M', tokens: 50_000_000 },
];

export default function EntityUsagePage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data: summary, isLoading } = useEntityUsageSummary();
  const [showRecharge, setShowRecharge] = useState(false);

  const currentYearMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const { data: dailyHistory } = useEntityDailyHistory(currentYearMonth);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const daily = summary?.daily;
  const monthly = summary?.monthly;
  const quota = summary?.quota;
  const warnings = summary?.warnings;
  const quotaStage = warnings?.quotaStage as string | undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-emerald-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('entitySettings:usage.title')}
            </h1>
            <p className="text-sm text-gray-500">{t('entitySettings:usage.description')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* 3-stage quota warnings */}
          {quotaStage === 'SUSPENDED' && (
            <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
              <Ban className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-700">
                {t('entitySettings:usage.quotaSuspended')}
              </p>
            </div>
          )}
          {quotaStage === 'WARNING' && (
            <div className="flex items-center gap-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-sm font-medium text-orange-700">
                {t('entitySettings:usage.quotaWarning')}
              </p>
            </div>
          )}
          {quotaStage === 'CAUTION' && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm font-medium text-amber-700">
                {t('entitySettings:usage.quotaCaution')}
              </p>
            </div>
          )}

          {/* Daily / Monthly cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Daily */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('entitySettings:usage.daily')}
                </h3>
              </div>
              {daily ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">{daily.date}</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTokens(daily.totalTokens)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400">{t('entitySettings:usage.inputTokens')}</p>
                      <p className="text-sm font-medium text-gray-700">{formatTokens(daily.inputTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('entitySettings:usage.outputTokens')}</p>
                      <p className="text-sm font-medium text-gray-700">{formatTokens(daily.outputTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('entitySettings:usage.requestCount')}</p>
                      <p className="text-sm font-medium text-gray-700">{daily.requestCount}</p>
                    </div>
                  </div>
                  {quota && quota.dailyLimit > 0 && (
                    <QuotaBar
                      used={daily.totalTokens}
                      limit={quota.dailyLimit}
                      percent={warnings?.dailyPercent ?? null}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No data</p>
              )}
            </div>

            {/* Monthly */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('entitySettings:usage.monthly')}
                </h3>
              </div>
              {monthly ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">{monthly.yearMonth}</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTokens(monthly.totalTokens)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-400">{t('entitySettings:usage.inputTokens')}</p>
                      <p className="text-sm font-medium text-gray-700">{formatTokens(monthly.inputTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('entitySettings:usage.outputTokens')}</p>
                      <p className="text-sm font-medium text-gray-700">{formatTokens(monthly.outputTokens)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('entitySettings:usage.requestCount')}</p>
                      <p className="text-sm font-medium text-gray-700">{monthly.requestCount}</p>
                    </div>
                  </div>
                  {quota && quota.monthlyLimit > 0 && (
                    <QuotaBar
                      used={monthly.totalTokens}
                      limit={quota.monthlyLimit}
                      percent={warnings?.monthlyPercent ?? null}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No data</p>
              )}
            </div>
          </div>

          {/* Quota info + Recharge button */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {t('entitySettings:usage.quota')}
              </h3>
              <button
                onClick={() => setShowRecharge(true)}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                {t('entitySettings:usage.recharge')}
              </button>
            </div>
            {quota ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-400">{t('entitySettings:usage.dailyLimit')}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {quota.dailyLimit > 0 ? formatTokens(quota.dailyLimit) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('entitySettings:usage.monthlyLimit')}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {quota.monthlyLimit > 0 ? formatTokens(quota.monthlyLimit) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Action</p>
                  <p className={`text-sm font-medium ${
                    quota.actionOnExceed === 'BLOCK' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {quota.actionOnExceed}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t('entitySettings:usage.noQuota')}</p>
            )}
          </div>

          {/* Daily History Table */}
          {dailyHistory && dailyHistory.days.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('entitySettings:usage.dailyHistory')}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {dailyHistory.yearMonth}
                  </span>
                </h3>
              </div>

              {/* Mini bar chart */}
              <div className="mb-4 flex items-end gap-1" style={{ height: 80 }}>
                {dailyHistory.days.map((day) => {
                  const maxTokens = Math.max(...dailyHistory.days.map((d) => d.totalTokens), 1);
                  const heightPct = (day.totalTokens / maxTokens) * 100;
                  const isOverDailyLimit = quota && quota.dailyLimit > 0 && day.totalTokens >= quota.dailyLimit;
                  return (
                    <div
                      key={day.date}
                      className="group relative flex flex-1 flex-col items-center"
                      style={{ height: '100%' }}
                    >
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-t transition-all ${
                            isOverDailyLimit ? 'bg-red-400' : 'bg-indigo-400'
                          } group-hover:opacity-80`}
                          style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: 2 }}
                        />
                      </div>
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                        <div className="font-medium">{day.date.slice(5)}</div>
                        <div>{formatTokens(day.totalTokens)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daily limit reference line label */}
              {quota && quota.dailyLimit > 0 && (
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                  <span>{t('entitySettings:usage.dailyLimitExceeded')}</span>
                  <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 ml-2" />
                  <span>{t('entitySettings:usage.withinLimit')}</span>
                </div>
              )}

              {/* Table */}
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="py-2 pl-3 text-left font-medium">{t('entitySettings:usage.date')}</th>
                      <th className="py-2 text-right font-medium">{t('entitySettings:usage.totalTokens')}</th>
                      <th className="py-2 text-right font-medium">{t('entitySettings:usage.inputTokens')}</th>
                      <th className="py-2 text-right font-medium">{t('entitySettings:usage.outputTokens')}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t('entitySettings:usage.requestCount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...dailyHistory.days].reverse().map((day) => {
                      const isOverDailyLimit = quota && quota.dailyLimit > 0 && day.totalTokens >= quota.dailyLimit;
                      return (
                        <tr key={day.date} className={isOverDailyLimit ? 'bg-red-50' : 'hover:bg-gray-50'}>
                          <td className="py-1.5 pl-3 text-gray-700">{day.date.slice(5)}</td>
                          <td className={`py-1.5 text-right font-medium ${isOverDailyLimit ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatTokens(day.totalTokens)}
                          </td>
                          <td className="py-1.5 text-right text-gray-500">{formatTokens(day.inputTokens)}</td>
                          <td className="py-1.5 text-right text-gray-500">{formatTokens(day.outputTokens)}</td>
                          <td className="py-1.5 pr-3 text-right text-gray-500">{day.requestCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recharge Modal (Mockup) */}
      {showRecharge && (
        <RechargeModal onClose={() => setShowRecharge(false)} t={t} />
      )}
    </div>
  );
}

function QuotaBar({
  used,
  limit,
  percent,
}: {
  used: number;
  limit: number;
  percent: number | null;
}) {
  const pct = percent ?? (limit > 0 ? Math.min((used / limit) * 100, 100) : 0);
  const barColor =
    pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatTokens(used)} / {formatTokens(limit)}</span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RechargeModal({ onClose, t }: { onClose: () => void; t: (key: string) => string }) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleRecharge = () => {
    toast.success(t('entitySettings:usage.rechargeRequested'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {t('entitySettings:usage.rechargeTitle')}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          {t('entitySettings:usage.rechargeDesc')}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {RECHARGE_PACKAGES.map((pkg) => (
            <button
              key={pkg.tokens}
              onClick={() => setSelected(pkg.tokens)}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                selected === pkg.tokens
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <div className="text-lg font-bold text-gray-900">{pkg.label}</div>
              <div className="text-xs text-gray-400">{t('entitySettings:usage.tokens')}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={handleRecharge}
            disabled={!selected}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('entitySettings:usage.rechargeSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
}
