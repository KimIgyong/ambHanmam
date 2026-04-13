import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '../store/entity.store';
import { useEmployeeDetail, useCreateEmployee, useUpdateEmployee } from '../hooks/useEmployees';
import EmployeeBasicInfoTab from '../components/employee/EmployeeBasicInfoTab';
import EmployeeDependentsTab from '../components/employee/EmployeeDependentsTab';
import EmployeeSalaryTab from '../components/employee/EmployeeSalaryTab';
import EmployeeKrInfoTab from '../components/employee/EmployeeKrInfoTab';

type TabKey = 'basic' | 'salary' | 'dependents' | 'kr';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MASTER';
  const isNew = !id;
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const isKrEntity = currentEntity?.country === 'KR';

  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const { data: employee, isLoading } = useEmployeeDetail(isNew ? '' : (id || ''));
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const handleSaveBasicInfo = (formData: Record<string, unknown>) => {
    // Remove empty-string values for optional fields to avoid validation errors
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      cleaned[key] = value === '' ? undefined : value;
    }

    if (isNew) {
      // CreateEmployeeRequest does not have end_date
      const { end_date, ...createData } = cleaned;
      // Auto-generate: remove empty employee_code so backend generates it
      if (!createData.employee_code) {
        delete createData.employee_code;
      }
      // Auto-set entity_id from current entity if not provided
      if (!createData.entity_id && currentEntity?.entityId) {
        createData.entity_id = currentEntity.entityId;
      }
      createMutation.mutate(createData, {
        onSuccess: (result) => {
          navigate(`/hr/employees/${result.employeeId}`, { replace: true });
        },
      });
    } else if (id) {
      // UpdateEmployeeRequest does not have employee_code
      const { employee_code, ...updateData } = cleaned;
      updateMutation.mutate({ id, data: updateData });
    }
  };

  const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
    { key: 'basic', label: t('hr:employee.tab.basic') },
    { key: 'salary', label: t('hr:employee.tab.salary'), disabled: isNew },
    { key: 'dependents', label: t('hr:employee.tab.dependents'), disabled: isNew },
    ...(isKrEntity ? [{ key: 'kr' as TabKey, label: t('hr:employee.tab.kr'), disabled: isNew }] : []),
  ];

  if (!isNew && isLoading) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/hr/employees')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <Users className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {isNew
                ? t('hr:employee.list.addNew')
                : `${employee?.employeeCode} ${employee?.fullName}`}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-teal-600 text-teal-700'
                  : tab.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white px-6 py-4">
        {activeTab === 'basic' && (
          <EmployeeBasicInfoTab
            employee={isNew ? null : employee}
            onSave={handleSaveBasicInfo}
            isSaving={createMutation.isPending || updateMutation.isPending}
            isAdmin={isAdmin}
            isKrEntity={isKrEntity}
          />
        )}
        {activeTab === 'salary' && id && !isNew && (
          <EmployeeSalaryTab employeeId={id} isAdmin={isAdmin} />
        )}
        {activeTab === 'dependents' && id && !isNew && (
          <EmployeeDependentsTab employeeId={id} isAdmin={isAdmin} />
        )}
        {activeTab === 'kr' && id && !isNew && isKrEntity && (
          <EmployeeKrInfoTab employeeId={id} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
