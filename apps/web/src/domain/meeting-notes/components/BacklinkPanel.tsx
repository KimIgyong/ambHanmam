import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, FileText } from 'lucide-react';
import { useBacklinks } from '../hooks/useMeetingNotes';

interface BacklinkPanelProps {
  noteId: string;
}

export default function BacklinkPanel({ noteId }: BacklinkPanelProps) {
  const { t } = useTranslation(['meetingNotes']);
  const navigate = useNavigate();
  const { data: backlinks, isLoading } = useBacklinks(noteId);

  if (isLoading || !backlinks || backlinks.length === 0) return null;

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <ArrowUpRight className="h-4 w-4" />
        {t('meetingNotes:backlinks.title')} ({backlinks.length})
      </h3>
      <div className="space-y-1.5">
        {backlinks.map((bl) => (
          <button
            key={bl.noteId}
            onClick={() => navigate(`/meeting-notes/${bl.noteId}`)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-50">
              <FileText className="h-3.5 w-3.5 text-indigo-600" />
            </span>
            <span className="flex-1 truncate font-medium text-gray-800">{bl.title}</span>
            {bl.linkText && (
              <span className="truncate text-xs text-gray-400 max-w-[140px]">
                [[{bl.linkText}]]
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
