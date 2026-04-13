import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, BarChart3, Megaphone } from 'lucide-react';
import type { CookiePreferences } from '@/hooks/useCookieConsent';

interface CookieSettingsModalProps {
  preferences: CookiePreferences;
  onSave: (prefs: CookiePreferences) => void;
  onClose: () => void;
}

export function CookieSettingsModal({ preferences, onSave, onClose }: CookieSettingsModalProps) {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(preferences.analytics);
  const [marketing, setMarketing] = useState(preferences.marketing);

  const handleSave = () => {
    onSave({ essential: true, analytics, marketing });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">{t('cookie.settings_title')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">{t('cookie.settings_desc')}</p>

          {/* Essential */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">{t('cookie.essential')}</h4>
                <p className="mt-0.5 text-xs text-gray-500">{t('cookie.essential_desc')}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {t('cookie.always_on')}
            </span>
          </div>

          {/* Analytics */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">{t('cookie.analytics')}</h4>
                <p className="mt-0.5 text-xs text-gray-500">{t('cookie.analytics_desc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analytics}
              onClick={() => setAnalytics(!analytics)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                analytics ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  analytics ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Marketing */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <Megaphone className="h-5 w-5 shrink-0 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">{t('cookie.marketing')}</h4>
                <p className="mt-0.5 text-xs text-gray-500">{t('cookie.marketing_desc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={marketing}
              onClick={() => setMarketing(!marketing)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                marketing ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  marketing ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 p-5">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('cookie.reject_all')}
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            {t('cookie.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
