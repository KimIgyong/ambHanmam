import { useTranslation } from 'react-i18next';
import { AttendanceResponse } from '@amb/types';
import AttendanceTypeBadge from './AttendanceTypeBadge';

interface DayCellProps {
  date: string;
  dayName: string;
  schedule?: AttendanceResponse;
  editable: boolean;
  selected: boolean;
  onSelect: (date: string) => void;
}

export default function DayCell({ date, dayName, schedule, editable, selected, onSelect }: DayCellProps) {
  const { t } = useTranslation(['attendance']);
  const dateObj = new Date(date + 'T00:00:00');
  const dayNum = dateObj.getDate();
  const month = dateObj.getMonth() + 1;

  return (
    <button
      onClick={() => editable && onSelect(date)}
      disabled={!editable}
      className={`flex flex-col rounded-lg border p-3 min-h-[120px] transition-all text-left ${
        selected
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
          : editable
            ? 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
            : 'border-gray-100 bg-gray-50 cursor-default'
      }`}
    >
      {/* Day header */}
      <div className="mb-2 text-sm font-semibold text-gray-700">
        {dayName} {month}/{dayNum}
      </div>

      {/* Content */}
      {schedule ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
          <AttendanceTypeBadge type={schedule.type} />
          {schedule.startTime && schedule.endTime && (
            <span className="text-xs text-gray-500">
              {schedule.startTime} - {schedule.endTime}
            </span>
          )}
        </div>
      ) : editable ? (
        <div className="flex flex-1 flex-col items-center justify-center text-gray-300">
          <span className="text-xs">{t('attendance:noSchedule')}</span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-gray-300">
          <span className="text-xs">{t('attendance:notEditable')}</span>
        </div>
      )}
    </button>
  );
}
