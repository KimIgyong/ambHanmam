import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import {
  LayoutDashboard, Package, BarChart3, CreditCard, Settings, LogOut, Globe, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const;

const PORTAL_MENU = [
  { path: '/portal', icon: LayoutDashboard, labelKey: 'portal.nav.dashboard', exact: true },
  { path: '/portal/subscriptions', icon: Package, labelKey: 'portal.nav.subscriptions', exact: false },
  { path: '/portal/usage', icon: BarChart3, labelKey: 'portal.nav.usage', exact: false },
  { path: '/portal/billing', icon: CreditCard, labelKey: 'portal.nav.billing', exact: false },
  { path: '/portal/settings', icon: Settings, labelKey: 'portal.nav.settings', exact: false },
] as const;

export function PortalLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, customer, logout } = useAuthStore();
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
              <svg viewBox="0 0 300 300" width={24} height={24}>
                <polygon points="150,30 254,90 254,210 150,270 46,210 46,90"
                  fill="white" stroke="#666666" strokeWidth="25" strokeLinejoin="round" />
                <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle"
                  fontFamily="Arial, sans-serif" fontSize="150" fontWeight="900"
                  fill="#666666">ạ</text>
              </svg>
              Amoeba
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-300" />
            <span className="text-sm font-medium text-gray-600">{t('portal.title')}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <Globe className="h-4 w-4" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                        className={`block w-full px-3 py-1.5 text-left text-sm ${
                          i18n.language === lang.code ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User */}
            <span className="hidden sm:block text-sm text-gray-700">
              {customer?.name}
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
          <nav className="flex-1 space-y-1 p-3">
            {PORTAL_MENU.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white">
          {PORTAL_MENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  active ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
