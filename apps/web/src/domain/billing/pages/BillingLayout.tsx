import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ClipboardList, FileText, Receipt, Wallet, LayoutDashboard, LucideIcon, Settings } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import PageTitle from '@/global/components/PageTitle';

interface BillingSubMenu {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const BILLING_SUB_MENUS: BillingSubMenu[] = [
  { labelKey: 'billing:menu.dashboard', path: '/billing/dashboard', icon: LayoutDashboard },
  { labelKey: 'billing:menu.partners', path: '/billing/partners', icon: Building2 },
  { labelKey: 'billing:menu.contracts', path: '/billing/contracts', icon: FileText },
  { labelKey: 'billing:menu.sow', path: '/billing/sow', icon: ClipboardList },
  { labelKey: 'billing:menu.invoices', path: '/billing/invoices', icon: Receipt },
  { labelKey: 'billing:menu.payments', path: '/billing/payments', icon: Wallet },
  { labelKey: 'billing:menu.settings', path: '/billing/settings', icon: Settings, adminOnly: true },
];

export default function BillingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['billing', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const currentEntity = useEntityStore((s) => s.currentEntity);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleMenus = BILLING_SUB_MENUS.filter((m) => !m.adminOnly || isAdmin);

  if (!currentEntity) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">{t('billing:selectEntity')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 페이지 타이틀 - 탭 위 */}
      <div className="shrink-0 bg-white px-6 pt-6 pb-2">
        <PageTitle>{t('billing:title', { defaultValue: 'Partner' })}</PageTitle>
      </div>

      {/* 수평 탭메뉴 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex overflow-x-auto px-6">
          {visibleMenus.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.path);
            return (
              <button
                key={menu.path}
                onClick={() => navigate(menu.path)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'border-indigo-600 font-medium text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(menu.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
