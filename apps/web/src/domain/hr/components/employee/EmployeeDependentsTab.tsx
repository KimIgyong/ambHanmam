import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { HrDependentResponse } from '@amb/types';
import { useDependentList, useCreateDependent, useUpdateDependent, useDeleteDependent } from '../../hooks/useEmployees';
import { formatDate } from '@/lib/format-utils';

interface EmployeeDependentsTabProps {
  employeeId: string;
  isAdmin: boolean;
}

const DEDUCTION_PER_DEPENDENT = 6200000;

export default function EmployeeDependentsTab({ employeeId, isAdmin }: EmployeeDependentsTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: dependents = [], isLoading } = useDependentList(employeeId);
  const createMutation = useCreateDependent();
  const updateMutation = useUpdateDependent();
  const deleteMutation = useDeleteDependent();

  const [showForm, setShowForm] = useState(false);
  const [editingDep, setEditingDep] = useState<HrDependentResponse | null>(null);
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    date_of_birth: '',
    cccd_number: '',
    tax_code: '',
    effective_from: '',
    effective_to: '',
  });

  const activeDependents = dependents.filter((d) => {
    if (!d.effectiveTo) return true;
    return new Date(d.effectiveTo) >= new Date();
  });

  const monthlyDeduction = activeDependents.length * DEDUCTION_PER_DEPENDENT;

  const resetForm = () => {
    setForm({ name: '', relationship: '', date_of_birth: '', cccd_number: '', tax_code: '', effective_from: '', effective_to: '' });
    setEditingDep(null);
    setShowForm(false);
  };

  const handleEdit = (dep: HrDependentResponse) => {
    setEditingDep(dep);
    setForm({
      name: dep.name,
      relationship: dep.relationship,
      date_of_birth: dep.dateOfBirth,
      cccd_number: dep.cccdNumber || '',
      tax_code: dep.taxCode || '',
      effective_from: dep.effectiveFrom,
      effective_to: dep.effectiveTo || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDep) {
      updateMutation.mutate({ depId: editingDep.dependentId, data: form }, { onSuccess: resetForm });
    } else {
      createMutation.mutate({ empId: employeeId, data: form }, { onSuccess: resetForm });
    }
  };

  const handleDelete = (depId: string) => {
    if (confirm(t('hr:dependent.deleteConfirm'))) {
      deleteMutation.mutate(depId);
    }
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
      {/* Summary */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
        <div className="text-sm text-gray-600">
          {t('hr:dependent.activeCount')}: <span className="font-medium text-gray-900">{activeDependents.length}</span>
        </div>
        <div className="text-sm text-gray-600">
          {t('hr:dependent.monthlyDeduction')}: <span className="font-medium text-gray-900">{monthlyDeduction.toLocaleString()} VND</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t('hr:dependent.form.name')}</th>
              <th className="px-3 py-2">{t('hr:dependent.form.relationship')}</th>
              <th className="px-3 py-2">{t('hr:dependent.form.dob')}</th>
              <th className="px-3 py-2">{t('hr:dependent.form.effectiveFrom')}</th>
              <th className="px-3 py-2">{t('hr:dependent.form.effectiveTo')}</th>
              {isAdmin && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dependents.map((dep, i) => (
              <tr key={dep.dependentId}>
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{dep.name}</td>
                <td className="px-3 py-2 text-gray-600">{dep.relationship}</td>
                <td className="px-3 py-2 text-gray-600">{formatDate(dep.dateOfBirth)}</td>
                <td className="px-3 py-2 text-gray-600">{formatDate(dep.effectiveFrom)}</td>
                <td className="px-3 py-2 text-gray-600">{dep.effectiveTo ? formatDate(dep.effectiveTo) : '-'}</td>
                {isAdmin && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(dep)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(dep.dependentId)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {dependents.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">{t('hr:dependent.empty')}</div>
        )}
      </div>

      {/* Add button */}
      {isAdmin && !showForm && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          {t('hr:dependent.add')}
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {editingDep ? t('hr:dependent.edit') : t('hr:dependent.add')}
            </h4>
            <button onClick={resetForm} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:dependent.form.name')} *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:dependent.form.relationship')} *</label>
              <input type="text" value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))} required className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" placeholder="Cha/Mẹ, Cậu ruột, ..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:dependent.form.dob')} *</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} required className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:dependent.form.cccd')}</label>
              <input type="text" value={form.cccd_number} onChange={(e) => setForm((f) => ({ ...f, cccd_number: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:dependent.form.effectiveFrom')} *</label>
              <input type="date" value={form.effective_from} onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))} required className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:dependent.form.effectiveTo')}</label>
              <input type="date" value={form.effective_to} onChange={(e) => setForm((f) => ({ ...f, effective_to: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                {t('common:close')}
              </button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                {t('common:save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
