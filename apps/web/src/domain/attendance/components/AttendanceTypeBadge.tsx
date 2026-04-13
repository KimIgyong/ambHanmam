import { useTranslation } from 'react-i18next';
import { AttendanceType } from '@amb/types';

const TYPE_STYLES: Record<string, string> = {
  OFFICE: 'bg-indigo-100 text-indigo-700',
  REMOTE: 'bg-green-100 text-green-700',
  OUTSIDE_WORK: 'bg-blue-100 text-blue-700',
  BUSINESS_TRIP: 'bg-purple-100 text-purple-700',
  EXTERNAL_SITE: 'bg-teal-100 text-teal-700',
  DAY_OFF: 'bg-red-100 text-red-700',
  AM_HALF: 'bg-amber-100 text-amber-700',
  PM_HALF: 'bg-orange-100 text-orange-700',
  MENSTRUATION: 'bg-pink-100 text-pink-700',
};

interface AttendanceTypeBadgeProps {
  type: AttendanceType;
}

export default function AttendanceTypeBadge({ type }: AttendanceTypeBadgeProps) {
  const { t } = useTranslation(['attendance']);
  const style = TYPE_STYLES[type] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {t(`attendance:type.${type}`)}
    </span>
  );
}
