import { Folder, FileText, FileSpreadsheet, FileImage, Film, Music, File, Presentation } from 'lucide-react';
import { DriveFileResponse } from '@amb/types';

interface FileListItemProps {
  file: DriveFileResponse;
  onFolderClick: (folderId: string, folderName: string) => void;
  onFileClick: (file: DriveFileResponse) => void;
}

function formatFileSize(bytes: string | null): string {
  if (!bytes) return '-';
  const size = parseInt(bytes, 10);
  if (isNaN(size)) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/vnd.google-apps.folder') return { Icon: Folder, color: 'text-yellow-500' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { Icon: FileSpreadsheet, color: 'text-green-600' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { Icon: Presentation, color: 'text-orange-500' };
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType === 'application/vnd.google-apps.document') return { Icon: FileText, color: 'text-blue-600' };
  if (mimeType.startsWith('image/')) return { Icon: FileImage, color: 'text-pink-500' };
  if (mimeType.startsWith('video/')) return { Icon: Film, color: 'text-red-500' };
  if (mimeType.startsWith('audio/')) return { Icon: Music, color: 'text-purple-500' };
  if (mimeType === 'application/pdf') return { Icon: FileText, color: 'text-red-600' };
  return { Icon: File, color: 'text-gray-500' };
}

export default function FileListItem({ file, onFolderClick, onFileClick }: FileListItemProps) {
  const { Icon, color } = getFileIcon(file.mimeType);

  const handleClick = () => {
    if (file.isFolder) {
      onFolderClick(file.id, file.name);
    } else {
      onFileClick(file);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <Icon className={`h-5 w-5 shrink-0 ${color}`} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
        {file.name}
      </span>
      <span className="shrink-0 text-xs text-gray-400 w-20 text-right">
        {file.isFolder ? '' : formatFileSize(file.size)}
      </span>
      <span className="shrink-0 text-xs text-gray-400 w-24 text-right">
        {formatDate(file.modifiedTime)}
      </span>
      {file.owners.length > 0 && (
        <span className="hidden shrink-0 truncate text-xs text-gray-400 sm:block w-28 text-right">
          {file.owners[0]}
        </span>
      )}
    </button>
  );
}
