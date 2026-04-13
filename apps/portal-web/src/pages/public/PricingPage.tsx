import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check, ArrowRight, ChevronDown, ChevronUp,
  Zap, HardDrive, Users, X, Gift, Package, Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHead } from '@/components/seo/PageHead';
import { usePricingData } from '@/hooks/usePricing';
import type { PricingFeature, PricingTier } from '@/lib/pricing-api';

const PLANS = ['free', 'basic', 'premium'] as const;
type PlanKey = (typeof PLANS)[number];

interface ComparisonRow {
  labelKey: string;
  free: string;
  basic: string;
  premium: string;
  isCheck?: boolean;
  highlight?: boolean;
}

/* Fallback tiers used when API is unavailable */
const FALLBACK_TIERS: PricingTier[] = [
  { tierId: '', planId: '', tierNumber: 1, usersMin: 6, usersMax: 10, monthlyPrice: 10, annualPrice: 100, savings: 20, tokensMonthly: 100000, sortOrder: 1 },
  { tierId: '', planId: '', tierNumber: 2, usersMin: 11, usersMax: 15, monthlyPrice: 20, annualPrice: 200, savings: 40, tokensMonthly: 200000, sortOrder: 2 },
  { tierId: '', planId: '', tierNumber: 3, usersMin: 16, usersMax: 20, monthlyPrice: 30, annualPrice: 300, savings: 60, tokensMonthly: 300000, sortOrder: 3 },
  { tierId: '', planId: '', tierNumber: 5, usersMin: 26, usersMax: 30, monthlyPrice: 50, annualPrice: 500, savings: 100, tokensMonthly: 500000, sortOrder: 5 },
  { tierId: '', planId: '', tierNumber: 9, usersMin: 46, usersMax: 49, monthlyPrice: 88, annualPrice: 880, savings: 176, tokensMonthly: 880000, sortOrder: 9 },
];

