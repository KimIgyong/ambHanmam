import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { clientPortalApiService } from '../service/client-portal.service';
import { Plus } from 'lucide-react';
import type { ClientIssue } from '../types/client-portal.types';

export default function ClientIssueListPage() {
  const { t } = useTranslation('clientPortal');
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['client-issues', statusFilter, projectId],
    queryFn: () => clientPortalApiService.getMyIssues({
      ...(statusFilter && { status: statusFilter }),
      ...(projectId && { project_id: projectId }),
      size: 50,
    }),
  });

  const issues = data?.data || [];

  const statuses = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{t('issue.myIssues')}</h1>
        <Link
          to={`/client/issues/new${projectId ? `?project_id=${projectId}` : ''}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {t('issue.newIssue')}
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? t(`issue.statuses.${s}`) : t('common:all', 'All')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">{t('issue.noIssues')}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          {issues.map((issue: ClientIssue) => (
            <Link
              key={issue.id}
              to={`/client/issues/${issue.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{issue.title}</p>
                <div className="mt-1 flex gap-3 text-xs text-gray-500">
                  <span>{issue.projectName}</span>
                  <span>{t(`issue.types.${issue.type}`)}</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={`ml-3 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                issue.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                issue.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' :
                issue.status === 'RESOLVED' ? 'bg-green-50 text-green-700' :
                issue.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
                'bg-gray-50 text-gray-700'
              }`}>
                {t(`issue.statuses.${issue.status}`)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
