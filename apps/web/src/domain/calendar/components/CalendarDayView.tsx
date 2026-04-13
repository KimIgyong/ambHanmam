import { useMemo } from 'react';
import { Calendar } from '../service/calendar.service';
import { useCalendarStore } from '../store/calendar.store';
import { useTimezoneStore } from '@/global/store/timezone.store';
import {
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

export default function CalendarDayView({ schedules }: Props) {
  const { currentDate, setSelectedCalendarId, openForm } = useCalendarStore();
  const { timezone } = useTimezoneStore();

  const hours = getHoursArray();
  const dateStr = formatDate(currentDate);
  const today = isTodayInTz(currentDate, timezone);

  // Separate all-day and timed schedules (using timezone-aware date)
  const { allDaySchedules, timedSchedules } = useMemo(() => {
    const daySchedules = schedules.filter(
      (s) => formatDateInTz(s.calStartAt, timezone) === dateStr,
    );
    return {
      allDaySchedules: daySchedules.filter((s) => s.calIsAllDay),
      timedSchedules: daySchedules.filter((s) => !s.calIsAllDay),
    };
  }, [schedules, dateStr, timezone]);

  // Group timed by hour (using timezone)
  const byHour = useMemo(() => {
    const map: Record<number, Calendar[]> = {};
    timedSchedules.forEach((s) => {
      const h = getHourInTz(s.calStartAt, timezone);
      if (!map[h]) map[h] = [];
      map[h].push(s);
    });
    return map;
  }, [timedSchedules, timezone]);

  const handleCellClick = (_hour: number) => {
    openForm(dateStr);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Date header */}
      <div className={`text-center py-3 border-b border-gray-200 dark:border-gray-700 ${
        today ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
      }`}>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: timezone }).format(currentDate)}
        </div>
        <div className={`text-2xl font-bold ${today ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}>
          {currentDate.getDate()}
        </div>
      </div>

      {/* All-day area */}
      {allDaySchedules.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-2">
          <div className="text-[10px] text-gray-400 mb-1">ALL DAY</div>
          <div className="space-y-1">
            {allDaySchedules.map((s) => (
              <button
                key={s.calId}
                onClick={() => setSelectedCalendarId(s.calId)}
                className={`w-full text-left text-sm px-2 py-1 rounded border ${getCategoryBgClass(s.calCategory)} hover:opacity-80`}
              >
                {s.calTitle}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const hourSchedules = byHour[hour] || [];
          return (
            <div
              key={hour}
              className="flex border-b border-gray-100 dark:border-gray-800 min-h-[48px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30"
              onClick={() => handleCellClick(hour)}
            >
              {/* Time label */}
              <div className="w-16 flex-shrink-0 text-right pr-3 py-1 text-xs text-gray-400 border-r border-gray-200 dark:border-gray-700">
                {hour.toString().padStart(2, '0')}:00
              </div>

              {/* Schedules */}
              <div className="flex-1 p-1 space-y-1">
                {hourSchedules.map((s) => (
                  <button
                    key={s.calId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCalendarId(s.calId);
                    }}
                    className={`w-full text-left text-sm px-2 py-1 rounded border ${getCategoryBgClass(s.calCategory)} hover:opacity-80`}
                  >
                    <span className="font-medium mr-1">{formatTimeInTz(s.calStartAt, timezone)}</span>
                    {s.calTitle}
                    {s.calLocation && (
                      <span className="text-xs ml-2 opacity-70">📍 {s.calLocation}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