export function PricingPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { data: pricingData } = usePricingData();

  /* ── Dynamic comparison rows from API or fallback ── */
  const comparisonRows: ComparisonRow[] = useMemo(() => {
    if (pricingData?.features?.length) {
      return pricingData.features.map((f: PricingFeature) => ({
        labelKey: f.featureKey,
        free: f.valueFree ?? '',
        basic: f.valueBasic ?? '',
        premium: f.valuePremium ?? t('pricing.comparison.contact'),
        isCheck: f.isCheck,
        highlight: f.highlight,
      }));
    }
    return [
      { labelKey: 'monthly_price', free: '$0', basic: '$2 / user / mo', premium: t('pricing.comparison.contact') },
      { labelKey: 'user_config', free: '1–5', basic: '6–49 (5-user units)', premium: '50+' },
      { labelKey: 'monthly_fee', free: '$0', basic: '$10 ~ $88', premium: t('pricing.comparison.contact') },
      { labelKey: 'token_base', free: '50,000T (one-time)', basic: '20,000T / user / mo', premium: t('pricing.comparison.contact') },
      { labelKey: 'token_add_method', free: '10K units · $1/10K', basic: '50K units · $5/session', premium: t('pricing.comparison.contact') },
      { labelKey: 'token_reset', free: t('pricing.comparison.none'), basic: t('pricing.comparison.monthly_fee') || 'Monthly reset', premium: t('pricing.comparison.contact'), highlight: true },
      { labelKey: 'storage_base', free: '1GB', basic: '3GB', premium: t('pricing.comparison.contact') },
      { labelKey: 'storage_addon', free: t('pricing.comparison.not_available'), basic: '5GB · $1/GB', premium: t('pricing.comparison.contact') },
      { labelKey: 'storage_cap', free: '1GB', basic: '100GB max', premium: t('pricing.comparison.contact') },
      { labelKey: 'referral', free: t('pricing.comparison.na'), basic: '50,000T', premium: t('pricing.comparison.contact') },
      { labelKey: 'annual_discount_row', free: '—', basic: '✓ (2 mo free)', premium: '✓' },
      { labelKey: 'dedicated_support', free: '', basic: '', premium: '✓', isCheck: true },
      { labelKey: 'sla', free: '', basic: '', premium: '✓', isCheck: true },
      { labelKey: 'custom_integration', free: '', basic: '', premium: '✓', isCheck: true },
    ];
  }, [pricingData, t]);

  /* ── Dynamic tiers from API or fallback ── */
  const basicTiers = useMemo(() => {
    if (pricingData?.tiers?.BASIC?.length) return pricingData.tiers.BASIC;
    return FALLBACK_TIERS;
  }, [pricingData]);

  const faqItems = [1, 2, 3, 4, 5];

  const planCardStyle = (plan: PlanKey) => {
    if (plan === 'basic')
      return 'border-primary-300 shadow-xl ring-2 ring-primary-200 scale-[1.02]';
    return 'border-gray-200';
  };

  const ctaStyle = (plan: PlanKey) => {
    if (plan === 'basic') return 'btn-primary';
    if (plan === 'premium') return 'bg-gray-900 text-white hover:bg-gray-800';
    return 'btn-outline';
  };

  const ctaLabel = (plan: PlanKey) => {
    if (plan === 'free') return t('pricing.start_free');
    if (plan === 'premium') return t('pricing.contact_sales');
    return t('pricing.get_started');
  };

  const ctaLink = (plan: PlanKey) => {
    if (plan === 'premium') return 'mailto:contact@amoeba.site';
    return '/register';
  };

  return (
    <div>
      <PageHead
        title={t('pricing.title')}
        description={t('pricing.subtitle')}
        path="/pricing"
      />
      <section className="bg-gradient-to-br from-primary-50 via-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {t('pricing.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 transition-all ${planCardStyle(plan)}`}
              >
                {plan === 'basic' && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                    {t('pricing.recommended')}
                  </span>
                )}

                <h3 className="text-xl font-bold text-gray-900">
                  {t(`pricing.${plan}.name`)}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t(`pricing.${plan}.desc`)}
                </p>

                {/* Price */}
                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {t(`pricing.${plan}.price`)}
                  </span>
                  {plan === 'basic' && (
                    <span className="ml-1 text-sm text-gray-500">
                      {t('pricing.per_user_month')}
                    </span>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="mt-6 space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {t(`pricing.${plan}.tokens_label`)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <HardDrive className="h-4 w-4 text-blue-500" />
                    {t(`pricing.${plan}.storage_label`)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-green-500" />
                    {t(`pricing.${plan}.users_label`)}
                  </div>
                </div>

                {plan === 'basic' && (
                  <p className="mt-3 text-xs font-medium text-primary-600">
                    {t('pricing.annual_discount', { months: 2 })}
                  </p>
                )}

                {/* CTA */}
                <Link
                  to={ctaLink(plan)}
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${ctaStyle(plan)}`}
                >
                  {ctaLabel(plan)}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-2.5">
                  {(t(`pricing.${plan}.features`, { returnObjects: true }) as string[]).map(
                    (feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Comparison Table (ama-price-01) ── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('pricing.comparison.title')}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-5 py-4 text-left text-sm font-semibold text-gray-500 w-[28%]">
                    {t('pricing.comparison.feature')}
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan}
                      className={`px-4 py-4 text-center text-sm font-semibold w-[24%] ${
                        plan === 'basic' ? 'text-primary-700 bg-primary-50/50' : 'text-gray-900'
                      }`}
                    >
                      {t(`pricing.${plan}.name`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.labelKey}
                    className={`border-b border-gray-100 ${row.highlight ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                      {t(`pricing.comparison.${row.labelKey}`)}
                    </td>
                    {(['free', 'basic', 'premium'] as PlanKey[]).map((plan) => {
                      const val = row[plan];
                      return (
                        <td
                          key={plan}
                          className={`px-4 py-3.5 text-center text-sm ${
                            plan === 'basic' ? 'bg-primary-50/30 font-medium text-gray-800' : 'text-gray-600'
                          }`}
                        >
                          {row.isCheck ? (
                            val === '✓' ? (
                              <Check className="mx-auto h-5 w-5 text-green-500" />
                            ) : (
                              <X className="mx-auto h-5 w-5 text-gray-300" />
                            )
                          ) : (
                            val
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── BASIC Tier Detail Table (ama-price-02) ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('pricing.basic_tiers.title')}
          </h2>
          <p className="mb-10 text-center text-sm text-gray-500">
            {t('pricing.basic_tiers.subtitle')}
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.basic_tiers.tier')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.basic_tiers.users')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.basic_tiers.monthly')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.basic_tiers.annual')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase">
                    {t('pricing.basic_tiers.savings')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.basic_tiers.tokens_month')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {basicTiers.map((row) => (
                  <tr key={row.tierNumber} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {row.tierNumber}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {row.usersMin}–{row.usersMax}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      ${row.monthlyPrice}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      ${row.annualPrice}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-green-600">
                      ${row.savings}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-amber-700 font-medium">
                      {row.tokensMonthly?.toLocaleString()}T
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-gray-500">
            {t('pricing.basic_tiers.note')}
          </p>
        </div>
      </section>

      {/* ── Annual Billing Comparison (ama-price-02 bottom) ── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('pricing.annual_compare.title')}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900">
                {t('pricing.annual_compare.monthly_billing')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('pricing.annual_compare.monthly_desc')}
              </p>
              <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-center">
                <span className="text-sm font-medium text-gray-700">
                  {t('pricing.annual_compare.monthly_formula')}
                </span>
              </div>
            </div>
            {/* Annual */}
            <div className="rounded-xl border-2 border-primary-300 bg-primary-50/30 p-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-primary-700">
                  {t('pricing.annual_compare.annual_billing')}
                </h3>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  {t('pricing.annual_compare.months_free')}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {t('pricing.annual_compare.annual_desc')}
              </p>
              <div className="mt-4 rounded-lg bg-primary-100/50 px-4 py-3 text-center">
                <span className="text-sm font-semibold text-primary-700">
                  {t('pricing.annual_compare.annual_formula')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ADD-ON Pricing (ama-price-05) ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            <Package className="mr-2 inline-block h-7 w-7 text-primary-500" />
            {t('pricing.addon.title')}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.addon.item')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Free</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-primary-600 uppercase">Basic</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.addon.unit')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.addon.price')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingData?.addons?.length ? (
                  pricingData.addons.map((addon, idx) => (
                    <tr key={addon.addonId} className={idx < pricingData.addons.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                        {t(addon.labelI18nKey, { defaultValue: addon.addonKey })}
                      </td>
                      <td className={`px-4 py-3.5 text-center text-sm ${addon.valueFree ? 'text-gray-600' : 'text-gray-400'}`}>
                        {addon.valueFree || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-800">
                        {addon.valueBasic || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-600">
                        {addon.unit || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">
                        {addon.price ? `$${addon.price}` : t('pricing.addon.free_price')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                        {t('pricing.addon.token_addon')}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-600">10K T</td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-800">50K T</td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-600">10K tokens</td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">$1.00</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                        {t('pricing.addon.storage_addon')}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-400">
                        {t('pricing.addon.not_available')}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-800">5GB</td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-600">1GB</td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">$1.00</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                        {t('pricing.addon.referral_reward')}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm text-green-600">
                        {t('pricing.addon.applied')}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-green-600">
                        {t('pricing.addon.applied')}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-600">50K tokens / 1x</td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-green-600">
                        {t('pricing.addon.free_price')}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Storage Policy (ama-price-04) ── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            <HardDrive className="mr-2 inline-block h-7 w-7 text-blue-500" />
            {t('pricing.storage_policy.title')}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.storage_policy.item')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Free</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-primary-600 uppercase">Basic</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    {t('pricing.storage_policy.policy')}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                    {t('pricing.storage_policy.base_storage')}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-600">1GB</td>
                  <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-800">3GB</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">
                    {t('pricing.storage_policy.included_desc')}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                    {t('pricing.storage_policy.addon_storage')}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-400">
                    {t('pricing.storage_policy.not_available')}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-800">
                    {t('pricing.storage_policy.basic_addon_desc')}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">
                    {t('pricing.storage_policy.instant_activation')}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                    {t('pricing.storage_policy.max_cap')}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-600">
                    1GB {t('pricing.storage_policy.fixed')}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-800">
                    {t('pricing.storage_policy.basic_cap_desc')}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">—</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-700">
                    {t('pricing.storage_policy.google_drive')}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-400">
                    {t('pricing.storage_policy.excluded')}
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-600">
                    {t('pricing.storage_policy.excluded')}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">
                    {t('pricing.storage_policy.gdrive_policy')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Referral Reward (ama-price-03) ── */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <Gift className="mx-auto mb-4 h-10 w-10 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('pricing.referral_section.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {t('pricing.referral_section.subtitle')}
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="text-sm font-semibold uppercase text-gray-500">
                {t('pricing.referral_section.condition_title')}
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {t('pricing.referral_section.condition_desc')}
              </p>
            </div>
            <div className="rounded-xl border-2 border-primary-200 bg-primary-50/40 p-6">
              <div className="text-sm font-semibold uppercase text-primary-600">
                {t('pricing.referral_section.reward_title')}
              </div>
              <p className="mt-2 text-lg font-bold text-primary-700">
                {t('pricing.referral_section.reward_desc')}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            {t('pricing.referral_section.note')}
          </p>
        </div>
      </section>

      {/* ── Premium Cases Banner ── */}
      <section className="bg-gray-900 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                <Building2 className="mr-2 inline-block h-6 w-6 text-gray-400" />
                {t('pricing.premium_cases.title')}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300"
                  >
                    {t(`pricing.premium_cases.case${n}`)}
                  </span>
                ))}
              </div>
            </div>
            <a
              href="mailto:contact@amoeba.site"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {t('pricing.contact_sales')}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('pricing.faq.title')}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {faqItems.map((n) => (
              <div key={n}>
                <button
                  onClick={() => setOpenFaq(openFaq === n ? null : n)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {t(`pricing.faq.q${n}`)}
                  {openFaq === n ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                  )}
                </button>
                {openFaq === n && (
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {t(`pricing.faq.a${n}`)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-primary-600 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t('hero.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-100">
            {t('hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow hover:bg-primary-50 transition-colors"
            >
              {t('pricing.start_free')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:contact@amoeba.site"
              className="inline-flex items-center gap-2 rounded-lg border border-primary-300 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              {t('pricing.contact_sales')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
