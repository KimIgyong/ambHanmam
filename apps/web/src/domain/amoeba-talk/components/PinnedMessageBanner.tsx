import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { usePinnedMessages, useToggleMessagePin } from '../hooks/useTalk';

interface PinnedMessageBannerProps {
  channelId: string;
  onScrollToMessage?: (messageId: string) => void;
}

export default function PinnedMessageBanner({ channelId, onScrollToMessage }: PinnedMessageBannerProps) {
  const { t } = useTranslation(['talk']);
  const { data: pinnedMessages } = usePinnedMessages(channelId);
  const togglePin = useToggleMessagePin();
  const [expanded, setExpanded] = useState(false);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const latestPinned = pinnedMessages[0];

  return (
    <div className="shrink-0 border-b border-amber-200 bg-amber-50">
      {/* 최신 핀 메시지 1줄 표시 */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <button
          onClick={() => onScrollToMessage?.(latestPinned.id)}
          className="min-w-0 flex-1 truncate text-left text-xs text-gray-700 hover:text-gray-900"
        >
          <span className="font-medium text-gray-500">{latestPinned.senderName}: </span>
          {latestPinned.content || t('talk:pinnedMessage')}
        </button>
        {pinnedMessages.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
            title={expanded ? 'Collapse' : `${pinnedMessages.length} pinned`}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
        <button
          onClick={() => togglePin.mutate({ channelId, messageId: latestPinned.id })}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-400"
          title={t('talk:unpinMessage')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 확장 시 전체 핀 목록 */}
      {expanded && pinnedMessages.length > 1 && (
        <div className="max-h-40 overflow-y-auto border-t border-amber-100">
          {pinnedMessages.slice(1).map((msg) => (
            <div key={msg.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-amber-100/50">
              <button
                onClick={() => onScrollToMessage?.(msg.id)}
                className="min-w-0 flex-1 truncate text-left text-xs text-gray-700"
              >
                <span className="font-medium text-gray-500">{msg.senderName}: </span>
                {msg.content || t('talk:pinnedMessage')}
              </button>
              <button
                onClick={() => togglePin.mutate({ channelId, messageId: msg.id })}
                className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-400"
                title={t('talk:unpinMessage')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
