import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Users, Bug } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjectList } from '../hooks/useProject';
import ProjectStatusBadge from '../components/ProjectStatusBadge';

export default function ProjectListPage() {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('latest_issue');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const debouncedSearch = useDebounce(searchInput, 500);

  const { data: allProjects = [], isLoading } = useProjectList({
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
    sort: sortBy !== 'latest' ? sortBy : undefined,
    scope,
  });

  // Active projects = APPROVED, IN_PROGRESS, ON_HOLD, COMPLETED
  const activeStatuses = ['APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
  const projects = allProjects.filter((p) => activeStatuses.includes(p.status));

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="flex gap-3 mb-4">
        {/* Scope Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 shrink-0">
          {(['mine', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                scope === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'mine' ? t('scope.mine', { defaultValue: '내 프로젝트' }) : t('scope.all', { defaultValue: '전체 프로젝트' })}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('actions.search')}
            className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="latest">{t('sort.latest')}</option>
          <option value="most_issues">{t('sort.mostIssues')}</option>
          <option value="latest_issue">{t('sort.latestIssue')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t('filter.all')}</option>
          {['APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t('empty.projects')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div
              key={p.projectId}
              onClick={() => navigate(`/project/projects/${p.projectId}`)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              {/* 상단: 코드 + 상태 */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">{p.code}</span>
                <ProjectStatusBadge status={p.status} />
              </div>

              {/* 프로젝트명 */}
              <p className="mb-3 text-sm font-semibold text-gray-900 line-clamp-2">{p.name}</p>

              {/* 카테고리 */}
              {p.category && (
                <span className="mb-3 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {t(`category.${p.category}`)}
                </span>
              )}

              {/* 매니저 */}
              <div className="mb-3 text-xs text-gray-500">
                <span className="text-gray-400">{t('project.manager')}:</span>{' '}
                <span className="font-medium text-gray-700">{p.managerName || '-'}</span>
              </div>

              {/* 하단: 멤버수 + 이슈수 */}
              <div className="flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium text-gray-700">{p.memberCount ?? 0}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bug className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium text-gray-700">{p.issueCount ?? 0}</span>
                  {(p.openIssueCount ?? 0) > 0 && (
                    <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                      {p.openIssueCount}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
