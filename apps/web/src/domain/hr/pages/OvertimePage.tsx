import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { HrOtRecordResponse } from '@amb/types';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { employeeApiService } from '../service/employee.service';
import OvertimeSummary from '../components/overtime/OvertimeSummary';
import OvertimeTable from '../components/overtime/OvertimeTable';
import OvertimeForm from '../components/overtime/OvertimeForm';

export default function OvertimePage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);

  const { data: employees = [] } = useQuery({
    queryKey: ['hr-employees', 'list-for-ot'],
    queryFn: () => employeeApiService.getEmployees(),
    enabled: isAdmin,
  });

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleEdit = (_record: HrOtRecordResponse) => {
    // TODO: open edit modal
  };

  const employeeOptions = employees.map((emp) => ({
    employeeId: emp.employeeId,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <Clock className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:overtime.title')}</h1>
              <p className="text-sm text-gray-500">{t('hr:overtime.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Navigation */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-300 px-1 py-1">
              <button
                onClick={handlePrevMonth}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[100px] text-center text-sm font-medium text-gray-900">
                {month.toString().padStart(2, '0')}/{year}
              </span>
              <button
                onClick={handleNextMonth}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                {t('hr:overtime.addRecord')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="space-y-6 p-6">
          <OvertimeSummary year={year} month={month} />
          <OvertimeTable
            year={year}
            month={month}
            isAdmin={isAdmin}
            isManager={isManager}
            onEdit={handleEdit}
          />
        </div>
      </div>

      {/* OT Form Modal */}
      <OvertimeForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        employees={employeeOptions}
      />
    </div>
  );
}
