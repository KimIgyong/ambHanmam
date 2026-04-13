import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ArrowLeft, Settings2, ShieldCheck, BookOpenText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MenuConfigTab from '../components/MenuConfigTab';
import RolePermissionTab from '../components/RolePermissionTab';
import MenuGuideTab from '../components/MenuGuideTab';

type TabKey = 'menuGuide' | 'menuConfig' | 'rolePermissions';

const TABS: Array<{
  key: TabKey;
  icon: typeof Settings2;
}> = [
  { key: 'menuGuide', icon: BookOpenText },
  { key: 'menuConfig', icon: Settings2 },
  { key: 'rolePermissions', icon: ShieldCheck },
];

export default function MenuPermissionsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('menuGuide');

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('settings:permissions.headerTitle')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settings:permissions.headerSubtitle')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`settings:permissions.tabs.${key}`)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'menuGuide' && <MenuGuideTab />}
        {activeTab === 'menuConfig' && <MenuConfigTab />}
        {activeTab === 'rolePermissions' && <RolePermissionTab />}
      </div>
    </div>
  );
}
