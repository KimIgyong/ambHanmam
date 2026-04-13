import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en/common.json';
import ko from '@/locales/ko/common.json';
import vi from '@/locales/vi/common.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    ko: { common: ko },
    vi: { common: vi },
  },
  lng: navigator.language.startsWith('ko') ? 'ko' : navigator.language.startsWith('vi') ? 'vi' : 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
