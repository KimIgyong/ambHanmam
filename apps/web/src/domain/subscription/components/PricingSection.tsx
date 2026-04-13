import { useTranslation } from 'react-i18next';
import { usePlans, useSubscription, useCheckoutMutation } from '../hooks/useSubscription';
import { Check, Crown, Zap, ArrowUpCircle } from 'lucide-react';
import { useState } from 'react';
import PaymentMethodModal from './PaymentMethodModal';

export default function PricingSection() {
  const { t } = useTranslation(['subscription']);
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription } = useSubscription();
  const checkoutMutation = useCheckoutMutation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const handleUpgradeClick = (planCode: string) => {
    setSelectedPlan(planCode);
    setShowPaymentModal(true);
  };

  const handlePolarCheckout = async () => {
    setShowPaymentModal(false);
    try {
      const result = await checkoutMutation.mutateAsync({
        plan_code: selectedPlan,
        billing_cycle: 'MONTHLY',
      });
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank');
      }
    } catch {
      // handled by mutation error state
    }
  };

  if (plansLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const currentPlanCode = subscription?.planCode ?? '';

  const tierIcons: Record<string, React.ElementType> = {
    FREE: Zap,
    BASIC: Crown,
    PREMIUM: Crown,
  };

  const tierColors: Record<string, { card: string; badge: string; btn: string }> = {
    FREE: {
      card: 'border-gray-200',
      badge: 'bg-gray-100 text-gray-700',
      btn: 'bg-gray-100 text-gray-500 cursor-default',
    },
    BASIC: {
      card: 'border-indigo-300 ring-2 ring-indigo-100',
      badge: 'bg-indigo-100 text-indigo-700',
      btn: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    PREMIUM: {
      card: 'border-purple-300',
      badge: 'bg-purple-100 text-purple-700',
      btn: 'bg-purple-600 text-white hover:bg-purple-700',
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-3">
        {plans?.map((plan) => {
          const colors = tierColors[plan.tier] || tierColors.FREE;
          const Icon = tierIcons[plan.tier] || Zap;
          const isCurrent = plan.code === currentPlanCode;
          const canUpgrade =
            !isCurrent &&
            plan.code !== 'FREE' &&
            plan.code !== 'PREMIUM' &&
            (currentPlanCode === 'FREE' || currentPlanCode === '');

          return (
            <div
              key={plan.planId}
              className={`relative rounded-xl border bg-white p-6 transition-shadow hover:shadow-md ${colors.card}`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                  {t('subscription:pricing.currentPlan')}
                </span>
              )}

              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              </div>

              <div className="mb-6">
                {plan.pricePerUser > 0 ? (
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.pricePerUser}
                    </span>
                    <span className="text-sm text-gray-500">
                      {' '}
                      {t('subscription:pricing.perUserMonth')}
                    </span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {plan.code === 'PREMIUM'
                      ? t('subscription:pricing.contactUs')
                      : t('subscription:pricing.freeTier')}
                  </div>
                )}
              </div>

              <ul className="mb-6 space-y-2.5 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  {t('subscription:pricing.tokenOnetime')}: {plan.tokenOnetime.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  {t('subscription:pricing.tokenMonthly')}: {plan.tokenPerUserMonthly.toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  {t('subscription:pricing.storageBase')}: {plan.baseStorageGb}GB
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                  {t('subscription:pricing.maxUsers')}: {plan.maxUsers.toLocaleString()}
                </li>
              </ul>

              {canUpgrade ? (
                <button
                  onClick={() => handleUpgradeClick(plan.code)}
                  disabled={checkoutMutation.isPending}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${colors.btn}`}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  {t('subscription:pricing.upgradeBtn', { plan: plan.name })}
                </button>
              ) : isCurrent ? (
                <div
                  className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium ${colors.badge}`}
                >
                  {t('subscription:pricing.currentPlan')}
                </div>
              ) : plan.code === 'PREMIUM' ? (
                <div className="flex w-full items-center justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-500">
                  {t('subscription:pricing.comingSoon')}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {checkoutMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {t('subscription:errors.checkoutFailed')}
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
