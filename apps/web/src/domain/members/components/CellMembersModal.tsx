import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CellResponse } from '@amb/types';
import {
  useCellMembers,
  useAddCellMember,
  useRemoveCellMember,
} from '../hooks/useCells';
import { useMemberList } from '../hooks/useMembers';
import { useAuthStore } from '@/domain/auth/store/auth.store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cell: CellResponse | null;
}

export default function CellMembersModal({ isOpen, onClose, cell }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const { data: cellMembers, isLoading } = useCellMembers(cell?.cellId || '');
  const { data: allMembers } = useMemberList();
  const addMember = useAddCellMember();
  const removeMember = useRemoveCellMember();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const { t } = useTranslation(['members', 'common']);

  if (!isOpen || !cell) return null;

  const memberIds = new Set(cellMembers?.map((m) => m.userId) || []);
  const availableMembers =
    allMembers?.filter((m) => !memberIds.has(m.userId)) || [];

  const handleAdd = async () => {
    if (!selectedUserId) return;
    await addMember.mutateAsync({
      cellId: cell.cellId,
      userId: selectedUserId,
    });
    setSelectedUserId('');
    setAddOpen(false);
  };

  const handleRemove = async (userId: string) => {
    await removeMember.mutateAsync({
      cellId: cell.cellId,
      userId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('members:cellMembers.title', { name: cell.name })}
          </h3>
          {isAdmin && (
            <button
              onClick={() => setAddOpen(!addOpen)}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="h-4 w-4" />
              {t('members:cellMembers.addMember')}
            </button>
          )}
        </div>

        {addOpen && isAdmin && (
          <div className="mb-4 flex gap-2 rounded-lg bg-gray-50 p-3">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">
                {t('members:cellMembers.selectMember')}
              </option>
              {availableMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedUserId || addMember.isPending}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('members:cellMembers.addMember')}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : !cellMembers || cellMembers.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            {t('members:cellMembers.noMembers')}
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {cellMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {member.name}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">
                    {member.email}
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(member.userId)}
                    disabled={removeMember.isPending}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            {t('common:close')}
          </button>
        </div>
      </div>
    </div>
  );
}
