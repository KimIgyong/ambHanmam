import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Users, Home, AlertCircle, Menu } from 'lucide-react';
import { useTotalUnreadCount } from '@/domain/amoeba-talk/hooks/useTalk';

interface Props {
  onMoreClick: () => void;
}

const tabs = [
  { key: 'messages', icon: MessageCircle, path: '/amoeba-talk', labelKey: 'common:pwa.messages' },
  { key: 'crew', icon: Users, path: '/crew', labelKey: 'common:pwa.crew' },
  { key: 'home', icon: Home, path: '/', labelKey: 'common:pwa.home' },
  { key: 'issues', icon: AlertCircle, path: '/issues', labelKey: 'common:pwa.issues' },
  { key: 'more', icon: Menu, path: '', labelKey: 'common:pwa.more' },
] as const;

export default function MobileBottomBar({ onMoreClick }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const totalUnread = useTotalUnreadCount();

  const isActive = (path: string) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav
      className="shrink-0 border-t border-gray-200 bg-white"
      style={{ paddingBottom: 'var(--sab)' }}
    >
      <div className="flex h-14 items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          const isMore = tab.key === 'more';
          const isMessages = tab.key === 'messages';

          return (
            <button
              key={tab.key}
              onClick={() => {
                if (isMore) {
                  onMoreClick();
                } else {
                  navigate(tab.path);
                }
              }}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isMessages && totalUnread > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">
                {t(tab.labelKey, { defaultValue: tab.key.charAt(0).toUpperCase() + tab.key.slice(1) })}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
