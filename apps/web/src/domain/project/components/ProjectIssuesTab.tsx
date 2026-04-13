import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Link2, Check, Download, ArrowUpDown } from 'lucide-react';
import { projectApiService } from '../service/project.service';
import { IssueResponse } from '@amb/types';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import MultiSelectFilter from '@/components/common/MultiSelectFilter';
import IssueDetailModal from '@/domain/issues/components/IssueDetailModal';
import IssueFormModal from '@/domain/issues/components/IssueFormModal';
import IssueDeleteConfirmModal from '@/domain/issues/components/IssueDeleteConfirmModal';
import { useUpdateIssue, useDeleteIssue, useCreateIssue } from '@/domain/issues/hooks/useIssues';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import ProjectIssueImportModal from './ProjectIssueImportModal';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600',
  MAJOR: 'text-orange-600',
  MINOR: 'text-yellow-600',
};

interface ProjectIssuesTabProps {
  projectId: string;
}

export default function ProjectIssuesTab({ projectId }: ProjectIssuesTabProps) {
  const { t } = useTranslation(['project', 'issues']);
  const queryClient = useQueryClient();
  const isMaster = useAuthStore((s) => s.isMaster());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED']));
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set(['BUG', 'FEATURE_REQUEST', 'TASK', 'OPINION', 'OTHER']));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueResponse | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<IssueResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [refCopiedId, setRefCopiedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'created_desc' | 'due_date_desc' | 'due_date_asc' | 'priority_asc'>('created_desc');

  const handleCopyIssueRefLink = (e: React.MouseEvent, issue: IssueResponse) => {
    e.stopPropagation();
    const url = `${window.location.origin}/issues?id=${issue.issueId}`;
    const copyText = issue.refNumber
      ? `[${issue.refNumber}] ${issue.title}\n${url}`
      : url;
    navigator.clipboard.writeText(copyText).then(() => {
      setRefCopiedId(issue.issueId);
      toast.success(t('issues:link.copied'));
      setTimeout(() => setRefCopiedId(null), 2000);
    });
  };

  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const createIssue = useCreateIssue();

  const { data, isLoading } = useQuery({
    queryKey: ['projects', projectId, 'issues'],
    queryFn: () =>
      projectApiService.getProjectIssues(projectId, {
        size: 500,
      }),
    enabled: !!projectId,
  });

  const allIssues: IssueResponse[] = data?.data || [];
  const totalCount = data?.totalCount || 0;

  // 실제 이슈 데이터에서 상태 목록 추출 (존재하는 상태만)
  const STATUS_ORDER = ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'];
  const availableStatuses = STATUS_ORDER.filter(s => allIssues.some(i => i.status === s));
  const TYPE_LIST = ['BUG', 'FEATURE_REQUEST', 'TASK', 'OPINION', 'OTHER'];

  const statusOptions = availableStatuses.map(s => ({ value: s, label: t(`issues:status.${s}`, s) }));
  const typeOptions = TYPE_LIST.map(tp => ({ value: tp, label: t(`issues:type.${tp}`, tp) }));

  // 클라이언트 필터링 + 정렬
  const issues = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = allIssues.filter(i => {
      if (!statusFilter.has(i.status)) return false;
      if (!typeFilter.has(i.type)) return false;
      if (query) {
        const searchable = [
          i.title,
          i.refNumber,
          i.assignee,
          i.reporterName,
          i.description,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
    // 정렬
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'due_date_desc': {
          if (!a.dueDate && !b.dueDate) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        case 'due_date_asc': {
          if (!a.dueDate && !b.dueDate) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        case 'priority_asc':
          return a.priority !== b.priority
            ? a.priority - b.priority
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allIssues, statusFilter, typeFilter, searchQuery, sortBy]);

  // 페이징
  const totalPages = Math.max(1, Math.ceil(issues.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedIssues = issues.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={t('issues:actions.search', '이슈 검색...')}
            className="rounded-md border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none w-52"
          />
        </div>
        <MultiSelectFilter
          options={statusOptions}
          selected={statusFilter}
          onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
          placeholder={t('project:filter.statusFilter')}
          selectAllLabel={t('project:filter.selectAll')}
          deselectAllLabel={t('project:filter.deselectAll')}
        />
        <MultiSelectFilter
          options={typeOptions}
          selected={typeFilter}
          onChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}
          placeholder={t('project:filter.typeFilter')}
          selectAllLabel={t('project:filter.selectAll')}
          deselectAllLabel={t('project:filter.deselectAll')}
        />
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setCurrentPage(1); }}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="created_desc">{t('project:sort.createdDesc')}</option>
            <option value="due_date_desc">{t('project:sort.dueDateDesc')}</option>
            <option value="due_date_asc">{t('project:sort.dueDateAsc')}</option>
            <option value="priority_asc">{t('project:sort.priorityAsc')}</option>
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {issues.length !== totalCount
            ? `${issues.length} / ${totalCount}`
            : t('project:issueList.totalCount', { count: totalCount })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            {t('project:issueList.importIssues', '이슈 가져오기')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('issues:actions.addIssue', '이슈 등록')}
          </button>
        </div>
      </div>

      {/* 이슈 테이블 */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {t('project:issueList.noIssues')}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium text-gray-600 w-16">#</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issues:form.type', 'Type')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issues:form.title', 'Title')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issues:status.title', 'Status')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issues:form.severity', 'Severity')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issues:detail.assignee', 'Assignee')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issues:detail.dueDate', 'Due Date')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issues:detail.createdAt', 'Created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedIssues.map((issue: IssueResponse) => (
                <tr
                  key={issue.issueId}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedIssue(issue)}
                >
                  <td className="px-4 py-2.5">
                    {issue.refNumber && (
                      <button
                        onClick={(e) => handleCopyIssueRefLink(e, issue)}
                        className="inline-flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-indigo-600 transition-colors"
                        title={t('issues:link.copyRefLink')}
                      >
                        {refCopiedId === issue.issueId ? <Check className="h-3 w-3 text-green-500" /> : <Link2 className="h-3 w-3" />}
                        {issue.refNumber}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-medium">{t(`issues:type.${issue.type}`, issue.type)}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900 max-w-xs truncate">{issue.title}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] || ''}`}>
                      {t(`issues:status.${issue.status}`, issue.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${SEVERITY_COLORS[issue.severity] || ''}`}>
                      {t(`issues:severity.${issue.severity}`, issue.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{issue.assignee || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{issue.dueDate ? <LocalDateTime value={issue.dueDate} format='YYYY-MM-DD' /> : '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{<LocalDateTime value={issue.createdAt} format='YYYY-MM-DD' />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {issues.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-500">
            {t('project:issueList.pageInfo', {
              from: (safePage - 1) * PAGE_SIZE + 1,
              to: Math.min(safePage * PAGE_SIZE, issues.length),
              total: issues.length,
            })}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              {t('project:issueList.prev')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('dots');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'dots' ? (
                  <span key={`dots-${idx}`} className="px-1 text-xs text-gray-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${
                      safePage === p
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              {t('project:issueList.next')}
            </button>
          </div>
        </div>
      )}

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

      {showCreateModal && (
        <IssueFormModal
          isOpen={showCreateModal}
          editingIssue={null}
          defaultProjectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(formData) => {
            const { resolution, ...createData } = formData;
            createIssue.mutate({ ...createData, description: createData.description || '-' }, {
              onSuccess: () => {
                toast.success(t('issues:messages.created'));
                setShowCreateModal(false);
                invalidate();
              },
            });
          }}
        />
      )}

      <ProjectIssueImportModal
        projectId={projectId}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={invalidate}
      />
    </div>
  );
}
