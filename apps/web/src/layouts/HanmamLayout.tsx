import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { AlertCircle } from 'lucide-react';
import HanmamHeader from '@/domain/hanmam/components/HanmamHeader';
import HanmamSidebar from '@/domain/hanmam/components/HanmamSidebar';
import { NotificationModal } from '@/global/components/NotificationModal';
import { useNotificationSSE } from '@/global/hooks/useNotificationSSE';
import { useEntities } from '@/domain/hr/hooks/useEntity';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useIdleTimeout } from '@/global/hooks/useIdleTimeout';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { authService } from '@/domain/auth/service/auth.service';

export default function HanmamLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation(['common']);
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  useEntities();
  useNotificationSSE();
  usePageTracking();
  const handleLogout = useCallback(async () => {
    await authService.logout();
    logout();
    navigate('/user/login');
  }, [logout, navigate]);
  useIdleTimeout(handleLogout);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50" style={{ paddingTop: 'var(--sat)', paddingLeft: 'var(--sal)', paddingRight: 'var(--sar)' }}>
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-medium text-white">
          <AlertCircle className="h-3.5 w-3.5" />
          {t('common:offline', { defaultValue: 'You are offline. Some features may be unavailable.' })}
        </div>
      )}

      <HanmamHeader onMenuClick={() => setDrawerOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl" style={{ paddingTop: 'var(--sat)', paddingBottom: 'var(--sab)' }}>
              <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('common:sidebar.menu')}</span>
                <button onClick={() => setDrawerOpen(false)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <HanmamSidebar collapsed={false} onToggle={() => {}} inDrawer onDrawerClose={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside
          className={`hidden shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 md:flex ${
            collapsed ? 'w-16' : 'w-52'
          }`}
        >
          <HanmamSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        </aside>

        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden" style={{ paddingBottom: 'var(--sab)' }}>
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <NotificationModal />
    </div>
  );
}
