import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiKeyResponse, ApiProvider } from '@amb/types';
import { useDeleteApiKey } from '../hooks/useApiKeys';

interface ApiKeyDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: ApiKeyResponse | null;
}

export default function ApiKeyDeleteConfirmModal({
  isOpen,
  onClose,
  apiKey,
}: ApiKeyDeleteConfirmModalProps) {
  const deleteMutation = useDeleteApiKey();
  const { t } = useTranslation(['settings', 'common']);

  const handleDelete = async () => {
    if (!apiKey) return;
    try {
      await deleteMutation.mutateAsync(apiKey.apiKeyId);
      onClose();
    } catch {
      // Error handled by React Query
    }
  };

  if (!isOpen || !apiKey) return null;

  const providerLabel = t(`settings:providers.${apiKey.provider as ApiProvider}`) || apiKey.provider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings:deleteTitle')}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 mb-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium">{apiKey.name}</p>
            <p className="mt-1">
              {t('settings:deleteConfirm', { provider: providerLabel, last4: apiKey.keyLast4 })}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteMutation.isPending ? t('settings:deleting') : t('common:delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
