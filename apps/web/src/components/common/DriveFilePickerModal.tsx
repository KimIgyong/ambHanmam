import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Folder, FileText, ChevronRight, Loader2, Check } from 'lucide-react';
import { DriveFileResponse } from '@amb/types';
import { useRegisteredFolders, useDriveFiles, useDriveSearch } from '@/domain/drive/hooks/useDrive';

interface DriveFilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: DriveFileResponse[]) => void;
  multiple?: boolean;
}

export default function DriveFilePickerModal({ isOpen, onClose, onSelect, multiple = true }: DriveFilePickerModalProps) {
  const { t } = useTranslation(['common']);
  const { data: registeredFolders = [] } = useRegisteredFolders();

  const [currentFolderId, setCurrentFolderId] = useState('');
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<DriveFileResponse[]>([]);

  const activeFolderId = currentFolderId || (registeredFolders.length > 0 ? registeredFolders[0].folderId : '');
  const { data: filesData, isLoading: isLoadingFiles } = useDriveFiles(searchQuery ? '' : activeFolderId);
  const { data: searchData, isLoading: isSearching } = useDriveSearch(searchQuery);

  const files = searchQuery.length >= 2 ? (searchData?.files || []) : (filesData?.files || []);
  const isLoading = searchQuery.length >= 2 ? isSearching : isLoadingFiles;

  const handleFolderClick = useCallback((file: DriveFileResponse) => {
    setFolderPath((prev) => [...prev, { id: activeFolderId, name: prev.length === 0 ? (registeredFolders[0]?.folderName || 'Root') : '' }]);
    setCurrentFolderId(file.id);
    setSearchQuery('');
  }, [activeFolderId, registeredFolders]);

  const handleBreadcrumbClick = useCallback((index: number) => {
    if (index < 0) {
      setCurrentFolderId('');
      setFolderPath([]);
    } else {
      const target = folderPath[index];
      setCurrentFolderId(target.id);
      setFolderPath((prev) => prev.slice(0, index));
    }
    setSearchQuery('');
  }, [folderPath]);

  const toggleFileSelection = useCallback((file: DriveFileResponse) => {
    if (file.isFolder) {
      handleFolderClick(file);
      return;
    }
    setSelectedFiles((prev) => {
      const exists = prev.find((f) => f.id === file.id);
      if (exists) return prev.filter((f) => f.id !== file.id);
      if (multiple) return [...prev, file];
      return [file];
    });
  }, [handleFolderClick, multiple]);

  const handleConfirm = useCallback(() => {
    if (selectedFiles.length > 0) {
      onSelect(selectedFiles);
      setSelectedFiles([]);
      onClose();
    }
  }, [selectedFiles, onSelect, onClose]);

  const formatSize = (size: string | null) => {
    if (!size) return '';
    const bytes = parseInt(size, 10);
    if (isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
          <h3 className="text-base font-semibold text-gray-900">{t('common:driveFilePicker.title')}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common:driveFilePicker.search')}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Breadcrumb */}
        {!searchQuery && folderPath.length > 0 && (
          <div className="flex items-center gap-1 border-b px-5 py-2 text-xs text-gray-500 overflow-x-auto">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className="shrink-0 hover:text-indigo-600"
            >
              {registeredFolders[0]?.folderName || 'Root'}
            </button>
            {folderPath.slice(1).map((item, idx) => (
              <span key={idx} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3" />
                <button onClick={() => handleBreadcrumbClick(idx + 1)} className="hover:text-indigo-600">
                  {item.name || '...'}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ minHeight: '200px' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : files.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">{t('common:driveFilePicker.noFiles')}</div>
          ) : (
            <div className="space-y-0.5">
              {files.map((file) => {
                const isSelected = selectedFiles.some((f) => f.id === file.id);
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => toggleFileSelection(file)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {file.isFolder ? (
                      <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                    ) : (
                      <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                    )}
                    <span className="flex-1 truncate">{file.name}</span>
                    {!file.isFolder && file.size && (
                      <span className="shrink-0 text-xs text-gray-400">{formatSize(file.size)}</span>
                    )}
                    {file.isFolder && <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
                    {isSelected && !file.isFolder && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t px-5 py-3">
          <span className="text-xs text-gray-500">
            {selectedFiles.length > 0 && `${selectedFiles.length} ${t('common:driveFilePicker.selected')}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common:driveFilePicker.select')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
