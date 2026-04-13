import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Pencil, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { useEntitiesAiConfigs, useUpdateEntityAiConfig } from '../hooks/useAdmin';
import type { EntityAiConfigItem } from '../service/admin.service';

interface EditState {
  entityId: string;
  provider: string;
  useSharedKey: boolean;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  isActive: boolean;
}

const PROVIDERS = ['ANTHROPIC', 'OPENAI'];

export default function EntityAiConfigsTab() {
  const { t } = useTranslation(['totalUsers']);
  const { data, isLoading } = useEntitiesAiConfigs();
  const updateMutation = useUpdateEntityAiConfig();
  const [editingEntity, setEditingEntity] = useState<EditState | null>(null);

  const handleEdit = (item: EntityAiConfigItem) => {
    setEditingEntity({
      entityId: item.entityId,
      provider: item.aiConfig?.provider || 'ANTHROPIC',
      useSharedKey: item.aiConfig?.useSharedKey ?? true,
      dailyTokenLimit: item.aiConfig?.dailyTokenLimit ?? 0,
      monthlyTokenLimit: item.aiConfig?.monthlyTokenLimit ?? 0,
      isActive: item.aiConfig?.isActive ?? true,
    });
  };

  const handleSave = () => {
    if (!editingEntity) return;
    updateMutation.mutate(
      {
        entityId: editingEntity.entityId,
        data: {
          provider: editingEntity.provider,
          use_shared_key: editingEntity.useSharedKey,
          daily_token_limit: editingEntity.dailyTokenLimit,
          monthly_token_limit: editingEntity.monthlyTokenLimit,
          is_active: editingEntity.isActive,
        },
      },
      { onSuccess: () => setEditingEntity(null) },
    );
  };

  const handleCancel = () => setEditingEntity(null);

  const formatLimit = (limit: number) => (limit === 0 ? t('totalUsers:ai.unlimited') : limit.toLocaleString());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">{t('totalUsers:noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.entityName')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.entityCode')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:ai.configured')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:ai.provider')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:ai.keyType')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:ai.dailyLimit')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:ai.monthlyLimit')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:ai.active')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => {
              const isEditing = editingEntity?.entityId === item.entityId;
              const config = item.aiConfig;
              return (
                <tr key={item.entityId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.entityName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.entityCode}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {config ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {isEditing ? (
                      <select
                        value={editingEntity.provider}
                        onChange={(e) => setEditingEntity({ ...editingEntity, provider: e.target.value })}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:outline-none"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {config?.provider || '-'}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {isEditing ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editingEntity.useSharedKey}
                          onChange={(e) => setEditingEntity({ ...editingEntity, useSharedKey: e.target.checked })}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        {t('totalUsers:ai.sharedKey')}
                      </label>
                    ) : config ? (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        config.useSharedKey ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {config.useSharedKey ? t('totalUsers:ai.sharedKey') : t('totalUsers:ai.ownKey')}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingEntity.dailyTokenLimit}
                        onChange={(e) => setEditingEntity({ ...editingEntity, dailyTokenLimit: parseInt(e.target.value) || 0 })}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:outline-none"
                        min={0}
                      />
                    ) : (
                      config ? formatLimit(config.dailyTokenLimit) : '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingEntity.monthlyTokenLimit}
                        onChange={(e) => setEditingEntity({ ...editingEntity, monthlyTokenLimit: parseInt(e.target.value) || 0 })}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-violet-500 focus:outline-none"
                        min={0}
                      />
                    ) : (
                      config ? formatLimit(config.monthlyTokenLimit) : '-'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {isEditing ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingEntity.isActive}
                          onChange={(e) => setEditingEntity({ ...editingEntity, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                      </label>
                    ) : config ? (
                      config.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )
                    ) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
                        >
                          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                        <button onClick={handleCancel} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded p-1 text-violet-600 hover:bg-violet-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
