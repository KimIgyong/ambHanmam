import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '@/global/util/sanitize';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientPortalApiService } from '../service/client-portal.service';
import { useClientAuthStore } from '../store/client-auth.store';
import { toast } from 'sonner';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import type { ClientIssueComment } from '../types/client-portal.types';
import { ChevronDown, ChevronUp, Send, Copy, Check } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  TEST: 'bg-amber-100 text-amber-700',
  REOPEN: 'bg-orange-100 text-orange-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-200 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  MAJOR: 'bg-orange-100 text-orange-700',
  MINOR: 'bg-gray-100 text-gray-600',
};

const ISSUE_STATUS_STEPS = ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'RESOLVED'] as const;

const STATUS_STEP_COLORS: Record<string, { active: string; inactive: string }> = {
  OPEN: { active: 'bg-blue-600 text-white', inactive: 'bg-gray-100 text-gray-500' },
  APPROVED: { active: 'bg-indigo-600 text-white', inactive: 'bg-gray-100 text-gray-500' },
  IN_PROGRESS: { active: 'bg-yellow-500 text-white', inactive: 'bg-gray-100 text-gray-500' },
  TEST: { active: 'bg-amber-500 text-white', inactive: 'bg-gray-100 text-gray-500' },
  RESOLVED: { active: 'bg-green-600 text-white', inactive: 'bg-gray-100 text-gray-500' },
};

