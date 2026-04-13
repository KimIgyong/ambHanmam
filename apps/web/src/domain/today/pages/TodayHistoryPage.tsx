import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '@/global/util/sanitize';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Lock } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useSnapshotDetail } from '../hooks/useMyToday';
import SnapshotMemoSection from '../components/snapshot/SnapshotMemoSection';
import TodayHistoryCalendar from '../components/history/TodayHistoryCalendar';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-600',
  COMPLETED: 'bg-green-100 text-green-600',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600',
  MAJOR: 'text-orange-600',
  MINOR: 'text-yellow-600',
  TRIVIAL: 'text-gray-500',
};

export default function TodayHistoryPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('today');
  const { data, isLoading } = useSnapshotDetail(date || '', !!date);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <button onClick={() => navigate('/today')} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> {t('history.backToToday', { defaultValue: 'Today로 돌아가기' })}
        </button>
        <div className="text-center text-gray-400 py-20">
          {t('history.noSnapshot', { defaultValue: '해당 날짜의 스냅샷이 없습니다.' })}
        </div>
      </div>
    );
  }

  const { snpData, memos, prevDate, nextDate, snpId } = data;
  const { todos, issues, schedules, mission } = snpData;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumb */}
        <button onClick={() => navigate('/today')} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> {t('history.backToToday', { defaultValue: 'Today로 돌아가기' })}
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">{data.snpTitle}</h1>
              <Lock className="h-4 w-4 text-gray-300" />
            </div>

            {/* Date Navigation */}
            <div className="mb-6 flex items-center gap-3">
              {prevDate ? (
                <button
                  onClick={() => navigate(`/today/history/${prevDate}`)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {prevDate}
                </button>
              ) : <div />}
              {nextDate ? (
                <button
                  onClick={() => navigate(`/today/history/${nextDate}`)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
                >
                  {nextDate}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : <div />}
            </div>

        {/* Mission */}
        {mission && mission.content && (
          <section className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-5">
            <h3 className="mb-2 text-sm font-semibold text-indigo-600">
              {t('mission.title', { defaultValue: "오늘의 미션" })}
            </h3>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(mission.content) }}
            />
            {mission.checkResult && (
              <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {mission.checkScore}%
              </span>
            )}
          </section>
        )}

        {/* Todos */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            {t('snapshot.todos', { defaultValue: '할일' })}
          </h3>
          {renderTodoGroup(t('snapshot.overdue', { defaultValue: '지연' }), todos.overdue, 'text-red-500')}
          {renderTodoGroup(t('snapshot.todayDue', { defaultValue: '오늘 마감' }), todos.todayDue, 'text-indigo-500')}
          {renderTodoGroup(t('snapshot.inProgress', { defaultValue: '진행중' }), todos.inProgress, 'text-blue-500')}
          {renderTodoGroup(t('snapshot.scheduled', { defaultValue: '예정' }), todos.scheduled, 'text-gray-500')}
          {renderTodoGroup(t('snapshot.completed', { defaultValue: '완료' }), todos.completedToday, 'text-green-500')}
          {todos.overdue.length === 0 && todos.todayDue.length === 0 &&
           todos.inProgress.length === 0 && todos.scheduled.length === 0 &&
           todos.completedToday.length === 0 && (
            <p className="text-sm text-gray-400">{t('empty.noData', { defaultValue: '데이터가 없습니다.' })}</p>
          )}
        </section>

        {/* Issues */}
        {issues.length > 0 && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {t('snapshot.issues', { defaultValue: '이슈' })}
            </h3>
            <div className="space-y-2">
              {issues.map((iss: any) => (
                <div key={iss.issId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                  <span className={`text-xs font-medium ${SEVERITY_COLORS[iss.severity] || 'text-gray-500'}`}>
                    {iss.severity}
                  </span>
                  <span className="flex-1 truncate text-sm text-gray-700">{iss.title}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{iss.role}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Schedules */}
        {schedules.length > 0 && (
          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {t('snapshot.schedules', { defaultValue: '스케줄' })}
            </h3>
            <div className="space-y-2">
              {schedules.map((sch: any) => (
                <div key={sch.calId} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  {sch.color && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sch.color }} />}
                  <div className="flex-1">
                    <span className="text-sm text-gray-700">{sch.title}</span>
                    {sch.location && <span className="ml-2 text-xs text-gray-400">{sch.location}</span>}
                  </div>
                  <span className="text-xs text-gray-400">
                    {sch.isAllDay ? t('snapshot.allDay', { defaultValue: '종일' }) :
                      `${new Date(sch.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(sch.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
                    }
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Memos */}
        <SnapshotMemoSection snpId={snpId} memos={memos} />


          </div>

          {/* History Calendar Panel */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-8">
              <TodayHistoryCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderTodoGroup(label: string, items: any[], color: string) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className={`mb-1 text-xs font-medium ${color}`}>{label} ({items.length})</p>
      <div className="space-y-1">
        {items.map((todo: any) => (
          <div key={todo.tdoId} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50">
            <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[todo.status] || 'bg-gray-100 text-gray-600'}`}>
              {todo.status}
            </span>
            <span className="flex-1 truncate text-sm text-gray-700">{todo.title}</span>
            {todo.dueDate && (
              <span className="text-[10px] text-gray-400">{todo.dueDate}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
