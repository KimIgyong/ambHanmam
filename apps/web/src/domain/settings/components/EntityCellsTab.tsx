import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Check, X, Loader2, Users } from 'lucide-react';
import { CellResponse } from '@amb/types';
import {
  useCellList,
  useCreateCell,
  useUpdateCell,
  useDeleteCell,
} from '@/domain/members/hooks/useCells';

interface Props {
  entityId: string;
  entityCode?: string;
}

export default function EntityCellsTab({ entityId }: Props) {
  const { t } = useTranslation(['settings', 'common']);
  const { data: allCells, isLoading } = useCellList();
  const createMutation = useCreateCell();
  const updateMutation = useUpdateCell();
  const deleteMutation = useDeleteCell();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Filter cells for this entity
  const cells = (allCells || []).filter(
    (g: CellResponse) => g.entityId === entityId,
  );

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleEdit = (cell: CellResponse) => {
    setEditingId(cell.cellId);
    setIsAdding(false);
    setName(cell.name);
    setDescription(cell.description || '');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (isAdding) {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          entity_id: entityId,
        });
      } else if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
          },
        });
      }
      handleCancel();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('settings:entities.deleteCellConfirm', { defaultValue: '이 셀을 삭제하시겠습니까?' }))) return;
    await deleteMutation.mutateAsync(id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          {t('settings:entities.cells', { defaultValue: '셀 관리' })}
          <span className="ml-2 text-xs font-normal text-gray-400">({cells.length})</span>
        </h4>
        {!isAdding && !editingId && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('settings:entities.addCell', { defaultValue: '셀 추가' })}
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50/50 p-3">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings:entities.cellName', { defaultValue: '셀명' })}
              className={inputClass}
              autoFocus
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('settings:entities.cellDescription', { defaultValue: '설명 (선택)' })}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-1 pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="rounded-md p-1.5 text-teal-600 hover:bg-teal-100 disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              onClick={handleCancel}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cell list */}
      {cells.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
          {t('settings:entities.noCells', { defaultValue: '등록된 셀이 없습니다.' })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {cells.map((cell: CellResponse) => (
            <div
              key={cell.cellId}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 hover:border-gray-200 transition-colors"
            >
              {editingId === cell.cellId ? (
                <div className="flex flex-1 items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('settings:entities.cellDescription', { defaultValue: '설명 (선택)' })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !name.trim()}
                      className="rounded-md p-1.5 text-teal-600 hover:bg-teal-100 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{cell.name}</span>
                      <span className="flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        {cell.memberCount}
                      </span>
                    </div>
                    {cell.description && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">{cell.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(cell)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cell.cellId)}
                      disabled={deleteMutation.isPending}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
