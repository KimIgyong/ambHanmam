import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClientAuthStore } from '../store/client-auth.store';
import { clientPortalApiService } from '../service/client-portal.service';
import { LayoutDashboard, FolderKanban, AlertCircle, User, LogOut, MessageCircle, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import LanguageSelector from '@/components/common/LanguageSelector';
import ClientNotificationBell from '../components/ClientNotificationBell';

const NAV_ITEMS = [
  { path: '/client', icon: LayoutDashboard, labelKey: 'nav.dashboard', exact: true },
  { path: '/client/projects', icon: FolderKanban, labelKey: 'nav.projects' },
  { path: '/client/issues', icon: AlertCircle, labelKey: 'nav.issues' },
  { path: '/client/chat', icon: MessageCircle, labelKey: 'nav.chat' },
  { path: '/client/profile', icon: User, labelKey: 'nav.profile' },
];

export default function ClientLayout() {
  const { t } = useTranslation('clientPortal');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useClientAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await clientPortalApiService.logout();
    logout();
    navigate('/client/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/client/issues?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const isChatPage = location.pathname.startsWith('/client/chat');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - 고정, 네비게이션만 */}
      <aside className={`hidden flex-shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col h-screen transition-all duration-200 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-3">
          {sidebarOpen && (
            <Link to="/client" className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                {user?.entityName?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <span className="text-sm font-semibold text-gray-900 truncate">{user?.entityName || t('title')}</span>
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
                    ? 'bg-indigo-50 font-medium text-indigo-700'
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
        <header className="hidden md:flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ClientNotificationBell />
            <LanguageSelector />
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
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
          <Link to="/client" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              {user?.entityName?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <span className="text-sm font-semibold truncate">{user?.entityName || t('title')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ClientNotificationBell />
            <LanguageSelector />
            <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className={`flex-1 overflow-auto ${isChatPage ? 'p-0 flex flex-col' : 'p-4 md:p-6'}`}>
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
                  active ? 'text-indigo-600' : 'text-gray-500'
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
