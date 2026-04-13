import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Bug, Columns3, BarChart3, FolderTree } from 'lucide-react';
import { clientPortalApiService } from '../service/client-portal.service';
import ClientProjectOverviewTab from '../components/ClientProjectOverviewTab';
import ClientProjectIssuesTab from '../components/ClientProjectIssuesTab';
import ClientProjectKanbanTab from '../components/ClientProjectKanbanTab';
import ClientProjectWbsTab from '../components/ClientProjectWbsTab';
import ClientProjectGanttTab from '../components/ClientProjectGanttTab';

type TabKey = 'overview' | 'issues' | 'wbs' | 'kanban' | 'gantt';

const TABS: { key: TabKey; icon: typeof FileText }[] = [
  { key: 'overview', icon: FileText },
  { key: 'issues', icon: Bug },
  { key: 'wbs', icon: FolderTree },
  { key: 'kanban', icon: Columns3 },
  { key: 'gantt', icon: BarChart3 },
];

export default function ClientProjectDetailPage() {
  const { t } = useTranslation('clientPortal');
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data: project, isLoading } = useQuery({
    queryKey: ['client-project', id],
    queryFn: () => clientPortalApiService.getProjectById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex h-full items-center justify-center text-gray-500">Loading...</div>;
  if (!project) return <div className="flex h-full items-center justify-center text-gray-500">Not found</div>;

  return (
    <div className="mx-auto max-w-7xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/client/projects" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">{project.code}</p>
        </div>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
          project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
          project.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
          project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {project.status}
        </span>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(({ key, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`project.tabs.${key}`)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && <ClientProjectOverviewTab project={project} />}
      {activeTab === 'issues' && <ClientProjectIssuesTab projectId={id!} />}
      {activeTab === 'wbs' && <ClientProjectWbsTab projectId={id!} />}
      {activeTab === 'kanban' && <ClientProjectKanbanTab projectId={id!} />}
      {activeTab === 'gantt' && <ClientProjectGanttTab projectId={id!} />}
    </div>
  );
}
