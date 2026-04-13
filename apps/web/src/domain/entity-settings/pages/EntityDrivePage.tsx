import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HardDrive,
  Save,
  Loader2,
  Check,
  Info,
  Plug,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import {
  useEntityDriveSettings,
  useUpdateDriveSettings,
  useTestDriveConnection,
} from '../hooks/useEntitySettings';
import type { UpdateDriveDto } from '../service/entity-settings.service';

export default function EntityDrivePage() {
  const { t } = useTranslation(['entitySettings', 'common']);

  const { data: settings, isLoading } = useEntityDriveSettings();
  const updateMutation = useUpdateDriveSettings();
  const testMutation = useTestDriveConnection();

  const [form, setForm] = useState<UpdateDriveDto>({
    impersonate_email: '',
    billing_root_folder_id: '',
    billing_root_folder_name: '',
  });
  const [dirty, setDirty] = useState(false);

  const source = settings?.source ?? 'none';
  const isInherited = source === 'inherited' || source === 'global';

  useEffect(() => {
    if (settings) {
      setForm({
        impersonate_email: settings.impersonateEmail || '',
        billing_root_folder_id: settings.billingRootFolderId || '',
        billing_root_folder_name: settings.billingRootFolderName || '',
      });
      setDirty(false);
    }
  }, [settings]);

  const handleChange = (field: keyof UpdateDriveDto, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync(form);
    setDirty(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <HardDrive className="h-6 w-6 text-violet-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('entitySettings:drive.title')}
            </h1>
            <p className="text-sm text-gray-500">{t('entitySettings:drive.description')}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mx-auto max-w-xl space-y-4">
          {/* Source Banner */}
          {source === 'none' && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="text-sm text-amber-800">
                {t('entitySettings:drive.notConfigured')}
              </div>
            </div>
          )}

          {isInherited && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  {source === 'inherited'
                    ? t('entitySettings:drive.inheritedFrom', {
                        entity: settings?.sourceEntityCode || 'HQ',
                      })
                    : t('entitySettings:drive.usingGlobal')}
                </p>
                <p className="mt-1 text-xs text-blue-600">
                  {t('entitySettings:drive.inheritedHint')}
                </p>
              </div>
            </div>
          )}

          {source === 'own' && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div className="text-sm text-green-800">
                {t('entitySettings:drive.ownSettings')}
              </div>
            </div>
          )}

          {/* Setup Guide Card */}
          <a
            href="https://www.amoeba.site/service/ama/ama-google-drive-guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-lg border border-violet-200 bg-violet-50 p-4 transition-colors hover:bg-violet-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-900">
                {t('entitySettings:drive.guideTitle', { defaultValue: 'Google Drive Setup Guide' })}
              </p>
              <p className="mt-0.5 text-xs text-violet-600 truncate">
                {t('entitySettings:drive.guideDesc', { defaultValue: 'Step-by-step guide for connecting Google Drive to AMA' })}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-violet-400" />
          </a>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:drive.impersonateEmail')}
                </label>
                <input
                  type="email"
                  value={form.impersonate_email || ''}
                  onChange={(e) => handleChange('impersonate_email', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="service-account@company.com"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {t('entitySettings:drive.impersonateDesc')}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:drive.billingFolderId')}
                </label>
                <input
                  type="text"
                  value={form.billing_root_folder_id || ''}
                  onChange={(e) => handleChange('billing_root_folder_id', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2bgms"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:drive.billingFolderName')}
                </label>
                <input
                  type="text"
                  value={form.billing_root_folder_name || ''}
                  onChange={(e) => handleChange('billing_root_folder_name', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Billing Documents"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Test Connection */}
                <button
                  type="button"
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {testMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plug className="h-4 w-4" />
                  )}
                  {t('entitySettings:drive.testConnection')}
                </button>
              </div>

              <div className="flex items-center gap-3">
                {updateMutation.isSuccess && !dirty && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    {t('entitySettings:drive.saved')}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={!dirty || updateMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {t('common:save')}
                </button>
              </div>
            </div>
          </form>

          {/* Test Connection Result */}
          {(testMutation.isSuccess || testMutation.isError) && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                testMutation.data?.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              {testMutation.data?.success ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              )}
              <div className="text-sm">
                <p
                  className={
                    testMutation.data?.success ? 'text-green-800' : 'text-red-800'
                  }
                >
                  {testMutation.data?.message || t('entitySettings:drive.testFailed')}
                </p>
                {testMutation.data?.folderName && (
                  <p className="mt-1 text-xs text-green-600">
                    Folder: {testMutation.data.folderName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
