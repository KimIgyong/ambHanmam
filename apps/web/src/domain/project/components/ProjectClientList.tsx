import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Building2, X, Plus } from 'lucide-react';
import { useProjectClients, useAddProjectClient, useRemoveProjectClient } from '../hooks/useProject';
import { entityClientApiService, ClientListItem } from '@/domain/entity-settings/service/entity-client.service';
import { useQuery } from '@tanstack/react-query';

interface ProjectClientListProps {
  projectId: string;
}

export default function ProjectClientList({ projectId }: ProjectClientListProps) {
  const { t } = useTranslation('project');
  const { data: assignedClients = [], isLoading } = useProjectClients(projectId);
  const addClient = useAddProjectClient();
  const removeClient = useRemoveProjectClient();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedCliId, setSelectedCliId] = useState('');

  // Entity 고객사 목록 (추가 모드일 때만 로드)
  const { data: entityClients = [] } = useQuery<ClientListItem[]>({
    queryKey: ['entity-clients-for-assign'],
    queryFn: () => entityClientApiService.getClients(),
    enabled: showAdd,
  });

  // 이미 배정된 고객사 제외한 목록
  const assignedCliIds = new Set(assignedClients.map((ac: any) => ac.cliId));
  const availableClients = entityClients.filter((c) => !assignedCliIds.has(c.id));

  const handleAdd = () => {
    if (!selectedCliId) return;
    addClient.mutate(
      { projectId, cliId: selectedCliId },
      {
        onSuccess: () => {
          toast.success(t('client.added'));
          setSelectedCliId('');
          setShowAdd(false);
        },
        onError: () => {
          toast.error(t('common:errors.E9001', { defaultValue: 'An error occurred' }));
        },
      },
    );
  };

  const handleRemove = (cliId: string) => {
    removeClient.mutate(
      { projectId, clientId: cliId },
      {
        onSuccess: () => toast.success(t('client.removed')),
        onError: () => toast.error(t('common:errors.E9001', { defaultValue: 'An error occurred' })),
      },
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('client.title')}</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('client.add')}
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-3 space-y-2">
          <select
            value={selectedCliId}
            onChange={(e) => setSelectedCliId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('client.select')}</option>
            {availableClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} {c.code ? `(${c.code})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={addClient.isPending || !selectedCliId}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t('client.add')}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : assignedClients.filter((ac: any) => ac.pclStatus === 'ACTIVE').length === 0 ? (
        <div className="flex flex-col items-center py-4 text-gray-400">
          <Building2 className="h-8 w-8 mb-1" />
          <p className="text-sm">{t('client.noClients')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {assignedClients
            .filter((ac: any) => ac.pclStatus === 'ACTIVE')
            .map((ac: any) => (
              <div key={ac.pclId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {ac.client?.cliCompanyName?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ac.client?.cliCompanyName || '-'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {ac.client?.cliCode || ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(ac.cliId)}
                  className="text-gray-400 hover:text-red-500 shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
