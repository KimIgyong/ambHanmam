import { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Reply, Download, FileText, Copy, Check, Pin, EyeOff } from 'lucide-react';
import { TalkMessageResponse } from '@amb/types';
import { useMessages, useDeleteMessage, useMarkAsRead, useReactMessage, useToggleMessagePin, useHideMessage } from '../hooks/useTalk';
import { useTalkUserId } from '../hooks/useTalkUser';
import { useTalkStore } from '../store/talk.store';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { formatDateTimeInTz } from '@/lib/format-utils';
import MessageTranslateButton from './MessageTranslateButton';
import MessageTranslation from './MessageTranslation';
import TranslationMessage from './TranslationMessage';
import MessageReadersPopover from './MessageReadersPopover';
import ImageLightbox from './ImageLightbox';
import FilePreviewModal from './FilePreviewModal';
import UserAvatar from './UserAvatar';

const URL_SPLIT_PATTERN = /(https?:\/\/[^\s<]*[^\s<.,;:!?"')}\]])/gi;

function linkifyText(text: string, isOwn?: boolean, keyPrefix = ''): React.ReactNode[] {
  const parts = text.split(URL_SPLIT_PATTERN);
  if (parts.length === 1) return [text];
  return parts.map((part, i) => {
    // Odd indices are captured URL groups from the split regex
    if (i % 2 === 1) {
      return (
        <a
          key={`${keyPrefix}u${i}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline break-all ${isOwn ? 'text-indigo-200 hover:text-indigo-100' : 'text-blue-600 hover:text-blue-800'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part || null;
  });
}

function renderMentionedContent(
  content: string,
  mentions?: { userId: string; userName: string }[],
  isOwn?: boolean,
): React.ReactNode {
  if (!mentions?.length) return linkifyText(content, isOwn);

  const mentionMap = new Map(mentions.map((m) => [m.userId, m.userName]));
  // UUID 멘션과 <@all> 모두 매칭
  const parts = content.split(/(<@[0-9a-f-]{36}>|<@all>)/g);

  return parts.flatMap((part, i): React.ReactNode[] => {
    // <@all> 처리
    if (part === '<@all>') {
      return [
        <span
          key={`mall${i}`}
          className={`font-medium ${isOwn ? 'text-amber-200' : 'text-amber-600'}`}
        >
          @all
        </span>,
      ];
    }
    // 기존 UUID 멘션 처리
    const match = part.match(/^<@([0-9a-f-]{36})>$/);
    if (match) {
      const name = mentionMap.get(match[1]) || 'Unknown';
      return [
        <span
          key={`m${i}`}
          className={`font-medium ${isOwn ? 'text-indigo-200' : 'text-indigo-500'}`}
        >
          @{name}
        </span>,
      ];
    }
    return linkifyText(part, isOwn, `${i}-`);
  }) as React.ReactNode[];
}

const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍',
  CHECK: '✅',
  PRAY: '🙏',
  GRIN: '😀',
  LOVE: '❤️',
};

interface AttachmentImageProps {
  att: { id: string; downloadUrl: string; originalName: string };
  onClick: () => void;
}

function AttachmentImage({ att, onClick }: AttachmentImageProps) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400">
        <FileText className="h-4 w-4 shrink-0" />
        <span className="max-w-[140px] truncate">{att.originalName}</span>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className="block overflow-hidden rounded-lg border border-gray-200 cursor-pointer"
    >
      <img
        src={att.downloadUrl}
        alt={att.originalName}
        className="max-h-48 max-w-[200px] object-cover"
        onError={() => setError(true)}
      />
    </button>
  );
}

interface TalkMessageListProps {
  channelId: string;
}

export default function TalkMessageList({ channelId }: TalkMessageListProps) {
  const { t } = useTranslation(['talk']);
  const userId = useTalkUserId();
  const setReplyTo = useTalkStore((s) => s.setReplyTo);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const msgRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMessages(channelId);

  const deleteMessage = useDeleteMessage();
  const hideMessage = useHideMessage();
  const markAsRead = useMarkAsRead();
  const reactMessage = useReactMessage();
  const togglePinMessage = useToggleMessagePin();

  const [readersPopoverMsgId, setReadersPopoverMsgId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; originalName: string; mimeType: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteDropdownId, setDeleteDropdownId] = useState<string | null>(null);
  const deleteDropdownRef = useRef<HTMLDivElement>(null);

  const handleCopy = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const allMessages = data?.pages.flatMap((page) => page.data).reverse() || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  useEffect(() => {
    if (channelId) {
      markAsRead.mutate(channelId);
    }
  }, [channelId]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleDelete = (messageId: string) => {
    if (confirm(t('talk:deleteMessageConfirm'))) {
      deleteMessage.mutate({ channelId, messageId });
    }
    setDeleteDropdownId(null);
  };

  const handleHide = (messageId: string) => {
    if (confirm(t('talk:deleteForMeConfirm'))) {
      hideMessage.mutate({ channelId, messageId });
    }
    setDeleteDropdownId(null);
  };

  const canDeleteForAll = (msg: TalkMessageResponse) => {
    if (msg.senderId !== userId) return false;
    const oneHour = 60 * 60 * 1000;
    return Date.now() - new Date(msg.createdAt).getTime() <= oneHour;
  };

  // 삭제 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(e.target as Node)) {
        setDeleteDropdownId(null);
      }
    };
    if (deleteDropdownId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [deleteDropdownId]);

  const handleReply = (msg: TalkMessageResponse) => {
    // Resolve <@UUID> mentions to @UserName for reply preview
    let previewContent = msg.content;
    if (msg.mentions?.length) {
      const mentionMap = new Map(msg.mentions.map((m) => [m.userId, m.userName]));
      previewContent = previewContent.replace(
        /<@([0-9a-f-]{36})>/g,
        (_, uid) => `@${mentionMap.get(uid) || 'Unknown'}`,
      );
    }
    setReplyTo({
      id: msg.id,
      senderName: msg.senderName,
      content: previewContent.slice(0, 80),
    });
  };

  const handleReact = (messageId: string, type: string) => {
    reactMessage.mutate({ channelId, messageId, type });
  };

  const handleTogglePin = (messageId: string) => {
    togglePinMessage.mutate({ channelId, messageId });
  };

  const scrollToMessage = (msgId: string) => {
    const el = msgRefsMap.current.get(msgId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const { timezone } = useTimezoneStore();

  const formatTime = (dateStr: string) => {
    return formatDateTimeInTz(dateStr, timezone, 'HH:mm');
  };

  const formatDate = (dateStr: string) => {
    return formatDateTimeInTz(dateStr, timezone, 'YYYY-MM-DD HH:mm');
  };

  const shouldShowDate = (current: TalkMessageResponse, prev?: TalkMessageResponse) => {
    if (!prev) return true;
    return formatDate(current.createdAt) !== formatDate(prev.createdAt);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-400">{t('talk:noMessages')}</p>
          <p className="mt-1 text-xs text-gray-300">{t('talk:noMessagesDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-2"
    >
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}

      {allMessages.map((msg, idx) => {
        const isOwn = msg.senderId === userId;
        const prevMsg = idx > 0 ? allMessages[idx - 1] : undefined;
        const showDate = shouldShowDate(msg, prevMsg);
        const showSender = !prevMsg || prevMsg.senderId !== msg.senderId || showDate;

        return (
          <div
            key={msg.id}
            ref={(el) => { if (el) msgRefsMap.current.set(msg.id, el); }}
          >
            {showDate && (
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="shrink-0 text-xs text-gray-400">{formatDate(msg.createdAt)}</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
            )}

            {/* TRANSLATION type message: special rendering */}
            {msg.type === 'TRANSLATION' ? (
              <TranslationMessage msg={msg} allMessages={allMessages} />
            ) : msg.type === 'SYSTEM' ? (
              <div className="my-2 flex justify-center">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                  {msg.content}
                </span>
              </div>
            ) : (
            <div className={`group mb-1 flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {/* Avatar for other users' messages */}
              {!isOwn && (
                <div className="mt-0.5 shrink-0">
                  {showSender ? (
                    <UserAvatar userId={msg.senderId} name={msg.senderName} size={32} />
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}
              <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {showSender && !isOwn && (
                  <p className="mb-0.5 flex items-center gap-1 text-xs font-medium text-gray-500">
                    {msg.senderName?.startsWith('[Slack]') && (
                      <svg className="h-3 w-3 text-purple-500" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
                    )}
                    {msg.senderName?.startsWith('[Slack]') ? msg.senderName.replace('[Slack] ', '') : msg.senderName}
                  </p>
                )}

                {msg.isPinned && (
                  <div className="mb-0.5 flex items-center gap-1 text-xs text-amber-500">
                    <Pin className="h-3 w-3" />
                    <span>{t('talk:pinnedMessage')}</span>
                  </div>
                )}

                {/* 인용 블록 (Reply) */}
                {msg.parentMessage && (
                  <button
                    onClick={() => msg.parentMessage && scrollToMessage(msg.parentMessage.id)}
                    className={`mb-1 w-full cursor-pointer rounded border-l-2 border-indigo-300 bg-indigo-50 px-2 py-1 text-left hover:bg-indigo-100 ${isOwn ? 'border-white/40 bg-white/20 hover:bg-white/30' : ''}`}
                  >
                    <p className={`text-xs font-medium ${isOwn ? 'text-white/80' : 'text-indigo-600'}`}>
                      {msg.parentMessage.senderName}
                    </p>
                    <p className={`truncate text-xs ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                      {msg.parentMessage.isDeleted ? t('talk:deletedMessage') : msg.parentMessage.content.replace(/<@[0-9a-f-]{36}>/g, '@?')}
                    </p>
                  </button>
                )}

                {/* 메시지 버블 + 시간 */}
                {(() => {
                  const hasImageAttachment = msg.attachments?.some((a) => a.mimeType.startsWith('image/'));
                  const isAutoImageContent = !msg.content || /^📎\s/.test(msg.content);
                  const hideContent = hasImageAttachment && isAutoImageContent;
                  if (hideContent) return null;
                  return (
                <div className="flex items-end gap-1.5">
                  {isOwn && (
                    <span className="shrink-0 text-xs text-gray-300 opacity-0 group-hover:opacity-100">
                      {formatTime(msg.createdAt)}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      isOwn
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {renderMentionedContent(msg.content, msg.mentions, isOwn)}
                      {msg.isEdited && (
                        <span className={`ml-1 text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                          ({t('talk:edited')})
                        </span>
                      )}
                    </p>
                  </div>
                  {!isOwn && (
                    <span className="shrink-0 text-xs text-gray-300 opacity-0 group-hover:opacity-100">
                      {formatTime(msg.createdAt)}
                    </span>
                  )}
                </div>
                  );
                })()}

                {/* 첨부 파일 */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={`mt-1 flex flex-wrap gap-1.5 ${isOwn ? 'justify-end' : ''}`}>
                    {msg.attachments.map((att) => (
                      att.mimeType.startsWith('image/') ? (
                        <AttachmentImage
                          key={att.id}
                          att={att}
                          onClick={() => setLightboxUrl(att.downloadUrl)}
                        />
                      ) : (
                        <button
                          key={att.id}
                          onClick={() => {
                            const ext = att.originalName.toLowerCase();
                            const isPreviewable =
                              att.mimeType === 'application/pdf' ||
                              att.mimeType === 'text/plain' || ext.endsWith('.txt') ||
                              att.mimeType === 'text/markdown' || ext.endsWith('.md');
                            if (isPreviewable) {
                              setPreviewFile({ url: att.downloadUrl, originalName: att.originalName, mimeType: att.mimeType });
                            } else {
                              if (window.confirm(t('talk:filePreviewNotSupported'))) {
                                const a = document.createElement('a');
                                a.href = `${att.downloadUrl}/download?name=${encodeURIComponent(att.originalName)}`;
                                a.download = att.originalName;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="max-w-[140px] truncate">{att.originalName}</span>
                          <Download className="h-3 w-3 shrink-0 text-gray-400" />
                        </button>
                      )
                    ))}
                  </div>
                )}

                {/* 번역 결과 — 첨부 바로 아래, 액션 버튼 위 */}
                <MessageTranslation messageId={msg.id} isOwn={isOwn} />

                {/* 액션 버튼 (번역, 복사, 리플라이, 리액션, 삭제) — 메시지 아래 라인 */}
                <div className={`flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${isOwn ? 'justify-end' : ''}`}>
                  <MessageTranslateButton channelId={channelId} messageId={msg.id} />

                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="shrink-0 text-gray-300 hover:text-indigo-400"
                    title={t('talk:copy', { defaultValue: 'Copy' })}
                  >
                    {copiedId === msg.id
                      ? <Check className="h-3.5 w-3.5 text-green-400" />
                      : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  {!msg.parentId && (
                    <button
                      onClick={() => handleReply(msg)}
                      className="shrink-0 text-gray-300 hover:text-indigo-400"
                      title={t('talk:reply')}
                    >
                      <Reply className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleTogglePin(msg.id)}
                    className={`shrink-0 ${msg.isPinned ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-400'}`}
                    title={msg.isPinned ? t('talk:unpinMessage') : t('talk:pinMessage')}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex gap-0.5">
                    {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                      const reacted = msg.reactions?.find((r) => r.type === type)?.reacted;
                      return (
                        <button
                          key={type}
                          onClick={() => handleReact(msg.id, type)}
                          className={`rounded px-1 py-0.5 text-sm transition-all hover:bg-gray-200 ${reacted ? 'bg-indigo-100' : 'grayscale hover:grayscale-0'}`}
                          title={t(`talk:reaction${type.charAt(0) + type.slice(1).toLowerCase().replace('_j', 'J').replace('_', '')}`)}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>

                  {/* 삭제 드롭다운 (나만 삭제 / 모두에게 삭제) */}
                  {isOwn && (
                  <div className="relative">
                    <button
                      onClick={() => setDeleteDropdownId(deleteDropdownId === msg.id ? null : msg.id)}
                      className="shrink-0 text-gray-300 hover:text-red-400"
                      title={t('talk:deleteMessage')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {deleteDropdownId === msg.id && (
                      <div
                        ref={deleteDropdownRef}
                        className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full z-50 mb-1 w-40 rounded-md border bg-white py-1 shadow-lg`}
                      >
                        <button
                          onClick={() => handleHide(msg.id)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <EyeOff className="h-3 w-3" />
                          {t('talk:deleteForMe')}
                        </button>
                        {canDeleteForAll(msg) && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('talk:deleteForAll')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  )}
                </div>

                {/* 리액션 집계 */}
                {(msg.reactions?.length ?? 0) > 0 && (
                  <div className={`mt-0.5 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : ''}`}>
                    {msg.reactions!.map((r) => (
                      <button
                        key={r.type}
                        onClick={() => handleReact(msg.id, r.type)}
                        className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-all ${
                          r.reacted
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 grayscale hover:grayscale-0'
                        }`}
                      >
                        {REACTION_EMOJIS[r.type]} {r.count}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reply count */}
                {(msg.replyCount ?? 0) > 0 && !msg.parentId && (
                  <button
                    onClick={() => handleReply(msg)}
                    className={`mt-0.5 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 ${isOwn ? 'justify-end' : ''}`}
                  >
                    <Reply className="h-3 w-3" />
                    <span>{t('talk:replyCount', { count: msg.replyCount })}</span>
                  </button>
                )}

                {/* 수신 상태 (내 메시지만) */}
                {isOwn && (
                  <div className={`relative mt-0.5 text-right text-xs ${(msg.readCount ?? 0) > 0 ? 'text-indigo-400' : 'text-gray-300'}`}>
                    {(msg.readCount ?? 0) > 0 ? (
                      <button
                        onClick={() => setReadersPopoverMsgId(readersPopoverMsgId === msg.id ? null : msg.id)}
                        className="cursor-pointer hover:underline"
                        title={t('talk:deliveryStatusReadCount', { count: msg.readCount })}
                      >
                        ✓✓
                      </button>
                    ) : (
                      <span title={t('talk:deliveryStatusSent')}>✓</span>
                    )}
                    {readersPopoverMsgId === msg.id && (
                      <MessageReadersPopover
                        channelId={channelId}
                        messageId={msg.id}
                        onClose={() => setReadersPopoverMsgId(null)}
                      />
                    )}
                  </div>
                )}

              </div>
            </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {previewFile && (
        <FilePreviewModal
          url={previewFile.url}
          originalName={previewFile.originalName}
          mimeType={previewFile.mimeType}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
