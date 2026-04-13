import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { WorkItemCommentResponse } from '@amb/types';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface CommentPanelProps {
  workItemId: string;
}

export default function CommentPanel({ workItemId }: CommentPanelProps) {
  const { t } = useTranslation('acl');
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['work-items', workItemId, 'comments'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: WorkItemCommentResponse[] }>(
        `/work-items/${workItemId}/comments`,
      );
      return res.data.data;
    },
  });

  const addCommentMut = useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/work-items/${workItemId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items', workItemId, 'comments'] });
      setNewComment('');
    },
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete(`/work-items/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items', workItemId, 'comments'] });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addCommentMut.mutate(newComment.trim());
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-900">{t('comment.title')}</h4>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="mb-4 space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              onDelete={(id) => {
                if (confirm(t('comment.deleteConfirm'))) deleteCommentMut.mutate(id);
              }}
              t={t}
            />
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-400">No comments yet.</p>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={t('comment.placeholder')}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim() || addCommentMut.isPending}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {addCommentMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onDelete,
  t,
}: {
  comment: WorkItemCommentResponse;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const typeColors: Record<string, string> = {
    FEEDBACK: 'bg-amber-100 text-amber-700',
    APPROVAL: 'bg-green-100 text-green-700',
    REQUEST: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="group">
      <div className="flex items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          {comment.authorName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-900">{comment.authorName}</span>
            {comment.type !== 'COMMENT' && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${typeColors[comment.type] || ''}`}>
                {t(`comment.type.${comment.type}`)}
              </span>
            )}
            <span className="text-[10px] text-gray-400">
              {<LocalDateTime value={comment.createdAt} format='YYYY-MM-DD HH:mm' />}
            </span>
            {comment.isEdited && (
              <span className="text-[10px] text-gray-400">({t('comment.edited')})</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-700">{comment.content}</p>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-100 pl-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.commentId} comment={reply} onDelete={onDelete} t={t} />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(comment.commentId)}
          className="hidden shrink-0 text-xs text-red-400 hover:text-red-600 group-hover:block"
        >
          {t('comment.delete')}
        </button>
      </div>
    </div>
  );
}
