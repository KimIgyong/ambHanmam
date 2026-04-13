import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useProjectComments, useAddProjectComment, useDeleteProjectComment } from '../hooks/useProject';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface ProjectCommentSectionProps {
  projectId: string;
}

export default function ProjectCommentSection({ projectId }: ProjectCommentSectionProps) {
  const { t } = useTranslation('project');
  const user = useAuthStore((s) => s.user);
  const { data: comments, isLoading } = useProjectComments(projectId);
  const addComment = useAddProjectComment();
  const deleteComment = useDeleteProjectComment();
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    addComment.mutate(
      { projectId, content: trimmed },
      { onSuccess: () => setContent('') },
    );
  };

  const handleDelete = (commentId: string) => {
    if (!window.confirm(t('comments.deleteConfirm'))) return;
    deleteComment.mutate({ projectId, commentId });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('comments.title')}</h3>

      {/* Comment Input */}
      <div className="flex gap-2 mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('comments.placeholder')}
          rows={2}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:border-blue-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || addComment.isPending}
          className="shrink-0 flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 self-end"
        >
          <Send className="h-3.5 w-3.5" />
          {t('comments.submit')}
        </button>
      </div>

      {/* Comment List */}
      {isLoading ? (
        <div className="text-center text-sm text-gray-400 py-4">Loading...</div>
      ) : !comments || comments.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-4">{t('comments.empty')}</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.commentId} className="group flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                {c.userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">{c.userName}</span>
                  <span className="text-xs text-gray-400">
                    <LocalDateTime value={c.createdAt} format="YYYY-MM-DD HH:mm" />
                  </span>
                  {user?.userId === c.userId && (
                    <button
                      onClick={() => handleDelete(c.commentId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
