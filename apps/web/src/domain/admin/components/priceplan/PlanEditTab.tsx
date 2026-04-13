import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminPlans, useUpdatePlan } from '../../hooks/usePricePlan';
import type { PlanData } from '../../service/plan-admin.service';

export default function PlanEditTab() {
  const { t } = useTranslation(['admin']);
  const { data: plans, isLoading } = useAdminPlans();
  const updateMutation = useUpdatePlan();
  const [editing, setEditing] = useState<Record<string, Partial<PlanData>>>({});

  const handleChange = (planId: string, field: string, value: unknown) => {
    setEditing((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  const handleSave = async (planId: string) => {
    const changes = editing[planId];
    if (!changes || Object.keys(changes).length === 0) return;
    try {
      await updateMutation.mutateAsync({ planId, data: changes });
      setEditing((prev) => {
        const next = { ...prev };
        delete next[planId];
        return next;
      });
      toast.success(t('admin:pricePlan.saved'));
    } catch {
      toast.error(t('admin:pricePlan.saveFailed'));
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">{t('admin:pricePlan.loading')}</div>;

  const numField = (plan: PlanData, field: keyof PlanData, label: string, prefix = '') => {
    const current = editing[plan.planId]?.[field] ?? plan[field];
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex items-center gap-1">
          {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
          <input
            type="number"
            className="w-28 rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-indigo-400 focus:outline-none"
            value={current as number}
            onChange={(e) => handleChange(plan.planId, field, Number(e.target.value))}
          />
        </div>
      </div>
    );
  };

  const boolField = (plan: PlanData, field: keyof PlanData, label: string) => {
    const current = (editing[plan.planId]?.[field] ?? plan[field]) as boolean;
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-600">{label}</span>
        <button
          type="button"
          onClick={() => handleChange(plan.planId, field, !current)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${current ? 'bg-indigo-500' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${current ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    );
  };

  const tierColor: Record<string, string> = {
    FREE: 'border-gray-300 bg-gray-50',
    BASIC: 'border-indigo-300 bg-indigo-50/30',
    PREMIUM: 'border-purple-300 bg-purple-50/30',
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {plans?.map((plan) => {
        const hasChanges = editing[plan.planId] && Object.keys(editing[plan.planId]).length > 0;
        return (
          <div key={plan.planId} className={`rounded-xl border-2 p-5 ${tierColor[plan.tier] ?? 'border-gray-200'}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <span className="text-xs font-medium text-gray-500">{plan.code} · {plan.tier}</span>
              </div>
              <button
                onClick={() => handleSave(plan.planId)}
                disabled={!hasChanges || updateMutation.isPending}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  hasChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t('admin:pricePlan.save')}
              </button>
            </div>

            <div className="space-y-0.5">
              <p className="mt-2 mb-1 text-xs font-semibold text-gray-500 uppercase">{t('admin:pricePlan.sections.pricing')}</p>
              {numField(plan, 'pricePerUser', t('admin:pricePlan.fields.pricePerUser'), '$')}
              {numField(plan, 'sortOrder', t('admin:pricePlan.fields.sortOrder'))}

              <p className="mt-3 mb-1 text-xs font-semibold text-gray-500 uppercase">{t('admin:pricePlan.sections.token')}</p>
              {numField(plan, 'tokenOnetime', t('admin:pricePlan.fields.tokenOnetime'))}
              {numField(plan, 'tokenPerUserMonthly', t('admin:pricePlan.fields.tokenPerUserMonthly'))}
              {numField(plan, 'tokenAddonUnit', t('admin:pricePlan.fields.tokenAddonUnit'))}
              {numField(plan, 'tokenAddonPrice', t('admin:pricePlan.fields.tokenAddonPrice'), '$')}
              {boolField(plan, 'isTokenMonthlyReset', t('admin:pricePlan.fields.isTokenMonthlyReset'))}

              <p className="mt-3 mb-1 text-xs font-semibold text-gray-500 uppercase">{t('admin:pricePlan.sections.storage')}</p>
              {numField(plan, 'storageBaseGb', t('admin:pricePlan.fields.storageBaseGb'))}
              {numField(plan, 'storageMaxGb', t('admin:pricePlan.fields.storageMaxGb'))}
              {numField(plan, 'storageAddonUnitGb', t('admin:pricePlan.fields.storageAddonUnitGb'))}
              {numField(plan, 'storageAddonPriceGb', t('admin:pricePlan.fields.storageAddonPriceGb'), '$')}

              <p className="mt-3 mb-1 text-xs font-semibold text-gray-500 uppercase">{t('admin:pricePlan.sections.users')}</p>
              {numField(plan, 'minUsers', t('admin:pricePlan.fields.minUsers'))}
              {numField(plan, 'maxUsers', t('admin:pricePlan.fields.maxUsers'))}
              {numField(plan, 'userSlotSize', t('admin:pricePlan.fields.userSlotSize'))}
              {numField(plan, 'freeUserCount', t('admin:pricePlan.fields.freeUserCount'))}

              <p className="mt-3 mb-1 text-xs font-semibold text-gray-500 uppercase">{t('admin:pricePlan.sections.referral')}</p>
              {boolField(plan, 'isReferralEnabled', t('admin:pricePlan.fields.isReferralEnabled'))}
              {numField(plan, 'referralRewardTokens', t('admin:pricePlan.fields.referralRewardTokens'))}
              {numField(plan, 'referralInviteRequired', t('admin:pricePlan.fields.referralInviteRequired'))}

              <p className="mt-3 mb-1 text-xs font-semibold text-gray-500 uppercase">{t('admin:pricePlan.sections.annual')}</p>
              {boolField(plan, 'isAnnualAvailable', t('admin:pricePlan.fields.isAnnualAvailable'))}
              {numField(plan, 'annualFreeMonths', t('admin:pricePlan.fields.annualFreeMonths'))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
