import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface PublishConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isPublishing?: boolean;
}

export default function PublishConfirmModal({
  open,
  onClose,
  onConfirm,
  isPublishing,
}: PublishConfirmModalProps) {
  const { t } = useTranslation(['site', 'common']);
  const [note, setNote] = useState('');

  // Reset note when modal opens
  useEffect(() => {
    if (open) {
      setNote('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(note.trim());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('site:page.publishConfirm')}
          </h2>
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('site:page.publishNote')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPublishing}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPublishing ? '...' : t('site:page.publish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
