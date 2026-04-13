import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useServiceDetail, useUpdateService, useDeleteService, useServicePlans, useCreatePlan, useDeletePlan } from '../hooks/useServiceCatalog';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['service', 'common']);
  const { data: service, isLoading } = useServiceDetail(id!);
  const { data: plans } = useServicePlans(id!);
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const createPlan = useCreatePlan();
  const deletePlan = useDeletePlan();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ code: '', name: '', price: '0', billing_cycle: 'MONTHLY' });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-cyan-600" />
      </div>
    );
  }

  if (!service) return null;

  const handleSave = async () => {
    await updateService.mutateAsync({ id: id!, data: form });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('common:confirmDelete'))) return;
    await deleteService.mutateAsync(id!);
    navigate('/service/services');
  };

  const handleCreatePlan = async () => {
    if (!planForm.code || !planForm.name) return;
    await createPlan.mutateAsync({
      serviceId: id!,
      data: { ...planForm, price: parseFloat(planForm.price) },
    });
    setShowPlanForm(false);
    setPlanForm({ code: '', name: '', price: '0', billing_cycle: 'MONTHLY' });
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm(t('common:confirmDelete'))) return;
    await deletePlan.mutateAsync({ serviceId: id!, planId });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/service/services')} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            {service.color && <div className="h-5 w-5 rounded-full" style={{ backgroundColor: service.color }} />}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{service.name}</h1>
              <p className="text-sm text-gray-500">{service.code} · {t(`service:category.${service.category}`)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(!editing); setForm({}); }} className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={handleDelete} className="rounded-md border border-red-200 p-1.5 text-red-500 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Service info */}
        {editing ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6 space-y-3">
            <input placeholder={t('service:service.name')} defaultValue={service.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <textarea placeholder={t('service:service.description')} defaultValue={service.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={3} />
            <select defaultValue={service.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              {['ACTIVE', 'INACTIVE', 'DEPRECATED'].map((s) => (
                <option key={s} value={s}>{t(`service:status.${s}`)}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={handleSave} className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">{t('common:save')}</button>
              <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600">{t('common:close')}</button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">{t('service:service.status')}:</span> <span className={service.status === 'ACTIVE' ? 'text-green-600 font-medium' : 'text-gray-600'}>{t(`service:status.${service.status}`)}</span></div>
              <div><span className="text-gray-500">{t('service:service.category')}:</span> {t(`service:category.${service.category}`)}</div>
              {service.websiteUrl && <div className="col-span-2"><span className="text-gray-500">{t('service:service.websiteUrl')}:</span> <a href={service.websiteUrl} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline">{service.websiteUrl}</a></div>}
              {service.description && <div className="col-span-2"><span className="text-gray-500">{t('service:service.description')}:</span> {service.description}</div>}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('service:plan.title')}</h2>
          <button onClick={() => setShowPlanForm(true)} className="flex items-center gap-1 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">
            <Plus className="h-3.5 w-3.5" />
            {t('service:plan.add')}
          </button>
        </div>

        {plans && plans.length > 0 ? (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.planId} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div>
                  <div className="font-medium text-gray-900">{plan.name} <span className="text-xs text-gray-400">({plan.code})</span></div>
                  <div className="text-sm text-gray-500">
                    {plan.price > 0 ? `${plan.currency} ${plan.price.toLocaleString()}` : 'Free'} · {t(`service:billingCycle.${plan.billingCycle}`)}
                    {plan.maxUsers && ` · Max ${plan.maxUsers} users`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.isActive ? t('service:plan.active') : t('service:status.INACTIVE')}
                  </span>
                  <button onClick={() => handleDeletePlan(plan.planId)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-4">{t('service:service.noServices')}</p>
        )}

        {/* Plan create modal */}
        {showPlanForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('service:plan.add')}</h2>
              <div className="space-y-3">
                <input placeholder={t('service:plan.code')} value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder={t('service:plan.name')} value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder={t('service:plan.price')} type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <select value={planForm.billing_cycle} onChange={(e) => setPlanForm({ ...planForm, billing_cycle: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  {['MONTHLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'].map((c) => (
                    <option key={c} value={c}>{t(`service:billingCycle.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowPlanForm(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">{t('common:close')}</button>
                <button onClick={handleCreatePlan} disabled={createPlan.isPending} className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50">{t('common:save')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
