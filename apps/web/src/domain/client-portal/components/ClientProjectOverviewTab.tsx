import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ClientProjectDetail } from '../types/client-portal.types';

export default function ClientProjectOverviewTab({ project }: { project: ClientProjectDetail }) {
  const { t } = useTranslation('clientPortal');

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 메인 정보 */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('project.detail')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">{t('project.status')}</p>
              <p className="mt-1 text-sm font-medium">{project.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('project.manager')}</p>
              <p className="mt-1 text-sm font-medium">{project.managerName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('project.startDate')}</p>
              <p className="mt-1 text-sm font-medium">{project.startDate || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('project.endDate')}</p>
              <p className="mt-1 text-sm font-medium">{project.endDate || '-'}</p>
            </div>
            {project.category && (
              <div>
                <p className="text-xs text-gray-500">{t('project.category')}</p>
                <p className="mt-1 text-sm font-medium">{project.category}</p>
              </div>
            )}
            {project.priority && (
              <div>
                <p className="text-xs text-gray-500">{t('project.priority')}</p>
                <p className="mt-1 text-sm font-medium">{project.priority}</p>
              </div>
            )}
          </div>
        </div>

        {project.description && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('project.description')}</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}
      </div>

      {/* 사이드바: 빠른 링크 */}
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('project.quickActions')}</h3>
          <div className="space-y-2">
            <Link
              to={`/client/issues/new?project_id=${project.projectId}`}
              className="block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('issue.newIssue')}
            </Link>
            <Link
              to={`/client/issues?project_id=${project.projectId}`}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('issue.myIssues')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
