import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit2, Trash2, Eye, Paperclip, Download, Pin } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import {
  useNoticeDetail,
  useUpdateNotice,
  useDeleteNotice,
  useDeleteAttachment,
} from '../hooks/useNotices';
import NoticeFormModal from '../components/NoticeFormModal';
import NoticeDeleteConfirmModal from '../components/NoticeDeleteConfirmModal';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';
import { LocalDateTime } from '@/components/common/LocalDateTime';

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['notices', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'MANAGER';

  const { data: notice, isLoading } = useNoticeDetail(id!);
  const updateMutation = useUpdateNotice();
  const deleteMutation = useDeleteNotice();
  const deleteAttMutation = useDeleteAttachment();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        {t('common:loading')}
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        {t('notices:noNotices')}
      </div>
    );
  }

  const handleUpdate = (data: FormData | { title?: string; content?: string; visibility?: string; unit?: string; is_pinned?: boolean }) => {
    updateMutation.mutate(
      { id: notice.noticeId, data: data as { title?: string; content?: string; visibility?: string; unit?: string; is_pinned?: boolean } },

      { onSuccess: () => setShowEdit(false) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(notice.noticeId, {
      onSuccess: () => navigate('/notices'),
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    deleteAttMutation.mutate(attachmentId);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/notices')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('notices:title')}
          </button>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4" />
                {t('common:edit')}
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                {t('common:delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* Title + Meta */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              {notice.isPinned && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Pin className="h-3 w-3" />
                  {t('notices:pinned')}
                </span>
              )}
              {notice.visibility === 'UNIT' && notice.unit && (
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                  {notice.unit}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{notice.title}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span>
                {t('notices:detail.author')}: <strong className="text-gray-700">{notice.authorName}</strong>
              </span>
              <span>
                {t('notices:detail.createdAt')}: {<LocalDateTime value={notice.createdAt} format='YYYY-MM-DD HH:mm' />}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {notice.viewCount}
              </span>
            </div>
          </div>

          {/* Body */}
          <div
            className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: notice.content }}
          />

          {/* Attachments */}
          {notice.attachments.length > 0 && (
            <div className="mt-8 rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Paperclip className="h-4 w-4" />
                {t('notices:detail.attachments')} ({notice.attachments.length})
              </h3>
              <div className="space-y-2">
                {notice.attachments.map((att) => (
                  <a
                    key={att.attachmentId}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    <span className="truncate text-gray-700">{att.originalName}</span>
                    <Download className="h-4 w-4 shrink-0 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Translation Panel */}
          <TranslationPanel
            sourceType="NOTICE"
            sourceId={notice.noticeId}
            sourceFields={['title', 'content']}
            originalLang={notice.originalLang || 'ko'}
            originalContent={{ title: notice.title, content: notice.content }}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <NoticeFormModal
          notice={notice}
          onSubmit={handleUpdate}
          onClose={() => setShowEdit(false)}
          onDeleteAttachment={handleDeleteAttachment}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <NoticeDeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
