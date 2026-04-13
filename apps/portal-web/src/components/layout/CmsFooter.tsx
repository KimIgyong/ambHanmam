import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, Check, AlertCircle } from 'lucide-react';
import type { FooterConfig, I18nText, FooterColumn, FooterSocial, FooterBottomBarLink } from '@/types/site-config';
import { cmsApi } from '@/lib/cms-api';
import {
  trackNewsletterSubscribeAttempt,
  trackNewsletterSubscribeSuccess,
  trackNewsletterSubscribeDuplicate,
} from '@/lib/ga-events';

/* ═══ Helpers ═══ */
function i18nText(obj: I18nText | string | undefined, lang: string): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  const key = lang.startsWith('ko') ? 'ko' : lang.startsWith('vi') ? 'vi' : 'en';
  return obj[key] || obj.en || '';
}

function AmoebaLogo({ size = 24 }: { size?: number }) {
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

/* Social icon SVGs */
function SocialIcon({ type, size = 20 }: { type: string; size?: number }) {
  const cls = 'text-gray-400 hover:text-orange-500 transition-colors';

  switch (type) {
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={cls} fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={cls} fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    default:
      return (
        <span className={`inline-block w-5 h-5 rounded bg-gray-200 ${cls}`} />
      );
  }
}

/* ═══ Subscribe form translations ═══ */
const SUB_T: Record<string, Record<string, string>> = {
  ko: {
    title: '제품 소식을 받아보세요',
    placeholder: '이메일 주소 입력',
    button: '구독하기',
    success: '구독해주셔서 감사합니다!',
    duplicate: '이미 구독 중인 이메일입니다',
    error: '잠시 후 다시 시도해주세요',
    privacy: '구독 시 개인정보 처리방침에 동의합니다',
  },
  en: {
    title: 'Stay updated with our news',
    placeholder: 'Enter your email address',
    button: 'Subscribe',
    success: 'Thank you for subscribing!',
    duplicate: 'This email is already subscribed',
    error: 'Please try again later',
    privacy: 'By subscribing, you agree to our Privacy Policy',
  },
  vi: {
    title: 'Nhận tin tức sản phẩm',
    placeholder: 'Nhập địa chỉ email',
    button: 'Đăng ký',
    success: 'Cảm ơn bạn đã đăng ký!',
    duplicate: 'Email này đã được đăng ký',
    error: 'Vui lòng thử lại sau',
    privacy: 'Đăng ký đồng nghĩa với việc bạn đồng ý với Chính sách Bảo mật',
  },
};

/* ═══ Props ═══ */
interface CmsFooterProps {
  config?: FooterConfig;
  onOpenCookieSettings?: () => void;
}

/* ═══ Component ═══ */
export function CmsFooter({ config, onOpenCookieSettings }: CmsFooterProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const langKey = lang.startsWith('ko') ? 'ko' : lang.startsWith('vi') ? 'vi' : 'en';

  const logoText = config?.logo?.text || 'amoeba';
  const logoHeight = config?.logo?.height || 24;
  const description = i18nText(config?.description, lang) || t('footer.desc');
  const columns: FooterColumn[] = config?.columns || [];
  const socialLinks: FooterSocial[] = config?.social || [];
  const copyright = i18nText(config?.bottomBar?.copyright, lang);
  const bottomLinks: FooterBottomBarLink[] = config?.bottomBar?.links || [];

  const st = (key: string) => SUB_T[langKey]?.[key] ?? SUB_T.en[key] ?? key;

  /* ── Subscribe state ── */
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subEmail)) return;
    setSubStatus('loading');
    trackNewsletterSubscribeAttempt();
    try {
      await cmsApi.subscribe('home', subEmail);
      trackNewsletterSubscribeSuccess(subEmail);
      setSubStatus('success');
      setSubEmail('');
      setTimeout(() => setSubStatus('idle'), 5000);
    } catch (err: any) {
      const code = err?.response?.status;
      if (code === 409) {
        trackNewsletterSubscribeDuplicate();
        setSubStatus('duplicate');
      } else {
        setSubStatus('error');
      }
      setTimeout(() => setSubStatus('idle'), 5000);
    }
  };

  return (
    <footer className="relative bg-gray-900 text-gray-300 overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* 3-column grid: Branding | Subscribe | Links */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-10 md:gap-8 items-start mb-12">

          {/* ── Col 1: Branding ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AmoebaLogo size={logoHeight} />
              <span className="text-lg font-bold text-white">{logoText}</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">{description}</p>

            {socialLinks.length > 0 && (
              <div className="flex gap-3 pt-2">
                {socialLinks.map((s) => (
                  <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform}>
                    <SocialIcon type={s.platform} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Col 2: Subscribe form ── */}
          <div className="w-full max-w-[480px] mx-auto rounded-xl p-6"
            style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-white/80 mb-3">
              <Mail size={15} />
              {st('title')}
            </p>
            {subStatus === 'success' ? (
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-green-400">
                <Check size={16} />
                {st('success')}
              </p>
            ) : subStatus === 'duplicate' ? (
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-400">
                <AlertCircle size={16} />
                {st('duplicate')}
              </p>
            ) : subStatus === 'error' ? (
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-red-400">
                <AlertCircle size={16} />
                {st('error')}
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                <input
                  type="email"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  placeholder={st('placeholder')}
                  required
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-400/50 bg-white/[.08] text-white border border-white/[.12]"
                  disabled={subStatus === 'loading'}
                />
                <button
                  type="submit"
                  disabled={subStatus === 'loading'}
                  className="shrink-0 px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-blue-600 transition-all hover:-translate-y-[1px] disabled:opacity-60"
                >
                  {subStatus === 'loading' ? '...' : st('button')}
                </button>
              </form>
            )}
            <p className="mt-2 text-center text-[.7rem] text-gray-500">{st('privacy')}</p>
            <p className="mt-3 text-center text-xs text-gray-500">
              📧 contact@amoeba.group &nbsp;·&nbsp; 🌐 https://a.amoeba.site
            </p>
          </div>

          {/* ── Col 3: Link columns ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12">
            {columns.map((col) => {
              const title = i18nText(col.title, lang) || col.title?.en || '';
              return (
                <div key={title}>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">{title}</h4>
                  <ul className="space-y-2.5">
                    {col.links.map((link) => {
                      const label = i18nText(link.label, lang);
                      const href = link.url || '#';
                      const isExternal = href.startsWith('http');
                      return (
                        <li key={label}>
                          {isExternal ? (
                            <a href={href} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                              {label}
                            </a>
                          ) : (
                            <Link to={href}
                              className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                              {label}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-gray-500">
            {copyright || `© ${new Date().getFullYear()} Amoeba Global Inc. All rights reserved.`}
          </p>
          {bottomLinks.length > 0 && (
            <div className="flex gap-4">
              {bottomLinks.map((link) => {
                const label = i18nText(link.label, lang);
                const href = link.url || '#';
                return (
                  <Link key={label} to={href} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    {label}
                  </Link>
                );
              })}
              {onOpenCookieSettings && (
                <button
                  onClick={onOpenCookieSettings}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {t('cookie.footer_link')}
                </button>
              )}
            </div>
          )}
          {!bottomLinks.length && onOpenCookieSettings && (
            <div className="flex gap-4">
              <button
                onClick={onOpenCookieSettings}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {t('cookie.footer_link')}
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
