import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, Bug, Calendar, ClipboardList } from 'lucide-react';
import { IssueResponse } from '@amb/types';
import { useMyToday } from '../hooks/useMyToday';
import TodaySummaryBar from './TodaySummaryBar';
import MissionSection from './mission/MissionSection';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';
import { useMeetingNoteList } from '@/domain/meeting-notes/hooks/useMeetingNotes';
import { useMyIssues } from '@/domain/issues/hooks/useIssues';
import { useCalendarList } from '@/domain/calendar/hooks/useCalendar';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import IssueDetailModal from '@/domain/issues/components/IssueDetailModal';

const COMPUTED_STATUS_BADGE: Record<string, string> = {
  OVERDUE: 'bg-red-100 text-red-700',
  DUE_TODAY: 'bg-orange-100 text-orange-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  UPCOMING_SOON: 'bg-yellow-100 text-yellow-700',
  UPCOMING: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-green-100 text-green-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600',
  MAJOR: 'text-orange-600',
  MINOR: 'text-yellow-600',
  TRIVIAL: 'text-gray-500',
};

export default function MyTodayPanel() {
  const navigate = useNavigate();
  const { t } = useTranslation(['today', 'dashboard']);
  const { data, isLoading } = useMyToday();
  const { data: myMenus } = useMyMenus();
  const userId = useAuthStore((s) => s.user?.userId);
  const [issueTab, setIssueTab] = useState<'open' | 'working' | 'watching'>('open');
  const [detailIssue, setDetailIssue] = useState<IssueResponse | null>(null);

  const hasMenu = (code: string) => !myMenus || myMenus.some((m) => m.menuCode === code);
  const hasMeetingNotes = hasMenu('MEETING_NOTES');

  const { data: meetingNotesData } = useMeetingNoteList();
  const meetingNotes = (meetingNotesData?.data || []).slice(0, 5);
  const { data: myIssues = [] } = useMyIssues(100);

  // 탭1: 내가 작성하거나 어싸인된 이슈 중 OPEN 상태
  const openIssues = myIssues.filter(
    (i) => i.status === 'OPEN' && (i.reporterId === userId || i.assigneeId === userId),
  );
  // 탭2: APPROVED, IN_PROGRESS 상태 (내가 작업 중)
  const workingIssues = myIssues.filter(
    (i) => ['APPROVED', 'IN_PROGRESS'].includes(i.status) && (i.reporterId === userId || i.assigneeId === userId),
  );
  // 탭3: 내가 관계자로 등록된 이슈 (reporter/assignee가 아닌 것)
  const watchingIssues = myIssues.filter(
    (i) =>
      i.reporterId !== userId &&
      i.assigneeId !== userId &&
      i.participants?.some((p) => p.userId === userId),
  );

  const issueTabList = [
    { id: 'open' as const, label: t('snapshot.issueTab.open', { defaultValue: '확인 필요' }), count: openIssues.length },
    { id: 'working' as const, label: t('snapshot.issueTab.working', { defaultValue: '작업 중' }), count: workingIssues.length },
    { id: 'watching' as const, label: t('snapshot.issueTab.watching', { defaultValue: '관계자' }), count: watchingIssues.length },
  ];
  const currentTabIssues = issueTab === 'open' ? openIssues : issueTab === 'working' ? workingIssues : watchingIssues;

  // 오늘 일정 — 사용자 타임존 기준 오늘 날짜
  const { timezone } = useTimezoneStore();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  const { data: calendarData } = useCalendarList({ start_date: today, end_date: today, filter_mode: 'PARTICIPANT' });
  const todaySchedules = calendarData?.items || [];

  // 할일 통합: 지연 + 오늘마감 + 진행만 표시, 중복 제거, computedStatus 계산
  const overdueIds = new Set((data?.overdue || []).map((o) => o.todoId));
  const todayDueIds = new Set((data?.todayDue || []).map((o) => o.todoId));
  const seen = new Set<string>();
  const allTodos: (any & { computedStatus: string })[] = [];
  for (const todo of [...(data?.overdue || []), ...(data?.todayDue || []), ...(data?.inProgress || [])]) {
    if (!seen.has(todo.todoId)) {
      seen.add(todo.todoId);
      const computedStatus = overdueIds.has(todo.todoId) ? 'OVERDUE' : todayDueIds.has(todo.todoId) ? 'DUE_TODAY' : 'IN_PROGRESS';
      allTodos.push({ ...todo, computedStatus });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Today's Mission */}
      <MissionSection
        mission={(data as any).mission || null}
        yesterdayMission={(data as any).yesterdayMission || null}
        carryOverText={(data as any).carryOverText || null}
      />

      {/* 2. Calendar (오늘 일정) */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-500" />
            <h3 className="font-semibold text-gray-900">{t('today:sections.calendar', { defaultValue: '오늘 일정' })}</h3>
            {todaySchedules.length > 0 && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-600">
                {todaySchedules.length}
              </span>
            )}
          </div>
          <button onClick={() => navigate('/calendar')} className="text-sm text-indigo-600 hover:text-indigo-700">
            {t('viewAll')}
          </button>
        </div>
        {todaySchedules.length > 0 ? (
          <div className="space-y-2">
            {todaySchedules.map((sch: any) => (
              <div
                key={sch.calId}
                onClick={() => navigate('/calendar')}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50"
              >
                <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: sch.calColor || '#14b8a6' }} />
                <div className="flex-1">
                  <span className="text-sm text-gray-700">{sch.calTitle || sch.title}</span>
                  {(sch.calLocation || sch.location) && (
                    <span className="ml-2 text-xs text-gray-400">{sch.calLocation || sch.location}</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {sch.calIsAllDay || sch.isAllDay
                    ? t('snapshot.allDay', { defaultValue: '종일' })
                    : `${new Date(sch.calStartAt || sch.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(sch.calEndAt || sch.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('today:empty.calendar', { defaultValue: '오늘 예정된 일정이 없습니다' })}</p>
        )}
      </section>

      {/* 3. Tasks 통합 (Overdue 빨간색 강조) */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Tasks</h3>
            {allTodos.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {allTodos.length}
              </span>
            )}
          </div>
          <button onClick={() => navigate('/todos')} className="text-sm text-indigo-600 hover:text-indigo-700">
            {t('viewAll')}
          </button>
        </div>
        {allTodos.length > 0 ? (
          <div className="space-y-1">
            {allTodos.map((todo: any) => {
              const badgeClass = COMPUTED_STATUS_BADGE[todo.computedStatus] || COMPUTED_STATUS_BADGE.IN_PROGRESS;
              const isOverdue = todo.computedStatus === 'OVERDUE';
              return (
                <div
                  key={todo.todoId}
                  onClick={() => navigate(`/todos?id=${todo.todoId}`)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 ${isOverdue ? 'bg-red-50/50' : ''}`}
                >
                  <span className={`inline-block shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                    {t(`todos:computedStatus.${todo.computedStatus}`)}
                  </span>
                  <span className={`flex-1 truncate text-sm ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>{todo.title}</span>
                  {todo.dueDate && (
                    <span className={`shrink-0 text-[10px] ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>{todo.dueDate}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('today:empty.todayDue')}</p>
        )}
      </section>

      {/* 4. Issues (3탭: 확인 필요 / 작업 중 / 관계자) */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-rose-500" />
            <h3 className="font-semibold text-gray-900">{t('snapshot.issues', { defaultValue: '이슈' })}</h3>
          </div>
          <button onClick={() => navigate('/issues')} className="text-sm text-indigo-600 hover:text-indigo-700">
            {t('viewAll')}
          </button>
        </div>
        {/* Issue Tabs */}
        <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-0.5">
          {issueTabList.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setIssueTab(tab.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                issueTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  issueTab === tab.id ? 'bg-rose-100 text-rose-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Issue List */}
        {currentTabIssues.length > 0 ? (
          <div className="space-y-1">
            {currentTabIssues.map((iss) => (
              <div
                key={iss.issueId}
                onClick={() => setDetailIssue(iss)}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
              >
                <span className={`text-xs font-medium ${SEVERITY_COLORS[iss.severity] || 'text-gray-500'}`}>
                  {iss.severity}
                </span>
                <span className="flex-1 truncate text-sm text-gray-700">{iss.title}</span>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                  {iss.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('today:empty.issues', { defaultValue: '진행 중인 이슈가 없습니다' })}</p>
        )}
      </section>

      {/* 5. Recent Meeting Notes */}
      {hasMeetingNotes && (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-500" />
              <h3 className="font-semibold text-gray-900">{t('dashboard:recentMeetingNotes')}</h3>
            </div>
            <button onClick={() => navigate('/meeting-notes')} className="text-sm text-indigo-600 hover:text-indigo-700">
              {t('viewAll')}
            </button>
          </div>
          {meetingNotes.length > 0 ? (
            meetingNotes.map((note) => (
              <div
                key={note.meetingNoteId}
                onClick={() => navigate(`/meeting-notes/${note.meetingNoteId}`)}
                className="flex cursor-pointer items-start justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50"
              >
                <span className="text-sm text-gray-700">{note.title}</span>
                <span className="shrink-0 text-xs text-gray-400">
                  <LocalDateTime value={note.meetingDate} format="YYYY-MM-DD HH:mm" />
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">{t('today:empty.meetingNotes', { defaultValue: '최근 미팅노트가 없습니다' })}</p>
          )}
        </section>
      )}

      {/* 6. 통계 카드 */}
      <TodaySummaryBar summary={data.summary} />

      {/* Issue Detail Modal */}
      {detailIssue && (
        <IssueDetailModal
          issue={detailIssue}
          onClose={() => setDetailIssue(null)}
          onEdit={() => {
            setDetailIssue(null);
            navigate('/issues');
          }}
          onDelete={() => {
            setDetailIssue(null);
            navigate('/issues');
          }}
        />
      )}
    </div>
  );
}

