import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Crown, Shield, User, UserMinus, UserPlus, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TalkChannelDetailResponse } from '@amb/types';
import { useRemoveMember, talkKeys } from '../hooks/useTalk';
import { useTalkUserId } from '../hooks/useTalkUser';
import { useTalkStore } from '../store/talk.store';
import UserAvatar from './UserAvatar';

interface MemberPanelProps {
  channel: TalkChannelDetailResponse;
  isClientMode?: boolean;
}

export default function MemberPanel({ channel, isClientMode }: MemberPanelProps) {
  const { t } = useTranslation(['talk']);
  const { setShowMemberPanel, setShowInviteModal, setCurrentChannelId, presenceMap } = useTalkStore();
  const userId = useTalkUserId();
  const removeMember = useRemoveMember();
  const queryClient = useQueryClient();

  const isOwner = channel.createdBy === userId;

  // 온라인 사용자를 상단에 정렬
  const sortedMembers = useMemo(() => {
    return [...channel.members].sort((a, b) => {
      const aOnline = presenceMap[a.userId] === 'online' ? 0 : 1;
      const bOnline = presenceMap[b.userId] === 'online' ? 0 : 1;
      return aOnline - bOnline;
    });
  }, [channel.members, presenceMap]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-3.5 w-3.5 text-amber-500" />;
      case 'ADMIN': return <Shield className="h-3.5 w-3.5 text-blue-500" />;
      default: return <User className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return t('talk:owner');
      case 'ADMIN': return t('talk:admin');
      default: return t('talk:member');
    }
  };

  const handleRemove = (targetUserId: string) => {
    if (confirm(t('talk:leaveChannelConfirm'))) {
      removeMember.mutate({ channelId: channel.id, userId: targetUserId });
    }
  };

  return (
    <>
    <div className="hidden md:flex static z-auto w-64 flex-col bg-white border-l pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {t('talk:members')} ({channel.members.length})
        </h3>
        <div className="flex items-center gap-1">
          {!isClientMode && channel.type !== 'DIRECT' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="text-gray-400 hover:text-indigo-500"
              title={t('talk:inviteMember')}
            >
              <UserPlus className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setShowMemberPanel(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedMembers.map((member) => (
          <div
            key={member.id}
            className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
          >
            <div className="relative shrink-0">
              <UserAvatar userId={member.userId} name={member.userName} size={32} />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  presenceMap[member.userId] === 'online' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-700">{member.userName}</p>
              <div className="flex items-center gap-1">
                {getRoleIcon(member.role)}
                <span className="text-xs text-gray-400">{getRoleLabel(member.role)}</span>
              </div>
            </div>
            {!isClientMode && isOwner && member.role !== 'OWNER' && channel.type !== 'DIRECT' && (
              <button
                onClick={() => handleRemove(member.userId)}
                className="shrink-0 text-gray-300 opacity-0 hover:text-red-400 group-hover:opacity-100"
                title={t('talk:removeMember')}
              >
                <UserMinus className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 채널 나가기 (Owner 제외, DIRECT 제외, Client 제외) */}
      {!isClientMode && !isOwner && channel.type !== 'DIRECT' && (
        <div className="border-t px-4 py-3">
          <button
            onClick={() => {
              if (confirm(t('talk:leaveChannelConfirm'))) {
                removeMember.mutate(
                  { channelId: channel.id, userId: userId! },
                  {
                    onSuccess: () => {
                      setCurrentChannelId(null);
                      setShowMemberPanel(false);
                      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
                    },
                  },
                );
              }
            }}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            {t('talk:leaveChannel')}
          </button>
        </div>
      )}
    </div>
    </>
  );
}
