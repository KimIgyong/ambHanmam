import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface IssueDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onPermanentDelete?: () => void;
  canSoftDelete: boolean;
  canPermanentDelete: boolean;
}

export default function IssueDeleteConfirmModal({ isOpen, onClose, onConfirm, onPermanentDelete, canSoftDelete, canPermanentDelete }: IssueDeleteConfirmModalProps) {
  const { t } = useTranslation(['issues', 'common']);
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setShowPermanentConfirm(false);
    onClose();
  };

  if (showPermanentConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
          <h3 className="mb-2 text-lg font-semibold text-red-700">{t('issues:deleteConfirm.permanentTitle')}</h3>
          <p className="mb-4 text-sm text-gray-600">{t('issues:deleteConfirm.permanentMessage')}</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowPermanentConfirm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              {t('common:cancel')}
            </button>
            <button onClick={() => { setShowPermanentConfirm(false); onPermanentDelete?.(); }} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800">
              {t('issues:deleteConfirm.permanentConfirm')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('issues:deleteConfirm.title')}</h3>
        <p className="mb-4 text-sm text-gray-600">{t('issues:deleteConfirm.message')}</p>
        {!canSoftDelete && !canPermanentDelete && (
          <p className="mb-4 rounded-md bg-amber-50 p-3 text-xs text-amber-700">{t('issues:deleteConfirm.noPermission')}</p>
        )}
        <div className="flex justify-end gap-3">
          <button onClick={handleClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {t('common:cancel')}
          </button>
          {canPermanentDelete && (
            <button onClick={() => setShowPermanentConfirm(true)} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              {t('issues:deleteConfirm.permanentDelete')}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={!canSoftDelete && !canPermanentDelete}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${canSoftDelete || canPermanentDelete ? 'bg-red-600 hover:bg-red-700' : 'cursor-not-allowed bg-gray-400'}`}
          >
            {t('issues:deleteConfirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
