import { useState } from 'react';
import { Key, ToggleLeft, ToggleRight, Trash2, Plug, Pencil, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiKeyResponse, ApiProvider } from '@amb/types';
import { useUpdateApiKey, useTestApiKey } from '../hooks/useApiKeys';

interface ApiKeyCardProps {
  apiKey: ApiKeyResponse;
  onEdit: (apiKey: ApiKeyResponse) => void;
  onDelete: (apiKey: ApiKeyResponse) => void;
}

export default function ApiKeyCard({ apiKey, onEdit, onDelete }: ApiKeyCardProps) {
  const updateMutation = useUpdateApiKey();
  const testMutation = useTestApiKey();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { t } = useTranslation(['settings', 'common', 'chat']);

  const handleToggleActive = () => {
    updateMutation.mutate({
      id: apiKey.apiKeyId,
      data: { is_active: !apiKey.isActive },
    });
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const result = await testMutation.mutateAsync(apiKey.apiKeyId);
      setTestResult(result!);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      setTestResult({
        success: false,
        message: err?.response?.data?.error?.message || t('chat:connectionTestFail'),
      });
    }
  };

  const providerLabel = t(`settings:providers.${apiKey.provider as ApiProvider}`) || apiKey.provider;

  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm transition-opacity ${
      !apiKey.isActive ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
            <Key className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
            <p className="text-sm text-gray-500">{providerLabel}</p>
          </div>
        </div>

        <button
          onClick={handleToggleActive}
          disabled={updateMutation.isPending}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title={apiKey.isActive ? t('settings:deactivate') : t('settings:activate')}
        >
          {apiKey.isActive ? (
            <ToggleRight className="h-7 w-7 text-indigo-600" />
          ) : (
            <ToggleLeft className="h-7 w-7" />
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded bg-gray-100 px-2.5 py-1 font-mono text-sm text-gray-600">
          ****...{apiKey.keyLast4}
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          apiKey.isActive
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {apiKey.isActive ? t('common:active') : t('common:inactive')}
        </span>
      </div>

      {testResult && (
        <div className={`mt-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
          testResult.success
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={handleTest}
          disabled={testMutation.isPending || !apiKey.isActive}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plug className="h-4 w-4" />
          )}
          {t('settings:connectionTest')}
        </button>
        <button
          onClick={() => onEdit(apiKey)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          {t('common:edit')}
        </button>
        <button
          onClick={() => onDelete(apiKey)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          {t('common:delete')}
        </button>
      </div>
    </div>
  );
}
