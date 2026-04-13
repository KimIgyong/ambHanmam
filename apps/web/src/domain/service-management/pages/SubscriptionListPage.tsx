import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard } from 'lucide-react';
import { useSubscriptionList, useCreateSubscription } from '../hooks/useSubscription';
import { useServiceList } from '../hooks/useServiceCatalog';
import { useClientList } from '../hooks/useClient';
import { LocalDateTime } from '@/components/common/LocalDateTime';

export default function SubscriptionListPage() {
  const { t } = useTranslation(['service', 'common']);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const { data: subscriptions, isLoading } = useSubscriptionList({
    status: statusFilter || undefined,
    service: serviceFilter || undefined,
  });
  const { data: services } = useServiceList();
  const { data: clients } = useClientList();
  const createSubscription = useCreateSubscription();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: '', service_id: '', start_date: '', end_date: '', billing_cycle: 'MONTHLY', price: '0', currency: 'USD', auto_renew: true, note: '',
  });

  const handleCreate = async () => {
    if (!form.client_id || !form.service_id || !form.start_date) return;
    await createSubscription.mutateAsync({
      ...form,
      price: parseFloat(form.price),
    });
    setShowForm(false);
    setForm({ client_id: '', service_id: '', start_date: '', end_date: '', billing_cycle: 'MONTHLY', price: '0', currency: 'USD', auto_renew: true, note: '' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">{t('service:subscription.title')}</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            {t('service:subscription.add')}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('service:subscription.status')}: All</option>
            {['TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRING', 'EXPIRED', 'CANCELLED'].map((s) => (
              <option key={s} value={s}>{t(`service:status.${s}`)}</option>
            ))}
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('service:subscription.service')}: All</option>
            {services?.map((svc) => (
              <option key={svc.serviceId} value={svc.serviceId}>{svc.name}</option>
            ))}
          </select>
        </div>

        {/* Subscription Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-cyan-600" />
          </div>
        ) : !subscriptions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CreditCard className="h-12 w-12 mb-3" />
            <p className="text-sm">{t('service:subscription.noSubscriptions')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:client.companyName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:subscription.service')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:subscription.plan')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:subscription.price')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:subscription.endDate')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:subscription.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.subscriptionId}
                    onClick={() => navigate(`/service/subscriptions/${sub.subscriptionId}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.clientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{sub.serviceName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{sub.planName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {sub.price != null && sub.price > 0 ? `${sub.currency} ${sub.price.toLocaleString()}` : 'Free'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {sub.endDate ? <LocalDateTime value={sub.endDate} format='YYYY-MM-DD HH:mm' /> : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        sub.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
                        sub.status === 'SUSPENDED' ? 'bg-amber-100 text-amber-700' :
                        sub.status === 'EXPIRING' ? 'bg-orange-100 text-orange-700' :
                        sub.status === 'CANCELLED' || sub.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t(`service:status.${sub.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('service:subscription.add')}</h2>
              <div className="space-y-3">
                <select
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('service:client.companyName')}</option>
                  {clients?.map((c) => (
                    <option key={c.clientId} value={c.clientId}>{c.companyName}</option>
                  ))}
                </select>
                <select
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('service:subscription.service')}</option>
                  {services?.map((svc) => (
                    <option key={svc.serviceId} value={svc.serviceId}>{svc.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('service:subscription.startDate')}</label>
                    <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('service:subscription.endDate')}</label>
                    <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  </div>
                </div>
                <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                  {['MONTHLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'].map((c) => (
                    <option key={c} value={c}>{t(`service:billingCycle.${c}`)}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder={t('service:subscription.price')} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  <input placeholder={t('service:subscription.currency')} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.auto_renew} onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })} className="rounded border-gray-300" />
                  {t('service:subscription.autoRenew')}
                </label>
                <textarea placeholder={t('service:subscription.note')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">{t('common:close')}</button>
                <button onClick={handleCreate} disabled={createSubscription.isPending} className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50">{t('common:save')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
