import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { clientPortalApiService } from '../service/client-portal.service';

interface ClientIssue {
  id: string;
  type: string;
  title: string;
  severity: string;
  status: string;
  priority: number;
  reporterName: string | null;
  assigneeName: string | null;
  doneRatio: number;
  createdAt: string;
}

const STATUS_ORDER = ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'];

const STATUS_CHIP_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
  TEST: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  REOPEN: 'bg-amber-100 text-amber-700 border-amber-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'border-l-red-500',
  MAJOR: 'border-l-orange-500',
  MINOR: 'border-l-yellow-500',
  LOW: 'border-l-green-500',
};

const DEFAULT_VISIBLE = new Set(['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED']);

export default function ClientProjectKanbanTab({ projectId }: { projectId: string }) {
  const { t } = useTranslation('clientPortal');
  const navigate = useNavigate();
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(DEFAULT_VISIBLE);

  const { data, isLoading } = useQuery({
    queryKey: ['client-project-issues', projectId, 'kanban'],
    queryFn: () => clientPortalApiService.getProjectIssues(projectId, { size: 500 }),
    enabled: !!projectId,
  });

  const allIssues: ClientIssue[] = data?.data || [];

  const columns = useMemo(() => {
    const grouped: Record<string, ClientIssue[]> = {};
    STATUS_ORDER.forEach((s) => { grouped[s] = []; });
    allIssues.forEach((i) => {
      if (!grouped[i.status]) grouped[i.status] = [];
      grouped[i.status].push(i);
    });
    return STATUS_ORDER
      .filter((s) => visibleStatuses.has(s))
      .map((s) => ({ status: s, issues: grouped[s] || [] }));
  }, [allIssues, visibleStatuses]);

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

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <>
      {/* 상태 필터 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">{t('project.filterStatus')}:</span>
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
            {status}
          </button>
        ))}
      </div>

      {/* 칸반 보드 */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
        {columns.map(({ status, issues }) => (
          <div key={status} className="flex-shrink-0 w-72">
            <div className={`rounded-t-lg px-3 py-2 text-xs font-semibold ${STATUS_CHIP_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
              {status} ({issues.length})
            </div>
            <div className="space-y-2 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-2 min-h-[350px]">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:shadow-sm border-l-4 ${
                    SEVERITY_COLORS[issue.severity] || 'border-l-gray-300'
                  }`}
                  onClick={() => navigate(`/client/issues/${issue.id}`)}
                >
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{issue.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{issue.type}</span>
                    <span>P{issue.priority}</span>
                  </div>
                  {issue.assigneeName && (
                    <p className="mt-1 text-xs text-gray-400">{issue.assigneeName}</p>
                  )}
                  {issue.doneRatio > 0 && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-gray-200">
                        <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${issue.doneRatio}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {issues.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-8">{t('issue.noIssues')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
