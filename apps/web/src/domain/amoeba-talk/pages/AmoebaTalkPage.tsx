import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { useChannels, useChannelDetail } from '../hooks/useTalk';
import { useTalkSSE } from '../hooks/useTalkSSE';
import { useTalkStore, NOTIFICATION_CHANNEL_ID } from '../store/talk.store';
import ChannelList from '../components/ChannelList';
import ChannelHeader from '../components/ChannelHeader';
import TalkMessageList from '../components/TalkMessageList';
import TalkMessageInput from '../components/TalkMessageInput';
import MessageSearchResults from '../components/MessageSearchResults';
import CreateChannelModal from '../components/CreateChannelModal';
import EditChannelModal from '../components/EditChannelModal';
import NewDmModal from '../components/NewDmModal';
import InviteMemberModal from '../components/InviteMemberModal';
import MemberPanel from '../components/MemberPanel';
import PinnedMessageBanner from '../components/PinnedMessageBanner';
import NotificationChatView from '../components/NotificationChatView';
import NotificationPreviewPanel from '../components/NotificationPreviewPanel';

export default function AmoebaTalkPage() {
  const { t } = useTranslation(['talk']);
  const { currentChannelId, showCreateModal, showEditModal, showNewDmModal, showInviteModal, showMemberPanel, setShowMemberPanel, isSearchOpen, searchQuery, notificationPreview } = useTalkStore();

  const isNotificationChannel = currentChannelId === NOTIFICATION_CHANNEL_ID;
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: channelDetail } = useChannelDetail(isNotificationChannel ? null : currentChannelId);

  useTalkSSE(isNotificationChannel ? null : currentChannelId);

  useEffect(() => {
    if (currentChannelId && !isNotificationChannel) {
      setShowMemberPanel(true);
    }
  }, [currentChannelId, isNotificationChannel, setShowMemberPanel]);

  const hasChatView = currentChannelId && (isNotificationChannel || channelDetail);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">

      <div className="flex flex-1 overflow-hidden">
        <div className={`${
          hasChatView ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-60 shrink-0 border-r bg-gray-50 flex-col`}>
          <ChannelList channels={channels || []} isLoading={channelsLoading} />
        </div>

        <div className={`${
          hasChatView ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col min-w-0`}>
          {isNotificationChannel ? (
            <NotificationChatView />
          ) : hasChatView && channelDetail ? (
            <>
              <ChannelHeader channel={channelDetail} />
              {isSearchOpen ? (
                <MessageSearchResults channelId={currentChannelId!} query={searchQuery} />
              ) : (
                <>
                  <PinnedMessageBanner channelId={currentChannelId!} />
                  <TalkMessageList channelId={currentChannelId!} />
                  <TalkMessageInput channelId={currentChannelId!} />
                </>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
                  <MessageCircle className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-sm text-gray-400">{t('talk:selectChannel')}</p>
              </div>
            </div>
          )}
        </div>

        {showMemberPanel && channelDetail && !isNotificationChannel && (
          <MemberPanel channel={channelDetail} />
        )}

        {isNotificationChannel && notificationPreview && (
          <NotificationPreviewPanel />
        )}
      </div>

      {showCreateModal && <CreateChannelModal />}
      {showEditModal && channelDetail && <EditChannelModal channel={channelDetail} />}
      {showNewDmModal && <NewDmModal />}
      {showInviteModal && channelDetail && <InviteMemberModal channel={channelDetail} />}
    </div>
  );
}
