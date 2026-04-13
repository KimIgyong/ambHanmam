import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '@/global/util/sanitize';
import { Send, Trash2, Reply } from 'lucide-react';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import {
  useNoteComments,
  useAddNoteComment,
  useDeleteNoteComment,
} from '../hooks/useMeetingNotes';

interface NoteCommentSectionProps {
  noteId: string;
}

export default function NoteCommentSection({ noteId }: NoteCommentSectionProps) {
  const { t } = useTranslation(['meetingNotes', 'common']);
  const user = useAuthStore((s) => s.user);
  const { data: comments = [], isLoading } = useNoteComments(noteId);
  const addComment = useAddNoteComment();
  const deleteComment = useDeleteNoteComment();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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
    if (isCommentEmpty(newComment)) return;
    addComment.mutate(
      { noteId, content: newComment },
      { onSuccess: () => setNewComment('') },
    );
  };

  const handleDelete = (commentId: string) => {
    if (confirm(t('meetingNotes:comment.deleteConfirm'))) {
      deleteComment.mutate({ noteId, commentId });
    }
  };

  const handleAddReply = () => {
    if (!replyingTo || isCommentEmpty(replyText)) return;
    addComment.mutate(
      { noteId, content: replyText, parentId: replyingTo },
      { onSuccess: () => { setReplyText(''); setReplyingTo(null); } },
    );
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">
        {t('meetingNotes:comment.title')} ({comments.length})
      </h3>

      {/* Comment List */}
      {isLoading ? (
        <div className="py-4 text-center text-sm text-gray-400">{t('common:loading')}</div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-400">
          {t('meetingNotes:comment.noComments')}
        </div>
      ) : (
        <div className="mb-4 space-y-3">
          {comments.map((c) => (
            <div key={c.commentId} id={`comment-${c.commentId}`} className="rounded-lg overflow-hidden border border-gray-100">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                  {c.authorName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-900">{c.authorName}</span>
                <span className="text-xs text-gray-400">
                  {<LocalDateTime value={c.createdAt} format='YYYY-MM-DD HH:mm' />}
                </span>
                {user?.userId === c.authorId && (
                  <button
                    onClick={() => handleDelete(c.commentId)}
                    className="ml-auto rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => { setReplyingTo(replyingTo === c.commentId ? null : c.commentId); setReplyText(''); }}
                  className={`${user?.userId !== c.authorId ? 'ml-auto' : ''} rounded p-1 transition-colors ${replyingTo === c.commentId ? 'text-indigo-600' : 'text-gray-300 hover:text-indigo-500'}`}
                  title={t('meetingNotes:comment.reply')}
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="bg-gray-50 px-3 py-2">
                <div
                  className="prose prose-sm max-w-none text-gray-600 [&_img]:max-w-full [&_img]:rounded [&_a]:text-indigo-600 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.content) }}
                />
              </div>
              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="border-t border-gray-100">
                  {c.replies.map((reply) => (
                    <div key={reply.commentId} className="flex gap-2 bg-white px-3 py-2 ml-4 border-b border-gray-50 last:border-b-0">
                      <Reply className="h-3 w-3 text-gray-300 mt-1 shrink-0 rotate-180" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">{reply.authorName}</span>
                            <span className="text-[11px] text-gray-400">
                              <LocalDateTime value={reply.createdAt} format="YYYY-MM-DD HH:mm" />
                            </span>
                          </div>
                          {user?.userId === reply.authorId && (
                            <button
                              onClick={() => handleDelete(reply.commentId)}
                              className="rounded p-0.5 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div
                          className="prose prose-sm max-w-none text-gray-600 text-xs [&_img]:max-w-full [&_img]:rounded [&_a]:text-indigo-600 [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(reply.content) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Reply input */}
              {replyingTo === c.commentId && (
                <div className="border-t border-gray-100 bg-white px-3 py-2 ml-4">
                  <div className="text-[11px] text-gray-400 mb-1">{t('meetingNotes:comment.replyTo', { name: c.authorName })}</div>
                  <RichTextEditor
                    content={replyText}
                    onChange={setReplyText}
                    placeholder={t('meetingNotes:comment.replyPlaceholder')}
                    minHeight="60px"
                    enableMention
                  />
                  <div className="flex justify-end gap-1.5 mt-1.5">
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="rounded px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      {t('common:actions.cancel')}
                    </button>
                    <button
                      onClick={handleAddReply}
                      disabled={isCommentEmpty(replyText)}
                      className="rounded bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Send className="h-3 w-3 inline mr-1" />
                      {t('meetingNotes:comment.reply')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      <div>
        <RichTextEditor
          content={newComment}
          onChange={setNewComment}
          placeholder={t('meetingNotes:comment.placeholder')}
          minHeight="80px"
          enableMention
        />
        <div className="flex items-center justify-end mt-1.5">
          <button
            onClick={handleAddComment}
            disabled={isCommentEmpty(newComment) || addComment.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {t('meetingNotes:comment.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
