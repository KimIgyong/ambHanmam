import { useEffect, useRef, useCallback, useState, createRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Shield, RotateCw, Copy, FileText, FileDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MessageResponse } from '@amb/types';
import { useChatStore } from '@/domain/chat/store/chat.store';
import { downloadAsMarkdown, downloadAsPdf } from '@/lib/export-utils';

// ── Props 기반 순수 렌더링 컴포넌트 ──

export interface MessageListViewProps {
  messages: MessageResponse[];
  streamingContent: string;
  isStreaming: boolean;
  isResponseIncomplete?: boolean;
  onContinue?: () => void;
  compact?: boolean;
}

export function MessageListView({
  messages,
  streamingContent,
  isStreaming,
  isResponseIncomplete,
  onContinue,
  compact,
}: MessageListViewProps) {
  const { t } = useTranslation('chat');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messageRefs = useRef<Map<string, React.RefObject<HTMLDivElement>>>(new Map());

  const getMessageRef = (messageId: string) => {
    if (!messageRefs.current.has(messageId)) {
      messageRefs.current.set(messageId, createRef<HTMLDivElement>());
    }
    return messageRefs.current.get(messageId)!;
  };

  const handleCopy = useCallback(async (messageId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handlePdfDownload = useCallback(async (messageId: string) => {
    const ref = messageRefs.current.get(messageId);
    if (ref?.current) {
      await downloadAsPdf(ref.current);
    }
  }, []);

  // Auto-scroll to bottom on new messages or streaming content
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            {t('emptyPrompt')}
          </p>
        </div>
      </div>
    );
  }

  const containerClass = compact
    ? 'h-full overflow-y-auto px-3 py-4'
    : 'h-full overflow-y-auto px-4 py-6';
  const innerClass = compact
    ? 'space-y-4'
    : 'mx-auto max-w-3xl space-y-6';

  return (
    <div ref={scrollContainerRef} className={containerClass}>
      <div className={innerClass}>
        {messages.map((message) => (
          (() => {
            const isUser = message.role === 'user';
            const isAdmin = message.role === 'admin';
            const isAiLike = !isUser;

            return (
          <div
            key={message.messageId}
            className={`group flex gap-3 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isUser
                  ? 'bg-primary-500'
                  : isAdmin
                    ? 'bg-amber-100'
                  : 'bg-gray-200'
              }`}
            >
              {isUser ? (
                <User className="h-4 w-4 text-white" />
              ) : isAdmin ? (
                <Shield className="h-4 w-4 text-amber-700" />
              ) : (
                <Bot className="h-4 w-4 text-gray-600" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={compact ? 'max-w-[85%]' : 'max-w-[75%]'}>
              <div
                ref={isAiLike ? getMessageRef(message.messageId) : undefined}
                className={`rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'bg-primary-500 text-white'
                    : isAdmin
                      ? 'bg-amber-50 text-amber-950 border border-amber-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {!isUser && (
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {isAdmin ? t('adminLabel', { defaultValue: 'Admin' }) : t('aiLabel', { defaultValue: 'AI' })}
                  </div>
                )}
                {isAiLike ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-gray-800 prose-pre:text-gray-100">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                )}
              </div>
              {isAiLike && (
                <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleCopy(message.messageId, message.content)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title={t('copyMessage')}
                  >
                    {copiedId === message.messageId ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => downloadAsMarkdown(message.content)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title={t('downloadMd')}
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handlePdfDownload(message.messageId)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title={t('downloadPdf')}
                  >
                    <FileDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
            );
          })()
        ))}

        {/* Continue Button */}
        {isResponseIncomplete && !isStreaming && (
          <div className="flex justify-center py-3">
            <button
              onClick={onContinue}
              className="flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100"
            >
              <RotateCw className="h-4 w-4" />
              {t('continueResponse')}
            </button>
          </div>
        )}

        {/* Streaming Message */}
        {isStreaming && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
              <Bot className="h-4 w-4 text-gray-600" />
            </div>
            <div className={`${compact ? 'max-w-[85%]' : 'max-w-[75%]'} rounded-2xl bg-gray-100 px-4 py-3 text-gray-900`}>
              {streamingContent ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-gray-800 prose-pre:text-gray-100">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── 기존 호환 래퍼 (useChatStore 기반) ──

interface MessageListProps {
  onContinue?: () => void;
}

export default function MessageList({ onContinue }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const isResponseIncomplete = useChatStore((s) => s.isResponseIncomplete);

  return (
    <MessageListView
      messages={messages}
      streamingContent={streamingContent}
      isStreaming={isStreaming}
      isResponseIncomplete={isResponseIncomplete}
      onContinue={onContinue}
    />
  );
}
