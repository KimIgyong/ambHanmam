import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sanitizeHtml } from '@/global/util/sanitize';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Pencil, Trash2, Calendar, User, Eye, Clock, Users, FolderKanban, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import {
  useMeetingNoteDetail,
  useUpdateMeetingNote,
  useDeleteMeetingNote,
  useUpsertNoteRating,
} from '../hooks/useMeetingNotes';
import MeetingNoteFormModal from '../components/MeetingNoteFormModal';
import NoteCommentSection from '../components/NoteCommentSection';
import BacklinkPanel from '../components/BacklinkPanel';
import StarRating from '@/components/common/StarRating';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';
import { MeetingNoteFormData } from '../service/meeting-note.service';

export default function MeetingNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['meetingNotes', 'common']);
  const user = useAuthStore((s) => s.user);
  const { data: note, isLoading } = useMeetingNoteDetail(id!);
  const updateNote = useUpdateMeetingNote();
  const deleteNote = useDeleteMeetingNote();
  const upsertRating = useUpsertNoteRating();
  const [showEditModal, setShowEditModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">{t('common:loading')}</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">{t('meetingNotes:noNotes')}</div>
      </div>
    );
  }

  const isAuthor = user?.userId === note.userId;
  const isMeetingNote = note.type === 'MEETING_NOTE';

  const handleUpdate = (data: MeetingNoteFormData) => {
    updateNote.mutate(
      { id: note.meetingNoteId, data },
      { onSuccess: () => setShowEditModal(false) },
    );
  };

  const handleDelete = () => {
    if (confirm(t('meetingNotes:deleteConfirm.message'))) {
      deleteNote.mutate(note.meetingNoteId, {
        onSuccess: () => navigate('/meeting-notes'),
      });
    }
  };

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

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate('/meeting-notes')}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('meetingNotes:backToList')}
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{note.title}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[note.type] || typeColors.MEMO}`}>
                {t(`meetingNotes:type.${note.type}`)}
              </span>
            </div>
            {isAuthor && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('common:edit')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('common:delete')}
                </button>
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {note.authorName}
            </span>
            {note.assigneeName && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4 text-indigo-500" />
                {t('meetingNotes:detail.assignee')}: {note.assigneeName}
              </span>
            )}
            {isMeetingNote && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t('meetingNotes:detail.meetingDate')}: {note.meetingDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {t('meetingNotes:detail.createdAt')}: {note.createdAt.split('T')[0]}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${visibilityColors[note.visibility]}`}>
                {t(`meetingNotes:visibility.${note.visibility}`)}
              </span>
            </span>
          </div>

          {/* Participants */}
          {note.participants && note.participants.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">{t('meetingNotes:detail.participants')}:</span>
              <div className="flex flex-wrap gap-1">
                {note.participants.map((p) => (
                  <span key={p.userId} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Projects */}
          {note.projects && note.projects.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">{t('meetingNotes:detail.relatedProjects')}:</span>
              <div className="flex flex-wrap gap-1">
                {note.projects.map((p) => (
                  <Link
                    key={p.projectId}
                    to={`/projects/${p.projectId}`}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    [{p.code}] {p.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Issues */}
          {note.issues && note.issues.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">{t('meetingNotes:detail.relatedIssues')}:</span>
              <div className="flex flex-wrap gap-1">
                {note.issues.map((i) => (
                  <Link
                    key={i.issueId}
                    to={`/issues/${i.issueId}`}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
                  >
                    {i.title}
                    <span className="rounded bg-orange-200/50 px-1 text-[10px]">{i.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="mb-6 flex items-center gap-4 border-t border-gray-100 pt-4">
            <span className="text-sm font-medium text-gray-500">{t('meetingNotes:rating.myRating')}:</span>
            <StarRating
              value={note.myRating}
              onChange={(rating) => upsertRating.mutate({ noteId: note.meetingNoteId, rating })}
              isOwn={isAuthor}
              avgRating={note.avgRating}
              ratingCount={note.ratingCount}
            />
          </div>

          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
          />

          {note.visibility !== 'PRIVATE' && (
            <TranslationPanel
              sourceType="MEETING_NOTE"
              sourceId={note.meetingNoteId}
              sourceFields={['title', 'content']}
              originalLang={note.originalLang || 'ko'}
              originalContent={{ title: note.title, content: note.content }}
            />
          )}

          {/* Comments */}
          <NoteCommentSection noteId={note.meetingNoteId} />

          {/* Backlinks */}
          <BacklinkPanel noteId={note.meetingNoteId} />
        </div>

        {showEditModal && (
          <MeetingNoteFormModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdate}
            editingNote={note}
          />
        )}
      </div>
    </div>
  );
}
