import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Bug, Columns3, BarChart3, FolderTree, StickyNote } from 'lucide-react';
import { useProjectDetail } from '../hooks/useProject';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import ProjectOverviewTab from '../components/ProjectOverviewTab';
import ProjectNotesTab from '../components/ProjectNotesTab';
import ProjectIssuesTab from '../components/ProjectIssuesTab';
import ProjectWbsTab from '../components/ProjectWbsTab';
import ProjectKanbanTab from '../components/ProjectKanbanTab';
import ProjectGanttTab from '../components/ProjectGanttTab';

type TabKey = 'overview' | 'notes' | 'issues' | 'wbs' | 'kanban' | 'gantt';

const TABS: { key: TabKey; icon: typeof FileText }[] = [
  { key: 'overview', icon: FileText },
  { key: 'notes', icon: StickyNote },
  { key: 'issues', icon: Bug },
  { key: 'kanban', icon: Columns3 },
  { key: 'wbs', icon: FolderTree },
  { key: 'gantt', icon: BarChart3 },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('project');
  const [activeTab, setActiveTab] = useState<TabKey>('issues');

  const { data: project, isLoading } = useProjectDetail(id!);

  if (isLoading || !project) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="h-full overflow-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/project/projects')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">{project.code}</p>
        </div>
        <ProjectStatusBadge status={project.status} />
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
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`tabs.${key}`)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && <ProjectOverviewTab project={project} />}
      {activeTab === 'notes' && <ProjectNotesTab projectId={project.projectId} />}
      {activeTab === 'issues' && <ProjectIssuesTab projectId={project.projectId} />}
      {activeTab === 'wbs' && <ProjectWbsTab projectId={project.projectId} />}
      {activeTab === 'kanban' && <ProjectKanbanTab projectId={project.projectId} />}
      {activeTab === 'gantt' && <ProjectGanttTab projectId={project.projectId} />}
    </div>
  );
}
