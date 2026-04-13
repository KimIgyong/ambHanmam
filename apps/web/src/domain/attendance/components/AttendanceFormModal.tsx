import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2 } from 'lucide-react';
import { AttendanceResponse, ATTENDANCE_TYPE, START_TIME_OPTIONS } from '@amb/types';

interface AttendanceFormModalProps {
  date: string;
  schedule?: AttendanceResponse;
  onClose: () => void;
  onSave: (data: { date: string; type: string; start_time?: string }) => void;
  onUpdate?: (id: string, data: { type: string; start_time?: string }) => void;
  onDelete?: (id: string) => void;
}

function calculateEndTime(type: string, startTime: string): string | null {
  switch (type) {
    case 'WORK':
    case 'REMOTE': {
      const [h, m] = startTime.split(':');
      const hour = parseInt(h) + 9;
      return `${hour.toString().padStart(2, '0')}:${m}`;
    }
    case 'DAY_OFF':
    case 'MENSTRUATION':
      return null;
    case 'AM_HALF':
      return '17:00';
    case 'PM_HALF':
      return '12:00';
    default:
      return null;
  }
}

function getStartTimeForType(type: string, startTime: string): string | null {
  switch (type) {
    case 'WORK':
    case 'REMOTE':
    case 'PM_HALF':
      return startTime;
    case 'AM_HALF':
      return '13:00';
    case 'DAY_OFF':
    case 'MENSTRUATION':
      return null;
    default:
      return null;
  }
}

export default function AttendanceFormModal({
  date,
  schedule,
  onClose,
  onSave,
  onUpdate,
  onDelete,
}: AttendanceFormModalProps) {
  const { t } = useTranslation(['attendance', 'common']);
  const isEdit = !!schedule;

  const [type, setType] = useState<string>(schedule?.type || 'WORK');
  const [startTime, setStartTime] = useState(
    schedule?.startTime && START_TIME_OPTIONS.includes(schedule.startTime as typeof START_TIME_OPTIONS[number])
      ? schedule.startTime
      : '09:00',
  );

  const displayStartTime = getStartTimeForType(type, startTime);
  const displayEndTime = displayStartTime ? calculateEndTime(type, startTime) : null;

  const showTimeSelector = type === 'WORK' || type === 'REMOTE' || type === 'PM_HALF';
  const showTimeDisplay = type !== 'DAY_OFF' && type !== 'MENSTRUATION';

  const handleSave = () => {
    if (isEdit && onUpdate) {
      onUpdate(schedule.attendanceId, {
        type,
        start_time: showTimeSelector ? startTime : undefined,
      });
    } else {
      onSave({
        date,
        type,
        start_time: showTimeSelector ? startTime : undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (isEdit && onDelete) {
      onDelete(schedule.attendanceId);
      onClose();
    }
  };

  const dateObj = new Date(date + 'T00:00:00');
  const dateLabel = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? t('attendance:editSchedule') : t('attendance:addSchedule')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('attendance:form.date')}
          </label>
          <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {dateLabel}
          </div>
        </div>

        {/* Type selector */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('attendance:form.type')}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Object.values(ATTENDANCE_TYPE).map((val) => (
              <option key={val} value={val}>
                {t(`attendance:type.${val}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Time fields */}
        {showTimeDisplay && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            {/* Start time */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('attendance:form.startTime')}
              </label>
              {showTimeSelector ? (
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {START_TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  {displayStartTime}
                </div>
              )}
            </div>

            {/* End time */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('attendance:form.endTime')}
              </label>
              <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                {displayEndTime}{' '}
                <span className="text-xs text-gray-400">
                  ({t('attendance:form.autoCalculated')})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {isEdit && onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {t('common:delete')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              {t('common:save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
