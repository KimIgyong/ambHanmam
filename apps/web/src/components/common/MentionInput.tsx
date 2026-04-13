import { useState, useRef, useEffect, useCallback } from 'react';
import { useMemberList } from '../../domain/members/hooks/useMembers';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
  rows?: number;
}

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  className = '',
  maxLength,
  disabled,
  rows,
}: MentionInputProps) {
  const { data: members } = useMemberList();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredMembers = (members || []).filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      const cursorPos = e.target.selectionStart || 0;
      const textBeforeCursor = newValue.slice(0, cursorPos);

      // @ 뒤의 텍스트 추출 (공백 없이 연속된 문자)
      const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);
      if (atMatch) {
        setShowDropdown(true);
        setMentionQuery(atMatch[1]);
        setMentionStart(cursorPos - atMatch[1].length - 1);
        setSelectedIndex(0);
      } else {
        setShowDropdown(false);
        setMentionQuery('');
        setMentionStart(-1);
      }
    },
    [onChange],
  );

  const selectMember = useCallback(
    (memberName: string) => {
      if (mentionStart < 0) return;

      const before = value.slice(0, mentionStart);
      const cursorPos = inputRef.current?.selectionStart || value.length;
      const after = value.slice(cursorPos);
      const newValue = `${before}@${memberName} ${after}`;

      onChange(newValue);
      setShowDropdown(false);
      setMentionQuery('');
      setMentionStart(-1);

      // 커서를 멘션 뒤로 이동
      requestAnimationFrame(() => {
        const pos = before.length + memberName.length + 2; // @name + space
        const el = inputRef.current as HTMLInputElement | HTMLTextAreaElement;
        el?.setSelectionRange(pos, pos);
        el?.focus();
      });
    },
    [value, mentionStart, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (showDropdown && filteredMembers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredMembers.length - 1 ? prev + 1 : 0,
          );
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredMembers.length - 1,
          );
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          selectMember(filteredMembers[selectedIndex].name);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDropdown(false);
          return;
        }
      }

      // textarea: Ctrl+Enter 또는 Cmd+Enter로 제출 / input: Enter로 제출
      if (e.key === 'Enter' && !showDropdown && onSubmit) {
        if (rows) {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSubmit();
          }
        } else {
          e.preventDefault();
          onSubmit();
        }
      }
    },
    [showDropdown, filteredMembers, selectedIndex, selectMember, onSubmit],
  );

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 선택 항목이 스크롤 영역에 보이도록
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selectedEl = dropdownRef.current.children[selectedIndex] as HTMLElement;
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showDropdown]);

  return (
    <div className="relative flex-1">
      {rows ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          maxLength={maxLength}
          disabled={disabled}
        />
      )}

      {showDropdown && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filteredMembers.map((member, idx) => (
            <button
              key={member.userId}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                idx === selectedIndex
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectMember(member.name);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                {member.name.charAt(0)}
              </span>
              <span>{member.name}</span>
              {member.unit && (
                <span className="text-xs text-gray-400">{member.unit}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
