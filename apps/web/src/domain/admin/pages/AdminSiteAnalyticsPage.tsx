import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Settings } from 'lucide-react';
import SiteAnalyticsPage from '@/domain/site-management/pages/SiteAnalyticsPage';
import SiteGaSettingsPage from '@/domain/site-management/pages/SiteGaSettingsPage';

type TabKey = 'analytics' | 'gaSettings';

export default function AdminSiteAnalyticsPage() {
  const { t } = useTranslation(['admin']);
  const [activeTab, setActiveTab] = useState<TabKey>('analytics');

  const tabs: { key: TabKey; labelKey: string; icon: typeof BarChart3 }[] = [
    { key: 'analytics', labelKey: 'admin:siteAnalytics.tabs.analytics', icon: BarChart3 },
    { key: 'gaSettings', labelKey: 'admin:siteAnalytics.tabs.gaSettings', icon: Settings },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-100">
            <BarChart3 className="h-5 w-5 text-lime-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('admin:siteAnalytics.title')}</h1>
            <p className="text-sm text-gray-500">{t('admin:siteAnalytics.description')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 border-b-2 px-1 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-lime-600 text-lime-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="-mx-6 -mt-2">
          {activeTab === 'analytics' && <SiteAnalyticsPage />}
          {activeTab === 'gaSettings' && <SiteGaSettingsPage />}
        </div>
      </div>
    </div>
  );
}
