import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Lock, Unlock } from 'lucide-react';
import { useTranslation as useTranslationQuery, useUpdateTranslation, useLockTranslation, useUnlockTranslation } from '../hooks/useTranslations';

interface TranslationEditModalProps {
  sourceType: string;
  sourceId: string;
  targetLang: string;
  onClose: () => void;
}

export default function TranslationEditModal({
  sourceType, sourceId, targetLang, onClose,
}: TranslationEditModalProps) {
  const { t } = useTranslation('translation');
  const { data: translations } = useTranslationQuery(sourceType, sourceId, targetLang);
  const updateMutation = useUpdateTranslation();
  const lockMutation = useLockTranslation();
  const unlockMutation = useUnlockTranslation();

  const [contents, setContents] = useState<Record<string, string>>({});
  const [changeReason, setChangeReason] = useState('');
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (translations && Array.isArray(translations)) {
      const map: Record<string, string> = {};
      const locked = new Set<string>();
      for (const tr of translations as any[]) {
        map[tr.sourceField] = tr.content;
        if (tr.isLocked) locked.add(tr.id);
      }
      setContents(map);
      setLockedIds(locked);
    }
  }, [translations]);

  const isLocked = lockedIds.size > 0;

  const handleToggleLock = async () => {
    if (!translations || !Array.isArray(translations)) return;
    for (const tr of translations as any[]) {
      if (isLocked) {
        await unlockMutation.mutateAsync(tr.id);
      } else {
        await lockMutation.mutateAsync(tr.id);
      }
    }
    // Update local state
    if (isLocked) {
      setLockedIds(new Set());
    } else {
      setLockedIds(new Set((translations as any[]).map((tr) => tr.id)));
    }
  };

  const handleSave = async () => {
    if (!translations || !Array.isArray(translations)) return;
    for (const tr of translations as any[]) {
      if (contents[tr.sourceField] && contents[tr.sourceField] !== tr.content) {
        await updateMutation.mutateAsync({
          trnId: tr.id,
          dto: { content: contents[tr.sourceField], change_reason: changeReason || undefined },
        });
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('edit.title')}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLock}
              disabled={lockMutation.isPending || unlockMutation.isPending}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                isLocked
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={isLocked ? t('edit.unlock') : t('edit.lock')}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {isLocked ? t('edit.locked') : t('edit.unlocked')}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-4">
          {isLocked && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <Lock className="h-4 w-4 shrink-0" />
              {t('edit.lockedWarning')}
            </div>
          )}
          {Object.entries(contents).map(([field, content]) => (
            <div key={field}>
              <label className="mb-1 block text-xs font-medium uppercase text-gray-500">{field}</label>
              <textarea
                value={content}
                onChange={(e) => setContents({ ...contents, [field]: e.target.value })}
                rows={field === 'title' ? 2 : 6}
                disabled={isLocked}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('edit.changeReason')}</label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder={t('edit.changeReasonPlaceholder')}
              disabled={isLocked}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {t('edit.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLocked}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('edit.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
