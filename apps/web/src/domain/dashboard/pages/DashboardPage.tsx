import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Landmark, Megaphone, FileText, Bug } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useMyMenus } from '@/domain/settings/hooks/useMenuPermissions';
import { useTodoList } from '@/domain/todos/hooks/useTodos';
import { useRecentNotices } from '@/domain/notices/hooks/useNotices';
import { useMeetingNoteList } from '@/domain/meeting-notes/hooks/useMeetingNotes';
import { useMyIssues } from '@/domain/issues/hooks/useIssues';
import { TodoResponse } from '@amb/types';
import { useAccountSummary } from '@/domain/accounting/hooks/useAccounts';
import { formatCurrency } from '@/domain/accounting/components/BalanceSummaryCard';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import PageTitle from '@/global/components/PageTitle';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation(['dashboard', 'todos']);
  const { data: myMenus } = useMyMenus();

  const hasMenu = (code: string) => !myMenus || myMenus.some((m) => m.menuCode === code);
  const hasTodo = hasMenu('TODO');
  const hasMeetingNotes = hasMenu('MEETING_NOTES');
  const hasNotices = hasMenu('NOTICES');
  const isAdminLevel = user?.level === 'ADMIN_LEVEL';

  const { data: todos = [] } = useTodoList({ enabled: hasTodo });
  const { data: recentNotices = [] } = useRecentNotices(5, { enabled: hasNotices });
  const { data: meetingNotesData } = useMeetingNoteList();
  const meetingNotes = meetingNotesData?.data || [];
  const { data: myIssues = [] } = useMyIssues(5);
  const { data: accountSummary } = useAccountSummary({ enabled: isAdminLevel });

  const today = new Date().toISOString().split('T')[0];

  const todayTasks = useMemo(() => {
    const tt: TodoResponse[] = [];
    for (const todo of todos) {
      if (todo.dueDate === today && todo.status !== 'COMPLETED') {
        tt.push(todo);
      }
    }
    return tt;
  }, [todos, today]);

  const recentMeetingNotes = meetingNotes.slice(0, 5);
  const activeIssues = myIssues.filter(
    (issue) => issue.status !== 'CLOSED' && issue.status !== 'REJECTED',
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <PageTitle>
            {user?.name
              ? t('dashboard:welcome', { name: user.name })
              : t('dashboard:welcomeDefault')}
          </PageTitle>
          <p className="mt-1 text-gray-600">{t('dashboard:subtitle')}</p>
        </div>

        {/* 오늘 할일 */}
        {hasTodo && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <h2 className="font-semibold text-gray-900">{t('dashboard:todayTasks')}</h2>
              </div>
              <button
                onClick={() => navigate('/todos')}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {t('dashboard:viewAll')}
              </button>
            </div>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-gray-400">{t('dashboard:noTasks')}</p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.slice(0, 5).map((todo) => (
                  <li key={todo.todoId} className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 shrink-0 text-indigo-400" />
                    <span className="text-gray-700">{todo.title}</span>
                    <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                      {t(`todos:status.${todo.status}`)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 최근 회의록 */}
        {hasMeetingNotes && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-500" />
                <h2 className="font-semibold text-gray-900">{t('dashboard:recentMeetingNotes')}</h2>
              </div>
              <button
                onClick={() => navigate('/meeting-notes')}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {t('dashboard:viewAll')}
              </button>
            </div>
            {recentMeetingNotes.length === 0 ? (
              <p className="text-sm text-gray-400">{t('dashboard:noMeetingNotes')}</p>
            ) : (
              <ul className="space-y-3">
                {recentMeetingNotes.map((note) => (
                  <li
                    key={note.meetingNoteId}
                    onClick={() => navigate(`/meeting-notes/${note.meetingNoteId}`)}
                    className="-mx-1 flex cursor-pointer items-start justify-between rounded border-b border-gray-50 px-1 pb-2 last:border-0 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{note.title}</span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {<LocalDateTime value={note.meetingDate} format='YYYY-MM-DD HH:mm' />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 나의 이슈 */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-rose-500" />
              <h2 className="font-semibold text-gray-900">{t('dashboard:recentIssues')}</h2>
            </div>
            <button
              onClick={() => navigate('/issues')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {t('dashboard:viewAll')}
            </button>
          </div>
          {activeIssues.length === 0 ? (
            <p className="text-sm text-gray-400">{t('dashboard:noRecentIssues')}</p>
          ) : (
            <ul className="space-y-2">
              {activeIssues.slice(0, 5).map((issue) => (
                <li
                  key={issue.issueId}
                  onClick={() => navigate(`/issues/${issue.issueId}`)}
                  className="-mx-1 flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-gray-50"
                >
                  <Bug className="h-4 w-4 shrink-0 text-rose-400" />
                  <span className="flex-1 truncate text-sm text-gray-700">{issue.title}</span>
                  <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600">
                    {issue.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 공지사항 */}
        {hasNotices && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900">{t('dashboard:announcements')}</h2>
              </div>
              <button
                onClick={() => navigate('/notices')}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {t('dashboard:viewAll')}
              </button>
            </div>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-gray-400">{t('dashboard:noAnnouncements')}</p>
            ) : (
              <ul className="space-y-3">
                {recentNotices.map((notice) => (
                  <li
                    key={notice.noticeId}
                    onClick={() => navigate(`/notices/${notice.noticeId}`)}
                    className="-mx-1 flex cursor-pointer items-start justify-between rounded border-b border-gray-50 px-1 pb-2 last:border-0 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{notice.title}</span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {<LocalDateTime value={notice.createdAt} format='YYYY-MM-DD HH:mm' />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 은행잔고 (ADMIN_LEVEL 전용) */}
        {isAdminLevel && accountSummary && Object.keys(accountSummary.totalsByCurrency).length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-500" />
                <h2 className="font-semibold text-gray-900">{t('dashboard:bankBalance')}</h2>
              </div>
              <button
                onClick={() => navigate('/accounting')}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {t('dashboard:viewAll')}
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(accountSummary.totalsByCurrency).map(([currency, total]) => (
                <div
                  key={currency}
                  className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-emerald-800">{currency}</span>
                  <span
                    className={`text-lg font-bold ${total >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                  >
                    {formatCurrency(total, currency)} {currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
