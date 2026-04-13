import { useTranslation } from 'react-i18next';
import { CellResponse } from '@amb/types';
import { useDeleteCell } from '../hooks/useCells';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cell: CellResponse | null;
}

export default function CellDeleteConfirmModal({
  isOpen,
  onClose,
  cell,
}: Props) {
  const deleteCell = useDeleteCell();
  const { t } = useTranslation(['members', 'common']);

  if (!isOpen || !cell) return null;

  const handleDelete = async () => {
    await deleteCell.mutateAsync(cell.cellId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {t('members:cellDelete.title')}
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          {t('members:cellDelete.message', { name: cell.name })}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteCell.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {t('members:cellDelete.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
