import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { useSalaryHistoryList, useCreateSalaryHistory } from '../../hooks/useEmployees';
import { formatDate } from '@/lib/format-utils';

interface EmployeeSalaryTabProps {
  employeeId: string;
  isAdmin: boolean;
}

export default function EmployeeSalaryTab({ employeeId, isAdmin }: EmployeeSalaryTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: history = [], isLoading } = useSalaryHistoryList(employeeId);
  const createMutation = useCreateSalaryHistory();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    base_salary_vnd: 0,
    base_salary_krw: 0,
    base_salary_usd: 0,
    exchange_rate_krw: 1,
    exchange_rate_usd: 1,
    meal_allowance: 0,
    cskh_allowance: 0,
    fuel_allowance: 0,
    parking_allowance: 0,
    other_allowance: 0,
    effective_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ empId: employeeId, data: form }, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ base_salary_vnd: 0, base_salary_krw: 0, base_salary_usd: 0, exchange_rate_krw: 1, exchange_rate_usd: 1, meal_allowance: 0, cskh_allowance: 0, fuel_allowance: 0, parking_allowance: 0, other_allowance: 0, effective_date: '' });
      },
    });
  };

  const fmtVnd = (v: number) => Number(v).toLocaleString();
  const current = history.length > 0 ? history[0] : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current salary */}
      {current && (
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-900">
            {t('hr:salary.current')} ({t('hr:salary.effectiveFrom')}: {formatDate(current.effectiveDate)})
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-gray-500">{t('hr:salary.baseVnd')}</div>
              <div className="font-medium text-gray-900">{fmtVnd(current.baseSalaryVnd)} VND</div>
            </div>
            {Number(current.baseSalaryKrw) > 0 && (
              <div>
                <div className="text-xs text-gray-500">{t('hr:salary.baseKrw')}</div>
                <div className="font-medium text-gray-900">{fmtVnd(current.baseSalaryKrw)} KRW</div>
              </div>
            )}
            {Number(current.baseSalaryUsd) > 0 && (
              <div>
                <div className="text-xs text-gray-500">{t('hr:salary.baseUsd')}</div>
                <div className="font-medium text-gray-900">{Number(current.baseSalaryUsd).toLocaleString()} USD</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500">{t('hr:salary.meal')}</div>
              <div className="font-medium text-gray-900">{fmtVnd(current.mealAllowance)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('hr:salary.cskh')}</div>
              <div className="font-medium text-gray-900">{fmtVnd(current.cskhAllowance)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('hr:salary.fuel')}</div>
              <div className="font-medium text-gray-900">{fmtVnd(current.fuelAllowance)}</div>
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-900">{t('hr:salary.history')}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">{t('hr:salary.effectiveFrom')}</th>
              <th className="px-3 py-2">{t('hr:salary.baseVnd')}</th>
              <th className="px-3 py-2">{t('hr:salary.meal')}</th>
              <th className="px-3 py-2">{t('hr:salary.cskh')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((sh) => (
              <tr key={sh.salaryHistoryId}>
                <td className="px-3 py-2 text-gray-900">{formatDate(sh.effectiveDate)}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{fmtVnd(sh.baseSalaryVnd)}</td>
                <td className="px-3 py-2 text-gray-600">{fmtVnd(sh.mealAllowance)}</td>
                <td className="px-3 py-2 text-gray-600">{fmtVnd(sh.cskhAllowance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">{t('hr:salary.noHistory')}</div>
        )}
      </div>

      {/* Add new salary record */}
      {isAdmin && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          {t('hr:salary.addChange')}
        </button>
      )}

      {showForm && (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">{t('hr:salary.addChange')}</h4>
            <button onClick={() => setShowForm(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:salary.effectiveFrom')} *</label>
              <input type="date" value={form.effective_date} onChange={(e) => setForm((f) => ({ ...f, effective_date: e.target.value }))} required className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:salary.baseVnd')} *</label>
              <input type="number" value={form.base_salary_vnd} onChange={(e) => setForm((f) => ({ ...f, base_salary_vnd: Number(e.target.value) }))} required className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:salary.meal')}</label>
              <input type="number" value={form.meal_allowance} onChange={(e) => setForm((f) => ({ ...f, meal_allowance: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:salary.cskh')}</label>
              <input type="number" value={form.cskh_allowance} onChange={(e) => setForm((f) => ({ ...f, cskh_allowance: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:salary.fuel')}</label>
              <input type="number" value={form.fuel_allowance} onChange={(e) => setForm((f) => ({ ...f, fuel_allowance: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:salary.parking')}</label>
              <input type="number" value={form.parking_allowance} onChange={(e) => setForm((f) => ({ ...f, parking_allowance: Number(e.target.value) }))} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common:close')}</button>
              <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">{t('common:save')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
