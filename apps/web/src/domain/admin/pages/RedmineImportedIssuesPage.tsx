import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw, Trash2, RotateCcw, CheckCircle, XCircle, Loader2,
  Search, AlertTriangle, List,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useEntities } from '@/domain/hr/hooks/useEntity';
import { useEntityStore } from '@/domain/hr/store/entity.store';

/* ── Types ── */

interface ImportedIssue {
  issId: string;
  issRedmineId: number;
  issTitle: string;
  issType: string;
  issStatus: string;
  issSeverity: string;
  issPriority: number;
  issDoneRatio: number;
  issCreatedAt: string;
  issUpdatedAt: string;
  project: { pjtId: string; pjtCode: string; pjtName: string } | null;
  reporter: { usrId: string; usrName: string } | null;
  assignee: { usrId: string; usrName: string } | null;
}

interface AmaProject {
  pjtId: string;
  pjtCode: string;
  pjtName: string;
  pjtStatus: string;
}

/* ── API calls ── */

const importedApi = {
  getIssues: (params: Record<string, string | number>) =>
    apiClient.get('/migration/redmine/imported-issues', { params }).then((r) => r.data.data),
  deleteIssues: (issueIds: string[]) =>
    apiClient.delete('/migration/redmine/imported-issues', { data: { issue_ids: issueIds } }).then((r) => r.data.data),
  reimportIssues: (issueIds: string[], entityId: string, targetProjectId?: string) =>
    apiClient.post('/migration/redmine/reimport', {
      issue_ids: issueIds,
      entity_id: entityId,
      ...(targetProjectId ? { target_project_id: targetProjectId } : {}),
    }).then((r) => r.data.data),
  getAmaProjects: (entityId: string) =>
    apiClient.get('/migration/redmine/ama-projects', { params: { entity_id: entityId } }).then((r) => r.data.data),
};

/* ── Page ── */

