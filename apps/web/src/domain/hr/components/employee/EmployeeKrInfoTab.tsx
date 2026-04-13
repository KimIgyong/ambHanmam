import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEmployeeKrInfo, useCreateEmployeeKr, useUpdateEmployeeKr } from '../../hooks/useEmployeeKr';

interface EmployeeKrInfoTabProps {
  employeeId: string;
  isAdmin: boolean;
}

const EMPLOYEE_TYPES = ['REGULAR', 'CONTRACT', 'DAILY', 'REPRESENTATIVE', 'INTERN'];
const WITHHOLDING_RATES = ['80', '100', '120'];

export default function EmployeeKrInfoTab({ employeeId, isAdmin }: EmployeeKrInfoTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: krInfo, isLoading } = useEmployeeKrInfo(employeeId);
  const createMutation = useCreateEmployeeKr();
  const updateMutation = useUpdateEmployeeKr();

  const [form, setForm] = useState({
    employee_type: 'REGULAR',
    resident_no: '',
    pension_no: '',
    health_ins_no: '',
    employ_ins_no: '',
    pension_exempt: false,
    health_exempt: false,
    employ_exempt: false,
    tax_dependents: 1,
    withholding_rate: '100',
    bank_account: '',
  });

  useEffect(() => {
    if (krInfo) {
      setForm({
        employee_type: krInfo.employeeType,
        resident_no: '',
        pension_no: krInfo.pensionNo || '',
        health_ins_no: krInfo.healthInsNo || '',
        employ_ins_no: krInfo.employInsNo || '',
        pension_exempt: krInfo.pensionExempt,
        health_exempt: krInfo.healthExempt,
        employ_exempt: krInfo.employExempt,
        tax_dependents: krInfo.taxDependents,
        withholding_rate: krInfo.withholdingRate,
        bank_account: krInfo.bankAccount || '',
      });
    }
  }, [krInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (!payload.resident_no) delete payload.resident_no;

    if (krInfo) {
      updateMutation.mutate({ empId: employeeId, data: payload });
    } else {
      createMutation.mutate({ empId: employeeId, data: payload });
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'employee_type' && value === 'REPRESENTATIVE') {
        next.employ_exempt = true;
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        {krInfo ? t('hr:kr.employee.editInfo') : t('hr:kr.employee.createInfo')}
        {krInfo?.residentNo && (
          <span className="ml-2 font-mono text-xs">{krInfo.residentNo}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.type.title')} *
          </label>
          <select
            value={form.employee_type}
            onChange={(e) => handleChange('employee_type', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          >
            {EMPLOYEE_TYPES.map((t2) => (
              <option key={t2} value={t2}>{t(`hr:kr.employee.type.${t2.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.residentNo')}
          </label>
          <input
            type="text"
            value={form.resident_no}
            onChange={(e) => handleChange('resident_no', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
            placeholder={krInfo ? t('hr:kr.employee.residentNoPlaceholder') : ''}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.pensionNo')}
          </label>
          <input
            type="text"
            value={form.pension_no}
            onChange={(e) => handleChange('pension_no', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.healthInsNo')}
          </label>
          <input
            type="text"
            value={form.health_ins_no}
            onChange={(e) => handleChange('health_ins_no', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.employInsNo')}
          </label>
          <input
            type="text"
            value={form.employ_ins_no}
            onChange={(e) => handleChange('employ_ins_no', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.bankAccount')}
          </label>
          <input
            type="text"
            value={form.bank_account}
            onChange={(e) => handleChange('bank_account', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.taxDependents')}
          </label>
          <input
            type="number"
            value={form.tax_dependents}
            onChange={(e) => handleChange('tax_dependents', Number(e.target.value))}
            disabled={!isAdmin}
            min={1}
            max={20}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:kr.employee.withholdingRate')}
          </label>
          <select
            value={form.withholding_rate}
            onChange={(e) => handleChange('withholding_rate', e.target.value)}
            disabled={!isAdmin}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
          >
            {WITHHOLDING_RATES.map((r) => (
              <option key={r} value={r}>{r}%</option>
            ))}
          </select>
        </div>
      </div>

      {/* Insurance exemptions */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-medium text-gray-700">{t('hr:kr.employee.insuranceExempt')}</h4>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pension_exempt}
              onChange={(e) => handleChange('pension_exempt', e.target.checked)}
              disabled={!isAdmin}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {t('hr:kr.insurance.pension')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.health_exempt}
              onChange={(e) => handleChange('health_exempt', e.target.checked)}
              disabled={!isAdmin}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {t('hr:kr.insurance.health')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.employ_exempt}
              onChange={(e) => handleChange('employ_exempt', e.target.checked)}
              disabled={!isAdmin}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {t('hr:kr.insurance.employ')}
          </label>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? t('common:processing') : t('common:save')}
          </button>
        </div>
      )}
    </form>
  );
}
