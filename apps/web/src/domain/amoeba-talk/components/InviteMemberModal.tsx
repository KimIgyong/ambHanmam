import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Users } from 'lucide-react';
import { useMemberList } from '@/domain/members/hooks/useMembers';
import { useAddMember, useClientMembers } from '../hooks/useTalk';
import { useTalkStore } from '../store/talk.store';
import { TalkChannelDetailResponse } from '@amb/types';

type TabType = 'internal' | 'client';

interface InviteMemberModalProps {
  channel: TalkChannelDetailResponse;
}

export default function InviteMemberModal({ channel }: InviteMemberModalProps) {
  const { t } = useTranslation(['talk', 'common']);
  const { setShowInviteModal } = useTalkStore();
  const { data: internalMembers = [], isLoading: internalLoading } = useMemberList();
  const { data: clientMembers = [], isLoading: clientLoading } = useClientMembers();
  const addMember = useAddMember();

  const [activeTab, setActiveTab] = useState<TabType>('internal');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [inviting, setInviting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const existingMemberIds = useMemo(
    () => new Set(channel.members.map((m) => m.userId)),
    [channel.members],
  );

  // 클라이언트 멤버를 내부 멤버와 동일한 형태로 정규화
  const normalizedClientMembers = useMemo(
    () => clientMembers.map((m) => ({ userId: m.userId, name: m.name, email: m.email, unit: (m as any).clientName || t('talk:clientLabel') })),
    [clientMembers, t],
  );

  const currentMembers = activeTab === 'internal' ? internalMembers : normalizedClientMembers;
  const isLoading = activeTab === 'internal' ? internalLoading : clientLoading;

  const selectedMembers = useMemo(
    () => {
      const allMembers = [...internalMembers, ...normalizedClientMembers];
      return allMembers.filter((m) => selectedIds.includes(m.userId));
    },
    [internalMembers, normalizedClientMembers, selectedIds],
  );

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return currentMembers.filter(
      (m) =>
        !existingMemberIds.has(m.userId) &&
        !selectedIds.includes(m.userId) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.unit || '').toLowerCase().includes(q)),
    );
  }, [currentMembers, existingMemberIds, selectedIds, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (userId: string) => {
    setSelectedIds((ids) => [...ids, userId]);
    setSearch('');
  };

  const handleRemove = (userId: string) => {
    setSelectedIds((ids) => ids.filter((id) => id !== userId));
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearch('');
    setShowDropdown(false);
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;
    setInviting(true);
    for (const userId of selectedIds) {
      await addMember.mutateAsync({ channelId: channel.id, userId }).catch(() => {});
    }
    setInviting(false);
    setShowInviteModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <Users className="h-4 w-4" />
            {t('talk:inviteMember')}
          </h3>
          <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          {/* Tab buttons */}
          <div className="mb-3 flex rounded-lg border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => handleTabChange('internal')}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'internal'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('talk:tabInternal')}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('client')}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'client'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('talk:tabClient')}
            </button>
          </div>

          {/* Selected chips */}
          {selectedMembers.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {selectedMembers.map((m) => (
                <span
                  key={m.userId}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                >
                  {m.name}
                  <button
                    type="button"
                    onClick={() => handleRemove(m.userId)}
                    className="rounded-full p-0.5 hover:bg-indigo-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input + dropdown */}
          <div ref={dropdownRef} className="relative">
            <div
              onClick={() => {
                setShowDropdown(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:border-indigo-400"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={t('talk:searchMembers')}
                className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>

            {showDropdown && (
              <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-gray-400">
                    {t('talk:noMembersFound')}
                  </div>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => handleSelect(m.userId)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900">{m.name}</div>
                        <div className="truncate text-xs text-gray-400">
                          {m.unit}{m.email ? ` · ${m.email}` : ''}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={() => setShowInviteModal(false)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel')}
          </button>
          <button
            type="button"
            onClick={handleInvite}
            disabled={selectedIds.length === 0 || inviting}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {inviting
              ? t('common:processing')
              : `${t('talk:inviteMember')} (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
