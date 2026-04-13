import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface SubscriptionItem {
  subscriptionId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  billingCycle: string;
  price: number | null;
  currency: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  service: {
    serviceId: string;
    code: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  plan: {
    planId: string;
    code: string;
    name: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  TRIAL: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  SUSPENDED: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  EXPIRED: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export function SubscriptionsPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  const { data: subscriptions, isLoading } = useQuery<SubscriptionItem[]>({
    queryKey: ['portal-subscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/portal/subscriptions');
      return data.data || data;
    },
  });

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('portal.subscriptions.title')}</h1>

      {checkoutSuccess && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">{t('portal.subscriptions.checkout_success')}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : subscriptions && subscriptions.length > 0 ? (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const statusCfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.EXPIRED;
            const StatusIcon = statusCfg.icon;
            return (
              <div key={sub.subscriptionId} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusCfg.bg}`}>
                      <Package className={`h-5 w-5 ${statusCfg.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {sub.service?.name || 'Service'}
                      </h3>
                      <p className="text-sm text-gray-500">{sub.plan?.name || 'Plan'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className={`h-4 w-4 ${statusCfg.color}`} />
                    <span className={`text-sm font-medium ${statusCfg.color}`}>{sub.status}</span>
                  </div>
                </div>
                {sub.price != null && (
                  <div className="mt-3 text-sm text-gray-600">
                    {formatPrice(sub.price, sub.currency)} / {sub.billingCycle === 'MONTHLY' ? t('pricing.month') : t('pricing.year')}
                  </div>
                )}
                {sub.cancelAtPeriodEnd && (
                  <p className="mt-2 text-sm text-amber-600">
                    {t('portal.subscriptions.cancels_at_period_end')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('portal.subscriptions.empty_title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('portal.subscriptions.empty_desc')}</p>
          <Link
            to="/portal/subscriptions/plans"
            className="mt-6 btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            {t('portal.subscriptions.browse_plans')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
