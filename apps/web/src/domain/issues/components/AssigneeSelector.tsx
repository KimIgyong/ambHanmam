import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, User } from 'lucide-react';
import { useMemberList } from '@/domain/members/hooks/useMembers';

interface AssigneeSelectorProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  placeholder?: string;
}

export default function AssigneeSelector({ value, onChange, placeholder }: AssigneeSelectorProps) {
  const { t } = useTranslation(['issues']);
  const { data: members = [] } = useMemberList();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMember = useMemo(
    () => members.find((m) => m.userId === value) || null,
    [members, value],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.unit || '').toLowerCase().includes(q),
    );
  }, [members, search]);

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

  const handleSelect = (userId: string | null) => {
    onChange(userId);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected display / trigger */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:border-indigo-400 focus-within:border-indigo-500"
      >
        {selectedMember ? (
          <>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
              {selectedMember.name.charAt(0)}
            </div>
            <span className="flex-1 truncate text-gray-900">{selectedMember.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <User className="h-4 w-4 text-gray-400" />
            <span className="flex-1 text-gray-400">
              {placeholder || t('issues:assignee.select')}
            </span>
          </>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('issues:assignee.searchPlaceholder')}
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            {/* Unassigned option */}
            <li>
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  value === null ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'
                }`}
              >
                <User className="h-4 w-4 text-gray-400" />
                {t('issues:assignee.unassigned')}
              </button>
            </li>

            {filtered.map((member) => (
              <li key={member.userId}>
                <button
                  type="button"
                  onClick={() => handleSelect(member.userId)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    value === member.userId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                  }`}
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
                {t('issues:assignee.noResults', '검색 결과가 없습니다')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
