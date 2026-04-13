import { createContext, useContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench, X } from 'lucide-react';
import { useMenuTipForPage } from '@/domain/entity-settings/hooks/useSiteConfig';

interface RouteMenuItem {
  path: string;
  labelKey: string;
  menuCode?: string;
  icon?: string;
}

interface MenuGuideContextValue {
  menuCode: string | undefined;
  icon: string | undefined;
  tipTitle: string | null;
  openTip: () => void;
}

const MenuGuideContext = createContext<MenuGuideContextValue>({
  menuCode: undefined,
  icon: undefined,
  tipTitle: null,
  openTip: () => {},
});

export function useMenuGuide() {
  return useContext(MenuGuideContext);
}

function sanitizeHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

interface MenuGuideProviderProps {
  menus: RouteMenuItem[];
  children: React.ReactNode;
}

export function MenuGuideProvider({ menus, children }: MenuGuideProviderProps) {
  const { t } = useTranslation(['common']);
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const matched = useMemo(() => {
    const pathname = location.pathname;
    const candidates = menus.filter(
      (m) => m.path && (pathname === m.path || pathname.startsWith(`${m.path}/`)),
    );
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.path.length - a.path.length);
    return candidates[0];
  }, [location.pathname, menus]);

  const { data: tip } = useMenuTipForPage(matched?.menuCode);
  const tipContent = tip?.content || null;
  const tipTitle =
    tip?.title ||
    (matched ? t(matched.labelKey, { defaultValue: matched.menuCode || matched.path }) : null);

  const value: MenuGuideContextValue = {
    menuCode: matched?.menuCode,
    icon: matched?.icon,
    tipTitle,
    openTip: () => setOpen(true),
  };

  return (
    <MenuGuideContext.Provider value={value}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{tipTitle}</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                title={t('common:close', { defaultValue: 'Close' })}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100%-52px)] overflow-y-auto px-4 py-4">
              {tipContent ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(tipContent) }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
                  <Wrench className="h-10 w-10" />
                  <p className="text-sm font-medium">
                    {t('common:tipNotReady', { defaultValue: '준비중입니다.' })}
                  </p>
                  <p className="text-xs text-gray-300">
                    {t('common:tipNotReadySub', {
                      defaultValue: '빠른 시일 내 업데이트 예정입니다.',
                    })}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </MenuGuideContext.Provider>
  );
}
