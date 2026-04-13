import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface TodoDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TodoDeleteConfirmModal({ isOpen, onClose, onConfirm }: TodoDeleteConfirmModalProps) {
  const { t } = useTranslation(['todos', 'common']);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('todos:deleteConfirm.title')}</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600">{t('todos:deleteConfirm.message')}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:close')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {t('todos:deleteConfirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
