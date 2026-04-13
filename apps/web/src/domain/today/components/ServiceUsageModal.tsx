import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Users, Bot, Coins, ArrowRight, Loader2 } from 'lucide-react';
import { useEntityUsageSummary, useEntityMembers, useWorkStatsOverview } from '@/domain/entity-settings/hooks/useEntitySettings';

interface ServiceUsageModalProps {
  onClose: () => void;
  onDismissToday: () => void;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return tokens.toLocaleString();
}

export default function ServiceUsageModal({ onClose, onDismissToday }: ServiceUsageModalProps) {
  const { t } = useTranslation('entitySettings');
  const navigate = useNavigate();

  // 7일 전~오늘 날짜 계산
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }, []);

  const { data: usage, isLoading: usageLoading } = useEntityUsageSummary();
  const { data: members, isLoading: membersLoading } = useEntityMembers();
  const { data: weekStats, isLoading: statsLoading } = useWorkStatsOverview(startDate, endDate);

  const isLoading = usageLoading || membersLoading || statsLoading;

  // 직원 현황 계산
  const totalMembers = members?.filter((m) => m.status === 'ACTIVE').length ?? 0;
  const activeUsers = weekStats?.loginCount ?? 0;
  const activeRate = totalMembers > 0 ? ((activeUsers / totalMembers) * 100).toFixed(1) : '0';

  // AI 사용 현황
  const dailyTokens = usage?.daily?.totalTokens ?? 0;
  const monthlyTokens = usage?.monthly?.totalTokens ?? 0;
  const dailyLimit = usage?.quota?.dailyLimit ?? 0;
  const monthlyLimit = usage?.quota?.monthlyLimit ?? 0;
  const dailyPercent = dailyLimit > 0 ? Math.min((dailyTokens / dailyLimit) * 100, 100) : 0;
  const monthlyPercent = monthlyLimit > 0 ? Math.min((monthlyTokens / monthlyLimit) * 100, 100) : 0;
  const quotaStage = usage?.warnings?.quotaStage ?? 'NORMAL';
  const monthlyRemaining = usage?.warnings?.monthlyRemaining ?? 0;

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const barColor = (percent: number) => {
    if (percent >= 95) return 'bg-red-500';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const handleNavigateUsage = () => {
    onClose();
    navigate('/entity-settings/usage');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{t('usageModal.title')}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">{t('usageModal.loading')}</span>
            </div>
          ) : (
            <>
              {/* 직원 현황 */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-700">{t('usageModal.employees')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{t('usageModal.totalEmployees')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {t('usageModal.persons', { count: totalMembers })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('usageModal.activeUsers7d')}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {t('usageModal.activeRate', { count: activeUsers, rate: activeRate })}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI 사용 현황 */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-700">{t('usageModal.aiUsage')}</h3>
                </div>

                <div className="space-y-3">
                  {/* 월간 쿼터 */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-gray-500">{t('usageModal.monthlyQuota')}</span>
                      <span className="font-medium text-gray-700">
                        {monthlyLimit > 0
                          ? `${formatTokens(monthlyTokens)} / ${formatTokens(monthlyLimit)}`
                          : t('usageModal.noQuotaSet')}
                      </span>
                    </div>
                    {monthlyLimit > 0 && (
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(monthlyPercent)}`}
                          style={{ width: `${monthlyPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 일일 쿼터 */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-gray-500">{t('usageModal.dailyQuota')}</span>
                      <span className="font-medium text-gray-700">
                        {dailyLimit > 0
                          ? `${formatTokens(dailyTokens)} / ${formatTokens(dailyLimit)}`
                          : t('usageModal.noQuotaSet')}
                      </span>
                    </div>
                    {dailyLimit > 0 && (
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(dailyPercent)}`}
                          style={{ width: `${dailyPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 누적 / 오늘 */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-xs text-gray-500">{t('usageModal.monthlyAccum')}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {monthlyTokens.toLocaleString()} <span className="text-xs font-normal text-gray-500">{t('usageModal.tokens')}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('usageModal.todayUsage')}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {dailyTokens.toLocaleString()} <span className="text-xs font-normal text-gray-500">{t('usageModal.tokens')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 쿼터 경고 메시지 */}
              {quotaStage === 'SUSPENDED' && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {t('usageModal.quotaExceeded')}
                </div>
              )}
              {(quotaStage === 'CAUTION' || quotaStage === 'WARNING') && monthlyLimit > 0 && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                  quotaStage === 'WARNING' ? 'bg-amber-50 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {t('usageModal.quotaCaution', {
                    percent: monthlyPercent.toFixed(1),
                    remaining: formatTokens(monthlyRemaining),
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onDismissToday}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('usageModal.dismissToday')}
            </button>
            <button
              onClick={handleNavigateUsage}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Coins className="h-4 w-4" />
              {t('usageModal.chargeTokens')}
            </button>
          </div>
          <button
            onClick={handleNavigateUsage}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {t('usageModal.viewDetails')}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
