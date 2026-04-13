import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppWindow, Plus, Pencil, Trash2, Loader2, Activity, X, ExternalLink, ArrowLeft } from 'lucide-react';
import {
  useCustomApps,
  useCreateCustomApp,
  useUpdateCustomApp,
  useDeleteCustomApp,
  useAppHealthCheck,
} from '@/domain/entity-settings/hooks/useEntitySettings';
import { useEntityList } from '../hooks/useEntities';
import type { CustomApp, CreateCustomAppDto, UpdateCustomAppDto } from '@/domain/entity-settings/service/entity-settings.service';

const AUTH_MODES = ['jwt', 'none', 'api_key'] as const;
const ROLES = ['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'] as const;

export default function AdminCustomAppsPage() {
  const { t } = useTranslation(['settings', 'entitySettings', 'common']);
  const navigate = useNavigate();
  const { data: entities } = useEntityList();

  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { data: apps, isLoading } = useCustomApps(selectedEntityId || undefined);
  const createMutation = useCreateCustomApp(selectedEntityId || undefined);
  const updateMutation = useUpdateCustomApp(selectedEntityId || undefined);
  const deleteMutation = useDeleteCustomApp(selectedEntityId || undefined);
  const healthCheckMutation = useAppHealthCheck(selectedEntityId || undefined);

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
    allowed_roles: [] as string[],
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setForm({
      code: '', name: '', url: '', description: '', icon: 'AppWindow',
      auth_mode: 'jwt', allowed_roles: [], sort_order: 0, is_active: true,
    });
    setEditingApp(null);
    setHealthResult(null);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (app: CustomApp) => {
    setEditingApp(app);
    setForm({
      code: app.code, name: app.name, url: app.url,
      description: app.description || '', icon: app.icon,
      auth_mode: app.authMode, allowed_roles: app.allowedRoles || [],
      sort_order: app.sortOrder, is_active: app.isActive,
    });
    setHealthResult(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); resetForm(); };

  const handleSubmit = async () => {
    if (editingApp) {
      const dto: UpdateCustomAppDto = {
        name: form.name, description: form.description || undefined,
        icon: form.icon, url: form.url, auth_mode: form.auth_mode,
        allowed_roles: form.allowed_roles.length > 0 ? form.allowed_roles : undefined,
        sort_order: form.sort_order, is_active: form.is_active,
      };
      await updateMutation.mutateAsync({ id: editingApp.id, dto });
    } else {
      const dto: CreateCustomAppDto = {
        code: form.code, name: form.name, url: form.url,
        description: form.description || undefined, icon: form.icon,
        auth_mode: form.auth_mode,
        allowed_roles: form.allowed_roles.length > 0 ? form.allowed_roles : undefined,
        sort_order: form.sort_order,
      };
      await createMutation.mutateAsync(dto);
    }
    closeModal();
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
  const selectedEntityName = entities?.find((e: any) => e.entityId === selectedEntityId)?.name || '';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-100">
            <AppWindow className="h-5 w-5 text-fuchsia-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {t('settings:customApps.title', { defaultValue: 'Custom Apps Management' })}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settings:customApps.subtitle', { defaultValue: 'Manage custom apps for each entity' })}
            </p>
          </div>
        </div>

        {/* Entity Selector */}
        <div className="mt-3">
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
          >
            <option value="">{t('settings:customApps.selectEntity', { defaultValue: 'Select Entity' })}</option>
            {entities?.map((entity: any) => (
              <option key={entity.entityId} value={entity.entityId}>
                {entity.name} {entity.nameEn ? `(${entity.nameEn})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedEntityId ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AppWindow className="mb-3 h-12 w-12" />
            <p className="text-sm">{t('settings:customApps.selectEntityPrompt', { defaultValue: 'Select an entity to manage custom apps' })}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            {/* Add Button */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">
                {selectedEntityName} — {t('entitySettings:customApps.title')}
              </h2>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-700"
              >
                <Plus className="h-4 w-4" />
                {t('entitySettings:customApps.addApp')}
              </button>
            </div>

            {/* Empty */}
            {(!apps || apps.length === 0) && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <AppWindow className="mb-3 h-12 w-12" />
                <p className="text-sm">{t('entitySettings:customApps.noApps')}</p>
              </div>
            )}

            {/* App Cards */}
            {apps && apps.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-fuchsia-200"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <AppWindow className="h-5 w-5 text-fuchsia-500" />
                        <h3 className="text-sm font-semibold text-gray-900">{app.name}</h3>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          app.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {app.isActive
                          ? t('entitySettings:customApps.active')
                          : t('entitySettings:customApps.inactive')}
                      </span>
                    </div>
                    <p className="mb-1 text-xs text-gray-400">{app.code}</p>
                    {app.description && (
                      <p className="mb-2 text-xs text-gray-500 line-clamp-2">{app.description}</p>
                    )}
                    <div className="mb-3 flex items-center gap-1 text-xs text-gray-400">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{app.url}</span>
                    </div>
                    <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingApp ? t('entitySettings:customApps.editApp') : t('entitySettings:customApps.addApp')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
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
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.codeHint')}</p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:customApps.appName')} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:customApps.appUrl')} *
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://your-app.example.com 또는 http://localhost:3000"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:customApps.appDescription')}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:customApps.appIcon')}
                </label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="AppWindow"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                />
                <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.iconHint')}</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:customApps.authMode')}
                </label>
                <div className="flex gap-4">
                  {AUTH_MODES.map((mode) => (
                    <label key={mode} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio" name="auth_mode" value={mode}
                        checked={form.auth_mode === mode}
                        onChange={() => setForm({ ...form, auth_mode: mode })}
                        className="text-fuchsia-600 focus:ring-fuchsia-500"
                      />
                      {t(`entitySettings:customApps.authMode${mode.charAt(0).toUpperCase() + mode.slice(1).replace('_', '')}` as never)}
                    </label>
                  ))}
                </div>
              </div>

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
                        className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                      />
                      {role}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">{t('entitySettings:customApps.allRolesHint')}</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:customApps.sortOrder')}
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                />
              </div>

              {editingApp && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t('entitySettings:customApps.active')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      form.is_active ? 'bg-fuchsia-600' : 'bg-gray-300'
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
                    <p className={`mt-2 text-sm ${healthResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {healthResult.success
                        ? t('entitySettings:customApps.connectionSuccess')
                        : `${t('entitySettings:customApps.connectionFailed')} (${healthResult.error || healthResult.status})`}
                    </p>
                  )}
                </div>
              )}
            </div>

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
                className="rounded-md bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
