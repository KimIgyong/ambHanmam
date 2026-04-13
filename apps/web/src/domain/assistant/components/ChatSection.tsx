import { useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUnitInfo } from '@/global/constant/unit.constant';
import { MessageListView } from '@/domain/chat/components/MessageList';
import MessageInput from '@/domain/chat/components/MessageInput';
import { useCreateConversation } from '@/domain/chat/hooks/useChat';
import { sendMessageSSE } from '@/lib/sse-client';
import { useAssistantModalStore } from '../store/assistant-modal.store';

export default function ChatSection() {
  const { t } = useTranslation(['assistant', 'units', 'chat']);

  const {
    selectedUnit,
    conversationId,
    messages,
    streamingContent,
    isStreaming,
    isResponseIncomplete,
    backToWelcome,
    setConversationId,
    addMessage,
    appendStreamingContent,
    setIsStreaming,
    setStreamingContent,
    setIsResponseIncomplete,
  } = useAssistantModalStore();

  const createConversation = useCreateConversation();
  const unitInfo = selectedUnit ? getUnitInfo(selectedUnit) : null;

  const handleSend = useCallback(
    async (content: string) => {
      let cvsId = conversationId;

      if (!cvsId) {
        try {
          const conversation = await createConversation.mutateAsync({
            unitCode: selectedUnit!,
            title: content.slice(0, 50),
          });
          cvsId = conversation!.conversationId;
          setConversationId(cvsId);
        } catch {
          return;
        }
      }

      const userMessage = {
        messageId: `temp-${Date.now()}`,
        conversationId: cvsId,
        role: 'user' as const,
        content,
        tokenCount: 0,
        order: 0,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMessage);

      setIsStreaming(true);
      setStreamingContent('');

      await sendMessageSSE(cvsId, content, {
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
            conversationId: cvsId!,
            role: 'assistant',
            content: fullContent,
            tokenCount: 0,
            order: 0,
            createdAt: new Date().toISOString(),
          });
        },
        onError: (error) => {
          setIsStreaming(false);
          setStreamingContent('');
          addMessage({
            messageId: `err-${Date.now()}`,
            conversationId: cvsId!,
            role: 'assistant',
            content: t('chat:errorOccurred', { error }),
            tokenCount: 0,
            order: 0,
            createdAt: new Date().toISOString(),
          });
        },
      });
    },
    [
      conversationId,
      selectedUnit,
      createConversation,
      setConversationId,
      addMessage,
      setIsStreaming,
      setStreamingContent,
      appendStreamingContent,
      setIsResponseIncomplete,
      t,
    ],
  );

  const handleContinue = useCallback(() => {
    if (conversationId) {
      handleSend(t('chat:continuePrompt'));
    }
  }, [conversationId, handleSend, t]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <button
          onClick={backToWelcome}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={t('assistant:back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {unitInfo && (
          <>
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${unitInfo.bgColor}`}>
              <unitInfo.icon className={`h-4 w-4 ${unitInfo.color}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {t(`units:${unitInfo.nameKey}`)}
            </span>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageListView
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          isResponseIncomplete={isResponseIncomplete}
          onContinue={handleContinue}
          compact
        />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
