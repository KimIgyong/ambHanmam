import { useTranslation } from 'react-i18next';
import { Package, Clock, Bookmark, Archive, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAssetDashboard, useAssetRisk } from '../hooks/useAsset';

export default function AssetDashboardTab() {
  const { t } = useTranslation('asset');
  const { data: dashboard, isLoading: dashLoading } = useAssetDashboard();
  const { data: risk, isLoading: riskLoading } = useAssetRisk(10);

  if (dashLoading || riskLoading) {
    return <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>;
  }

  if (!dashboard) {
    return <div className="text-center py-12 text-gray-400">{t('common.noData')}</div>;
  }

  const { assetSummary: as, requestSummary: rs, categoryUsage } = dashboard;

  return (
    <div className="space-y-6">
      {/* Asset Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Package className="w-5 h-5 text-blue-500" />}
          label={t('dashboard.totalAssets')}
          value={as.totalAssets}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5 text-green-500" />}
          label={t('dashboard.inUse')}
          value={as.inUseAssets}
          sub={`${t('dashboard.usageRate')} ${(as.usageRate * 100).toFixed(0)}%`}
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <SummaryCard
          icon={<Bookmark className="w-5 h-5 text-purple-500" />}
          label={t('dashboard.reserved')}
          value={as.reservedAssets}
          sub={`${t('dashboard.reservationRate')} ${(as.reservationRate * 100).toFixed(0)}%`}
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
        <SummaryCard
          icon={<Archive className="w-5 h-5 text-gray-500" />}
          label={t('dashboard.stored')}
          value={as.storedAssets}
          bg="bg-gray-50 dark:bg-gray-800"
        />
      </div>

      {/* Request Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          label={t('dashboard.totalRequests')}
          value={rs.totalRequests}
          bg="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <SummaryCard
          icon={<Package className="w-5 h-5 text-green-500" />}
          label={t('dashboard.approved')}
          value={rs.approvedRequests}
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <SummaryCard
          icon={<Package className="w-5 h-5 text-red-500" />}
          label={t('dashboard.rejected')}
          value={rs.rejectedRequests}
          bg="bg-red-50 dark:bg-red-900/20"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
          label={t('dashboard.delayedReturns')}
          value={rs.delayedReturns}
          bg="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* Category Usage */}
      {categoryUsage && categoryUsage.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {t('dashboard.categoryUsage')}
          </h4>
          <div className="space-y-2">
            {categoryUsage.map((cu) => {
              const max = Math.max(...categoryUsage.map((c) => c.usageCount), 1);
              const pct = (cu.usageCount / max) * 100;
              return (
                <div key={cu.category} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-24 shrink-0">
                    {t(`category.${cu.category}`)}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                    {cu.usageCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Report */}
      {risk && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue Returns */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              {t('dashboard.overdueReturns')}
            </h4>
            {risk.overdueReturns.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">{t('common.noData')}</div>
            ) : (
              <div className="space-y-2">
                {risk.overdueReturns.map((item) => (
                  <div key={item.requestId} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div>
                      <span className="font-medium">{item.requesterName}</span>
                      <span className="text-gray-400 ml-2">{item.assetName}</span>
                    </div>
                    <span className="text-red-500 font-medium">+{item.delayedDays}일</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Frequent Extension Users */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {t('dashboard.frequentExtensions')}
            </h4>
            {risk.frequentExtensionUsers.length === 0 ? (
              <div className="text-sm text-gray-400 py-4 text-center">{t('common.noData')}</div>
            ) : (
              <div className="space-y-2">
                {risk.frequentExtensionUsers.map((item) => (
                  <div key={item.requesterId} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="font-medium">{item.requesterName}</span>
                    <span className="text-amber-500 font-medium">{item.extensionCount}회</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component ──────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
