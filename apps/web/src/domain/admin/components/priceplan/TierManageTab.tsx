import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminPlans,
  useAdminTiers,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
} from '../../hooks/usePricePlan';
import type { PlanTierData } from '../../service/plan-admin.service';

export default function TierManageTab() {
  const { t } = useTranslation(['admin']);
  const { data: plans } = useAdminPlans();
  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const { data: tiers, isLoading } = useAdminTiers(selectedPlan);
  const createMut = useCreateTier();
  const updateMut = useUpdateTier();
  const deleteMut = useDeleteTier();

  const [editRow, setEditRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlanTierData>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({
    tier_number: 1,
    users_min: 1,
    users_max: 10,
    monthly_price: 0,
    annual_price: 0,
    savings: 0,
    tokens_monthly: 0,
  });

  const planId = plans?.find((p) => p.code === selectedPlan)?.planId;

  const startEdit = (r: PlanTierData) => {
    setEditRow(r.tierId);
    setEditData({
      tierNumber: r.tierNumber,
      usersMin: r.usersMin,
      usersMax: r.usersMax,
      monthlyPrice: r.monthlyPrice,
      annualPrice: r.annualPrice,
      savings: r.savings,
      tokensMonthly: r.tokensMonthly,
    });
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await updateMut.mutateAsync({
        tierId: editRow,
        data: {
          tier_number: editData.tierNumber,
          users_min: editData.usersMin,
          users_max: editData.usersMax,
          monthly_price: editData.monthlyPrice,
          annual_price: editData.annualPrice,
          savings: editData.savings,
          tokens_monthly: editData.tokensMonthly,
        },
      });
      setEditRow(null);
      toast.success(t('admin:pricePlan.saved'));
    } catch {
      toast.error(t('admin:pricePlan.saveFailed'));
    }
  };

  const handleCreate = async () => {
    if (!planId) return;
    try {
      await createMut.mutateAsync({ plan_id: planId, ...newRow });
      setShowAdd(false);
      setNewRow({ tier_number: 1, users_min: 1, users_max: 10, monthly_price: 0, annual_price: 0, savings: 0, tokens_monthly: 0 });
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

  const cellCls = 'px-3 py-2 text-sm';
  const inputCls = 'w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none';
  const numInput = (val: number | undefined, onChange: (v: number) => void) => (
    <input type="number" className={`${inputCls} w-24`} value={val ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
  );

  const planTabs = [
    { code: 'BASIC', label: 'Basic', color: 'bg-indigo-600' },
    { code: 'PREMIUM', label: 'Premium', color: 'bg-purple-600' },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {planTabs.map((p) => (
            <button
              key={p.code}
              onClick={() => setSelectedPlan(p.code)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                selectedPlan === p.code ? `${p.color} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('admin:pricePlan.addRow')}
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400">{t('admin:pricePlan.loading')}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className={`${cellCls} text-center font-semibold text-gray-500`}>Tier</th>
                <th className={`${cellCls} text-center font-semibold text-gray-500`}>Users Min</th>
                <th className={`${cellCls} text-center font-semibold text-gray-500`}>Users Max</th>
                <th className={`${cellCls} text-center font-semibold text-gray-500`}>Monthly ($)</th>
                <th className={`${cellCls} text-center font-semibold text-gray-500`}>Annual ($)</th>
                <th className={`${cellCls} text-center font-semibold text-gray-500`}>Savings</th>
                <th className={`${cellCls} text-center font-semibold text-gray-500`}>Tokens/mo</th>
                <th className={`${cellCls} w-24 text-center font-semibold text-gray-500`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {showAdd && (
                <tr className="border-b border-blue-100 bg-blue-50/30">
                  <td className={`${cellCls} text-center`}>{numInput(newRow.tier_number, (v) => setNewRow({ ...newRow, tier_number: v }))}</td>
                  <td className={`${cellCls} text-center`}>{numInput(newRow.users_min, (v) => setNewRow({ ...newRow, users_min: v }))}</td>
                  <td className={`${cellCls} text-center`}>{numInput(newRow.users_max, (v) => setNewRow({ ...newRow, users_max: v }))}</td>
                  <td className={`${cellCls} text-center`}>{numInput(newRow.monthly_price, (v) => setNewRow({ ...newRow, monthly_price: v }))}</td>
                  <td className={`${cellCls} text-center`}>{numInput(newRow.annual_price, (v) => setNewRow({ ...newRow, annual_price: v }))}</td>
                  <td className={cellCls}><input type="number" className={`${inputCls} w-20`} value={newRow.savings} onChange={(e) => setNewRow({ ...newRow, savings: Number(e.target.value) })} /></td>
                  <td className={`${cellCls} text-center`}>{numInput(newRow.tokens_monthly, (v) => setNewRow({ ...newRow, tokens_monthly: v }))}</td>
                  <td className={`${cellCls} text-center`}>
                    <button onClick={handleCreate} disabled={createMut.isPending} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">
                      {createMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    </button>
                  </td>
                </tr>
              )}
              {tiers?.map((r) => (
                <tr key={r.tierId} className="border-b border-gray-100 hover:bg-gray-50/50">
                  {editRow === r.tierId ? (
                    <>
                      <td className={`${cellCls} text-center`}>{numInput(editData.tierNumber, (v) => setEditData({ ...editData, tierNumber: v }))}</td>
                      <td className={`${cellCls} text-center`}>{numInput(editData.usersMin, (v) => setEditData({ ...editData, usersMin: v }))}</td>
                      <td className={`${cellCls} text-center`}>{numInput(editData.usersMax, (v) => setEditData({ ...editData, usersMax: v }))}</td>
                      <td className={`${cellCls} text-center`}>{numInput(editData.monthlyPrice, (v) => setEditData({ ...editData, monthlyPrice: v }))}</td>
                      <td className={`${cellCls} text-center`}>{numInput(editData.annualPrice, (v) => setEditData({ ...editData, annualPrice: v }))}</td>
                      <td className={cellCls}><input type="number" className={`${inputCls} w-20`} value={editData.savings ?? 0} onChange={(e) => setEditData({ ...editData, savings: Number(e.target.value) })} /></td>
                      <td className={`${cellCls} text-center`}>{numInput(editData.tokensMonthly, (v) => setEditData({ ...editData, tokensMonthly: v }))}</td>
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
                      <td className={`${cellCls} text-center font-semibold`}>Tier {r.tierNumber}</td>
                      <td className={`${cellCls} text-center`}>{r.usersMin}</td>
                      <td className={`${cellCls} text-center`}>{r.usersMax === 9999 ? '∞' : r.usersMax}</td>
                      <td className={`${cellCls} text-center font-medium`}>${r.monthlyPrice}</td>
                      <td className={`${cellCls} text-center font-medium`}>${r.annualPrice}</td>
                      <td className={`${cellCls} text-center text-green-600`}>{r.savings}%</td>
                      <td className={`${cellCls} text-center`}>{r.tokensMonthly?.toLocaleString()}</td>
                      <td className={`${cellCls} text-center`}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(r)} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">Edit</button>
                          <button onClick={() => handleDelete(r.tierId)} className="rounded bg-red-50 px-1.5 py-1 text-red-500 hover:bg-red-100">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {(!tiers || tiers.length === 0) && !showAdd && (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">{t('admin:pricePlan.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
