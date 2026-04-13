import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/domain/settings/hooks/useEntities';
import { useAssignEntityRole } from '../hooks/useMembers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  existingEntityIds: string[];
  onSuccess?: () => void;
}

const ENTITY_ROLES = ['STAFF', 'HR_ADMIN', 'ADMIN'];

export default function AssignEntityModal({ isOpen, onClose, memberId, existingEntityIds, onSuccess }: Props) {
  const { t } = useTranslation(['members', 'common']);
  const { data: entities } = useEntityList();
  const assignMutation = useAssignEntityRole();
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedRole, setSelectedRole] = useState('STAFF');

  if (!isOpen) return null;

  const availableEntities = (entities || []).filter(
    (e) => !existingEntityIds.includes(e.entityId),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) return;

    await assignMutation.mutateAsync({
      memberId,
      data: { entity_id: selectedEntityId, role: selectedRole },
    });
    setSelectedEntityId('');
    setSelectedRole('STAFF');
    onClose();
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('members:memberDetail.assignEntity')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:memberDetail.entity')}
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">{t('members:memberDetail.selectEntity')}</option>
              {availableEntities.map((entity) => (
                <option key={entity.entityId} value={entity.entityId}>
                  {entity.name} ({entity.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:memberDetail.entityRole')}
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ENTITY_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`members:memberDetail.entityRoles.${role}`, { defaultValue: role })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              disabled={!selectedEntityId || assignMutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {assignMutation.isPending ? t('common:loading') : t('common:add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
