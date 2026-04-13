import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, FolderClosed, Plus, MoreHorizontal, Pencil, Trash2, Check, X, Inbox } from 'lucide-react';
import { MeetingNoteFolderResponse } from '@amb/types';
import { useCreateFolder, useUpdateFolder, useDeleteFolder } from '../hooks/useMeetingNotes';

interface NoteFolderSidebarProps {
  folders: MeetingNoteFolderResponse[];
  activeFolderId: string | null; // null = all, 'uncategorized' = no folder
  onFolderSelect: (folderId: string | null) => void;
  totalNoteCount: number;
}

export default function NoteFolderSidebar({ folders, activeFolderId, onFolderSelect, totalNoteCount }: NoteFolderSidebarProps) {
  const { t } = useTranslation(['meetingNotes', 'common']);
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    createFolder.mutate({ name: newFolderName.trim() }, {
      onSuccess: () => { setIsAdding(false); setNewFolderName(''); },
    });
  };

  const handleUpdate = (folderId: string) => {
    if (!editingName.trim()) return;
    updateFolder.mutate({ folderId, data: { name: editingName.trim() } }, {
      onSuccess: () => { setEditingId(null); setEditingName(''); },
    });
  };

  const handleDelete = (folderId: string) => {
    if (!confirm(t('meetingNotes:folder.deleteConfirm'))) return;
    deleteFolder.mutate(folderId, {
      onSuccess: () => {
        if (activeFolderId === folderId) onFolderSelect(null);
      },
    });
  };

  const uncategorizedCount = totalNoteCount - folders.reduce((sum, f) => sum + f.noteCount, 0);

  const pillBase = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors';
  const pillActive = 'border-indigo-200 bg-indigo-50 font-medium text-indigo-700';
  const pillInactive = 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('meetingNotes:folder.title')}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setIsAdding(true); setNewFolderName(''); }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {t('meetingNotes:folder.addFolder')}
          </button>
          <button
            onClick={() => { setIsAdding(true); setNewFolderName(''); }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('meetingNotes:folder.newFolder')}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* All */}
        <button
          onClick={() => onFolderSelect(null)}
          className={`${pillBase} ${activeFolderId === null ? pillActive : pillInactive}`}
        >
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          {t('meetingNotes:folder.all')}
          <span className="text-xs opacity-60">{totalNoteCount}</span>
        </button>

        {/* Uncategorized */}
        <button
          onClick={() => onFolderSelect('uncategorized')}
          className={`${pillBase} ${activeFolderId === 'uncategorized' ? pillActive : pillInactive}`}
        >
          <Inbox className="h-3.5 w-3.5 shrink-0" />
          {t('meetingNotes:folder.uncategorized')}
          <span className="text-xs opacity-60">{Math.max(0, uncategorizedCount)}</span>
        </button>

        {/* User folders */}
        {folders.map((folder) => (
          <div key={folder.folderId} className="group relative inline-flex">
            {editingId === folder.folderId ? (
              <div className="inline-flex items-center gap-1">
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdate(folder.folderId);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-28 rounded-full border border-indigo-300 px-3 py-1 text-sm focus:outline-none"
                />
                <button onClick={() => handleUpdate(folder.folderId)} className="rounded p-0.5 text-green-600 hover:bg-green-50">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="rounded p-0.5 text-gray-400 hover:bg-gray-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onFolderSelect(folder.folderId)}
                className={`${pillBase} ${activeFolderId === folder.folderId ? pillActive : pillInactive}`}
              >
                <FolderClosed
                  className="h-3.5 w-3.5 shrink-0"
                  style={folder.color ? { color: folder.color } : undefined}
                />
                {folder.name}
                <span className="text-xs opacity-60">{folder.noteCount}</span>

                {/* Context menu trigger */}
                <span
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === folder.folderId ? null : folder.folderId); }}
                  className="ml-0.5 hidden rounded p-0.5 text-gray-400 hover:bg-gray-200 group-hover:inline-flex"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </span>
              </button>
            )}

            {/* Dropdown menu */}
            {menuOpenId === folder.folderId && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => { setEditingId(folder.folderId); setEditingName(folder.name); setMenuOpenId(null); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('common:edit')}
                  </button>
                  <button
                    onClick={() => { handleDelete(folder.folderId); setMenuOpenId(null); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('common:delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* New folder inline input */}
        {isAdding && (
          <div className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder={t('meetingNotes:folder.namePlaceholder')}
              className="w-28 rounded-full border border-indigo-300 px-3 py-1 text-sm focus:outline-none"
            />
            <button onClick={handleCreate} className="rounded p-0.5 text-green-600 hover:bg-green-50">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setIsAdding(false)} className="rounded p-0.5 text-gray-400 hover:bg-gray-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
