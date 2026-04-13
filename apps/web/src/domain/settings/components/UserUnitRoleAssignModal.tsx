import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Check } from 'lucide-react';
import { UnitResponse, MemberResponse } from '@amb/types';
import { useAssignUserRole } from '../hooks/useUnits';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

interface UserUnitRoleAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: UnitResponse[];
  preselectedDeptId?: string;
}

export default function UserUnitRoleAssignModal({
  isOpen,
  onClose,
  departments,
  preselectedDeptId,
}: UserUnitRoleAssignModalProps) {
  const { t } = useTranslation('acl');
  const assignMutation = useAssignUserRole();

  const [userId, setUserId] = useState('');
  const [unitId, setUnitId] = useState(preselectedDeptId || '');
  const [role, setRole] = useState('MEMBER');
  const [isPrimary, setIsPrimary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: MemberResponse[] }>('/members');
      return res.data.data;
    },
  });

  const filteredMembers = members?.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const flatUnits = flattenUnits(departments);

  const handleSubmit = async () => {
    if (!userId || !unitId) return;

    await assignMutation.mutateAsync({
      user_id: userId,
      unit_id: unitId,
      role,
      is_primary: isPrimary,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('role.assignTitle')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* User Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('role.selectUser')} *
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('role.selectUser')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && filteredMembers && filteredMembers.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                {filteredMembers.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => {
                      setUserId(member.userId);
                      setSearchQuery(member.name);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      userId === member.userId ? 'bg-indigo-50 text-indigo-700' : ''
                    }`}
                  >
                    <span className="font-medium">{member.name}</span>
                    <span className="ml-2 text-gray-400">{member.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Unit Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('role.selectUnit')} *
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">{t('role.selectUnit')}</option>
              {flatUnits.map((dept) => (
                <option key={dept.unitId} value={dept.unitId}>
                  {'  '.repeat(dept.level - 1)}{dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('role.selectRole')}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="MEMBER">{t('role.MEMBER')}</option>
              <option value="TEAM_LEAD">{t('role.TEAM_LEAD')}</option>
              <option value="DEPARTMENT_HEAD">{t('role.DEPARTMENT_HEAD')}</option>
            </select>
          </div>

          {/* Primary Checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {t('role.primary')}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel', { ns: 'common' })}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!userId || !unitId || assignMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {assignMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {t('role.assign')}
          </button>
        </div>
      </div>
    </div>
  );
}

function flattenUnits(departments: UnitResponse[]): UnitResponse[] {
  const result: UnitResponse[] = [];
  for (const dept of departments) {
    result.push(dept);
    if (dept.children) {
      result.push(...flattenUnits(dept.children));
    }
  }
  return result;
}
