import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Lock, MessageCircle, Plus, PenSquare, ChevronDown, ChevronRight, Pin, Users, Search, BellOff, Bell, X } from 'lucide-react';
import { TalkChannelResponse } from '@amb/types';
import { useUnreadCounts, useTogglePin, useToggleMute, useEntityMembers, useStartDm, useDeleteDmChannel } from '../hooks/useTalk';
import { usePresenceStatus } from '../hooks/usePresence';
import { useTalkStore, NOTIFICATION_CHANNEL_ID } from '../store/talk.store';
import { useTalkUserName } from '../hooks/useTalkUser';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useNotificationStore } from '@/global/store/notification.store';
import UserAvatar from './UserAvatar';

interface ChannelListProps {
  channels: TalkChannelResponse[];
  isLoading: boolean;
  isClientMode?: boolean;
}

export default function ChannelList({ channels, isLoading, isClientMode }: ChannelListProps) {
  const { t } = useTranslation(['talk', 'notifications']);
  const { currentChannelId, setCurrentChannelId, setShowCreateModal, setShowNewDmModal, presenceMap } = useTalkStore();
  const { notifications: storeNotifications, unreadCount: notifUnreadCount } = useNotificationStore();
  const { data: unreadCounts } = useUnreadCounts();
  const togglePinMutation = useTogglePin();
  const toggleMuteMutation = useToggleMute();
  const deleteDmMutation = useDeleteDmChannel();

  const getUnread = (channelId: string) =>
    unreadCounts?.find((u) => u.channelId === channelId)?.unreadCount || 0;

  const [dmCollapsed, setDmCollapsed] = useState(
    () => localStorage.getItem('talk-dm-collapsed') === 'true',
  );
  const [channelsCollapsed, setChannelsCollapsed] = useState(
    () => localStorage.getItem('talk-channels-collapsed') === 'true',
  );
  const [archivedCollapsed, setArchivedCollapsed] = useState(
    () => localStorage.getItem('talk-archived-collapsed') !== 'false',
  );

  const toggleDm = () => {
    setDmCollapsed((prev) => {
      localStorage.setItem('talk-dm-collapsed', String(!prev));
      return !prev;
    });
  };
  const toggleChannels = () => {
    setChannelsCollapsed((prev) => {
      localStorage.setItem('talk-channels-collapsed', String(!prev));
      return !prev;
    });
  };
  const toggleArchived = () => {
    setArchivedCollapsed((prev) => {
      localStorage.setItem('talk-archived-collapsed', String(!prev));
      return !prev;
    });
  };

  const { dmChannels, groupChannels, archivedChannels } = useMemo(() => {
    const dm: TalkChannelResponse[] = [];
    const group: TalkChannelResponse[] = [];
    const archived: TalkChannelResponse[] = [];
    for (const ch of channels) {
      if (ch.archivedAt) {
        archived.push(ch);
      } else if (ch.type === 'DIRECT') {
        dm.push(ch);
      } else {
        group.push(ch);
      }
    }
    return { dmChannels: dm, groupChannels: group, archivedChannels: archived };
  }, [channels]);

  const currentUserName = useTalkUserName();
  const getDmDisplayName = (channel: TalkChannelResponse) => {
    if (!currentUserName || !channel.name.includes(',')) return channel.name;
    const names = channel.name.split(',').map((n) => n.trim());
    return names.find((n) => n !== currentUserName) || names[0] || channel.name;
  };

  const resolvePreview = (content: string, mentions?: { userId: string; userName: string }[]) => {
    if (!mentions?.length) return content;
    return content.replace(/<@([0-9a-f-]{36})>/g, (_, uid) => {
      const m = mentions.find((m) => m.userId === uid);
      return m ? `@${m.userName}` : '@Unknown';
    });
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'PRIVATE': return <Lock className="h-4 w-4 shrink-0 text-gray-400" />;
      case 'DIRECT': return <MessageCircle className="h-4 w-4 shrink-0 text-indigo-400" />;
      default: return <Hash className="h-4 w-4 shrink-0 text-gray-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleTogglePin = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    togglePinMutation.mutate(channelId);
  };

  const handleToggleMute = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    toggleMuteMutation.mutate(channelId);
  };

  const handleDeleteDm = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    if (confirm(t('talk:deleteDmConfirm'))) {
      deleteDmMutation.mutate(channelId);
    }
  };

  const renderChannel = (channel: TalkChannelResponse, isDm: boolean) => {
    const unread = getUnread(channel.id);
    const isActive = currentChannelId === channel.id;
    const displayName = isDm ? getDmDisplayName(channel) : channel.name;

    return (
      <button
        key={channel.id}
        onClick={() => setCurrentChannelId(channel.id)}
        className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
          isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
        }`}
      >
        {isDm ? (
          <div className="relative shrink-0">
            <UserAvatar userId={channel.dmPartnerUserId || ''} name={displayName} size={28} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-gray-50 ${
                presenceMap[channel.dmPartnerUserId || ''] === 'online' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>
        ) : (
          getChannelIcon(channel.type)
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className={`truncate text-base md:text-sm ${unread > 0 ? 'font-semibold text-black md:text-gray-900' : 'text-gray-900 md:text-gray-700'}`}>
              {channel.isPinned && <Pin className="mr-1 inline h-3 w-3 text-indigo-400" />}
              {channel.isMuted && <BellOff className="mr-1 inline h-3 w-3 text-red-300" />}
              {displayName}
            </span>
            <div className="ml-2 flex shrink-0 items-center gap-1">
              <button
                onClick={(e) => handleTogglePin(e, channel.id)}
                className={`rounded p-0.5 ${
                  channel.isPinned
                    ? 'text-indigo-400 hover:text-indigo-600'
                    : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500'
                }`}
                title={channel.isPinned ? t('talk:unpin') : t('talk:pin')}
              >
                <Pin className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => handleToggleMute(e, channel.id)}
                className={`rounded p-0.5 ${
                  channel.isMuted
                    ? 'text-red-400 hover:text-red-600'
                    : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500'
                }`}
                title={channel.isMuted ? t('talk:unmute') : t('talk:mute')}
              >
                <BellOff className="h-3 w-3" />
              </button>
              {isDm && !channel.lastMessage && (
                <button
                  onClick={(e) => handleDeleteDm(e, channel.id)}
                  className="rounded p-0.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400"
                  title={t('talk:deleteDm')}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {channel.lastMessage && (
                <span className="text-xs text-gray-400">
                  {formatTime(channel.lastMessage.createdAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="truncate text-xs text-gray-400">
              {channel.lastMessage
                ? (() => {
                    let preview = resolvePreview(channel.lastMessage.content, channel.lastMessage.mentions);
                    if (!preview && channel.lastMessage.type === 'FILE') {
                      const att = channel.lastMessage.attachments?.[0];
                      if (att) {
                        const isImage = att.mimeType.startsWith('image/');
                        preview = isImage ? `📷 ${att.originalName}` : `📎 ${att.originalName}`;
                      } else {
                        preview = t('talk:fileMessage');
                      }
                    }
                    return isDm ? preview : `${channel.lastMessage.senderName}: ${preview}`;
                  })()
                : t('talk:noMessages')}
            </p>
            {unread > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-xs font-medium text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">{t('talk:title')}</h2>
        {!isClientMode && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewDmModal(true)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title={t('talk:newDm')}
            >
              <PenSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title={t('talk:createChannel')}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 알림 센터 - 항상 최상단 */}
        <button
          onClick={() => setCurrentChannelId(NOTIFICATION_CHANNEL_ID)}
          className={`group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50 ${
            currentChannelId === NOTIFICATION_CHANNEL_ID ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
          }`}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <Bell className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className={`truncate text-base md:text-sm ${notifUnreadCount > 0 ? 'font-semibold text-black md:text-gray-900' : 'text-gray-900 md:text-gray-700'}`}>
                {t('talk:notificationCenter')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-gray-400">
                {storeNotifications[0]?.ntfTitle || t('notifications:noNotifications')}
              </p>
              {notifUnreadCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-xs font-medium text-white">
                  {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="border-b" />

        {channels.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">{t('talk:noChannels')}</p>
            <p className="mt-1 text-xs text-gray-300">{t('talk:noChannelsDesc')}</p>
          </div>
        ) : (
          <>
            {/* Group Channels Section */}
            {groupChannels.length > 0 && (
              <div>
                <button
                  onClick={toggleChannels}
                  className="flex w-full items-center gap-1 px-4 pb-1 pt-3 text-left"
                >
                  {channelsCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {t('talk:channels')}
                  </span>
                  {channelsCollapsed && (() => {
                    const total = groupChannels.reduce((sum, ch) => sum + getUnread(ch.id), 0);
                    return total > 0 ? (
                      <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-medium text-white">
                        {total > 99 ? '99+' : total}
                      </span>
                    ) : null;
                  })()}
                </button>
                {!channelsCollapsed && groupChannels.map((ch) => renderChannel(ch, false))}
              </div>
            )}

            {/* DM Section */}
            {dmChannels.length > 0 && (
              <div>
                <button
                  onClick={toggleDm}
                  className="flex w-full items-center gap-1 px-4 pb-1 pt-3 text-left"
                >
                  {dmCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {t('talk:directMessages')}
                  </span>
                  {dmCollapsed && (() => {
                    const total = dmChannels.reduce((sum, ch) => sum + getUnread(ch.id), 0);
                    return total > 0 ? (
                      <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-medium text-white">
                        {total > 99 ? '99+' : total}
                      </span>
                    ) : null;
                  })()}
                </button>
                {!dmCollapsed && dmChannels.map((ch) => renderChannel(ch, true))}
              </div>
            )}

            {/* Archived Section */}
            {archivedChannels.length > 0 && (
              <div>
                <button
                  onClick={toggleArchived}
                  className="flex w-full items-center gap-1 px-4 pb-1 pt-3 text-left"
                >
                  {archivedCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {t('talk:archivedChannels')}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400">{archivedChannels.length}</span>
                </button>
                {!archivedCollapsed && archivedChannels.map((ch) => renderChannel(ch, ch.type === 'DIRECT'))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 고정 Crew 섹션 (클라이언트 모드에서는 숨김) */}
      {!isClientMode && <CrewSection />}
    </div>
  );
}

/** 하단 고정 Crew 아코디언 섹션 */
function CrewSection() {
  const { t } = useTranslation(['talk']);
  const [expanded, setExpanded] = useState(
    () => localStorage.getItem('talk-crew-expanded') === 'true',
  );
  const [search, setSearch] = useState('');
  const user = useAuthStore((s) => s.user);
  const { data: members, isLoading } = useEntityMembers();
  const startDm = useStartDm();
  const { presenceMap, setCurrentChannelId } = useTalkStore();

  const toggleExpanded = () => {
    setExpanded((prev) => {
      localStorage.setItem('talk-crew-expanded', String(!prev));
      return !prev;
    });
  };

  const otherMembers = useMemo(
    () => (members || []).filter((m) => m.userId !== user?.userId),
    [members, user?.userId],
  );

  const userIds = useMemo(() => otherMembers.map((m) => m.userId), [otherMembers]);
  usePresenceStatus(userIds);

  const filtered = useMemo(() => {
    if (!search.trim()) return otherMembers;
    const q = search.toLowerCase();
    return otherMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [otherMembers, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aOnline = presenceMap[a.userId] === 'online' ? 0 : 1;
      const bOnline = presenceMap[b.userId] === 'online' ? 0 : 1;
      if (aOnline !== bOnline) return aOnline - bOnline;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, presenceMap]);

  const onlineCount = otherMembers.filter((m) => presenceMap[m.userId] === 'online').length;

  const handleDm = async (targetUserId: string) => {
    try {
      const channel = await startDm.mutateAsync(targetUserId);
      if (channel) setCurrentChannelId(channel.id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="shrink-0 border-t bg-gray-50">
      {/* 토글 헤더 - 항상 표시 */}
      <button
        onClick={toggleExpanded}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-gray-100"
      >
        <Users className="h-4 w-4 text-indigo-600" />
        <span className="flex-1 text-xs font-medium text-gray-700">
          {t('talk:viewCrew')}
        </span>
        <span className="text-[10px] text-gray-400">
          {t('talk:onlineCount', { count: onlineCount })}
        </span>
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-gray-400" />
        )}
      </button>

      {/* 펼쳐진 상태: 검색 + 멤버 목록 */}
      {expanded && (
        <div className="flex max-h-64 flex-col">
          {/* 검색 */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('talk:crewSearch')}
                className="w-full rounded-md border border-gray-200 bg-white py-1 pl-7 pr-2 text-[11px] outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* 멤버 리스트 */}
          <div className="overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-gray-400">
                {t('talk:crewNoResult')}
              </div>
            ) : (
              <ul>
                {sorted.map((member) => {
                  const isOnline = presenceMap[member.userId] === 'online';
                  return (
                    <li key={member.userId}>
                      <button
                        onClick={() => handleDm(member.userId)}
                        disabled={startDm.isPending}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
                      >
                        <div className="relative shrink-0">
                          <UserAvatar userId={member.userId} name={member.name} size={24} />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-gray-50 ${
                              isOnline ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-800">
                          {member.name}
                        </span>
                        {isOnline && (
                          <span className="text-[9px] font-medium text-green-600">online</span>
                        )}
                        <MessageCircle className="h-3 w-3 shrink-0 text-gray-300" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
