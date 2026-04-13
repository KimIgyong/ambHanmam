import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, CalendarOff } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import { useCalendarStore } from '../store/calendar.store';
import { useCalendarList, useCalendarDetail } from '../hooks/useCalendar';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { toUtcIso } from '@/lib/format-utils';
import CalendarToolbar from '../components/CalendarToolbar';
import CalendarMonthView from '../components/CalendarMonthView';
import CalendarWeekView from '../components/CalendarWeekView';
import CalendarDayView from '../components/CalendarDayView';
import CalendarFormModal from '../components/CalendarFormModal';
import CalendarDetailPanel from '../components/CalendarDetailPanel';
import {
  getMonthRange,
  getWeekRange,
  getDayRange,
} from '../components/calendar-utils';
import AttendancePage from '@/domain/attendance/pages/AttendancePage';
import MyLeavePage from '@/domain/hr/pages/MyLeavePage';

type CalendarTab = 'calendar' | 'attendance' | 'myLeave';

export default function CalendarPage() {
  const { t } = useTranslation(['calendar', 'attendance', 'hr']);
  const [activeTab, setActiveTab] = useState<CalendarTab>('calendar');
  const {
    viewType,
    currentDate,
    filterMode,
    filterCategory,
    isFormOpen,
    closeForm,
    selectedCalendarId,
  } = useCalendarStore();
  const { timezone } = useTimezoneStore();

  // Calculate date range based on view type
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    switch (viewType) {
      case 'month':
        return getMonthRange(year, month);
      case 'week':
        return getWeekRange(currentDate);
      case 'day':
        return getDayRange(currentDate);
      default:
        return getMonthRange(year, month);
    }
  }, [viewType, currentDate]);

  // Convert grid date boundaries to UTC ISO strings considering user's timezone
  // e.g. "2026-03-01" in Asia/Seoul → "2026-02-28T15:00:00.000Z"
  const apiDateRange = useMemo(() => ({
    start: toUtcIso(`${dateRange.start} 00:00:00`, timezone),
    end: toUtcIso(`${dateRange.end} 23:59:59`, timezone),
  }), [dateRange, timezone]);

  const { data, isLoading } = useCalendarList({
    start_date: apiDateRange.start,
    end_date: apiDateRange.end,
    filter_mode: filterMode === 'ALL' ? undefined : filterMode === 'MY' ? 'MY_ONLY' : filterMode,
    category: filterCategory || undefined,
  });

  // Get detail for form editing
  const { data: editCalendar } = useCalendarDetail(
    isFormOpen && selectedCalendarId ? selectedCalendarId : null,
  );

  const schedules = data?.items || [];

  const tabs: { key: CalendarTab; label: string; icon: React.ReactNode }[] = [
    { key: 'calendar', label: t('calendar:title'), icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'attendance', label: t('attendance:title'), icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'myLeave', label: t('hr:leaveRequest.title'), icon: <CalendarOff className="h-4 w-4" /> },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 max-w-full">
      {/* Page header */}
      <div className="mb-4">
        <PageTitle>{t('calendar:title')}</PageTitle>
        <p className="mt-0.5 text-sm text-gray-500">{t('calendar:subtitle')}</p>
      </div>

      {/* Tab navigation */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar tab content */}
      {activeTab === 'calendar' && (
        <>
          {/* Toolbar */}
          <CalendarToolbar />

          {/* Calendar view */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {viewType === 'month' && <CalendarMonthView schedules={schedules} />}
              {viewType === 'week' && <CalendarWeekView schedules={schedules} />}
              {viewType === 'day' && <CalendarDayView schedules={schedules} />}
            </>
          )}

          {/* Calendar detail panel (right sidebar) */}
          {selectedCalendarId && !isFormOpen && <CalendarDetailPanel />}

          {/* Form modal */}
          {isFormOpen && (
            <CalendarFormModal
              schedule={editCalendar || null}
              onClose={closeForm}
            />
          )}
        </>
      )}

      {/* Attendance tab content */}
      {activeTab === 'attendance' && <AttendancePage embedded />}

      {/* My Leave tab content */}
      {activeTab === 'myLeave' && <MyLeavePage embedded />}
    </div>
  );
}
