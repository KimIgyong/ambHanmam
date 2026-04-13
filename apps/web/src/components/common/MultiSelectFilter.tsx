import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectFilterProps {
  options: FilterOption[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  placeholder: string;
  selectAllLabel?: string;
  deselectAllLabel?: string;
}

export default function MultiSelectFilter({
  options,
  selected,
  onChange,
  placeholder,
  selectAllLabel = '전체 선택',
  deselectAllLabel = '전체 해제',
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const allSelected = options.every((o) => selected.has(o.value));

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      if (next.size > 1) next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      // 최소 1개 유지: 첫번째만 남김
      onChange(new Set([options[0].value]));
    } else {
      onChange(new Set(options.map((o) => o.value)));
    }
  };

  const selectedCount = selected.size;
  const label = selectedCount === options.length
    ? placeholder
    : `${placeholder} (${selectedCount})`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
          open
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : selectedCount < options.length
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={toggleAll}
            className="w-full px-3 py-1.5 text-left text-xs text-blue-600 hover:bg-blue-50"
          >
            {allSelected ? deselectAllLabel : selectAllLabel}
          </button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {opt.color && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                <span className="truncate">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
