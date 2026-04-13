import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientPortalApiService } from '../service/client-portal.service';
import { FolderKanban } from 'lucide-react';
import type { ClientProject } from '../types/client-portal.types';

export default function ClientProjectListPage() {
  const { t } = useTranslation('clientPortal');

  const { data, isLoading } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => clientPortalApiService.getProjects({ size: 100 }),
  });

  const projects = data?.data || [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">{t('project.title')}</h1>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <FolderKanban className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">{t('project.noProjects')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project: ClientProject) => (
            <Link
              key={project.projectId}
              to={`/client/projects/${project.projectId}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <h3 className="mb-2 font-medium text-gray-900">{project.name}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
                  project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                  project.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  {project.status}
                </span>
                {project.managerName && (
                  <span>{t('project.manager')}: {project.managerName}</span>
                )}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>{t('project.totalIssues')}: {project.issueCount ?? 0}</span>
                <span>{t('project.openIssues')}: {project.openIssueCount ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
