import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  RefreshCw, Download, CheckCircle, XCircle, AlertTriangle, Loader2,
  ArrowRight, List, ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

/* ── Types ── */

interface AmaProject {
  pjtId: string;
  pjtCode: string;
  pjtName: string;
  pjtStatus: string;
}

interface RedmineProject {
  id: number;
  name: string;
  identifier: string;
  status: number;
}

interface RedmineIssue {
  id: number;
  project: { id: number; name: string };
  tracker: { id: number; name: string };
  status: { id: number; name: string };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  subject: string;
  done_ratio: number;
  updated_on: string;
}

interface RedmineTool {
  id: string;
  name: string;
  url: string;
  hasApiKey: boolean;
}

interface ImportResult {
  batchId: string;
  users: { total: number; mapped: number; unmapped: number };
  projects: { total: number; success: number; failed: number };
  issues: { total: number; success: number; failed: number };
  journals: { total: number; comments: number; statusLogs: number; failed: number };
  errors: string[];
}

/* ── API calls ── */

const entityMigrationApi = {
  getTools: () =>
    apiClient.get('/issues/redmine-migration/tools').then((r) => r.data.data),
  checkConnection: (appId?: string) =>
    apiClient.get('/issues/redmine-migration/connection', { params: appId ? { app_id: appId } : {} }).then((r) => r.data.data),
  fetchProjects: (appId?: string) =>
    apiClient.get('/issues/redmine-migration/projects', { params: appId ? { app_id: appId } : {} }).then((r) => r.data.data),
  fetchIssues: (params: Record<string, string | number>) =>
    apiClient.get('/issues/redmine-migration/issues', { params }).then((r) => r.data.data),
  importSelected: (issueIds: number[], targetProjectId?: string, appId?: string) =>
    apiClient.post('/issues/redmine-migration/import-selected', {
      issue_ids: issueIds,
      ...(targetProjectId ? { target_project_id: targetProjectId } : {}),
      ...(appId ? { app_id: appId } : {}),
    }).then((r) => r.data.data),
  getAmaProjects: () =>
    apiClient.get('/issues/redmine-migration/ama-projects').then((r) => r.data.data),
};

/* ── Page ── */

