import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, CreditCard, Coins, HardDrive } from 'lucide-react';
import PricingSection from '../components/PricingSection';
import PlanSection from '../components/PlanSection';
import TokenSection from '../components/TokenSection';
import StorageSection from '../components/StorageSection';

type Tab = 'pricing' | 'plan' | 'tokens' | 'storage';

export default function SubscriptionPage() {
  const { t } = useTranslation(['subscription']);
  const [activeTab, setActiveTab] = useState<Tab>('pricing');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'pricing', label: t('subscription:pricing.title'), icon: Tag },
    { key: 'plan', label: t('subscription:plan.title'), icon: CreditCard },
    { key: 'tokens', label: t('subscription:token.title'), icon: Coins },
    { key: 'storage', label: t('subscription:storage.title'), icon: HardDrive },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          {t('subscription:title')}
        </h1>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'pricing' && <PricingSection />}
        {activeTab === 'plan' && <PlanSection />}
        {activeTab === 'tokens' && <TokenSection />}
        {activeTab === 'storage' && <StorageSection />}
      </div>
    </div>
  );
}