export default function ClientIssueDetailPage() {
  const { t } = useTranslation('clientPortal');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useClientAuthStore((s) => s.user);
  const [commentText, setCommentText] = useState('');
  const [originalLang, setOriginalLang] = useState('ko');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const handleCopyRefNumber = () => {
    if (issue?.refNumber) {
      navigator.clipboard.writeText(issue.refNumber);
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    }
  };

  const { data: issue, isLoading } = useQuery({
    queryKey: ['client-issue', id],
    queryFn: () => clientPortalApiService.getIssueById(id!),
    enabled: !!id,
  });

  const { data: statusLogs = [] } = useQuery({
    queryKey: ['client-issue-status-logs', id],
    queryFn: () => clientPortalApiService.getIssueStatusLogs(id!),
    enabled: !!id,
  });

  const isCommentEmpty = (html: string) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped) return false;
    return !/<img\s/i.test(html);
  };

  const addCommentMut = useMutation({
    mutationFn: (content: string) => clientPortalApiService.addComment(id!, content),
    onSuccess: () => {
      toast.success(t('issue.commentAdded'));
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['client-issue', id] });
      queryClient.invalidateQueries({ queryKey: ['client-issue-status-logs', id] });
    },
    onError: (err: Error & { response?: { data?: { error?: { message?: string } } } }) => toast.error(err.response?.data?.error?.message || 'Error'),
  });

  const confirmMut = useMutation({
    mutationFn: () => clientPortalApiService.confirmResolution(id!),
    onSuccess: () => {
      toast.success(t('issue.resolved'));
      queryClient.invalidateQueries({ queryKey: ['client-issue', id] });
      queryClient.invalidateQueries({ queryKey: ['client-issue-status-logs', id] });
    },
    onError: (err: Error & { response?: { data?: { error?: { message?: string } } } }) => toast.error(err.response?.data?.error?.message || 'Error'),
  });

  const handleAddComment = () => {
    if (isCommentEmpty(commentText)) return;
    addCommentMut.mutate(commentText);
  };

  if (isLoading) return <div className="py-12 text-center text-sm text-gray-500">Loading...</div>;
  if (!issue) return <div className="py-12 text-center text-sm text-gray-500">Not found</div>;

  const canConfirm = issue.status === 'RESOLVED' && issue.reporterId === user?.userId;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-500">
          ← {t('issue.myIssues')}
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {/* Header: Ref Number + Title + Severity */}
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {issue.refNumber && (
                <button
                  onClick={handleCopyRefNumber}
                  className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 hover:bg-gray-200 transition-colors"
                  title={t('issue.copyRefNumber')}
                >
                  {issue.refNumber}
                  {refCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900">{issue.title}</h1>
            </div>
          </div>
          {issue.severity && (
            <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[issue.severity] || 'bg-gray-100 text-gray-600'}`}>
              {t(`issue.severities.${issue.severity}`, { defaultValue: issue.severity })}
            </span>
          )}
        </div>

        {/* Status Stepper */}
        <div className="mb-6 flex items-center gap-1">
          {ISSUE_STATUS_STEPS.map((step, idx) => {
            const isActive = issue.status === step;
            const colors = STATUS_STEP_COLORS[step];
            return (
              <div key={step} className="flex items-center">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    isActive ? colors.active : colors.inactive
                  }`}
                >
                  {t(`issue.statuses.${step}`)}
                </span>
                {idx < ISSUE_STATUS_STEPS.length - 1 && (
                  <span className="mx-1 text-gray-300">→</span>
                )}
              </div>
            );
          })}
          {(issue.status === 'CLOSED' || issue.status === 'REJECTED') && (
            <>
              <span className="mx-1 text-gray-300">→</span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[issue.status] || 'bg-gray-100 text-gray-700'}`}>
                {t(`issue.statuses.${issue.status}`)}
              </span>
            </>
          )}
        </div>

        {/* Meta info */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <span className="text-gray-500">{t('issue.project')}:</span>{' '}
            <Link to={`/client/projects/${issue.projectId}`} className="text-indigo-600 hover:underline">
              {issue.projectName}
            </Link>
          </div>
          <div>
            <span className="text-gray-500">{t('issue.type')}:</span>{' '}
            {t(`issue.types.${issue.type}`)}
          </div>
          <div>
            <span className="text-gray-500">{t('issue.reporter')}:</span>{' '}
            {issue.reporterName}
          </div>
          <div>
            <span className="text-gray-500">{t('issue.assignee')}:</span>{' '}
            {issue.assigneeName || '-'}
          </div>
          <div>
            <span className="text-gray-500">{t('issue.createdAt')}:</span>{' '}
            {new Date(issue.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Description */}
        {issue.description && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div
              className="prose prose-sm max-w-none text-gray-700 [&_img]:max-w-full [&_img]:rounded"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.description) }}
            />
          </div>
        )}

        {/* Translation Panel */}
        <div className="mb-6">
          <TranslationPanel
            sourceType="ISSUE"
            sourceId={issue.id}
            sourceFields={['title', 'description']}
            originalLang={originalLang}
            originalContent={{ title: issue.title, description: issue.description || '' }}
            onOriginalLangChange={setOriginalLang}
          />
        </div>

        {/* Confirm Resolution */}
        {canConfirm && (
          <button
            onClick={() => confirmMut.mutate()}
            disabled={confirmMut.isPending}
            className="mb-6 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {t('issue.confirmResolution')}
          </button>
        )}

        {/* Status History */}
        <div className="mb-6 border-t border-gray-200 pt-4">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex w-full items-center justify-between text-sm font-semibold text-gray-900"
          >
            <span>{t('issue.statusHistory')} ({statusLogs.length})</span>
            {historyOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {historyOpen && (
            <div className="mt-3 space-y-2">
              {statusLogs.length === 0 ? (
                <div className="py-2 text-center text-xs text-gray-400">{t('issue.noStatusLogs')}</div>
              ) : (
                statusLogs.map((log) => (
                  <div key={log.logId} className="text-xs">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-gray-700">{log.changedByName}</span>
                        <span className="text-gray-500">
                          {' '}
                          {log.changeType === 'ASSIGNEE'
                            ? t('issue.assigneeChangedTo', { assignee: log.toStatus || '-' })
                            : t('issue.statusChangedFromTo', {
                                fromStatus: t(`issue.statuses.${log.fromStatus}`, { defaultValue: log.fromStatus }),
                                toStatus: t(`issue.statuses.${log.toStatus}`, { defaultValue: log.toStatus }),
                              })}
                        </span>
                      </div>
                      <span className="shrink-0 text-gray-400">
                        <LocalDateTime value={log.createdAt} format="YYYY-MM-DD HH:mm" />
                      </span>
                    </div>
                    {log.note && (
                      <div className="ml-4 mt-0.5 text-gray-500 italic">- {log.note}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">{t('issue.comments')} ({issue.comments?.length || 0})</h2>

          {issue.comments?.length > 0 && (
            <div className="mb-6 space-y-4">
              {issue.comments.map((c: ClientIssueComment) => (
                <div key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{c.authorName}</span>
                      {c.issueStatus && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[c.issueStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {t(`issue.statuses.${c.issueStatus}`, { defaultValue: c.issueStatus })}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      <LocalDateTime value={c.createdAt} format="YYYY-MM-DD HH:mm" />
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 [&_img]:max-w-full [&_img]:rounded [&_a]:text-indigo-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.content) }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Comment Input - RichTextEditor */}
          <div>
            <RichTextEditor
              content={commentText}
              onChange={setCommentText}
              placeholder={t('issue.commentPlaceholder')}
              minHeight="80px"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleAddComment}
                disabled={isCommentEmpty(commentText) || addCommentMut.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {t('issue.addComment')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
