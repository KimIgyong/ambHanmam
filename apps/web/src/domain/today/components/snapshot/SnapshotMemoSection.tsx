import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Edit3, Trash2, Send } from 'lucide-react';
import { useAddSnapshotMemo, useUpdateSnapshotMemo, useDeleteSnapshotMemo } from '../../hooks/useMyToday';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import type { SnapshotMemo } from '../../service/today.service';

interface Props {
  snpId: string;
  memos: SnapshotMemo[];
}

export default function SnapshotMemoSection({ snpId, memos }: Props) {
  const { t } = useTranslation('today');
  const userId = useAuthStore((s) => s.user?.userId);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const addMemo = useAddSnapshotMemo();
  const updateMemo = useUpdateSnapshotMemo();
  const deleteMemo = useDeleteSnapshotMemo();

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addMemo.mutate(
      { snpId, content: newContent.trim() },
      { onSuccess: () => setNewContent('') },
    );
  };

  const handleUpdate = (memoId: string) => {
    if (!editContent.trim()) return;
    updateMemo.mutate(
      { snpId, memoId, content: editContent.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  };

  const handleDelete = (memoId: string) => {
    if (!confirm(t('memo.deleteConfirm', { defaultValue: '이 메모를 삭제하시겠습니까?' }))) return;
    deleteMemo.mutate({ snpId, memoId });
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          {t('memo.title', { defaultValue: '메모' })}
        </h3>
        <span className="text-xs text-gray-400">({memos.length})</span>
      </div>

      {/* 메모 목록 */}
      {memos.length > 0 && (
        <div className="mb-4 space-y-3">
          {memos.map((memo) => (
            <div key={memo.smoId} className="rounded-lg bg-gray-50 p-3">
              {editingId === memo.smoId ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="mb-2 w-full rounded border border-gray-200 p-2 text-sm focus:border-indigo-400 focus:outline-none"
                    rows={2}
                    maxLength={2000}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(memo.smoId)}
                      disabled={updateMemo.isPending}
                      className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                    >
                      {t('memo.save', { defaultValue: '저장' })}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      {t('close', { defaultValue: '취소' })}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{memo.smoContent}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {new Date(memo.smoCreatedAt).toLocaleString('ko-KR')}
                    </span>
                    {memo.usrId === userId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingId(memo.smoId); setEditContent(memo.smoContent); }}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(memo.smoId)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 메모 추가 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('memo.placeholder', { defaultValue: '메모를 추가하세요...' })}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          maxLength={2000}
        />
        <button
          onClick={handleAdd}
          disabled={!newContent.trim() || addMemo.isPending}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
