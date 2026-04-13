import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTagAutocomplete } from '../hooks/useTags';
import TagBadge from './TagBadge';
import { KmsTagResponse } from '@amb/types';

interface TagInputProps {
  selectedTags: { tagId: string; name: string; display: string; level: number; color?: string | null }[];
  onAdd: (tag: KmsTagResponse) => void;
  onRemove: (tagId: string) => void;
  onCreateNew?: (name: string) => void;
  placeholder?: string;
}

export default function TagInput({ selectedTags, onAdd, onRemove, onCreateNew, placeholder }: TagInputProps) {
  const { t } = useTranslation('kms');
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useTagAutocomplete(inputValue, inputValue.length >= 1);

  const filteredSuggestions = suggestions.filter(
    (s) => !selectedTags.some((t) => t.tagId === s.tagId),
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tag: KmsTagResponse) => {
    onAdd(tag);
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        handleSelect(filteredSuggestions[0]);
      } else if (onCreateNew) {
        onCreateNew(inputValue.trim());
        setInputValue('');
        setShowDropdown(false);
      }
    }
    if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      onRemove(selectedTags[selectedTags.length - 1].tagId);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-gray-300 px-2 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.tagId}
            name={tag.name}
            display={tag.display}
            level={tag.level as 1 | 2 | 3}
            color={tag.color}
            onRemove={() => onRemove(tag.tagId)}
            size="sm"
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => inputValue && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? (placeholder || t('tag.autocomplete')) : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none"
        />
      </div>

      {showDropdown && (filteredSuggestions.length > 0 || (inputValue && onCreateNew)) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag.tagId}
              onClick={() => handleSelect(tag)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <TagBadge
                name={tag.name}
                display={tag.display}
                level={tag.level}
                color={tag.color}
                size="sm"
              />
              {tag.nameLocal && (
                <span className="text-xs text-gray-400">{tag.nameLocal}</span>
              )}
              <span className="ml-auto text-xs text-gray-400">
                {tag.usageCount}
              </span>
            </button>
          ))}
          {inputValue && onCreateNew && filteredSuggestions.length === 0 && (
            <button
              onClick={() => {
                onCreateNew(inputValue.trim());
                setInputValue('');
                setShowDropdown(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50"
            >
              + {t('tag.create')}: "{inputValue}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
