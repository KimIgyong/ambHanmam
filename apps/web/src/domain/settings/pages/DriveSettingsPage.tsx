import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HardDrive,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  User,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useDriveSettings,
  useUpdateDriveSettings,
  useTestDriveConnection,
  useListSharedDrives,
  useListDriveFolders,
  type SharedDriveItem,
} from '../hooks/useDriveSettings';

export default function DriveSettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { data: settings, isLoading } = useDriveSettings();
  const updateMutation = useUpdateDriveSettings();
  const testMutation = useTestDriveConnection();
  const listDrivesMutation = useListSharedDrives();

  const [form, setForm] = useState({
    impersonateEmail: '',
    billingRootFolderId: '',
    billingRootFolderName: '',
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showGuide, setShowGuide] = useState(false);

  // Shared drive browsing state
  const [sharedDrives, setSharedDrives] = useState<SharedDriveItem[]>([]);
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
  const [browsingFolderId, setBrowsingFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);

  const { data: subFolders, isLoading: foldersLoading } = useListDriveFolders(
    browsingFolderId || '',
    !!browsingFolderId,
  );

  useEffect(() => {
    if (settings) {
      setForm({
        impersonateEmail: settings.impersonateEmail || '',
        billingRootFolderId: settings.billingRootFolderId || '',
        billingRootFolderName: settings.billingRootFolderName || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setStatusMessage(null);
    try {
      await updateMutation.mutateAsync({
        impersonate_email: form.impersonateEmail,
        billing_root_folder_id: form.billingRootFolderId,
        billing_root_folder_name: form.billingRootFolderName,
      });
      setStatusMessage({ type: 'success', text: t('settings:drive.saveSuccess') });
    } catch {
      setStatusMessage({ type: 'error', text: t('settings:drive.saveFailed') });
    }
  };

  const handleTest = async () => {
    setStatusMessage(null);
    try {
      const result = await testMutation.mutateAsync();
      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
        if (result.folderName && !form.billingRootFolderName) {
          setForm((prev) => ({ ...prev, billingRootFolderName: result.folderName! }));
        }
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch {
      setStatusMessage({ type: 'error', text: t('settings:drive.testFailed') });
    }
  };

  const handleBrowseDrives = async () => {
    setStatusMessage(null);

    // Save impersonate email first if changed
    if (form.impersonateEmail && form.impersonateEmail !== settings?.impersonateEmail) {
      try {
        await updateMutation.mutateAsync({
          impersonate_email: form.impersonateEmail,
        });
      } catch {
        setStatusMessage({ type: 'error', text: t('settings:drive.saveFailed') });
        return;
      }
    }

    try {
      const drives = await listDrivesMutation.mutateAsync();
      // Prepend "My Drive" virtual entry
      const allDrives: SharedDriveItem[] = [
        { id: 'root', name: t('settings:drive.myDrive') },
        ...drives,
      ];
      setSharedDrives(allDrives);
      setShowDriveBrowser(true);
      setSelectedDriveId(null);
      setBrowsingFolderId(null);
      setFolderPath([]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('settings:drive.browseFailed');
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleSelectDrive = (drive: SharedDriveItem) => {
    setSelectedDriveId(drive.id);
    setBrowsingFolderId(drive.id);
    setFolderPath([{ id: drive.id, name: drive.name }]);
  };

  const handleNavigateFolder = (folderId: string, folderName: string) => {
    setBrowsingFolderId(folderId);
    setFolderPath((prev) => [...prev, { id: folderId, name: folderName }]);
  };

  const handleNavigateToPathItem = (index: number) => {
    const item = folderPath[index];
    setBrowsingFolderId(item.id);
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  const handleConfirmSelection = () => {
    if (folderPath.length > 0) {
      const current = folderPath[folderPath.length - 1];
      setForm((prev) => ({
        ...prev,
        billingRootFolderId: current.id,
        billingRootFolderName: current.name,
      }));
      setShowDriveBrowser(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <HardDrive className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('settings:drive.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settings:drive.subtitle')}
            </p>
          </div>
        </div>

        {/* Connection status */}
        <div className={`mb-6 flex items-center gap-2 rounded-lg p-3 text-sm ${
          settings?.configured
            ? 'bg-green-50 text-green-700'
            : 'bg-yellow-50 text-yellow-700'
        }`}>
          {settings?.configured ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {settings?.configured
            ? t('settings:drive.statusConnected')
            : t('settings:drive.statusNotConfigured')}
        </div>

        {/* Setup Guide (shown when not configured) */}
        {!settings?.configured && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50">
            <button
              onClick={() => setShowGuide((v) => !v)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-blue-800 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              {showGuide ? t('settings:drive.setupGuide.hideGuide') : t('settings:drive.setupGuide.showGuide')}
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
            </button>
            {showGuide && (
              <div className="border-t border-blue-200 px-4 py-4 space-y-4">
                <p className="text-sm text-blue-700">
                  {t('settings:drive.setupGuide.description')}
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">{t('settings:drive.setupGuide.step1Title')}</h4>
                    <p className="mt-0.5 text-xs text-blue-700">{t('settings:drive.setupGuide.step1Desc')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">{t('settings:drive.setupGuide.step2Title')}</h4>
                    <p className="mt-0.5 text-xs text-blue-700">{t('settings:drive.setupGuide.step2Desc')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">{t('settings:drive.setupGuide.step3Title')}</h4>
                    <p className="mt-0.5 text-xs text-blue-700">{t('settings:drive.setupGuide.step3Desc')}</p>
                    <div className="mt-1 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-mono text-blue-800">
                      {t('settings:drive.setupGuide.step3Scope')}: https://www.googleapis.com/auth/drive
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">{t('settings:drive.setupGuide.step4Title')}</h4>
                    <p className="mt-0.5 text-xs text-blue-700">{t('settings:drive.setupGuide.step4Desc')}</p>
                    <div className="mt-1 rounded-md bg-gray-800 px-3 py-2 text-xs font-mono text-green-400">
                      GOOGLE_SERVICE_ACCOUNT_KEY_JSON=&#123;"type":"service_account","project_id":"...","private_key":"..."&#125;
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {statusMessage && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-lg p-3 text-sm ${
              statusMessage.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {statusMessage.text}
          </div>
        )}

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          {/* Impersonate Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:drive.impersonateEmail')}
            </label>
            <input
              type="email"
              value={form.impersonateEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, impersonateEmail: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="pm@amoeba.group"
            />
            <p className="mt-1 text-xs text-gray-400">
              {t('settings:drive.impersonateEmailHint')}
            </p>
          </div>

          {/* Shared Document Folder */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:drive.sharedFolder')}
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                {form.billingRootFolderName ? (
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                    <FolderOpen className="h-4 w-4 text-violet-500" />
                    <span className="font-medium text-gray-900">{form.billingRootFolderName}</span>
                    <span className="text-xs text-gray-400 font-mono ml-auto">
                      {form.billingRootFolderId?.slice(0, 12)}...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-400">
                    <FolderOpen className="h-4 w-4" />
                    {t('settings:drive.noFolderSelected')}
                  </div>
                )}
              </div>
              <button
                onClick={handleBrowseDrives}
                disabled={!form.impersonateEmail || !settings?.configured || listDrivesMutation.isPending}
                className="flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {listDrivesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
                {t('settings:drive.browseButton')}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {t('settings:drive.sharedFolderHint')}
            </p>
          </div>
        </div>

        {/* Shared Drive Browser */}
        {showDriveBrowser && (
          <div className="mt-4 rounded-xl border border-violet-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('settings:drive.selectDrive')}
              </h3>
              <button
                onClick={() => setShowDriveBrowser(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {t('common:close')}
              </button>
            </div>

            {/* Breadcrumb */}
            {folderPath.length > 0 && (
              <div className="mb-3 flex items-center gap-1 text-xs text-gray-500 overflow-x-auto">
                <button
                  onClick={() => {
                    setSelectedDriveId(null);
                    setBrowsingFolderId(null);
                    setFolderPath([]);
                  }}
                  className="hover:text-indigo-600 shrink-0"
                >
                  {t('settings:drive.selectDrive')}
                </button>
                {folderPath.map((item, idx) => (
                  <span key={item.id} className="flex items-center gap-1 shrink-0">
                    <ChevronRight className="h-3 w-3" />
                    <button
                      onClick={() => handleNavigateToPathItem(idx)}
                      className={`hover:text-indigo-600 ${
                        idx === folderPath.length - 1 ? 'font-medium text-gray-900' : ''
                      }`}
                    >
                      {item.name}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Drive / Folder list */}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-100">
              {!selectedDriveId ? (
                // Shared drives list
                sharedDrives.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    {t('settings:drive.noDrives')}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {sharedDrives.map((drive) => (
                      <button
                        key={drive.id}
                        onClick={() => handleSelectDrive(drive)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-violet-50 transition-colors"
                      >
                        {drive.id === 'root' ? (
                          <User className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <HardDrive className="h-4 w-4 text-violet-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{drive.name}</span>
                        <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                      </button>
                    ))}
                  </div>
                )
              ) : foldersLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                </div>
              ) : subFolders && subFolders.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {subFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleNavigateFolder(folder.id, folder.name)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-violet-50 transition-colors"
                    >
                      <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-sm text-gray-700">{folder.name}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-400">
                  {t('settings:drive.noSubfolders')}
                </div>
              )}
            </div>

            {/* Confirm selection button */}
            {folderPath.length > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {t('settings:drive.currentSelection')}: <span className="font-medium text-gray-700">{folderPath[folderPath.length - 1].name}</span>
                </p>
                <button
                  onClick={handleConfirmSelection}
                  className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                >
                  {t('settings:drive.confirmSelection')}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={handleTest}
            disabled={testMutation.isPending || !settings?.configured}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t('settings:drive.testButton')}
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common:save')}
          </button>
        </div>
      </div>
    </div>
  );
}
