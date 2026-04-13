import { useTranslation } from 'react-i18next';
import { Users, Clock, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useMonthlyOtRecords } from '../../hooks/useOvertime';

interface OvertimeSummaryProps {
  year: number;
  month: number;
}

export default function OvertimeSummary({ year, month }: OvertimeSummaryProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: summaries = [] } = useMonthlyOtRecords(year, month);

  const totalEmployees = summaries.length;
  const totalActualHours = summaries.reduce((sum, s) => sum + s.totalActualHours, 0);
  const totalConvertedHours = summaries.reduce((sum, s) => sum + s.totalConvertedHours, 0);
  const pendingCount = summaries.reduce(
    (sum, s) => sum + s.records.filter((r) => r.approvalStatus === 'PENDING').length,
    0,
  );

  const cards = [
    {
      label: t('hr:overtime.summary.totalEmployees'),
      value: totalEmployees,
      icon: Users,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: t('hr:overtime.totalActual'),
      value: `${Math.round(totalActualHours * 100) / 100}h`,
      icon: Clock,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: t('hr:overtime.totalConverted'),
      value: `${Math.round(totalConvertedHours * 100) / 100}h`,
      icon: ArrowRightLeft,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      label: t('hr:overtime.summary.pendingApprovals'),
      value: pendingCount,
      icon: AlertCircle,
      color: 'bg-yellow-50 text-yellow-600',
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
