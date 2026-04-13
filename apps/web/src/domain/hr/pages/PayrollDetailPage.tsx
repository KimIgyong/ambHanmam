import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { usePayrollPeriod, usePayrollDetailByEmployee } from '../hooks/usePayroll';
import PayrollStatusBadge from '../components/payroll/PayrollStatusBadge';
import PayrollProcessing from '../components/payroll/PayrollProcessing';
import PayrollSummaryTable from '../components/payroll/PayrollSummaryTable';
import PayrollDetailView from '../components/payroll/PayrollDetailView';

export default function PayrollDetailPage() {
  const { t } = useTranslation(['hr', 'common']);
  const { periodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { data: period, isLoading, refetch } = usePayrollPeriod(periodId || '');
  const { data: empDetail } = usePayrollDetailByEmployee(periodId || '', selectedEmployeeId || '');

  if (isLoading || !period) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/hr/payroll')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">
                {t('hr:payroll.periodTitle', {
                  month: period.month.toString().padStart(2, '0'),
                  year: period.year,
                })}
              </h1>
              <PayrollStatusBadge status={period.status} />
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {t('hr:payroll.employeeCount', { count: period.employeeCount })}
              {period.paymentDate && (
                <>
                  {' '}&middot; {t('hr:payroll.paymentDate')}: {period.paymentDate}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-4">
        {/* Processing Panel */}
        <PayrollProcessing
          periodId={periodId || ''}
          status={period.status}
          isAdmin={isAdmin}
          isManager={isManager}
          onAction={() => refetch()}
        />

        {/* Summary Table */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">{t('hr:payroll.detailsTitle')}</h3>
          </div>
          <PayrollSummaryTable
            periodId={periodId || ''}
            onSelectEmployee={(empId) => setSelectedEmployeeId(empId)}
          />
        </div>
      </div>

      {/* Employee Detail Slide-over */}
      {selectedEmployeeId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedEmployeeId(null)}
          />
          <div className="relative w-full max-w-lg overflow-y-auto bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('hr:payroll.employeeDetail')}
              </h3>
              <button
                onClick={() => setSelectedEmployeeId(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {empDetail ? (
                <PayrollDetailView detail={empDetail} />
              ) : (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
