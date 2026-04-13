import { useTranslation as useI18nTranslation } from 'react-i18next';
import { X, Clock } from 'lucide-react';
import { useTranslation as useTranslationQuery } from '../hooks/useTranslations';
import { useTranslationHistory } from '../hooks/useTranslations';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface TranslationHistoryModalProps {
  sourceType: string;
  sourceId: string;
  targetLang: string;
  onClose: () => void;
}

export default function TranslationHistoryModal({
  sourceType, sourceId, targetLang, onClose,
}: TranslationHistoryModalProps) {
  const { t } = useI18nTranslation('translation');
  const { data: translations } = useTranslationQuery(sourceType, sourceId, targetLang);

  // Get trnId from the first translation
  const trnId = (translations as any[])?.[0]?.id || '';
  const { data: history } = useTranslationHistory(trnId, !!trnId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('history.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto px-6 py-4">
          {(!history || (history as any[]).length === 0) ? (
            <p className="text-center text-sm text-gray-500 py-8">{t('history.noHistory')}</p>
          ) : (
            <div className="space-y-4">
              {(history as any[]).map((entry: any) => (
                <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('history.version', { version: entry.version })}
                    </div>
                    <span>{<LocalDateTime value={entry.createdAt} format='YYYY-MM-DD HH:mm' />}</span>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {entry.content.length > 200 ? `${entry.content.slice(0, 200)}...` : entry.content}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>{t('history.editedBy')}: {entry.editedBy?.name || '-'}</span>
                    {entry.changeReason && (
                      <span>{t('history.reason')}: {entry.changeReason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {t('edit.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
