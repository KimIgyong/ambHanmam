import { useTranslation } from 'react-i18next';
import { Loader2, BarChart3 } from 'lucide-react';
import { useEntityAiUsage } from '../hooks/useAdmin';

export default function EntityAiUsageTab({ entityId }: { entityId: string }) {
  const { t } = useTranslation(['entityManagement']);
  const { data, isLoading } = useEntityAiUsage(entityId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
      </div>
    );
  }

  const summary = data?.summary;
  const quota = summary?.quota;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quota */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('entityManagement:aiUsage.quota')}</h3>
          {quota ? (
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('entityManagement:aiUsage.dailyLimit')}</span>
                <span className="font-medium">{quota.dailyLimit?.toLocaleString() || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('entityManagement:aiUsage.monthlyLimit')}</span>
                <span className="font-medium">{quota.monthlyLimit?.toLocaleString() || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('entityManagement:aiUsage.actionOnExceed')}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  quota.actionOnExceed === 'BLOCK' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {t(`entityManagement:aiUsage.${quota.actionOnExceed}`)}
                </span>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">{t('entityManagement:aiUsage.noQuota')}</p>
          )}
        </div>

        {/* Monthly Usage */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('entityManagement:aiUsage.monthlyUsage')}</h3>
          {summary?.monthly ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <StatCard label={t('entityManagement:aiUsage.totalTokens')} value={summary.monthly.totalTokens?.toLocaleString() || '0'} />
                <StatCard label={t('entityManagement:aiUsage.requests')} value={summary.monthly.requestCount?.toLocaleString() || '0'} />
                <StatCard label={t('entityManagement:aiUsage.inputTokens')} value={summary.monthly.inputTokens?.toLocaleString() || '0'} />
                <StatCard label={t('entityManagement:aiUsage.outputTokens')} value={summary.monthly.outputTokens?.toLocaleString() || '0'} />
              </div>
              {summary.warnings?.monthlyPercent != null && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('entityManagement:aiUsage.usage')}</span>
                    <span>{summary.warnings.monthlyPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        summary.warnings.monthlyPercent >= 95 ? 'bg-red-500' :
                        summary.warnings.monthlyPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, summary.warnings.monthlyPercent)}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
        </div>
      </div>

      {/* Top Users */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('entityManagement:aiUsage.topUsers')}</h3>
        {!data?.topUsers?.length ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <BarChart3 className="h-10 w-10 mb-2" />
            <p className="text-sm">-</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">User</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('entityManagement:aiUsage.totalTokens')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('entityManagement:aiUsage.requests')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.topUsers.map((user, idx) => (
                  <tr key={user.userId}>
                    <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium text-gray-900">{user.userName}</div>
                      <div className="text-xs text-gray-400">{user.userEmail}</div>
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{user.totalTokens.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600">{user.requestCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
