import { MeetingNoteResponse } from '@amb/types';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, User, StickyNote, Star, MessageCircle, Users } from 'lucide-react';

interface MeetingNoteCardProps {
  note: MeetingNoteResponse;
  onClick: () => void;
}

const visibilityColors: Record<string, string> = {
  PRIVATE: 'bg-gray-100 text-gray-600',
  CELL: 'bg-purple-100 text-purple-600',
  GROUP: 'bg-purple-100 text-purple-600',
  ENTITY: 'bg-blue-100 text-blue-600',
  UNIT: 'bg-blue-100 text-blue-600',
};

const typeColors: Record<string, string> = {
  MEETING_NOTE: 'bg-amber-50 text-amber-700',
  MEMO: 'bg-sky-50 text-sky-700',
};

export default function MeetingNoteCard({ note, onClick }: MeetingNoteCardProps) {
  const { t } = useTranslation(['meetingNotes']);
  const isMeetingNote = note.type === 'MEETING_NOTE';

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-indigo-200 hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isMeetingNote ? (
            <FileText className="h-4 w-4 text-amber-500" />
          ) : (
            <StickyNote className="h-4 w-4 text-sky-500" />
          )}
          <h3 className="font-medium text-gray-900 line-clamp-1">{note.title}</h3>
        </div>
        <div className="flex shrink-0 gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[note.type] || typeColors.MEMO}`}>
            {t(`meetingNotes:type.${note.type}`)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${visibilityColors[note.visibility] || visibilityColors.PRIVATE}`}>
            {t(`meetingNotes:visibility.${note.visibility}`)}
          </span>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {note.authorName}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {isMeetingNote ? note.meetingDate : note.createdAt.split('T')[0]}
        </span>
        {note.participants && note.participants.length > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {note.participants.length}
          </span>
        )}
        {note.avgRating !== null && note.avgRating > 0 && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {note.avgRating}
          </span>
        )}
        {note.commentCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {note.commentCount}
          </span>
        )}
      </div>
    </button>
  );
}
