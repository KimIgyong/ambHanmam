import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface TodoActionConfirmModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmColor?: 'indigo' | 'orange';
}

export default function TodoActionConfirmModal({ isOpen, message, onClose, onConfirm, confirmColor = 'indigo' }: TodoActionConfirmModalProps) {
  const { t } = useTranslation(['common']);

  if (!isOpen) return null;

  const colorClass = confirmColor === 'orange'
    ? 'bg-orange-600 hover:bg-orange-700'
    : 'bg-indigo-600 hover:bg-indigo-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('common:confirm')}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${colorClass}`}
          >
            {t('common:confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
