import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, MessageCircle } from 'lucide-react';
import { useEntityMembers, useStartDm } from '../hooks/useTalk';
import { usePresenceStatus } from '../hooks/usePresence';
import { useTalkStore } from '../store/talk.store';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import UserAvatar from '../components/UserAvatar';

export default function CrewPage() {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const user = useAuthStore((s) => s.user);
  const { data: members, isLoading } = useEntityMembers();
  const startDm = useStartDm();
  const presenceMap = useTalkStore((s) => s.presenceMap);

  // 본인 제외 멤버 목록
  const otherMembers = useMemo(
    () => (members || []).filter((m) => m.userId !== user?.userId),
    [members, user?.userId],
  );

  // presence 폴링용 userIds
  const userIds = useMemo(() => otherMembers.map((m) => m.userId), [otherMembers]);
  usePresenceStatus(userIds);

  // 검색 필터
  const filtered = useMemo(() => {
    if (!search.trim()) return otherMembers;
    const q = search.toLowerCase();
    return otherMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [otherMembers, search]);

  // 온라인 먼저 정렬
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
      if (channel) useTalkStore.getState().setCurrentChannelId(channel.id);
      navigate('/amoeba-talk');
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">
          {t('common:pwa.crew')}
        </h1>
        <p className="text-xs text-gray-500">
          {onlineCount} {t('common:pwa.crewOnline')}
        </p>
        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common:pwa.crewSearch')}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {search ? t('common:pwa.crewNoResult') : t('common:pwa.crewEmpty')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.map((member) => {
              const isOnline = presenceMap[member.userId] === 'online';
              return (
                <li key={member.userId}>
                  <button
                    onClick={() => handleDm(member.userId)}
                    disabled={startDm.isPending}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
                  >
                    {/* Avatar + Status */}
                    <div className="relative shrink-0">
                      <UserAvatar userId={member.userId} name={member.name} size={40} />
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                          isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-gray-900">
                          {member.name}
                        </span>
                        {isOnline && (
                          <span className="shrink-0 text-[10px] font-medium text-green-600">
                            online
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-500">{member.email}</p>
                    </div>

                    {/* DM Icon */}
                    <MessageCircle className="h-5 w-5 shrink-0 text-gray-400" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
