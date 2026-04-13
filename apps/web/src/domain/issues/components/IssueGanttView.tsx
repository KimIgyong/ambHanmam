import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IssueResponse, WbsTreeResponse } from '@amb/types';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#9CA3AF',
  APPROVED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#10B981',
  CLOSED: '#8B5CF6',
  REJECTED: '#EF4444',
};

const ROW_HEIGHT = 36;
const GROUP_ROW_HEIGHT = 32;
const HEADER_HEIGHT = 48;
const DAY_WIDTH = 28;
const MIN_BAR_WIDTH = 6;

type GanttRow =
  | { type: 'group'; label: string; color: string; issueCount: number; progress: number }
  | { type: 'issue'; issue: IssueResponse };

interface IssueGanttViewProps {
  issues: IssueResponse[];
  onIssueClick: (issue: IssueResponse) => void;
  wbsTree?: WbsTreeResponse;
  showAuthor?: boolean;
  showAssignee?: boolean;
}

export default function IssueGanttView({ issues, onIssueClick, wbsTree, showAuthor = true, showAssignee = true }: IssueGanttViewProps) {
  const { t } = useTranslation(['issues', 'project']);
  const scrollRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ issue: IssueResponse; x: number; y: number } | null>(null);

  const hasGroups = !!wbsTree;

  // Build rows: grouped if wbsTree, flat if not
  const rows: GanttRow[] = useMemo(() => {
    if (!wbsTree) {
      // Flat mode: parent-child hierarchy
      const roots = issues.filter((i) => !i.parentIssueId);
      const childrenMap = new Map<string, IssueResponse[]>();
      issues.forEach((i) => {
        if (i.parentIssueId) {
          const children = childrenMap.get(i.parentIssueId) || [];
          children.push(i);
          childrenMap.set(i.parentIssueId, children);
        }
      });
      const issueIdSet = new Set(issues.map((i) => i.issueId));
      const orphans = issues.filter((i) => i.parentIssueId && !issueIdSet.has(i.parentIssueId));
      const rootsAll = [...roots, ...orphans];
      rootsAll.sort((a, b) => a.priority - b.priority || a.status.localeCompare(b.status));

      const result: GanttRow[] = [];
      for (const root of rootsAll) {
        result.push({ type: 'issue', issue: root });
        const children = childrenMap.get(root.issueId) || [];
        children.sort((a, b) => a.priority - b.priority || a.status.localeCompare(b.status));
        children.forEach((c) => result.push({ type: 'issue', issue: c }));
      }
      return result;
    }

    // Grouped mode: epics → components → unassigned
    const result: GanttRow[] = [];

    for (const epic of wbsTree.epics) {
      const doneCount = epic.issues.filter((i) => i.status === 'CLOSED' || i.status === 'RESOLVED').length;
      const progress = epic.issues.length > 0 ? Math.round((doneCount / epic.issues.length) * 100) : 0;
      result.push({ type: 'group', label: epic.title, color: epic.color || '#6366F1', issueCount: epic.issues.length, progress });
      epic.issues.forEach((issue) => result.push({ type: 'issue', issue }));
    }

    for (const comp of wbsTree.components) {
      const doneCount = comp.issues.filter((i) => i.status === 'CLOSED' || i.status === 'RESOLVED').length;
      const progress = comp.issues.length > 0 ? Math.round((doneCount / comp.issues.length) * 100) : 0;
      result.push({ type: 'group', label: comp.title, color: comp.color || '#3B82F6', issueCount: comp.issues.length, progress });
      comp.issues.forEach((issue) => result.push({ type: 'issue', issue }));
    }

    const unIssues = wbsTree.unassigned?.issues || [];
    if (unIssues.length > 0) {
      result.push({ type: 'group', label: t('project:wbs.unassigned'), color: '#9CA3AF', issueCount: unIssues.length, progress: 0 });
      unIssues.forEach((issue) => result.push({ type: 'issue', issue }));
    }

    return result;
  }, [issues, wbsTree, t]);

  const issueRows = rows.filter((r): r is GanttRow & { type: 'issue' } => r.type === 'issue');

  // Calculate timeline range
  const { startDate, endDate, totalDays } = useMemo(() => {
    if (issueRows.length === 0) {
      const now = new Date();
      return { startDate: now, endDate: now, totalDays: 30 };
    }

    let earliest = new Date(issueRows[0].issue.createdAt);
    let latest = new Date();

    issueRows.forEach(({ issue }) => {
      const created = new Date(issue.createdAt);
      if (created < earliest) earliest = created;
      if (issue.resolvedAt) {
        const resolved = new Date(issue.resolvedAt);
        if (resolved > latest) latest = resolved;
      }
    });

    const start = new Date(earliest);
    start.setDate(start.getDate() - 2);
    const end = new Date(latest);
    end.setDate(end.getDate() + 7);

    const days = Math.max(30, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return { startDate: start, endDate: end, totalDays: days };
  }, [issueRows]);

  // Row y-offset calculator
  const rowYOffsets = useMemo(() => {
    const offsets: number[] = [];
    let y = 0;
    rows.forEach((row) => {
      offsets.push(y);
      y += row.type === 'group' ? GROUP_ROW_HEIGHT : ROW_HEIGHT;
    });
    return { offsets, totalHeight: y };
  }, [rows]);

  const chartWidth = totalDays * DAY_WIDTH;

  const weekMarkers = useMemo(() => {
    const markers: { x: number; label: string; isMonth: boolean }[] = [];
    const current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay() + 1);
    while (current <= endDate) {
      const dayOffset = Math.floor((current.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const x = dayOffset * DAY_WIDTH;
      const isMonth = current.getDate() <= 7;
      markers.push({ x, label: `${current.getMonth() + 1}/${current.getDate()}`, isMonth });
      current.setDate(current.getDate() + 7);
    }
    return markers;
  }, [startDate, endDate]);

  const todayOffset = useMemo(() => {
    const now = new Date();
    return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * DAY_WIDTH;
  }, [startDate]);

  const getBarProps = (issue: IssueResponse) => {
    const created = new Date(issue.createdAt);
    const end = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date();
    const startOffset = Math.floor((created.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.ceil((end.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      x: startOffset * DAY_WIDTH,
      width: Math.max(MIN_BAR_WIDTH, duration * DAY_WIDTH - 2),
      color: STATUS_COLORS[issue.status] || '#9CA3AF',
    };
  };

  // Sync vertical scroll
  const handleChartScroll = () => {
    if (scrollRef.current && labelRef.current) {
      labelRef.current.scrollTop = scrollRef.current.scrollTop;
    }
  };

  if (issueRows.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-400">
        {t('issues:gantt.noData', '표시할 이슈가 없습니다')}
      </div>
    );
  }

  // Column widths for grouped mode (responsive)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const COL_GROUP = isMobile ? 0 : 120;
  const COL_TITLE = hasGroups ? (isMobile ? 140 : 200) : 0;
  const COL_AUTHOR = showAuthor ? (isMobile ? 60 : 80) : 0;
  const COL_ASSIGNEE = showAssignee ? (isMobile ? 60 : 80) : 0;
  const COL_PROGRESS = isMobile ? 40 : 60;
  const LABEL_WIDTH = hasGroups
    ? COL_GROUP + COL_TITLE + COL_AUTHOR + COL_ASSIGNEE + COL_PROGRESS
    : isMobile ? 160 : 240;

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex">
        {/* Left: Labels */}
        <div ref={labelRef} className="flex-shrink-0 border-r border-gray-200 overflow-hidden" style={{ width: LABEL_WIDTH }}>
          {/* Header */}
          {hasGroups ? (
            <div
              className="flex items-center border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600"
              style={{ height: HEADER_HEIGHT }}
            >
              {COL_GROUP > 0 && <div className="px-2 truncate" style={{ width: COL_GROUP }}>{t('project:wbs.group', '그룹')}</div>}
              <div className="px-2 truncate" style={{ width: COL_TITLE }}>{t('issues:form.title')}</div>
              {COL_AUTHOR > 0 && <div className="px-2 truncate text-center" style={{ width: COL_AUTHOR }}>{t('issues:author', '작성자')}</div>}
              {COL_ASSIGNEE > 0 && <div className="px-2 truncate text-center" style={{ width: COL_ASSIGNEE }}>{t('issues:assignee.label', '담당자')}</div>}
              <div className="px-2 truncate text-center" style={{ width: COL_PROGRESS }}>{t('issues:progress', '진행율')}</div>
            </div>
          ) : (
            <div
              className="flex items-center border-b border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-600"
              style={{ height: HEADER_HEIGHT }}
            >
              {t('issues:form.title')}
            </div>
          )}

          {/* Rows */}
          {rows.map((row, i) => {
            if (row.type === 'group') {
              return (
                <div
                  key={`grp-${i}`}
                  className="flex items-center border-b border-gray-200 bg-gray-100 px-3 gap-2"
                  style={{ height: GROUP_ROW_HEIGHT }}
                >
                  <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded" style={{ backgroundColor: row.color }} />
                  <span className="text-xs font-semibold text-gray-700 truncate">{row.label}</span>
                  <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">
                    {row.issueCount} {t('issues:gantt.issues', '건')}
                    {row.progress > 0 && ` · ${row.progress}%`}
                  </span>
                </div>
              );
            }

            const { issue } = row;
            if (hasGroups) {
              return (
                <div
                  key={issue.issueId}
                  onClick={() => onIssueClick(issue)}
                  className={`flex items-center border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {COL_GROUP > 0 && <div style={{ width: COL_GROUP }} />}
                  <div className="flex items-center gap-1.5 px-2 min-w-0" style={{ width: COL_TITLE }}>
                    <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[issue.status] }} />
                    <span className="truncate text-xs text-gray-700">{issue.title}</span>
                  </div>
                  {COL_AUTHOR > 0 && (
                    <div className="px-2 truncate text-xs text-gray-500 text-center" style={{ width: COL_AUTHOR }}>
                      {issue.reporterName || '-'}
                    </div>
                  )}
                  {COL_ASSIGNEE > 0 && (
                    <div className="px-2 truncate text-xs text-gray-500 text-center" style={{ width: COL_ASSIGNEE }}>
                      {issue.assigneeName || issue.assignee || '-'}
                    </div>
                  )}
                  <div className="px-2 text-xs text-gray-500 text-center" style={{ width: COL_PROGRESS }}>
                    {issue.doneRatio != null ? `${issue.doneRatio}%` : '-'}
                  </div>
                </div>
              );
            }

            // Flat mode
            const isChildRow = issue.parentIssueId && issues.some((p) => p.issueId === issue.parentIssueId);
            return (
              <div
                key={issue.issueId}
                onClick={() => onIssueClick(issue)}
                className={`flex cursor-pointer items-center gap-2 border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                style={{ height: ROW_HEIGHT, paddingLeft: isChildRow ? 28 : 12, paddingRight: 12 }}
              >
                {isChildRow && <span className="text-xs text-gray-300">└</span>}
                <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[issue.status] }} />
                <span className="truncate text-xs text-gray-700">{issue.title}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Gantt chart */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          onScroll={handleChartScroll}
        >
          <svg width={chartWidth} height={HEADER_HEIGHT + rowYOffsets.totalHeight}>
            {/* Header week labels */}
            {weekMarkers.map((m, i) => (
              <g key={i}>
                <line x1={m.x} y1={0} x2={m.x} y2={HEADER_HEIGHT + rowYOffsets.totalHeight} stroke="#E5E7EB" strokeWidth={1} />
                <text x={m.x + 4} y={HEADER_HEIGHT - 8} fontSize={10} fill={m.isMonth ? '#374151' : '#9CA3AF'} fontWeight={m.isMonth ? 600 : 400}>
                  {m.label}
                </text>
              </g>
            ))}

            {/* Row backgrounds & grid */}
            {rows.map((row, i) => {
              const y = HEADER_HEIGHT + rowYOffsets.offsets[i];
              const h = row.type === 'group' ? GROUP_ROW_HEIGHT : ROW_HEIGHT;
              return (
                <g key={`bg-${i}`}>
                  <rect x={0} y={y} width={chartWidth} height={h} fill={row.type === 'group' ? '#F3F4F6' : i % 2 === 0 ? '#FFFFFF' : '#F9FAFB'} />
                  <line x1={0} y1={y + h} x2={chartWidth} y2={y + h} stroke="#F3F4F6" strokeWidth={1} />
                </g>
              );
            })}

            {/* Today line */}
            <line x1={todayOffset} y1={0} x2={todayOffset} y2={HEADER_HEIGHT + rowYOffsets.totalHeight} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={todayOffset + 3} y={12} fontSize={9} fill="#EF4444" fontWeight={600}>
              {t('issues:gantt.today', '오늘')}
            </text>

            {/* Bars */}
            {rows.map((row, i) => {
              if (row.type === 'group') return null;
              const { issue } = row;
              const bar = getBarProps(issue);
              const y = HEADER_HEIGHT + rowYOffsets.offsets[i] + 8;
              const barHeight = ROW_HEIGHT - 16;
              return (
                <g key={issue.issueId}>
                  <rect
                    x={bar.x}
                    y={y}
                    width={bar.width}
                    height={barHeight}
                    rx={4}
                    fill={bar.color}
                    className="cursor-pointer"
                    opacity={0.85}
                    onClick={() => onIssueClick(issue)}
                    onMouseEnter={(e) => setTooltip({ issue, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                  {bar.width > 60 && (
                    <text x={bar.x + 6} y={y + barHeight / 2 + 3} fontSize={9} fill="white" fontWeight={500} className="pointer-events-none">
                      {(issue.assigneeName || issue.assignee || '').slice(0, 8)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <div className="font-medium">{tooltip.issue.title}</div>
          <div className="mt-1 text-gray-300">
            {t(`issues:status.${tooltip.issue.status}`)} · {tooltip.issue.assigneeName || tooltip.issue.assignee || t('issues:assignee.unassigned')}
          </div>
          <div className="text-gray-400">
            {<LocalDateTime value={tooltip.issue.createdAt} format='YYYY-MM-DD HH:mm' />} — {tooltip.issue.resolvedAt ? <LocalDateTime value={tooltip.issue.resolvedAt} format='YYYY-MM-DD HH:mm' /> : t('issues:gantt.today', '오늘')}
          </div>
        </div>
      )}
    </div>
  );
}
