import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Pin, ChevronRight } from 'lucide-react';
import { useRecentNotices } from '@/domain/notices/hooks/useNotices';
import { dayjs } from '@/lib/dayjs';

export default function TodaySidebarNotices() {
  const { t } = useTranslation('today');
  const navigate = useNavigate();
  const { data: notices } = useRecentNotices(2);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-900">
            {t('sidebar.notices', { defaultValue: '공지사항' })}
          </span>
        </div>
        <button
          onClick={() => navigate('/notices')}
          className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-indigo-500 transition-colors"
        >
          {t('sidebar.viewMore', { defaultValue: '더보기' })}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {!notices?.length ? (
        <p className="text-xs text-gray-400">
          {t('sidebar.noNotices', { defaultValue: '공지사항이 없습니다.' })}
        </p>
      ) : (
        <div className="space-y-2">
          {notices.map((n) => (
            <button
              key={n.noticeId}
              onClick={() => navigate(`/notices/${n.noticeId}`)}
              className="group w-full text-left rounded-lg p-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-1.5">
                {n.isPinned && <Pin className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />}
                <span className="text-xs font-medium text-gray-800 line-clamp-1 group-hover:text-indigo-600">
                  {n.title}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-gray-400">
                {n.authorName} · {dayjs(n.createdAt).format('MM.DD')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
