import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Crown, Zap, ArrowLeft, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface PlanItem {
  planId: string;
  code: string;
  name: string;
  tier: string;
  pricePerUser: number;
  tokenOnetime: number;
  tokenPerUserMonthly: number;
  tokenAddonUnit: number;
  tokenAddonPrice: number;
  isTokenMonthlyReset: boolean;
  storageBaseGb: number;
  storageMaxGb: number;
  storageAddonUnitGb: number;
  storageAddonPriceGb: number;
  maxUsers: number;
  minUsers: number;
  userSlotSize: number;
  freeUserCount: number;
  isAnnualAvailable: boolean;
  annualFreeMonths: number;
  sortOrder: number;
}

interface CurrentSubscription {
  subscriptionId: string;
  planCode: string;
  planName: string;
  status: string;
  billingCycle: string;
  userCount: number;
}

const TIER_STYLES: Record<string, { icon: typeof Zap; gradient: string; ring: string }> = {
  FREE: { icon: Zap, gradient: 'from-gray-50 to-gray-100', ring: 'ring-gray-200' },
  BASIC: { icon: Crown, gradient: 'from-blue-50 to-indigo-50', ring: 'ring-blue-300' },
  PREMIUM: { icon: Crown, gradient: 'from-purple-50 to-pink-50', ring: 'ring-purple-300' },
};

export function PlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  const { data: plans, isLoading: plansLoading } = useQuery<PlanItem[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/plans');
      return data.data || data;
    },
  });

  const { data: currentSub } = useQuery<CurrentSubscription | null>({
    queryKey: ['portal-current-subscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions');
      return data.data || null;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (params: { planCode: string; userCount: number; billingCycle: string }) => {
      const { data } = await api.post('/subscriptions/checkout', {
        plan_code: params.planCode,
        user_count: params.userCount,
        billing_cycle: params.billingCycle,
        success_url: `${window.location.origin}/portal/subscriptions?checkout=success`,
      });
      return data.data || data;
    },
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    },
  });

  const getUserCount = (plan: PlanItem) => {
    return userCounts[plan.code] || plan.minUsers || 1;
  };

  const calculatePrice = useMemo(() => {
    return (plan: PlanItem) => {
      if (plan.tier === 'FREE') return 0;
      if (plan.tier === 'PREMIUM') return -1; // custom
      const count = getUserCount(plan);
      const paidUsers = Math.max(0, count - plan.freeUserCount);
      const monthly = paidUsers * plan.pricePerUser;
      if (billingCycle === 'ANNUAL' && plan.isAnnualAvailable) {
        const annualMonths = 12 - plan.annualFreeMonths;
        return (monthly * annualMonths) / 12;
      }
      return monthly;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingCycle, userCounts]);

  const isCurrentPlan = (planCode: string) => {
    return currentSub?.planCode === planCode && currentSub?.status === 'ACTIVE';
  };

  const handleSelectPlan = (plan: PlanItem) => {
    if (plan.tier === 'FREE') {
      return; // Free plan — no checkout needed
    }
    if (plan.tier === 'PREMIUM') {
      window.location.href = 'mailto:contact@amoeba.site?subject=Premium Plan Inquiry';
      return;
    }
    checkoutMutation.mutate({
      planCode: plan.code,
      userCount: getUserCount(plan),
      billingCycle,
    });
  };

  const getPlanFeatures = (plan: PlanItem): string[] => {
    const tierKey = plan.tier.toLowerCase() as 'free' | 'basic' | 'premium';
    const features = t(`pricing.${tierKey}.features`, { returnObjects: true });
    return Array.isArray(features) ? (features as string[]) : [];
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/portal/subscriptions')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('portal.subscriptions.title')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('portal.plans.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('portal.plans.subtitle')}</p>
      </div>

      {/* Billing Toggle */}
      {plans?.some((p) => p.isAnnualAvailable) && (
        <div className="mb-8 flex items-center justify-center gap-3">
          <span
            className={`text-sm font-medium ${billingCycle === 'MONTHLY' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            {t('portal.plans.monthly')}
          </span>
          <button
            onClick={() => setBillingCycle((c) => (c === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY'))}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              billingCycle === 'ANNUAL' ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                billingCycle === 'ANNUAL' ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${billingCycle === 'ANNUAL' ? 'text-gray-900' : 'text-gray-400'}`}
          >
            {t('portal.plans.annual')}
          </span>
          {billingCycle === 'ANNUAL' && (
            <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {t('portal.plans.annual_save')}
            </span>
          )}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans?.map((plan) => {
          const style = TIER_STYLES[plan.tier] || TIER_STYLES.FREE;
          const TierIcon = style.icon;
          const price = calculatePrice(plan);
          const isCurrent = isCurrentPlan(plan.code);

          return (
            <div
              key={plan.planId}
              className={`relative flex flex-col rounded-2xl border bg-gradient-to-b ${style.gradient} p-6 ${
                isCurrent ? `ring-2 ${style.ring}` : 'border-gray-200'
              }`}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-semibold text-white">
                  {t('portal.plans.current_plan')}
                </div>
              )}

              {/* Plan Title */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <TierIcon className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                </div>
                <p className="text-sm text-gray-500">
                  {t(`pricing.${plan.tier.toLowerCase()}.desc`)}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {plan.tier === 'FREE' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{t('pricing.free.price')}</span>
                  </div>
                ) : plan.tier === 'PREMIUM' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{t('pricing.premium.price')}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      ${price.toFixed(0)}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {t(`pricing.${billingCycle === 'MONTHLY' ? 'month' : 'year'}`)}
                    </span>
                  </div>
                )}
                {plan.tier === 'BASIC' && (
                  <p className="mt-1 text-xs text-gray-400">
                    ${plan.pricePerUser} {t('pricing.per_user_month')}
                  </p>
                )}
              </div>

              {/* User Count Selector (Basic only) */}
              {plan.tier === 'BASIC' && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-white/60 p-3">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                    <Users className="h-3.5 w-3.5" />
                    {t('portal.plans.select_users')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={plan.minUsers}
                      max={plan.maxUsers}
                      step={plan.userSlotSize || 1}
                      value={getUserCount(plan)}
                      onChange={(e) =>
                        setUserCounts((prev) => ({ ...prev, [plan.code]: Number(e.target.value) }))
                      }
                      className="flex-1 accent-primary-500"
                    />
                    <span className="w-10 text-center text-sm font-semibold text-gray-700">
                      {getUserCount(plan)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {plan.minUsers}–{plan.maxUsers} {t('portal.plans.users_range')}
                  </p>
                </div>
              )}

              {/* Features */}
              <ul className="mb-6 flex-1 space-y-2">
                {getPlanFeatures(plan).map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {feat}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent || checkoutMutation.isPending}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'cursor-default bg-gray-100 text-gray-400'
                    : plan.tier === 'PREMIUM'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : plan.tier === 'BASIC'
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {checkoutMutation.isPending && checkoutMutation.variables?.planCode === plan.code ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  t('portal.plans.current_plan')
                ) : plan.tier === 'FREE' ? (
                  t('pricing.start_free')
                ) : plan.tier === 'PREMIUM' ? (
                  t('pricing.contact_sales')
                ) : (
                  t('portal.plans.upgrade')
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {checkoutMutation.isError && (
        <div className="mt-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {t('portal.plans.checkout_error')}
        </div>
      )}
    </div>
  );
}
