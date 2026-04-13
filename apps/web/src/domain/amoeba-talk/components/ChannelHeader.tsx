import { useEffect, useRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Lock, MessageCircle, Users, Search, X, ArrowLeft, Pencil, BellOff, Bell, MoreVertical, Archive, LogOut } from 'lucide-react';
import { TalkChannelDetailResponse } from '@amb/types';
import { useTalkStore } from '../store/talk.store';
import { useTalkUserId } from '../hooks/useTalkUser';
import { useChannels, useToggleMute, useRemoveMember, useArchiveChannel, useUnarchiveChannel } from '../hooks/useTalk';

interface ChannelHeaderProps {
  channel: TalkChannelDetailResponse;
  isClientMode?: boolean;
}

export default function ChannelHeader({ channel, isClientMode }: ChannelHeaderProps) {
  const { t } = useTranslation(['talk']);
  const { setCurrentChannelId, setShowMemberPanel, setShowEditModal, isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery, presenceMap } = useTalkStore();
  const currentUserId = useTalkUserId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: channels } = useChannels();
  const toggleMuteMutation = useToggleMute();

  const currentChannel = channels?.find((c) => c.id === channel.id);
  const isMuted = currentChannel?.isMuted ?? false;
  const isArchived = !!currentChannel?.archivedAt;

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const removeMemberMutation = useRemoveMember();
  const archiveMutation = useArchiveChannel();
  const unarchiveMutation = useUnarchiveChannel();

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  const handleLeaveChannel = () => {
    if (confirm(t('talk:leaveChannelConfirm'))) {
      removeMemberMutation.mutate(
        { channelId: channel.id, userId: currentUserId! },
        { onSuccess: () => setCurrentChannelId(null) },
      );
    }
    setShowMoreMenu(false);
  };

  const handleArchive = () => {
    if (isArchived) {
      if (confirm(t('talk:unarchiveChannelConfirm'))) {
        unarchiveMutation.mutate(channel.id);
      }
    } else {
      if (confirm(t('talk:archiveChannelConfirm'))) {
        archiveMutation.mutate(channel.id, { onSuccess: () => setCurrentChannelId(null) });
      }
    }
    setShowMoreMenu(false);
  };

  // DM 상대방의 온라인 상태
  const dmPartnerStatus = useMemo(() => {
    if (channel.type !== 'DIRECT') return null;
    const partner = channel.members.find((m) => m.userId !== currentUserId);
    if (!partner) return null;
    return presenceMap[partner.userId] === 'online' ? 'online' : 'offline';
  }, [channel, currentUserId, presenceMap]);

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'PRIVATE': return <Lock className="h-5 w-5 text-gray-500" />;
      case 'DIRECT': return <MessageCircle className="h-5 w-5 text-gray-500" />;
      default: return <Hash className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="shrink-0 border-b bg-white">
      <div className="flex items-center justify-between px-2 py-2 md:px-4 md:py-3">
        <div className="flex items-center gap-2">
          {/* 채널 리스트가 숨겨진 화면에서 뒤로 가기 */}
          <button
            onClick={() => setCurrentChannelId(null)}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {getChannelIcon(channel.type)}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-base md:text-sm font-semibold text-black md:text-gray-800">{channel.name}</h3>
              {!isClientMode && channel.createdBy === currentUserId && channel.type !== 'DIRECT' && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="rounded p-0.5 text-gray-300 hover:text-gray-500"
                  title={t('talk:editChannel')}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {channel.description && (
              <p className="text-xs text-gray-400">{channel.description}</p>
            )}
            {dmPartnerStatus && (
              <p className={`text-xs ${dmPartnerStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
                {dmPartnerStatus === 'online' ? t('talk:presence.activeNow') : t('talk:presence.offline')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleMuteMutation.mutate(channel.id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${
              isMuted ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
            }`}
            title={isMuted ? t('talk:unmute') : t('talk:mute')}
          >
            {isMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${
              isSearchOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowMemberPanel(true)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            <Users className="h-4 w-4" />
            <span>{t('talk:memberCount', { count: channel.memberCount })}</span>
          </button>
          {/* More actions menu */}
          {channel.type !== 'DIRECT' && (
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center rounded-md px-1.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
                title={t('talk:moreActions')}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg">
                  {channel.createdBy !== currentUserId && (
                    <button
                      onClick={handleLeaveChannel}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('talk:leaveChannel')}
                    </button>
                  )}
                  <button
                    onClick={handleArchive}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Archive className="h-4 w-4" />
                    {isArchived ? t('talk:unarchiveChannel') : t('talk:archiveChannel')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <div className="flex items-center gap-2 border-t px-4 py-2">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('talk:searchMessages')}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ESC
          </button>
        </div>
      )}
    </div>
  );
}
