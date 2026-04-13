import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { StickyNote, ChevronRight } from 'lucide-react';
import { useMeetingNoteList } from '@/domain/meeting-notes/hooks/useMeetingNotes';
import { dayjs } from '@/lib/dayjs';

export default function TodaySidebarNotes() {
  const { t } = useTranslation('today');
  const navigate = useNavigate();
  const { data } = useMeetingNoteList({ visibility: 'ENTITY', size: 5 });
  const notes = data?.data;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-900">
            {t('sidebar.recentNotes', { defaultValue: '최근 공유 노트' })}
          </span>
        </div>
        <button
          onClick={() => navigate('/meeting-notes')}
          className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-indigo-500 transition-colors"
        >
          {t('sidebar.viewMore', { defaultValue: '더보기' })}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {!notes?.length ? (
        <p className="text-xs text-gray-400">
          {t('sidebar.noNotes', { defaultValue: '공유된 노트가 없습니다.' })}
        </p>
      ) : (
        <div className="space-y-1.5">
          {notes.map((n) => (
            <button
              key={n.meetingNoteId}
              onClick={() => navigate(`/meeting-notes/${n.meetingNoteId}`)}
              className="group w-full text-left rounded-lg p-2 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-800 line-clamp-1 group-hover:text-indigo-600">
                {n.title}
              </span>
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
