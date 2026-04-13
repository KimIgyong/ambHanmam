import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberResponse } from '@amb/types';
import { useUpdateMemberRole } from '../hooks/useMembers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  member: MemberResponse | null;
}

export default function MemberRoleChangeModal({
  isOpen,
  onClose,
  member,
}: Props) {
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const updateRole = useUpdateMemberRole();
  const { t } = useTranslation(['members', 'common']);

  useEffect(() => {
    if (member) setSelectedRole(member.role);
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async () => {
    await updateRole.mutateAsync({ id: member.userId, role: selectedRole });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t('members:roleChange.title')}
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          {member.name} ({member.email})
        </p>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('members:roleChange.selectRole')}
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="MEMBER">{t('members:roles.MEMBER')}</option>
          <option value="MANAGER">{t('members:roles.MANAGER')}</option>
          <option value="VIEWER">{t('members:roles.VIEWER')}</option>
          <option value="ADMIN">{t('members:roles.ADMIN')}</option>
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateRole.isPending || selectedRole === member.role}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('members:roleChange.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
