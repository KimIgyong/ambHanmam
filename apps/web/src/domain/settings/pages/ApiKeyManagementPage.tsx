import { useState } from 'react';
import { Plus, Key, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiKeyResponse } from '@amb/types';
import { useApiKeyList } from '../hooks/useApiKeys';
import ApiKeyCard from '../components/ApiKeyCard';
import ApiKeyFormModal from '../components/ApiKeyFormModal';
import ApiKeyDeleteConfirmModal from '../components/ApiKeyDeleteConfirmModal';

export default function ApiKeyManagementPage() {
  const { data: apiKeys, isLoading } = useApiKeyList();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiKeyResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyResponse | null>(null);
  const { t } = useTranslation('settings');

  const handleEdit = (apiKey: ApiKeyResponse) => {
    setEditTarget(apiKey);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Key className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-sm text-gray-500">
                {t('subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('addKey')}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : !apiKeys || apiKeys.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
            <Key className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              {t('noKeys')}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {t('noKeysDesc')}
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('addFirstKey')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <ApiKeyCard
                key={key.apiKeyId}
                apiKey={key}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        <ApiKeyFormModal
          isOpen={formOpen}
          onClose={handleFormClose}
          editTarget={editTarget}
        />
        <ApiKeyDeleteConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          apiKey={deleteTarget}
        />
      </div>
    </div>
  );
}
