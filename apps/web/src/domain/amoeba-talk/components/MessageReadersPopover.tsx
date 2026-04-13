import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, EyeOff } from 'lucide-react';
import { useMessageReaders } from '../hooks/useTalk';
import dayjs from 'dayjs';

interface MessageReadersPopoverProps {
  channelId: string;
  messageId: string;
  onClose: () => void;
}

export default function MessageReadersPopover({
  channelId,
  messageId,
  onClose,
}: MessageReadersPopoverProps) {
  const { t } = useTranslation(['talk']);
  const { data, isLoading } = useMessageReaders(channelId, messageId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 z-30 mb-1 w-56 rounded-lg border bg-white shadow-lg"
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-gray-700">
          {t('talk:deliveryStatusRead')}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="px-3 py-4 text-center text-xs text-gray-400">Loading...</div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {/* Readers */}
          {data && data.readers.length > 0 && (
            <div className="px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase text-gray-400">
                <Eye className="h-3 w-3" />
                {t('talk:readers', 'Read')} ({data.readers.length})
              </div>
              {data.readers.map((r) => (
                <div key={r.userId} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] font-medium text-green-700">
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-700">{r.userName}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {dayjs(r.readAt).format('HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Non-readers */}
          {data && data.nonReaders.length > 0 && (
            <div className="border-t px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase text-gray-400">
                <EyeOff className="h-3 w-3" />
                {t('talk:nonReaders', 'Unread')} ({data.nonReaders.length})
              </div>
              {data.nonReaders.map((r) => (
                <div key={r.userId} className="flex items-center gap-2 py-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                    {r.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-400">{r.userName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
