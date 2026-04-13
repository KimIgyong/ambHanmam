import { useTranslation } from 'react-i18next';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { useTalkStore } from '../store/talk.store';
import { useIssueDetail } from '@/domain/issues/hooks/useIssues';
import { useTodoDetail } from '@/domain/todos/hooks/useTodos';
import { useMeetingNoteDetail } from '@/domain/meeting-notes/hooks/useMeetingNotes';
import { useCalendarDetail } from '@/domain/calendar/hooks/useCalendar';
import { sanitizeHtml } from '@/global/util/sanitize';
import { autoLinkUrls } from '@/global/util/autoLinkUrls';

const RESOURCE_LABEL: Record<string, string> = {
  ISSUE: 'issue',
  TODO: 'todo',
  MEETING_NOTE: 'meetingNote',
  CALENDAR: 'calendar',
};

function getNavigateUrl(resourceType: string, resourceId: string) {
  switch (resourceType) {
    case 'TODO':
      return `/todos?id=${resourceId}`;
    case 'ISSUE':
      return `/issues?id=${resourceId}`;
    case 'MEETING_NOTE':
      return `/meeting-notes/${resourceId}`;
    case 'CALENDAR':
      return `/calendar?event=${resourceId}`;
    default:
      return null;
  }
}

function IssuePreview({ issueId }: { issueId: string }) {
  const { t } = useTranslation(['issues', 'common']);
  const { data: issue, isLoading } = useIssueDetail(issueId);

  if (isLoading) return <LoadingSpinner />;
  if (!issue) return <NotFound />;

  return (
    <div className="space-y-4">
      {/* Status & Priority */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {issue.status}
        </span>
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
          {issue.severity}
        </span>
        {issue.type && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {issue.type}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900">{issue.title}</h3>

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-gray-500">
        {issue.assignee && (
          <p>{t('issues:assignee')}: <span className="text-gray-700">{issue.assignee}</span></p>
        )}
        {issue.projectName && (
          <p>{t('issues:project')}: <span className="text-gray-700">{issue.projectName}</span></p>
        )}
        {issue.dueDate && (
          <p>{t('issues:dueDate')}: <span className="text-gray-700">{issue.dueDate}</span></p>
        )}
      </div>

      {/* Description */}
      {issue.description && (
        <div className="rounded-md border bg-gray-50 p-3">
          <p className="mb-1.5 text-xs font-medium text-gray-500">{t('issues:description')}</p>
          <div
            className="prose prose-sm max-w-none text-sm text-gray-700 break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(autoLinkUrls(issue.description)) }}
          />
        </div>
      )}

      {/* Comments count */}
      {(issue.commentCount ?? 0) > 0 && (
        <p className="text-xs text-gray-400">
          💬 {issue.commentCount} {t('common:comments', { defaultValue: 'comments' })}
        </p>
      )}
    </div>
  );
}

function TodoPreview({ todoId }: { todoId: string }) {
  const { t } = useTranslation(['todos', 'common']);
  const { data: todo, isLoading } = useTodoDetail(todoId);

  if (isLoading) return <LoadingSpinner />;
  if (!todo) return <NotFound />;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          todo.computedStatus === 'COMPLETED'
            ? 'bg-green-100 text-green-800'
            : todo.computedStatus === 'OVERDUE'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
        }`}>
          {todo.status}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900">{todo.title}</h3>

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-gray-500">
        {todo.dueDate && (
          <p>{t('todos:dueDate')}: <span className="text-gray-700">{todo.dueDate}</span></p>
        )}
        {todo.projectName && (
          <p>{t('todos:project')}: <span className="text-gray-700">{todo.projectName}</span></p>
        )}
        {todo.userName && (
          <p>{t('common:creator', { defaultValue: 'Creator' })}: <span className="text-gray-700">{todo.userName}</span></p>
        )}
      </div>

      {/* Description */}
      {todo.description && (
        <div className="rounded-md border bg-gray-50 p-3">
          <p className="mb-1.5 text-xs font-medium text-gray-500">{t('todos:description')}</p>
          <div
            className="prose prose-sm max-w-none text-sm text-gray-700 break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(autoLinkUrls(todo.description)) }}
          />
        </div>
      )}

      {(todo.commentCount ?? 0) > 0 && (
        <p className="text-xs text-gray-400">
          💬 {todo.commentCount} {t('common:comments', { defaultValue: 'comments' })}
        </p>
      )}
    </div>
  );
}

function MeetingNotePreview({ noteId }: { noteId: string }) {
  const { t } = useTranslation(['meetingNotes']);
  const { data: note, isLoading } = useMeetingNoteDetail(noteId);

  if (isLoading) return <LoadingSpinner />;
  if (!note) return <NotFound />;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">{note.title}</h3>
      <div className="space-y-1.5 text-xs text-gray-500">
        {note.meetingDate && (
          <p>{t('meetingNotes:date')}: <span className="text-gray-700">{note.meetingDate}</span></p>
        )}
      </div>
      {note.content && (
        <div className="rounded-md border bg-gray-50 p-3">
          <div
            className="prose prose-sm max-w-none text-sm text-gray-700 break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
          />
        </div>
      )}
    </div>
  );
}

function CalendarPreview({ calId }: { calId: string }) {
  const { t } = useTranslation(['calendar']);
  const { data: event, isLoading } = useCalendarDetail(calId);

  if (isLoading) return <LoadingSpinner />;
  if (!event) return <NotFound />;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">{event.calTitle}</h3>
      <div className="space-y-1.5 text-xs text-gray-500">
        {event.calStartAt && (
          <p>{t('calendar:startDate')}: <span className="text-gray-700">{event.calStartAt}</span></p>
        )}
        {event.calEndAt && (
          <p>{t('calendar:endDate')}: <span className="text-gray-700">{event.calEndAt}</span></p>
        )}
        {event.calLocation && (
          <p>{t('calendar:location')}: <span className="text-gray-700">{event.calLocation}</span></p>
        )}
      </div>
      {event.calDescription && (
        <div className="rounded-md border bg-gray-50 p-3">
          <div
            className="prose prose-sm max-w-none text-sm text-gray-700 break-words"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.calDescription) }}
          />
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
    </div>
  );
}

function NotFound() {
  const { t } = useTranslation(['common']);
  return (
    <div className="py-12 text-center text-sm text-gray-400">
      {t('common:notFound', { defaultValue: 'Not found' })}
    </div>
  );
}

export default function NotificationPreviewPanel() {
  const { t } = useTranslation(['talk', 'notifications']);
  const { notificationPreview, setNotificationPreview } = useTalkStore();

  if (!notificationPreview) return null;

  const { resourceType, resourceId } = notificationPreview;
  const navigateUrl = getNavigateUrl(resourceType, resourceId);
  const labelKey = RESOURCE_LABEL[resourceType] || 'notification';

  return (
    <div className="hidden md:flex w-80 shrink-0 flex-col border-l bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {t(`talk:preview.${labelKey}`, { defaultValue: t('talk:preview.title') })}
        </h3>
        <div className="flex items-center gap-1">
          {navigateUrl && (
            <a
              href={navigateUrl}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
              title={t('notifications:goTo')}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={() => setNotificationPreview(null)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {resourceType === 'ISSUE' && <IssuePreview issueId={resourceId} />}
        {resourceType === 'TODO' && <TodoPreview todoId={resourceId} />}
        {resourceType === 'MEETING_NOTE' && <MeetingNotePreview noteId={resourceId} />}
        {resourceType === 'CALENDAR' && <CalendarPreview calId={resourceId} />}
      </div>

      {/* Footer — 바로가기 */}
      {navigateUrl && (
        <div className="border-t px-4 py-3">
          <a
            href={navigateUrl}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('notifications:goTo')}
          </a>
        </div>
      )}
    </div>
  );
}
