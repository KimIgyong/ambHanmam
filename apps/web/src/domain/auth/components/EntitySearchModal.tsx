import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService, type EntitySearchItem } from '../service/auth.service';
import { getRecentEntities } from '../utils/recent-entities';

const FLAG: Record<string, string> = { KR: '\uD83C\uDDF0\uD83C\uDDF7', VN: '\uD83C\uDDFB\uD83C\uDDF3' };

interface EntitySearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (entity: EntitySearchItem) => void;
}

export default function EntitySearchModal({ open, onClose, onSelect }: EntitySearchModalProps) {
  const { t } = useTranslation('auth');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EntitySearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentEntities, setRecentEntities] = useState<EntitySearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setRecentEntities(getRecentEntities());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await authService.searchEntities(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelect = (entity: EntitySearchItem) => {
    onSelect(entity);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('entitySearch.title', { defaultValue: 'Find your organization' })}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={t('entitySearch.placeholder', { defaultValue: 'Search by company name or code' })}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-5 py-3">
          {/* Recent entities (shown when no search query) */}
          {query.length === 0 && recentEntities.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t('entitySearch.recent', { defaultValue: 'Recent' })}
              </p>
              <div className="space-y-1">
                {recentEntities.map((entity) => (
                  <button
                    key={entity.entityId}
                    onClick={() => handleSelect(entity)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className="text-lg">{FLAG[entity.country] || '\uD83C\uDFE2'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">{entity.name}</div>
                      <div className="text-xs text-gray-500">
                        {entity.code} · {entity.country}
                      </div>
                    </div>
                    <Building2 className="h-4 w-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.length > 0 && query.length < 2 && (
            <p className="py-6 text-center text-sm text-gray-400">
              {t('entitySearch.minChars', { defaultValue: 'Enter at least 2 characters to search' })}
            </p>
          )}

          {loading && (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              {t('entitySearch.noResults', { defaultValue: 'No organizations found' })}
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((entity) => (
                <button
                  key={entity.entityId}
                  onClick={() => handleSelect(entity)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="text-lg">{FLAG[entity.country] || '\uD83C\uDFE2'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{entity.name}</div>
                    <div className="text-xs text-gray-500">
                      {entity.code} · {entity.country}
                    </div>
                  </div>
                  <Building2 className="h-4 w-4 text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
