import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import EmployeeSelector from '../components/severance/EmployeeSelector';
import SeveranceResult from '../components/severance/SeveranceResult';

export default function SeverancePage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState('');

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">
            {t('common:noPermission')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <Calculator className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:severance.title')}</h1>
              <p className="text-sm text-gray-500">{t('hr:severance.subtitle')}</p>
            </div>
          </div>

          {/* End Date Input */}
          <div className="flex items-center gap-2">
            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              {t('hr:severance.endDate')}
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="grid h-full grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Left Panel - Employee Selector */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 p-4">
            <EmployeeSelector onSelect={setSelectedEmpId} selectedId={selectedEmpId} />
          </div>

          {/* Right Panel - Calculation Result */}
          <div className="overflow-y-auto rounded-lg border border-gray-200 p-4 lg:col-span-2">
            {selectedEmpId ? (
              <SeveranceResult
                empId={selectedEmpId}
                endDate={endDate || undefined}
                isAdmin={isAdmin}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-gray-500">{t('hr:severance.selectEmployee')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
