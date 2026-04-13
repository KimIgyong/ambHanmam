import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TreePalm, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useRecalculateLeave } from '../hooks/useLeave';
import LeaveSummary from '../components/leave/LeaveSummary';
import LeaveBalanceTable from '../components/leave/LeaveBalanceTable';
import LeaveDetailModal from '../components/leave/LeaveDetailModal';

export default function LeavePage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const recalculate = useRecalculateLeave();

  const handlePrevYear = useCallback(() => {
    setYear((y) => y - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setYear((y) => y + 1);
  }, []);

  const handleRecalculate = useCallback(async () => {
    const result = await recalculate.mutateAsync(year);
    if (result?.recalculatedCount !== undefined) {
      alert(t('hr:leave.recalculatedCount', { count: result.recalculatedCount }));
    }
  }, [recalculate, year, t]);

  const handleRowClick = useCallback((employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEmployeeId(null);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <TreePalm className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:leave.title')}</h1>
              <p className="text-sm text-gray-500">{t('hr:leave.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Year Navigation */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-300 px-1 py-1">
              <button
                onClick={handlePrevYear}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[60px] text-center text-sm font-medium text-gray-900">
                {year}
              </span>
              <button
                onClick={handleNextYear}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Recalculate (Admin only) */}
            {isAdmin && (
              <button
                onClick={handleRecalculate}
                disabled={recalculate.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${recalculate.isPending ? 'animate-spin' : ''}`} />
                {recalculate.isPending ? t('hr:leave.recalculating') : t('hr:leave.recalculate')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="space-y-6 p-6">
          <LeaveSummary year={year} />
          <LeaveBalanceTable
            year={year}
            isAdmin={isAdmin}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Detail Modal */}
      <LeaveDetailModal
        isOpen={selectedEmployeeId !== null}
        onClose={handleCloseModal}
        employeeId={selectedEmployeeId ?? ''}
        year={year}
        isAdmin={isAdmin}
      />
    </div>
  );
}
