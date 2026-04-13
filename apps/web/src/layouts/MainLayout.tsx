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
  FileText,
  Building2,
  AlertCircle,
  CircleUser,
  Menu,
  X,
  AppWindow,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  WORK_TOOL_CODES,
  ICON_MAP,
  COLOR_MAP,
} from '@/domain/menu/constants/menuConfig';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { authService } from '@/domain/auth/service/auth.service';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';
import LanguageSelector from '@/components/common/LanguageSelector';
import GlobalSearchBar from '@/domain/search/components/GlobalSearchBar';
import EntitySelector from '@/domain/hr/components/EntitySelector';
import { NotificationBell } from '@/global/components/NotificationBell';
import { NotificationModal } from '@/global/components/NotificationModal';
import { useNotificationSSE } from '@/global/hooks/useNotificationSSE';
import { useEntities } from '@/domain/hr/hooks/useEntity';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import AIAssistantModal from '@/domain/assistant/components/AIAssistantModal';
import LoginAnnouncementModal from '@/global/components/LoginAnnouncementModal';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePwaMode } from '@/hooks/usePwaMode';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { usePresenceHeartbeat, usePresenceSSE } from '@/domain/amoeba-talk/hooks/usePresence';
import MobileBottomBar from '@/components/layout/MobileBottomBar';
import { useMyCustomApps } from '@/domain/entity-settings/hooks/useEntitySettings';
import { MenuGuideProvider } from '@/global/contexts/MenuGuideContext';



