import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/domain/settings/hooks/useEntities';
import { useAllUnits } from '@/domain/settings/hooks/useUnits';
import { unitService } from '@/domain/settings/service/unit.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  existingDeptIds: string[];
  onSuccess?: () => void;
}

const DEPT_ROLES = ['MEMBER', 'TEAM_LEAD', 'DEPARTMENT_HEAD'];

export default function AssignUnitModal({ isOpen, onClose, memberId, existingDeptIds, onSuccess }: Props) {
  const { t } = useTranslation(['members', 'common']);
  const { data: entities } = useEntityList();
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { data: units } = useAllUnits(selectedEntityId);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [isPrimary, setIsPrimary] = useState(false);
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: (data: {
      user_id: string;
      unit_id: string;
      role: string;
      is_primary: boolean;
      started_at: string;
    }) => unitService.assignUserRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', memberId] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  if (!isOpen) return null;

  const availableUnits = (units || []).filter(
    (d) => !existingDeptIds.includes(d.unitId),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) return;

    await assignMutation.mutateAsync({
      user_id: memberId,
      unit_id: selectedUnitId,
      role: selectedRole,
      is_primary: isPrimary,
      started_at: new Date().toISOString().split('T')[0],
    });
    setSelectedEntityId('');
    setSelectedUnitId('');
    setSelectedRole('MEMBER');
    setIsPrimary(false);
    onClose();
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('members:memberDetail.assignUnit')}
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
              onChange={(e) => {
                setSelectedEntityId(e.target.value);
                setSelectedUnitId('');
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            >
              <option value="">{t('members:memberDetail.selectEntity')}</option>
              {(entities || []).map((entity) => (
                <option key={entity.entityId} value={entity.entityId}>
                  {entity.name} ({entity.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:memberDetail.unit')}
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
              disabled={!selectedEntityId}
            >
              <option value="">{t('members:memberDetail.selectUnit')}</option>
              {availableUnits.map((unit) => (
                <option key={unit.unitId} value={unit.unitId}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:memberDetail.deptRole')}
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {DEPT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`members:memberDetail.deptRoles.${role}`, { defaultValue: role })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">
              {t('members:memberDetail.isPrimary')}
            </label>
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
              disabled={!selectedUnitId || assignMutation.isPending}
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
