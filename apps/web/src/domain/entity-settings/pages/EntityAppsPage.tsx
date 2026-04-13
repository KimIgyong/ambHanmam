import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Download, Trash2, Loader2, CheckCircle, Settings2, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PartnerApp {
  papId: string;
  papCode: string;
  papName: string;
  papDescription: string | null;
  papIcon: string | null;
  papUrl: string;
  papAuthMode: string;
  papCategory: string;
  papVersion: string;
  papScopes: string[];
  partner?: { ptnName: string };
}

interface AppInstall {
  paiId: string;
  papId: string;
  paiEntityId: string;
  paiIsActive: boolean;
  paiApprovedScopes: string[];
  paiInstalledAt: string;
  app: PartnerApp;
}

// ── Hooks ──

function useMarketplaceApps() {
  return useQuery({
    queryKey: ['entity-apps', 'marketplace'],
    queryFn: async () => {
      const res = await apiClient.get('/entity/apps/marketplace');
      return (res.data?.data || []) as PartnerApp[];
    },
  });
}

function useInstalledApps() {
  return useQuery({
    queryKey: ['entity-apps', 'installed'],
    queryFn: async () => {
      const res = await apiClient.get('/entity/apps/installed');
      return (res.data?.data || []) as AppInstall[];
    },
  });
}

function useInstallApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, scopes }: { appId: string; scopes: string[] }) => {
      const res = await apiClient.post(`/entity/apps/${appId}/install`, { scopes });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-apps'] });
    },
  });
}

function useUninstallApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appId: string) => {
      const res = await apiClient.delete(`/entity/apps/${appId}/uninstall`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-apps'] });
    },
  });
}

function useUpdateScopes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ installId, scopes }: { installId: string; scopes: string[] }) => {
      const res = await apiClient.patch(`/entity/apps/${installId}/scopes`, { scopes });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-apps'] });
    },
  });
}

// ── Main Component ──

type Tab = 'marketplace' | 'installed';

