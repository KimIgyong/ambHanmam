import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, FolderKanban, Building2, Plus } from 'lucide-react';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import PageTitle from '@/global/components/PageTitle';

const PROJECT_TABS = [
  { labelKey: 'project:menu.projects', path: '/project/projects', icon: FolderKanban },
  { labelKey: 'project:menu.proposals', path: '/project/proposals', icon: FileText },
] as const;

export default function ProjectLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['project', 'common']);
  const currentEntity = useEntityStore((s) => s.currentEntity);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  // 상세/폼 페이지에서는 탭 바 숨김
  const isListPage =
    location.pathname === '/project/projects' || location.pathname === '/project/proposals';

  if (!currentEntity) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">{t('project:selectEntity')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 페이지 타이틀 - 탭 위 */}
      {isListPage && (
        <div className="shrink-0 bg-white px-6 pt-6 pb-2">
          <PageTitle>{t('project:title', { defaultValue: 'Project' })}</PageTitle>
        </div>
      )}

      {/* 상단 탭 바 - 리스트 페이지에서만 표시 */}
      {isListPage && (
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 md:px-6">
          <div className="flex items-center justify-between">
            <nav className="flex gap-0 -mb-px">
              {PROJECT_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.path);
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      active
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => navigate('/project/proposals/new')}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t('project:proposal.new')}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
