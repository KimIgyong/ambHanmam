import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { useAllParams, useUpsertParam } from '../../hooks/useHrSettings';

interface InsuranceRatesTabProps {
  isAdmin: boolean;
}

const INSURANCE_KEYS = ['SI_RATE', 'HI_RATE', 'UI_RATE', 'UNION_RATE'];

export default function InsuranceRatesTab({ isAdmin }: InsuranceRatesTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: params = [], isLoading } = useAllParams();
  const upsertMutation = useUpsertParam();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    param_key: '',
    param_value: '',
    effective_from: '',
    description: '',
  });

  const filtered = useMemo(
    () => params.filter((p) => INSURANCE_KEYS.some((k) => p.paramKey.includes(k))),
    [params],
  );

  const resetForm = () => {
    setForm({ param_key: '', param_value: '', effective_from: '', description: '' });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(form, { onSuccess: resetForm });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">{t('hr:settings.paramKey')}</th>
              <th className="px-3 py-2">{t('hr:settings.paramValue')}</th>
              <th className="px-3 py-2">{t('hr:settings.effectiveFrom')}</th>
              <th className="px-3 py-2">{t('hr:settings.description')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <tr key={p.paramId}>
                <td className="px-3 py-2 font-mono text-xs font-medium text-gray-900">
                  {p.paramKey}
                </td>
                <td className="px-3 py-2 text-gray-900">
                  {Number(p.paramValue).toLocaleString('vi-VN')}%
                </td>
                <td className="px-3 py-2 text-gray-600">{p.effectiveFrom}</td>
                <td className="px-3 py-2 text-gray-500">{p.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            {t('hr:settings.noParams')}
          </div>
        )}
      </div>

      {isAdmin && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          {t('hr:settings.addParam')}
        </button>
      )}

      {showForm && (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {t('hr:settings.addParam')}
            </h4>
            <button onClick={resetForm} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('hr:settings.paramKey')} *
              </label>
              <select
                value={form.param_key}
                onChange={(e) => setForm((f) => ({ ...f, param_key: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              >
                <option value="">{t('common:select')}</option>
                {INSURANCE_KEYS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('hr:settings.paramValue')} (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.param_value}
                onChange={(e) => setForm((f) => ({ ...f, param_value: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('hr:settings.effectiveFrom')} *
              </label>
              <input
                type="date"
                value={form.effective_from}
                onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('hr:settings.description')}
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common:close')}
              </button>
              <button
                type="submit"
                disabled={upsertMutation.isPending}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {t('common:save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
