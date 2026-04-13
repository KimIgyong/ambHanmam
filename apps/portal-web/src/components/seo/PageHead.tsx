import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.amoeba.site';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const BRAND = {
  ko: 'Ạ/아메바',
  en: 'Ạ',
  vi: 'Ạ',
} as const;

interface PageHeadProps {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
}

export function PageHead({
  title,
  description,
  path,
  ogImage,
  jsonLd,
  noindex = false,
}: PageHeadProps) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const lang = (i18n.language?.slice(0, 2) || 'en') as keyof typeof BRAND;

  const brand = BRAND[lang] || BRAND.en;
  const fullTitle = title ? `${title} — ${brand}` : `${brand} — reBorn to be AI | AI Management Assistant`;
  const canonicalPath = path ?? location.pathname;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const ogImageUrl = ogImage || DEFAULT_OG_IMAGE;

  const defaultDescription =
    lang === 'ko'
      ? 'Ạ/아메바는 오늘의미션·스마트할일·이슈트래킹·프로젝트관리·AI리포트·아메바톡·HR·회계·KMS·AI앱스토어를 통합한 글로벌 엔터프라이즈 AI 업무 플랫폼입니다.'
      : 'Ạ is a global enterprise AI work platform integrating missions, tasks, issues, projects, AI reports, real-time translation chat, HR, accounting, KMS, and an AI app store.';

  const desc = description || defaultDescription;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang */}
      <link rel="alternate" hrefLang="ko" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="vi" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />

      {/* Twitter Card */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
