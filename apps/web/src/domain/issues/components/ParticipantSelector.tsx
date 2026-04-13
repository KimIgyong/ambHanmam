import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Users } from 'lucide-react';
import { useMemberList } from '@/domain/members/hooks/useMembers';

interface ParticipantSelectorProps {
  value: string[];
  onChange: (userIds: string[]) => void;
  excludeUserId?: string | null;
}

export default function ParticipantSelector({ value, onChange, excludeUserId }: ParticipantSelectorProps) {
  const { t } = useTranslation(['issues']);
  const { data: members = [] } = useMemberList();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMembers = useMemo(
    () => members.filter((m) => value.includes(m.userId)),
    [members, value],
  );

  const filtered = useMemo(() => {
    let list = members.filter((m) => !value.includes(m.userId));
    if (excludeUserId) {
      list = list.filter((m) => m.userId !== excludeUserId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.unit || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [members, value, search, excludeUserId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (userId: string) => {
    onChange([...value, userId]);
    setSearch('');
  };

  const handleRemove = (userId: string) => {
    onChange(value.filter((id) => id !== userId));
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex w-full min-h-[38px] cursor-pointer flex-wrap items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm hover:border-indigo-400 focus-within:border-indigo-500"
      >
        {selectedMembers.length > 0 ? (
          selectedMembers.map((m) => (
            <span
              key={m.userId}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
            >
              {m.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(m.userId);
                }}
                className="rounded-full p-0.5 hover:bg-indigo-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="flex items-center gap-1.5 px-1 text-gray-400">
            <Users className="h-4 w-4" />
            {t('issues:participant.select')}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('issues:participant.searchPlaceholder')}
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((member) => (
              <li key={member.userId}>
                <button
                  type="button"
                  onClick={() => handleAdd(member.userId)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-700"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {member.unit}{member.email ? ` · ${member.email}` : ''}
                    </div>
                  </div>
                </button>
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-gray-400">
                {t('issues:participant.noResults')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
