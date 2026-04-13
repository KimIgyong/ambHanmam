import { useTranslation } from 'react-i18next';
import { Users, LogIn, Building2 } from 'lucide-react';
import {
  useAppSummary,
  useAppVisitorTrend,
  useAppEntityLogins,
  useAppHourlyPattern,
} from '../../hooks/useAnalytics';

interface Props {
  startDate: string;
  endDate: string;
}

export default function AppAnalyticsTab({ startDate, endDate }: Props) {
  const { t } = useTranslation(['site']);
  const { data: summary, isLoading: loadingSummary } = useAppSummary(startDate, endDate);
  const { data: trend, isLoading: loadingTrend } = useAppVisitorTrend(startDate, endDate);
  const { data: entityLogins, isLoading: loadingEntity } = useAppEntityLogins(startDate, endDate);
  const { data: hourly, isLoading: loadingHourly } = useAppHourlyPattern(startDate, endDate);

  const summaryCards = [
    { label: t('site:analytics.app.totalVisitors'), value: summary?.totalVisitors ?? 0, icon: Users, color: 'bg-blue-50 text-blue-500' },
    { label: t('site:analytics.app.totalLogins'), value: summary?.totalLogins ?? 0, icon: LogIn, color: 'bg-green-50 text-green-500' },
    { label: t('site:analytics.app.activeEntities'), value: summary?.activeEntities ?? 0, icon: Building2, color: 'bg-purple-50 text-purple-500' },
  ];

  const maxTrendLogin = trend ? Math.max(...trend.map((p) => p.loginCount), 1) : 1;
  const maxHourly = hourly ? Math.max(...hourly.map((p) => p.count), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color.split(' ')[0]}`}>
                  <Icon className={`h-5 w-5 ${card.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loadingSummary ? '...' : card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visitor / Login Trend */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">{t('site:analytics.app.loginTrend')}</h3>
        <div className="mb-3 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-lime-400" /> {t('site:analytics.app.logins')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-blue-300" /> {t('site:analytics.app.visitors')}
          </span>
        </div>
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
              const loginH = (point.loginCount / maxTrendLogin) * 100;
              const visitorH = (point.visitorCount / maxTrendLogin) * 100;
              return (
                <div key={point.date} className="group relative flex-1 flex items-end justify-center gap-[1px]">
                  <div
                    className="w-1/2 min-w-[2px] max-w-[10px] rounded-t bg-lime-400"
                    style={{ height: `${Math.max(loginH, 2)}%` }}
                  />
                  <div
                    className="w-1/2 min-w-[2px] max-w-[10px] rounded-t bg-blue-300"
                    style={{ height: `${Math.max(visitorH, 2)}%` }}
                  />
                  <div className="absolute -top-10 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
                    {point.date}<br />
                    {t('site:analytics.app.logins')}: {point.loginCount} / {t('site:analytics.app.visitors')}: {point.visitorCount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entity Login Table */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('site:analytics.app.entityLogins')}</h3>
          {loadingEntity ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
            </div>
          ) : !entityLogins || entityLogins.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              {t('site:analytics.noData')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left font-medium text-gray-500">Entity</th>
                    <th className="pb-2 text-right font-medium text-gray-500">{t('site:analytics.app.logins')}</th>
                    <th className="pb-2 text-right font-medium text-gray-500">{t('site:analytics.app.users')}</th>
                    <th className="pb-2 text-right font-medium text-gray-500">{t('site:analytics.app.activeRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entityLogins.map((el) => (
                    <tr key={el.entityId} className="border-b border-gray-50">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium text-gray-700">{el.entityCode}</span>
                          <span className="text-gray-400">{el.entityName}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">{el.loginCount.toLocaleString()}</td>
                      <td className="py-2 text-right text-gray-600">
                        {el.userCount} / {el.totalUsers}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          el.activeRate >= 70 ? 'bg-green-100 text-green-700' :
                          el.activeRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {el.activeRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hourly Pattern */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('site:analytics.app.hourlyPattern')}</h3>
          {loadingHourly ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
            </div>
          ) : !hourly || hourly.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              {t('site:analytics.noData')}
            </div>
          ) : (
            <>
              <div className="flex items-end gap-[2px] h-32">
                {hourly.map((point) => {
                  const height = (point.count / maxHourly) * 100;
                  return (
                    <div key={point.hour} className="group relative flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-t bg-indigo-400 hover:bg-indigo-500 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <div className="absolute -top-8 hidden rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-10">
                        {point.hour}:00 — {point.count}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between px-1 text-[10px] text-gray-400">
                <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
