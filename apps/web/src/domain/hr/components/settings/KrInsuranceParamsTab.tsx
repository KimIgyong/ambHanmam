import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import {
  useInsuranceParamsKr,
  useCreateInsuranceParamKr,
  useDeleteInsuranceParamKr,
} from '../../hooks/useKrSettings';

interface KrInsuranceParamsTabProps {
  isAdmin: boolean;
}

export default function KrInsuranceParamsTab({ isAdmin }: KrInsuranceParamsTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: params = [], isLoading } = useInsuranceParamsKr();
  const createMutation = useCreateInsuranceParamKr();
  const deleteMutation = useDeleteInsuranceParamKr();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    effective_from: '',
    effective_to: '',
    pension_rate: 9.5,
    pension_emp: 4.75,
    pension_upper: 6370000,
    pension_lower: 400000,
    health_rate: 7.19,
    health_emp: 3.595,
    longterm_rate: 13.14,
    employ_rate: 1.8,
    employ_emp: 0.9,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    if (!payload.effective_to) delete payload.effective_to;
    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('hr:settings.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{t('hr:kr.insurance.title')}</h3>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('hr:settings.addParam')}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:settings.effectiveFrom')}</label>
              <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} required
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:settings.effectiveTo')}</label>
              <input type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.pension')} (%)</label>
              <input type="number" step="0.001" value={form.pension_rate} onChange={(e) => setForm({ ...form, pension_rate: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.pensionEmp')} (%)</label>
              <input type="number" step="0.001" value={form.pension_emp} onChange={(e) => setForm({ ...form, pension_emp: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.pensionUpper')}</label>
              <input type="number" value={form.pension_upper} onChange={(e) => setForm({ ...form, pension_upper: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.pensionLower')}</label>
              <input type="number" value={form.pension_lower} onChange={(e) => setForm({ ...form, pension_lower: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.health')} (%)</label>
              <input type="number" step="0.001" value={form.health_rate} onChange={(e) => setForm({ ...form, health_rate: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.healthEmp')} (%)</label>
              <input type="number" step="0.001" value={form.health_emp} onChange={(e) => setForm({ ...form, health_emp: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.longterm')} (%)</label>
              <input type="number" step="0.001" value={form.longterm_rate} onChange={(e) => setForm({ ...form, longterm_rate: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.employ')} (%)</label>
              <input type="number" step="0.001" value={form.employ_rate} onChange={(e) => setForm({ ...form, employ_rate: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.insurance.employEmp')} (%)</label>
              <input type="number" step="0.001" value={form.employ_emp} onChange={(e) => setForm({ ...form, employ_emp: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100">
              {t('common:close')}
            </button>
            <button type="submit" disabled={createMutation.isPending}
              className="rounded bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {t('common:save')}
            </button>
          </div>
        </form>
      )}

      {/* Params table */}
      {params.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">{t('hr:settings.noParams')}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left font-medium uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">{t('hr:settings.effectiveFrom')}</th>
                <th className="px-3 py-2">{t('hr:settings.effectiveTo')}</th>
                <th className="px-3 py-2 text-right">{t('hr:kr.insurance.pension')}</th>
                <th className="px-3 py-2 text-right">{t('hr:kr.insurance.health')}</th>
                <th className="px-3 py-2 text-right">{t('hr:kr.insurance.longterm')}</th>
                <th className="px-3 py-2 text-right">{t('hr:kr.insurance.employ')}</th>
                <th className="px-3 py-2 text-right">{t('hr:kr.insurance.pensionUpper')}</th>
                {isAdmin && <th className="px-3 py-2 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {params.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{p.effectiveFrom}</td>
                  <td className="px-3 py-2 text-gray-400">{p.effectiveTo || '-'}</td>
                  <td className="px-3 py-2 text-right font-mono">{p.pensionRate}% ({p.pensionEmp}%)</td>
                  <td className="px-3 py-2 text-right font-mono">{p.healthRate}% ({p.healthEmp}%)</td>
                  <td className="px-3 py-2 text-right font-mono">{p.longtermRate}%</td>
                  <td className="px-3 py-2 text-right font-mono">{p.employRate}% ({p.employEmp}%)</td>
                  <td className="px-3 py-2 text-right font-mono">{formatNumber(p.pensionUpper)}</td>
                  {isAdmin && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
