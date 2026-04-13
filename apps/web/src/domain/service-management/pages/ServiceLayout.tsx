import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, Users, CreditCard, LucideIcon } from 'lucide-react';

interface ServiceSubMenu {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

const SERVICE_SUB_MENUS: ServiceSubMenu[] = [
  { labelKey: 'service:menu.dashboard', path: '/admin/service/dashboard', icon: LayoutDashboard },
  { labelKey: 'service:menu.services', path: '/admin/service/services', icon: Package },
  { labelKey: 'service:menu.clients', path: '/admin/service/clients', icon: Users },
  { labelKey: 'service:menu.subscriptions', path: '/admin/service/subscriptions', icon: CreditCard },
];

export default function ServiceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['service']);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-full flex-col overflow-hidden md:flex-row">
      {/* Mobile: horizontal scroll tabs */}
      <div className="shrink-0 overflow-x-auto border-b border-gray-200 bg-gray-50 md:hidden">
        <div className="flex min-w-max gap-1 px-2 py-1.5">
          {SERVICE_SUB_MENUS.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.path);
            return (
              <button
                key={menu.path}
                onClick={() => navigate(menu.path)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-100'
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
            {t('service:title')}
          </h2>
        </div>
        <nav className="space-y-0.5 px-2 pb-4">
          {SERVICE_SUB_MENUS.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.path);
            return (
              <button
                key={menu.path}
                onClick={() => navigate(menu.path)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                  active
                    ? 'bg-cyan-50 text-cyan-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-cyan-600' : 'text-gray-400'}`} />
                {t(menu.labelKey)}
              </button>
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
