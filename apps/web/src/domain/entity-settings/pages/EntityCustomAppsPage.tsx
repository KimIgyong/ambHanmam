import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppWindow, Plus, Pencil, Trash2, Loader2, Activity, X, ExternalLink, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import {
  useCustomApps,
  useCreateCustomApp,
  useUpdateCustomApp,
  useDeleteCustomApp,
  useAppHealthCheck,
} from '../hooks/useEntitySettings';
import type { CustomApp, CreateCustomAppDto, UpdateCustomAppDto } from '../service/entity-settings.service';


const AUTH_MODES = ['jwt', 'none', 'api_key'] as const;
const ROLES = ['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'] as const;

export default function EntityCustomAppsPage() {
  return <EntityCustomAppsContent />;
}

function EntityCustomAppsContent() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data: apps, isLoading, error: queryError } = useCustomApps();
  const createMutation = useCreateCustomApp();
  const updateMutation = useUpdateCustomApp();
  const deleteMutation = useDeleteCustomApp();
  const healthCheckMutation = useAppHealthCheck();

  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<CustomApp | null>(null);
  const [healthResult, setHealthResult] = useState<{ success: boolean; status: number; error?: string } | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    url: '',
    description: '',
    icon: 'AppWindow',
    auth_mode: 'jwt' as 'jwt' | 'none' | 'api_key',
    open_mode: 'iframe' as 'iframe' | 'new_tab',
    api_key: '',
    allowed_roles: [] as string[],
    sort_order: 0,
    is_active: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      url: '',
      description: '',
      icon: 'AppWindow',
      auth_mode: 'jwt',
      open_mode: 'iframe',
      api_key: '',
      allowed_roles: [],
      sort_order: 0,
      is_active: true,
    });
    setShowApiKey(false);
    setEditingApp(null);
    setHealthResult(null);
  };

  const openCreateModal = () => {
    resetForm();
    setSubmitError(null);
    setShowModal(true);
  };

  const openEditModal = (app: CustomApp) => {
    setEditingApp(app);
    setSubmitError(null);
    setShowApiKey(false);
    setForm({
      code: app.code,
      name: app.name,
      url: app.url,
      description: app.description || '',
      icon: app.icon,
      auth_mode: app.authMode,
      open_mode: app.openMode || 'iframe',
      api_key: '',  // 수정 시 빈칸으로 (기존 키 유지)
      allowed_roles: app.allowedRoles || [],
      sort_order: app.sortOrder,
      is_active: app.isActive,
    });
    setHealthResult(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);

    // 프론트엔드 URL 유효성 검사
    if (form.url && !/^https?:\/\//i.test(form.url)) {
      setSubmitError(t('entitySettings:customApps.urlMustBeHttpOrHttps'));
      return;
    }

    try {
      if (editingApp) {
        const dto: UpdateCustomAppDto = {
          name: form.name,
          description: form.description || undefined,
          icon: form.icon,
          url: form.url,
          auth_mode: form.auth_mode,
          open_mode: form.open_mode,
          api_key: form.api_key || undefined,
          allowed_roles: form.allowed_roles.length > 0 ? form.allowed_roles : undefined,
          sort_order: form.sort_order,
          is_active: form.is_active,
        };
        await updateMutation.mutateAsync({ id: editingApp.id, dto });
      } else {
        const dto: CreateCustomAppDto = {
          code: form.code,
          name: form.name,
          url: form.url,
          description: form.description || undefined,
          icon: form.icon,
          auth_mode: form.auth_mode,
          open_mode: form.open_mode,
          api_key: form.api_key || undefined,
          allowed_roles: form.allowed_roles.length > 0 ? form.allowed_roles : undefined,
          sort_order: form.sort_order,
        };
        await createMutation.mutateAsync(dto);
      }
      closeModal();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string | string[] } } };
      const msg = apiError?.response?.data?.message;
      const errorMsg = Array.isArray(msg) ? msg.join(', ') : msg || (editingApp
        ? t('entitySettings:customApps.updateFailed')
        : t('entitySettings:customApps.createFailed'));
      setSubmitError(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('entitySettings:customApps.confirmDelete'))) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleHealthCheck = async (appId: string) => {
    setHealthResult(null);
    const result = await healthCheckMutation.mutateAsync(appId);
    setHealthResult(result);
  };

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      allowed_roles: prev.allowed_roles.includes(role)
        ? prev.allowed_roles.filter((r) => r !== role)
        : [...prev.allowed_roles, role],
    }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('entitySettings:customApps.title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('entitySettings:customApps.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('entitySettings:customApps.addApp')}
            </button>
          </div>
        </div>

        {/* Entity not assigned error */}
        {queryError && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertTriangle className="mb-3 h-12 w-12 text-amber-500" />
            <p className="text-sm">{t('entitySettings:customApps.noEntityAssigned')}</p>
          </div>
        )}

        {/* Loading */}
        {!queryError && isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        )}

        {/* Empty */}
        {!queryError && !isLoading && (!apps || apps.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AppWindow className="mb-3 h-12 w-12" />
            <p className="text-sm">{t('entitySettings:customApps.noApps')}</p>
          </div>
        )}

        {/* App Cards */}
        {!queryError && !isLoading && apps && apps.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AppWindow className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-base font-semibold text-gray-900">{app.name}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      app.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {app.isActive
                      ? t('entitySettings:customApps.active')
                      : t('entitySettings:customApps.inactive')}
                  </span>
                </div>

                <p className="mb-1 text-xs text-gray-400">
                  {app.code}
                </p>
                {app.description && (
                  <p className="mb-2 text-xs text-gray-500 line-clamp-2">{app.description}</p>
                )}

                {/* 설정 요약 배지 */}
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600">
                    {app.authMode.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500">
                    {app.openMode === 'new_tab'
                      ? t('entitySettings:customApps.openModeNewTab')
                      : 'iframe'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(app)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      <Pencil className="h-3 w-3" />
                      {t('entitySettings:customApps.editApp')}
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t('entitySettings:customApps.deleteApp')}
                    </button>
                  </div>
                  <Link
                    to={`/apps/${app.code}`}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-indigo-500 hover:bg-indigo-50"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t('entitySettings:customApps.viewApp')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingApp
                    ? t('entitySettings:customApps.editApp')
                    : t('entitySettings:customApps.addApp')}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.appName')} *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const updates: Partial<typeof form> = { name };
                      if (!editingApp) {
                        updates.code = name
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, '');
                      }
                      setForm({ ...form, ...updates });
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Code (only for create) */}
                {!editingApp && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('entitySettings:customApps.appCode')} *
                    </label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="bpo-report"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.codeHint')}</p>
                  </div>
                )}

                {/* URL */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.appUrl')} *
                  </label>
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://your-app.example.com 또는 http://localhost:3000"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.appDescription')}
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.appIcon')}
                  </label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="AppWindow"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.iconHint')}</p>
                </div>

                {/* Auth Mode */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.authMode')}
                  </label>
                  <div className="flex gap-4">
                    {AUTH_MODES.map((mode) => (
                      <label key={mode} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="auth_mode"
                          value={mode}
                          checked={form.auth_mode === mode}
                          onChange={() => setForm({ ...form, auth_mode: mode, api_key: '' })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        {t(`entitySettings:customApps.authMode${mode.charAt(0).toUpperCase() + mode.slice(1).replace('_', '')}` as never)}
                      </label>
                    ))}
                  </div>
                  {form.auth_mode === 'jwt' && (
                    <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.jwtHint')}</p>
                  )}
                </div>

                {/* API Key 입력 (api_key 모드일 때만) */}
                {form.auth_mode === 'api_key' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('entitySettings:customApps.apiKey')}
                      {!editingApp && ' *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={form.api_key}
                        onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                        placeholder={editingApp
                          ? (editingApp.apiKeyMasked || t('entitySettings:customApps.apiKeyPlaceholder'))
                          : t('entitySettings:customApps.apiKeyPlaceholder')}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {editingApp && (
                      <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.apiKeyHint')}</p>
                    )}
                  </div>
                )}

                {/* Open Mode */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.openMode')}
                  </label>
                  <div className="flex gap-4">
                    {(['iframe', 'new_tab'] as const).map((mode) => (
                      <label key={mode} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="open_mode"
                          value={mode}
                          checked={form.open_mode === mode}
                          onChange={() => setForm({ ...form, open_mode: mode })}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        {t(`entitySettings:customApps.openMode${mode === 'iframe' ? 'Iframe' : 'NewTab'}` as never)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Allowed Roles */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.allowedRoles')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={form.allowed_roles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.allRolesHint')}</p>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.sortOrder')}
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Active toggle (edit only) */}
                {editingApp && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('entitySettings:customApps.active')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_active: !form.is_active })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        form.is_active ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          form.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Connection Test */}
                {editingApp && (
                  <div>
                    <button
                      type="button"
                      onClick={() => handleHealthCheck(editingApp.id)}
                      disabled={healthCheckMutation.isPending}
                      className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {healthCheckMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Activity className="h-4 w-4" />
                      )}
                      {t('entitySettings:customApps.testConnection')}
                    </button>
                    {healthResult && (
                      <p
                        className={`mt-2 text-sm ${
                          healthResult.success ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {healthResult.success
                          ? t('entitySettings:customApps.connectionSuccess')
                          : `${t('entitySettings:customApps.connectionFailed')} (${healthResult.error || healthResult.status})`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving || !form.name || !form.url || (!editingApp && !form.code)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingApp ? (
                    t('common:save')
                  ) : (
                    t('entitySettings:customApps.addApp')
                  )}
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
