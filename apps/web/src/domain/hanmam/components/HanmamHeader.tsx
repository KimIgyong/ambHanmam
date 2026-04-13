import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { HANMAM_TABS, HANMAM_SUB_MENUS } from '@/domain/hanmam/constants/hanmamMenuConfig';
import LanguageSelector from '@/components/common/LanguageSelector';
import EntitySelector from '@/domain/hr/components/EntitySelector';
import { NotificationBell } from '@/global/components/NotificationBell';
import { useEntityStore } from '@/domain/hr/store/entity.store';

interface Props {
  onMenuClick: () => void;
}

export default function HanmamHeader({ onMenuClick }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['hanmam', 'common']);
  const currentEntity = useEntityStore((s) => s.currentEntity);

  // Detect active tab by checking which tab's sub-menus include current path
  const activeTab = (() => {
    for (const tab of HANMAM_TABS) {
      const menus = HANMAM_SUB_MENUS[tab.id] || [];
      if (menus.some((m) => location.pathname === m.path || location.pathname.startsWith(m.path + '/'))) {
        return tab.id;
      }
    }
    return HANMAM_TABS[0]?.id;
  })();

  return (
    <header className="flex h-14 shrink-0 flex-col border-b border-gray-200 bg-white md:h-auto">
      <div className="flex h-14 items-center justify-between px-3 md:h-14 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={onMenuClick} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex cursor-pointer items-center gap-2" onClick={() => navigate('/hm/main')}>
            <svg viewBox="0 0 300 300" className="h-7 w-7 md:h-8 md:w-8">
              <polygon points="150,30 254,90 254,210 150,270 46,210 46,90"
                fill="white" stroke="#666666" strokeWidth="25" strokeLinejoin="round" />
              <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle"
                fontFamily="Arial, sans-serif" fontSize="150" fontWeight="900"
                fill="#666666">ạ</text>
            </svg>
            <span className="text-sm font-semibold text-gray-800 md:text-base">
              {currentEntity?.name || '한마음'}
            </span>
          </div>
        </div>

        {/* GNB Tabs - desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {HANMAM_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <EntitySelector />
          <NotificationBell />
          <LanguageSelector />
        </div>
      </div>

      {/* GNB Tabs - mobile (horizontal scroll) */}
      <div className="flex overflow-x-auto border-t border-gray-100 px-2 md:hidden">
        {HANMAM_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`shrink-0 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
    </header>
  );
}
