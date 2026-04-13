import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { employeeApiService } from '../../service/employee.service';
import { formatDate } from '@/lib/format-utils';

interface EmployeeSelectorProps {
  onSelect: (empId: string) => void;
  selectedId: string | null;
}

export default function EmployeeSelector({ onSelect, selectedId }: EmployeeSelectorProps) {
  const { t } = useTranslation(['hr', 'common']);
  const [search, setSearch] = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['hr-employees', 'list-for-severance'],
    queryFn: () => employeeApiService.getEmployees(),
  });

  const filtered = useMemo(() => {
    const eligible = employees.filter(
      (emp) => emp.status === 'OFFICIAL' || emp.status === 'PROBATION',
    );

    if (!search.trim()) return eligible;

    const keyword = search.toLowerCase();
    return eligible.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(keyword) ||
        emp.employeeCode.toLowerCase().includes(keyword),
    );
  }, [employees, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        {t('hr:severance.selectEmployee')}
      </h3>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('hr:severance.search')}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {/* Employee List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {t('hr:employee.list.empty')}
          </p>
        ) : (
          filtered.map((emp) => {
            const isSelected = emp.employeeId === selectedId;
            return (
              <button
                key={emp.employeeId}
                onClick={() => onSelect(emp.employeeId)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">
                        {emp.employeeCode}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {emp.fullName}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>{emp.department}</span>
                      <span>{formatDate(emp.startDate)}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
