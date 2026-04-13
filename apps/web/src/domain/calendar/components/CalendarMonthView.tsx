import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from '../service/calendar.service';
import { useCalendarStore } from '../store/calendar.store';
import { useTimezoneStore } from '@/global/store/timezone.store';
import {
  getMonthGrid,
  formatDate,
  isTodayInTz,
  getCategoryBgClass,
  formatTimeInTz,
  formatDateInTz,
} from './calendar-utils';

interface Props {
  schedules: Calendar[];
}

const WEEKDAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export default function CalendarMonthView({ schedules }: Props) {
  const { t } = useTranslation('calendar');
  const { currentDate, setCurrentDate, setViewType, setSelectedCalendarId, openForm } = useCalendarStore();
  const { timezone } = useTimezoneStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  // Group schedules by date string (in user's timezone)
  const schedulesByDate = useMemo(() => {
    const map: Record<string, Calendar[]> = {};
    schedules.forEach((s) => {
      const startDate = formatDateInTz(s.calStartAt, timezone);
      if (!map[startDate]) map[startDate] = [];
      map[startDate].push(s);
    });
    return map;
  }, [schedules, timezone]);

  const handleDateClick = (date: Date) => {
    openForm(formatDate(date));
  };

  const handleDayNumberClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(date);
    setViewType('day');
  };

  const handleScheduleClick = (calId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCalendarId(calId);
  };

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleExpandDay = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className={`text-center text-xs font-medium py-2 ${
              key === 'SUN' ? 'text-red-500' : key === 'SAT' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {t(`weekdays.${key}`)}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7">
        {grid.map((date, i) => {
          const dateStr = formatDate(date);
          const isCurrentMonth = date.getMonth() === month;
          const today = isTodayInTz(date, timezone);
          const daySchedules = schedulesByDate[dateStr] || [];
          const dayOfWeek = date.getDay();

          return (
            <div
              key={i}
              onClick={() => handleDateClick(date)}
              className={`min-h-[100px] border-b border-r border-gray-200 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''
              }`}
            >
              {/* Date number */}
              <button
                onClick={(e) => handleDayNumberClick(date, e)}
                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  today
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : !isCurrentMonth
                      ? 'text-gray-400 dark:text-gray-600'
                      : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                          ? 'text-blue-500'
                          : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {date.getDate()}
              </button>

              {/* Schedule items */}
              <div className="space-y-0.5">
                {(expandedDays.has(dateStr) ? daySchedules : daySchedules.slice(0, 3)).map((s) => (
                  <button
                    key={s.calId}
                    onClick={(e) => handleScheduleClick(s.calId, e)}
                    className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate border ${getCategoryBgClass(s.calCategory)} hover:opacity-80 transition-opacity`}
                    style={s.calColor ? { borderLeftColor: s.calColor, borderLeftWidth: 3 } : undefined}
                  >
                    {!s.calIsAllDay && (
                      <span className="font-medium mr-0.5">{formatTimeInTz(s.calStartAt, timezone)}</span>
                    )}
                    {s.calTitle}
                  </button>
                ))}
                {daySchedules.length > 3 && (
                  <button
                    onClick={(e) => toggleExpandDay(dateStr, e)}
                    className="text-[10px] text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 pl-1 hover:underline"
                  >
                    {expandedDays.has(dateStr)
                      ? t('collapse', '접기')
                      : `+${daySchedules.length - 3}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
