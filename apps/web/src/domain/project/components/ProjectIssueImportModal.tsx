import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  RefreshCw, Download, CheckCircle, XCircle, AlertTriangle,
  Loader2, X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { externalTaskImportService } from '@/domain/external-task-import/service/external-task-import.service';
import type { ExternalProject, ExternalGroup, ExternalTask, ExternalProviderMeta } from '@amb/types';

/* ── Redmine Types ── */

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

/* ── Redmine API ── */

const migrationApi = {
  getTools: () =>
    apiClient.get('/issues/redmine-migration/tools').then((r) => r.data.data),
  checkConnection: (appId?: string) =>
    apiClient.get('/issues/redmine-migration/connection', { params: appId ? { app_id: appId } : {} }).then((r) => r.data.data),
  fetchProjects: (appId?: string) =>
    apiClient.get('/issues/redmine-migration/projects', { params: appId ? { app_id: appId } : {} }).then((r) => r.data.data),
  fetchIssues: (params: Record<string, string | number>) =>
    apiClient.get('/issues/redmine-migration/issues', { params }).then((r) => r.data.data),
  importSelected: (issueIds: number[], targetProjectId: string, appId?: string) =>
    apiClient.post('/issues/redmine-migration/import-selected', {
      issue_ids: issueIds,
      target_project_id: targetProjectId,
      ...(appId ? { app_id: appId } : {}),
    }).then((r) => r.data.data),
};

/* ── Source type ── */
type ImportSource = 'redmine' | 'asana';

/* ── Props ── */

interface ProjectIssueImportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

/* ── Component ── */

