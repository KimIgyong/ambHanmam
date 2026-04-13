import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminFeatures,
  useCreateFeature,
  useUpdateFeature,
  useDeleteFeature,
} from '../../hooks/usePricePlan';
import type { PlanFeatureData } from '../../service/plan-admin.service';

export default function FeatureComparisonTab() {
  const { t } = useTranslation(['admin']);
  const { data: features, isLoading } = useAdminFeatures();
  const createMut = useCreateFeature();
  const updateMut = useUpdateFeature();
  const deleteMut = useDeleteFeature();

  const [editRow, setEditRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlanFeatureData>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({
    feature_key: '',
    label_i18n_key: '',
    value_free: '',
    value_basic: '',
    value_premium: '',
    is_check: false,
    highlight: false,
    sort_order: 0,
  });

  const startEdit = (f: PlanFeatureData) => {
    setEditRow(f.featureId);
    setEditData({
      featureKey: f.featureKey,
      labelI18nKey: f.labelI18nKey,
      valueFree: f.valueFree,
      valueBasic: f.valueBasic,
      valuePremium: f.valuePremium,
      isCheck: f.isCheck,
      highlight: f.highlight,
      sortOrder: f.sortOrder,
      isActive: f.isActive,
    });
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await updateMut.mutateAsync({
        featureId: editRow,
        data: {
          feature_key: editData.featureKey,
          label_i18n_key: editData.labelI18nKey,
          value_free: editData.valueFree,
          value_basic: editData.valueBasic,
          value_premium: editData.valuePremium,
          is_check: editData.isCheck,
          highlight: editData.highlight,
          sort_order: editData.sortOrder,
          is_active: editData.isActive,
        },
      });
      setEditRow(null);
      toast.success(t('admin:pricePlan.saved'));
    } catch {
      toast.error(t('admin:pricePlan.saveFailed'));
    }
  };

  const handleCreate = async () => {
    try {
      await createMut.mutateAsync(newRow);
      setShowAdd(false);
      setNewRow({ feature_key: '', label_i18n_key: '', value_free: '', value_basic: '', value_premium: '', is_check: false, highlight: false, sort_order: 0 });
      toast.success(t('admin:pricePlan.created'));
    } catch {
      toast.error(t('admin:pricePlan.saveFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin:pricePlan.confirmDelete'))) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success(t('admin:pricePlan.deleted'));
    } catch {
      toast.error(t('admin:pricePlan.saveFailed'));
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">{t('admin:pricePlan.loading')}</div>;

  const cellCls = 'px-3 py-2 text-sm';
  const inputCls = 'w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{t('admin:pricePlan.featureDesc')}</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('admin:pricePlan.addRow')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className={`${cellCls} w-10 text-center font-semibold text-gray-500`}>#</th>
              <th className={`${cellCls} text-left font-semibold text-gray-500`}>Feature Key</th>
              <th className={`${cellCls} text-left font-semibold text-gray-500`}>i18n Key</th>
              <th className={`${cellCls} text-center font-semibold text-gray-500`}>Free</th>
              <th className={`${cellCls} text-center font-semibold text-indigo-600`}>Basic</th>
              <th className={`${cellCls} text-center font-semibold text-purple-600`}>Premium</th>
              <th className={`${cellCls} w-16 text-center font-semibold text-gray-500`}>Check</th>
              <th className={`${cellCls} w-16 text-center font-semibold text-gray-500`}>HL</th>
              <th className={`${cellCls} w-16 text-center font-semibold text-gray-500`}>Order</th>
              <th className={`${cellCls} w-24 text-center font-semibold text-gray-500`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <tr className="border-b border-blue-100 bg-blue-50/30">
                <td className={`${cellCls} text-center text-gray-400`}>+</td>
                <td className={cellCls}><input className={inputCls} value={newRow.feature_key} onChange={(e) => setNewRow({ ...newRow, feature_key: e.target.value })} placeholder="feature_key" /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.label_i18n_key} onChange={(e) => setNewRow({ ...newRow, label_i18n_key: e.target.value })} placeholder="pricing.comparison.xxx" /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.value_free} onChange={(e) => setNewRow({ ...newRow, value_free: e.target.value })} /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.value_basic} onChange={(e) => setNewRow({ ...newRow, value_basic: e.target.value })} /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.value_premium} onChange={(e) => setNewRow({ ...newRow, value_premium: e.target.value })} /></td>
                <td className={`${cellCls} text-center`}><input type="checkbox" checked={newRow.is_check} onChange={(e) => setNewRow({ ...newRow, is_check: e.target.checked })} /></td>
                <td className={`${cellCls} text-center`}><input type="checkbox" checked={newRow.highlight} onChange={(e) => setNewRow({ ...newRow, highlight: e.target.checked })} /></td>
                <td className={cellCls}><input type="number" className={`${inputCls} w-16`} value={newRow.sort_order} onChange={(e) => setNewRow({ ...newRow, sort_order: Number(e.target.value) })} /></td>
                <td className={`${cellCls} text-center`}>
                  <button onClick={handleCreate} disabled={createMut.isPending} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">
                    {createMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  </button>
                </td>
              </tr>
            )}
            {features?.map((f) => (
              <tr key={f.featureId} className={`border-b border-gray-100 hover:bg-gray-50/50 ${!f.isActive ? 'opacity-40' : ''}`}>
                {editRow === f.featureId ? (
                  <>
                    <td className={`${cellCls} text-center text-gray-400`}>{f.sortOrder}</td>
                    <td className={cellCls}><input className={inputCls} value={editData.featureKey ?? ''} onChange={(e) => setEditData({ ...editData, featureKey: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.labelI18nKey ?? ''} onChange={(e) => setEditData({ ...editData, labelI18nKey: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.valueFree ?? ''} onChange={(e) => setEditData({ ...editData, valueFree: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.valueBasic ?? ''} onChange={(e) => setEditData({ ...editData, valueBasic: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.valuePremium ?? ''} onChange={(e) => setEditData({ ...editData, valuePremium: e.target.value })} /></td>
                    <td className={`${cellCls} text-center`}><input type="checkbox" checked={editData.isCheck ?? false} onChange={(e) => setEditData({ ...editData, isCheck: e.target.checked })} /></td>
                    <td className={`${cellCls} text-center`}><input type="checkbox" checked={editData.highlight ?? false} onChange={(e) => setEditData({ ...editData, highlight: e.target.checked })} /></td>
                    <td className={cellCls}><input type="number" className={`${inputCls} w-16`} value={editData.sortOrder ?? 0} onChange={(e) => setEditData({ ...editData, sortOrder: Number(e.target.value) })} /></td>
                    <td className={`${cellCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={saveEdit} disabled={updateMut.isPending} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700">
                          {updateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </button>
                        <button onClick={() => setEditRow(null)} className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300">✕</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`${cellCls} text-center text-gray-400`}>{f.sortOrder}</td>
                    <td className={`${cellCls} font-mono text-xs text-gray-700`}>{f.featureKey}</td>
                    <td className={`${cellCls} text-xs text-gray-500`}>{f.labelI18nKey}</td>
                    <td className={`${cellCls} text-center text-gray-600`}>{f.valueFree || '—'}</td>
                    <td className={`${cellCls} text-center font-medium text-gray-800`}>{f.valueBasic || '—'}</td>
                    <td className={`${cellCls} text-center text-gray-600`}>{f.valuePremium || '—'}</td>
                    <td className={`${cellCls} text-center`}>{f.isCheck ? '✓' : ''}</td>
                    <td className={`${cellCls} text-center`}>{f.highlight ? '★' : ''}</td>
                    <td className={`${cellCls} text-center text-gray-400`}>{f.sortOrder}</td>
                    <td className={`${cellCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(f)} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">Edit</button>
                        <button onClick={() => handleDelete(f.featureId)} className="rounded bg-red-50 px-1.5 py-1 text-red-500 hover:bg-red-100">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
