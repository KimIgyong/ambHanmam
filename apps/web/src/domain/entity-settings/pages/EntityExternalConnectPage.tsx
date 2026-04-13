import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, HardDrive, Wrench, MessageSquare, MessageCircle, ChevronRight, Plug, ListChecks } from 'lucide-react';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';
import { ExternalTaskToolsCards } from '@/domain/external-task-import/pages/ExternalTaskToolsPage';

interface ServiceCard {
  key: string;
  menuCode: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  titleKey: string;
  descKey: string;
  path: string;
  disabled?: boolean;
  badge?: string;
}

const SERVICE_CARDS: ServiceCard[] = [
  {
    key: 'aiModels',
    menuCode: 'ENTITY_API_KEYS',
    icon: Brain,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    titleKey: 'entitySettings:externalConnect.aiModels.title',
    descKey: 'entitySettings:externalConnect.aiModels.description',
    path: '/entity-settings/api-keys',
  },
  {
    key: 'googleDrive',
    menuCode: 'ENTITY_DRIVE',
    icon: HardDrive,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    titleKey: 'entitySettings:externalConnect.googleDrive.title',
    descKey: 'entitySettings:externalConnect.googleDrive.description',
    path: '/entity-settings/drive',
  },
  {
    key: 'slack',
    menuCode: 'ENTITY_SLACK_INTEGRATION',
    icon: MessageSquare,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    titleKey: 'entitySettings:externalConnect.slack.title',
    descKey: 'entitySettings:externalConnect.slack.description',
    path: '/entity-settings/slack-integration',
  },
  {
    key: 'asana',
    menuCode: 'ENTITY_EXTERNAL_TASK_TOOLS',
    icon: ListChecks,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
    titleKey: 'entitySettings:externalConnect.asana.title',
    descKey: 'entitySettings:externalConnect.asana.description',
    path: '/entity-settings/asana-integration',
  },
  {
    key: 'kakao',
    menuCode: '',
    icon: MessageCircle,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    titleKey: 'entitySettings:externalConnect.kakao.title',
    descKey: 'entitySettings:externalConnect.kakao.description',
    path: '',
    disabled: true,
    badge: 'entitySettings:externalConnect.kakao.comingSoon',
  },
];

export default function EntityExternalConnectPage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const navigate = useNavigate();
  const { data: myMenus } = useMyMenus();

  const accessibleCards = SERVICE_CARDS.filter(
    (card) => card.disabled || !myMenus || myMenus.some((m) => m.menuCode === card.menuCode),
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/entity-settings')} className="rounded p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <Plug className="h-6 w-6 text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('entitySettings:externalConnect.title')}</h1>
            <p className="text-sm text-gray-500">{t('entitySettings:externalConnect.description')}</p>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {accessibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                onClick={() => !card.disabled && navigate(card.path)}
                disabled={card.disabled}
                className={`group relative flex items-start gap-4 rounded-xl border bg-white p-5 text-left transition-all ${
                  card.disabled
                    ? 'cursor-not-allowed border-gray-100 opacity-60'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{t(card.titleKey)}</h3>
                    {card.badge && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {t(card.badge)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{t(card.descKey)}</p>
                </div>
                {!card.disabled && (
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-indigo-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* External Task Tools (inline cards) */}
        {(!myMenus || myMenus.some((m) => m.menuCode === 'ENTITY_EXTERNAL_TASK_TOOLS')) && (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">{t('entitySettings:externalConnect.projectTools.title')}</h2>
            </div>
            <ExternalTaskToolsCards />
          </div>
        )}
      </div>
    </div>
  );
}
