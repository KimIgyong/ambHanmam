import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { TalkChannelDetailResponse } from '@amb/types';
import { useUpdateChannel } from '../hooks/useTalk';
import { useTalkStore } from '../store/talk.store';

interface EditChannelModalProps {
  channel: TalkChannelDetailResponse;
}

export default function EditChannelModal({ channel }: EditChannelModalProps) {
  const { t } = useTranslation(['talk']);
  const { setShowEditModal } = useTalkStore();
  const updateChannel = useUpdateChannel();

  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateChannel.mutate(
      {
        channelId: channel.id,
        data: { name: name.trim(), description: description.trim() || undefined },
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl mx-4">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">{t('talk:editChannel')}</h3>
          <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('talk:channelName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('talk:channelDescription')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('talk:cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || updateChannel.isPending}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-600 disabled:opacity-40"
            >
              {t('talk:save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
