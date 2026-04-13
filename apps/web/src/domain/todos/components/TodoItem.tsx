import { TodoResponse, TodoComputedStatus } from '@amb/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Trash2, MessageSquare, Link2, RefreshCw, ArrowRightCircle, CheckSquare, Square } from 'lucide-react';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import TodoActionConfirmModal from './TodoActionConfirmModal';

interface TodoItemProps {
  todo: TodoResponse;
  onToggleComplete: (todoId: string, isCompleted: boolean) => void;
  onEdit: (todo: TodoResponse) => void;
  onDelete: (todo: TodoResponse) => void;
  onShowHistory?: (todoId: string) => void;
  onShowDetail?: (todoId: string) => void;
  onConvertToIssue?: (todo: TodoResponse) => void;
  readOnly?: boolean;
  currentUserId?: string;
}

const computedStatusBadge: Record<string, { bg: string; text: string }> = {
  OVERDUE: { bg: 'bg-red-100', text: 'text-red-700' },
  DUE_TODAY: { bg: 'bg-orange-100', text: 'text-orange-700' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  UPCOMING_SOON: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  UPCOMING: { bg: 'bg-gray-100', text: 'text-gray-600' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
};

function getDdayLabel(daysUntilDue: number | null, computedStatus: TodoComputedStatus, t: (key: string, opts?: Record<string, unknown>) => string): string | null {
  if (daysUntilDue === null) return null;
  if (computedStatus === 'COMPLETED') return null;
  if (daysUntilDue < 0) return t('todos:badge.overdueDays', { n: Math.abs(daysUntilDue) });
  if (daysUntilDue === 0) return t('todos:badge.dday');
  return t('todos:badge.remainingDays', { n: daysUntilDue });
}

export default function TodoItem({ todo, onToggleComplete, onEdit, onDelete, onShowHistory, onShowDetail, onConvertToIssue, readOnly, currentUserId }: TodoItemProps) {
  const { t } = useTranslation(['todos']);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'convert' | null>(null);
  const isCompleted = todo.computedStatus === 'COMPLETED';
  const isOwner = !currentUserId || todo.userId === currentUserId;
  const effectiveReadOnly = readOnly || !isOwner;
  const badge = computedStatusBadge[todo.computedStatus] || computedStatusBadge.UPCOMING;
  const ddayLabel = getDdayLabel(todo.daysUntilDue, todo.computedStatus, t);

  const borderClass = {
    OVERDUE: 'border-red-300 bg-red-50',
    DUE_TODAY: 'border-orange-200 bg-orange-50/30',
    IN_PROGRESS: 'border-blue-200 bg-white hover:bg-gray-50',
    UPCOMING_SOON: 'border-yellow-200 bg-yellow-50/30 hover:bg-yellow-50',
    UPCOMING: 'border-gray-200 bg-white hover:bg-gray-50',
    COMPLETED: 'border-gray-200 bg-gray-50 opacity-60',
  }[todo.computedStatus] || 'border-gray-200 bg-white hover:bg-gray-50';

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${borderClass}`}>
      {/* 완료 체크박스 - 제목 앞 */}
      {!effectiveReadOnly && (
        <div className="group/check relative shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!isCompleted) {
                setConfirmAction('complete');
              } else {
                onToggleComplete(todo.todoId, isCompleted);
              }
            }}
            className={`rounded p-0.5 ${isCompleted ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-indigo-500'}`}
          >
            {isCompleted ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </button>
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/check:opacity-100">
            {isCompleted ? t('todos:reopenTodo') : t('todos:completeTodo')}
          </span>
        </div>
      )}
      {/* 이슈 등록 - 제목 앞 */}
      {onConvertToIssue && !effectiveReadOnly && !todo.issueId && (
        <div className="group/convert relative shrink-0">
          <button
            type="button"
            onClick={() => setConfirmAction('convert')}
            className="rounded p-0.5 text-gray-400 hover:text-orange-500"
          >
            <ArrowRightCircle className="h-4 w-4" />
          </button>
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/convert:opacity-100">
            {t('todos:convertToIssue')}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {todo.userName && (
          <span className="text-xs font-medium text-indigo-600">{todo.userName}</span>
        )}
        <button
          type="button"
          onClick={() => isOwner ? onEdit(todo) : onShowDetail?.(todo.todoId)}
          className={`text-left text-sm font-medium cursor-pointer hover:underline ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}
        >
          {todo.title}
        </button>
        {todo.description && (
          <div className="mt-0.5 truncate text-xs text-gray-500">{todo.description.replace(/<[^>]*>/g, '')}</div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Computed status badge */}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
            {t(`todos:computedStatus.${todo.computedStatus}`)}
          </span>
          {/* D-day badge */}
          {ddayLabel && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {ddayLabel}
            </span>
          )}
          {/* Starts in N days (for UPCOMING_SOON) */}
          {todo.computedStatus === 'UPCOMING_SOON' && todo.daysUntilStart !== null && todo.daysUntilStart > 0 && (
            <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700">
              {t('todos:badge.startsInDays', { n: todo.daysUntilStart })}
            </span>
          )}
          {todo.dueDate && (
            <span className={`text-xs ${todo.computedStatus === 'OVERDUE' ? 'font-medium text-red-600' : 'text-gray-400'}`}>
              {todo.dueDate}
            </span>
          )}
          {!todo.dueDate && !isCompleted && (
            <span className="text-xs text-gray-400">{t('todos:columns.noDueDate')}</span>
          )}
          {isCompleted && todo.completedAt && (
            <span className="text-xs text-green-600">
              {t('todos:completedAt')}: {<LocalDateTime value={todo.completedAt} format='YYYY-MM-DD HH:mm' />}
            </span>
          )}
          {todo.issueTitle && (
            <span className="flex items-center gap-0.5 text-xs text-orange-600">
              <Link2 className="h-3 w-3" />
              {todo.issueTitle}
            </span>
          )}
          {todo.tags && todo.tags.split(',').map((tag) => (
            <span key={tag.trim()} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
              {tag.trim()}
            </span>
          ))}
          {todo.participants && todo.participants.length > 0 && (
            <div className="flex -space-x-1">
              {todo.participants.slice(0, 3).map((p) => (
                <div
                  key={p.userId}
                  title={p.userName}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-indigo-100 text-[10px] font-medium text-indigo-700"
                >
                  {p.userName.charAt(0)}
                </div>
              ))}
              {todo.participants.length > 3 && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-gray-200 text-[10px] font-medium text-gray-600">
                  +{todo.participants.length - 3}
                </div>
              )}
            </div>
          )}
          {todo.recurrenceType && (
            <span className="flex items-center gap-0.5 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-600">
              <RefreshCw className="h-3 w-3" />
              {t(`todos:recurrence.${todo.recurrenceType}`)}
            </span>
          )}
        </div>
      </div>

      {/* 오른쪽 액션 영역 */}
      <div className="flex shrink-0 items-center gap-1">
        {todo.commentCount > 0 && onShowDetail && (
          <button
            onClick={() => onShowDetail(todo.todoId)}
            className="flex items-center gap-0.5 rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
            title={t('todos:comments.title')}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{todo.commentCount}</span>
          </button>
        )}
        {onShowHistory && !effectiveReadOnly && (
          <button
            onClick={() => onShowHistory(todo.todoId)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('todos:statusHistory')}
          >
            <History className="h-3.5 w-3.5" />
          </button>
        )}
        {!effectiveReadOnly && (
          <button
            onClick={() => onDelete(todo)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <TodoActionConfirmModal
        isOpen={confirmAction !== null}
        message={confirmAction === 'complete' ? t('todos:confirm.complete') : t('todos:confirm.convertToIssue')}
        confirmColor={confirmAction === 'convert' ? 'orange' : 'indigo'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === 'complete') {
            onToggleComplete(todo.todoId, isCompleted);
          } else if (confirmAction === 'convert' && onConvertToIssue) {
            onConvertToIssue(todo);
          }
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
