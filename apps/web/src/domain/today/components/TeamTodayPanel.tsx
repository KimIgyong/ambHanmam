import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '@/global/util/sanitize';
import { Users, LayoutGrid, List, Loader2, MessageCircle, ExternalLink, AlertTriangle, Target, EyeOff, Eye, Building2 } from 'lucide-react';
import { useTeamToday, useToggleMemberHidden } from '../hooks/useMyToday';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useStartDm } from '../../amoeba-talk/hooks/useTalk';
import { useTalkStore } from '../../amoeba-talk/store/talk.store';
import MemberDetailModal from './MemberDetailModal';
import TodayAttendanceBadge from './TodayAttendanceBadge';
import TodoDetailModal from '@/domain/todos/components/TodoDetailModal';
import { useTodoDetail } from '@/domain/todos/hooks/useTodos';
import type { MemberTodaySummary, MemberTodoItem, TeamTodayResponse } from '../service/today.service';

export default function TeamTodayPanel({ data: propData, isLoading: propIsLoading }: { data?: TeamTodayResponse; isLoading?: boolean } = {}) {
  const { t } = useTranslation('today');
  const internalQuery = useTeamToday(propData === undefined);
  const data = propData ?? internalQuery.data;
  const isLoading = propIsLoading ?? internalQuery.isLoading;
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberTodaySummary | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const { data: selectedTodo } = useTodoDetail(selectedTodoId);
  const isMaster = useAuthStore((s) => s.user?.role === 'MASTER');

  const visibleMembers = (data?.members ?? []).filter((m) => (isMaster && showHidden) || !m.isHidden);

  // 소속 부서명 추출 (첫 멤버의 unitName 기준)
  const unitName = data?.members?.[0]?.unitName;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data || data.members.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400">{t('team.noMembers')}</p>;
  }

  return (
    <div className="space-y-4">
      {/* 부서명 뱃지 */}
      {unitName && !propData && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="h-4 w-4" />
          <span>{t('team.unitLabel')}: <strong>{unitName}</strong></span>
        </div>
      )}
      {/* 요약 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {t('all.totalMembers')}: <strong>{data.summary.totalMembers}</strong>
          </span>
          <span>
            {t('summary.todayDue')}: <strong className="text-indigo-600">{data.summary.totalTodayDue}</strong>
          </span>
          <span>
            {t('summary.overdue')}: <strong className="text-red-600">{data.summary.totalOverdue}</strong>
          </span>
          <span>
            {t('summary.issues')}: <strong className="text-amber-600">{data.summary.totalIssues}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isMaster && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showHidden
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title={showHidden ? t('all.showActiveOnly') : t('all.showAllIncludingHidden')}
            >
              {showHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {showHidden ? t('all.showActiveOnly') : t('all.showAllIncludingHidden')}
            </button>
          )}
          <button
            onClick={() => setViewMode('card')}
            className={`rounded p-1.5 ${viewMode === 'card' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMembers.map((m) => (
            <MemberCard key={m.userId} member={m} onNameClick={() => setSelectedMember(m)} isMaster={isMaster} onTaskClick={setSelectedTodoId} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2">{t('all.totalMembers')}</th>
                <th className="px-4 py-2 text-center">Tasks</th>
                <th className="px-4 py-2 text-center">{t('summary.overdue')}</th>
                <th className="px-4 py-2 text-center">{t('summary.inProgress')}</th>
                <th className="px-4 py-2 text-center">{t('summary.issues')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleMembers.map((m) => (
                <tr key={m.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <TodayAttendanceBadge type={m.todayAttendanceType} approval={m.todayAttendanceApproval} size="sm" />
                      <button onClick={() => setSelectedMember(m)} className="font-medium text-indigo-600 hover:underline">
                        {m.userName}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">{(m.todayDueCount + m.overdueCount) || '-'}</td>
                  <td className="px-4 py-2 text-center">
                    {m.overdueCount > 0 ? <span className="text-red-600">{m.overdueCount}</span> : '-'}
                  </td>
                  <td className="px-4 py-2 text-center">{m.inProgressCount || '-'}</td>
                  <td className="px-4 py-2 text-center">{m.issueCount || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 멤버 상세 모달 */}
      {selectedMember && (
        <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} isMaster={isMaster} />
      )}

      {/* Task 상세 모달 */}
      {selectedTodo && (
        <TodoDetailModal todo={selectedTodo} onClose={() => setSelectedTodoId(null)} />
      )}
    </div>
  );
}

