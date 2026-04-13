import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '@/global/util/sanitize';
import { useTranslation } from 'react-i18next';
import { X, Edit2, Trash2, Send, FolderKanban, ExternalLink, Globe, Save, Sparkles, Loader2, Link2, Check, ArrowUpDown, Reply, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { IssueResponse, IssueStatus, ISSUE_VALID_TRANSITIONS } from '@amb/types';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import {
  useIssueDetail,
  useIssueComments,
  useAddIssueComment,
  useDeleteIssueComment,
  useApproveIssue,
  useRejectIssue,
  useUpdateIssueStatus,
  useUpdateIssue,
  useToggleCommentReaction,
  useToggleClientVisible,
  useUpsertIssueRating,
  useDeleteIssueRating,
} from '../hooks/useIssues';
import IssueStatusHistory from './IssueStatusHistory';
import IssueLinkShare from './IssueLinkShare';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';
import StarRating from '@/components/common/StarRating';
import { translationService } from '@/domain/translations/service/translation.service';
import AssigneeSelector from './AssigneeSelector';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';
import { QuotaExceededBanner } from '@/components/common/QuotaExceededBanner';
import { autoLinkUrls } from '@/global/util/autoLinkUrls';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TRANSLATE_LANGS = ['ko', 'en', 'vi'] as const;
const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍',
  CHECK: '✅',
  PRAY: '🙏',
  GRIN: '😀',
  LOVE: '❤️',
};

interface IssueDetailModalProps {
  issue: IssueResponse;
  onClose: () => void;
  onEdit: (issue: IssueResponse) => void;
  onDelete: (issue: IssueResponse) => void;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  TEST: 'bg-amber-100 text-amber-700',
  REOPEN: 'bg-orange-100 text-orange-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  MAJOR: 'bg-orange-100 text-orange-700',
  MINOR: 'bg-yellow-100 text-yellow-700',
};

const TYPE_COLORS: Record<string, string> = {
  BUG: 'bg-red-50 text-red-600',
  FEATURE: 'bg-blue-50 text-blue-600',
  ENHANCEMENT: 'bg-emerald-50 text-emerald-600',
};

