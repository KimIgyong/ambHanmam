import { useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MemberListTab from '../components/MemberListTab';
import CellListTab from '../components/CellListTab';
import InvitationListTab from '../components/InvitationListTab';

type TabKey = 'members' | 'cells' | 'invitations';

export default function MemberManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const { t } = useTranslation('members');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'members', label: t('tabs.members') },
    { key: 'cells', label: t('tabs.cells') },
    { key: 'invitations', label: t('tabs.invitations') },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'members' && <MemberListTab />}
        {activeTab === 'cells' && <CellListTab />}
        {activeTab === 'invitations' && <InvitationListTab />}
      </div>
    </div>
  );
}
