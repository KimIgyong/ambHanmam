import { useTranslation } from 'react-i18next';
import { useSubscription, useCheckoutMutation, useCancelSubscription } from '../hooks/useSubscription';
import { AlertCircle, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { useState } from 'react';
import PaymentMethodModal from './PaymentMethodModal';

export default function PlanSection() {
  const { t } = useTranslation(['subscription']);
  const { data: subscription, isLoading, error } = useSubscription();
  const checkoutMutation = useCheckoutMutation();
  const cancelMutation = useCancelSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleUpgradeClick = () => {
    setShowPaymentModal(true);
  };

  const handlePolarCheckout = async () => {
    setShowPaymentModal(false);
    try {
      const result = await checkoutMutation.mutateAsync({
        plan_code: 'BASIC',
        billing_cycle: 'MONTHLY',
      });
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank');
      }
    } catch {
      // handled by mutation error state
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(t('subscription:plan.cancelConfirm'))) return;
    try {
      await cancelMutation.mutateAsync();
    } catch {
      // handled by mutation error state
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 text-gray-500">
          <AlertCircle className="h-5 w-5" />
          <p>{t('subscription:plan.noPlan')}</p>
        </div>
        <button
          onClick={handleUpgradeClick}
          disabled={checkoutMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <ArrowUpCircle className="h-4 w-4" />
          {t('subscription:plan.upgrade')} BASIC
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIALING: 'bg-blue-100 text-blue-800',
    PAST_DUE: 'bg-yellow-100 text-yellow-800',
    CANCELED: 'bg-red-100 text-red-800',
    FREE: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('subscription:plan.currentPlan')}</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {subscription.planTier}
            </h2>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              statusColors[subscription.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {subscription.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">{t('subscription:plan.billingCycle')}</p>
            <p className="text-sm font-medium text-gray-900">
              {subscription.billingCycle === 'ANNUAL'
                ? t('subscription:plan.annual')
                : subscription.billingCycle === 'MONTHLY'
                  ? t('subscription:plan.monthly')
                  : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('subscription:plan.userCount')}</p>
            <p className="text-sm font-medium text-gray-900">
              {subscription.paidUserCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('subscription:plan.startDate')}</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(subscription.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('subscription:plan.nextBilling')}</p>
            <p className="text-sm font-medium text-gray-900">
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {subscription.planTier === 'FREE' && (
          <button
            onClick={handleUpgradeClick}
            disabled={checkoutMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <ArrowUpCircle className="h-4 w-4" />
            {t('subscription:plan.upgrade')} BASIC
          </button>
        )}
        {subscription.status === 'ACTIVE' && subscription.planTier !== 'FREE' && (
          <button
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {t('subscription:plan.cancel')}
          </button>
        )}
      </div>

      {/* Plan Details */}
      {subscription.plan && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Plan Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-gray-500">Price</p>
              <p className="font-medium">
                ${subscription.plan.pricePerUser}{t('subscription:plan.perUser')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Tokens</p>
              <p className="font-medium">
                {subscription.plan.tokenPerUserMonthly.toLocaleString()}/user/month
              </p>
            </div>
            <div>
              <p className="text-gray-500">Storage</p>
              <p className="font-medium">
                {subscription.plan.baseStorageGb}GB base / {subscription.plan.maxStorageGb}GB max
              </p>
            </div>
            <div>
              <p className="text-gray-500">Max Users</p>
              <p className="font-medium">{subscription.plan.maxUsers}</p>
            </div>
          </div>
        </div>
      )}

      {(checkoutMutation.isError || cancelMutation.isError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {checkoutMutation.isError && t('subscription:errors.checkoutFailed')}
          {cancelMutation.isError && t('subscription:errors.cancelFailed')}
        </div>
      )}
      {cancelMutation.isSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          {t('subscription:plan.cancelSuccess')}
        </div>
      )}

      <PaymentMethodModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPolar={handlePolarCheckout}
      />
    </div>
  );
}
