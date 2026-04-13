/* ═══ CMS Site Config Types ═══ */

export interface I18nText {
  en?: string;
  ko?: string;
  vi?: string;
  [key: string]: string | undefined;
}

/* ── Header ── */
export interface HeaderLogo {
  text?: string;
  imageUrl?: string;
  altText?: string;
  linkUrl?: string;
  height?: number;
}

export interface HeaderStyle {
  position?: 'fixed' | 'sticky' | 'static';
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  borderBottom?: boolean;
}

export interface HeaderNavigation {
  source?: 'CMS_MENUS' | 'CUSTOM';
  maxDepth?: number;
  showIcons?: boolean;
}

export interface HeaderAction {
  type: 'LANGUAGE_SWITCHER' | 'CTA_BUTTON' | 'LOGIN_BUTTON' | 'SIGNUP_BUTTON';
  label?: I18nText;
  url?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export interface LandingOverride {
  enabled?: boolean;
  transparentOnTop?: boolean;
  solidOnScroll?: boolean;
  scrollThreshold?: number;
  transparentTextColor?: string;
}

export interface HeaderConfig {
  logo?: HeaderLogo;
  style?: HeaderStyle;
  navigation?: HeaderNavigation;
  actions?: HeaderAction[];
  landingOverride?: LandingOverride;
}

/* ── Footer ── */
export interface FooterLogo {
  text?: string;
  imageUrl?: string;
  height?: number;
}

export interface FooterColumnLink {
  label: I18nText;
  url: string;
}

export interface FooterColumn {
  title: I18nText;
  links: FooterColumnLink[];
}

export interface FooterSocial {
  platform: string;
  url: string;
}

export interface FooterBottomBarLink {
  label: I18nText;
  url: string;
}

export interface FooterBottomBar {
  copyright?: I18nText;
  links?: FooterBottomBarLink[];
  showLanguageSwitcher?: boolean;
}

export interface FooterConfig {
  layout?: 'COLUMNS' | 'SIMPLE' | 'MINIMAL';
  logo?: FooterLogo;
  description?: I18nText;
  columns?: FooterColumn[];
  social?: FooterSocial[];
  bottomBar?: FooterBottomBar;
}

/* ── Site Meta ── */
export interface SiteMetaConfig {
  siteName?: string;
  defaultLang?: string;
  favicon?: string;
  ogImage?: string;
  analyticsId?: string;
}

/* ── Combined ── */
export interface SiteConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  site_meta?: SiteMetaConfig;
}
