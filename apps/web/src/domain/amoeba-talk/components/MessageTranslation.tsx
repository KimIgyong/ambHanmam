import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useTalkStore } from '../store/talk.store';

interface MessageTranslationProps {
  messageId: string;
  isOwn: boolean;
}

export default function MessageTranslation({ messageId, isOwn }: MessageTranslationProps) {
  const { t } = useTranslation(['talk']);
  const translations = useTalkStore((s) => s.translations[messageId]);
  const clearTranslation = useTalkStore((s) => s.clearTranslation);

  if (!translations) return null;

  const entries = Object.entries(translations);
  if (entries.length === 0) return null;

  return (
    <>
      {entries.map(([lang, entry]) => (
        <div
          key={lang}
          className={`mt-1 max-w-[80%] rounded-md px-3 py-1.5 ${
            isOwn ? 'ml-auto bg-indigo-50' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-gray-400">
              {t('talk:translatedTo', { lang })}
            </span>
            <button
              onClick={() => clearTranslation(messageId, lang)}
              className="text-gray-300 hover:text-gray-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="whitespace-pre-wrap break-words text-xs text-gray-600">{entry.content}</p>
        </div>
      ))}
    </>
  );
}
