import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { ATTENDANCE_TYPE, START_TIME_OPTIONS } from '@amb/types';

interface WeekDay {
  date: string;
  dayKey: string;
  registered: boolean;
}

interface WeekBulkFormModalProps {
  weekDays: WeekDay[];
  onClose: () => void;
  onSave: (schedules: Array<{ date: string; type: string; start_time?: string }>) => void;
}

function getStartTimeForType(type: string, startTime: string): string | undefined {
  if (type === 'DAY_OFF' || type === 'AM_HALF') return undefined;
  return startTime;
}

function getDisplayTime(type: string, startTime: string): { start: string | null; end: string | null } {
  switch (type) {
    case 'WORK':
    case 'REMOTE': {
      const [h, m] = startTime.split(':');
      const hour = parseInt(h) + 9;
      return { start: startTime, end: `${hour.toString().padStart(2, '0')}:${m}` };
    }
    case 'PM_HALF':
      return { start: startTime, end: '12:00' };
    case 'AM_HALF':
      return { start: '13:00', end: '17:00' };
    case 'DAY_OFF':
      return { start: null, end: null };
    default:
      return { start: null, end: null };
  }
}

export default function WeekBulkFormModal({
  weekDays,
  onClose,
  onSave,
}: WeekBulkFormModalProps) {
  const { t } = useTranslation(['attendance', 'common']);

  const [rows, setRows] = useState(
    weekDays.map((day) => ({
      date: day.date,
      dayKey: day.dayKey,
      type: 'WORK' as string,
      startTime: '09:00',
      registered: day.registered,
    })),
  );

  const updateRow = (idx: number, field: 'type' | 'startTime', value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const handleSave = () => {
    const newSchedules = rows
      .filter((row) => !row.registered)
      .map((row) => ({
        date: row.date,
        type: row.type,
        start_time: getStartTimeForType(row.type, row.startTime),
      }));

    if (newSchedules.length > 0) {
      onSave(newSchedules);
    }
    onClose();
  };

  const unregisteredCount = rows.filter((r) => !r.registered).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('attendance:bulkTitle')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Day rows */}
        <div className="space-y-3">
          {rows.map((row, idx) => {
            const dateObj = new Date(row.date + 'T00:00:00');
            const dayLabel = `${t(`attendance:dayNames.${row.dayKey}`)} ${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            const showTimeSelector = row.type === 'WORK' || row.type === 'REMOTE' || row.type === 'PM_HALF';
            const timeDisplay = getDisplayTime(row.type, row.startTime);

            return (
              <div
                key={row.date}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  row.registered
                    ? 'border-gray-100 bg-gray-50 opacity-60'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Day label */}
                <div className="w-16 shrink-0 text-sm font-medium text-gray-700">
                  {dayLabel}
                </div>

                {row.registered ? (
                  <span className="text-xs text-gray-400">
                    ({t('attendance:registered')})
                  </span>
                ) : (
                  <>
                    {/* Type select */}
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(idx, 'type', e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.values(ATTENDANCE_TYPE).map((val) => (
                        <option key={val} value={val}>
                          {t(`attendance:type.${val}`)}
                        </option>
                      ))}
                    </select>

                    {/* Start time */}
                    {showTimeSelector ? (
                      <select
                        value={row.startTime}
                        onChange={(e) => updateRow(idx, 'startTime', e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        {START_TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    ) : row.type === 'AM_HALF' ? (
                      <span className="text-xs text-gray-500">13:00 - 17:00</span>
                    ) : null}

                    {/* End time display */}
                    {showTimeSelector && timeDisplay.end && (
                      <span className="text-xs text-gray-400">
                        ~ {timeDisplay.end}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleSave}
            disabled={unregisteredCount === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('common:save')}
          </button>
        </div>
      </div>
    </div>
  );
}
