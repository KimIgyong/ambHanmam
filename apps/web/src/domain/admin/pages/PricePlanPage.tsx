import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import PlanEditTab from '../components/priceplan/PlanEditTab';
import FeatureComparisonTab from '../components/priceplan/FeatureComparisonTab';
import TierManageTab from '../components/priceplan/TierManageTab';
import AddonManageTab from '../components/priceplan/AddonManageTab';

const TABS = ['plans', 'features', 'tiers', 'addons'] as const;
type TabKey = (typeof TABS)[number];

export default function PricePlanPage() {
  const { t } = useTranslation(['admin']);
  const [tab, setTab] = useState<TabKey>('plans');

  const tabMeta: Record<TabKey, { label: string }> = {
    plans: { label: t('admin:pricePlan.tabs.plans') },
    features: { label: t('admin:pricePlan.tabs.features') },
    tiers: { label: t('admin:pricePlan.tabs.tiers') },
    addons: { label: t('admin:pricePlan.tabs.addons') },
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <DollarSign className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('admin:pricePlan.title')}</h1>
          <p className="text-sm text-gray-500">{t('admin:pricePlan.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabMeta[k].label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'plans' && <PlanEditTab />}
        {tab === 'features' && <FeatureComparisonTab />}
        {tab === 'tiers' && <TierManageTab />}
        {tab === 'addons' && <AddonManageTab />}
      </div>
    </div>
  );
}
