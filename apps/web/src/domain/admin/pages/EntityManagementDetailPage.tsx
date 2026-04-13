import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Package, BarChart3, Loader2 } from 'lucide-react';
import { useEntityManagementDetail } from '../hooks/useAdmin';
import EntitySummaryTab from '../components/EntitySummaryTab';
import EntityServiceTab from '../components/EntityServiceTab';
import EntityAiUsageTab from '../components/EntityAiUsageTab';

const TABS = [
  { key: 'summary', icon: Building2, labelKey: 'entityManagement:tabs.summary' },
  { key: 'services', icon: Package, labelKey: 'entityManagement:tabs.services' },
  { key: 'aiUsage', icon: BarChart3, labelKey: 'entityManagement:tabs.aiUsage' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function EntityManagementDetailPage() {
  const { t } = useTranslation(['entityManagement', 'members']);
  const navigate = useNavigate();
  const { entityId } = useParams<{ entityId: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const { data: entity, isLoading } = useEntityManagementDetail(entityId || '');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">{t('entityManagement:noEntities')}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/user-management')}
            className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('entityManagement:back')}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
              <Building2 className="h-5 w-5 text-rose-600" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{entity.entityName}</h1>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                {entity.entityCode}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                entity.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {t(`members:userStatus.${entity.status}`)}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                entity.level === 'ROOT' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {t(`entityManagement:level.${entity.level}`)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-rose-600 text-rose-600'
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
        {activeTab === 'summary' && <EntitySummaryTab entity={entity} />}
        {activeTab === 'services' && <EntityServiceTab entityId={entityId!} />}
        {activeTab === 'aiUsage' && <EntityAiUsageTab entityId={entityId!} />}
      </div>
    </div>
  );
}
