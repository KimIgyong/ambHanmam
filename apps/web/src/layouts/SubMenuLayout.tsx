import { useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, MessageSquare, ChevronLeft } from 'lucide-react';
import { useChatStore } from '@/domain/chat/store/chat.store';
import { useConversationList } from '@/domain/chat/hooks/useChat';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function SubMenuLayout() {
  const navigate = useNavigate();
  const { unit, conversationId } = useParams<{
    unit: string;
    conversationId?: string;
  }>();
  const { t, i18n } = useTranslation('chat');

  const currentUnit = useChatStore((s) => s.currentUnit);
  const setCurrentUnit = useChatStore((s) => s.setCurrentUnit);
  const setCurrentConversationId = useChatStore((s) => s.setCurrentConversationId);
  const setMessages = useChatStore((s) => s.setMessages);

  const unitCode = unit?.toUpperCase();

  const { data: conversationData, isLoading } = useConversationList(unitCode);

  useEffect(() => {
    if (unitCode && unitCode !== currentUnit) {
      setCurrentUnit(unitCode as typeof currentUnit);
    }
  }, [unitCode, currentUnit, setCurrentUnit]);

  useEffect(() => {
    // "new" is a special path for new conversations, treat as null
    const resolvedId = conversationId && conversationId !== 'new' ? conversationId : null;
    setCurrentConversationId(resolvedId);
  }, [conversationId, setCurrentConversationId]);

  const conversations = conversationData?.data ?? [];

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    navigate(`/chat/${unit}`);
  };

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${unit}/${id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (days === 1) return t('yesterday');
    if (days < 7) return t('daysAgo', { days });
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    });
  };

  const showChatOnMobile = !!conversationId;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel - 280px */}
      <div className={`${showChatOnMobile ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-gray-200 bg-white md:w-[280px] md:shrink-0`}>
        {/* New Conversation button */}
        <div className="shrink-0 border-b border-gray-100 p-3">
          <button
            onClick={handleNewConversation}
            className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            {t('newConversation')}
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState
                icon={MessageSquare}
                title={t('noConversations')}
                description={t('noConversationsDesc')}
              />
            </div>
          ) : (
            <ul className="py-1">
              {conversations.map((conv) => {
                const isSelected = conv.conversationId === conversationId;

                return (
                  <li key={conv.conversationId}>
                    <button
                      onClick={() =>
                        handleSelectConversation(conv.conversationId)
                      }
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border-r-2 border-indigo-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`line-clamp-1 text-sm font-medium ${
                          isSelected ? 'text-indigo-700' : 'text-gray-800'
                        }`}
                      >
                        {conv.title}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {t('messageCount', { count: conv.messageCount })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(conv.updatedAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right content area */}
      <div className={`${showChatOnMobile ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-hidden`}>
        {/* Mobile back button */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2 md:hidden">
          <button onClick={() => navigate(`/chat/${unit}`)} className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">{t('back', { defaultValue: 'Back' })}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
