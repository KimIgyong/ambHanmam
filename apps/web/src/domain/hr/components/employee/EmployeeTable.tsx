import { useTranslation } from 'react-i18next';
import { HrEmployeeResponse } from '@amb/types';
import { formatDate } from '@/lib/format-utils';

interface EmployeeTableProps {
  employees: HrEmployeeResponse[];
  onRowClick: (employee: HrEmployeeResponse) => void;
}

const getStatusStyle = (status: string, contractType: string) => {
  if (status === 'RESIGNED') return 'bg-gray-100 text-gray-500';
  if (status === 'PARENTAL_LEAVE' || status === 'TEMPORARY_LEAVE') return 'bg-amber-100 text-amber-700';
  if (contractType === 'FREELANCER') return 'bg-teal-100 text-teal-700';
  return 'bg-green-100 text-green-700';
};

const getStatusLabel = (status: string, contractType: string, t: (key: string) => string) => {
  if (contractType === 'FREELANCER') {
    return status === 'RESIGNED'
      ? t('hr:employee.displayStatus.contractEnded')
      : t('hr:employee.displayStatus.underContract');
  }
  if (status === 'RESIGNED') return t('hr:employee.displayStatus.resigned');
  if (status === 'PARENTAL_LEAVE') return t('hr:employee.displayStatus.parentalLeave');
  if (status === 'TEMPORARY_LEAVE') return t('hr:employee.displayStatus.temporaryLeave');
  return t('hr:employee.displayStatus.active');
};

const contractTypeColors: Record<string, string> = {
  EMPLOYEE: 'bg-blue-100 text-blue-700',
  FREELANCER: 'bg-purple-100 text-purple-700',
};

export default function EmployeeTable({ employees, onRowClick }: EmployeeTableProps) {
  const { t } = useTranslation(['hr']);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">{t('hr:employee.form.code')}</th>
            <th className="px-4 py-3">{t('hr:employee.form.fullName')}</th>
            <th className="px-4 py-3">{t('hr:employee.form.department')}</th>
            <th className="px-4 py-3">{t('hr:employee.form.position')}</th>
            <th className="px-4 py-3">{t('hr:employee.form.status')}</th>
            <th className="px-4 py-3">{t('hr:employee.form.contractType')}</th>
            <th className="px-4 py-3">{t('hr:employee.form.startDate')}</th>
            <th className="px-4 py-3">{t('hr:employee.form.dependents')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map((emp) => (
            <tr
              key={emp.employeeId}
              onClick={() => onRowClick(emp)}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                {emp.employeeCode}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{emp.fullName}</td>
              <td className="px-4 py-3 text-gray-600">{emp.department}</td>
              <td className="px-4 py-3 text-gray-600">{emp.position}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(emp.status, emp.contractType)}`}>
                  {getStatusLabel(emp.status, emp.contractType, t)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${contractTypeColors[emp.contractType] || 'bg-blue-100 text-blue-700'}`}>
                  {t(`hr:employee.contractType.${(emp.contractType || 'EMPLOYEE').toLowerCase()}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{formatDate(emp.startDate)}</td>
              <td className="px-4 py-3 text-center text-gray-600">{emp.dependentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {employees.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-500">
          {t('hr:employee.list.empty')}
        </div>
      )}
    </div>
  );
}
