import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { apiClient } from '@/lib/api-client';

const PATH_TO_MENU_CODE: Record<string, string> = {
  '/todos': 'TODO',
  '/agents': 'AGENTS',
  '/meeting-notes': 'MEETING_NOTES',
  '/amoeba-talk': 'AMOEBA_TALK',
  '/attendance': 'ATTENDANCE',
  '/notices': 'NOTICES',
  '/drive': 'DRIVE',
  '/accounting': 'ACCOUNTING',
  '/hr': 'HR',
  '/billing': 'BILLING',
  '/mail': 'MAIL',
  '/project': 'PROJECT_MANAGEMENT',
  '/kms': 'KMS',
  '/issues': 'ISSUES',
  '/calendar': 'CALENDAR',
  '/assets': 'ASSET_MANAGEMENT',
  '/entity-settings': 'ENTITY_SETTINGS',
  '/admin': 'SETTINGS',
  '/admin/service': 'SERVICE_MANAGEMENT',
  '/admin/site': 'SITE_MANAGEMENT',
};

function resolveMenuCode(pathname: string): string | undefined {
  for (const [prefix, code] of Object.entries(PATH_TO_MENU_CODE)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return code;
    }
  }
  return undefined;
}

export function usePageTracking() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const menuCode = resolveMenuCode(location.pathname);
      apiClient
        .post('/entity-settings/work-statistics/page-view', {
          path: location.pathname,
          menu_code: menuCode,
        })
        .catch(() => {});
    }, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [location.pathname, user]);
}
