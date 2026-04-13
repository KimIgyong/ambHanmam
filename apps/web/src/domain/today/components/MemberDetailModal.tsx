import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '@/global/util/sanitize';
import { MessageCircle, X, Target, EyeOff, Eye, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStartDm } from '../../amoeba-talk/hooks/useTalk';
import { useTalkStore } from '../../amoeba-talk/store/talk.store';
import { useToggleMemberHidden } from '../hooks/useMyToday';
import { useApproveAttendance } from '../../attendance/hooks/useAttendance';
import TodayAttendanceBadge from './TodayAttendanceBadge';
import type { MemberTodaySummary } from '../service/today.service';

interface Props {
  member: MemberTodaySummary;
  onClose: () => void;
  isMaster?: boolean;
}

export default function MemberDetailModal({ member, onClose, isMaster }: Props) {
  const { t } = useTranslation('today');
  const navigate = useNavigate();
  const startDm = useStartDm();
  const { setCurrentChannelId } = useTalkStore();
  const toggleHidden = useToggleMemberHidden();
  const approveAttendance = useApproveAttendance();

  const handleDm = () => {
    startDm.mutate(member.userId, {
      onSuccess: (channel) => {
        if (channel) setCurrentChannelId(channel.id);
        navigate('/amoeba-talk');
        onClose();
      },
    });
  };

  const handleToggleHidden = () => {
    toggleHidden.mutate({ userId: member.userId, hidden: !member.isHidden });
  };

  const handleApproveWfh = (status: 'APPROVED' | 'REJECTED') => {
    if (!member.todayAttendanceId) return;
    approveAttendance.mutate(
      { id: member.todayAttendanceId, status },
      {
        onSuccess: () => {
          toast.success(
            status === 'APPROVED'
              ? t('attendance.approved', { defaultValue: 'WFH 승인됨' })
              : t('attendance.rejected', { defaultValue: 'WFH 거절됨 (결근 처리)' }),
          );
          onClose();
        },
      },
    );
  };

  const showApprovalButtons = isMaster && member.todayAttendanceApproval === 'PENDING' && member.todayAttendanceId;

  const severityColor: Record<string, string> = {
    CRITICAL: 'text-red-600 bg-red-50',
    MAJOR: 'text-orange-600 bg-orange-50',
    MINOR: 'text-yellow-600 bg-yellow-50',
    TRIVIAL: 'text-gray-600 bg-gray-50',
  };

  // Tasks 통합: overdue first (red), then todayDue (indigo)
  const allTasks = [
    ...(member.overdueTodos || []).map((todo) => ({ ...todo, type: 'overdue' as const })),
    ...(member.todayDueTodos || []).map((todo) => ({ ...todo, type: 'todayDue' as const })),
  ];
  const totalTaskCount = member.todayDueCount + member.overdueCount;

  // Issues: To Review / In Progress
  const toReviewIssues = member.toReviewIssues || [];
  const inProgressIssues = member.inProgressIssues || [];
  const toReviewCount = member.toReviewCount || 0;
  const issueInProgressCount = member.issueInProgressCount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <TodayAttendanceBadge type={member.todayAttendanceType} approval={member.todayAttendanceApproval} />
              <h3 className="text-lg font-semibold text-gray-900">{member.userName}</h3>
              {member.isHidden && (
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {t('all.hidden', { defaultValue: 'Hidden' })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {[member.unitName || member.department, member.position].filter(Boolean).join(' / ') || member.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isMaster && (
              <button
                onClick={handleToggleHidden}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                  member.isHidden
                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={member.isHidden ? t('all.unhide', { defaultValue: 'Show' }) : t('all.hide', { defaultValue: 'Hide' })}
              >
                {member.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={handleDm}
              className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
            >
              <MessageCircle className="h-4 w-4" />
              {t('all.sendDm')}
            </button>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 콘텐츠 (스크롤 영역) */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
          {/* Mission 섹션 */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">{t('mission.title')}</span>
            </div>
            {member.missionContent ? (
              <div
                className="prose prose-sm max-w-none rounded-lg bg-indigo-50/50 p-3 text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(member.missionContent) }}
              />
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-400">-</p>
            )}
          </div>

          {/* Tasks 통합 섹션 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                Tasks <span className="text-indigo-600">({totalTaskCount})</span>
              </span>
            </div>
            {allTasks.length > 0 ? (
              <ul className="space-y-1">
                {allTasks.map((todo) => (
                  <li
                    key={todo.todoId}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        todo.type === 'overdue' ? 'bg-red-400' : 'bg-indigo-400'
                      }`}
                    />
                    <span className={`flex-1 truncate ${todo.type === 'overdue' ? 'text-red-600' : 'text-gray-700'}`}>
                      {todo.title}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">{todo.dueDate}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-400">{t('empty.todayDue')}</p>
            )}
            {/* 범례 */}
            {allTasks.length > 0 && (
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {t('summary.overdue')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  {t('summary.todayDue')}
                </span>
              </div>
            )}
          </div>

          {/* Issues 섹션 — To Review / In Progress */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                Issues <span className="text-amber-600">({t('snapshot.issueTotal', { defaultValue: '총' })} : {t('snapshot.issueCount', { count: member.issueTotal4w || 0, defaultValue: `${member.issueTotal4w || 0}건` })} | {t('snapshot.issueResolved', { count: member.issueResolved4w || 0, defaultValue: `${member.issueResolved4w || 0}건 해결` })})</span>
                <span className="ml-1 text-xs text-gray-400 font-normal">{t('snapshot.last4weeks', { defaultValue: '최근 4주' })}</span>
              </span>
            </div>
            {(toReviewCount > 0 || issueInProgressCount > 0) ? (
              <div className="space-y-3">
                {/* To Review */}
                {toReviewCount > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-rose-600">
                      To Review <span className="text-rose-400">({toReviewCount})</span>
                    </div>
                    <div className="rounded-lg border border-gray-100">
                      <ul className="divide-y divide-gray-50">
                        {toReviewIssues.map((issue) => (
                          <li
                            key={issue.issueId}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                            onClick={() => { navigate(`/issues?id=${issue.issueId}`); onClose(); }}
                          >
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${severityColor[issue.severity] || 'text-gray-600 bg-gray-50'}`}>
                              {issue.severity}
                            </span>
                            <span className="flex-1 truncate text-gray-700">{issue.title}</span>
                          </li>
                        ))}
                      </ul>
                      {toReviewCount > 5 && (
                        <div className="border-t border-gray-100 px-2 py-1.5 text-center">
                          <button
                            onClick={() => { navigate(`/issues?userId=${member.userId}`); onClose(); }}
                            className="text-xs font-medium text-amber-500 hover:text-amber-700 hover:underline"
                          >
                            +{toReviewCount - toReviewIssues.length} more
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* In Progress */}
                {issueInProgressCount > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-blue-600">
                      In Progress <span className="text-blue-400">({issueInProgressCount})</span>
                    </div>
                    <div className="rounded-lg border border-gray-100">
                      <ul className="divide-y divide-gray-50">
                        {inProgressIssues.map((issue) => (
                          <li
                            key={issue.issueId}
                            className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer"
                            onClick={() => { navigate(`/issues?id=${issue.issueId}`); onClose(); }}
                          >
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${severityColor[issue.severity] || 'text-gray-600 bg-gray-50'}`}>
                              {issue.severity}
                            </span>
                            <span className="flex-1 truncate text-gray-700">{issue.title}</span>
                          </li>
                        ))}
                      </ul>
                      {issueInProgressCount > 5 && (
                        <div className="border-t border-gray-100 px-2 py-1.5 text-center">
                          <button
                            onClick={() => { navigate(`/issues?userId=${member.userId}`); onClose(); }}
                            className="text-xs font-medium text-amber-500 hover:text-amber-700 hover:underline"
                          >
                            +{issueInProgressCount - inProgressIssues.length} more
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-400">{t('empty.issues')}</p>
            )}
          </div>
        </div>

        {/* 닫기 + WFH 승인 */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <div className="flex items-center gap-2">
            {showApprovalButtons && (
              <>
                <button
                  onClick={() => handleApproveWfh('APPROVED')}
                  disabled={approveAttendance.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {t('attendance.approve', { defaultValue: 'WFH 승인' })}
                </button>
                <button
                  onClick={() => handleApproveWfh('REJECTED')}
                  disabled={approveAttendance.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  {t('attendance.reject', { defaultValue: '거절 (결근)' })}
                </button>
              </>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            {t('close', { ns: 'common', defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
}