export default function ProjectIssueImportModal({
  projectId,
  isOpen,
  onClose,
  onImported,
}: ProjectIssueImportModalProps) {
  const { t } = useTranslation(['externalTask', 'common']);
  const [activeSource, setActiveSource] = useState<ImportSource | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12">
      <div className="relative w-full max-w-5xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
              <Download className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {t('externalTask:projectImport.title')}
              </h2>
              <p className="text-xs text-gray-500">
                {t('externalTask:projectImport.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Source Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex gap-4">
            {(['redmine', 'asana'] as const).map((src) => (
              <button
                key={src}
                onClick={() => setActiveSource(src)}
                className={`border-b-2 px-1 py-2.5 text-sm font-medium transition-colors ${
                  activeSource === src
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t(`externalTask:provider.${src}`)}
              </button>
            ))}
          </nav>
        </div>

        {/* Body */}
        <div className="max-h-[calc(100vh-240px)] overflow-y-auto px-6 py-4">
          {activeSource === null && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Download className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">{t('externalTask:projectImport.selectSource')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('externalTask:projectImport.selectSourceDesc')}</p>
            </div>
          )}
          {activeSource === 'redmine' && (
            <RedmineImportContent projectId={projectId} onImported={onImported} onClose={onClose} />
          )}
          {activeSource === 'asana' && (
            <AsanaImportContent projectId={projectId} onImported={onImported} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Redmine Import Content (기존 코드)
   ══════════════════════════════════════════════════ */

function RedmineImportContent({
  projectId,
  onImported,
  onClose,
}: { projectId: string; onImported?: () => void; onClose: () => void }) {
  const { t } = useTranslation(['externalTask', 'common']);

  const [activeAppId, setActiveAppId] = useState<string>('');
  const [redmineProjectId, setRedmineProjectId] = useState<string>('');
  const [statusId, setStatusId] = useState<string>('*');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState<number>(100);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectAllMode, setSelectAllMode] = useState(false);

  const LIMIT_OPTIONS = [100, 500, 0] as const;

  const toolsQuery = useQuery({
    queryKey: ['project-import', 'redmine-tools'],
    queryFn: migrationApi.getTools,
    staleTime: 60_000,
  });

  const tools: RedmineTool[] = toolsQuery.data || [];

  useEffect(() => {
    if (tools.length > 0 && !activeAppId) {
      setActiveAppId(tools[0].id);
    }
  }, [tools, activeAppId]);

  const connectionQuery = useQuery({
    queryKey: ['project-import', 'redmine-connection', activeAppId],
    queryFn: () => migrationApi.checkConnection(activeAppId),
    staleTime: 60_000,
    enabled: !!activeAppId,
  });

  const connected = connectionQuery.data?.connected === true;

  const projectsQuery = useQuery({
    queryKey: ['project-import', 'redmine-projects', activeAppId],
    queryFn: () => migrationApi.fetchProjects(activeAppId),
    staleTime: 300_000,
    enabled: connected,
  });

  const issuesQuery = useQuery({
    queryKey: ['project-import', 'redmine-issues', activeAppId, redmineProjectId, statusId, page, limit],
    queryFn: () =>
      migrationApi.fetchIssues({
        ...(redmineProjectId ? { project_id: redmineProjectId } : {}),
        ...(activeAppId ? { app_id: activeAppId } : {}),
        status_id: statusId,
        offset: limit === 0 ? 0 : page * limit,
        limit: limit === 0 ? 10000 : limit,
        sort: 'updated_on:desc',
      }),
    enabled: connected,
  });

  const importedQuery = useQuery({
    queryKey: ['project-import', 'redmine-imported-ids'],
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
    enabled: connected,
  });

  const importMutation = useMutation({
    mutationFn: () =>
      migrationApi.importSelected(
        Array.from(selectedIds),
        projectId,
        activeAppId || undefined,
      ),
    onSuccess: (data) => {
      setImportResult(data);
      setSelectedIds(new Set());
      importedQuery.refetch();
      onImported?.();
    },
  });

  const importedIds = importedQuery.data || new Set<number>();
  const issues: RedmineIssue[] = issuesQuery.data?.issues || [];
  const totalCount: number = issuesQuery.data?.totalCount || 0;
  const totalPages = limit === 0 ? 1 : Math.ceil(totalCount / limit);
  const projects: RedmineProject[] = projectsQuery.data?.projects || [];

  const selectableOnPage = issues.filter((i) => !importedIds.has(i.id));
  const allOnPageSelected = selectableOnPage.length > 0 &&
    selectableOnPage.every((i) => selectedIds.has(i.id));
  const totalSelectable = totalCount - (importedIds.size || 0);

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

  /* No tools */
  if (toolsQuery.isSuccess && tools.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <p className="text-sm font-medium text-amber-800 mb-2">
          {t('externalTask:redmineMigration.noTools')}
        </p>
        <Link
          to="/entity-settings/external-task-tools"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('externalTask:redmineMigration.goToSettings')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Tool selector + Connection status */}
      <div className="mb-4 flex items-center gap-3">
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

      {/* Not connected */}
      {!connected && !connectionQuery.isLoading && tools.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {t('externalTask:redmineMigration.noConnection')}
          <Link
            to="/entity-settings/external-task-tools"
            onClick={onClose}
            className="ml-2 font-medium text-indigo-600 underline hover:text-indigo-800"
          >
            {t('externalTask:redmineMigration.goToSettings')}
          </Link>
        </div>
      )}

      {/* Connected content */}
      {connected && (
        <>
          {/* Source filter */}
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</span>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                value={redmineProjectId}
                onChange={(e) => { setRedmineProjectId(e.target.value); setPage(0); setSelectedIds(new Set()); setSelectAllMode(false); }}
              >
                <option value="">{t('externalTask:redmineMigration.allProjects')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                value={statusId}
                onChange={(e) => { setStatusId(e.target.value); setPage(0); setSelectedIds(new Set()); setSelectAllMode(false); }}
              >
                <option value="*">{t('externalTask:redmineMigration.allStatuses')}</option>
                <option value="open">{t('externalTask:redmineMigration.statusOpen')}</option>
                <option value="closed">{t('externalTask:redmineMigration.statusClosed')}</option>
              </select>

              <button
                onClick={() => { issuesQuery.refetch(); importedQuery.refetch(); }}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${issuesQuery.isFetching ? 'animate-spin' : ''}`} />
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
                  className={`px-3 py-1 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                    limit === opt ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
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
            <div className="mb-3 rounded-lg bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-700">
              {t('externalTask:redmineMigration.allOnPageSelected', { count: selectableOnPage.length })}
              {' '}
              <button onClick={handleSelectAllIssues} className="font-semibold underline hover:text-indigo-900">
                {t('externalTask:redmineMigration.selectAllIssues', { count: totalSelectable })}
              </button>
            </div>
          )}
          {selectAllMode && (
            <div className="mb-3 rounded-lg bg-indigo-100 px-4 py-2 text-center text-sm text-indigo-700">
              {t('externalTask:redmineMigration.allIssuesSelected', { count: selectedIds.size })}
              {' '}
              <button onClick={handleClearSelection} className="font-semibold underline hover:text-indigo-900">
                {t('externalTask:redmineMigration.clearSelection')}
              </button>
            </div>
          )}

          {/* Issues table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-2.5">
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
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">#</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colType')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colSubject')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colAssignee')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colStatus')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colUpdated')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issuesQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
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
                        <td className="px-3 py-2">
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
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">#{issue.id}</td>
                        <td className="px-3 py-2">
                          <span className="whitespace-nowrap text-xs">
                            {trackerEmoji[issue.tracker.name] || '📌'} {issue.tracker.name}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-3 py-2 font-medium text-gray-900">
                          {issue.subject}
                          {imported && (
                            <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              {t('externalTask:redmineMigration.imported')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {issue.assigned_to?.name || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {issue.status.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
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
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
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
    </>
  );
}

/* ══════════════════════════════════════════════════
   Asana Import Content (신규)
   ══════════════════════════════════════════════════ */

function AsanaImportContent({
  projectId,
  onImported,
  onClose,
}: { projectId: string; onImported?: () => void; onClose: () => void }) {
  const { t } = useTranslation(['externalTask', 'common']);

  const [asanaAppId, setAsanaAppId] = useState<string>('');
  const [asanaProjectId, setAsanaProjectId] = useState<string>('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [onlyIncomplete, setOnlyIncomplete] = useState(true);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null);
  const [loadedTasks, setLoadedTasks] = useState<(ExternalTask & { _groupId: string; _groupName: string })[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Available Asana providers
  const providersQuery = useQuery({
    queryKey: ['project-import', 'asana-providers'],
    queryFn: () => externalTaskImportService.getProviders(),
    staleTime: 60_000,
  });

  const asanaProviders = (providersQuery.data || []).filter(
    (p: ExternalProviderMeta) => p.type === 'asana' && p.isConnected,
  );

  useEffect(() => {
    if (asanaProviders.length > 0 && !asanaAppId) {
      setAsanaAppId(asanaProviders[0].appId || '');
    }
  }, [asanaProviders, asanaAppId]);

  // Asana projects
  const projectsQuery = useQuery({
    queryKey: ['project-import', 'asana-projects', asanaAppId],
    queryFn: () => externalTaskImportService.getProjects('asana', asanaAppId),
    staleTime: 120_000,
    enabled: !!asanaAppId,
  });

  const asanaProjects: ExternalProject[] = projectsQuery.data || [];

  // Asana groups/sections
  const groupsQuery = useQuery({
    queryKey: ['project-import', 'asana-groups', asanaAppId, asanaProjectId],
    queryFn: () => externalTaskImportService.getGroups('asana', asanaAppId, asanaProjectId),
    staleTime: 120_000,
    enabled: !!asanaAppId && !!asanaProjectId,
  });

  const asanaGroups: ExternalGroup[] = groupsQuery.data || [];

  useEffect(() => {
    setSelectedGroupIds(new Set());
    setSelectedIds(new Set());
    setImportResult(null);
    setLoadedTasks([]);
  }, [asanaProjectId]);

  // Load tasks for selected groups
  const loadTasksForGroups = useCallback(async () => {
    if (selectedGroupIds.size === 0 || !asanaAppId) {
      setLoadedTasks([]);
      return;
    }
    setIsLoadingTasks(true);
    setSelectedIds(new Set());
    setImportResult(null);
    try {
      const allTasks: (ExternalTask & { _groupId: string; _groupName: string })[] = [];
      for (const groupId of selectedGroupIds) {
        const group = asanaGroups.find((g) => g.id === groupId);
        const groupName = group?.name || groupId;
        let result = await externalTaskImportService.getTasks('asana', asanaAppId, groupId, { onlyIncomplete });
        for (const task of result.data) {
          allTasks.push({ ...task, _groupId: groupId, _groupName: groupName });
        }
        // Fetch all pages
        while (result.hasMore && result.nextCursor) {
          result = await externalTaskImportService.getTasks('asana', asanaAppId, groupId, {
            onlyIncomplete,
            cursor: result.nextCursor,
          });
          for (const task of result.data) {
            allTasks.push({ ...task, _groupId: groupId, _groupName: groupName });
          }
        }
      }
      setLoadedTasks(allTasks);
    } catch (e) {
      console.error('Failed to load Asana tasks:', e);
      setLoadedTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [selectedGroupIds, asanaAppId, asanaGroups, onlyIncomplete]);

  // Toggle group selection
  const toggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const toggleAllGroups = useCallback(() => {
    if (selectedGroupIds.size === asanaGroups.length) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(asanaGroups.map((g) => g.id)));
    }
  }, [selectedGroupIds, asanaGroups]);

  // Import selected tasks – group by _groupId
  const importMutation = useMutation({
    mutationFn: async () => {
      const selectedProject = asanaProjects.find((p) => p.id === asanaProjectId);
      // Group selected tasks by their group
      const tasksByGroup = new Map<string, { groupName: string; taskIds: string[] }>();
      for (const taskId of selectedIds) {
        const task = loadedTasks.find((t) => t.id === taskId);
        if (!task) continue;
        const entry = tasksByGroup.get(task._groupId) || { groupName: task._groupName, taskIds: [] };
        entry.taskIds.push(taskId);
        tasksByGroup.set(task._groupId, entry);
      }

      let totalImported = 0;
      let totalSkipped = 0;
      let totalFailed = 0;

      for (const [groupId, { groupName, taskIds }] of tasksByGroup) {
        const result = await externalTaskImportService.importTasks('asana', {
          app_id: asanaAppId,
          task_ids: taskIds,
          group_id: groupId,
          project_name: selectedProject?.name,
          group_name: groupName,
          defaults: {
            type: 'TASK',
            severity: 'MINOR',
            priority: 3,
            visibility: 'ENTITY',
            project_id: projectId,
          },
        });
        totalImported += result.imported;
        totalSkipped += result.skipped;
        totalFailed += result.failed;
      }

      return { imported: totalImported, skipped: totalSkipped, failed: totalFailed };
    },
    onSuccess: (data) => {
      setImportResult(data);
      setSelectedIds(new Set());
      // Reload tasks to refresh alreadyImported states
      loadTasksForGroups();
      onImported?.();
    },
  });

  const selectableOnPage = loadedTasks.filter((t) => !t.alreadyImported);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const selectableIds = loadedTasks.filter((t) => !t.alreadyImported).map((t) => t.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  }, [loadedTasks, selectedIds]);

  // No Asana connections
  if (providersQuery.isSuccess && asanaProviders.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <p className="text-sm font-medium text-amber-800 mb-2">
          {t('externalTask:projectImport.noAsanaConnection')}
        </p>
        <Link
          to="/entity-settings/external-task-tools"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('externalTask:import.goToSettings')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Asana tool selector */}
      {asanaProviders.length > 1 && (
        <div className="mb-4 flex items-center gap-3">
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            value={asanaAppId}
            onChange={(e) => { setAsanaAppId(e.target.value); setAsanaProjectId(''); }}
          >
            {asanaProviders.map((p: ExternalProviderMeta) => (
              <option key={p.appId} value={p.appId || ''}>{p.appName || p.displayName}</option>
            ))}
          </select>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t('externalTask:settings.connected')}
          </span>
        </div>
      )}

      {/* Project selector */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</span>
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            value={asanaProjectId}
            onChange={(e) => setAsanaProjectId(e.target.value)}
            disabled={projectsQuery.isLoading}
          >
            <option value="">{t('externalTask:import.selectProject')}</option>
            {asanaProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={onlyIncomplete}
              onChange={(e) => setOnlyIncomplete(e.target.checked)}
            />
            {t('externalTask:import.incompleteOnly')}
          </label>
        </div>
      </div>

      {/* Groups (sections) multi-select checkboxes */}
      {asanaProjectId && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t('externalTask:import.selectGroup')}
            </span>
            {asanaGroups.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAllGroups}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {selectedGroupIds.size === asanaGroups.length
                    ? t('externalTask:redmineMigration.clearSelection')
                    : t('externalTask:projectImport.selectAll')}
                </button>
                {selectedGroupIds.size > 0 && (
                  <button
                    onClick={loadTasksForGroups}
                    disabled={isLoadingTasks}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                  >
                    {isLoadingTasks ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    {t('externalTask:projectImport.loadTasks')}
                  </button>
                )}
              </div>
            )}
          </div>
          {groupsQuery.isLoading ? (
            <div className="py-4 text-center text-gray-400">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : asanaGroups.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">
              {t('externalTask:redmineMigration.noIssues')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {asanaGroups.map((g) => (
                <label
                  key={g.id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    selectedGroupIds.has(g.id)
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600"
                    checked={selectedGroupIds.has(g.id)}
                    onChange={() => toggleGroup(g.id)}
                  />
                  {g.name}
                  {g.taskCount != null && (
                    <span className="text-[10px] text-gray-400">({g.taskCount})</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading states */}
      {(projectsQuery.isLoading) && (
        <div className="py-10 text-center text-gray-400">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Tasks table */}
      {loadedTasks.length > 0 && (
        <>
          <div className="mb-2 text-xs text-gray-500">
            {t('externalTask:redmineMigration.totalLabel')} <strong>{loadedTasks.length}</strong>
            {' / '}
            {t('externalTask:redmineMigration.selected')}{' '}
            <strong>{selectedIds.size}</strong>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={toggleSelectAll}
                      checked={selectableOnPage.length > 0 && selectableOnPage.every((t) => selectedIds.has(t.id))}
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colSubject')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:import.selectGroup')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colAssignee')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">{t('externalTask:redmineMigration.colStatus')}</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-600">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadedTasks.map((task) => {
                  const imported = !!task.alreadyImported;
                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors ${imported ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2">
                        {imported ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedIds.has(task.id)}
                            onChange={() => toggleSelect(task.id)}
                          />
                        )}
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 font-medium text-gray-900">
                        {task.title}
                        {imported && (
                          <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            {t('externalTask:import.alreadyImported')}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">{task._groupName}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{task.assignee || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          task.isCompleted ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {task.isCompleted ? 'Done' : (task.status || 'Active')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Import action */}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
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
              {t('externalTask:import.importSelected', { count: selectedIds.size })}
            </button>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                {t('externalTask:import.result')}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('externalTask:redmineMigration.resultSuccess')}: </span>
                  <strong className="text-emerald-700">{importResult.imported}</strong>
                </div>
                <div>
                  <span className="text-gray-500">{t('externalTask:redmineMigration.resultSkipped')}: </span>
                  <strong className="text-amber-600">{importResult.skipped}</strong>
                </div>
                <div>
                  <span className="text-gray-500">{t('externalTask:redmineMigration.resultFailed')}: </span>
                  <strong className="text-red-600">{importResult.failed}</strong>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading tasks indicator */}
      {isLoadingTasks && (
        <div className="py-10 text-center text-gray-400">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-2 text-xs">{t('externalTask:projectImport.loadingTasks')}</p>
        </div>
      )}

      {/* Prompt: select project or select groups */}
      {!isLoadingTasks && loadedTasks.length === 0 && !projectsQuery.isLoading && asanaAppId && (
        <div className="py-10 text-center text-gray-400 text-sm">
          {!asanaProjectId
            ? t('externalTask:import.selectProject')
            : selectedGroupIds.size === 0
              ? t('externalTask:import.selectGroup')
              : t('externalTask:projectImport.clickLoadTasks')}
        </div>
      )}
    </>
  );
}
