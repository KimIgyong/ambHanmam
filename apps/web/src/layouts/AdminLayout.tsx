import { useState, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIdleTimeout } from '@/global/hooks/useIdleTimeout';
import { usePageTracking } from '@/hooks/usePageTracking';
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  Package,
  DollarSign,
} from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { authService } from '@/domain/auth/service/auth.service';
import { useMyPermissions } from '@/domain/settings/hooks/useMenuPermissions';
import { useServiceList } from '@/domain/service-management/hooks/useServiceCatalog';
import { useEntities } from '@/domain/hr/hooks/useEntity';
import LanguageSelector from '@/components/common/LanguageSelector';
import GlobalSearchBar from '@/domain/search/components/GlobalSearchBar';
import i18n from '@/i18n';
import type { SvcServiceResponse } from '@amb/types';
import { MenuGuideProvider } from '@/global/contexts/MenuGuideContext';

/* ── 사이드바 Admin Settings 항목 ── */
const ADMIN_SETTINGS_ITEMS = [
  { menuCode: 'SETTINGS_USER_MANAGEMENT', path: '/admin/user-management', labelKey: 'common:settingsPage.userManagement.title' },
  { menuCode: 'SETTINGS_TOTAL_USERS', path: '/admin/total-users', labelKey: 'common:settingsPage.totalUsers.title' },
  { menuCode: 'SETTINGS_MEMBERS', path: '/admin/members', labelKey: 'common:settingsPage.members.title' },
  { menuCode: 'SETTINGS_PERMISSIONS', path: '/admin/permissions', labelKey: 'common:settingsPage.permissions.title' },
  { menuCode: 'SETTINGS_ENTITIES', path: '/admin/entities', labelKey: 'common:settingsPage.entities.title' },
  { menuCode: 'UNITS', path: '/admin/units', labelKey: 'common:settingsPage.units.title' },
  { menuCode: 'SETTINGS_API_KEYS', path: '/admin/api-keys', labelKey: 'common:settingsPage.apiKeys.title' },
  { menuCode: 'SETTINGS_PAYMENT_GATEWAY', path: '/admin/payment-gateway', labelKey: 'common:settingsPage.paymentGateway.title' },
  { menuCode: 'SETTINGS_PAYMENT_TRANSACTION', path: '/admin/payment-transactions', labelKey: 'common:settingsPage.paymentTransaction.title' },
  { menuCode: 'SETTINGS_SMTP', path: '/admin/smtp', labelKey: 'common:settingsPage.smtp.title' },
  { menuCode: 'SETTINGS_EMAIL_TEMPLATES', path: '/admin/email-templates', labelKey: 'common:settingsPage.emailTemplates.title' },
  { menuCode: 'SETTINGS_DRIVE', path: '/admin/drive', labelKey: 'common:settingsPage.drive.title' },
  { menuCode: 'SETTINGS_CONVERSATIONS', path: '/admin/conversations', labelKey: 'common:settingsPage.conversations.title' },
  { menuCode: 'SETTINGS_AGENTS', path: '/admin/agents', labelKey: 'common:settingsPage.chatAgents.title' },
  { menuCode: 'SETTINGS_AI_USAGE', path: '/admin/ai-usage', labelKey: 'common:settingsPage.aiUsage.title' },
  { menuCode: 'SETTINGS_SITE', path: '/admin/site-settings', labelKey: 'common:settingsPage.site.title' },
  { menuCode: 'ENTITY_CUSTOM_APPS', path: '/admin/custom-apps', labelKey: 'common:settingsPage.customApps.title' },
  { menuCode: 'SETTINGS_PORTAL_BRIDGE', path: '/admin/portal-bridge', labelKey: 'common:settingsPage.portalBridge.title' },
  { path: '/admin/glossary', labelKey: 'admin:sidebar.glossary' },
  { path: '/admin/redmine-migration', labelKey: 'admin:sidebar.redmineMigration' },
  { path: '/admin/redmine-imported', labelKey: 'admin:sidebar.redmineImported' },
  { path: '/admin/partners', labelKey: 'admin:partner.title' },
  { path: '/admin/partner-apps', labelKey: 'admin:partnerApps.title' },
  { path: '/admin/admin-users', labelKey: 'admin:adminUsers.title' },
  { path: '/admin/partner-users', labelKey: 'admin:partnerUsers.title' },
  { path: '/admin/partner-invitations', labelKey: 'admin:partnerInvitations.title' },
];

