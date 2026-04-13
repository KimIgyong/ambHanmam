import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePartnerAuthStore } from '../store/partner-auth.store';
import { partnerPortalApiService } from '../service/partner-portal.service';
import { LayoutDashboard, AppWindow, User, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import LanguageSelector from '@/components/common/LanguageSelector';

const NAV_ITEMS = [
  { path: '/partner', icon: LayoutDashboard, labelKey: 'nav.dashboard', exact: true },
  { path: '/partner/apps', icon: AppWindow, labelKey: 'nav.myApps' },
  { path: '/partner/my-page', icon: User, labelKey: 'nav.myPage' },
];

export default function PartnerLayout() {
  const { t } = useTranslation('partnerPortal');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = usePartnerAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await partnerPortalApiService.logout();
    logout();
    navigate('/partner/login');
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`hidden flex-shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col h-screen transition-all duration-200 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3">
          {sidebarOpen && (
            <Link to="/partner" className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                {user?.partnerName?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <span className="text-sm font-semibold text-gray-900 truncate">{user?.partnerName || t('title')}</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? t(item.labelKey) : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-emerald-50 font-medium text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Right content area */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        {/* Top header - desktop */}
        <header className="hidden md:flex h-14 items-center justify-end border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-700 max-w-[120px] truncate">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              title={t('nav.logout')}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <Link to="/partner" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              {user?.partnerName?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <span className="text-sm font-semibold truncate">{user?.partnerName || t('title')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="flex items-center justify-around border-t border-gray-200 bg-white py-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 text-xs ${
                  active ? 'text-emerald-600' : 'text-gray-500'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
