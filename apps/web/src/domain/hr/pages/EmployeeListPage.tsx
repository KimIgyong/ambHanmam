import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Plus, Search } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEmployeeList } from '../hooks/useEmployees';
import EmployeeTable from '../components/employee/EmployeeTable';

export default function EmployeeListPage() {
  const { t } = useTranslation(['hr', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'MANAGER';

  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [contractTypeFilter, setContractTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: employees = [], isLoading } = useEmployeeList({
    department: departmentFilter || undefined,
  });

  const filtered = employees.filter((e) => {
    if (statusFilter === 'ACTIVE' && e.status === 'RESIGNED') return false;
    if (statusFilter === 'RESIGNED' && e.status !== 'RESIGNED') return false;
    if (contractTypeFilter && e.contractType !== contractTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.fullName.toLowerCase().includes(q) && !e.employeeCode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const departments = [...new Set(employees.map((e) => e.department))].sort();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:employee.list.title')}</h1>
              <p className="text-sm text-gray-500">
                {t('hr:employee.list.subtitle', { count: filtered.length })}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/hr/employees/new')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              {t('hr:employee.list.addNew')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('hr:employee.list.search')}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">{t('hr:employee.list.allStatus')}</option>
            <option value="ACTIVE">{t('hr:employee.displayStatus.active')}</option>
            <option value="RESIGNED">{t('hr:employee.displayStatus.inactive')}</option>
          </select>
          <select
            value={contractTypeFilter}
            onChange={(e) => setContractTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">{t('hr:employee.list.allContractTypes')}</option>
            <option value="EMPLOYEE">{t('hr:employee.contractType.employee')}</option>
            <option value="FREELANCER">{t('hr:employee.contractType.freelancer')}</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">{t('hr:employee.list.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : (
          <EmployeeTable
            employees={filtered}
            onRowClick={(emp) => navigate(`/hr/employees/${emp.employeeId}`)}
          />
        )}
      </div>
    </div>
  );
}
