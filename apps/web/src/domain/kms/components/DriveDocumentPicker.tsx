import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisteredFolders, useDriveFilesInfinite } from '@/domain/drive/hooks/useDrive';
import { CheckSquare, Square, ChevronDown, Loader2 } from 'lucide-react';

interface DriveDocumentPickerProps {
  selectedFileIds: string[];
  onSelectionChange: (fileIds: string[]) => void;
}

export default function DriveDocumentPicker({ selectedFileIds, onSelectionChange }: DriveDocumentPickerProps) {
  const { t } = useTranslation('kms');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const { data: folders, isLoading: foldersLoading } = useRegisteredFolders();
  const { data: filesData, fetchNextPage, hasNextPage, isFetchingNextPage } = useDriveFilesInfinite(selectedFolderId);

  const allFiles = filesData?.pages.flatMap((p) => p.files) || [];
  const supportedFiles = allFiles.filter((f: any) => {
    const mime = f.mimeType || '';
    return mime.includes('document') || mime.includes('presentation') || mime.includes('pdf');
  });

  const toggleFile = (fileId: string) => {
    if (selectedFileIds.includes(fileId)) {
      onSelectionChange(selectedFileIds.filter((id) => id !== fileId));
    } else {
      onSelectionChange([...selectedFileIds, fileId]);
    }
  };

  const toggleAll = () => {
    if (selectedFileIds.length === supportedFiles.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(supportedFiles.map((f: any) => f.id));
    }
  };

  const getMimeIcon = (mimeType: string) => {
    if (mimeType?.includes('presentation') || mimeType?.includes('pptx')) return 'PPTX';
    if (mimeType?.includes('document') || mimeType?.includes('docx')) return 'DOCX';
    if (mimeType?.includes('pdf')) return 'PDF';
    return 'FILE';
  };

  const getMimeColor = (mimeType: string) => {
    if (mimeType?.includes('presentation')) return 'text-orange-500 bg-orange-50';
    if (mimeType?.includes('document')) return 'text-blue-500 bg-blue-50';
    if (mimeType?.includes('pdf')) return 'text-red-500 bg-red-50';
    return 'text-gray-500 bg-gray-50';
  };

  return (
    <div className="space-y-4">
      {/* Folder Selector */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('docBuilder.wizard.selectFolder')}
        </label>
        {foldersLoading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('docBuilder.wizard.loadingFolders')}
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{t('docBuilder.wizard.chooseFolderPlaceholder')}</option>
              {(folders || []).map((folder: any) => (
                <option key={folder.id || folder.folderId} value={folder.folderId || folder.id}>
                  {folder.folderName || folder.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* File List */}
      {selectedFolderId && (
        <div className="rounded-lg border border-gray-200">
          {/* Select All Header */}
          {supportedFiles.length > 0 && (
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2">
              <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                {selectedFileIds.length === supportedFiles.length ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {t('docBuilder.wizard.selectAll')} ({supportedFiles.length})
              </button>
              <span className="ml-auto text-xs text-gray-400">
                {selectedFileIds.length} {t('docBuilder.wizard.selected')}
              </span>
            </div>
          )}

          {/* File Items */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {supportedFiles.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                {t('docBuilder.wizard.noSupportedFiles')}
              </div>
            ) : (
              supportedFiles.map((file: any) => {
                const fileId = file.id;
                const isSelected = selectedFileIds.includes(fileId);
                return (
                  <button
                    key={fileId}
                    onClick={() => toggleFile(fileId)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-gray-300" />
                    )}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getMimeColor(file.mimeType)}`}>
                      {getMimeIcon(file.mimeType)}
                    </span>
                    <span className="truncate text-sm text-gray-700">{file.name}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="border-t border-gray-100 px-3 py-2 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                {isFetchingNextPage ? t('docBuilder.wizard.loading') : t('docBuilder.wizard.loadMore')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