export default function RedmineImportedIssuesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const entitiesQuery = useEntities();
  const storeEntities = useEntityStore((s) => s.entities);
  const entities = entitiesQuery.data || storeEntities;
  const queryClient = useQueryClient();

  const [entityId, setEntityId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<'delete' | 'reimport' | null>(null);

  // For reimport target
  const [reimportEntityId, setReimportEntityId] = useState<string>('');
  const [reimportProjectId, setReimportProjectId] = useState<string>('');

  // Set default entity to VN01 when entities are loaded
  useEffect(() => {
    if (entities.length > 0 && !entityId) {
      const vn01 = entities.find((e) => e.code === 'VN01');
      const defaultId = vn01?.entityId || entities[0]?.entityId || '';
      setEntityId(defaultId);
      setReimportEntityId(defaultId);
    }
  }, [entities, entityId]);

  const LIMIT = 50;

  // Imported issues query
  const issuesQuery = useQuery({
    queryKey: ['redmine', 'imported-issues', entityId, statusFilter, searchText, page],
    queryFn: () => importedApi.getIssues({
      ...(entityId ? { entity_id: entityId } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(searchText ? { search: searchText } : {}),
      offset: page * LIMIT,
      limit: LIMIT,
    }),
    staleTime: 30_000,
  });

  // AMA projects for reimport target
  const amaProjectsQuery = useQuery({
    queryKey: ['redmine', 'ama-projects', reimportEntityId],
    queryFn: () => importedApi.getAmaProjects(reimportEntityId),
    enabled: !!reimportEntityId,
    staleTime: 60_000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => importedApi.deleteIssues(Array.from(selectedIds)),
    onSuccess: () => {
      setSelectedIds(new Set());
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['redmine', 'imported-issues'] });
      queryClient.invalidateQueries({ queryKey: ['redmine', 'imported-ids'] });
    },
  });

  // Reimport mutation
  const reimportMutation = useMutation({
    mutationFn: () => importedApi.reimportIssues(
      Array.from(selectedIds),
      reimportEntityId,
      reimportProjectId || undefined,
    ),
    onSuccess: () => {
      setSelectedIds(new Set());
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['redmine', 'imported-issues'] });
      queryClient.invalidateQueries({ queryKey: ['redmine', 'imported-ids'] });
    },
  });

  const issues: ImportedIssue[] = issuesQuery.data?.issues || [];
  const totalCount: number = issuesQuery.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const amaProjects: AmaProject[] = amaProjectsQuery.data || [];

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const ids = issues.map((i) => i.issId);
    const allSelected = ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [issues, selectedIds]);

  const typeEmoji: Record<string, string> = {
    BUG: '🐛',
    FEATURE_REQUEST: '✨',
    OPINION: '💬',
    TASK: '📋',
    OTHER: '📌',
  };

  const statusColor: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-gray-200 text-gray-600',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <List className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('admin:importedIssues.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('admin:importedIssues.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Entity filter */}
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={entityId}
              onChange={(e) => { setEntityId(e.target.value); setPage(0); setSelectedIds(new Set()); }}
            >
              <option value="">{t('admin:importedIssues.allEntities')}</option>
              {entities.map((ent) => (
                <option key={ent.entityId} value={ent.entityId}>
                  {ent.code} - {ent.name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">{t('admin:importedIssues.allStatuses')}</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder={t('admin:importedIssues.searchPlaceholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); issuesQuery.refetch(); } }}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={() => issuesQuery.refetch()}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${issuesQuery.isFetching ? 'animate-spin' : ''}`} />
              {t('admin:importedIssues.refresh')}
            </button>
          </div>
        </div>

        {/* Action bar */}
        {selectedIds.size > 0 && !confirmAction && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">
              {t('admin:importedIssues.selected', { count: selectedIds.size })}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setConfirmAction('reimport')}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <RotateCcw className="h-4 w-4" />
                {t('admin:importedIssues.reimport')}
              </button>
              <button
                onClick={() => setConfirmAction('delete')}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                {t('admin:importedIssues.delete')}
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {confirmAction === 'delete' && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  {t('admin:importedIssues.deleteConfirm', { count: selectedIds.size })}
                </p>
                <p className="mt-1 text-xs text-red-600">
                  {t('admin:importedIssues.deleteWarning')}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
                  >
                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {t('admin:importedIssues.confirmDelete')}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('admin:importedIssues.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reimport Confirmation */}
        {confirmAction === 'reimport' && (
          <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-800">
                  {t('admin:importedIssues.reimportConfirm', { count: selectedIds.size })}
                </p>
                <p className="mt-1 text-xs text-indigo-600">
                  {t('admin:importedIssues.reimportWarning')}
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="min-w-[200px]">
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      {t('admin:importedIssues.targetEntity')}
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      value={reimportEntityId}
                      onChange={(e) => { setReimportEntityId(e.target.value); setReimportProjectId(''); }}
                    >
                      <option value="">{t('admin:importedIssues.selectEntity')}</option>
                      {entities.map((ent) => (
                        <option key={ent.entityId} value={ent.entityId}>
                          {ent.code} - {ent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[250px]">
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      {t('admin:importedIssues.targetProject')}
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      value={reimportProjectId}
                      onChange={(e) => setReimportProjectId(e.target.value)}
                      disabled={!reimportEntityId}
                    >
                      <option value="">{t('admin:importedIssues.autoCreateProject')}</option>
                      {amaProjects.map((p) => (
                        <option key={p.pjtId} value={p.pjtId}>
                          [{p.pjtCode}] {p.pjtName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => reimportMutation.mutate()}
                    disabled={!reimportEntityId || reimportMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                  >
                    {reimportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    {t('admin:importedIssues.confirmReimport')}
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('admin:importedIssues.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error messages */}
        {deleteMutation.isSuccess && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="mr-1.5 inline h-4 w-4" />
            {t('admin:importedIssues.deleteSuccess', { count: (deleteMutation.data as any)?.deleted || 0 })}
          </div>
        )}
        {reimportMutation.isSuccess && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="mr-1.5 inline h-4 w-4" />
            {t('admin:importedIssues.reimportSuccess', { count: (reimportMutation.data as any)?.issues?.success || 0 })}
          </div>
        )}
        {(deleteMutation.isError || reimportMutation.isError) && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <XCircle className="mr-1.5 inline h-4 w-4" />
            {t('admin:importedIssues.actionError')}
          </div>
        )}

        {/* Issues Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    onChange={toggleSelectAll}
                    checked={issues.length > 0 && issues.every((i) => selectedIds.has(i.issId))}
                  />
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Redmine #</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  {t('admin:importedIssues.colType')}
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  {t('admin:importedIssues.colTitle')}
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  {t('admin:importedIssues.colProject')}
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  {t('admin:importedIssues.colAssignee')}
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  {t('admin:importedIssues.colStatus')}
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">
                  {t('admin:importedIssues.colImportedAt')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issuesQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    {t('admin:importedIssues.noIssues')}
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.issId} className="transition-colors hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedIds.has(issue.issId)}
                        onChange={() => toggleSelect(issue.issId)}
                      />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                      #{issue.issRedmineId}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="whitespace-nowrap text-xs">
                        {typeEmoji[issue.issType] || '📌'}{' '}
                        {issue.issType}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-3 py-2.5 font-medium text-gray-900">
                      {issue.issTitle}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {issue.project ? `[${issue.project.pjtCode}] ${issue.project.pjtName}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {issue.assignee?.usrName || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[issue.issStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {issue.issStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">
                      {new Date(issue.issCreatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {t('admin:importedIssues.totalCount', { count: totalCount })}
          </span>
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
        </div>
      </div>
    </div>
  );
}
