import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, Trash2, Loader2, Wifi, WifiOff, ListChecks, Bug, Save, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useExternalTools,
  useCreateExternalTool,
  useUpdateExternalTool,
  useDeleteExternalTool,
  useTestConnection,
} from '../hooks/useExternalTaskImport';
import type { ExternalTool } from '../service/external-task-import.service';
import type { ExternalTaskProviderType } from '@amb/types';

/* ── Provider 정의 ── */

interface ProviderDef {
  type: ExternalTaskProviderType;
  icon: React.ElementType;
  label: string;
  needsUrl: boolean;
  tokenLabel: string;
  urlPlaceholder?: string;
  defaultName: string;
}

const PROVIDERS: ProviderDef[] = [
  {
    type: 'asana',
    icon: ListChecks,
    label: 'Asana',
    needsUrl: false,
    tokenLabel: 'Personal Access Token',
    defaultName: 'Asana',
  },
  {
    type: 'redmine',
    icon: Bug,
    label: 'Redmine',
    needsUrl: true,
    tokenLabel: 'API Key',
    urlPlaceholder: 'https://redmine.example.com',
    defaultName: 'Redmine',
  },
];

/* ── Card Component ── */

function ProviderCard({
  provider,
  tool,
  onSave,
  onDelete,
  onTest,
  isSaving,
  isTesting,
}: {
  provider: ProviderDef;
  tool: ExternalTool | null;
  onSave: (provider: ProviderDef, data: { name: string; url: string; api_key: string }, existingId?: string) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  isSaving: boolean;
  isTesting: boolean;
}) {
  const { t } = useTranslation(['externalTask', 'common']);
  const Icon = provider.icon;
  const isConnected = !!tool?.isActive;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: tool?.name || provider.defaultName,
    url: tool?.url || '',
    api_key: '',
  });

  const handleEdit = () => {
    setForm({
      name: tool?.name || provider.defaultName,
      url: tool?.url || '',
      api_key: '',
    });
    setEditing(true);
  };

  const handleCancel = () => setEditing(false);

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (provider.needsUrl && !tool && !form.url.trim()) return;
    if (!tool && !form.api_key.trim()) return;
    onSave(provider, form, tool?.id);
    setEditing(false);
  };

  const handleTest = () => {
    if (tool) onTest(tool.id);
  };

  const handleDelete = () => {
    if (tool) onDelete(tool.id);
  };

  return (
    <div className={`rounded-xl border-2 bg-white transition-all ${isConnected ? 'border-green-200 shadow-sm' : 'border-gray-200'}`}>
      {/* Card Header */}
      <div className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isConnected ? 'bg-green-50' : 'bg-gray-100'}`}>
          <Icon className={`h-6 w-6 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">{provider.label}</span>
            {isConnected ? (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <Wifi className="h-3 w-3" />{t('externalTask:settings.connected')}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                <WifiOff className="h-3 w-3" />{t('externalTask:settings.disconnected')}
              </span>
            )}
          </div>
          {tool && !editing && (
            <div className="mt-1 text-sm text-gray-500">
              {tool.name}{tool.url ? ` · ${tool.url}` : ''}
            </div>
          )}
          {!tool && !editing && (
            <div className="mt-1 text-sm text-gray-400">{t('externalTask:settings.notConfigured')}</div>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            {tool && (
              <button
                onClick={handleTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                {t('externalTask:settings.testConnection')}
              </button>
            )}
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('common:edit')}
            </button>
            {tool && (
              <button
                onClick={handleDelete}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Form (inline) */}
      {editing && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <div className="space-y-3">
            {/* Connection Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('externalTask:settings.connectionName')}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={provider.defaultName}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* URL (Redmine, Jira) */}
            {provider.needsUrl && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder={provider.urlPlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* API Key / Token */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {provider.tokenLabel}
              </label>
              <input
                type="password"
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder={tool ? t('externalTask:settings.unchangedPlaceholder') : ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common:save')}
              </button>
              {tool && (
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {t('externalTask:settings.testConnection')}
                </button>
              )}
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
                {t('common:cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Embeddable Cards (재사용 가능) ── */

export function ExternalTaskToolsCards() {
  const { t } = useTranslation(['externalTask', 'common']);
  const { data: tools, isLoading } = useExternalTools();
  const createMutation = useCreateExternalTool();
  const updateMutation = useUpdateExternalTool();
  const deleteMutation = useDeleteExternalTool();
  const testMutation = useTestConnection();

  const findTool = (providerType: string): ExternalTool | null => {
    if (!tools) return null;
    return (tools as ExternalTool[]).find((t) => t.code?.startsWith(providerType)) || null;
  };

  const handleSave = async (
    provider: ProviderDef,
    data: { name: string; url: string; api_key: string },
    existingId?: string,
  ) => {
    try {
      if (existingId) {
        const updateData: Record<string, string> = { name: data.name };
        if (data.url) updateData.url = data.url;
        if (data.api_key) updateData.api_key = data.api_key;
        await updateMutation.mutateAsync({ id: existingId, data: updateData });
      } else {
        await createMutation.mutateAsync({
          provider: provider.type,
          name: data.name,
          url: data.url || undefined,
          api_key: data.api_key,
        });
      }
      toast.success(t('common:saved'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common:confirmDelete'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('common:deleted'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testMutation.mutateAsync(id);
      if (result.success) {
        toast.success(`${t('externalTask:settings.connected')}${result.info ? ': ' + result.info : ''}`);
      } else {
        toast.error(`${t('externalTask:settings.disconnected')}${result.error ? ': ' + result.error : ''}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-3">
      {PROVIDERS.map((provider) => (
        <ProviderCard
          key={provider.type}
          provider={provider}
          tool={findTool(provider.type)}
          onSave={handleSave}
          onDelete={handleDelete}
          onTest={handleTest}
          isSaving={createMutation.isPending || updateMutation.isPending}
          isTesting={testMutation.isPending}
        />
      ))}
    </div>
  );
}

/* ── Page ── */

export default function ExternalTaskToolsPage() {
  const { t } = useTranslation(['externalTask', 'common']);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/entity-settings/external-connect" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('externalTask:settings.title')}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{t('externalTask:settings.subtitle')}</p>
          </div>
        </div>

        {/* Provider Cards */}
        <ExternalTaskToolsCards />
      </div>
    </div>
  );
}
