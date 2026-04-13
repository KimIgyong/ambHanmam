import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BookOpen, Loader2, Send, ClipboardPlus, NotebookPen } from 'lucide-react';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import {
  useAdminConversationDetail,
  useConvertToKnowledge,
  useSendAdminMessage,
  useConvertToIssue,
  useConvertToNote,
  useEntityProjects,
} from '../hooks/useConversationAdmin';
import type { AdminMessageItem } from '../service/conversation-admin.service';

interface Props {
  conversationId: string;
  initialSelectedMessageId?: string;
  onClose: () => void;
}

const VISIBILITY_OPTIONS = ['PRIVATE', 'SHARED', 'UNIT', 'ENTITY', 'PUBLIC'] as const;
const TYPE_OPTIONS = ['DOC', 'REPORT', 'NOTE', 'ANALYSIS'] as const;

export default function ConversationDetailModal({ conversationId, initialSelectedMessageId, onClose }: Props) {
  const { t } = useTranslation(['settings', 'units', 'common']);
  const entities = useEntityStore((s) => s.entities);
  const { data: result, isLoading } = useAdminConversationDetail(conversationId);
  const convertMutation = useConvertToKnowledge();
  const sendAdminMessageMutation = useSendAdminMessage();
  const convertToIssueMutation = useConvertToIssue();
  const convertToNoteMutation = useConvertToNote();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const detail = result?.data;
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [adminReply, setAdminReply] = useState('');
  const [convertTitle, setConvertTitle] = useState('');
  const [convertContent, setConvertContent] = useState('');
  const [convertVisibility, setConvertVisibility] = useState('SHARED');
  const [convertType, setConvertType] = useState('DOC');
  const [targetEntityId, setTargetEntityId] = useState('');

  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueType, setIssueType] = useState('BUG');
  const [issueSeverity, setIssueSeverity] = useState('MAJOR');
  const [issuePriority, setIssuePriority] = useState(3);
  const [issueProjectId, setIssueProjectId] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteProjectId, setNoteProjectId] = useState('');

  const { data: targetProjects = [] } = useEntityProjects(targetEntityId);

  const selectedMessage = detail?.messages?.find((message: AdminMessageItem) => message.messageId === selectedMessageId);

  useEffect(() => {
    if (detail && !convertTitle) {
      setConvertTitle(detail.title);
      setConvertContent(buildQAContent(detail.messages));
      setIssueTitle(detail.title);
      setIssueDescription(buildIssueDraft(detail.messages, detail.entityCode, detail.entityName, detail.userEmail));
      setNoteTitle(`${detail.title} - ${t('settings:conversations.note.defaultSuffix')}`);
      setNoteContent(buildNoteDraft(detail.messages));
      setTargetEntityId(detail.entityId || '');
    }
  }, [detail, convertTitle, t]);

  useEffect(() => {
    if (initialSelectedMessageId) {
      setSelectedMessageId(initialSelectedMessageId);
    }
  }, [initialSelectedMessageId]);

  useEffect(() => {
    setIssueProjectId('');
    setNoteProjectId('');
  }, [targetEntityId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail]);

  const handleConvert = async () => {
    if (!convertTitle.trim() || !convertContent.trim()) return;
    await convertMutation.mutateAsync({
      id: conversationId,
      data: {
        title: convertTitle,
        content: convertContent,
        visibility: convertVisibility,
        type: convertType,
      },
    });
    setShowConvertForm(false);
  };

  const handleAdminReply = async () => {
    if (!adminReply.trim()) return;
    await sendAdminMessageMutation.mutateAsync({
      id: conversationId,
      data: { content: adminReply },
    });
    setAdminReply('');
  };

  const handleConvertIssue = async () => {
    if (!issueTitle.trim() || !issueDescription.trim()) return;
    await convertToIssueMutation.mutateAsync({
      id: conversationId,
      entityId: targetEntityId || undefined,
      data: {
        title: issueTitle,
        description: selectedMessage ? `${issueDescription}\n\nSelected Message:\n${selectedMessage.content}` : issueDescription,
        type: issueType,
        severity: issueSeverity,
        priority: issuePriority,
        project_id: issueProjectId || undefined,
        source_message_id: selectedMessageId || undefined,
      },
    });
  };

  const handleConvertNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    await convertToNoteMutation.mutateAsync({
      id: conversationId,
      entityId: targetEntityId || undefined,
      data: {
        title: noteTitle,
        content: selectedMessage ? `${noteContent}\n\nSelected Message:\n${selectedMessage.content}` : noteContent,
        type: 'MEMO',
        visibility: 'ENTITY',
        project_ids: noteProjectId ? [noteProjectId] : undefined,
        source_message_id: selectedMessageId || undefined,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative flex w-full max-w-6xl max-h-[90vh] flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('settings:conversations.detail.title')}
            </h2>
            {detail && (
              <div className="space-y-1 text-sm text-gray-500">
                <p>
                  {detail.userName} ({detail.userEmail}) &middot;{' '}
                  {t(`units:${detail.unit}.name`, detail.unit)}
                </p>
                <p>
                  {detail.entityCode || t('settings:conversations.labels.noEntity')} · {detail.entityName || t('settings:conversations.labels.noEntity')}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
          {/* Messages */}
          <div className="flex flex-col overflow-hidden border-r border-gray-200">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : detail?.messages?.length ? (
                detail.messages.map((msg: AdminMessageItem) => {
                  const isSelected = selectedMessageId === msg.messageId;
                  const isUser = msg.role === 'user';
                  const isAdmin = msg.role === 'admin';
                  return (
                    <button
                      type="button"
                      key={msg.messageId}
                      onClick={() => setSelectedMessageId((current) => current === msg.messageId ? '' : msg.messageId)}
                      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg border px-4 py-3 text-left text-sm whitespace-pre-wrap transition-colors ${
                          isUser
                            ? 'border-blue-200 bg-blue-50 text-gray-900'
                            : isAdmin
                              ? 'border-amber-200 bg-amber-50 text-gray-900'
                              : 'border-gray-200 bg-gray-50 text-gray-900'
                        } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs font-medium text-gray-400">
                          <span>
                            {isUser
                              ? t('settings:conversations.detail.userLabel')
                              : isAdmin
                                ? t('settings:conversations.detail.adminLabel')
                                : t('settings:conversations.detail.aiLabel')}
                          </span>
                          <span>{t('settings:conversations.detail.selectMessage')}</span>
                        </div>
                        {msg.content}
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-center text-sm text-gray-400">
                  {t('settings:conversations.detail.noMessages')}
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <div className="mb-2 text-sm font-medium text-gray-700">
                {t('settings:conversations.reply.title')}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  rows={3}
                  placeholder={t('settings:conversations.reply.placeholder')}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  onClick={handleAdminReply}
                  disabled={sendAdminMessageMutation.isPending || !adminReply.trim()}
                  className="inline-flex items-center gap-2 self-end rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {sendAdminMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t('settings:conversations.reply.submit')}
                </button>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="overflow-y-auto px-6 py-4 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">{t('settings:conversations.selection.title')}</div>
              <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {selectedMessage
                  ? selectedMessage.content
                  : t('settings:conversations.selection.fullConversation')}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ClipboardPlus className="h-4 w-4" />
                {t('settings:conversations.issue.title')}
              </div>
              <select
                value={targetEntityId}
                onChange={(e) => setTargetEntityId(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">{t('settings:conversations.issue.targetEntity')}</option>
                {entities.map((entity) => (
                  <option key={entity.entityId} value={entity.entityId}>
                    {entity.code} · {entity.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder={t('settings:conversations.issue.titlePlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={5}
                placeholder={t('settings:conversations.issue.descriptionPlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="BUG">BUG</option>
                  <option value="FEATURE_REQUEST">FEATURE_REQUEST</option>
                  <option value="OPINION">OPINION</option>
                  <option value="TASK">TASK</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <select
                  value={issueSeverity}
                  onChange={(e) => setIssueSeverity(e.target.value)}
                  className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="MAJOR">MAJOR</option>
                  <option value="MINOR">MINOR</option>
                </select>
                <select
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(Number(e.target.value))}
                  className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <option key={priority} value={priority}>{t('settings:conversations.issue.priority', { value: priority })}</option>
                  ))}
                </select>
              </div>
              <select
                value={issueProjectId}
                onChange={(e) => setIssueProjectId(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">{t('settings:conversations.issue.projectPlaceholder')}</option>
                {targetProjects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleConvertIssue}
                disabled={convertToIssueMutation.isPending || !issueTitle.trim() || !issueDescription.trim() || !targetEntityId}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                {convertToIssueMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('settings:conversations.issue.submit')}
              </button>
              {convertToIssueMutation.isSuccess && (
                <p className="text-sm text-green-600">{t('settings:conversations.issue.success')}</p>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <NotebookPen className="h-4 w-4" />
                {t('settings:conversations.note.title')}
              </div>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder={t('settings:conversations.note.titlePlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
                placeholder={t('settings:conversations.note.contentPlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <select
                value={noteProjectId}
                onChange={(e) => setNoteProjectId(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">{t('settings:conversations.note.projectPlaceholder')}</option>
                {targetProjects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleConvertNote}
                disabled={convertToNoteMutation.isPending || !noteTitle.trim() || !noteContent.trim() || !targetEntityId}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {convertToNoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('settings:conversations.note.submit')}
              </button>
              {convertToNoteMutation.isSuccess && (
                <p className="text-sm text-green-600">{t('settings:conversations.note.success')}</p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              {!showConvertForm ? (
                <button
                  onClick={() => setShowConvertForm(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  {t('settings:conversations.convert.button')}
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings:conversations.convert.titleLabel')}
                    </label>
                    <input
                      type="text"
                      value={convertTitle}
                      onChange={(e) => setConvertTitle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('settings:conversations.convert.typeLabel')}
                      </label>
                      <select
                        value={convertType}
                        onChange={(e) => setConvertType(e.target.value)}
                        className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        {TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {t(`settings:conversations.convert.types.${opt}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('settings:conversations.convert.visibilityLabel')}
                      </label>
                      <select
                        value={convertVisibility}
                        onChange={(e) => setConvertVisibility(e.target.value)}
                        className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        {VISIBILITY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {t(`settings:conversations.convert.visibility.${opt}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('settings:conversations.convert.contentLabel')}
                    </label>
                    <textarea
                      value={convertContent}
                      onChange={(e) => setConvertContent(e.target.value)}
                      rows={6}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowConvertForm(false)}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t('common:cancel')}
                    </button>
                    <button
                      onClick={handleConvert}
                      disabled={convertMutation.isPending || !convertTitle.trim()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                    >
                      {convertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t('settings:conversations.convert.submit')}
                    </button>
                  </div>
                  {convertMutation.isSuccess && (
                    <p className="text-sm text-green-600">
                      {t('settings:conversations.convert.success')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildQAContent(messages: AdminMessageItem[]): string {
  const lines: string[] = [];
  for (const msg of messages) {
    if (msg.role === 'user') {
      lines.push(`Q: ${msg.content}`);
    } else {
      lines.push(`A: ${msg.content}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

function buildIssueDraft(messages: AdminMessageItem[], entityCode: string, entityName: string, userEmail: string): string {
  return [
    `Entity: ${entityCode || '-'} ${entityName || ''}`.trim(),
    `Requester: ${userEmail || '-'}`,
    '',
    buildQAContent(messages),
  ].join('\n');
}

function buildNoteDraft(messages: AdminMessageItem[]): string {
  return buildQAContent(messages);
}
