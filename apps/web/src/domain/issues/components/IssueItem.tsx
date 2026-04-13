import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { IssueResponse } from '@amb/types';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import IssueLinkShare from './IssueLinkShare';

interface IssueItemProps {
  issue: IssueResponse;
  onClick: (issue: IssueResponse) => void;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  MAJOR: 'bg-orange-100 text-orange-700',
  MINOR: 'bg-yellow-100 text-yellow-700',
};

const TYPE_COLORS: Record<string, string> = {
  BUG: 'bg-red-50 text-red-600',
  FEATURE_REQUEST: 'bg-blue-50 text-blue-600',
  OPINION: 'bg-teal-50 text-teal-600',
  TASK: 'bg-amber-50 text-amber-600',
  OTHER: 'bg-gray-50 text-gray-600',
};

export default function IssueItem({ issue, onClick }: IssueItemProps) {
  const { t } = useTranslation(['issues']);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(issue)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(issue)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[issue.type] || ''}`}>
            {t(`issues:type.${issue.type}`)}
          </span>
          <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] || ''}`}>
            {t(`issues:status.${issue.status}`)}
          </span>
          <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[issue.severity] || ''}`}>
            {t(`issues:severity.${issue.severity}`)}
          </span>
          <span className="ml-auto flex-shrink-0">
            <IssueLinkShare issueId={issue.issueId} issueTitle={issue.title} refNumber={issue.refNumber} />
          </span>
        </div>
        <div className="truncate text-sm font-medium text-gray-900">
          {issue.refNumber && (
            <span className="mr-1.5 inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500">{issue.refNumber}</span>
          )}
          {issue.title}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span>{issue.reporterName}</span>
          {issue.projectName && (
            <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-600">
              {issue.projectCode ? `[${issue.projectCode}]` : issue.projectName}
            </span>
          )}
          {issue.dueDate && (
            <span className="inline-flex items-center gap-1">
              <span className="text-gray-400">Due:</span>
              <LocalDateTime value={issue.dueDate} format='YYYY-MM-DD' />
            </span>
          )}
          <span>{<LocalDateTime value={issue.createdAt} format='YYYY-MM-DD' />}</span>
        </div>
      </div>
      {issue.commentCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{issue.commentCount}</span>
        </div>
      )}
    </div>
  );
}
