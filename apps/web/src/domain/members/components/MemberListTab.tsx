import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MemberResponse } from '@amb/types';
import { useMemberList, useApproveMember, useRejectMember, useDeleteMember } from '../hooks/useMembers';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import MemberRoleChangeModal from './MemberRoleChangeModal';
import StatusBadge from './StatusBadge';

const isAdminUser = (user?: { role?: string; level?: string } | null) =>
  user?.level === 'ADMIN_LEVEL' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

export default function MemberListTab() {
  const { data: members, isLoading } = useMemberList();
  const [roleTarget, setRoleTarget] = useState<MemberResponse | null>(null);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { t } = useTranslation('members');
  const approveMember = useApproveMember();
  const rejectMember = useRejectMember();
  const deleteMember = useDeleteMember();

  const handleApprove = async (id: string) => {
    if (window.confirm(t('memberList.approveConfirm'))) {
      await approveMember.mutateAsync(id);
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm(t('memberList.rejectConfirm'))) {
      await rejectMember.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">
          {t('memberList.noMembers')}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {t('memberList.noMembersDesc')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('memberList.name')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('memberList.email')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('memberList.department')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('memberList.role')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('memberList.cells')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('memberList.status')}
              </th>
              {isAdminUser(user) && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  {t('memberList.changeRole')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.userId} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                  <button
                    onClick={() => navigate(`/admin/members/${member.userId}`)}
                    className="text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {member.name}
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {member.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {member.unit}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <RoleBadge role={member.role} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {member.cells.map((g) => g.name).join(', ') || '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <StatusBadge status={member.status || 'ACTIVE'} />
                </td>
                {isAdminUser(user) && (
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {member.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApprove(member.userId)}
                            disabled={approveMember.isPending}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            {t('memberList.approve')}
                          </button>
                          <button
                            onClick={() => handleReject(member.userId)}
                            disabled={rejectMember.isPending}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            {t('memberList.reject')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setRoleTarget(member)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {t('memberList.changeRole')}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(t('memberList.deleteConfirm', { name: member.name }))) {
                                await deleteMember.mutateAsync(member.userId);
                              }
                            }}
                            disabled={deleteMember.isPending}
                            className="text-red-500 hover:text-red-700"
                            title={t('memberList.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MemberRoleChangeModal
        isOpen={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        member={roleTarget}
      />
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colorMap: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-red-100 text-red-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    MEMBER: 'bg-green-100 text-green-700',
    VIEWER: 'bg-gray-100 text-gray-500',
    USER: 'bg-green-100 text-green-700',
  };
  const { t } = useTranslation('members');

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[role] || colorMap.USER}`}
    >
      {t(`roles.${role}`)}
    </span>
  );
}


