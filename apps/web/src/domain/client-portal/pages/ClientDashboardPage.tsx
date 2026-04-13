import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientPortalApiService } from '../service/client-portal.service';
import { useClientAuthStore } from '../store/client-auth.store';
import { FolderKanban, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ClientIssue } from '../types/client-portal.types';

export default function ClientDashboardPage() {
  const { t } = useTranslation('clientPortal');
  const user = useClientAuthStore((s) => s.user);

  const { data: projectsData } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => clientPortalApiService.getProjects({ size: 100 }),
  });

  const { data: issuesData } = useQuery({
    queryKey: ['client-issues'],
    queryFn: () => clientPortalApiService.getMyIssues({ size: 5 }),
  });

  const projects = projectsData?.data || [];
  const recentIssues = issuesData?.data || [];
  const openIssues = recentIssues.filter((i: ClientIssue) => i.status === 'OPEN' || i.status === 'IN_PROGRESS');
  const resolvedIssues = recentIssues.filter((i: ClientIssue) => i.status === 'RESOLVED' || i.status === 'CLOSED');

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        {t('dashboard.welcome', { name: user?.name })}
      </h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <FolderKanban className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-500">{t('dashboard.totalProjects')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{openIssues.length}</p>
              <p className="text-sm text-gray-500">{t('dashboard.openIssues')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resolvedIssues.length}</p>
              <p className="text-sm text-gray-500">{t('dashboard.resolvedIssues')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">{t('dashboard.recentIssues')}</h2>
          <Link to="/client/issues" className="text-sm text-indigo-600 hover:text-indigo-500">
            {t('issue.myIssues')} →
          </Link>
        </div>
        {recentIssues.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">{t('dashboard.noIssues')}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentIssues.map((issue: ClientIssue) => (
              <Link
                key={issue.id}
                to={`/client/issues/${issue.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{issue.title}</p>
                  <p className="text-xs text-gray-500">{issue.projectName}</p>
                </div>
                <span className={`ml-3 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  issue.status === 'OPEN' ? 'bg-blue-50 text-blue-700' :
                  issue.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' :
                  issue.status === 'RESOLVED' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {t(`issue.statuses.${issue.status}`)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