export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workToolsExpanded, setWorkToolsExpanded] = useState(true);
  const [workModulesExpanded, setWorkModulesExpanded] = useState(false);
  const [customAppsExpanded, setCustomAppsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isMaster = useAuthStore((s) => s.isMaster);
  const { t } = useTranslation(['common']);
  const { data: myMenus } = useMyMenus();
  useEntities();
  const currentEntity = useEntityStore((s) => s.currentEntity);
  useNotificationSSE();
  usePageTracking();
  const isOnline = useNetworkStatus();
  const isPwa = usePwaMode();
  usePushSubscription();
  usePresenceHeartbeat();
  usePresenceSSE();
  const { data: customApps } = useMyCustomApps();
  const guideMenus = useMemo(
    () =>
      (myMenus || []).map((m) => ({
        path: m.path,
        labelKey: m.labelKey,
        menuCode: m.menuCode,
        icon: m.icon,
      })),
    [myMenus],
  );

  const handleLogout = useCallback(async () => {
    await authService.logout();
    logout();
    navigate('/user/login');
  }, [logout, navigate]);

  // Auto-logout after 60 minutes of inactivity
  useIdleTimeout(handleLogout);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasAnySettingsAccess =
    isAdmin() && (
      !myMenus ||
      myMenus.some((m) => m.menuCode.startsWith('SETTINGS_'))
    );

  const isSettingsActive = location.pathname.startsWith('/admin');
  const isEntitySettingsActive = location.pathname.startsWith('/entity-settings');
  const isMyPageActive = location.pathname === '/my-page';

  const hasAnyEntitySettingsAccess =
    isMaster() && (
      !myMenus ||
      myMenus.some((m) => m.menuCode.startsWith('ENTITY_'))
    );



  const sortedMenus = (() => {
    const menus = (myMenus || []).filter(
      (m) => !m.menuCode.startsWith('CHAT_') && !m.menuCode.startsWith('SETTINGS_') && !m.menuCode.startsWith('ENTITY_')
        && m.menuCode !== 'SITE_MANAGEMENT' && m.menuCode !== 'SERVICE_MANAGEMENT',
    );
    if (!menus.some((m) => m.menuCode === 'ATTENDANCE')) {
      menus.push({
        menuCode: 'ATTENDANCE',
        labelKey: 'common:sidebar.attendance',
        icon: 'CalendarDays',
        path: '/attendance',
        category: 'WORK_TOOL',
        sortOrder: 500,
      });
    }
    if (!menus.some((m) => m.menuCode === 'MY_LEAVE')) {
      menus.push({
        menuCode: 'MY_LEAVE',
        labelKey: 'common:sidebar.myLeave',
        icon: 'CalendarOff',
        path: '/my-leave',
        category: 'WORK_TOOL',
        sortOrder: 501,
      });
    }
    return menus.sort((a, b) => a.sortOrder - b.sortOrder);
  })();

  const workTools = sortedMenus.filter(
    (m) => m.category === 'WORK_TOOL' || (m.category == null && WORK_TOOL_CODES.includes(m.menuCode)),
  );
  const workModules = sortedMenus.filter(
    (m) => m.category === 'WORK_MODULE' || (m.category == null && !WORK_TOOL_CODES.includes(m.menuCode)),
  );

  const renderMenuItem = (item: typeof sortedMenus[0], inDrawer: boolean) => {
    const Icon = ICON_MAP[item.icon] || FileText;
    const color = COLOR_MAP[item.icon] || 'text-gray-500';
    const active = isActive(item.path);
    const label = t(item.labelKey, { defaultValue: item.menuCode });
    const isCollapsed = !inDrawer && collapsed;

    return (
      <button
        key={item.menuCode}
        onClick={() => {
          navigate(item.path);
          if (inDrawer) setDrawerOpen(false);
        }}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
          isCollapsed ? 'justify-center' : ''
        } ${
          active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title={isCollapsed ? label : undefined}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${
            active ? 'text-indigo-600' : color
          }`}
        />
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{label}</div>
          </div>
        )}
      </button>
    );
  };

  const renderMenuItems = (inDrawer: boolean) => {
    const isCollapsed = !inDrawer && collapsed;
    return (
      <>
        {workTools.length > 0 && (
          <>
            {!isCollapsed && (
              <div
                className="flex cursor-pointer items-center justify-between px-3 pb-1 pt-3 bg-gray-100 hover:bg-gray-200 rounded-md mx-1"
                onClick={() => {
                  navigate('/menu/work-tools');
                  if (inDrawer) setDrawerOpen(false);
                }}
              >
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {t('common:sidebar.workTools')}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkToolsExpanded((prev) => !prev);
                  }}
                  className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {workToolsExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
            {workToolsExpanded && workTools.map((item) => renderMenuItem(item, inDrawer))}
            {isCollapsed && <hr className="mx-2 my-1 border-gray-100" />}
          </>
        )}
        {workModules.length > 0 && (
          <>
            {!isCollapsed && (
              <div
                className="flex cursor-pointer items-center justify-between px-3 pb-1 pt-3 bg-gray-100 hover:bg-gray-200 rounded-md mx-1"
                onClick={() => {
                  navigate('/menu/work-modules');
                  if (inDrawer) setDrawerOpen(false);
                }}
              >
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {t('common:sidebar.workModules')}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkModulesExpanded((prev) => !prev);
                  }}
                  className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {workModulesExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
            {workModulesExpanded && workModules.map((item) => renderMenuItem(item, inDrawer))}
            {isCollapsed && <hr className="mx-2 my-1 border-gray-100" />}
          </>
        )}
        {customApps && customApps.length > 0 && (
          <>
            {!isCollapsed && (
              <div
                className="flex cursor-pointer items-center justify-between px-3 pb-1 pt-3 bg-gray-100 hover:bg-gray-200 rounded-md mx-1"
                onClick={() => {
                  navigate('/menu/custom-apps');
                  if (inDrawer) setDrawerOpen(false);
                }}
              >
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {t('common:sidebar.customApps', { defaultValue: 'Custom Apps' })}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomAppsExpanded((prev) => !prev);
                  }}
                  className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {customAppsExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
            {customAppsExpanded && customApps.map((app) => {
              const Icon = ICON_MAP[app.icon] || AppWindow;
              const color = COLOR_MAP[app.icon] || 'text-fuchsia-500';
              const active = isActive(`/apps/${app.code}`);
              const label = app.name;

              return (
                <button
                  key={app.id}
                  onClick={() => {
                    navigate(`/apps/${app.code}`);
                    if (inDrawer) setDrawerOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? label : undefined}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      active ? 'text-indigo-600' : color
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{label}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </>
        )}
      </>
    );
  };

  const renderBottomItems = (inDrawer: boolean) => {
    const isCollapsed = !inDrawer && collapsed;
    return (
      <div className="shrink-0 border-t border-gray-100 p-2 space-y-1">
        <button
          onClick={() => {
            navigate('/my-page');
            if (inDrawer) setDrawerOpen(false);
          }}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
            isCollapsed ? 'justify-center' : ''
          } ${
            isMyPageActive
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
          title={isCollapsed ? t('myPage:title', { defaultValue: 'My Page' }) : undefined}
        >
          <CircleUser className={`h-5 w-5 shrink-0 ${
            isMyPageActive ? 'text-indigo-600' : 'text-gray-400'
          }`} />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t('myPage:title', { defaultValue: 'My Page' })}</div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
                if (inDrawer) setDrawerOpen(false);
              }}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              title={t('common:logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </button>
        {hasAnyEntitySettingsAccess && (
          <button
            onClick={() => {
              navigate('/entity-settings');
              if (inDrawer) setDrawerOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isEntitySettingsActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            title={isCollapsed ? t('entitySettings:sidebar.entitySettings', { defaultValue: 'Entity Settings' }) : undefined}
          >
            <Building2 className={`h-5 w-5 shrink-0 ${
              isEntitySettingsActive ? 'text-indigo-600' : 'text-gray-400'
            }`} />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{t('entitySettings:sidebar.entitySettings', { defaultValue: 'Entity Settings' })}</div>
              </div>
            )}
          </button>
        )}
        {hasAnySettingsAccess && (
          <button
            onClick={() => {
              navigate('/admin');
              if (inDrawer) setDrawerOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isSettingsActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            title={isCollapsed ? t('common:settings') : undefined}
          >
            <Settings className={`h-5 w-5 shrink-0 ${
              isSettingsActive ? 'text-indigo-600' : 'text-gray-400'
            }`} />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{t('common:settings')}</div>
              </div>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50" style={{ paddingTop: 'var(--sat)', paddingLeft: 'var(--sal)', paddingRight: 'var(--sar)' }}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-medium text-white">
          <AlertCircle className="h-3.5 w-3.5" />
          {t('common:offline', { defaultValue: 'You are offline. Some features may be unavailable.' })}
        </div>
      )}
      {/* Header */}
      <header data-header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 md:h-16 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setDrawerOpen(true)} className={`rounded-md p-1.5 text-gray-500 hover:bg-gray-100 ${isPwa ? '' : 'md:hidden'}`}>
            <Menu className="h-5 w-5" />
          </button>
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={() => navigate('/today')}
          >
            {/* Amoeba SVG Logo */}
            <svg viewBox="0 0 300 300" className="h-7 w-7 md:h-8 md:w-8">
              <polygon points="150,30 254,90 254,210 150,270 46,210 46,90"
                fill="white" stroke="#666666" strokeWidth="25" strokeLinejoin="round" />
              <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle"
                fontFamily="Arial, sans-serif" fontSize="150" fontWeight="900"
                fill="#666666">ạ</text>
            </svg>
            <span className="text-sm font-semibold text-gray-800 md:text-base">
              {currentEntity?.name || 'AMB'}
            </span>
          </div>
        </div>

        <div className="hidden md:block">
          <GlobalSearchBar />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <EntitySelector />
          <NotificationBell />
          <LanguageSelector />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div data-mobile-drawer className={`fixed inset-0 z-40 ${isPwa ? '' : 'md:hidden'}`}>
            <div className="fixed inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl" style={{ paddingTop: 'var(--sat)', paddingBottom: 'var(--sab)' }}>
              <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('common:sidebar.menu')}</span>
                <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2">
                {renderMenuItems(true)}
              </nav>
              {renderBottomItems(true)}
            </aside>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside
          data-sidebar
          className={`shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
            isPwa ? 'hidden' : 'hidden md:flex'
          } ${
            collapsed ? 'w-16' : 'w-52'
          }`}
        >
          <div
            className={`flex h-12 shrink-0 items-center border-b border-gray-100 px-3 ${
              collapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            {!collapsed && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('common:sidebar.menu')}
              </span>
            )}
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={collapsed ? t('common:sidebar.open') : t('common:sidebar.close')}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {renderMenuItems(false)}
          </nav>

          {renderBottomItems(false)}
        </aside>

        {/* Main content area */}
        <main data-main-content className="flex flex-1 flex-col overflow-hidden" style={isPwa ? undefined : { paddingBottom: 'var(--sab)' }}>
          <MenuGuideProvider menus={guideMenus}>
            <div className="flex-1 overflow-hidden">
              <Outlet />
            </div>
          </MenuGuideProvider>
        </main>
      </div>

      {/* PWA Bottom Navigation */}
      {isPwa && <MobileBottomBar onMoreClick={() => setDrawerOpen(true)} />}

      {/* AI Assistant Modal */}
      <AIAssistantModal />

      {/* Login Announcement Modal */}
      <LoginAnnouncementModal />

      {/* Notification Modal (화면 상단 중앙) */}
      <NotificationModal />
    </div>
  );
}
