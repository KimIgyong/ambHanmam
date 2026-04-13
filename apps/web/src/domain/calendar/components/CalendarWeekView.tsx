import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from '../service/calendar.service';
import { useCalendarStore } from '../store/calendar.store';
import { useTimezoneStore } from '@/global/store/timezone.store';
import {
  getWeekDates,
  formatDate,
  isTodayInTz,
  getHoursArray,
  getCategoryBgClass,
  formatTimeInTz,
  formatDateInTz,
  getHourInTz,
} from './calendar-utils';

interface Props {
  schedules: Calendar[];
}

const WEEKDAY_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export default function CalendarWeekView({ schedules }: Props) {
  const { t } = useTranslation('calendar');
  const { currentDate, setCurrentDate, setViewType, setSelectedCalendarId, openForm } = useCalendarStore();
  const { timezone } = useTimezoneStore();

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const hours = getHoursArray();

  // Group schedules by date (in user's timezone)
  const schedulesByDate = useMemo(() => {
    const map: Record<string, Calendar[]> = {};
    schedules.forEach((s) => {
      const dateStr = formatDateInTz(s.calStartAt, timezone);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(s);
    });
    return map;
  }, [schedules, timezone]);

  // All-day schedules (in user's timezone)
  const allDayByDate = useMemo(() => {
    const map: Record<string, Calendar[]> = {};
    schedules.filter((s) => s.calIsAllDay).forEach((s) => {
      const dateStr = formatDateInTz(s.calStartAt, timezone);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(s);
    });
    return map;
  }, [schedules, timezone]);

  const handleScheduleClick = (calId: string) => {
    setSelectedCalendarId(calId);
  };

  const handleCellClick = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    openForm(formatDate(d));
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="border-r border-gray-200 dark:border-gray-700" />
        {weekDates.map((date, i) => {
          const today = isTodayInTz(date, timezone);
          return (
            <div
              key={i}
              className={`text-center py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                today ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => { setCurrentDate(date); setViewType('day'); }}
            >
              <div className={`text-[10px] font-medium ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {t(`weekdays.${WEEKDAY_KEYS[i]}`)}
              </div>
              <div className={`text-sm font-semibold ${
                today ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700 min-h-[32px]">
        <div className="text-[10px] text-gray-400 flex items-center justify-center border-r border-gray-200 dark:border-gray-700">
          ALL
        </div>
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date);
          const allDay = allDayByDate[dateStr] || [];
          return (
            <div key={i} className="p-0.5 border-r border-gray-200 dark:border-gray-700">
              {allDay.map((s) => (
                <button
                  key={s.calId}
                  onClick={() => handleScheduleClick(s.calId)}
                  className={`w-full text-left text-[10px] px-1 py-0.5 rounded truncate border ${getCategoryBgClass(s.calCategory)} hover:opacity-80`}
                >
                  {s.calTitle}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100 dark:border-gray-800"
          >
            {/* Time label */}
            <div className="text-[10px] text-gray-400 text-right pr-2 py-1 border-r border-gray-200 dark:border-gray-700 h-12">
              {hour.toString().padStart(2, '0')}:00
            </div>

            {/* Day columns */}
            {weekDates.map((date, i) => {
              const dateStr = formatDate(date);
              const daySchedules = (schedulesByDate[dateStr] || []).filter((s) => {
                if (s.calIsAllDay) return false;
                const h = getHourInTz(s.calStartAt, timezone);
                return h === hour;
              });

              return (
                <div
                  key={i}
                  className="border-r border-gray-100 dark:border-gray-800 h-12 relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  onClick={() => handleCellClick(date, hour)}
                >
                  {daySchedules.map((s) => (
                    <button
                      key={s.calId}
                      onClick={(e) => { e.stopPropagation(); handleScheduleClick(s.calId); }}
                      className={`absolute inset-x-0.5 text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate border ${getCategoryBgClass(s.calCategory)} hover:opacity-80 z-10`}
                    >
                      <span className="font-medium">{formatTimeInTz(s.calStartAt, timezone)}</span> {s.calTitle}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
