import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useSearchMessages } from '../hooks/useTalk';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { formatDateTimeInTz } from '@/lib/format-utils';

interface MessageSearchResultsProps {
  channelId: string;
  query: string;
}

function highlightText(text: string, query: string) {
  if (!query || query.length < 2) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function MessageSearchResults({ channelId, query }: MessageSearchResultsProps) {
  const { t } = useTranslation(['talk']);
  const { timezone } = useTimezoneStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useSearchMessages(channelId, query);

  const allResults = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const formatTime = (dateStr: string) =>
    formatDateTimeInTz(dateStr, timezone, 'YYYY-MM-DD HH:mm');

  if (query.length < 2) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Search className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">{t('talk:searchMinChars')}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (allResults.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Search className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">{t('talk:noSearchResults')}</p>
          <p className="mt-1 text-xs text-gray-300">{t('talk:noSearchResultsDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-2">
      <p className="mb-3 text-xs text-gray-400">
        {t('talk:searchResults', { count: totalCount })}
      </p>

      <div className="space-y-2">
        {allResults.map((msg) => (
          <div
            key={msg.id}
            className="rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">{msg.senderName}</span>
              <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
              {highlightText(msg.content, query)}
            </p>
          </div>
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
