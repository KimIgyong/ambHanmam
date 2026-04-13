import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragStartEvent, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { IssueResponse, IssueStatus } from '@amb/types';
import { useUpdateIssueStatus } from '../hooks/useIssues';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import IssueKanbanColumn from './IssueKanbanColumn';
import IssueKanbanCard from './IssueKanbanCard';

const COLUMN_ORDER: IssueStatus[] = ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'];
const MANAGER_ONLY_STATUSES: IssueStatus[] = ['APPROVED', 'REJECTED', 'CLOSED'];

interface IssueKanbanViewProps {
  issues: IssueResponse[];
  onIssueClick: (issue: IssueResponse) => void;
  visibleStatuses?: Set<string>;
}

export default function IssueKanbanView({ issues, onIssueClick, visibleStatuses }: IssueKanbanViewProps) {
  const { t } = useTranslation(['issues']);
  const updateStatus = useUpdateIssueStatus();
  const userRole = useAuthStore((s) => s.user?.role);
  const isManager = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER';

  const [activeIssue, setActiveIssue] = useState<IssueResponse | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const grouped = useMemo(() => {
    const map: Record<IssueStatus, IssueResponse[]> = {
      OPEN: [], APPROVED: [], IN_PROGRESS: [], TEST: [], REOPEN: [], RESOLVED: [], CLOSED: [], REJECTED: [],
    };
    issues.forEach((issue) => {
      const s = issue.status as IssueStatus;
      if (map[s]) map[s].push(issue);
    });
    return map;
  }, [issues]);

  const validTargets = useMemo<Set<string>>(() => {
    if (!activeIssue) return new Set();
    const from = activeIssue.status as IssueStatus;
    // 모든 상태로 전환 가능 (현재 상태 제외, 권한 체크만)
    const allowed = COLUMN_ORDER.filter(
      (s) => s !== from && (!MANAGER_ONLY_STATUSES.includes(s) || isManager),
    );
    return new Set(allowed);
  }, [activeIssue, isManager]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const issue = event.active.data.current?.issue as IssueResponse | undefined;
    setActiveIssue(issue || null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveIssue(null);
      const { active, over } = event;
      if (!over) return;

      const issue = active.data.current?.issue as IssueResponse | undefined;
      if (!issue) return;

      const targetStatus = over.id as IssueStatus;
      if (targetStatus === issue.status) return;

      // Permission check
      if (MANAGER_ONLY_STATUSES.includes(targetStatus) && !isManager) return;

      updateStatus.mutate({ id: issue.issueId, status: targetStatus });
    },
    [isManager, updateStatus],
  );

  // 표시할 컬럼 결정
  const columns = visibleStatuses
    ? COLUMN_ORDER.filter((s) => visibleStatuses.has(s))
    : COLUMN_ORDER;

  return (
    <div className="mt-2">
      <p className="mb-3 text-xs text-gray-400">{t('issues:kanban.dragHint')}</p>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((status) => (
            <IssueKanbanColumn
              key={status}
              status={status}
              issues={grouped[status]}
              isValidTarget={validTargets.has(status)}
              isDragActive={!!activeIssue}
              onIssueClick={onIssueClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIssue && (
            <div className="w-[220px]">
              <IssueKanbanCard issue={activeIssue} onClick={() => {}} isDragDisabled />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
