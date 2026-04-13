import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText, StickyNote } from 'lucide-react';
import { useProjectNotes } from '../hooks/useProject';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface ProjectNotesTabProps {
  projectId: string;
}

export default function ProjectNotesTab({ projectId }: ProjectNotesTabProps) {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const { data: notes, isLoading } = useProjectNotes(projectId);

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">{t('notes.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('notes.title')}</h3>
      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {notes.map((note) => (
          <button
            key={note.noteId}
            onClick={() => navigate(`/meeting-notes/${note.noteId}`)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              {note.type === 'MEETING_NOTE' ? (
                <FileText className="h-4 w-4 text-blue-600" />
              ) : (
                <StickyNote className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{note.type === 'MEETING_NOTE' ? t('notes.meetingNote') : t('notes.memo')}</span>
                <span>·</span>
                <span>{note.authorName}</span>
                <span>·</span>
                <LocalDateTime value={note.meetingDate} format="YYYY-MM-DD" />
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {note.visibility}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
