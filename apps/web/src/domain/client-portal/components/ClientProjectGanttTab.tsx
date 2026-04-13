import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
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
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6',
  APPROVED: '#6366F1',
  IN_PROGRESS: '#8B5CF6',
  RESOLVED: '#22C55E',
  CLOSED: '#9CA3AF',
  REJECTED: '#EF4444',
};

export default function ClientProjectGanttTab({ projectId }: { projectId: string }) {
  const { t } = useTranslation('clientPortal');
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ issue: ClientIssue; x: number; y: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['client-project-issues', projectId, 'gantt'],
    queryFn: () => clientPortalApiService.getProjectIssues(projectId, { size: 500 }),
    enabled: !!projectId,
  });

  const allIssues: ClientIssue[] = data?.data || [];

  const { timeline, minDate, dayWidth, totalDays } = useMemo(() => {
    if (allIssues.length === 0) return { timeline: [], minDate: new Date(), dayWidth: 20, totalDays: 30 };

    const dates = allIssues.map((i) => new Date(i.createdAt).getTime());
    const updateDates = allIssues.map((i) => new Date(i.updatedAt).getTime());
    const allDates = [...dates, ...updateDates];
    const mn = new Date(Math.min(...allDates));
    const mx = new Date(Math.max(...allDates));

    mn.setDate(mn.getDate() - 2);
    mx.setDate(mx.getDate() + 7);

    const td = Math.max(30, Math.ceil((mx.getTime() - mn.getTime()) / (1000 * 60 * 60 * 24)));
    const dw = 20;

    const tl = allIssues.map((i) => {
      const start = new Date(i.createdAt);
      const end = ['CLOSED', 'REJECTED', 'RESOLVED'].includes(i.status)
        ? new Date(i.updatedAt)
        : new Date();
      const startDay = Math.max(0, Math.floor((start.getTime() - mn.getTime()) / (1000 * 60 * 60 * 24)));
      const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return { issue: i, startDay, duration };
    });

    return { timeline: tl, minDate: mn, dayWidth: dw, totalDays: td };
  }, [allIssues]);

  const months = useMemo(() => {
    const result: { label: string; offset: number; width: number }[] = [];
    if (totalDays === 0) return result;

    let current = new Date(minDate);
    current.setDate(1);
    while (current.getTime() < minDate.getTime() + totalDays * 86400000) {
      const monthStart = Math.max(0, Math.floor((current.getTime() - minDate.getTime()) / 86400000));
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      const monthEnd = Math.min(totalDays, Math.floor((nextMonth.getTime() - minDate.getTime()) / 86400000));
      result.push({
        label: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
        offset: monthStart * dayWidth,
        width: (monthEnd - monthStart) * dayWidth,
      });
      current = nextMonth;
    }
    return result;
  }, [minDate, totalDays, dayWidth]);

  if (isLoading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
  if (allIssues.length === 0) return <div className="text-center py-12 text-gray-400">{t('issue.noIssues')}</div>;

  const ROW_HEIGHT = 32;
  const LABEL_WIDTH = 260;
  const chartWidth = totalDays * dayWidth;

  return (
    <div className="relative">
      <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* 라벨 영역 */}
        <div className="flex-shrink-0 border-r border-gray-200" style={{ width: LABEL_WIDTH }}>
          <div className="h-10 border-b border-gray-200 bg-gray-50 px-3 flex items-center text-xs font-medium text-gray-600">
            {t('issue.subject')}
          </div>
          {timeline.map(({ issue }) => (
            <div
              key={issue.id}
              className="flex items-center px-3 border-b border-gray-100 text-xs hover:bg-gray-50 cursor-pointer"
              style={{ height: ROW_HEIGHT }}
              onClick={() => navigate(`/client/issues/${issue.id}`)}
            >
              <span className="truncate text-gray-900">{issue.title}</span>
            </div>
          ))}
        </div>

        {/* 차트 영역 */}
        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ width: chartWidth, minWidth: '100%' }}>
            {/* 월 헤더 */}
            <div className="relative h-10 border-b border-gray-200 bg-gray-50" style={{ width: chartWidth }}>
              {months.map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 h-full flex items-center border-r border-gray-200 px-2 text-xs text-gray-500"
                  style={{ left: m.offset, width: m.width }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* 바 영역 */}
            {timeline.map(({ issue, startDay, duration }) => {
              const color = STATUS_COLORS[issue.status] || '#9CA3AF';
              return (
                <div
                  key={issue.id}
                  className="relative border-b border-gray-100"
                  style={{ height: ROW_HEIGHT, width: chartWidth }}
                >
                  <div
                    className="absolute top-1.5 rounded-sm cursor-pointer hover:opacity-80"
                    style={{
                      left: startDay * dayWidth,
                      width: Math.max(duration * dayWidth, 8),
                      height: ROW_HEIGHT - 12,
                      backgroundColor: color,
                      opacity: 0.8,
                    }}
                    onMouseEnter={(e) => setTooltip({ issue, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => navigate(`/client/issues/${issue.id}`)}
                  >
                    {issue.doneRatio > 0 && (
                      <div
                        className="absolute top-0 left-0 h-full rounded-sm"
                        style={{
                          width: `${issue.doneRatio}%`,
                          backgroundColor: color,
                          opacity: 1,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-medium text-gray-900 mb-1">{tooltip.issue.title}</p>
          <p className="text-gray-500">{tooltip.issue.status} • {tooltip.issue.type} • P{tooltip.issue.priority}</p>
          {tooltip.issue.assigneeName && <p className="text-gray-500 mt-1">{tooltip.issue.assigneeName}</p>}
          {tooltip.issue.doneRatio > 0 && <p className="text-gray-500">{tooltip.issue.doneRatio}%</p>}
        </div>
      )}
    </div>
  );
}
