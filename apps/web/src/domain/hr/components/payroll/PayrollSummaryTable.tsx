import { useTranslation } from 'react-i18next';
import { usePayrollDetails } from '../../hooks/usePayroll';

interface Props {
  periodId: string;
  onSelectEmployee?: (empId: string) => void;
}

const formatVnd = (amount: number) => amount.toLocaleString('vi-VN');

export default function PayrollSummaryTable({ periodId, onSelectEmployee }: Props) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: details = [], isLoading } = usePayrollDetails(periodId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">{t('hr:payroll.table.code')}</th>
            <th className="px-4 py-3">{t('hr:payroll.table.name')}</th>
            <th className="px-4 py-3">{t('hr:payroll.table.department')}</th>
            <th className="px-4 py-3 text-right">{t('hr:payroll.table.baseSalary')}</th>
            <th className="px-4 py-3 text-right">{t('hr:payroll.table.gross')}</th>
            <th className="px-4 py-3 text-right">{t('hr:payroll.table.insurance')}</th>
            <th className="px-4 py-3 text-right">{t('hr:payroll.table.pit')}</th>
            <th className="px-4 py-3 text-right">{t('hr:payroll.table.net')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {details.map((d) => (
            <tr
              key={d.detailId}
              onClick={() => onSelectEmployee?.(d.employeeId)}
              className={`transition-colors hover:bg-gray-50 ${onSelectEmployee ? 'cursor-pointer' : ''}`}
            >
              <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                {d.employeeCode}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{d.employeeName}</td>
              <td className="px-4 py-3 text-gray-600">{d.department}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatVnd(d.baseSalary)}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatVnd(d.totalIncome)}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatVnd(d.totalEmployeeInsurance)}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatVnd(d.pitAmount)}</td>
              <td className="px-4 py-3 text-right font-semibold text-teal-700">
                {formatVnd(d.netSalaryVnd)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {details.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500">
          {t('hr:payroll.noDetails')}
        </div>
      )}
    </div>
  );
}
