import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { projectApiService } from '../service/project.service';
import { IssueResponse, IssueStatus } from '@amb/types';
import IssueKanbanView from '@/domain/issues/components/IssueKanbanView';
import IssueDetailModal from '@/domain/issues/components/IssueDetailModal';
import IssueFormModal from '@/domain/issues/components/IssueFormModal';
import IssueDeleteConfirmModal from '@/domain/issues/components/IssueDeleteConfirmModal';
import { useUpdateIssue, useDeleteIssue } from '@/domain/issues/hooks/useIssues';
import { useAuthStore } from '@/domain/auth/store/auth.store';

const STATUS_ORDER: IssueStatus[] = ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'];
const DEFAULT_VISIBLE = new Set<string>(['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED']);

const STATUS_CHIP_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

interface ProjectKanbanTabProps {
  projectId: string;
}

export default function ProjectKanbanTab({ projectId }: ProjectKanbanTabProps) {
  const { t } = useTranslation(['project', 'issues']);
  const isMaster = useAuthStore((s) => s.isMaster());
  const queryClient = useQueryClient();
  const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueResponse | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<IssueResponse | null>(null);
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(DEFAULT_VISIBLE);

  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'issues', 'kanban'],
    queryFn: () => projectApiService.getProjectIssues(projectId, { size: 200 }),
    enabled: !!projectId,
  });

  const issues = data?.data || [];

  const filteredIssues = useMemo(
    () => issues.filter((i) => visibleStatuses.has(i.status)),
    [issues, visibleStatuses],
  );

  const toggleStatus = (status: string) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

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
      {/* 상태 필터 바 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">{t('project:filter.statusFilter')}:</span>
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatus(status)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              visibleStatuses.has(status)
                ? STATUS_CHIP_COLORS[status]
                : 'border-gray-200 bg-white text-gray-400'
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${visibleStatuses.has(status) ? 'opacity-100' : 'opacity-30'}`}
              style={{ backgroundColor: visibleStatuses.has(status) ? undefined : '#9CA3AF' }}
            />
            {t(`issues:status.${status}`, status)}
          </button>
        ))}
      </div>

      <IssueKanbanView issues={filteredIssues} onIssueClick={setSelectedIssue} visibleStatuses={visibleStatuses} />

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