function getServiceName(svc: SvcServiceResponse): string {
  const lang = i18n.language;
  if (lang === 'ko' && svc.nameKo) return svc.nameKo;
  if (lang === 'vi' && svc.nameVi) return svc.nameVi;
  return svc.name;
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [managementExpanded, setManagementExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation(['admin', 'common']);
  const { data: accessibleMenus } = useMyPermissions();
  const { data: services } = useServiceList({ status: 'ACTIVE' });
  useEntities();
  usePageTracking();

  const handleLogout = useCallback(async () => {
    await authService.logout();
    logout();
    navigate('/user/login');
  }, [logout, navigate]);

  useIdleTimeout(handleLogout);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleSettings = ADMIN_SETTINGS_ITEMS.filter(
    (item) => !item.menuCode || !accessibleMenus || accessibleMenus.includes(item.menuCode),
  );
  const guideMenus = useMemo(
    () =>
      visibleSettings.map((item) => ({
        path: item.path,
        labelKey: item.labelKey,
        menuCode: item.menuCode,
      })),
    [visibleSettings],
  );

  /* ── Sidebar content (shared between desktop + drawer) ── */
  const renderSidebar = (inDrawer: boolean) => {
    const isCollapsed = !inDrawer && collapsed;

    const navItem = (path: string, label: string, icon?: React.ReactNode) => (
      <button
        key={path}
        onClick={() => { navigate(path); if (inDrawer) setDrawerOpen(false); }}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
          isCollapsed ? 'justify-center' : ''
        } ${
          isActive(path)
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title={isCollapsed ? label : undefined}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {!isCollapsed && <span className="truncate">{label}</span>}
      </button>
    );

    const sectionHeader = (
      label: string,
      expanded: boolean,
      toggle: () => void,
    ) =>
      !isCollapsed ? (
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
        >
          {label}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      ) : (
        <div className="mx-2 my-1 border-t border-gray-100" />
      );

    return (
      <div className="flex h-full flex-col">
        {/* Dashboard */}
        <div className="p-2">
          {navItem(
            '/admin',
            t('admin:sidebar.dashboard'),
            <LayoutDashboard className={`h-5 w-5 ${isActive('/admin') && location.pathname === '/admin' ? 'text-indigo-600' : 'text-gray-400'}`} />,
          )}
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {/* SERVICES */}
          {services && services.length > 0 && (
            <>
              {sectionHeader(t('admin:sidebar.services'), servicesExpanded, () => setServicesExpanded(!servicesExpanded))}
              {(servicesExpanded || isCollapsed) &&
                services.map((svc) =>
                  navItem(
                    `/admin/services/${svc.serviceId}`,
                    getServiceName(svc),
                    svc.color ? (
                      <span
                        className="inline-block h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: svc.color }}
                      />
                    ) : (
                      <Package className="h-4 w-4 text-gray-400" />
                    ),
                  ),
                )}
            </>
          )}

          {/* MANAGEMENT */}
          {sectionHeader(t('admin:sidebar.management'), managementExpanded, () => setManagementExpanded(!managementExpanded))}
          {(managementExpanded || isCollapsed) && (
            <>
              {navItem('/admin/service/dashboard', t('admin:sidebar.serviceManagement'), <Package className="h-4 w-4 text-cyan-500" />)}        {navItem('/admin/service/priceplan', t('admin:sidebar.pricePlan'), <DollarSign className="h-4 w-4 text-amber-500" />)}              {navItem('/admin/site/menus', t('admin:sidebar.siteManagement'), <Globe className="h-4 w-4 text-lime-500" />)}
            </>
          )}

          {/* SETTINGS */}
          {sectionHeader(t('admin:sidebar.settings'), settingsExpanded, () => setSettingsExpanded(!settingsExpanded))}
          {(settingsExpanded || isCollapsed) &&
            visibleSettings.map((item) =>
              navItem(
                item.path,
                t(item.labelKey),
                <Settings className="h-4 w-4 text-gray-400" />,
              ),
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderSidebar(false)}
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-200 md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-sm font-bold text-gray-900">AMB ADMIN</span>
          <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-3rem)]">{renderSidebar(true)}</div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          {/* Brand */}
          <span className="text-base font-bold text-gray-900 whitespace-nowrap">AMB ADMIN</span>

          {/* Search */}
          <div className="mx-4 flex-1 max-w-lg">
            <GlobalSearchBar />
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <LanguageSelector />
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <MenuGuideProvider menus={guideMenus}>
            <div className="flex-1 overflow-hidden">
              <Outlet />
            </div>
          </MenuGuideProvider>
        </main>
      </div>
    </div>
  );
}