export default function EntityRedmineMigrationPage() {
  const { t } = useTranslation(['externalTask', 'common']);

  const [activeAppId, setActiveAppId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [statusId, setStatusId] = useState<string>('*');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState<number>(100);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string>('');

  const LIMIT_OPTIONS = [100, 500, 0] as const;

  // Redmine tools query
  const toolsQuery = useQuery({
    queryKey: ['entity-redmine', 'tools'],
    queryFn: entityMigrationApi.getTools,
    staleTime: 60_000,
  });

  const tools: RedmineTool[] = toolsQuery.data || [];

  useEffect(() => {
    if (tools.length > 0 && !activeAppId) {
      setActiveAppId(tools[0].id);
    }
  }, [tools, activeAppId]);

  // Connection status
  const connectionQuery = useQuery({
    queryKey: ['entity-redmine', 'connection', activeAppId],
    queryFn: () => entityMigrationApi.checkConnection(activeAppId),
    staleTime: 60_000,
    enabled: !!activeAppId,
  });

  // AMA projects for target
  const amaProjectsQuery = useQuery({
    queryKey: ['entity-redmine', 'ama-projects'],
    queryFn: () => entityMigrationApi.getAmaProjects(),
    staleTime: 60_000,
  });

  // Redmine Projects
  const projectsQuery = useQuery({
    queryKey: ['entity-redmine', 'projects', activeAppId],
    queryFn: () => entityMigrationApi.fetchProjects(activeAppId),
    staleTime: 300_000,
    enabled: connectionQuery.data?.connected === true,
  });

  // Redmine Issues
  const issuesQuery = useQuery({
    queryKey: ['entity-redmine', 'issues', activeAppId, projectId, statusId, page, limit],
    queryFn: () =>
      entityMigrationApi.fetchIssues({
        ...(projectId ? { project_id: projectId } : {}),
        ...(activeAppId ? { app_id: activeAppId } : {}),
        status_id: statusId,
        offset: limit === 0 ? 0 : page * limit,
        limit: limit === 0 ? 10000 : limit,
        sort: 'updated_on:desc',
      }),
    enabled: connectionQuery.data?.connected === true,
  });

  // Already imported IDs
  const importedQuery = useQuery({
    queryKey: ['entity-redmine', 'imported-ids'],
    queryFn: async () => {
      const res = await apiClient.get('/issues/redmine-migration/imported-issues', {
        params: { limit: 10000 },
      });
      const issues = res.data.data?.issues || [];
      return new Set<number>(
        issues.map((i: any) => i.issRedmineId).filter((id: any) => id != null),
      );
    },
    staleTime: 30_000,
    enabled: connectionQuery.data?.connected === true,
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: () =>
      entityMigrationApi.importSelected(
        Array.from(selectedIds),
        targetProjectId || undefined,
        activeAppId || undefined,
      ),
    onSuccess: (data) => {
      setImportResult(data);
      setSelectedIds(new Set());
      importedQuery.refetch();
      amaProjectsQuery.refetch();
    },
  });

  const importedIds = importedQuery.data || new Set<number>();
  const issues: RedmineIssue[] = issuesQuery.data?.issues || [];
  const totalCount: number = issuesQuery.data?.totalCount || 0;
  const totalPages = limit === 0 ? 1 : Math.ceil(totalCount / limit);
  const projects: RedmineProject[] = projectsQuery.data?.projects || [];
  const amaProjects: AmaProject[] = amaProjectsQuery.data || [];

  const selectableOnPage = issues.filter((i) => !importedIds.has(i.id));
  const allOnPageSelected = selectableOnPage.length > 0 &&
    selectableOnPage.every((i) => selectedIds.has(i.id));
  const totalSelectable = totalCount - (importedIds.size || 0);

  const connected = connectionQuery.data?.connected === true;

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const selectableIds = issues
      .filter((i) => !importedIds.has(i.id))
      .map((i) => i.id);
    const allSelected = selectableIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.delete(id));
        return next;
      });
      setSelectAllMode(false);
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [issues, importedIds, selectedIds]);

  const handleSelectAllIssues = useCallback(() => {
    const allSelectableIds = issues
      .filter((i) => !importedIds.has(i.id))
      .map((i) => i.id);
    setSelectedIds(new Set(allSelectableIds));
    setSelectAllMode(true);
  }, [issues, importedIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAllMode(false);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
    setSelectedIds(new Set());
    setSelectAllMode(false);
  }, []);

  const trackerEmoji: Record<string, string> = {
    Bug: '🐛',
    Feature: '✨',
    Support: '💬',
    Task: '📋',
  };

  // No Redmine tools configured
  if (toolsQuery.isSuccess && tools.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Download className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('externalTask:redmineMigration.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('externalTask:redmineMigration.subtitle')}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
            <p className="text-sm font-medium text-amber-800 mb-2">
              {t('externalTask:redmineMigration.noTools')}
            </p>
            <Link
              to="/entity-settings/external-task-tools"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <ExternalLink className="h-4 w-4" />
              {t('externalTask:redmineMigration.goToSettings')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Download className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('externalTask:redmineMigration.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('externalTask:redmineMigration.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/issues/redmine-imported"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
            >
              <List className="h-3.5 w-3.5" />
              {t('externalTask:redmineMigration.viewImported')}
            </Link>

            {/* Tool selector (if multiple) */}
            {tools.length > 1 && (
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                value={activeAppId}
                onChange={(e) => setActiveAppId(e.target.value)}
              >
                {tools.map((tool) => (
                  <option key={tool.id} value={tool.id}>{tool.name}</option>
                ))}
              </select>
            )}

            {connectionQuery.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : connected ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('externalTask:settings.connected')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {t('externalTask:settings.disconnected')}
              </span>
            )}
          </div>
        </div>

        {!connected && !connectionQuery.isLoading && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            {t('externalTask:redmineMigration.noConnection')}
            <Link
              to="/entity-settings/external-task-tools"
              className="ml-2 font-medium text-indigo-600 underline hover:text-indigo-800"
            >
              {t('externalTask:redmineMigration.goToSettings')}
            </Link>
          </div>
        )}

        {connected && (
          <>
            {/* Filters: Source + Target */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Source */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</span>
                  <select
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    value={projectId}
                    onChange={(e) => { setProjectId(e.target.value); setPage(0); setSelectedIds(new Set()); setSelectAllMode(false); }}
                  >
                    <option value="">{t('externalTask:redmineMigration.allProjects')}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    value={statusId}
                    onChange={(e) => { setStatusId(e.target.value); setPage(0); setSelectedIds(new Set()); setSelectAllMode(false); }}
                  >
                    <option value="*">{t('externalTask:redmineMigration.allStatuses')}</option>
                    <option value="open">{t('externalTask:redmineMigration.statusOpen')}</option>
                    <option value="closed">{t('externalTask:redmineMigration.statusClosed')}</option>
                  </select>
                </div>

                <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />

                {/* Target */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</span>
                  <select
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                  >
                    <option value="">{t('externalTask:redmineMigration.autoCreateProject')}</option>
                    {amaProjects.map((p) => (
                      <option key={p.pjtId} value={p.pjtId}>
                        [{p.pjtCode}] {p.pjtName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => { issuesQuery.refetch(); importedQuery.refetch(); }}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className={`h-4 w-4 ${issuesQuery.isFetching ? 'animate-spin' : ''}`} />
                  {t('externalTask:redmineMigration.refresh')}
                </button>
              </div>
            </div>

            {/* Page size */}
            <div className="mb-3 flex items-center gap-3">
              <span className="text-xs text-gray-500">{t('externalTask:redmineMigration.rowsPerPage')}:</span>
              <div className="flex items-center rounded-lg border border-gray-200 bg-white">
                {LIMIT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleLimitChange(opt)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                      limit === opt
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt === 0 ? t('externalTask:redmineMigration.allRows') : opt}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {t('externalTask:redmineMigration.totalLabel')}{' '}
                <strong>{totalCount}</strong>
              </span>
            </div>

            {/* Select-all banner */}
            {allOnPageSelected && selectableOnPage.length > 0 && !selectAllMode && selectableOnPage.length < totalSelectable && (
              <div className="mb-3 rounded-lg bg-indigo-50 px-4 py-2.5 text-center text-sm text-indigo-700">
                {t('externalTask:redmineMigration.allOnPageSelected', { count: selectableOnPage.length })}
                {' '}
                <button
                  onClick={handleSelectAllIssues}
                  className="font-semibold underline hover:text-indigo-900"
                >
                  {t('externalTask:redmineMigration.selectAllIssues', { count: totalSelectable })}
                </button>
              </div>
            )}
            {selectAllMode && (
              <div className="mb-3 rounded-lg bg-indigo-100 px-4 py-2.5 text-center text-sm text-indigo-700">
                {t('externalTask:redmineMigration.allIssuesSelected', { count: selectedIds.size })}
                {' '}
                <button
                  onClick={handleClearSelection}
                  className="font-semibold underline hover:text-indigo-900"
                >
                  {t('externalTask:redmineMigration.clearSelection')}
                </button>
              </div>
            )}

            {/* Issues table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        onChange={toggleSelectAll}
                        checked={
                          issues.filter((i) => !importedIds.has(i.id)).length > 0 &&
                          issues.filter((i) => !importedIds.has(i.id)).every((i) => selectedIds.has(i.id))
                        }
                      />
                    </th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">#</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colType')}</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colSubject')}</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colAssignee')}</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colStatus')}</th>
                    <th className="px-3 py-3 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colUpdated')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {issuesQuery.isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </td>
                    </tr>
                  ) : issues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        {t('externalTask:redmineMigration.noIssues')}
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => {
                      const imported = importedIds.has(issue.id);
                      return (
                        <tr
                          key={issue.id}
                          className={`transition-colors ${imported ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-3 py-2.5">
                            {imported ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedIds.has(issue.id)}
                                onChange={() => toggleSelect(issue.id)}
                              />
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                            #{issue.id}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="whitespace-nowrap text-xs">
                              {trackerEmoji[issue.tracker.name] || '📌'}{' '}
                              {issue.tracker.name}
                            </span>
                          </td>
                          <td className="max-w-xs truncate px-3 py-2.5 font-medium text-gray-900">
                            {issue.subject}
                            {imported && (
                              <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                {t('externalTask:redmineMigration.imported')}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-600">
                            {issue.assigned_to?.name || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {issue.status.name}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500">
                            {new Date(issue.updated_on).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination + Action */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  {t('externalTask:redmineMigration.selected')}{' '}
                  <strong>{selectedIds.size}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    <span className="px-2 text-xs text-gray-600">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                )}

                <button
                  disabled={selectedIds.size === 0 || importMutation.isPending}
                  onClick={() => importMutation.mutate()}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {t('externalTask:redmineMigration.importSelected')} ({selectedIds.size})
                </button>
              </div>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  {t('externalTask:redmineMigration.importResult')}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('externalTask:redmineMigration.resultSuccess')}: </span>
                    <strong className="text-emerald-700">{importResult.issues.success}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('externalTask:redmineMigration.resultSkipped')}: </span>
                    <strong className="text-amber-600">
                      {importResult.issues.total - importResult.issues.success - importResult.issues.failed}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('externalTask:redmineMigration.resultFailed')}: </span>
                    <strong className="text-red-600">{importResult.issues.failed}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('externalTask:redmineMigration.resultComments')}: </span>
                    <strong>{importResult.journals.comments}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('externalTask:redmineMigration.resultStatusLogs')}: </span>
                    <strong>{importResult.journals.statusLogs}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('externalTask:redmineMigration.batchId')}: </span>
                    <code className="text-xs text-gray-500">{importResult.batchId.slice(0, 8)}</code>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-3 rounded-lg bg-red-50 p-3">
                    <p className="mb-1 text-xs font-medium text-red-700">
                      <XCircle className="mr-1 inline h-3 w-3" />
                      {t('externalTask:redmineMigration.errors')}:
                    </p>
                    <ul className="list-inside list-disc text-xs text-red-600">
                      {importResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
