import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTalkStore } from '../store/talk.store';

export default function ReplyPreview() {
  const { t } = useTranslation(['talk']);
  const replyTo = useTalkStore((s) => s.replyTo);
  const setReplyTo = useTalkStore((s) => s.setReplyTo);

  if (!replyTo) return null;

  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border-l-2 border-indigo-400 bg-indigo-50 px-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-indigo-600">
          {t('talk:replyTo', { name: replyTo.senderName })}
        </p>
        <p className="truncate text-xs text-gray-500">{replyTo.content}</p>
      </div>
      <button
        onClick={() => setReplyTo(null)}
        className="shrink-0 text-gray-400 hover:text-gray-600"
        aria-label={t('talk:cancelReply')}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
