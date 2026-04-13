import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, FileText, StickyNote, Folder } from 'lucide-react';
import { meetingNoteService, FtsSearchResult } from '../service/meeting-note.service';

interface NoteSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NoteSearch({ isOpen, onClose }: NoteSearchProps) {
  const { t } = useTranslation(['meetingNotes', 'common']);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FtsSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTotalCount(0);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await meetingNoteService.fullTextSearch(query, undefined, 1, 15);
        setResults(res.data);
        setTotalCount(res.totalCount);
        setSelectedIdx(0);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIdx]) {
        e.preventDefault();
        navigate(`/meeting-notes/${results[selectedIdx].meetingNoteId}`);
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [results, selectedIdx, navigate, onClose],
  );

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  // Close on backdrop click
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('meetingNotes:search.placeholder')}
            className="flex-1 text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {isSearching && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {t('common:loading')}
            </div>
          )}
          {!isSearching && query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {t('meetingNotes:search.noResults')}
            </div>
          )}
          {results.map((item, idx) => {
            const TypeIcon = item.type === 'MEETING_NOTE' ? FileText : StickyNote;
            return (
              <button
                key={item.meetingNoteId}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                  idx === selectedIdx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  navigate(`/meeting-notes/${item.meetingNoteId}`);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIdx(idx)}
              >
                <TypeIcon className={`mt-0.5 h-4 w-4 shrink-0 ${
                  item.type === 'MEETING_NOTE' ? 'text-amber-500' : 'text-sky-500'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-800">{item.title}</span>
                    {item.folderName && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Folder className="h-3 w-3" />{item.folderName}
                      </span>
                    )}
                  </div>
                  {item.snippet && (
                    <p
                      className="mt-0.5 truncate text-xs text-gray-500 [&_mark]:bg-yellow-200 [&_mark]:text-yellow-900"
                      dangerouslySetInnerHTML={{ __html: item.snippet }}
                    />
                  )}
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{item.authorName}</span>
                    <span>{item.updatedAt?.split('T')[0]}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {totalCount > 15 && (
          <div className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400">
            {t('meetingNotes:search.moreResults', { count: totalCount - 15 })}
          </div>
        )}
      </div>
    </div>
  );
}
