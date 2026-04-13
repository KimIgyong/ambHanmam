import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, FileText, Newspaper, Users, BarChart3, Settings, LucideIcon } from 'lucide-react';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import SiteManagementDashboard from './SiteManagementDashboard';

interface SiteSubMenu {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  separator?: boolean;
}

const SITE_SUB_MENUS: SiteSubMenu[] = [
  { labelKey: 'site:sidebar.menus', path: '/admin/site/menus', icon: Menu },
  { labelKey: 'site:sidebar.pages', path: '/admin/site/pages', icon: FileText },
  { labelKey: 'site:sidebar.posts', path: '/admin/site/posts', icon: Newspaper },
  { labelKey: 'site:sidebar.subscribers', path: '/admin/site/subscribers', icon: Users },
  { labelKey: 'site:sidebar.analytics', path: '/admin/site/analytics', icon: BarChart3, separator: true },
  { labelKey: 'site:sidebar.gaSettings', path: '/admin/site/ga-settings', icon: Settings },
];

export default function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['site']);
  const currentEntity = useEntityStore((s) => s.currentEntity);

  const isEntityIndependentRoute =
    location.pathname.startsWith('/admin/site/analytics') ||
    location.pathname.startsWith('/admin/site/ga-settings');

  // 법인 미선택 시 대시보드 표시 (analytics, ga-settings는 법인 무관)
  if (!currentEntity && !isEntityIndependentRoute) {
    return <SiteManagementDashboard />;
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      {/* Mobile: horizontal scroll tabs */}
      <div className="shrink-0 overflow-x-auto border-b border-gray-200 bg-gray-50 md:hidden">
        <div className="flex min-w-max gap-1 px-2 py-1.5">
          {SITE_SUB_MENUS.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.path);
            return (
              <button
                key={menu.path}
                onClick={() => navigate(menu.path)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'bg-lime-50 text-lime-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(menu.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: sidebar */}
      <aside className="hidden w-48 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 md:block">
        <div className="px-3 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {t('site:sidebar.siteManagement')}
          </h2>
        </div>
        <nav className="space-y-0.5 px-2 pb-4">
          {SITE_SUB_MENUS.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.path);
            return (
              <div key={menu.path}>
                {menu.separator && <div className="my-2 border-t border-gray-200" />}
                <button
                  onClick={() => navigate(menu.path)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-lime-50 text-lime-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-lime-600' : 'text-gray-400'}`} />
                  {t(menu.labelKey)}
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
