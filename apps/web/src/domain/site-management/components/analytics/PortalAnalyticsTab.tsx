import { useTranslation } from 'react-i18next';
import { Eye, UserPlus, Mail, Search, Globe, Link2, Share2, ExternalLink } from 'lucide-react';
import {
  usePortalSummary,
  usePortalVisitorTrend,
  usePortalReferrers,
  usePortalPages,
  usePortalTrafficSources,
} from '../../hooks/useAnalytics';

interface Props {
  startDate: string;
  endDate: string;
}

export default function PortalAnalyticsTab({ startDate, endDate }: Props) {
  const { t } = useTranslation(['site']);
  const { data: summary, isLoading: loadingSummary } = usePortalSummary(startDate, endDate);
  const { data: trend, isLoading: loadingTrend } = usePortalVisitorTrend(startDate, endDate);
  const { data: referrers, isLoading: loadingReferrers } = usePortalReferrers(startDate, endDate);
  const { data: pages, isLoading: loadingPages } = usePortalPages(startDate, endDate);
  const { data: trafficSources, isLoading: loadingTraffic } = usePortalTrafficSources(startDate, endDate);

  const summaryCards = [
    { label: t('site:analytics.portal.pageViews'), value: summary?.pageViews ?? 0, icon: Eye, color: 'blue' },
    { label: t('site:analytics.portal.registerVisits'), value: summary?.registerVisits ?? 0, icon: UserPlus, color: 'purple' },
    { label: t('site:analytics.portal.amaNavigations'), value: summary?.amaNavigations ?? 0, icon: ExternalLink, color: 'green' },
    { label: t('site:analytics.portal.subscriptions'), value: summary?.subscriptions ?? 0, icon: Mail, color: 'orange' },
  ];

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue:   { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    green:  { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
  };

  const maxTrend = trend ? Math.max(...trend.map((p) => p.count), 1) : 1;
  const totalReferrers = referrers ? referrers.reduce((sum, r) => sum + r.count, 0) : 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const colors = colorMap[card.color];
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>
                    {loadingSummary ? '...' : card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visitor Trend */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('site:analytics.portal.visitorTrend')}</h3>
        {loadingTrend ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
          </div>
        ) : !trend || trend.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">
            {t('site:analytics.noData')}
          </div>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {trend.map((point) => {
              const height = (point.count / maxTrend) * 100;
              return (
                <div key={point.date} className="group relative flex-1 flex flex-col items-center justify-end">
                  <div
                    className="w-full min-w-[4px] max-w-[24px] rounded-t bg-blue-400 transition-colors hover:bg-blue-500"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <div className="absolute -top-8 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap">
                    {point.date}: {point.count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Traffic Sources Analysis */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('site:analytics.portal.trafficSources')}</h3>
        {loadingTraffic ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
          </div>
        ) : !trafficSources || trafficSources.total === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">
            {t('site:analytics.noData')}
          </div>
        ) : (() => {
          const channelConfig: Record<string, { label: string; icon: typeof Search; color: string; barColor: string }> = {
            direct: { label: t('site:analytics.portal.channelDirect'), icon: Globe, color: 'text-blue-600 bg-blue-50', barColor: 'bg-blue-400' },
            search: { label: t('site:analytics.portal.channelSearch'), icon: Search, color: 'text-green-600 bg-green-50', barColor: 'bg-green-400' },
            social: { label: t('site:analytics.portal.channelSocial'), icon: Share2, color: 'text-pink-600 bg-pink-50', barColor: 'bg-pink-400' },
            referral: { label: t('site:analytics.portal.channelReferral'), icon: Link2, color: 'text-amber-600 bg-amber-50', barColor: 'bg-amber-400' },
          };
          const maxCount = Math.max(...trafficSources.summary.map((s) => s.count), 1);
          return (
            <div className="space-y-6">
              {/* Channel bars */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {trafficSources.summary.map((item) => {
                  const cfg = channelConfig[item.channel];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  const pct = trafficSources.total > 0 ? ((item.count / trafficSources.total) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.channel} className="rounded-lg border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.color.split(' ')[1]}`}>
                          <Icon className={`h-4 w-4 ${cfg.color.split(' ')[0]}`} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{cfg.label}</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">{item.count.toLocaleString()}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                          <div className={`h-1.5 rounded-full ${cfg.barColor}`} style={{ width: `${(item.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail tables */}
              <div className="grid gap-4 sm:grid-cols-3">
                {trafficSources.searchDetails.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold text-gray-600">{t('site:analytics.portal.searchEngines')}</h4>
                    <div className="space-y-1.5">
                      {trafficSources.searchDetails.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="capitalize text-gray-700">{d.name}</span>
                          <span className="font-medium text-gray-900">{d.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {trafficSources.socialDetails.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold text-gray-600">{t('site:analytics.portal.socialNetworks')}</h4>
                    <div className="space-y-1.5">
                      {trafficSources.socialDetails.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="capitalize text-gray-700">{d.name}</span>
                          <span className="font-medium text-gray-900">{d.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {trafficSources.referralDetails.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold text-gray-600">{t('site:analytics.portal.referralSites')}</h4>
                    <div className="space-y-1.5">
                      {trafficSources.referralDetails.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="truncate text-gray-700">{d.name}</span>
                          <span className="ml-2 shrink-0 font-medium text-gray-900">{d.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referrers */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('site:analytics.portal.referrers')}</h3>
          {loadingReferrers ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
            </div>
          ) : !referrers || referrers.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              {t('site:analytics.noData')}
            </div>
          ) : (
            <div className="space-y-3">
              {referrers.slice(0, 10).map((r) => {
                const pct = totalReferrers > 0 ? (r.count / totalReferrers) * 100 : 0;
                return (
                  <div key={r.referrer} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-gray-700">{r.referrer}</span>
                        <span className="ml-2 shrink-0 text-gray-500">{r.count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-lime-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Page Views */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('site:analytics.portal.topPages')}</h3>
          {loadingPages ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
            </div>
          ) : !pages || pages.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              {t('site:analytics.noData')}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left font-medium text-gray-500">{t('site:analytics.portal.page')}</th>
                  <th className="pb-2 text-right font-medium text-gray-500">{t('site:analytics.portal.views')}</th>
                </tr>
              </thead>
              <tbody>
                {pages.slice(0, 10).map((p) => (
                  <tr key={p.pagePath} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{p.pagePath}</td>
                    <td className="py-2 text-right font-medium text-gray-900">{p.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
