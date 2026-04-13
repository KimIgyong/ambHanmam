import { useState } from 'react';
import { Plus, Loader2, Users, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CellResponse } from '@amb/types';
import { useCellList } from '../hooks/useCells';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import CellFormModal from './CellFormModal';
import CellDeleteConfirmModal from './CellDeleteConfirmModal';
import CellMembersModal from './CellMembersModal';

export default function CellListTab() {
  const { data: cells, isLoading } = useCellList();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CellResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CellResponse | null>(null);
  const [membersTarget, setMembersTarget] = useState<CellResponse | null>(null);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const { t } = useTranslation('members');

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (cell: CellResponse) => {
    setEditTarget(cell);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('cellList.createCell')}
          </button>
        </div>
      )}

      {!cells || cells.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">
            {t('cellList.noCells')}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {t('cellList.noCellsDesc')}
          </p>
          {isAdmin && (
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('cellList.addFirstCell')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cells.map((cell) => {
            const displayMembers = (cell.members || []).slice(0, 5);
            const remainingCount = (cell.members || []).length - displayMembers.length;
            return (
              <div
                key={cell.cellId}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{cell.name}</h3>
                      {cell.entityName && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {cell.entityName}
                        </span>
                      )}
                    </div>
                    {cell.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {cell.description}
                      </p>
                    )}
                    {displayMembers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {displayMembers.map((m) => (
                          <span
                            key={m.userId}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {m.name}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                            +{remainingCount}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {t('cellList.memberCount', { count: cell.memberCount })}
                    </p>
                  </div>
                  <div className="ml-2 flex gap-1">
                    <button
                      onClick={() => setMembersTarget(cell)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={t('cellList.viewMembers')}
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(cell)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cell)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CellFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        editTarget={editTarget}
      />
      <CellDeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        cell={deleteTarget}
      />
      <CellMembersModal
        isOpen={!!membersTarget}
        onClose={() => setMembersTarget(null)}
        cell={membersTarget}
      />
    </>
  );
}
