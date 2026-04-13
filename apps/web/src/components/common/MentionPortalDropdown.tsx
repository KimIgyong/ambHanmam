import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MemberResponse } from '@amb/types';

interface MentionPortalDropdownProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  members: MemberResponse[];
  selectedIndex: number;
  onSelect: (name: string) => void;
  onIndexChange: (index: number) => void;
}

export default function MentionPortalDropdown({
  anchorRef,
  members,
  selectedIndex,
  onSelect,
  onIndexChange,
}: MentionPortalDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; flip: boolean }>({
    top: 0,
    left: 0,
    width: 280,
    flip: false,
  });

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const dropdownHeight = 240; // max-h-60 = 240px
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const flip = spaceBelow < dropdownHeight + gap && rect.top > spaceBelow;

    setPos({
      top: flip ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: Math.max(280, rect.width),
      flip,
    });
  }, [anchorRef]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current) {
      const el = dropdownRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.flip ? undefined : pos.top,
        bottom: pos.flip ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
      }}
      className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
    >
      {members.map((member, idx) => (
        <button
          key={member.userId}
          type="button"
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-indigo-50 ${
            idx === selectedIndex ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(member.name);
          }}
          onMouseEnter={() => onIndexChange(idx)}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
            {member.name.charAt(0)}
          </span>
          <span className="truncate font-medium">{member.name}</span>
          {member.unit && (
            <span className="ml-auto shrink-0 text-xs text-gray-400">{member.unit}</span>
          )}
        </button>
      ))}
    </div>,
    document.body,
  );
}
