import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle, Loader2, Bug, CheckCircle2 } from 'lucide-react';
import type { MyTodaySummary } from '../service/today.service';

interface Props {
  summary: MyTodaySummary;
}

export default function TodaySummaryBar({ summary }: Props) {
  const { t } = useTranslation('today');

  const items = [
    { label: t('summary.todayDue'), value: summary.todayDueCount, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('summary.inProgress'), value: summary.inProgressCount, icon: Loader2, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: t('summary.overdue'), value: summary.overdueCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: t('summary.issues'), value: summary.issueCount, icon: Bug, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('summary.completedToday'), value: summary.completedTodayCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className={`flex items-center gap-2 rounded-lg ${item.bg} px-3 py-2.5`}>
          <item.icon className={`h-4 w-4 ${item.color}`} />
          <div>
            <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