function MemberCard({ member, onNameClick, isMaster, onTaskClick }: { member: MemberTodaySummary; onNameClick: () => void; isMaster: boolean; onTaskClick: (todoId: string) => void }) {
  const { t } = useTranslation('today');
  const navigate = useNavigate();
  const startDm = useStartDm();
  const { setCurrentChannelId } = useTalkStore();

  const toggleHidden = useToggleMemberHidden();

  const severityColor: Record<string, string> = {
    CRITICAL: 'text-red-600',
    MAJOR: 'text-orange-600',
    MINOR: 'text-yellow-600',
    TRIVIAL: 'text-gray-500',
  };

  const handleDm = () => {
    startDm.mutate(member.userId, {
      onSuccess: (channel) => {
        if (channel) setCurrentChannelId(channel.id);
        navigate('/amoeba-talk');
      },
    });
  };

  const handleToggleHidden = () => {
    toggleHidden.mutate({ userId: member.userId, hidden: !member.isHidden });
  };

  const allTasks = (() => {
    const seen = new Set<string>();
    const items: (MemberTodoItem & { isOverdue: boolean })[] = [];
    for (const t of (member.overdueTodos || [])) {
      if (!seen.has(t.todoId)) { seen.add(t.todoId); items.push({ ...t, isOverdue: true }); }
    }
    for (const t of (member.todayDueTodos || [])) {
      if (!seen.has(t.todoId)) { seen.add(t.todoId); items.push({ ...t, isOverdue: false }); }
    }
    for (const t of (member.inProgressTodos || [])) {
      if (!seen.has(t.todoId)) { seen.add(t.todoId); items.push({ ...t, isOverdue: false }); }
    }
    return items;
  })();
  const totalTaskCount = allTasks.length;

  return (
    <div className={`rounded-xl border bg-white p-4 ${member.isHidden ? 'border-dashed border-gray-300 opacity-60' : 'border-gray-200'}`}>
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <TodayAttendanceBadge type={member.todayAttendanceType} approval={member.todayAttendanceApproval} />
            <button onClick={onNameClick} className="font-medium text-gray-900 hover:text-indigo-600 hover:underline">
              {member.userName}
            </button>
            {(totalTaskCount > 0 || member.issueCount > 0) && (
              <button
                onClick={onNameClick}
                className="flex items-center text-gray-400 hover:text-indigo-500"
                title={t('viewAll')}
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
            {member.isHidden && (
              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                {t('all.hidden', { defaultValue: 'Hidden' })}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {[member.unitName || member.department, member.position].filter(Boolean).join(' / ') || member.email}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isMaster && (
            <button
              onClick={handleToggleHidden}
              className={`rounded-lg p-1.5 ${member.isHidden ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
              title={member.isHidden ? t('all.unhide', { defaultValue: 'Show' }) : t('all.hide', { defaultValue: 'Hide' })}
            >
              {member.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={handleDm}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
            title={t('all.sendDm')}
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mission 섹션 */}
      <div className="mb-2">
        <div className="mb-1 flex items-center gap-1 text-xs">
          <Target className="h-3 w-3 text-indigo-500" />
          <span className="font-semibold text-gray-700">{t('mission.title')}</span>
        </div>
        {member.missionContent ? (
          <div
            className="rich-text-content line-clamp-6 pl-2 text-xs text-gray-600 [&_*]:!text-xs [&_*]:!leading-tight"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(member.missionContent) }}
          />
        ) : (
          <p className="pl-2 text-xs text-gray-400">-</p>
        )}
      </div>

      {/* Tasks 통합 섹션 */}
      <div className="mb-2">
        <div className="mb-1 flex items-center text-xs">
          <span className="font-semibold text-gray-700">
            Tasks <span className="text-indigo-600">({totalTaskCount})</span>
          </span>
        </div>
        {allTasks.length > 0 ? (
          <ul className="space-y-0.5 text-xs">
            {allTasks.slice(0, 5).map((todo) => (
              <li
                key={todo.todoId}
                className={`truncate pl-2 cursor-pointer hover:text-indigo-600 ${todo.isOverdue ? 'text-red-500' : 'text-gray-600'}`}
                onClick={() => onTaskClick(todo.todoId)}
              >
                · {todo.title}
              </li>
            ))}
            {allTasks.length > 5 && (
              <li className="pl-2 text-gray-400">+{allTasks.length - 5} more</li>
            )}
          </ul>
        ) : (
          <p className="pl-2 text-xs text-gray-400">-</p>
        )}
      </div>

      {/* Issues 섹션 — To Review / In Progress (각 최대 5개) */}
      <div>
        <div className="mb-1 flex items-center gap-1 text-xs">
          <span className="font-semibold text-gray-700">
            Issues <span className="text-amber-600">({t('snapshot.issueTotal', { defaultValue: '총' })} : {t('snapshot.issueCount', { count: member.issueTotal4w || 0, defaultValue: `${member.issueTotal4w || 0}건` })} | {t('snapshot.issueResolved', { count: member.issueResolved4w || 0, defaultValue: `${member.issueResolved4w || 0}건 해결` })})</span>
            <span className="ml-1 text-gray-400 font-normal">{t('snapshot.last4weeks', { defaultValue: '최근 4주' })}</span>
          </span>
        </div>
        {((member.toReviewCount || 0) > 0 || (member.issueInProgressCount || 0) > 0) ? (
          <div className="space-y-1.5 text-xs">
            {/* To Review */}
            {(member.toReviewCount || 0) > 0 && (
              <div>
                <div className="mb-0.5 pl-1 font-medium text-rose-600">
                  To Review <span className="text-rose-400">({member.toReviewCount})</span>
                </div>
                <ul className="space-y-0.5 text-gray-600">
                  {(member.toReviewIssues || []).map((issue) => (
                    <li
                      key={issue.issueId}
                      className="flex items-center gap-1.5 truncate pl-2 cursor-pointer hover:text-indigo-600"
                      onClick={() => navigate(`/issues?id=${issue.issueId}`)}
                    >
                      <AlertTriangle className={`h-3 w-3 shrink-0 ${severityColor[issue.severity] || 'text-gray-500'}`} />
                      <span className="truncate">{issue.title}</span>
                    </li>
                  ))}
                  {(member.toReviewCount || 0) > 5 && (
                    <li className="pl-2 text-amber-500">
                      <button onClick={() => navigate(`/issues?userId=${member.userId}`)} className="hover:underline">
                        +{(member.toReviewCount || 0) - (member.toReviewIssues || []).length} more
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
            {/* In Progress */}
            {(member.issueInProgressCount || 0) > 0 && (
              <div>
                <div className="mb-0.5 pl-1 font-medium text-blue-600">
                  In Progress <span className="text-blue-400">({member.issueInProgressCount})</span>
                </div>
                <ul className="space-y-0.5 text-gray-600">
                  {(member.inProgressIssues || []).map((issue) => (
                    <li
                      key={issue.issueId}
                      className="flex items-center gap-1.5 truncate pl-2 cursor-pointer hover:text-indigo-600"
                      onClick={() => navigate(`/issues?id=${issue.issueId}`)}
                    >
                      <AlertTriangle className={`h-3 w-3 shrink-0 ${severityColor[issue.severity] || 'text-gray-500'}`} />
                      <span className="truncate">{issue.title}</span>
                    </li>
                  ))}
                  {(member.issueInProgressCount || 0) > 5 && (
                    <li className="pl-2 text-amber-500">
                      <button onClick={() => navigate(`/issues?userId=${member.userId}`)} className="hover:underline">
                        +{(member.issueInProgressCount || 0) - (member.inProgressIssues || []).length} more
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="pl-2 text-xs text-gray-400">-</p>
        )}
      </div>
    </div>
  );
}
