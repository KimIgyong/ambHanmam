import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil } from 'lucide-react';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import {
  useSubscriptionDetail,
  useUpdateSubscription,
  useCancelSubscription,
  useSuspendSubscription,
  useResumeSubscription,
  useRenewSubscription,
  useSubscriptionHistory,
} from '../hooks/useSubscription';

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['service', 'common']);
  const { data: subscription, isLoading } = useSubscriptionDetail(id!);
  const { data: history } = useSubscriptionHistory(id!);
  const updateSubscription = useUpdateSubscription();
  const cancelSubscription = useCancelSubscription();
  const suspendSubscription = useSuspendSubscription();
  const resumeSubscription = useResumeSubscription();
  const renewSubscription = useRenewSubscription();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-cyan-600" />
      </div>
    );
  }

  if (!subscription) return null;

  const handleSave = async () => {
    await updateSubscription.mutateAsync({ id: id!, data: form });
    setEditing(false);
  };

  const handleCancel = async () => {
    if (!cancelReason) return;
    await cancelSubscription.mutateAsync({ id: id!, reason: cancelReason });
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleSuspend = async () => {
    if (!confirm(t('common:confirmAction'))) return;
    await suspendSubscription.mutateAsync(id!);
  };

  const handleResume = async () => {
    await resumeSubscription.mutateAsync(id!);
  };

  const handleRenew = async () => {
    await renewSubscription.mutateAsync(id!);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'TRIAL': return 'bg-blue-100 text-blue-700';
      case 'SUSPENDED': return 'bg-amber-100 text-amber-700';
      case 'EXPIRING': return 'bg-orange-100 text-orange-700';
      case 'CANCELLED': case 'EXPIRED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/service/subscriptions')} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{subscription.clientName} — {subscription.serviceName}</h1>
            <p className="text-sm text-gray-500">
              {subscription.planName && `${subscription.planName} · `}
              {t(`service:billingCycle.${subscription.billingCycle || 'MONTHLY'}`)}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(subscription.status)}`}>
            {t(`service:status.${subscription.status}`)}
          </span>
          <button onClick={() => { setEditing(!editing); setForm({}); }} className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50">
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* Subscription info */}
        {editing ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('service:subscription.startDate')}</label>
                <input type="date" defaultValue={subscription.startDate?.split('T')[0]} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('service:subscription.endDate')}</label>
                <input type="date" defaultValue={subscription.endDate?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t('service:subscription.price')} type="number" defaultValue={subscription.price ?? 0} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              <input placeholder={t('service:subscription.maxUsers')} type="number" defaultValue={subscription.maxUsers ?? ''} onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || null })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <input placeholder={t('service:subscription.discountRate')} type="number" step="0.01" defaultValue={subscription.discountRate ?? 0} onChange={(e) => setForm({ ...form, discount_rate: parseFloat(e.target.value) })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <textarea placeholder={t('service:subscription.note')} defaultValue={subscription.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" rows={2} />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" defaultChecked={subscription.autoRenew} onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })} className="rounded border-gray-300" />
              {t('service:subscription.autoRenew')}
            </label>
            <div className="flex gap-2">
              <button onClick={handleSave} className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700">{t('common:save')}</button>
              <button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600">{t('common:close')}</button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">{t('service:subscription.service')}:</span> {subscription.serviceName}</div>
              <div><span className="text-gray-500">{t('service:subscription.plan')}:</span> {subscription.planName || '-'}</div>
              <div><span className="text-gray-500">{t('service:subscription.startDate')}:</span> {<LocalDateTime value={subscription.startDate} format='YYYY-MM-DD HH:mm' />}</div>
              <div><span className="text-gray-500">{t('service:subscription.endDate')}:</span> {subscription.endDate ? <LocalDateTime value={subscription.endDate} format='YYYY-MM-DD HH:mm' /> : '-'}</div>
              <div><span className="text-gray-500">{t('service:subscription.price')}:</span> {subscription.price != null && subscription.price > 0 ? `${subscription.currency} ${subscription.price.toLocaleString()}` : 'Free'}</div>
              <div><span className="text-gray-500">{t('service:subscription.billingCycle')}:</span> {t(`service:billingCycle.${subscription.billingCycle || 'MONTHLY'}`)}</div>
              <div><span className="text-gray-500">{t('service:subscription.maxUsers')}:</span> {subscription.maxUsers ?? '-'}</div>
              <div><span className="text-gray-500">{t('service:subscription.actualUsers')}:</span> {subscription.actualUsers}</div>
              <div><span className="text-gray-500">{t('service:subscription.discountRate')}:</span> {subscription.discountRate > 0 ? `${subscription.discountRate}%` : '-'}</div>
              <div><span className="text-gray-500">{t('service:subscription.autoRenew')}:</span> {subscription.autoRenew ? 'Yes' : 'No'}</div>
              {subscription.trialEndDate && <div><span className="text-gray-500">{t('service:subscription.trialEndDate')}:</span> {<LocalDateTime value={subscription.trialEndDate} format='YYYY-MM-DD HH:mm' />}</div>}
              {subscription.note && <div className="col-span-2"><span className="text-gray-500">{t('service:subscription.note')}:</span> {subscription.note}</div>}
              {subscription.cancelledAt && <div className="col-span-2"><span className="text-gray-500">{t('service:subscription.cancelReason')}:</span> {subscription.cancellationReason}</div>}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          {(subscription.status === 'ACTIVE' || subscription.status === 'TRIAL') && (
            <button onClick={handleSuspend} className="rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50">
              {t('service:subscription.suspend')}
            </button>
          )}
          {subscription.status === 'SUSPENDED' && (
            <button onClick={handleResume} className="rounded-md border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50">
              {t('service:subscription.resume')}
            </button>
          )}
          {(subscription.status === 'ACTIVE' || subscription.status === 'EXPIRING') && (
            <button onClick={handleRenew} className="rounded-md border border-cyan-300 px-3 py-1.5 text-sm font-medium text-cyan-700 hover:bg-cyan-50">
              {t('service:subscription.renew')}
            </button>
          )}
          {!['CANCELLED', 'EXPIRED'].includes(subscription.status) && (
            <button onClick={() => setShowCancelModal(true)} className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
              {t('service:subscription.cancel')}
            </button>
          )}
        </div>

        {/* History */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('service:subscription.history')}</h2>
        {history && history.length > 0 ? (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.historyId} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{t(`service:action.${h.action}`)}</span>
                    {h.field && <span className="text-xs text-gray-400">{h.field}</span>}
                  </div>
                  {(h.oldValue || h.newValue) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {h.oldValue && <span className="line-through text-gray-400 mr-2">{h.oldValue}</span>}
                      {h.newValue && <span>{h.newValue}</span>}
                    </p>
                  )}
                  {h.note && <p className="text-sm text-gray-500 mt-1">{h.note}</p>}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{<LocalDateTime value={h.createdAt} format='YYYY-MM-DD HH:mm' />}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-4">{t('service:subscription.noSubscriptions')}</p>
        )}

        {/* Cancel modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('service:subscription.cancel')}</h2>
              <textarea
                placeholder={t('service:subscription.cancelReason')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={3}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowCancelModal(false)} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">{t('common:close')}</button>
                <button onClick={handleCancel} disabled={cancelSubscription.isPending} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{t('service:subscription.cancel')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
