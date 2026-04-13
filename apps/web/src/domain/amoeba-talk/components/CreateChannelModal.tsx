import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCreateChannel } from '../hooks/useTalk';
import { useTalkStore } from '../store/talk.store';

export default function CreateChannelModal() {
  const { t } = useTranslation(['talk']);
  const { setShowCreateModal, setCurrentChannelId } = useTalkStore();
  const createChannel = useCreateChannel();

  const [name, setName] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createChannel.mutate(
      { name: name.trim(), type, description: description.trim() || undefined },
      {
        onSuccess: (channel) => {
          if (channel) {
            setCurrentChannelId(channel.id);
          }
          setShowCreateModal(false);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl mx-4">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">{t('talk:createChannel')}</h3>
          <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
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
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('talk:channelType')}</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="PUBLIC"
                  checked={type === 'PUBLIC'}
                  onChange={() => setType('PUBLIC')}
                  className="text-indigo-500"
                />
                <span className="text-sm text-gray-700">{t('talk:public')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="PRIVATE"
                  checked={type === 'PRIVATE'}
                  onChange={() => setType('PRIVATE')}
                  className="text-indigo-500"
                />
                <span className="text-sm text-gray-700">{t('talk:private')}</span>
              </label>
            </div>
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
              onClick={() => setShowCreateModal(false)}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('talk:cancel')}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createChannel.isPending}
              className="rounded-md bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-600 disabled:opacity-40"
            >
              {t('talk:create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
