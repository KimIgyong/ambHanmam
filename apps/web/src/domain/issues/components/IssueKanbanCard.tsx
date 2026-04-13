import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { IssueResponse } from '@amb/types';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import IssueLinkShare from './IssueLinkShare';

const TYPE_COLORS: Record<string, string> = {
  BUG: 'bg-red-50 text-red-600',
  FEATURE: 'bg-blue-50 text-blue-600',
  ENHANCEMENT: 'bg-emerald-50 text-emerald-600',
};

const SEVERITY_DOTS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  MAJOR: 'bg-orange-400',
  MINOR: 'bg-yellow-400',
};

interface IssueKanbanCardProps {
  issue: IssueResponse;
  onClick: (issue: IssueResponse) => void;
  isDragDisabled?: boolean;
}

export default function IssueKanbanCard({ issue, onClick, isDragDisabled }: IssueKanbanCardProps) {
  const { t } = useTranslation(['issues']);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.issueId,
    data: { issue },
    disabled: isDragDisabled,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(issue)}
      className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-indigo-300' : 'border-gray-200'
      }`}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[issue.type] || ''}`}>
          {t(`issues:type.${issue.type}`)}
        </span>
        <span className={`inline-block h-2 w-2 rounded-full ${SEVERITY_DOTS[issue.severity] || 'bg-gray-300'}`} />
        <span className="ml-auto flex items-center gap-0.5">
          <IssueLinkShare issueId={issue.issueId} issueTitle={issue.title} />
          <span className="text-[10px] text-gray-400">P{issue.priority}</span>
        </span>
      </div>

      <p className="mb-2 line-clamp-2 text-sm font-medium text-gray-900">{issue.title}</p>

      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span className="truncate">
          {issue.assigneeName || issue.assignee || t('issues:assignee.unassigned')}
        </span>
        <span>{<LocalDateTime value={issue.createdAt} format='YYYY-MM-DD HH:mm' />}</span>
      </div>
    </div>
  );
}