export default function EntityAppsPage() {
  const { t } = useTranslation('oauth');
  const [tab, setTab] = useState<Tab>('marketplace');

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('marketplace.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('marketplace.description')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setTab('marketplace')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'marketplace' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('marketplace.published')}
        </button>
        <button
          type="button"
          onClick={() => setTab('installed')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === 'installed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('marketplace.installed')}
        </button>
      </div>

      {tab === 'marketplace' ? <MarketplaceTab /> : <InstalledTab />}
    </div>
  );
}

// ── Marketplace Tab ──

function MarketplaceTab() {
  const { t } = useTranslation('oauth');
  const { data: apps, isLoading } = useMarketplaceApps();
  const { data: installs } = useInstalledApps();
  const installMutation = useInstallApp();

  const [installDialog, setInstallDialog] = useState<PartnerApp | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const installedAppIds = new Set((installs || []).map((i) => i.papId));

  const openInstallDialog = (app: PartnerApp) => {
    setSelectedScopes(app.papScopes || []);
    setInstallDialog(app);
  };

  const handleInstall = async () => {
    if (!installDialog) return;
    await installMutation.mutateAsync({ appId: installDialog.papId, scopes: selectedScopes });
    setInstallDialog(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!apps?.length) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        {t('marketplace.noApps')}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const isInstalled = installedAppIds.has(app.papId);
          return (
            <div key={app.papId} className="rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-900">{app.papName}</h3>
                  {app.partner?.ptnName && (
                    <p className="text-xs text-gray-500">{app.partner.ptnName}</p>
                  )}
                </div>
              </div>
              {app.papDescription && (
                <p className="mt-3 line-clamp-2 text-sm text-gray-600">{app.papDescription}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <span>{t('marketplace.version')}: {app.papVersion}</span>
                <span>·</span>
                <span>{app.papCategory}</span>
              </div>
              <div className="mt-4">
                {isInstalled ? (
                  <div className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {t('marketplace.installed')}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openInstallDialog(app)}
                    className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('marketplace.install')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Install Dialog */}
      {installDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('marketplace.scopeApproval')}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {t('marketplace.scopeApprovalDescription', { appName: installDialog.papName })}
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                {(installDialog.papScopes || []).map((scope) => (
                  <label key={scope} className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScopes((prev) => [...prev, scope]);
                        } else {
                          setSelectedScopes((prev) => prev.filter((s) => s !== scope));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <div>
                      <p className="text-sm text-gray-700">
                        {t(`scopes.${scope}` as any, { defaultValue: scope })}
                      </p>
                      <p className="text-xs text-gray-400">{scope}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setInstallDialog(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('marketplace.cancelInstall')}
              </button>
              <button
                type="button"
                onClick={handleInstall}
                disabled={installMutation.isPending || selectedScopes.length === 0}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {installMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('marketplace.confirmInstall')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Installed Tab ──

function InstalledTab() {
  const { t } = useTranslation('oauth');
  const { data: installs, isLoading } = useInstalledApps();
  const uninstallMutation = useUninstallApp();
  const updateScopesMutation = useUpdateScopes();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editScopes, setEditScopes] = useState<string[] | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState<AppInstall | null>(null);

  const handleUninstall = async () => {
    if (!confirmUninstall) return;
    await uninstallMutation.mutateAsync(confirmUninstall.papId);
    setConfirmUninstall(null);
  };

  const startEditScopes = useCallback((install: AppInstall) => {
    setEditScopes([...install.paiApprovedScopes]);
    setExpandedId(install.paiId);
  }, []);

  const saveScopes = async (installId: string) => {
    if (!editScopes) return;
    await updateScopesMutation.mutateAsync({ installId, scopes: editScopes });
    setEditScopes(null);
    setExpandedId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!installs?.length) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        {t('marketplace.noInstalledApps')}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {installs.map((install) => {
          const isExpanded = expandedId === install.paiId;
          return (
            <div key={install.paiId} className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{install.app.papName}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {install.app.partner?.ptnName && <span>{install.app.partner.ptnName}</span>}
                    <span>·</span>
                    <span>{t('marketplace.version')}: {install.app.papVersion}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedId(null);
                        setEditScopes(null);
                      } else {
                        startEditScopes(install);
                      }
                    }}
                    className="rounded-md border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50"
                    title={t('marketplace.editScopes')}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" /> }
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmUninstall(install)}
                    className="rounded-md border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                    title={t('marketplace.uninstall')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded scope editor */}
              {isExpanded && editScopes && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Shield className="h-4 w-4" />
                    {t('marketplace.grantedScopes')}
                  </div>
                  <div className="space-y-2">
                    {(install.app.papScopes || []).map((scope) => (
                      <label key={scope} className="flex items-center gap-3 rounded-md border border-gray-100 px-3 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={editScopes.includes(scope)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditScopes((prev) => [...(prev || []), scope]);
                            } else {
                              setEditScopes((prev) => (prev || []).filter((s) => s !== scope));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <div>
                          <p className="text-sm text-gray-700">
                            {t(`scopes.${scope}` as any, { defaultValue: scope })}
                          </p>
                          <p className="text-xs text-gray-400">{scope}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setExpandedId(null); setEditScopes(null); }}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('marketplace.cancelInstall')}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveScopes(install.paiId)}
                      disabled={updateScopesMutation.isPending}
                      className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updateScopesMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <Settings2 className="h-3.5 w-3.5" />
                      {t('marketplace.editScopes')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Uninstall Confirm Dialog */}
      {confirmUninstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">{t('marketplace.uninstall')}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {t('marketplace.uninstallConfirm', { appName: confirmUninstall.app.papName })}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmUninstall(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t('marketplace.cancelInstall')}
              </button>
              <button
                type="button"
                onClick={handleUninstall}
                disabled={uninstallMutation.isPending}
                className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {uninstallMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('marketplace.uninstall')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
