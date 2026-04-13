import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, MessageCircle } from 'lucide-react';
import { useEntityMembers, useStartDm } from '../hooks/useTalk';
import { useTalkStore } from '../store/talk.store';
import { useAuthStore } from '@/domain/auth/store/auth.store';

export default function NewDmModal() {
  const { t } = useTranslation(['talk']);
  const { setShowNewDmModal, setCurrentChannelId } = useTalkStore();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const { data: members, isLoading } = useEntityMembers();
  const startDm = useStartDm();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = search.toLowerCase();
    return members
      .filter((m) => m.userId !== currentUserId)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, search, currentUserId]);

  const handleSelect = (userId: string) => {
    startDm.mutate(userId, {
      onSuccess: (channel) => {
        if (channel) {
          setCurrentChannelId(channel.id);
        }
        setShowNewDmModal(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">{t('talk:newDm')}</h3>
          <button onClick={() => setShowNewDmModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b px-4 py-2">
          <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('talk:searchMembers')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              {t('talk:noMembersFound')}
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.userId}
                onClick={() => handleSelect(m.userId)}
                disabled={startDm.isPending}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{m.name}</p>
                  <p className="truncate text-xs text-gray-400">{m.email}</p>
                </div>
                <MessageCircle className="h-4 w-4 shrink-0 text-gray-300" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
