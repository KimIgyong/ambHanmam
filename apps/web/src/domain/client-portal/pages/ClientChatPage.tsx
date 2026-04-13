import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { useChannels, useChannelDetail } from '@/domain/amoeba-talk/hooks/useTalk';
import { useTalkSSE } from '@/domain/amoeba-talk/hooks/useTalkSSE';
import { useTalkStore } from '@/domain/amoeba-talk/store/talk.store';
import ChannelHeader from '@/domain/amoeba-talk/components/ChannelHeader';
import TalkMessageList from '@/domain/amoeba-talk/components/TalkMessageList';
import TalkMessageInput from '@/domain/amoeba-talk/components/TalkMessageInput';
import MessageSearchResults from '@/domain/amoeba-talk/components/MessageSearchResults';
import MemberPanel from '@/domain/amoeba-talk/components/MemberPanel';
import PinnedMessageBanner from '@/domain/amoeba-talk/components/PinnedMessageBanner';

export default function ClientChatPage() {
  const { t } = useTranslation(['talk']);
  const { channelId } = useParams<{ channelId?: string }>();
  const { currentChannelId, setCurrentChannelId, showMemberPanel, setShowMemberPanel, isSearchOpen, searchQuery } = useTalkStore();

  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: channelDetail } = useChannelDetail(currentChannelId);

  useTalkSSE(currentChannelId);

  // URL 파라미터로 채널 초기 선택
  useEffect(() => {
    if (channelId && channelId !== currentChannelId) {
      setCurrentChannelId(channelId);
    }
  }, [channelId]);

  // 채널 목록 로드 후 첫 번째 채널 자동 선택
  useEffect(() => {
    if (!currentChannelId && channels && channels.length > 0) {
      setCurrentChannelId(channels[0].id);
    }
  }, [channels, currentChannelId]);

  // 채널 선택 시 멤버 패널 기본 노출
  useEffect(() => {
    if (currentChannelId) {
      setShowMemberPanel(true);
    }
  }, [currentChannelId]);

  const hasChatView = currentChannelId && channelDetail;

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      {/* Chat Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Channel Selector (상단) */}
        {channels && channels.length > 0 && (
          <div className="shrink-0 border-b bg-gray-50 px-4 py-2">
            <div className="relative inline-block">
              <select
                value={currentChannelId || ''}
                onChange={(e) => setCurrentChannelId(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}

        {hasChatView ? (
          <>
            <ChannelHeader channel={channelDetail} isClientMode />
            {isSearchOpen ? (
              <MessageSearchResults channelId={currentChannelId} query={searchQuery} />
            ) : (
              <>
                <PinnedMessageBanner channelId={currentChannelId} />
                <TalkMessageList channelId={currentChannelId} />
                <TalkMessageInput channelId={currentChannelId} />
              </>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                <MessageCircle className="h-8 w-8 text-indigo-400" />
              </div>
              <p className="text-sm text-gray-400">
                {channelsLoading ? t('common:loading') : channels?.length === 0 ? t('talk:noChannels') : t('talk:selectChannel')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Member Panel - 기본 노출 */}
      {showMemberPanel && channelDetail && (
        <MemberPanel channel={channelDetail} isClientMode />
      )}
    </div>
  );
}