export default function IssueDetailModal({ issue, onClose, onEdit, onDelete }: IssueDetailModalProps) {
  const { t } = useTranslation(['issues', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [activeDetailTab, setActiveDetailTab] = useState<'comments' | 'history'>('comments');
  const [commentSortDesc, setCommentSortDesc] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [workflowNote, setWorkflowNote] = useState('');
  const [commentTranslations, setCommentTranslations] = useState<Record<string, { open: boolean; lang?: string; text?: string; loading?: boolean }>>({});
  const [aiReviewText, setAiReviewText] = useState('');
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewTranslation, setAiReviewTranslation] = useState<{ lang: string; text: string; loading: boolean } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [clientVisibleCheck, setClientVisibleCheck] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 상태 변경 후 즉시 UI 갱신을 위해 실시간 데이터 조회
  const { data: liveIssue } = useIssueDetail(issue.issueId);
  const currentIssue = liveIssue ?? issue;

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'SUPER_ADMIN';
  const isMasterOrAdmin = user?.role === 'MASTER' || user?.role === 'ADMIN';
  const isReporter = user?.userId === currentIssue.reporterId;
  const isParticipant = currentIssue.participants?.some((p) => p.userId === user?.userId);
  const isInvolved = isReporter || user?.userId === currentIssue.assigneeId || isParticipant;
  const canChangeStatus = isManager || isInvolved;
  const canClose = isReporter || isMasterOrAdmin;

  // 삭제 권한: 생성자(assignee 없을때) / PM / MASTER+
  const isProjectManager = !!(currentIssue.projectId && currentIssue.projectManagerId === user?.userId);
  const canDelete = isMasterOrAdmin
    || isProjectManager
    || (isReporter && !currentIssue.assigneeId);

  const { data: comments = [] } = useIssueComments(issue.issueId);
  const addComment = useAddIssueComment();
  const deleteComment = useDeleteIssueComment();
  const toggleReaction = useToggleCommentReaction();
  const toggleClientVisible = useToggleClientVisible();
  const upsertRating = useUpsertIssueRating();
  const deleteRating = useDeleteIssueRating();

  // 멘션 알림에서 넘어온 경우 해당 코멘트로 스크롤
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const commentId = params.get('commentId');
    if (commentId && comments.length > 0) {
      const el = document.getElementById(`comment-${commentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-indigo-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-400'), 3000);
      }
    }
  }, [comments]);
  const approveIssue = useApproveIssue();
  const rejectIssue = useRejectIssue();
  const updateStatus = useUpdateIssueStatus();
  const updateIssue = useUpdateIssue();

  // 이슈 참조번호 링크 복사
  const [refCopied, setRefCopied] = useState(false);
  const issueUrl = `${window.location.origin}/issues?id=${issue.issueId}`;
  const handleCopyRefLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const copyText = currentIssue.refNumber
      ? `[${currentIssue.refNumber}] ${currentIssue.title}\n${issueUrl}`
      : issueUrl;
    navigator.clipboard.writeText(copyText).then(() => {
      setRefCopied(true);
      toast.success(t('issues:link.copied'));
      setTimeout(() => setRefCopied(false), 2000);
    });
  };

  const handleWorkflowAction = (targetStatus: string) => {
    const onSuccess = () => toast.success(t('issues:messages.statusChanged'));
    const onError = () => toast.error(t('common:errors.E9001', { defaultValue: '오류가 발생했습니다' }));

    if (isManager && targetStatus === 'APPROVED') {
      approveIssue.mutate({ id: issue.issueId, note: workflowNote || undefined }, { onSuccess, onError });
    } else if (isManager && targetStatus === 'REJECTED') {
      rejectIssue.mutate({ id: issue.issueId, note: workflowNote || undefined }, { onSuccess, onError });
    } else {
      updateStatus.mutate({ id: issue.issueId, status: targetStatus, note: workflowNote || undefined }, { onSuccess, onError });
    }
    setWorkflowNote('');
  };

  const isCommentEmpty = (html: string) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped) return false;
    // 텍스트가 없어도 이미지가 있으면 비어있지 않음
    return !/<img\s/i.test(html);
  };

  const handleAddComment = () => {
    if (isCommentEmpty(commentText)) return;
    addComment.mutate(
      { issueId: issue.issueId, content: commentText, clientVisible: clientVisibleCheck },
      { onSuccess: () => { setCommentText(''); setClientVisibleCheck(false); } },
    );
  };

  const handleAddReply = () => {
    if (!replyingTo || isCommentEmpty(replyText)) return;
    addComment.mutate(
      { issueId: issue.issueId, content: replyText, parentId: replyingTo },
      { onSuccess: () => { setReplyText(''); setReplyingTo(null); } },
    );
  };

  const handleAssigneeChange = (newAssigneeId: string | null) => {
    updateIssue.mutate(
      { id: issue.issueId, data: { assignee_id: newAssigneeId } },
      {
        onSuccess: () => toast.success(t('issues:messages.updated')),
        onError: () => toast.error(t('common:errors.E9001', { defaultValue: '오류가 발생했습니다' })),
      },
    );
  };

  const handleAiReview = async () => {
    setAiReviewLoading(true);
    setAiReviewText('');
    setAiReviewTranslation(null);

    try {
      const entityId = (await import('@/domain/hr/store/entity.store')).useEntityStore.getState().currentEntity?.entityId;
      const response = await fetch(`${API_BASE_URL}/issues/${issue.issueId}/ai-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(entityId ? { 'X-Entity-Id': entityId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ language: 'en' }),
      });

      if (!response.ok || !response.body) throw new Error('AI review failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content' && data.content) {
                accumulated += data.content;
                setAiReviewText(accumulated);
              }
            } catch { /* skip */ }
          }
        }
      }
      setAiReviewLoading(false);
    } catch {
      toast.error(t('common:errors.E9001', { defaultValue: '오류가 발생했습니다' }));
      setAiReviewLoading(false);
    }
  };

  const translateAiReview = async (lang: string) => {
    const sourceText = aiReviewText || currentIssue.aiAnalysis;
    if (!sourceText) return;

    setAiReviewTranslation({ lang, text: '', loading: true });
    abortRef.current?.abort();

    let accumulated = '';
    const controller = await translationService.translateTextStreamFetch(
      { text: sourceText, source_lang: 'en', target_lang: lang },
      (data) => {
        if (data.content) {
          accumulated += data.content;
          setAiReviewTranslation({ lang, text: accumulated, loading: false });
        }
      },
      () => {
        setAiReviewTranslation({ lang, text: accumulated, loading: false });
      },
      (err) => {
        toast.error(t('common:errors.E9001', { defaultValue: '오류가 발생했습니다' }));
        setAiReviewTranslation(null);
        console.error('AI review translation error:', err);
      },
    );
    abortRef.current = controller;
  };

  const saveTranslationAsComment = (commentId: string) => {
    const ct = commentTranslations[commentId];
    if (!ct?.text || !ct.lang) return;
    const langLabel = ct.lang.toUpperCase();
    const content = `[${langLabel}] ${ct.text}`;
    addComment.mutate(
      { issueId: issue.issueId, content },
      {
        onSuccess: () => {
          toast.success(t('issues:comments.translationSaved'));
          setCommentTranslations((prev) => ({
            ...prev,
            [commentId]: { open: false },
          }));
        },
      },
    );
  };

  const toggleCommentTranslation = (commentId: string) => {
    setCommentTranslations((prev) => {
      const cur = prev[commentId];
      if (cur?.open) {
        abortRef.current?.abort();
        return { ...prev, [commentId]: { open: false } };
      }
      return { ...prev, [commentId]: { open: true } };
    });
  };

  const translateComment = async (commentId: string, lang: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCommentTranslations((prev) => ({
      ...prev,
      [commentId]: { open: true, lang, text: '', loading: true },
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/translations/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': localStorage.getItem('amb-lang') || 'en',
        },
        credentials: 'include',
        body: JSON.stringify({
          source_type: 'ISSUE_COMMENT',
          source_id: commentId,
          source_fields: ['content'],
          target_lang: lang,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error('Translation failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setCommentTranslations((prev) => ({
                  ...prev,
                  [commentId]: { open: true, lang, text: accumulated, loading: false },
                }));
              }
            } catch { /* skip malformed */ }
          }
        }
      }
      setCommentTranslations((prev) => ({
        ...prev,
        [commentId]: { open: true, lang, text: accumulated, loading: false },
      }));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error(t('common:errors.E9001', { defaultValue: '오류가 발생했습니다' }));
        setCommentTranslations((prev) => ({
          ...prev,
          [commentId]: { open: true, lang, loading: false },
        }));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[currentIssue.type] || ''}`}>
                {t(`issues:type.${currentIssue.type}`)}
              </span>
              <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[currentIssue.status] || ''}`}>
                {t(`issues:status.${currentIssue.status}`)}
              </span>
              <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[currentIssue.severity] || ''}`}>
                {t(`issues:severity.${currentIssue.severity}`)}
              </span>
              <span className="text-xs text-gray-500">P{currentIssue.priority}</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentIssue.refNumber && (
                <button
                  onClick={handleCopyRefLink}
                  className="mr-2 inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-sm font-mono text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  title={t('issues:link.copyRefLink')}
                >
                  {refCopied ? <Check className="h-3 w-3 text-green-500" /> : <Link2 className="h-3 w-3" />}
                  {currentIssue.refNumber}
                </button>
              )}
              {currentIssue.title}
            </h2>
          </div>
          <div className="ml-4 flex items-center gap-1">
            <IssueLinkShare issueId={issue.issueId} issueTitle={currentIssue.title} refNumber={currentIssue.refNumber} />
            {(isManager || isInvolved) && (
              <button onClick={() => onEdit(currentIssue)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" title={t('issues:editIssue')}>
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(currentIssue)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title={t('issues:deleteConfirm.title')}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">{t('issues:detail.reporter')}:</span>{' '}
              <span className="font-medium">{currentIssue.reporterName}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">{t('issues:detail.assignee')}:</span>
                {(isManager || isInvolved) && currentIssue.reporterId && currentIssue.assigneeId !== currentIssue.reporterId && (
                  <button
                    onClick={() => handleAssigneeChange(currentIssue.reporterId)}
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50"
                    title={`${currentIssue.reporterName} ${t('issues:detail.assignToReporter', { defaultValue: '에게 지정' })}`}
                  >
                    ← {currentIssue.reporterName}
                  </button>
                )}
              </div>
              {(isManager || isInvolved) ? (
                <div className="mt-1">
                  <AssigneeSelector
                    value={currentIssue.assigneeId || null}
                    onChange={handleAssigneeChange}
                  />
                </div>
              ) : (
                <span className="font-medium">{currentIssue.assignee || t('issues:detail.unassigned')}</span>
              )}
            </div>
            {currentIssue.participants && currentIssue.participants.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">{t('issues:detail.participants')}:</span>{' '}
                <div className="mt-1 flex flex-wrap gap-1">
                  {currentIssue.participants.map((p) => (
                    <span
                      key={p.participantId}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.role === 'FORMER_ASSIGNEE'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {p.userName}
                      {p.role === 'FORMER_ASSIGNEE' && (
                        <span className="ml-1 text-[10px] opacity-70">({t('issues:participant.formerAssignee')})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-500">{t('issues:detail.createdAt')}:</span>{' '}
              <span className="font-medium">{<LocalDateTime value={currentIssue.createdAt} format='YYYY-MM-DD HH:mm' />}</span>
            </div>
            {currentIssue.resolvedAt && (
              <div>
                <span className="text-gray-500">{t('issues:detail.resolvedAt')}:</span>{' '}
                <span className="font-medium">{<LocalDateTime value={currentIssue.resolvedAt} format='YYYY-MM-DD HH:mm' />}</span>
              </div>
            )}
            {currentIssue.projectId && (
              <div className="col-span-2">
                <span className="text-gray-500">{t('issues:detail.project')}:</span>{' '}
                <button
                  onClick={() => { onClose(); navigate(`/project/projects/${currentIssue.projectId}`); }}
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  {currentIssue.projectCode && <span className="text-gray-500">[{currentIssue.projectCode}]</span>}
                  {currentIssue.projectName}
                </button>
                {currentIssue.refNumber && (
                  <button
                    onClick={handleCopyRefLink}
                    className="ml-2 inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    title={t('issues:link.copyRefLink')}
                  >
                    {refCopied ? <Check className="h-3 w-3 text-green-500" /> : <Link2 className="h-3 w-3" />}
                    {currentIssue.refNumber}
                  </button>
                )}
                {currentIssue.redmineId && (
                  <span className="ml-1 inline-flex rounded bg-orange-50 px-1.5 py-0.5 text-xs font-mono text-orange-600">RM#{currentIssue.redmineId}</span>
                )}
              </div>
            )}
            {!currentIssue.projectId && (currentIssue.refNumber || currentIssue.redmineId) && (
              <div className="col-span-2">
                {currentIssue.refNumber && (
                  <button
                    onClick={handleCopyRefLink}
                    className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    title={t('issues:link.copyRefLink')}
                  >
                    {refCopied ? <Check className="h-3 w-3 text-green-500" /> : <Link2 className="h-3 w-3" />}
                    {currentIssue.refNumber}
                  </button>
                )}
                {currentIssue.redmineId && (
                  <span className="ml-1 inline-flex rounded bg-orange-50 px-1.5 py-0.5 text-xs font-mono text-orange-600">RM#{currentIssue.redmineId}</span>
                )}
              </div>
            )}
            {currentIssue.parentIssueId && (
              <div className="col-span-2">
                <span className="text-gray-500">{t('issues:detail.parentIssue')}:</span>{' '}
                <span className="font-medium text-gray-700">{currentIssue.parentIssueTitle}</span>
              </div>
            )}
            {currentIssue.googleDriveLink && (
              <div className="col-span-2">
                <span className="text-gray-500">{t('issues:detail.googleDriveLink')}:</span>{' '}
                <div className="mt-1 space-y-1">
                  {currentIssue.googleDriveLink.split('\n').filter(Boolean).map((link, idx) => (
                    <a
                      key={idx}
                      href={link.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      {link.trim().length > 80 ? `${link.trim().substring(0, 80)}...` : link.trim()}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">{t('issues:detail.description')}</h3>
            {currentIssue.description ? (
              <div
                className="prose prose-sm max-w-none text-gray-600 [&_img]:max-w-full [&_img]:rounded [&_a]:text-indigo-600 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: autoLinkUrls(sanitizeHtml(currentIssue.description)) }}
              />
            ) : (
              <p className="text-sm text-gray-400">{t('issues:detail.noDescription')}</p>
            )}
          </div>

          {/* Affected Modules */}
          {currentIssue.affectedModules && currentIssue.affectedModules.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">{t('issues:detail.affectedModules')}</h3>
              <div className="flex flex-wrap gap-1">
                {currentIssue.affectedModules.map((mod, i) => (
                  <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          {currentIssue.resolution && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700">{t('issues:detail.resolution')}</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-600">{currentIssue.resolution}</p>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
            <span className="text-sm font-medium text-gray-500">{t('issues:detail.rating')}:</span>
            <StarRating
              value={currentIssue.myRating}
              onChange={(rating) => {
                if (rating === 0) {
                  deleteRating.mutate(currentIssue.issueId);
                } else {
                  upsertRating.mutate({ issueId: currentIssue.issueId, rating });
                }
              }}
              isOwn={isReporter}
              avgRating={currentIssue.avgRating}
              ratingCount={currentIssue.ratingCount}
              size="sm"
            />
          </div>

          {/* AI Analysis */}
          <div>
            <QuotaExceededBanner />
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">{t('issues:detail.aiAnalysis')}</h3>
              <button
                onClick={handleAiReview}
                disabled={aiReviewLoading}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
              >
                {aiReviewLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {currentIssue.aiAnalysis || aiReviewText ? t('issues:aiReview.rerun') : t('issues:aiReview.run')}
              </button>
            </div>
            {(aiReviewText || currentIssue.aiAnalysis) ? (
              <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800 whitespace-pre-wrap">
                {aiReviewText || currentIssue.aiAnalysis}
                {aiReviewLoading && <span className="inline-block h-4 w-0.5 animate-pulse bg-indigo-600 ml-0.5" />}
                {/* 번역 버튼 */}
                {!aiReviewLoading && (
                  <div className="mt-2 flex items-center gap-1 border-t border-indigo-200 pt-2">
                    <Globe className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="mr-1 text-xs text-indigo-500">{t('issues:aiReview.translateResult')}:</span>
                    {(['ko', 'vi'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => translateAiReview(lang)}
                        disabled={aiReviewTranslation?.loading}
                        className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                          aiReviewTranslation?.lang === lang
                            ? 'bg-indigo-200 text-indigo-800'
                            : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        } disabled:opacity-50`}
                      >
                        {lang === 'ko' ? '🇰🇷 KO' : '🇻🇳 VI'}
                      </button>
                    ))}
                  </div>
                )}
                {/* 번역 결과 */}
                {aiReviewTranslation && (
                  <div className="mt-2 border-t border-indigo-200 pt-2">
                    {aiReviewTranslation.loading ? (
                      <span className="flex items-center gap-1 text-xs text-indigo-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('issues:aiReview.translating')}
                      </span>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-indigo-700">{aiReviewTranslation.text}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">{t('issues:aiReview.noAnalysis')}</p>
            )}
          </div>

          {/* Translation Panel — AI Analysis 바로 아래 */}
          <div className="border-t pt-4">
            <TranslationPanel
              sourceType="ISSUE"
              sourceId={currentIssue.issueId}
              sourceFields={['title', 'content']}
              originalLang={currentIssue.originalLang || 'ko'}
              originalContent={{ title: currentIssue.title, content: currentIssue.description || '' }}
            />
          </div>

          {/* Workflow */}
          {canChangeStatus && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                {/* 좌측: 다음 단계 버튼 */}
                <div className="flex flex-wrap gap-1.5">
                  {(ISSUE_VALID_TRANSITIONS[currentIssue.status as IssueStatus] || [])
                    .filter((s) => {
                      if ((s === 'APPROVED' || s === 'REJECTED') && !isManager) return false;
                      if (s === 'CLOSED' && !canClose) return false;
                      return true;
                    })
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => handleWorkflowAction(s)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80 ${STATUS_COLORS[s] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {t(`issues:status.${s}`)}
                      </button>
                    ))}
                </div>
                {/* 우측: 모든 상태 드롭다운 */}
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleWorkflowAction(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">{t('issues:workflow.allStatuses')}</option>
                  {(['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'] as IssueStatus[])
                    .filter((s) => s !== currentIssue.status)
                    .filter((s) => {
                      if ((s === 'APPROVED' || s === 'REJECTED') && !isManager) return false;
                      if (s === 'CLOSED' && !canClose) return false;
                      return true;
                    })
                    .map((s) => (
                      <option key={s} value={s}>
                        {t(`issues:status.${s}`)}
                      </option>
                    ))}
                </select>
              </div>
              <input
                type="text"
                value={workflowNote}
                onChange={(e) => setWorkflowNote(e.target.value)}
                placeholder={t('issues:workflow.notePlaceholder')}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Link Share — 상태변경과 Comments 사이 */}
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2">
            <span className="text-xs text-gray-500">{t('issues:link.shareTitle')}</span>
            <IssueLinkShare issueId={issue.issueId} issueTitle={currentIssue.title} refNumber={currentIssue.refNumber} showLabel />
          </div>

          {/* Comments / History 탭 */}
          <div>
            <div className="flex items-center border-b border-gray-200 mb-3">
              <button
                onClick={() => setActiveDetailTab('comments')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeDetailTab === 'comments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('issues:comments.title')} ({comments.length})
              </button>
              <button
                onClick={() => setActiveDetailTab('history')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeDetailTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('issues:statusHistory')}
              </button>
            </div>

            {activeDetailTab === 'comments' && (
              <div>
                <div className="mb-3">
                  <RichTextEditor
                    content={commentText}
                    onChange={setCommentText}
                    placeholder={t('issues:comments.placeholder')}
                    minHeight="80px"
                    enableMention
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={clientVisibleCheck}
                        onChange={(e) => setClientVisibleCheck(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Eye className="h-3 w-3" />
                      {t('issues:comments.clientVisible')}
                    </label>
                    <button
                      onClick={handleAddComment}
                      disabled={isCommentEmpty(commentText)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* 정렬 토글 */}
                {comments.length > 1 && (
                  <div className="flex items-center justify-end mb-2">
                    <button
                      onClick={() => setCommentSortDesc((v) => !v)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      <ArrowUpDown className="h-3 w-3" />
                      {commentSortDesc ? t('issues:comments.sortNewest') : t('issues:comments.sortOldest')}
                    </button>
                  </div>
                )}
                {comments.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-2">{t('issues:comments.noComments')}</p>
                ) : (
                  <div className="space-y-2">
                    {(commentSortDesc ? [...comments].reverse() : comments).map((comment) => {
                      const ct = commentTranslations[comment.commentId];
                      return (
                        <div key={comment.commentId} id={`comment-${comment.commentId}`} className="rounded-lg overflow-hidden border border-gray-100">
                          <div className="flex items-center justify-between bg-gray-100 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">{comment.authorName}</span>
                              {comment.authorType === 'AI' && (
                                <span className="rounded bg-indigo-100 px-1 py-0.5 text-[10px] font-medium text-indigo-600">AI</span>
                              )}
                              {comment.issueStatus && (
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[comment.issueStatus] || 'bg-gray-100 text-gray-600'}`}>
                                  {t(`issues:status.${comment.issueStatus}`, { defaultValue: comment.issueStatus })}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {<LocalDateTime value={comment.createdAt} format='YYYY-MM-DD HH:mm' />}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleClientVisible.mutate({
                                  issueId: issue.issueId,
                                  commentId: comment.commentId,
                                  clientVisible: !comment.clientVisible,
                                })}
                                className={`rounded p-0.5 transition-colors ${comment.clientVisible ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'}`}
                                title={comment.clientVisible ? t('issues:comments.clientVisibleOn') : t('issues:comments.clientVisibleOff')}
                              >
                                {comment.clientVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => { setReplyingTo(replyingTo === comment.commentId ? null : comment.commentId); setReplyText(''); }}
                                className={`rounded p-0.5 transition-colors ${replyingTo === comment.commentId ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
                                title={t('issues:comments.reply')}
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => toggleCommentTranslation(comment.commentId)}
                                className={`rounded p-0.5 transition-colors ${ct?.open ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
                                title={t('issues:comments.translate')}
                              >
                                <Globe className="h-3.5 w-3.5" />
                              </button>
                              {user?.userId === comment.authorId && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(t('issues:comments.deleteConfirm'))) {
                                      deleteComment.mutate({ issueId: issue.issueId, commentId: comment.commentId });
                                    }
                                  }}
                                  className="rounded p-0.5 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 px-3 py-2">
                          <div
                            className="mt-1 prose prose-sm max-w-none text-gray-600 [&_img]:max-w-full [&_img]:rounded [&_a]:text-indigo-600 [&_a]:underline"
                            dangerouslySetInnerHTML={{ __html: autoLinkUrls(sanitizeHtml(comment.content)) }}
                          />
                          {/* Reaction emoji buttons */}
                          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                              const r = comment.reactions?.find((rx) => rx.type === type);
                              const count = r?.count || 0;
                              const reacted = r?.reacted || false;
                              return (
                                <button
                                  key={type}
                                  onClick={() => toggleReaction.mutate({ issueId: issue.issueId, commentId: comment.commentId, type })}
                                  className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-all ${
                                    reacted
                                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                      : count > 0
                                        ? 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 grayscale hover:grayscale-0'
                                        : 'border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600 grayscale hover:grayscale-0'
                                  }`}
                                >
                                  {emoji}{count > 0 ? ` ${count}` : ''}
                                </button>
                              );
                            })}
                          </div>
                          {ct?.open && (
                            <div className="mt-2 border-t border-gray-100 pt-2">
                              <div className="flex items-center gap-1 mb-1.5">
                                {TRANSLATE_LANGS.map((lang) => (
                                  <button
                                    key={lang}
                                    onClick={() => translateComment(comment.commentId, lang)}
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase transition-colors ${
                                      ct.lang === lang
                                        ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                  >
                                    {lang}
                                  </button>
                                ))}
                              </div>
                              {ct.loading && (
                                <div className="rounded bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-600">
                                  {t('issues:comments.translating')}
                                </div>
                              )}
                              {ct.text && (
                                <div className="space-y-1">
                                  <div className="rounded bg-indigo-50 px-2.5 py-1.5 text-sm text-indigo-800 whitespace-pre-wrap">
                                    {ct.text}
                                  </div>
                                  <button
                                    onClick={() => saveTranslationAsComment(comment.commentId)}
                                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50"
                                  >
                                    <Save className="h-3 w-3" />
                                    {t('issues:comments.saveTranslation')}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="border-t border-gray-100">
                              {comment.replies.map((reply) => (
                                <div key={reply.commentId} className="flex gap-2 bg-white px-3 py-2 ml-4 border-b border-gray-50 last:border-b-0">
                                  <Reply className="h-3 w-3 text-gray-300 mt-1 shrink-0 rotate-180" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-600">{reply.authorName}</span>
                                        <span className="text-[11px] text-gray-400">
                                          <LocalDateTime value={reply.createdAt} format="YYYY-MM-DD HH:mm" />
                                        </span>
                                      </div>
                                      {user?.userId === reply.authorId && (
                                        <button
                                          onClick={() => {
                                            if (window.confirm(t('issues:comments.deleteConfirm'))) {
                                              deleteComment.mutate({ issueId: issue.issueId, commentId: reply.commentId });
                                            }
                                          }}
                                          className="rounded p-0.5 text-gray-400 hover:text-red-500"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                    <div
                                      className="prose prose-sm max-w-none text-gray-600 text-xs [&_img]:max-w-full [&_img]:rounded [&_a]:text-indigo-600 [&_a]:underline"
                                      dangerouslySetInnerHTML={{ __html: autoLinkUrls(sanitizeHtml(reply.content)) }}
                                    />
                                    {/* Reply reaction emoji buttons */}
                                    <div className="mt-1 flex items-center gap-0.5 flex-wrap">
                                      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                                        const r = (reply as any).reactions?.find((rx: any) => rx.type === type);
                                        const count = r?.count || 0;
                                        const reacted = r?.reacted || false;
                                        return (
                                          <button
                                            key={type}
                                            onClick={() => toggleReaction.mutate({ issueId: issue.issueId, commentId: reply.commentId, type })}
                                            className={`flex items-center gap-0.5 rounded-full border px-1 py-0.5 text-[10px] transition-all ${
                                              reacted
                                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                                : count > 0
                                                  ? 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 grayscale hover:grayscale-0'
                                                  : 'border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600 grayscale hover:grayscale-0'
                                            }`}
                                          >
                                            {emoji}{count > 0 ? ` ${count}` : ''}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Reply input */}
                          {replyingTo === comment.commentId && (
                            <div className="border-t border-gray-100 bg-white px-3 py-2 ml-4">
                              <div className="text-[11px] text-gray-400 mb-1">{t('issues:comments.replyTo', { name: comment.authorName })}</div>
                              <RichTextEditor
                                content={replyText}
                                onChange={setReplyText}
                                placeholder={t('issues:comments.replyPlaceholder')}
                                minHeight="60px"
                                enableMention={true}
                              />
                              <div className="flex justify-end gap-1.5 mt-1.5">
                                <button
                                  onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                  className="rounded px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                                >
                                  {t('common:actions.cancel')}
                                </button>
                                <button
                                  onClick={handleAddReply}
                                  disabled={isCommentEmpty(replyText)}
                                  className="rounded bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  <Send className="h-3 w-3 inline mr-1" />
                                  {t('issues:comments.reply')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'history' && (
              <IssueStatusHistory issueId={issue.issueId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
