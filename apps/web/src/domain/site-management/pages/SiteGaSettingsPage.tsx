import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { useGaSettings, useUpdateGaSettings } from '../hooks/useAnalytics';

export default function SiteGaSettingsPage() {
  const { t } = useTranslation(['site']);
  const { data: settings, isLoading } = useGaSettings();
  const updateMutation = useUpdateGaSettings();

  const [portalId, setPortalId] = useState('');
  const [appId, setAppId] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setPortalId(settings.portalGaMeasurementId || '');
      setAppId(settings.appGaMeasurementId || '');
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        portal_ga_measurement_id: portalId.trim() || undefined,
        app_ga_measurement_id: appId.trim() || undefined,
      },
      { onSuccess: () => setDirty(false) },
    );
  };

  const isValidGaId = (id: string) => /^G-[A-Z0-9]+$/.test(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-100">
              <Settings className="h-5 w-5 text-lime-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('site:gaSettings.title')}</h1>
              <p className="text-sm text-gray-500">{t('site:gaSettings.description')}</p>
            </div>
          </div>
        </div>

        {/* Portal Site GA */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{t('site:gaSettings.portalSite')}</h2>
              <p className="mt-0.5 text-xs text-gray-400">www.amoeba.site</p>
            </div>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              Google Analytics <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            GA Measurement ID
          </label>
          <div className="mb-2 flex items-center gap-3">
            <input
              type="text"
              value={portalId}
              onChange={(e) => { setPortalId(e.target.value); setDirty(true); }}
              placeholder="G-XXXXXXXXXX"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
            {portalId && (
              isValidGaId(portalId) ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-400" />
              )
            )}
          </div>
          <p className="text-xs text-gray-400">{t('site:gaSettings.measurementIdHint')}</p>

          {portalId && isValidGaId(portalId) && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">{t('site:gaSettings.statusConnected')}</span>
            </div>
          )}
          {portalId && !isValidGaId(portalId) && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-red-600">{t('site:gaSettings.invalidFormat')}</span>
            </div>
          )}
        </div>

        {/* App Site GA */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{t('site:gaSettings.appSite')}</h2>
              <p className="mt-0.5 text-xs text-gray-400">ama.amoeba.site</p>
            </div>
            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              Google Analytics <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            GA Measurement ID
          </label>
          <div className="mb-2 flex items-center gap-3">
            <input
              type="text"
              value={appId}
              onChange={(e) => { setAppId(e.target.value); setDirty(true); }}
              placeholder="G-XXXXXXXXXX"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
            {appId && (
              isValidGaId(appId) ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-400" />
              )
            )}
          </div>
          <p className="text-xs text-gray-400">{t('site:gaSettings.measurementIdHint')}</p>

          {appId && isValidGaId(appId) && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">{t('site:gaSettings.statusConnected')}</span>
            </div>
          )}
          {appId && !isValidGaId(appId) && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-red-600">{t('site:gaSettings.invalidFormat')}</span>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setPortalId(settings?.portalGaMeasurementId || ''); setAppId(settings?.appGaMeasurementId || ''); setDirty(false); }}
            disabled={!dirty}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('site:gaSettings.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || updateMutation.isPending || (!!portalId && !isValidGaId(portalId)) || (!!appId && !isValidGaId(appId))}
            className="rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? t('site:gaSettings.saving') : t('site:gaSettings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
