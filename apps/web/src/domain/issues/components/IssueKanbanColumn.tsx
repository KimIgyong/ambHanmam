import { useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { IssueResponse, IssueStatus } from '@amb/types';
import IssueKanbanCard from './IssueKanbanCard';

const STATUS_STYLES: Record<string, { header: string; ring: string }> = {
  OPEN: { header: 'bg-gray-100 text-gray-700', ring: 'ring-gray-300' },
  APPROVED: { header: 'bg-blue-100 text-blue-700', ring: 'ring-blue-300' },
  IN_PROGRESS: { header: 'bg-amber-100 text-amber-700', ring: 'ring-amber-300' },
  TEST: { header: 'bg-yellow-100 text-yellow-700', ring: 'ring-yellow-300' },
  REOPEN: { header: 'bg-orange-100 text-orange-700', ring: 'ring-orange-300' },
  RESOLVED: { header: 'bg-green-100 text-green-700', ring: 'ring-green-300' },
  CLOSED: { header: 'bg-purple-100 text-purple-700', ring: 'ring-purple-300' },
  REJECTED: { header: 'bg-red-100 text-red-700', ring: 'ring-red-300' },
};

interface IssueKanbanColumnProps {
  status: IssueStatus;
  issues: IssueResponse[];
  isValidTarget: boolean;
  isDragActive: boolean;
  onIssueClick: (issue: IssueResponse) => void;
}

export default function IssueKanbanColumn({
  status,
  issues,
  isValidTarget,
  isDragActive,
  onIssueClick,
}: IssueKanbanColumnProps) {
  const { t } = useTranslation(['issues']);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const style = STATUS_STYLES[status] || STATUS_STYLES.OPEN;

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[220px] flex-col rounded-xl border bg-gray-50 transition-all ${
        isDragActive && isValidTarget
          ? isOver
            ? `border-indigo-400 ${style.ring} ring-2`
            : 'border-indigo-200'
          : isDragActive && !isValidTarget
            ? 'border-gray-200 opacity-50'
            : 'border-gray-200'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${style.header}`}>
            {t(`issues:status.${status}`)}
          </span>
        </div>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {issues.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {issues.map((issue) => (
          <IssueKanbanCard key={issue.issueId} issue={issue} onClick={onIssueClick} />
        ))}
        {issues.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-xs text-gray-400">
            {t('issues:noIssues')}
          </div>
        )}
      </div>
    </div>
  );
}
