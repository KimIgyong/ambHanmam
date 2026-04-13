import { useTranslation } from 'react-i18next';
import { Pin, Eye, Paperclip } from 'lucide-react';
import { NoticeResponse } from '@amb/types';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface NoticeCardProps {
  notice: NoticeResponse;
  onClick: () => void;
}

export default function NoticeCard({ notice, onClick }: NoticeCardProps) {
  const { t } = useTranslation(['notices']);

  const isNew =
    Date.now() - new Date(notice.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-indigo-200 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          {notice.isPinned && (
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              <Pin className="h-3 w-3" />
              {t('notices:pinned')}
            </span>
          )}
          {isNew && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
              {t('notices:new')}
            </span>
          )}
          {notice.visibility === 'UNIT' && notice.unit && (
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
              {notice.unit}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {notice.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
          <span>{notice.authorName}</span>
          <span>{<LocalDateTime value={notice.createdAt} format='YYYY-MM-DD HH:mm' />}</span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" />
            {notice.viewCount}
          </span>
          {notice.attachments.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" />
              {notice.attachments.length}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
