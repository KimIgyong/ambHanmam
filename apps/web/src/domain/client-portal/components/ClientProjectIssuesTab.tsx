import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const PAGE_SIZE = 30;

export default function ClientProjectIssuesTab({ projectId }: { projectId: string }) {
  const { t } = useTranslation('clientPortal');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [includeClosed, setIncludeClosed] = useState(false);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams: Record<string, unknown> = {
    page: currentPage,
    size: PAGE_SIZE,
    sort: sortBy,
  };
  if (statusFilter !== 'all') queryParams.status = statusFilter;
  if (!includeClosed && statusFilter === 'all') queryParams.exclude_closed = 'true';
  if (searchQuery) queryParams.search = searchQuery;

  const { data, isLoading } = useQuery({
    queryKey: ['client-project-issues', projectId, currentPage, statusFilter, includeClosed, sortBy, searchQuery],
    queryFn: () => clientPortalApiService.getProjectIssues(projectId, queryParams),
    enabled: !!projectId,
  });

  const issues: ClientIssue[] = data?.data || [];
  const pagination = data?.pagination || { page: 1, size: PAGE_SIZE, total: 0, totalPages: 1 };

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearch}
            placeholder={t('project.searchIssues')}
            className="rounded-md border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none w-52"
          />
        </div>

        {/* 상태 필터 */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">{t('project.allStatuses')}</option>
          <option value="OPEN">OPEN</option>
          <option value="APPROVED">APPROVED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        {/* Closed 포함 토글 */}
        {statusFilter === 'all' && (
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeClosed}
              onChange={(e) => { setIncludeClosed(e.target.checked); setCurrentPage(1); }}
              className="rounded border-gray-300 h-3.5 w-3.5"
            />
            {t('project.includeClosed')}
          </label>
        )}

        {/* 정렬 */}
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="latest">{t('project.sortLatest')}</option>
          <option value="status">{t('project.sortStatus')}</option>
          <option value="priority">{t('project.sortPriority')}</option>
        </select>

        <span className="text-sm text-gray-500">
          {pagination.total} {t('project.totalIssues').toLowerCase()}
        </span>

        <div className="ml-auto">
          <Link
            to={`/client/issues/new?project_id=${projectId}`}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('issue.newIssue')}
          </Link>
        </div>
      </div>

      {/* 이슈 테이블 */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('issue.noIssues')}</div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issue.type')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issue.subject')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issue.status')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issue.priority')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issue.reporter')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issue.assignee')}</th>
                <th className="px-4 py-2.5 font-medium text-gray-600">{t('issue.createdAt')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/client/issues/${issue.id}`)}
                >
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-medium">{issue.type}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900 max-w-xs truncate">{issue.title}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] || ''}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${SEVERITY_COLORS[issue.severity] || ''}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{issue.reporterName || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{issue.assigneeName || '-'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-500">
            {(pagination.page - 1) * pagination.size + 1}-{Math.min(pagination.page * pagination.size, pagination.total)} / {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 2)
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
                      currentPage === p
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="rounded p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
