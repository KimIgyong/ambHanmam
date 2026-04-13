import { useTranslation } from 'react-i18next';

interface NoticeDeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function NoticeDeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: NoticeDeleteConfirmModalProps) {
  const { t } = useTranslation(['notices', 'common']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('notices:deleteConfirm.title')}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {t('notices:deleteConfirm.message')}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t('common:close')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {t('notices:deleteConfirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
