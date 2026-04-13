import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '@/global/util/sanitize';
import { X, Trash2, Send, Link2, Users, RefreshCw, History, CheckCircle2 } from 'lucide-react';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';
import { TodoResponse } from '@amb/types';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useTodoComments, useAddTodoComment, useDeleteTodoComment, useTodoStatusLogs, useCompleteTodo, useUpsertTodoRating, useDeleteTodoRating } from '../hooks/useTodos';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';
import StarRating from '@/components/common/StarRating';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface TodoDetailModalProps {
  todo: TodoResponse;
  onClose: () => void;
  onCompleted?: () => void;
}

export default function TodoDetailModal({ todo, onClose, onCompleted }: TodoDetailModalProps) {
  const { t } = useTranslation(['todos', 'common']);
  const user = useAuthStore((s) => s.user);
  const { data: comments = [], isLoading } = useTodoComments(todo.todoId);
  const { data: statusLogs = [], isLoading: isLoadingLogs } = useTodoStatusLogs(todo.todoId);
  const addComment = useAddTodoComment();
  const deleteComment = useDeleteTodoComment();
  const completeTodo = useCompleteTodo();
  const upsertRating = useUpsertTodoRating();
  const deleteRating = useDeleteTodoRating();

  const [commentText, setCommentText] = useState('');

  // 멘션 알림에서 넘어온 경우 해당 코멘트로 스크롤
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const commentId = params.get('commentId');
    if (commentId && comments.length > 0) {
      const el = document.getElementById(`comment-${commentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-indigo-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-400'), 3000);
      }
    }
  }, [comments]);

  const isCommentEmpty = (html: string) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped) return false;
    return !/<img\s/i.test(html);
  };

  const handleAddComment = () => {
    if (isCommentEmpty(commentText)) return;
    addComment.mutate(
      { todoId: todo.todoId, content: commentText },
      { onSuccess: () => setCommentText('') },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('todos:detail.title')}</h2>
          <div className="flex items-center gap-2">
            {todo.computedStatus !== 'COMPLETED' && user?.userId === todo.userId && (
              <button
                onClick={() => {
                  completeTodo.mutate(todo.todoId, {
                    onSuccess: () => {
                      onCompleted?.();
                      onClose();
                    },
                  });
                }}
                disabled={completeTodo.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('todos:detail.markComplete')}
              </button>
            )}
            <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
        {/* Todo Info */}
        <div className="border-b px-6 py-4">
          <h3 className="text-base font-medium text-gray-900">{todo.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {todo.userName && (
              <span>
                <span className="font-medium text-gray-700">{t('todos:detail.author')}:</span> {todo.userName}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 ${
              todo.computedStatus === 'COMPLETED'
                ? 'bg-green-100 text-green-700'
                : todo.computedStatus === 'OVERDUE'
                  ? 'bg-red-100 text-red-700'
                  : todo.computedStatus === 'DUE_TODAY'
                    ? 'bg-orange-100 text-orange-700'
                    : todo.computedStatus === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-700'
                      : todo.computedStatus === 'UPCOMING_SOON'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
            }`}>
              {t(`todos:computedStatus.${todo.computedStatus}`)}
            </span>
            {todo.dueDate && <span>{t('todos:form.dueDate')}: {todo.dueDate}</span>}
            {!todo.dueDate && <span className="text-gray-400">{t('todos:columns.noDueDate')}</span>}
            {todo.startDate && <span>{t('todos:form.startDate')}: {todo.startDate}</span>}
            {todo.daysUntilDue !== null && todo.computedStatus !== 'COMPLETED' && (
              <span className={`rounded-full px-2 py-0.5 font-semibold ${
                todo.daysUntilDue < 0 ? 'bg-red-100 text-red-700' : todo.daysUntilDue === 0 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {todo.daysUntilDue < 0 ? t('todos:badge.overdueDays', { n: Math.abs(todo.daysUntilDue) }) : todo.daysUntilDue === 0 ? t('todos:badge.dday') : t('todos:badge.remainingDays', { n: todo.daysUntilDue })}
              </span>
            )}
          </div>

          {/* 완료일 표시 */}
          {todo.computedStatus === 'COMPLETED' && todo.completedAt && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <span className="font-medium">{t('todos:completedAt')}:</span>
              <span>{<LocalDateTime value={todo.completedAt} format='YYYY-MM-DD HH:mm' />}</span>
            </div>
          )}

          {todo.description && (
            <div
              className="prose prose-sm mt-3 max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(todo.description) }}
            />
          )}

          {/* 연결된 이슈 표시 */}
          {todo.issueTitle && (
            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
              <Link2 className="h-3.5 w-3.5" />
              <span className="font-medium">{t('todos:detail.linkedIssue')}:</span>
              <span>{todo.issueTitle}</span>
            </div>
          )}

          {todo.tags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {todo.tags.split(',').map((tag) => (
                <span key={tag.trim()} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {todo.recurrenceType && (
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="font-medium">{t('todos:recurrence.label')}:</span>
              <span>{t(`todos:recurrence.${todo.recurrenceType}`)}</span>
            </div>
          )}

          {/* Participants */}
          {todo.participants && todo.participants.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Users className="h-3.5 w-3.5" />
                {t('todos:detail.participants')} ({todo.participants.length})
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {todo.participants.map((p) => (
                  <span
                    key={p.participantId}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-200 text-[10px] font-semibold text-blue-800">
                      {p.userName.charAt(0)}
                    </span>
                    {p.userName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 border-t border-gray-100 px-6 pt-3">
          <span className="text-sm font-medium text-gray-500">{t('todos:detail.rating')}:</span>
          <StarRating
            value={todo.myRating}
            onChange={(rating) => {
              if (rating === 0) {
                deleteRating.mutate(todo.todoId);
              } else {
                upsertRating.mutate({ todoId: todo.todoId, rating });
              }
            }}
            isOwn={user?.userId === todo.userId}
            avgRating={todo.avgRating}
            ratingCount={todo.ratingCount}
            size="sm"
          />
        </div>

        {/* Comments */}
        <div className="px-6 py-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">{t('todos:comments.title')} ({comments.length})</h3>
          <div className="mb-3">
            <RichTextEditor
              content={commentText}
              onChange={setCommentText}
              placeholder={t('todos:comments.placeholder')}
              minHeight="80px"
              enableMention
            />
            <div className="mt-1.5 flex items-center justify-end">
              <button
                onClick={handleAddComment}
                disabled={isCommentEmpty(commentText)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {isLoading ? (
            <div className="py-2 text-center text-xs text-gray-400">{t('common:loading')}</div>
          ) : comments.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-400">{t('todos:comments.noComments')}</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.commentId} id={`comment-${comment.commentId}`} className="rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{comment.authorName}</span>
                      <span className="text-xs text-gray-400">
                        <LocalDateTime value={comment.createdAt} format='YYYY-MM-DD HH:mm' />
                      </span>
                    </div>
                    {user?.userId === comment.authorId && (
                      <button
                        onClick={() => {
                          if (window.confirm(t('todos:comments.deleteConfirm'))) {
                            deleteComment.mutate(comment.commentId);
                          }
                        }}
                        className="rounded p-0.5 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div
                    className="prose prose-sm mt-1 max-w-none text-gray-600 [&_img]:max-w-full [&_img]:rounded [&_a]:text-indigo-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content) }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change History */}
        <div className="border-t px-6 py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <History className="h-4 w-4" />
            {t('todos:statusHistory')} ({statusLogs.length})
          </div>
          {isLoadingLogs ? (
            <div className="py-2 text-center text-xs text-gray-400">{t('common:loading')}</div>
          ) : statusLogs.length === 0 ? (
            <div className="py-2 text-center text-xs text-gray-400">{t('todos:noStatusLogs')}</div>
          ) : (
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {statusLogs.map((log) => {
                const isDue = log.fromStatus.startsWith('DUE:') && log.toStatus.startsWith('DUE:');
                return (
                  <div key={log.logId} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {isDue ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">{log.fromStatus.replace('DUE:', '')}</span>
                          <span className="text-gray-400">&rarr;</span>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">{log.toStatus.replace('DUE:', '')}</span>
                          <span className="text-xs text-amber-600">📅</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${
                            log.fromStatus === 'COMPLETED' ? 'bg-green-100 text-green-700'
                              : log.fromStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>{t(`todos:status.${log.fromStatus}`)}</span>
                          <span className="text-gray-400">&rarr;</span>
                          <span className={`rounded-full px-2 py-0.5 font-medium ${
                            log.toStatus === 'COMPLETED' ? 'bg-green-100 text-green-700'
                              : log.toStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>{t(`todos:status.${log.toStatus}`)}</span>
                        </div>
                      )}
                      <span className="ml-auto text-xs text-gray-400">
                        <LocalDateTime value={log.changedAt} format='YYYY-MM-DD HH:mm' />
                      </span>
                    </div>
                    {log.note && <div className="mt-1 text-xs italic text-gray-500">{log.note}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Translation Panel */}
        <div className="border-t px-6 py-4">
          <TranslationPanel
            sourceType="TODO"
            sourceId={todo.todoId}
            sourceFields={['title', 'content']}
            originalLang={todo.originalLang || 'ko'}
            originalContent={{ title: todo.title, content: todo.description || '' }}
          />
        </div>
        </div>{/* end Scrollable Body */}
      </div>
    </div>
  );
}
