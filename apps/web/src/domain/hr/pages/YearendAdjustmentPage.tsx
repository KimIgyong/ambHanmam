import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Plus, Trash2, Upload, Check, PlayCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { usePayrollPeriods } from '../hooks/usePayroll';
import {
  useYearendList,
  useCreateYearend,
  useUpdateYearend,
  useDeleteYearend,
  useApplyYearend,
  useApplyBatchYearend,
  useImportYearend,
} from '../hooks/useYearendAdjustment';
import { HrYearendAdjustmentResponse } from '@amb/types';

export default function YearendAdjustmentPage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const currentYear = new Date().getFullYear();
  const [taxYear, setTaxYear] = useState(currentYear - 1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [applyPeriodId, setApplyPeriodId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useYearendList(taxYear);
  const { data: periods = [] } = usePayrollPeriods();
  const createMutation = useCreateYearend();
  const updateMutation = useUpdateYearend();
  const deleteMutation = useDeleteYearend();
  const applyMutation = useApplyYearend();
  const applyBatchMutation = useApplyBatchYearend();
  const importMutation = useImportYearend();

  const [form, setForm] = useState({
    employee_id: '',
    tax_year: taxYear,
    settle_tax: 0,
    settle_local: 0,
    note: '',
  });

  const calculatedPeriods = periods.filter(
    (p) => p.status === 'CALCULATED' || p.status === 'FINALIZED' || p.status === 'APPROVED_L1' || p.status === 'APPROVED_L2',
  );

  const resetForm = () => {
    setForm({ employee_id: '', tax_year: taxYear, settle_tax: 0, settle_local: 0, note: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!form.employee_id) return;
    createMutation.mutate(
      { ...form, tax_year: taxYear },
      { onSuccess: resetForm },
    );
  };

  const handleUpdate = () => {
    if (!editingId) return;
    updateMutation.mutate(
      { id: editingId, data: { settle_tax: form.settle_tax, settle_local: form.settle_local, note: form.note } },
      { onSuccess: resetForm },
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(t('hr:yearend.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleApply = (id: string) => {
    if (!applyPeriodId) return;
    if (confirm(t('hr:yearend.applyConfirm'))) {
      applyMutation.mutate({ id, periodId: applyPeriodId });
    }
  };

  const handleApplyBatch = () => {
    if (!applyPeriodId) return;
    if (confirm(t('hr:yearend.applyBatchConfirm'))) {
      applyBatchMutation.mutate({ taxYear, periodId: applyPeriodId });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importMutation.mutate(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const startEdit = (item: HrYearendAdjustmentResponse) => {
    setForm({
      employee_id: item.employeeId,
      tax_year: item.taxYear,
      settle_tax: item.settleTax,
      settle_local: item.settleLocal,
      note: item.note || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const formatAmount = (n: number) => {
    const formatted = new Intl.NumberFormat('ko-KR').format(Math.abs(n));
    return n < 0 ? `-${formatted}` : formatted;
  };

  const pendingCount = items.filter((i) => i.status === 'PENDING').length;
  const totalSettleTax = items.reduce((s, i) => s + i.settleTax, 0);
  const totalSettleLocal = items.reduce((s, i) => s + i.settleLocal, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-6 w-6 text-teal-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:yearend.title')}</h1>
              <p className="text-sm text-gray-500">{t('hr:yearend.subtitle')}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {importMutation.isPending ? t('common:processing') : t('hr:yearend.import')}
              </button>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                <Plus className="h-4 w-4" />
                {t('hr:yearend.add')}
              </button>
            </div>
          )}
        </div>

        {/* Year selector + Apply batch */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">{t('hr:yearend.taxYear')}</label>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {isAdmin && pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5">
              <select
                value={applyPeriodId}
                onChange={(e) => setApplyPeriodId(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="">{t('hr:yearend.selectPeriod')}</option>
                {calculatedPeriods.map((p) => (
                  <option key={p.periodId} value={p.periodId}>
                    {String(p.month).padStart(2, '0')}/{p.year}
                  </option>
                ))}
              </select>
              <button
                onClick={handleApplyBatch}
                disabled={!applyPeriodId || applyBatchMutation.isPending}
                className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {applyBatchMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="h-3.5 w-3.5" />
                )}
                {t('hr:yearend.applyBatch')} ({pendingCount})
              </button>
            </div>
          )}
        </div>

        {/* Import results */}
        {importMutation.data && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
            <p className="font-medium text-blue-800">{t('hr:yearend.importResult')}</p>
            <ul className="mt-1 space-y-0.5 text-blue-700">
              {importMutation.data.map((r, i) => (
                <li key={i}>Row {r.row}: {r.code} — {r.status}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Add/Edit form */}
        {showForm && (
          <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {editingId ? t('hr:yearend.edit') : t('hr:yearend.addNew')}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {!editingId && (
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:yearend.employee')}</label>
                  <input
                    type="text"
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    placeholder={t('hr:yearend.employeeIdPlaceholder')}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:yearend.settleTax')}</label>
                <input
                  type="number"
                  value={form.settle_tax}
                  onChange={(e) => setForm({ ...form, settle_tax: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:yearend.settleLocal')}</label>
                <input
                  type="number"
                  value={form.settle_local}
                  onChange={(e) => setForm({ ...form, settle_local: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:yearend.note')}</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={resetForm} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100">
                {t('common:close')}
              </button>
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={(!editingId && !form.employee_id) || createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? t('common:processing') : t('common:save')}
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        {items.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
              <div className="text-xs text-gray-500">{t('hr:yearend.totalEmployees')}</div>
              <div className="text-lg font-bold text-gray-900">{items.length}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
              <div className="text-xs text-gray-500">{t('hr:yearend.totalSettleTax')}</div>
              <div className={`text-lg font-bold ${totalSettleTax >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatAmount(totalSettleTax)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
              <div className="text-xs text-gray-500">{t('hr:yearend.totalSettleLocal')}</div>
              <div className={`text-lg font-bold ${totalSettleLocal >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatAmount(totalSettleLocal)}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">{t('hr:yearend.empty')}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">{t('hr:yearend.employee')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:yearend.settleTax')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:yearend.settleLocal')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:yearend.totalSettle')}</th>
                  <th className="px-3 py-2.5">{t('hr:yearend.appliedMonth')}</th>
                  <th className="px-3 py-2.5">{t('hr:yearend.statusLabel')}</th>
                  <th className="px-3 py-2.5">{t('hr:yearend.note')}</th>
                  {isAdmin && <th className="px-3 py-2.5 w-28" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900">{item.employeeName}</div>
                      <div className="text-xs text-gray-400">{item.employeeCode}</div>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${item.settleTax >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatAmount(item.settleTax)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${item.settleLocal >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatAmount(item.settleLocal)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono font-medium ${(item.settleTax + item.settleLocal) >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatAmount(item.settleTax + item.settleLocal)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{item.appliedMonth || '-'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.status === 'APPLIED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t(`hr:yearend.status.${item.status.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[150px] truncate">{item.note || ''}</td>
                    {isAdmin && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {item.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                                title={t('common:edit')}
                              >
                                <CalendarCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleApply(item.id)}
                                disabled={!applyPeriodId}
                                className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-30"
                                title={t('hr:yearend.apply')}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
