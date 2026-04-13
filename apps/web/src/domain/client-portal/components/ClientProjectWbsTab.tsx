import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Bug, Lightbulb, HelpCircle, MessageSquare, MoreHorizontal } from 'lucide-react';
import { clientPortalApiService } from '../service/client-portal.service';

interface ClientIssue {
  id: string;
  type: string;
  title: string;
  severity: string;
  status: string;
  priority: number;
  reporterName: string | null;
  assigneeName: string | null;
  doneRatio: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const TYPE_ICONS: Record<string, typeof Bug> = {
  BUG: Bug,
  FEATURE_REQUEST: Lightbulb,
  OPINION: MessageSquare,
  OTHER: MoreHorizontal,
  TASK: ChevronRight,
  INQUIRY: HelpCircle,
};

const TYPE_COLORS: Record<string, string> = {
  BUG: 'text-red-600',
  FEATURE_REQUEST: 'text-blue-600',
  OPINION: 'text-yellow-600',
  TASK: 'text-gray-600',
  OTHER: 'text-gray-500',
  INQUIRY: 'text-purple-600',
};

export default function ClientProjectWbsTab({ projectId }: { projectId: string }) {
  const { t } = useTranslation('clientPortal');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['client-project-issues', projectId, 'wbs'],
    queryFn: () => clientPortalApiService.getProjectIssues(projectId, { size: 500 }),
    enabled: !!projectId,
  });

  const allIssues: ClientIssue[] = data?.data || [];

  const grouped = useMemo(() => {
    const groups: Record<string, ClientIssue[]> = {};
    allIssues.forEach((i) => {
      if (!groups[i.type]) groups[i.type] = [];
      groups[i.type].push(i);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allIssues]);

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
  if (allIssues.length === 0) return <div className="text-center py-12 text-gray-400">{t('issue.noIssues')}</div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">{t('project.wbsDescription')}</p>
      {grouped.map(([type, issues]) => {
        const Icon = TYPE_ICONS[type] || ChevronRight;
        const colorClass = TYPE_COLORS[type] || 'text-gray-600';
        const openCount = issues.filter((i) => !['CLOSED', 'REJECTED'].includes(i.status)).length;
        return (
          <div key={type} className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-t-lg">
              <Icon className={`h-4 w-4 ${colorClass}`} />
              <span className="text-sm font-semibold text-gray-900">{type}</span>
              <span className="ml-auto text-xs text-gray-500">
                {t('project.wbsOpenTotal', { openCount, totalCount: issues.length })}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/client/issues/${issue.id}`)}
                >
                  <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] || ''}`}>
                    {issue.status}
                  </span>
                  <span className="text-sm text-gray-900 truncate flex-1">{issue.title}</span>
                  <span className="text-xs text-gray-400">P{issue.priority}</span>
                  {issue.doneRatio > 0 && (
                    <div className="w-16 flex items-center gap-1">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${issue.doneRatio}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{issue.doneRatio}%</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-400 w-20 text-right">{issue.assigneeName || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
