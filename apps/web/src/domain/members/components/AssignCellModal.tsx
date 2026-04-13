import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useCellList, useAddCellMember } from '../hooks/useCells';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  existingCellIds: string[];
  onSuccess?: () => void;
}

export default function AssignCellModal({
  isOpen,
  onClose,
  memberId,
  existingCellIds,
  onSuccess,
}: Props) {
  const { t } = useTranslation(['members', 'common']);
  const { data: cells, isLoading } = useCellList();
  const addCellMember = useAddCellMember();
  const [selectedCellId, setSelectedCellId] = useState('');

  if (!isOpen) return null;

  const availableCells = (cells || []).filter(
    (g) => !existingCellIds.includes(g.cellId),
  );

  const handleSubmit = async () => {
    if (!selectedCellId) return;
    await addCellMember.mutateAsync({ cellId: selectedCellId, userId: memberId });
    setSelectedCellId('');
    onClose();
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t('members:memberDetail.addCell')}
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : availableCells.length === 0 ? (
          <p className="py-4 text-sm text-gray-400">
            {t('members:memberDetail.noAvailableCells')}
          </p>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedCellId}
              onChange={(e) => setSelectedCellId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">{t('members:memberDetail.selectCell')}</option>
              {availableCells.map((g) => (
                <option key={g.cellId} value={g.cellId}>
                  {g.name}
                  {g.entityName ? ` (${g.entityName})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCellId || addCellMember.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('members:memberDetail.addCell')}
          </button>
        </div>
      </div>
    </div>
  );
}
