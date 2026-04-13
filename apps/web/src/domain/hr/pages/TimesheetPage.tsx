import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useBatchUpsertTimesheet } from '../hooks/useTimesheet';
import TimesheetSummary from '../components/timesheet/TimesheetSummary';
import TimesheetGrid from '../components/timesheet/TimesheetGrid';

export default function TimesheetPage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const batchUpsert = useBatchUpsertTimesheet();

  const handlePrevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  const handleSave = useCallback(
    async (
      entries: Array<{
        employee_id: string;
        work_date: string;
        attendance_code?: string;
      }>,
    ) => {
      await batchUpsert.mutateAsync({ entries });
    },
    [batchUpsert],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <CalendarDays className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:timesheet.title')}</h1>
              <p className="text-sm text-gray-500">{t('hr:timesheet.subtitle')}</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-50"
              title={t('hr:timesheet.prevMonth')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[120px] text-center text-sm font-semibold text-gray-900">
              {year}.{String(month).padStart(2, '0')}
            </span>
            <button
              onClick={handleNextMonth}
              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-50"
              title={t('hr:timesheet.nextMonth')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Summary Cards */}
        <TimesheetSummary year={year} month={month} />

        {/* Grid */}
        <TimesheetGrid
          year={year}
          month={month}
          isAdmin={isAdmin}
          onSave={handleSave}
          isSaving={batchUpsert.isPending}
        />
      </div>
    </div>
  );
}
