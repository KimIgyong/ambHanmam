import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UnitCode } from '@amb/types';
import { useChatStore } from '@/domain/chat/store/chat.store';
import {
  useConversationDetail,
  useCreateConversation,
} from '@/domain/chat/hooks/useChat';
import { sendMessageSSE } from '@/lib/sse-client';
import { getUnitInfo } from '@/global/constant/unit.constant';
import MessageList from '@/domain/chat/components/MessageList';
import MessageInput from '@/domain/chat/components/MessageInput';
import { QuotaExceededBanner } from '@/components/common/QuotaExceededBanner';

export default function ChatPage() {
  const { unit, conversationId: urlConversationId } = useParams<{
    unit: string;
    conversationId?: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['chat', 'units']);
  const unitCode = unit as UnitCode;
  const unitInfo = getUnitInfo(unitCode);

  const {
    currentConversationId,
    isStreaming,
    setCurrentUnit,
    setCurrentConversationId,
    addMessage,
    setMessages,
    setStreamingContent,
    appendStreamingContent,
    setIsStreaming,
    setIsResponseIncomplete,
  } = useChatStore();

  const { data: conversationDetail } = useConversationDetail(currentConversationId);
  const createConversation = useCreateConversation();

  // Sync URL conversationId with store
  useEffect(() => {
    setCurrentUnit(unitCode);
    const resolvedId = urlConversationId && urlConversationId !== 'new' ? urlConversationId : null;
    if (resolvedId !== currentConversationId) {
      setCurrentConversationId(resolvedId);
      if (!resolvedId) {
        setMessages([]);
      }
    }
  }, [unitCode, urlConversationId, setCurrentUnit, setCurrentConversationId, setMessages]);

  const handleSend = useCallback(
    async (content: string) => {
      let conversationId = currentConversationId;

      // Auto-create conversation if none selected
      if (!conversationId) {
        try {
          const conversation = await createConversation.mutateAsync({
            unitCode,
            title: content.slice(0, 50),
          });
          conversationId = conversation!.conversationId;
          setCurrentConversationId(conversationId);
          navigate(`/chat/${unitCode}/${conversationId}`, { replace: true });
        } catch {
          return;
        }
      }

      // Add user message optimistically
      const userMessage = {
        messageId: `temp-${Date.now()}`,
        conversationId,
        role: 'user' as const,
        content,
        tokenCount: 0,
        order: 0,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);

      // Start SSE streaming
      setIsStreaming(true);
      setStreamingContent('');

      await sendMessageSSE(conversationId, content, {
        onMessage: (chunk) => {
          appendStreamingContent(chunk);
        },
        onDone: (fullContent, stopReason) => {
          setIsStreaming(false);
          setStreamingContent('');
          const isIncomplete = stopReason === 'max_tokens' || stopReason === 'interrupted';
          setIsResponseIncomplete(isIncomplete);
          addMessage({
            messageId: `msg-${Date.now()}`,
            conversationId: conversationId!,
            role: 'assistant',
            content: fullContent,
            tokenCount: 0,
            order: 0,
            createdAt: new Date().toISOString(),
          });
        },
        onError: (error, errorCode) => {
          setIsStreaming(false);
          setStreamingContent('');
          const isQuotaExceeded = errorCode === 'E4010' || errorCode === 'E4011';
          addMessage({
            messageId: `err-${Date.now()}`,
            conversationId: conversationId!,
            role: 'assistant',
            content: isQuotaExceeded
              ? t('chat:quotaExceeded')
              : t('chat:errorOccurred', { error }),
            tokenCount: 0,
            order: 0,
            createdAt: new Date().toISOString(),
          });
        },
      });
    },
    [
      currentConversationId,
      unitCode,
      createConversation,
      setCurrentConversationId,
      navigate,
      addMessage,
      setIsStreaming,
      setStreamingContent,
      appendStreamingContent,
      setIsResponseIncomplete,
      t,
    ],
  );

  const handleContinue = useCallback(() => {
    if (currentConversationId) {
      handleSend(t('chat:continuePrompt'));
    }
  }, [currentConversationId, handleSend, t]);

  const unitName = unitInfo
    ? t(`units:${unitInfo.nameKey}`)
    : '';

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
        {unitInfo && (
          <>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${unitInfo.bgColor}`}
            >
              <unitInfo.icon
                className={`h-5 w-5 ${unitInfo.color}`}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {t('chat:aiAssistant', { name: unitName })}
              </h1>
              <p className="text-xs text-gray-500">
                {t(`units:${unitInfo.descriptionKey}`)}
              </p>
            </div>
          </>
        )}
        {conversationDetail && (
          <span className="ml-auto text-sm text-gray-400">
            {conversationDetail.title}
          </span>
        )}
      </header>

      <QuotaExceededBanner />

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList onContinue={handleContinue} />
      </div>

      {/* Message Input */}
      <MessageInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
