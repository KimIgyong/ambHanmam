import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { DriveFolderRegistration } from '@amb/types';

interface UnregisterConfirmModalProps {
  folder: DriveFolderRegistration;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
}

export default function UnregisterConfirmModal({
  folder,
  onConfirm,
  onClose,
  isDeleting,
}: UnregisterConfirmModalProps) {
  const { t } = useTranslation(['drive', 'common']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('drive:unregisterConfirm.title')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600">
            {t('drive:unregisterConfirm.message')}
          </p>
          <p className="mt-2 text-sm font-medium text-gray-900">{folder.folderName}</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:close')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? t('common:processing') : t('drive:unregisterConfirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
