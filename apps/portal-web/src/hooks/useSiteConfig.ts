import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/cms-api';
import type { SiteConfig } from '@/types/site-config';

const DEFAULT_SITE_CONFIG: SiteConfig = {
  header: {
    logo: { text: 'amoeba', height: 28, linkUrl: '/' },
    style: { position: 'fixed', height: 64, borderBottom: true },
    navigation: { source: 'CMS_MENUS', maxDepth: 2 },
    actions: [
      { type: 'LANGUAGE_SWITCHER' },
      { type: 'CTA_BUTTON', label: { en: 'Start Free', ko: '무료 시작', vi: 'Dùng thử miễn phí' }, url: '/register', variant: 'primary' },
    ],
    landingOverride: { enabled: true, transparentOnTop: true, solidOnScroll: true, scrollThreshold: 40 },
  },
  footer: {
    layout: 'COLUMNS',
    logo: { text: 'amoeba', height: 28 },
    description: {
      en: 'Developing the simplest solutions for business expansion and online customer acquisition.',
      ko: '비즈니스 확장과 온라인 고객 창출을 위한 가장 간단하고 저렴한 솔루션을 개발합니다.',
      vi: 'Phát triển giải pháp đơn giản nhất cho mở rộng kinh doanh và thu hút khách hàng.',
    },
  },
};

export function useSiteConfig() {
  return useQuery<SiteConfig>({
    queryKey: ['cms', 'site-config'],
    queryFn: () => cmsApi.getSiteConfig(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: DEFAULT_SITE_CONFIG,
  });
}
