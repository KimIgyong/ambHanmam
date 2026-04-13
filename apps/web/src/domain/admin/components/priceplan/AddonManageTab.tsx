import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminAddons,
  useCreateAddon,
  useUpdateAddon,
  useDeleteAddon,
} from '../../hooks/usePricePlan';
import type { PlanAddonData } from '../../service/plan-admin.service';

export default function AddonManageTab() {
  const { t } = useTranslation(['admin']);
  const { data: addons, isLoading } = useAdminAddons();
  const createMut = useCreateAddon();
  const updateMut = useUpdateAddon();
  const deleteMut = useDeleteAddon();

  const [editRow, setEditRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlanAddonData>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({
    addon_key: '',
    label_i18n_key: '',
    value_free: '',
    value_basic: '',
    unit: '',
    price: '0',
  });

  const startEdit = (a: PlanAddonData) => {
    setEditRow(a.addonId);
    setEditData({
      addonKey: a.addonKey,
      labelI18nKey: a.labelI18nKey,
      valueFree: a.valueFree,
      valueBasic: a.valueBasic,
      unit: a.unit,
      price: a.price,
      isActive: a.isActive,
    });
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await updateMut.mutateAsync({
        addonId: editRow,
        data: {
          addon_key: editData.addonKey,
          label_i18n_key: editData.labelI18nKey,
          value_free: editData.valueFree,
          value_basic: editData.valueBasic,
          unit: editData.unit,
          price: editData.price,
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
      setNewRow({ addon_key: '', label_i18n_key: '', value_free: '', value_basic: '', unit: '', price: '0' });
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
        <p className="text-sm text-gray-500">{t('admin:pricePlan.addonDesc')}</p>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('admin:pricePlan.addRow')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className={`${cellCls} text-left font-semibold text-gray-500`}>Add-on Key</th>
              <th className={`${cellCls} text-left font-semibold text-gray-500`}>i18n Key</th>
              <th className={`${cellCls} text-center font-semibold text-gray-500`}>Free</th>
              <th className={`${cellCls} text-center font-semibold text-indigo-600`}>Basic</th>
              <th className={`${cellCls} text-center font-semibold text-gray-500`}>Unit</th>
              <th className={`${cellCls} text-center font-semibold text-gray-500`}>Price ($)</th>
              <th className={`${cellCls} w-24 text-center font-semibold text-gray-500`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAdd && (
              <tr className="border-b border-blue-100 bg-blue-50/30">
                <td className={cellCls}><input className={inputCls} value={newRow.addon_key} onChange={(e) => setNewRow({ ...newRow, addon_key: e.target.value })} placeholder="addon_key" /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.label_i18n_key} onChange={(e) => setNewRow({ ...newRow, label_i18n_key: e.target.value })} placeholder="pricing.addon.xxx" /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.value_free} onChange={(e) => setNewRow({ ...newRow, value_free: e.target.value })} /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.value_basic} onChange={(e) => setNewRow({ ...newRow, value_basic: e.target.value })} /></td>
                <td className={cellCls}><input className={inputCls} value={newRow.unit} onChange={(e) => setNewRow({ ...newRow, unit: e.target.value })} placeholder="GB, tokens..." /></td>
                <td className={cellCls}><input type="number" className={`${inputCls} w-20`} value={newRow.price} onChange={(e) => setNewRow({ ...newRow, price: e.target.value })} /></td>
                <td className={`${cellCls} text-center`}>
                  <button onClick={handleCreate} disabled={createMut.isPending} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">
                    {createMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  </button>
                </td>
              </tr>
            )}
            {addons?.map((a) => (
              <tr key={a.addonId} className={`border-b border-gray-100 hover:bg-gray-50/50 ${!a.isActive ? 'opacity-40' : ''}`}>
                {editRow === a.addonId ? (
                  <>
                    <td className={cellCls}><input className={inputCls} value={editData.addonKey ?? ''} onChange={(e) => setEditData({ ...editData, addonKey: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.labelI18nKey ?? ''} onChange={(e) => setEditData({ ...editData, labelI18nKey: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.valueFree ?? ''} onChange={(e) => setEditData({ ...editData, valueFree: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.valueBasic ?? ''} onChange={(e) => setEditData({ ...editData, valueBasic: e.target.value })} /></td>
                    <td className={cellCls}><input className={inputCls} value={editData.unit ?? ''} onChange={(e) => setEditData({ ...editData, unit: e.target.value })} /></td>
                    <td className={cellCls}><input type="number" className={`${inputCls} w-20`} value={editData.price ?? ''} onChange={(e) => setEditData({ ...editData, price: e.target.value })} /></td>
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
                    <td className={`${cellCls} font-mono text-xs text-gray-700`}>{a.addonKey}</td>
                    <td className={`${cellCls} text-xs text-gray-500`}>{a.labelI18nKey}</td>
                    <td className={`${cellCls} text-center text-gray-600`}>{a.valueFree || '—'}</td>
                    <td className={`${cellCls} text-center font-medium text-gray-800`}>{a.valueBasic || '—'}</td>
                    <td className={`${cellCls} text-center text-gray-500`}>{a.unit}</td>
                    <td className={`${cellCls} text-center font-medium`}>${a.price}</td>
                    <td className={`${cellCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEdit(a)} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">Edit</button>
                        <button onClick={() => handleDelete(a.addonId)} className="rounded bg-red-50 px-1.5 py-1 text-red-500 hover:bg-red-100">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {(!addons || addons.length === 0) && !showAdd && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t('admin:pricePlan.noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
