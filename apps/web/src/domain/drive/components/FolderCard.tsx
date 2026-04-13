import { useTranslation } from 'react-i18next';
import { FolderOpen, HardDrive, User } from 'lucide-react';
import { DriveFolderRegistration } from '@amb/types';

interface FolderCardProps {
  folder: DriveFolderRegistration;
  onClick: () => void;
}

export default function FolderCard({ folder, onClick }: FolderCardProps) {
  const { t } = useTranslation(['drive']);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-purple-300 hover:bg-purple-50"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100">
        <FolderOpen className="h-6 w-6 text-purple-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900">
            {folder.folderName}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {folder.driveType === 'shared' ? (
              <HardDrive className="h-3 w-3" />
            ) : (
              <User className="h-3 w-3" />
            )}
            {folder.driveType === 'shared'
              ? t('drive:folderForm.shared')
              : t('drive:folderForm.personal')}
          </span>
        </div>
        {folder.description && (
          <p className="mt-1 truncate text-xs text-gray-500">
            {folder.description}
          </p>
        )}
      </div>
    </button>
  );
}
