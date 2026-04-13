import { useState, useRef, useEffect, useMemo } from 'react';

interface AutosuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function AutosuggestInput({
  value,
  onChange,
  suggestions,
  placeholder = '',
  disabled = false,
  className = '',
}: AutosuggestInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value || value.length < 1) return [];
    const q = value.toLowerCase();
    return suggestions
      .filter((s) => s.toLowerCase().includes(q) && s !== value)
      .slice(0, 10);
  }, [suggestions, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isFocused && filtered.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
      />
      {showDropdown && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(suggestion);
                  setIsFocused(false);
                }}
                className="flex w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-orange-50"
              >
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
