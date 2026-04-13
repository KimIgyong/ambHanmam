import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useAvailableEmployees, useLinkEmployee } from '../hooks/useMembers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  onSuccess?: () => void;
}

export default function LinkEmployeeModal({ isOpen, onClose, memberId, onSuccess }: Props) {
  const { t } = useTranslation(['members', 'common']);
  const { data: employees, isLoading } = useAvailableEmployees(memberId);
  const linkEmployee = useLinkEmployee();
  const [selectedEmpId, setSelectedEmpId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedEmpId) return;
    await linkEmployee.mutateAsync({ empId: selectedEmpId, usrId: memberId });
    setSelectedEmpId('');
    onClose();
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t('members:memberDetail.linkEmployee')}
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : !employees || employees.length === 0 ? (
          <p className="py-4 text-sm text-gray-400">
            {t('members:memberDetail.noAvailableEmployees')}
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {employees.map((emp) => (
              <label
                key={emp.employeeId}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedEmpId === emp.employeeId
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="employee"
                  value={emp.employeeId}
                  checked={selectedEmpId === emp.employeeId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="text-indigo-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {emp.fullName}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {emp.employeeCode}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {emp.entityName} · {emp.department} · {emp.position}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedEmpId || linkEmployee.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('members:memberDetail.linkEmployee')}
          </button>
        </div>
      </div>
    </div>
  );
}
