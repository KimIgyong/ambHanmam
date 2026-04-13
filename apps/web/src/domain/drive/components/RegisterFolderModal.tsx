import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface RegisterFolderModalProps {
  onSubmit: (data: {
    folder_id: string;
    folder_name: string;
    drive_type: string;
    description?: string;
  }) => void;
  onClose: () => void;
  isSaving: boolean;
}

export default function RegisterFolderModal({
  onSubmit,
  onClose,
  isSaving,
}: RegisterFolderModalProps) {
  const { t } = useTranslation(['drive', 'common']);
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [driveType, setDriveType] = useState('shared');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      folder_id: folderId.trim(),
      folder_name: folderName.trim(),
      drive_type: driveType,
      description: description.trim() || undefined,
    });
  };

  const isValid = folderId.trim() && folderName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('drive:folderForm.title')}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('drive:folderForm.folderId')}
            </label>
            <input
              type="text"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder={t('drive:folderForm.folderIdPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('drive:folderForm.folderName')}
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={t('drive:folderForm.folderNamePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('drive:folderForm.driveType')}
            </label>
            <select
              value={driveType}
              onChange={(e) => setDriveType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="shared">{t('drive:folderForm.shared')}</option>
              <option value="personal">{t('drive:folderForm.personal')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('drive:folderForm.description')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('drive:folderForm.descriptionPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              disabled={!isValid || isSaving}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? t('common:processing') : t('drive:folderForm.register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
