import { useTranslation } from 'react-i18next';
import { TalkMessageResponse } from '@amb/types';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { formatDateTimeInTz } from '@/lib/format-utils';

interface TranslationMessageProps {
  msg: TalkMessageResponse;
  allMessages: TalkMessageResponse[];
}

export default function TranslationMessage({ msg, allMessages }: TranslationMessageProps) {
  const { t } = useTranslation(['talk']);
  const { timezone } = useTimezoneStore();

  // Find the original message by parentId
  const originalMsg = msg.parentId
    ? allMessages.find((m) => m.id === msg.parentId)
    : null;

  const originalSenderName = originalMsg?.senderName || t('talk:unknownUser');
  const translatorName = msg.senderName;

  const formatTime = (dateStr: string) => {
    return formatDateTimeInTz(dateStr, timezone, 'HH:mm');
  };

  // Parse content: the content format is "🌐 owner → translator (src → tgt)\n─────\ntranslated text"
  const lines = msg.content.split('\n');
  const separatorIdx = lines.findIndex((l) => l.startsWith('─'));
  const translatedText = separatorIdx >= 0
    ? lines.slice(separatorIdx + 1).join('\n')
    : lines.slice(1).join('\n');

  return (
    <div className="mb-1 flex items-start gap-2">
      <div className="max-w-[80%]">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2">
          {/* Header */}
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-indigo-500">
            <span>
              {t('talk:translatedByUser', {
                sender: originalSenderName,
                translator: translatorName,
              })}
            </span>
          </div>

          {/* Separator */}
          <div className="mb-1 border-t border-indigo-100" />

          {/* Translated content */}
          <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
            {translatedText}
          </p>

          {/* Time */}
          <div className="mt-1 text-right">
            <span className="text-[10px] text-gray-300">{formatTime(msg.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
