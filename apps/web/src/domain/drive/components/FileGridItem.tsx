import { Folder, FileText, FileSpreadsheet, FileImage, Film, Music, File, Presentation } from 'lucide-react';
import { DriveFileResponse } from '@amb/types';

interface FileGridItemProps {
  file: DriveFileResponse;
  onFolderClick: (folderId: string, folderName: string) => void;
  onFileClick: (file: DriveFileResponse) => void;
}

function formatFileSize(bytes: string | null): string {
  if (!bytes) return '';
  const size = parseInt(bytes, 10);
  if (isNaN(size)) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/vnd.google-apps.folder') return { Icon: Folder, color: 'text-yellow-500', bg: 'bg-yellow-50' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { Icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { Icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50' };
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType === 'application/vnd.google-apps.document') return { Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
  if (mimeType.startsWith('image/')) return { Icon: FileImage, color: 'text-pink-500', bg: 'bg-pink-50' };
  if (mimeType.startsWith('video/')) return { Icon: Film, color: 'text-red-500', bg: 'bg-red-50' };
  if (mimeType.startsWith('audio/')) return { Icon: Music, color: 'text-purple-500', bg: 'bg-purple-50' };
  if (mimeType === 'application/pdf') return { Icon: FileText, color: 'text-red-600', bg: 'bg-red-50' };
  return { Icon: File, color: 'text-gray-500', bg: 'bg-gray-50' };
}

export default function FileGridItem({ file, onFolderClick, onFileClick }: FileGridItemProps) {
  const { Icon, color, bg } = getFileIcon(file.mimeType);

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
      className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-4 text-center transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      {file.thumbnailLink && !file.isFolder ? (
        <div className="mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg">
          <img src={file.thumbnailLink} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className={`mb-2 flex h-16 w-16 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      )}
      <span className="w-full truncate text-sm font-medium text-gray-900">{file.name}</span>
      <span className="mt-0.5 text-xs text-gray-400">
        {file.isFolder ? formatDate(file.modifiedTime) : `${formatFileSize(file.size)} · ${formatDate(file.modifiedTime)}`}
      </span>
    </button>
  );
}
