import { useTranslation } from 'react-i18next';

const BADGE_STYLES: Record<string, string> = {
  WORK: 'bg-blue-100 text-blue-700',
  OFFICE: 'bg-blue-100 text-blue-700',
  REMOTE: 'bg-green-100 text-green-700',
  OUTSIDE_WORK: 'bg-teal-100 text-teal-700',
  BUSINESS_TRIP: 'bg-cyan-100 text-cyan-700',
  EXTERNAL_SITE: 'bg-slate-100 text-slate-700',
  DAY_OFF: 'bg-red-100 text-red-700',
  AM_HALF: 'bg-amber-100 text-amber-700',
  PM_HALF: 'bg-orange-100 text-orange-700',
  MENSTRUATION: 'bg-pink-100 text-pink-700',
};

const PENDING_STYLE = 'bg-yellow-100 text-yellow-700 border border-yellow-300';
const REJECTED_STYLE = 'bg-red-100 text-red-700 line-through';

interface TodayAttendanceBadgeProps {
  type?: string | null;
  approval?: string | null;
  size?: 'sm' | 'md';
  showWork?: boolean;
}

export default function TodayAttendanceBadge({ type, approval, size = 'md', showWork = false }: TodayAttendanceBadgeProps) {
  const { t } = useTranslation(['attendance', 'today']);

  if (!type) return null;
  if ((type === 'WORK' || type === 'OFFICE') && !showWork) return null;

  const isRejected = type === 'REMOTE' && approval === 'REJECTED';
  const isPending = type === 'REMOTE' && approval === 'PENDING';

  let label = t(`attendance:type.${type}`, { defaultValue: type });
  if (isPending) label += ' ⏳';
  if (isRejected) label = t('today:attendance.absent', { defaultValue: '결근' });

  const style = isRejected
    ? REJECTED_STYLE
    : isPending
      ? PENDING_STYLE
      : BADGE_STYLES[type] || 'bg-gray-100 text-gray-700';

  const sizeClass = size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`inline-block shrink-0 rounded-full font-medium ${style} ${sizeClass}`}>
      {label}
    </span>
  );
}
