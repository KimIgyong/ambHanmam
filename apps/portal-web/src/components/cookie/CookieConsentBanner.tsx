import { useTranslation } from 'react-i18next';
import { Cookie, Settings } from 'lucide-react';

interface CookieConsentBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManage: () => void;
}

export function CookieConsentBanner({ onAcceptAll, onRejectAll, onManage }: CookieConsentBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 shrink-0 text-orange-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t('cookie.banner_title')}</h3>
              <p className="mt-1 text-sm text-gray-600">{t('cookie.banner_desc')}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={onManage}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              {t('cookie.manage')}
            </button>
            <button
              onClick={onRejectAll}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('cookie.reject_all')}
            </button>
            <button
              onClick={onAcceptAll}
              className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              {t('cookie.accept_all')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
