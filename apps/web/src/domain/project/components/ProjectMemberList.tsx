import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UserPlus, X } from 'lucide-react';
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from '../hooks/useProject';
import { ProjectMemberResponse } from '@amb/types';
import AssigneeSelector from '@/domain/issues/components/AssigneeSelector';

interface ProjectMemberListProps {
  projectId: string;
}

export default function ProjectMemberList({ projectId }: ProjectMemberListProps) {
  const { t } = useTranslation('project');
  const { data: members = [], isLoading } = useProjectMembers(projectId);
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();

  const [showAdd, setShowAdd] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState('MEMBER');

  const handleAdd = () => {
    if (!userId) return;
    addMember.mutate(
      { projectId, data: { user_id: userId, role } },
      {
        onSuccess: () => {
          toast.success(t('member.added'));
          setUserId(null);
          setRole('MEMBER');
          setShowAdd(false);
        },
        onError: () => {
          toast.error(t('common:errors.E9001', { defaultValue: 'An error occurred' }));
        },
      },
    );
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(
      { projectId, memberId },
      {
        onSuccess: () => toast.success(t('member.removed')),
        onError: () => toast.error(t('common:errors.E9001', { defaultValue: 'An error occurred' })),
      },
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('member.title')}</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t('member.add')}
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-3 space-y-2">
          <AssigneeSelector
            value={userId}
            onChange={setUserId}
            placeholder={t('member.selectUser')}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {['PM', 'LEAD', 'MEMBER', 'REVIEWER', 'OBSERVER'].map((r) => (
              <option key={r} value={r}>{t(`member.${r}`)}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={addMember.isPending || !userId}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t('member.add')}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-500">No members</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {members.filter((m: ProjectMemberResponse) => m.isActive).map((member: ProjectMemberResponse) => (
            <div key={member.memberId} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                <p className="text-xs text-gray-500">{member.userEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {t(`member.${member.role}`, member.role)}
                </span>
                <button
                  onClick={() => handleRemove(member.memberId)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
