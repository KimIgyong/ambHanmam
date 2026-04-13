import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { cmsApi, type CmsMenu } from '@/lib/cms-api';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { CmsHeader } from '@/components/layout/CmsHeader';
import { CmsFooter } from '@/components/layout/CmsFooter';
import { CookieConsentBanner } from '@/components/cookie/CookieConsentBanner';
import { CookieSettingsModal } from '@/components/cookie/CookieSettingsModal';

let cachedMenus: CmsMenu[] | null = null;

export function PublicLayout() {
  const { data: siteConfig } = useSiteConfig();
  const [cmsMenus, setCmsMenus] = useState<CmsMenu[]>(cachedMenus || []);
  const cookie = useCookieConsent();

  useEffect(() => {
    if (cachedMenus) return;
    cmsApi.getMenus().then((menus) => {
      cachedMenus = menus;
      setCmsMenus(menus);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <CmsHeader config={siteConfig?.header} menus={cmsMenus} />

      <main className="flex-1">
        <Outlet />
      </main>

      <CmsFooter config={siteConfig?.footer} onOpenCookieSettings={cookie.openSettings} />

      {cookie.showBanner && (
        <CookieConsentBanner
          onAcceptAll={cookie.acceptAll}
          onRejectAll={cookie.rejectAll}
          onManage={cookie.openSettings}
        />
      )}

      {cookie.showSettings && (
        <CookieSettingsModal
          preferences={cookie.preferences}
          onSave={cookie.savePreferences}
          onClose={cookie.closeSettings}
        />
      )}
    </div>
  );
}
