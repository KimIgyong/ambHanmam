import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Plus, List, Columns3, BarChart3 } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import { toast } from 'sonner';
import { IssueResponse } from '@amb/types';
import {
  useIssueList,
  useIssueDetail,
  useCreateIssue,
  useUpdateIssue,
  useDeleteIssue,
  usePermanentDeleteIssue,
} from '../hooks/useIssues';
import IssueFilters from '../components/IssueFilters';
import IssueListView from '../components/IssueListView';
import IssueFormModal from '../components/IssueFormModal';
import IssueDetailModal from '../components/IssueDetailModal';
import IssueDeleteConfirmModal from '../components/IssueDeleteConfirmModal';
import { useAuthStore } from '@/domain/auth/store/auth.store';

const IssueKanbanView = lazy(() => import('../components/IssueKanbanView'));
const IssueGanttView = lazy(() => import('../components/IssueGanttView'));

type ViewTab = 'list' | 'kanban' | 'gantt';

const TABS: { key: ViewTab; icon: React.ElementType; labelKey: string }[] = [
  { key: 'list', icon: List, labelKey: 'issues:tabs.list' },
  { key: 'kanban', icon: Columns3, labelKey: 'issues:tabs.kanban' },
  { key: 'gantt', icon: BarChart3, labelKey: 'issues:tabs.gantt' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

export default function IssuesPage() {
  const { t } = useTranslation(['issues', 'common']);
  const isMaster = useAuthStore((s) => s.isMaster());
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<ViewTab>('list');
  const [filters, setFilters] = useState<{
    type?: string;
    status?: string;
    severity?: string;
    priority?: string;
    search?: string;
    project_id?: string;
    scope?: string;
    reporter_id?: string;
    cell_id?: string;
  }>({ status: 'OPEN,APPROVED,IN_PROGRESS,TEST,REOPEN,RESOLVED' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // For kanban/gantt, load more issues; for list, use pagination
  const isListView = activeTab === 'list';
  const querySize = isListView ? pageSize : 999;
  const { data, isLoading } = useIssueList({ ...filters, page: isListView ? page : 1, size: querySize });
  const issues = data?.data || [];
  const totalCount = data?.totalCount || 0;

  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const permanentDeleteIssue = usePermanentDeleteIssue();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueResponse | null>(null);
  const [detailIssue, setDetailIssue] = useState<IssueResponse | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<IssueResponse | null>(null);

  // 검색 결과에서 바로가기: ?id=xxx 쿼리 파라미터로 상세 모달 자동 열기
  const deepLinkId = searchParams.get('id');
  const { data: deepLinkIssue } = useIssueDetail(deepLinkId);

  useEffect(() => {
    if (deepLinkId && deepLinkIssue && !detailIssue) {
      setDetailIssue(deepLinkIssue as IssueResponse);
      setSearchParams({}, { replace: true });
    }
  }, [deepLinkId, deepLinkIssue, detailIssue, setSearchParams]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleFormSubmit = (formData: {
    type: string;
    title: string;
    description?: string;
    severity: string;
    priority: number;
    affected_modules?: string[];
    assignee_id?: string | null;
    resolution?: string;
    project_id?: string;
    start_date?: string;
    due_date?: string;
    done_ratio?: number;
    parent_issue_id?: string;
    google_drive_link?: string;
  }) => {
    if (editingIssue) {
      updateIssue.mutate(
        { id: editingIssue.issueId, data: formData },
        {
          onSuccess: () => {
            toast.success(t('issues:messages.updated'));
            setShowFormModal(false);
            setEditingIssue(null);
            if (detailIssue && detailIssue.issueId === editingIssue.issueId) {
              setDetailIssue(null);
            }
          },
        },
      );
    } else {
      const { resolution, ...createData } = formData;
      createIssue.mutate({ ...createData, description: createData.description || '-' }, {
        onSuccess: () => {
          toast.success(t('issues:messages.created'));
          setShowFormModal(false);
        },
      });
    }
  };

  const handleEdit = (issue: IssueResponse) => {
    setEditingIssue(issue);
    setShowFormModal(true);
    setDetailIssue(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingIssue) {
      deleteIssue.mutate(deletingIssue.issueId, {
        onSuccess: () => {
          toast.success(t('issues:messages.deleted'));
          setDeletingIssue(null);
          if (detailIssue && detailIssue.issueId === deletingIssue.issueId) {
            setDetailIssue(null);
          }
        },
      });
    }
  };

  const handlePermanentDelete = () => {
    if (deletingIssue) {
      permanentDeleteIssue.mutate(deletingIssue.issueId, {
        onSuccess: () => {
          toast.success(t('issues:messages.permanentDeleted'));
          setDeletingIssue(null);
          if (detailIssue && detailIssue.issueId === deletingIssue.issueId) {
            setDetailIssue(null);
          }
        },
      });
    }
  };

  // 삭제 권한 계산
  const isMasterOrAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN';
  const canSoftDelete = (() => {
    if (!deletingIssue) return false;
    if (isMasterOrAdmin) return true;
    // 생성자 + assignee 없음
    if (deletingIssue.reporterId === user?.userId && !deletingIssue.assigneeId) return true;
    // PM
    if (deletingIssue.projectId && deletingIssue.projectManagerId === user?.userId) return true;
    return false;
  })();
  const canPermanentDelete = isMaster;

  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <PageTitle>{t('issues:title')}</PageTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingIssue(null);
                setShowFormModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('issues:addIssue')}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-4 flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          {TABS.map(({ key, icon: Icon, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </button>
          ))}
        </div>

        <IssueFilters filters={filters} onChange={handleFilterChange} />

        {/* View content */}
        {activeTab === 'list' && (
          <IssueListView
            issues={issues}
            totalPages={totalPages}
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            onIssueClick={setDetailIssue}
          />
        )}

        {activeTab === 'kanban' && (
          <Suspense fallback={<div className="py-12 text-center text-gray-400">{t('common:loading')}</div>}>
            <IssueKanbanView issues={issues} onIssueClick={setDetailIssue} />
          </Suspense>
        )}

        {activeTab === 'gantt' && (
          <Suspense fallback={<div className="py-12 text-center text-gray-400">{t('common:loading')}</div>}>
            <IssueGanttView issues={issues} onIssueClick={setDetailIssue} />
          </Suspense>
        )}

        <IssueFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingIssue(null);
          }}
          onSubmit={handleFormSubmit}
          editingIssue={editingIssue}
        />

        {detailIssue && (
          <IssueDetailModal
            issue={detailIssue}
            onClose={() => setDetailIssue(null)}
            onEdit={handleEdit}
            onDelete={(issue) => {
              setDeletingIssue(issue);
              setDetailIssue(null);
            }}
          />
        )}

        <IssueDeleteConfirmModal
          isOpen={!!deletingIssue}
          onClose={() => setDeletingIssue(null)}
          onConfirm={handleDeleteConfirm}
          onPermanentDelete={handlePermanentDelete}
          canSoftDelete={canSoftDelete}
          canPermanentDelete={canPermanentDelete}
        />
      </div>
    </div>
  );
}
