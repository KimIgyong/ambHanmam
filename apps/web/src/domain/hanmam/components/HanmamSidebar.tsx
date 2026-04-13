import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp } from 'lucide-react';
import {
  HANMAM_TABS,
  HANMAM_SUB_MENUS,
  HANMAM_FIXED_MENUS,
  type HanmamSubMenu,
} from '@/domain/hanmam/constants/hanmamMenuConfig';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  inDrawer?: boolean;
  onDrawerClose?: () => void;
}

export default function HanmamSidebar({ collapsed, onToggle, inDrawer, onDrawerClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['hanmam']);
  const [subMenuExpanded, setSubMenuExpanded] = useState(true);
  const [fixedMenuExpanded, setFixedMenuExpanded] = useState(true);

  const isCollapsed = !inDrawer && collapsed;

  // Detect active tab from URL: find which tab's sub-menus contain the current path
  const activeTab = (() => {
    // Check sub-menus first
    for (const tab of HANMAM_TABS) {
      const menus = HANMAM_SUB_MENUS[tab.id] || [];
      if (menus.some((m) => location.pathname === m.path || location.pathname.startsWith(m.path + '/'))) {
        return tab;
      }
    }
    // Fallback: check fixed menus don't match any tab, default to first tab
    return HANMAM_TABS[0];
  })();
  const subMenus: HanmamSubMenu[] = activeTab
    ? (HANMAM_SUB_MENUS[activeTab.id] || [])
    : [];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleNavigate = (path: string) => {
    navigate(path);
    if (inDrawer && onDrawerClose) onDrawerClose();
  };

  const renderItem = (item: HanmamSubMenu) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.path)}
        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
          isCollapsed ? 'justify-center' : ''
        } ${
          active
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title={isCollapsed ? t(item.labelKey) : undefined}
      >
        <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
        {!isCollapsed && (
          <span className="text-sm font-medium">{t(item.labelKey)}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-12 shrink-0 items-center border-b border-gray-100 px-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {activeTab ? t(activeTab.labelKey) : t('hanmam:lnb.subMenu')}
          </span>
        )}
        {!inDrawer && (
          <button
            onClick={onToggle}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {/* Tab sub-menus */}
        {subMenus.length > 0 && (
          <>
            {!isCollapsed && (
              <div
                className="mx-1 flex cursor-pointer items-center justify-between rounded-md bg-gray-100 px-3 pb-1 pt-3 hover:bg-gray-200"
                onClick={() => setSubMenuExpanded((v) => !v)}
              >
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  {activeTab ? t(activeTab.labelKey) : ''}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSubMenuExpanded((v) => !v); }}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                >
                  {subMenuExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            {subMenuExpanded && subMenus.map(renderItem)}
            {isCollapsed && <hr className="mx-2 my-1 border-gray-100" />}
          </>
        )}

        {/* Fixed menus (always shown) */}
        {!isCollapsed && (
          <div
            className="mx-1 mt-2 flex cursor-pointer items-center justify-between rounded-md bg-gray-100 px-3 pb-1 pt-3 hover:bg-gray-200"
            onClick={() => setFixedMenuExpanded((v) => !v)}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {t('hanmam:lnb.fixedMenu')}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setFixedMenuExpanded((v) => !v); }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              {fixedMenuExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
        {fixedMenuExpanded && HANMAM_FIXED_MENUS.map(renderItem)}
      </nav>
    </div>
  );
}
