import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import type { HeaderConfig, I18nText } from '@/types/site-config';
import type { CmsMenu } from '@/lib/cms-api';

/* ═══ Constants ═══ */
const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
] as const;

const LANDING_ANCHORS = ['why', 'features', 'cycle', 'contact'] as const;

/* ═══ Helpers ═══ */
function AmoebaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size}>
      <polygon points="150,30 254,90 254,210 150,270 46,210 46,90"
        fill="white" stroke="#666666" strokeWidth="25" strokeLinejoin="round" />
      <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial, sans-serif" fontSize="150" fontWeight="900"
        fill="#666666">ạ</text>
    </svg>
  );
}

function i18nText(obj: I18nText | undefined, lang: string): string {
  if (!obj) return '';
  const key = lang.startsWith('ko') ? 'ko' : lang.startsWith('vi') ? 'vi' : 'en';
  return obj[key] || obj.en || '';
}

function menuLabel(menu: CmsMenu, lang: string): string {
  return lang.startsWith('ko') && menu.nameKo ? menu.nameKo : menu.nameEn;
}

function menuLink(menu: CmsMenu): string {
  if (menu.type === 'EXTERNAL' && menu.externalUrl) return menu.externalUrl;
  if (menu.slug === 'home') return '/';
  return `/page/${menu.slug}`;
}

/* ═══ Props ═══ */
interface CmsHeaderProps {
  config?: HeaderConfig;
  menus?: CmsMenu[];
}

/* ═══ Component ═══ */
export function CmsHeader({ config, menus = [] }: CmsHeaderProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const isLanding = location.pathname === '/';
  const logoText = config?.logo?.text || 'amoeba';
  const logoHeight = config?.logo?.height || 28;
  const landingOverride = config?.landingOverride;
  const transparentEnabled = isLanding && landingOverride?.enabled && landingOverride?.transparentOnTop;
  const threshold = landingOverride?.scrollThreshold || 40;

  // Published CMS menus (exclude home, only PUBLISHED pages)
  const navMenus = menus.filter(
    (m) => m.slug !== 'home' && m.page?.status === 'PUBLISHED',
  );

  // Scroll detection
  useEffect(() => {
    if (!transparentEnabled) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparentEnabled, threshold]);

  // Close language dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // Style based on scroll state
  const headerBg = transparentEnabled && !scrolled
    ? 'bg-transparent'
    : 'bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm';
  const textColor = transparentEnabled && !scrolled ? 'text-white/90' : 'text-gray-600';
  const logoColor = transparentEnabled && !scrolled ? 'text-white' : 'text-primary-600';

  // CTA action from config
  const ctaAction = config?.actions?.find((a) => a.type === 'CTA_BUTTON');

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          {isLanding ? (
            <button onClick={() => scrollTo('hero')} className={`flex items-center gap-2 text-xl font-bold ${logoColor}`}>
              <AmoebaLogo size={logoHeight} /> {logoText}
            </button>
          ) : (
            <Link to={config?.logo?.linkUrl || '/'} className={`flex items-center gap-2 text-xl font-bold ${logoColor}`}>
              <AmoebaLogo size={logoHeight} /> {logoText}
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            {isLanding ? (
              LANDING_ANCHORS.map((id) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`text-sm font-medium ${textColor} hover:text-orange-600 transition-colors`}
                >
                  {t(`footer.nav.${id}`)}
                </button>
              ))
            ) : (
              navMenus.map((menu) =>
                menu.type === 'EXTERNAL' && menu.externalUrl ? (
                  <a key={menu.id} href={menu.externalUrl} target="_blank" rel="noopener noreferrer"
                    className={`text-sm font-medium ${textColor} hover:text-gray-900 transition-colors`}>
                    {menuLabel(menu, i18n.language)}
                  </a>
                ) : (
                  <Link key={menu.id} to={menuLink(menu)}
                    className={`text-sm font-medium ${textColor} hover:text-gray-900 transition-colors`}>
                    {menuLabel(menu, i18n.language)}
                  </Link>
                ),
              )
            )}

            {/* Language selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${textColor} hover:bg-neutral-100/50 transition`}
              >
                <Globe className="h-4 w-4 opacity-60" />
                <span>{i18n.language.toUpperCase()}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition ${
                        i18n.language === lang.code
                          ? 'bg-orange-50 text-orange-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>{lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth / CTA */}
            {isAuthenticated ? (
              <Link to="/portal" className="btn-primary px-4 py-2 text-sm">
                {t('nav.portal')}
              </Link>
            ) : isLanding && ctaAction ? (
              <Link
                to={ctaAction.url || '/register'}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:-translate-y-0.5 transition-all"
              >
                {i18nText(ctaAction.label, i18n.language)} →
              </Link>
            ) : (
              <>
                <Link to="/login" className={`text-sm font-medium ${textColor} hover:text-gray-900 transition-colors`}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`sm:hidden rounded-md p-2 ${textColor} hover:bg-gray-100/50`}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white/98 backdrop-blur-xl border-t border-gray-100 px-4 py-3 space-y-2">
            {isLanding ? (
              LANDING_ANCHORS.map((id) => (
                <button key={id} onClick={() => scrollTo(id)}
                  className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {t(`footer.nav.${id}`)}
                </button>
              ))
            ) : (
              navMenus.map((menu) =>
                menu.type === 'EXTERNAL' && menu.externalUrl ? (
                  <a key={menu.id} href={menu.externalUrl} target="_blank" rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {menuLabel(menu, i18n.language)}
                  </a>
                ) : (
                  <Link key={menu.id} to={menuLink(menu)} onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {menuLabel(menu, i18n.language)}
                  </Link>
                ),
              )
            )}

            {/* Mobile language */}
            <div className="flex gap-2 px-3 py-2">
              {LANGUAGES.map((lang) => (
                <button key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setMobileMenuOpen(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    i18n.language === lang.code ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'
                  }`}>
                  {lang.flag} {lang.code.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-2 space-y-2">
              {isAuthenticated ? (
                <Link to="/portal" onClick={() => setMobileMenuOpen(false)}
                  className="block btn-primary px-3 py-2 text-sm text-center">
                  {t('nav.portal')}
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-center font-semibold bg-orange-500 text-white rounded-full">
                    {isLanding && ctaAction ? `${i18nText(ctaAction.label, i18n.language)} →` : t('nav.signup')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header on non-landing pages */}
      {!isLanding && <div className="h-16" />}
    </>
  );
}
