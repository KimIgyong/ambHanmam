import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  useEntityApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useDeleteApiKey,
} from '../hooks/useEntitySettings';
import type { CreateApiKeyDto } from '../service/entity-settings.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const PROVIDERS = ['ANTHROPIC', 'OPENAI', 'GOOGLE', 'AZURE'] as const;

const PROVIDER_COLORS: Record<string, string> = {
  ANTHROPIC: 'bg-orange-100 text-orange-700',
  OPENAI: 'bg-green-100 text-green-700',
  GOOGLE: 'bg-blue-100 text-blue-700',
  AZURE: 'bg-sky-100 text-sky-700',
};

export default function EntityApiKeyPage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const [showCreate, setShowCreate] = useState(false);

  const { data: apiKeys, isLoading } = useEntityApiKeys();
  const createMutation = useCreateApiKey();
  const updateMutation = useUpdateApiKey();
  const deleteMutation = useDeleteApiKey();

  const [form, setForm] = useState<CreateApiKeyDto>({
    provider: 'ANTHROPIC',
    name: '',
    api_key: '',
  });
  const [showKey, setShowKey] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setForm({ provider: 'ANTHROPIC', name: '', api_key: '' });
    setShowCreate(false);
  };

  const handleToggle = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, dto: { is_active: !currentActive } });
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('common:confirmDelete', { defaultValue: 'Are you sure?' }))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="h-6 w-6 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('entitySettings:apiKeys.title')}
              </h1>
              <p className="text-sm text-gray-500">{t('entitySettings:apiKeys.description')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('common:add', { defaultValue: 'Add' })}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : !apiKeys || apiKeys.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Key className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No API keys configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.apiKeyId}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <Key className={`h-5 w-5 ${key.isActive ? 'text-amber-500' : 'text-gray-300'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{key.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLORS[key.provider] || 'bg-gray-100 text-gray-600'}`}>
                        {key.provider}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      ····{key.keyLast4} · {<LocalDateTime value={key.createdAt} format='YYYY-MM-DD HH:mm' />}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(key.apiKeyId, key.isActive)}
                    disabled={updateMutation.isPending}
                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
                    title={key.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {key.isActive ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(key.apiKeyId)}
                    disabled={deleteMutation.isPending}
                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title={t('common:delete', { defaultValue: 'Delete' })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('common:add', { defaultValue: 'Add' })} API Key
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="My API Key"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    required
                    value={form.api_key}
                    onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('common:save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
