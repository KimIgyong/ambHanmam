import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';
import { Users, Shield, BarChart3, Building2, Activity, AppWindow, Mail, UserRoundPlus, Plug, TrendingUp, Clock, Settings2, Store, CreditCard } from 'lucide-react';

/* 외부 서비스 관련 메뉴 코드 — External Connect 허브 표시 여부 결정에 사용 */
const EXTERNAL_CONNECT_CODES = ['ENTITY_API_KEYS', 'ENTITY_DRIVE', 'ENTITY_EXTERNAL_TASK_TOOLS', 'ENTITY_SLACK_INTEGRATION'];

interface MenuItem {
  code: string;
  path: string;
  icon: React.ElementType;
  labelKey: string;
  relatedCodes?: string[];
}

const ENTITY_MENU_ITEMS: MenuItem[] = [
  { code: 'ENTITY_ORGANIZATION', path: '/entity-settings/organization', icon: Building2, labelKey: 'entitySettings:organization.title' },
  { code: 'ENTITY_MEMBERS', path: '/entity-settings/members', icon: Users, labelKey: 'entitySettings:members.title' },
  { code: 'ENTITY_CLIENT_MANAGEMENT', path: '/entity-settings/clients', icon: UserRoundPlus, labelKey: 'entitySettings:clients.title' },
  { code: 'ENTITY_PERMISSIONS', path: '/entity-settings/permissions', icon: Shield, labelKey: 'entitySettings:permissions.title' },
  { code: 'ENTITY_WORK_STATISTICS', path: '/entity-settings/work-statistics', icon: Activity, labelKey: 'entitySettings:workStatistics.title' },
  { code: 'ENTITY_ACTIVITY_INDEX', path: '/entity-settings/activity-index', icon: TrendingUp, labelKey: 'entitySettings:activityIndex.title' },
  { code: 'ENTITY_ATTENDANCE_POLICY', path: '/entity-settings/attendance-policy', icon: Clock, labelKey: 'entitySettings:attendancePolicy.title' },
  { code: 'ENTITY_EXTERNAL_CONNECT', path: '/entity-settings/external-connect', icon: Plug, labelKey: 'entitySettings:externalConnect.title', relatedCodes: EXTERNAL_CONNECT_CODES },
  { code: 'ENTITY_USAGE', path: '/entity-settings/usage', icon: BarChart3, labelKey: 'entitySettings:usage.title' },
  { code: 'ENTITY_CUSTOM_APPS', path: '/entity-settings/custom-apps', icon: AppWindow, labelKey: 'entitySettings:customApps.title' },
  { code: 'ENTITY_CUSTOM_APPS', path: '/entity-settings/app-store', icon: Store, labelKey: 'entitySettings:appStore.title' },
  { code: 'ENTITY_EMAIL_TEMPLATE', path: '/entity-settings/email-templates', icon: Mail, labelKey: 'entitySettings:emailTemplate.title' },
  { code: 'ENTITY_SITE_CONFIG', path: '/entity-settings/site-config', icon: Settings2, labelKey: 'entitySettings:siteConfig.title' },
  { code: 'ENTITY_USAGE', path: '/entity-settings/subscription', icon: CreditCard, labelKey: 'subscription:title' },
];

export default function EntitySettingsPage() {
  const { t } = useTranslation(['entitySettings', 'subscription']);
  const navigate = useNavigate();
  const { data: myMenus } = useMyMenus();

  const accessibleItems = ENTITY_MENU_ITEMS.filter((item) => {
    if (!myMenus) return true;
    if (item.relatedCodes) {
      return item.relatedCodes.some((code) => myMenus.some((m) => m.menuCode === code));
    }
    return myMenus.some((m) => m.menuCode === item.code);
  });

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('entitySettings:title')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accessibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.code}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            >
              <Icon className="h-6 w-6 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
    </div>
  );
}
