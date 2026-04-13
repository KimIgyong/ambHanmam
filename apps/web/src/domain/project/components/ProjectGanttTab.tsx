import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { projectApiService } from '../service/project.service';
import { IssueResponse } from '@amb/types';
import IssueGanttView from '@/domain/issues/components/IssueGanttView';
import IssueDetailModal from '@/domain/issues/components/IssueDetailModal';
import IssueFormModal from '@/domain/issues/components/IssueFormModal';
import IssueDeleteConfirmModal from '@/domain/issues/components/IssueDeleteConfirmModal';
import { useUpdateIssue, useDeleteIssue } from '@/domain/issues/hooks/useIssues';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useWbsTree } from '../hooks/useWbs';

interface ProjectGanttTabProps {
  projectId: string;
}

export default function ProjectGanttTab({ projectId }: ProjectGanttTabProps) {
  const { t } = useTranslation(['project', 'issues']);
  const queryClient = useQueryClient();
  const isMaster = useAuthStore((s) => s.isMaster());
  const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueResponse | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<IssueResponse | null>(null);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showAssignee, setShowAssignee] = useState(true);

  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'issues', 'gantt'],
    queryFn: () => projectApiService.getProjectIssues(projectId, { size: 200 }),
    enabled: !!projectId,
  });

  const { data: wbsTree } = useWbsTree(projectId, { include_closed: true });

  const issues = data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
  };

  const handleEdit = (issue: IssueResponse) => {
    setSelectedIssue(null);
    setEditingIssue(issue);
  };

  const handleDeleteRequest = (issue: IssueResponse) => {
    setSelectedIssue(null);
    setDeletingIssue(issue);
  };

  const handleEditSubmit = (formData: Parameters<typeof updateIssue.mutate>[0]['data']) => {
    if (!editingIssue) return;
    updateIssue.mutate(
      { id: editingIssue.issueId, data: formData },
      {
        onSuccess: () => {
          toast.success(t('issues:messages.updated'));
          setEditingIssue(null);
          invalidate();
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingIssue) return;
    deleteIssue.mutate(deletingIssue.issueId, {
      onSuccess: () => {
        toast.success(t('issues:messages.deleted'));
        setDeletingIssue(null);
        invalidate();
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <>
      {/* Author / Assignee 토글 */}
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-600">
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input type="checkbox" checked={showAuthor} onChange={(e) => setShowAuthor(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
          {t('project:gantt.showAuthor')}
        </label>
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input type="checkbox" checked={showAssignee} onChange={(e) => setShowAssignee(e.target.checked)} className="rounded border-gray-300 h-3.5 w-3.5" />
          {t('project:gantt.showAssignee')}
        </label>
      </div>
      <IssueGanttView issues={issues} onIssueClick={setSelectedIssue} wbsTree={wbsTree} showAuthor={showAuthor} showAssignee={showAssignee} />

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      {editingIssue && (
        <IssueFormModal
          isOpen={!!editingIssue}
          editingIssue={editingIssue}
          onClose={() => setEditingIssue(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deletingIssue && (
        <IssueDeleteConfirmModal
          isOpen={!!deletingIssue}
          onClose={() => setDeletingIssue(null)}
          onConfirm={handleDeleteConfirm}
          canSoftDelete={true}
          canPermanentDelete={isMaster}
        />
      )}
    </>
  );
}
