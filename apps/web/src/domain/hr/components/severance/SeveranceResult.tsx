import { useTranslation } from 'react-i18next';
import { useSeveranceCalculation, useConfirmSeverance } from '../../hooks/useSeverance';
import { formatDate } from '@/lib/format-utils';

interface SeveranceResultProps {
  empId: string;
  endDate?: string;
  isAdmin: boolean;
}

export default function SeveranceResult({ empId, endDate, isAdmin }: SeveranceResultProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data, isLoading, isError } = useSeveranceCalculation(empId, endDate);
  const confirmSeverance = useConfirmSeverance();

  const handleConfirm = () => {
    if (!data) return;
    const confirmed = window.confirm(t('hr:severance.confirmMessage'));
    if (confirmed) {
      confirmSeverance.mutate(data.employeeId, {
        onSuccess: () => {
          alert(t('hr:severance.confirmed'));
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        {t('hr:severance.calculating')}
      </div>
    );
  }

  const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN');

  const isNotEligible = data.severanceAmount === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <h3 className="text-sm font-semibold text-gray-700">{t('hr:severance.result.title')}</h3>

      {/* Employee Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('hr:severance.result.employeeCode')}</span>
            <p className="font-medium text-gray-900">{data.employeeCode}</p>
          </div>
          <div>
            <span className="text-gray-500">{t('hr:severance.result.employeeName')}</span>
            <p className="font-medium text-gray-900">{data.employeeName}</p>
          </div>
          <div>
            <span className="text-gray-500">{t('hr:severance.result.department')}</span>
            <p className="font-medium text-gray-900">{data.department}</p>
          </div>
          <div>
            <span className="text-gray-500">{t('hr:severance.result.startDate')}</span>
            <p className="font-medium text-gray-900">{formatDate(data.startDate)}</p>
          </div>
          {data.endDate && (
            <div>
              <span className="text-gray-500">{t('hr:severance.result.endDate')}</span>
              <p className="font-medium text-gray-900">{formatDate(data.endDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-sm text-gray-500">{t('hr:severance.result.yearsOfService')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data.yearsOfService.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">{t('hr:severance.result.averageSalary')}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(data.averageSalary6Months)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">{t('hr:severance.result.severanceAmount')}</p>
            <p className="mt-1 text-2xl font-bold text-teal-600">
              {isNotEligible ? '0' : formatCurrency(data.severanceAmount)}
            </p>
          </div>
        </div>

        {/* Formula */}
        <p className="mt-4 text-center text-xs text-gray-400">
          {t('hr:severance.result.formula')}
        </p>
      </div>

      {/* Not Eligible Warning */}
      {isNotEligible && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">{t('hr:severance.result.notEligible')}</p>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      {data.breakdown && data.breakdown.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-gray-700">
              {t('hr:severance.result.breakdown')}
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2">{t('hr:severance.result.month')}</th>
                  <th className="px-4 py-2 text-right">{t('hr:severance.result.salary')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.breakdown.map((row) => (
                  <tr key={row.month}>
                    <td className="px-4 py-2 text-gray-900">{row.month}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900">
                      {formatCurrency(row.salary)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="px-4 py-2 font-semibold text-gray-700">
                    {t('hr:severance.result.averageSalary')}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-teal-600">
                    {formatCurrency(data.averageSalary6Months)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Button (Admin only) */}
      {isAdmin && !isNotEligible && (
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={confirmSeverance.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmSeverance.isPending
              ? t('hr:severance.calculating')
              : t('hr:severance.confirm')}
          </button>
        </div>
      )}
    </div>
  );
}
