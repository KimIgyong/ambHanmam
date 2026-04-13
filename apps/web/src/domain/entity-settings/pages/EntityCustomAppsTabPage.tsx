import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppWindow, Store, FlaskConical } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { buildStoreUrl } from '@/domain/entity-settings/util/build-store-url';
import EntityCustomAppsPage from './EntityCustomAppsPage';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || 'https://apps.amoeba.site';
const STG_APP_STORE_URL = 'https://stg-apps.amoeba.site';

type TabKey = 'custom' | 'official' | 'staging';

const TABS: { key: TabKey; icon: typeof AppWindow; labelKey: string }[] = [
  { key: 'custom', icon: AppWindow, labelKey: 'entitySettings:customApps.tabCustom' },
  { key: 'official', icon: Store, labelKey: 'entitySettings:customApps.tabOfficialStore' },
  { key: 'staging', icon: FlaskConical, labelKey: 'entitySettings:customApps.tabTestStore' },
];

export default function EntityCustomAppsTabPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (isAdmin()) {
    return <Navigate to="/admin/custom-apps" replace />;
  }

  return <TabContent />;
}

function TabContent() {
  const { t } = useTranslation(['entitySettings']);
  const [activeTab, setActiveTab] = useState<TabKey>('custom');
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const user = useAuthStore((s) => s.user);

  const officialSrc = useMemo(
    () => buildStoreUrl(APP_STORE_URL, currentEntity, user),
    [currentEntity, user],
  );

  const stagingSrc = useMemo(
    () => buildStoreUrl(STG_APP_STORE_URL, currentEntity, user),
    [currentEntity, user],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 탭 헤더 */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-4 pt-2">
        {TABS.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'custom' && <EntityCustomAppsPage />}
        {activeTab === 'official' && (
          <iframe
            src={officialSrc}
            className="h-full w-full border-0"
            title="Official App Store"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
        {activeTab === 'staging' && (
          <iframe
            src={stagingSrc}
            className="h-full w-full border-0"
            title="Test App Store"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  );
}
