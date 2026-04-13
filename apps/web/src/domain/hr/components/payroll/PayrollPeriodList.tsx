import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { usePayrollPeriods } from '../../hooks/usePayroll';
import PayrollStatusBadge from './PayrollStatusBadge';

interface Props {
  onSelectPeriod: (periodId: string) => void;
}

const formatVnd = (amount: number) => amount.toLocaleString('vi-VN');

export default function PayrollPeriodList({ onSelectPeriod }: Props) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: periods = [], isLoading } = usePayrollPeriods();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        {t('hr:payroll.empty')}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {periods.map((period) => (
        <div
          key={period.periodId}
          onClick={() => onSelectPeriod(period.periodId)}
          className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
              <CalendarDays className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {period.month.toString().padStart(2, '0')}/{period.year}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <PayrollStatusBadge status={period.status} />
                <span className="text-xs text-gray-500">
                  {t('hr:payroll.employeeCount', { count: period.employeeCount })}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden gap-6 text-right sm:flex">
            <div>
              <p className="text-xs text-gray-500">{t('hr:payroll.detail.totalIncome')}</p>
              <p className="text-sm font-medium text-gray-900">{formatVnd(period.totalGross)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('hr:payroll.detail.insurance')}</p>
              <p className="text-sm font-medium text-gray-900">{formatVnd(period.totalInsurance)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('hr:payroll.detail.pit')}</p>
              <p className="text-sm font-medium text-gray-900">{formatVnd(period.totalPit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('hr:payroll.detail.netSalary')}</p>
              <p className="text-sm font-semibold text-teal-700">{formatVnd(period.totalNet)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
