import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, CalendarCheck, CalendarDays } from 'lucide-react';
import { useLeaveBalances } from '../../hooks/useLeave';

interface LeaveSummaryProps {
  year: number;
}

export default function LeaveSummary({ year }: LeaveSummaryProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: balances = [], isLoading } = useLeaveBalances(year);

  const stats = useMemo(() => {
    const total = balances.length;
    if (total === 0) {
      return { total: 0, avgEntitlement: 0, avgUsed: 0, avgRemaining: 0 };
    }

    const sumEntitlement = balances.reduce((sum, b) => sum + b.entitlement, 0);
    const sumUsed = balances.reduce((sum, b) => sum + b.used, 0);
    const sumRemaining = balances.reduce((sum, b) => sum + b.remaining, 0);

    return {
      total,
      avgEntitlement: Math.round((sumEntitlement / total) * 10) / 10,
      avgUsed: Math.round((sumUsed / total) * 10) / 10,
      avgRemaining: Math.round((sumRemaining / total) * 10) / 10,
    };
  }, [balances]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: t('hr:leave.summary.totalEmployees'),
      value: stats.total,
      icon: Users,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: t('hr:leave.summary.avgEntitlement'),
      value: stats.avgEntitlement,
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: t('hr:leave.summary.avgUsed'),
      value: stats.avgUsed,
      icon: CalendarCheck,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: t('hr:leave.summary.avgRemaining'),
      value: stats.avgRemaining,
      icon: CalendarDays,
      color: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}>
              <card.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-lg font-semibold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
