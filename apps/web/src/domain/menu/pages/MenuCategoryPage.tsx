import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, FileText, AppWindow, Wrench, Package, LayoutGrid, List, ChevronRight, Store } from 'lucide-react';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';
import { useMyCustomApps } from '@/domain/entity-settings/hooks/useEntitySettings';
import {
  WORK_TOOL_CODES,
  ICON_MAP,
  COLOR_MAP,
  ICON_BG_MAP,
  MENU_DESC_KEY,
} from '@/domain/menu/constants/menuConfig';

export type CategoryType = 'workTools' | 'workModules' | 'customApps';

interface MenuCategoryPageProps {
  type: CategoryType;
}

type ViewMode = 'card' | 'list';

const VIEW_MODE_KEY = 'menuCategory_viewMode';

export default function MenuCategoryPage({ type }: MenuCategoryPageProps) {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'card';
  });

  const { data: myMenus } = useMyMenus();
  const { data: customApps } = useMyCustomApps();

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  // 카테고리별 데이터 준비
  const sortedMenus = (() => {
    const menus = (myMenus || []).filter(
      (m) =>
        !m.menuCode.startsWith('CHAT_') &&
        !m.menuCode.startsWith('SETTINGS_') &&
        !m.menuCode.startsWith('ENTITY_') &&
        m.menuCode !== 'SITE_MANAGEMENT' &&
        m.menuCode !== 'SERVICE_MANAGEMENT',
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

  type MenuItem = typeof sortedMenus[0];
  type CustomApp = NonNullable<typeof customApps>[0];

  const items: MenuItem[] =
    type === 'workTools'
      ? sortedMenus.filter((m) => m.category === 'WORK_TOOL' || (m.category == null && WORK_TOOL_CODES.includes(m.menuCode)))
      : type === 'workModules'
        ? sortedMenus.filter((m) => m.category === 'WORK_MODULE' || (m.category == null && !WORK_TOOL_CODES.includes(m.menuCode)))
        : [];

  const customAppItems: CustomApp[] = type === 'customApps' ? (customApps || []) : [];

  const totalCount =
    type === 'customApps' ? customAppItems.length : items.length;

  const categoryTitle =
    type === 'workTools'
      ? t('common:sidebar.workTools')
      : type === 'workModules'
        ? t('common:sidebar.workModules')
        : t('common:sidebar.customApps', { defaultValue: 'Custom Apps' });

  const categoryIcon =
    type === 'workTools' ? Wrench : type === 'workModules' ? Package : AppWindow;

  const categoryBadgeClass =
    type === 'workTools'
      ? 'bg-blue-50 text-blue-600'
      : type === 'workModules'
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-fuchsia-50 text-fuchsia-600';

  const tabs = [
    {
      type: 'workTools' as CategoryType,
      path: '/menu/work-tools',
      labelKey: 'common:sidebar.workTools',
      defaultLabel: 'Work Tools',
    },
    {
      type: 'workModules' as CategoryType,
      path: '/menu/work-modules',
      labelKey: 'common:sidebar.workModules',
      defaultLabel: 'Work Modules',
    },
    {
      type: 'customApps' as CategoryType,
      path: '/menu/custom-apps',
      labelKey: 'common:sidebar.customApps',
      defaultLabel: 'Custom Apps',
    },
  ];

  const isEmpty = totalCount === 0;
  const CategoryIcon = categoryIcon;

  // ── 카드 뷰 ─────────────────────────────────────────
  const renderCardGrid = () => {
    if (type === 'customApps') {
      return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {customAppItems.map((app) => {
            const Icon = ICON_MAP[app.icon] || AppWindow;
            const color = COLOR_MAP[app.icon] || 'text-fuchsia-500';
            const bg = ICON_BG_MAP[app.icon] || 'bg-fuchsia-50';
            const active = isActive(`/apps/${app.code}`);
            return (
              <button
                key={app.id}
                onClick={() => navigate(`/apps/${app.code}`)}
                className={`group flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all duration-200 hover:shadow-md ${
                  active
                    ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-indigo-300 shadow-sm'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${active ? 'bg-indigo-100' : bg}`}>
                  <Icon className={`h-6 w-6 ${active ? 'text-indigo-600' : color}`} />
                </div>
                <span className={`text-sm font-medium leading-tight ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || FileText;
          const color = COLOR_MAP[item.icon] || 'text-gray-500';
          const bg = ICON_BG_MAP[item.icon] || 'bg-gray-50';
          const active = isActive(item.path);
          const label = t(item.labelKey, { defaultValue: item.menuCode });
          const descKey = MENU_DESC_KEY[item.menuCode];
          const desc = descKey ? t(descKey, { defaultValue: '' }) : '';
          return (
            <button
              key={item.menuCode}
              onClick={() => navigate(item.path)}
              className={`group flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-md ${
                active
                  ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-indigo-300 shadow-sm'
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-indigo-100' : bg}`}>
                <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : color}`} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-semibold leading-tight ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {label}
                </span>
                {desc && (
                  <span className="line-clamp-2 text-xs leading-relaxed text-gray-400">
                    {desc}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // ── 목록 뷰 ─────────────────────────────────────────
  const renderListView = () => {
    if (type === 'customApps') {
      return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {customAppItems.map((app, idx) => {
            const Icon = ICON_MAP[app.icon] || AppWindow;
            const color = COLOR_MAP[app.icon] || 'text-fuchsia-500';
            const bg = ICON_BG_MAP[app.icon] || 'bg-fuchsia-50';
            const active = isActive(`/apps/${app.code}`);
            return (
              <div
                key={app.id}
                className={`${idx > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <button
                  onClick={() => navigate(`/apps/${app.code}`)}
                  className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                    active ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${active ? 'bg-indigo-100' : bg}`}>
                    <Icon className={`h-4.5 w-4.5 ${active ? 'text-indigo-600' : color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`block text-sm font-medium ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {app.name}
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 ${active ? 'text-indigo-400' : 'text-gray-300'}`} />
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {items.map((item, idx) => {
          const Icon = ICON_MAP[item.icon] || FileText;
          const color = COLOR_MAP[item.icon] || 'text-gray-500';
          const bg = ICON_BG_MAP[item.icon] || 'bg-gray-50';
          const active = isActive(item.path);
          const label = t(item.labelKey, { defaultValue: item.menuCode });
          const descKey = MENU_DESC_KEY[item.menuCode];
          const desc = descKey ? t(descKey, { defaultValue: '' }) : '';
          return (
            <div
              key={item.menuCode}
              className={`${idx > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <button
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                  active ? 'bg-indigo-50' : ''
                }`}
              >
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${active ? 'bg-indigo-100' : bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${active ? 'text-indigo-600' : color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {label}
                  </span>
                  {desc && (
                    <span className="block truncate text-xs text-gray-400">
                      {desc}
                    </span>
                  )}
                </div>
                <ChevronRight className={`h-4 w-4 flex-shrink-0 ${active ? 'text-indigo-400' : 'text-gray-300'}`} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-gray-50">
      {/* 페이지 헤더 */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={t('common:menuCategory.backToMain', { defaultValue: 'Home' })}
            >
              <Home className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-center gap-2">
              <span className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${categoryBadgeClass}`}>
                <CategoryIcon className="h-3.5 w-3.5" />
                {categoryTitle}
              </span>
              {!isEmpty && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  {totalCount}
                </span>
              )}
            </div>
            {/* 뷰 토글 */}
            {!isEmpty && (
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button
                  onClick={() => setViewMode('card')}
                  title={t('common:menuCategory.viewCard', { defaultValue: 'Card view' })}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === 'card'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title={t('common:menuCategory.viewList', { defaultValue: 'List view' })}
                  className={`rounded-md p-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex border-t border-gray-100 px-4 md:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => navigate(tab.path)}
              className={`relative mr-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                type === tab.type
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
            </button>
          ))}
          <button
            onClick={() => navigate('/app-store')}
            className="relative mr-1 flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-orange-500 transition-colors hover:text-orange-600"
          >
            <Store className="h-3.5 w-3.5" />
            {t('common:sidebar.appStore', { defaultValue: 'App Store' })}
          </button>
          <button
            onClick={() => navigate('/app-store-stg')}
            className="relative mr-1 flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-teal-500 transition-colors hover:text-teal-600"
          >
            <Store className="h-3.5 w-3.5" />
            App Store 2
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 p-4 md:p-6">
        {isEmpty ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">
            {t('common:menuCategory.noMenus', { defaultValue: 'No menus available.' })}
          </div>
        ) : viewMode === 'card' ? (
          renderCardGrid()
        ) : (
          renderListView()
        )}
      </div>
    </div>
  );
}

