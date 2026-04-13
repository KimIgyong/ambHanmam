import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Palmtree, CalendarCheck, UserX } from 'lucide-react';
import { useMonthlyTimesheet } from '../../hooks/useTimesheet';

interface Props {
  year: number;
  month: number;
}

export default function TimesheetSummary({ year, month }: Props) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: employees = [], isLoading } = useMonthlyTimesheet(year, month);

  const aggregated = useMemo(() => {
    let workDays = 0;
    let leaveDays = 0;
    let holidays = 0;
    let absentDays = 0;

    for (const emp of employees) {
      workDays += emp.summary.workDays;
      leaveDays += emp.summary.leaveDays;
      holidays += emp.summary.holidays;
      absentDays += emp.summary.absentDays;
    }

    return { workDays, leaveDays, holidays, absentDays };
  }, [employees]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: t('hr:timesheet.summary.workDays'),
      value: aggregated.workDays,
      icon: Briefcase,
      bg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      valueColor: 'text-teal-700',
    },
    {
      label: t('hr:timesheet.summary.leaveDays'),
      value: aggregated.leaveDays,
      icon: Palmtree,
      bg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      valueColor: 'text-orange-600',
    },
    {
      label: t('hr:timesheet.summary.holidays'),
      value: aggregated.holidays,
      icon: CalendarCheck,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-600',
    },
    {
      label: t('hr:timesheet.summary.absentDays'),
      value: aggregated.absentDays,
      icon: UserX,
      bg: 'bg-red-50',
      iconColor: 'text-red-500',
      valueColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-lg ${card.bg} p-4`}>
          <div className="flex items-center gap-2">
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            <span className="text-xs font-medium text-gray-600">{card.label}</span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
