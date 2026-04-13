/**
 * Calendar utility functions
 */

import { formatDateTimeInTz } from '@/lib/format-utils';

/** Format date to YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format date to YYYY-MM-DD HH:mm */
export function formatDateTime(d: Date): string {
  const date = formatDate(d);
  const h = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${date} ${h}:${min}`;
}

/** Format time HH:mm from ISO string */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** Format time HH:mm from UTC ISO string in given timezone */
export function formatTimeInTz(iso: string, timezone: string): string {
  return formatDateTimeInTz(iso, timezone, 'HH:mm');
}

/** Get YYYY-MM-DD from UTC ISO string in given timezone */
export function formatDateInTz(iso: string, timezone: string): string {
  return formatDateTimeInTz(iso, timezone, 'YYYY-MM-DD HH:mm').slice(0, 10);
}

/** Get hour (0-23) from UTC ISO string in given timezone */
export function getHourInTz(iso: string, timezone: string): number {
  const timeStr = formatDateTimeInTz(iso, timezone, 'HH:mm');
  return parseInt(timeStr.split(':')[0], 10);
}

/** Check if a grid date is today in the given timezone */
export function isTodayInTz(d: Date, timezone: string): boolean {
  const nowStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return formatDate(d) === nowStr;
}

/** Get first day of month (Sun=0) */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Get days in month */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Get month calendar grid dates (6 weeks x 7 days) */
export function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const dates: Date[] = [];

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    dates.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(new Date(year, month, d));
  }

  // Next month's leading days (fill to 42 = 6 weeks)
  const remaining = 42 - dates.length;
  for (let d = 1; d <= remaining; d++) {
    dates.push(new Date(year, month + 1, d));
  }

  return dates;
}

/** Get week dates (Sun-Sat) for a given date */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(sunday);
    dd.setDate(sunday.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

/** Check if same date */
export function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/** Check if today */
export function isToday(d: Date): boolean {
  return isSameDate(d, new Date());
}

/** Get date range for month view (including overflow days) */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const grid = getMonthGrid(year, month);
  return {
    start: formatDate(grid[0]),
    end: formatDate(grid[grid.length - 1]),
  };
}

/** Get date range for week view */
export function getWeekRange(date: Date): { start: string; end: string } {
  const dates = getWeekDates(date);
  return {
    start: formatDate(dates[0]),
    end: formatDate(dates[6]),
  };
}

/** Get date range for day view */
export function getDayRange(date: Date): { start: string; end: string } {
  const d = formatDate(date);
  return { start: d, end: d };
}

/** Category colors mapping */
export const CATEGORY_COLORS: Record<string, string> = {
  MEETING: '#3B82F6',    // blue
  TASK: '#10B981',       // green
  EVENT: '#8B5CF6',      // purple
  REMINDER: '#F59E0B',   // amber
  OUT_OF_OFFICE: '#EF4444', // red
  PERSONAL: '#EC4899',   // pink
  OTHER: '#6B7280',      // gray
};

/** Get background color class for category */
export function getCategoryBgClass(category: string): string {
  const map: Record<string, string> = {
    MEETING: 'bg-blue-100 text-blue-800 border-blue-200',
    TASK: 'bg-green-100 text-green-800 border-green-200',
    EVENT: 'bg-purple-100 text-purple-800 border-purple-200',
    REMINDER: 'bg-amber-100 text-amber-800 border-amber-200',
    OUT_OF_OFFICE: 'bg-red-100 text-red-800 border-red-200',
    PERSONAL: 'bg-pink-100 text-pink-800 border-pink-200',
    OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return map[category] || map.OTHER;
}

/** Priority colors */
export function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'text-gray-400',
    NORMAL: 'text-blue-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-600',
  };
  return map[priority] || map.NORMAL;
}

/** Hours array for day/week view */
export function getHoursArray(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}
