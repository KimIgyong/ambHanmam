import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, Tag, FileText, CheckSquare, Folder, AlertCircle, BookOpen, Bell, Users, Briefcase, Filter } from 'lucide-react';
import { useSearchResults, useSearchTags } from '../hooks/useSearch';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const MODULE_ICONS: Record<string, typeof FileText> = {
  todo: CheckSquare,
  issue: AlertCircle,
  billing: FileText,
  drive: Folder,
  'meeting-notes': BookOpen,
  notice: Bell,
  partner: Users,
  client: Briefcase,
  project: Folder,
};

const MODULE_LABELS: Record<string, string> = {
  todo: 'Todo',
  issue: 'Issue',
  billing: 'Billing',
  drive: 'Drive',
  'meeting-notes': 'Notes',
  notice: 'Notice',
  partner: 'Partner',
  client: 'Client',
  project: 'Project',
};

const MODULE_ROUTES: Record<string, string> = {
  todo: '/todos',
  issue: '/issues',
  billing: '/billing/contracts',
  drive: '/drive',
  'meeting-notes': '/meeting-notes',
  notice: '/notices',
  partner: '/billing/partners',
  client: '/service/clients',
  project: '/project/projects',
};

// refId가 있을 때 개별 콘텐츠 상세 페이지로 바로가기 경로 생성
const getDetailRoute = (module: string, refId: string | null): string => {
  if (!refId) return MODULE_ROUTES[module] || '/';

  // 모달 기반 모듈: 쿼리 파라미터로 전달
  if (module === 'todo') return `/todos?id=${refId}`;
  if (module === 'issue') return `/issues?id=${refId}`;

  // 라우트 기반 모듈: 상세 페이지로 직접 이동
  const detailRoutes: Record<string, string> = {
    billing: `/billing/contracts/${refId}`,
    'meeting-notes': `/meeting-notes/${refId}`,
    notice: `/notices/${refId}`,
    partner: `/billing/partners/${refId}`,
    client: `/service/clients/${refId}`,
    project: `/project/projects/${refId}`,
  };

  return detailRoutes[module] || MODULE_ROUTES[module] || '/';
};

export default function GlobalSearchBar() {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [showModuleFilter, setShowModuleFilter] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // debouncedQuery is handled by useDebounce hook

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: searchData, isLoading } = useSearchResults({
    q: debouncedQuery,
    modules: selectedModules.length > 0 ? selectedModules : undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    limit: 8,
    enabled: isOpen,
  });

  const { data: tagSuggestions = [] } = useSearchTags(debouncedQuery, isOpen && debouncedQuery.length >= 1);

  const handleTagToggle = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName],
    );
  }, []);

  const handleModuleToggle = useCallback((module: string) => {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module],
    );
  }, []);

  const handleResultClick = (module: string, refId: string | null) => {
    const route = getDetailRoute(module, refId);
    navigate(route);
    setIsOpen(false);
    setQuery('');
  };

  const results = searchData?.results || [];
  const relatedTags = searchData?.relatedTags || [];
  const showDropdown = isOpen && (debouncedQuery.length > 0 || selectedTags.length > 0 || selectedModules.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={`${t('common:search', 'Search')}... (⌘K)`}
          className="w-48 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 lg:w-64"
        />
        {query && (
          <button onClick={() => { setQuery(''); setSelectedTags([]); setSelectedModules([]); }} className="text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => { setIsOpen(true); setShowModuleFilter((v) => !v); }}
          className={`shrink-0 rounded p-0.5 transition-colors ${
            selectedModules.length > 0
              ? 'text-indigo-600 bg-indigo-50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title={t('common:filterByModule', 'Filter by module')}
        >
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Selected tags & modules */}
      {(selectedTags.length > 0 || selectedModules.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-0.5 flex flex-wrap gap-1 px-1">
          {selectedModules.map((mod) => (
            <span
              key={`mod-${mod}`}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
              onClick={() => handleModuleToggle(mod)}
            >
              {MODULE_LABELS[mod] || mod} <X className="h-3 w-3" />
            </span>
          ))}
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700"
              onClick={() => handleTagToggle(tag)}
            >
              <Tag className="h-3 w-3" /> {tag} <X className="h-3 w-3" />
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl md:w-auto md:min-w-[360px]"
        >
          {/* Module filter */}
          {showModuleFilter && (
            <div className="border-b border-gray-100 px-3 py-2">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                {t('common:modules', 'Modules')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(MODULE_LABELS).map(([key, label]) => {
                  const Icon = MODULE_ICONS[key] || FileText;
                  return (
                    <button
                      key={key}
                      onClick={() => handleModuleToggle(key)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                        selectedModules.includes(key)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tag suggestions */}
          {tagSuggestions.length > 0 && (
            <div className="border-b border-gray-100 px-3 py-2">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {tagSuggestions.slice(0, 6).map((tag) => (
                  <button
                    key={tag.tagId}
                    onClick={() => handleTagToggle(tag.name)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                      selectedTags.includes(tag.name)
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {tag.display || tag.name}
                    <span className="text-gray-400">({tag.usageCount})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {t('common:loading', 'Loading...')}
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result) => {
                const Icon = MODULE_ICONS[result.module] || FileText;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result.module, result.refId)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">{result.title}</div>
                      {result.snippet && (
                        <div className="mt-0.5 truncate text-xs text-gray-500">{result.snippet}</div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          {MODULE_LABELS[result.module] || result.module}
                        </span>
                        {result.tags.slice(0, 3).map((tag) => (
                          <span key={tag.tagId} className="text-xs text-indigo-500">
                            #{tag.display || tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="mt-0.5 shrink-0 text-xs text-gray-400">
                      {<LocalDateTime value={result.createdAt} format='YYYY-MM-DD HH:mm' />}
                    </span>
                  </button>
                );
              })}
              {searchData && searchData.totalCount > results.length && (
                <div className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400">
                  +{searchData.totalCount - results.length} more results
                </div>
              )}
            </div>
          ) : debouncedQuery.length > 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              {t('common:noResults', 'No results found')}
            </div>
          ) : null}

          {/* Related tags */}
          {relatedTags.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Related</div>
              <div className="flex flex-wrap gap-1">
                {relatedTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag.tagId}
                    onClick={() => handleTagToggle(tag.name)}
                    className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                  >
                    {tag.display}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
