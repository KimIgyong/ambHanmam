import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiKeyResponse, API_PROVIDER, ApiProvider } from '@amb/types';
import { useCreateApiKey, useUpdateApiKey } from '../hooks/useApiKeys';

interface ApiKeyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTarget?: ApiKeyResponse | null;
}

const PROVIDERS = Object.values(API_PROVIDER);

export default function ApiKeyFormModal({ isOpen, onClose, editTarget }: ApiKeyFormModalProps) {
  const [provider, setProvider] = useState<string>(PROVIDERS[0]);
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { t } = useTranslation(['settings', 'common']);

  const createMutation = useCreateApiKey();
  const updateMutation = useUpdateApiKey();
  const isEditing = !!editTarget;
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editTarget) {
      setProvider(editTarget.provider);
      setName(editTarget.name);
      setApiKey('');
    } else {
      setProvider(PROVIDERS[0]);
      setName('');
      setApiKey('');
    }
  }, [editTarget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        const data: { name?: string; api_key?: string } = {};
        if (name !== editTarget.name) data.name = name;
        if (apiKey) data.api_key = apiKey;
        await updateMutation.mutateAsync({ id: editTarget.apiKeyId, data });
      } else {
        await createMutation.mutateAsync({ provider, name, api_key: apiKey });
      }
      onClose();
    } catch {
      // Error handled by React Query
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? t('settings:editTitle') : t('settings:addTitle')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings:provider')}
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={isEditing}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {t(`settings:providers.${p as ApiProvider}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings:keyName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Key"
              required
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings:apiKey')} {isEditing && <span className="text-gray-400">{t('settings:apiKeyEditHint')}</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEditing ? t('settings:apiKeyEditPlaceholder') : 'sk-ant-...'}
              required={!isEditing}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? t('common:processing') : isEditing ? t('common:edit') : t('settings:addKey')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
