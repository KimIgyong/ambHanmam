import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Share2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MemberResponse, WorkItemShareResponse } from '@amb/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItemId: string;
}

export default function ShareModal({ isOpen, onClose, workItemId }: ShareModalProps) {
  const { t } = useTranslation('acl');
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permission, setPermission] = useState('VIEW');

  const { data: shares } = useQuery({
    queryKey: ['work-items', workItemId, 'shares'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: WorkItemShareResponse[] }>(
        `/work-items/${workItemId}/shares`,
      );
      return res.data.data;
    },
    enabled: isOpen,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: MemberResponse[] }>('/members');
      return res.data.data;
    },
  });

  const shareMut = useMutation({
    mutationFn: (data: { target_type: string; target_id: string; permission: string }) =>
      apiClient.post(`/work-items/${workItemId}/shares`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items', workItemId, 'shares'] });
      setSelectedUserId('');
      setSearchQuery('');
    },
  });

  const unshareMut = useMutation({
    mutationFn: (shareId: string) =>
      apiClient.delete(`/work-items/shares/${shareId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items', workItemId, 'shares'] });
    },
  });

  const filteredMembers = members?.filter(
    (m) =>
      (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !shares?.some((s) => s.targetId === m.userId),
  );

  const handleShare = () => {
    if (!selectedUserId) return;
    shareMut.mutate({ target_type: 'USER', target_id: selectedUserId, permission });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('share.title')}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add share */}
        <div className="space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('share.shareWith')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />

          {searchQuery && filteredMembers && filteredMembers.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200">
              {filteredMembers.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => { setSelectedUserId(m.userId); setSearchQuery(m.name); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${selectedUserId === m.userId ? 'bg-indigo-50' : ''}`}
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-2 text-gray-400">{m.email}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="VIEW">{t('permission.VIEW')}</option>
              <option value="COMMENT">{t('permission.COMMENT')}</option>
              <option value="EDIT">{t('permission.EDIT')}</option>
            </select>
            <button
              onClick={handleShare}
              disabled={!selectedUserId || shareMut.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {shareMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('share.title')}
            </button>
          </div>
        </div>

        {/* Current shares */}
        {shares && shares.length > 0 && (
          <div className="mt-4 divide-y divide-gray-100 border-t pt-4">
            {shares.map((s) => (
              <div key={s.shareId} className="flex items-center justify-between py-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{s.sharedByName}</span>
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {t(`permission.${s.permission}`)}
                  </span>
                </div>
                <button
                  onClick={() => unshareMut.mutate(s.shareId)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  {t('common:remove', { ns: 'common' })}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
