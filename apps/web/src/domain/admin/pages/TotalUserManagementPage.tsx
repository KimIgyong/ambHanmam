import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersRound, Globe, Building2, Network, Mail, HardDrive, KeyRound } from 'lucide-react';
import InternalUsersTab from '../components/InternalUsersTab';
import PortalCustomersTab from '../components/PortalCustomersTab';
import EntityUserRolesTab from '../components/EntityUserRolesTab';
import UnitUserRolesTab from '../components/UnitUserRolesTab';
import InvitationsTab from '../components/InvitationsTab';
import EntityDriveSettingsTab from '../components/EntityDriveSettingsTab';
import EntityAiConfigsTab from '../components/EntityAiConfigsTab';

const TABS = [
  { key: 'portal', icon: Globe, labelKey: 'totalUsers:tabs.portal' },
  { key: 'users', icon: UsersRound, labelKey: 'totalUsers:tabs.users' },
  { key: 'entityRoles', icon: Building2, labelKey: 'totalUsers:tabs.entityRoles' },
  { key: 'unitRoles', icon: Network, labelKey: 'totalUsers:tabs.unitRoles' },
  { key: 'invitations', icon: Mail, labelKey: 'totalUsers:tabs.invitations' },
  { key: 'driveSettings', icon: HardDrive, labelKey: 'totalUsers:tabs.driveSettings' },
  { key: 'aiConfigs', icon: KeyRound, labelKey: 'totalUsers:tabs.aiConfigs' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function TotalUserManagementPage() {
  const { t } = useTranslation(['totalUsers', 'common']);
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <UsersRound className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('totalUsers:title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('totalUsers:subtitle')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-violet-600 text-violet-600'
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
        {activeTab === 'portal' && <PortalCustomersTab />}
        {activeTab === 'users' && <InternalUsersTab />}
        {activeTab === 'entityRoles' && <EntityUserRolesTab />}
        {activeTab === 'unitRoles' && <UnitUserRolesTab />}
        {activeTab === 'invitations' && <InvitationsTab />}
        {activeTab === 'driveSettings' && <EntityDriveSettingsTab />}
        {activeTab === 'aiConfigs' && <EntityAiConfigsTab />}
      </div>
    </div>
  );
}
