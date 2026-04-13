import { useTranslation } from 'react-i18next';
import { X, Download, ExternalLink, Eye } from 'lucide-react';
import { DriveFileResponse } from '@amb/types';
import { driveApiService } from '../service/drive.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface FileDetailModalProps {
  file: DriveFileResponse;
  onClose: () => void;
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

function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.includes('google-apps.document') ||
    mimeType.includes('google-apps.spreadsheet') ||
    mimeType.includes('google-apps.presentation')
  );
}

function isGoogleNative(mimeType: string): boolean {
  return mimeType.includes('google-apps.');
}

export default function FileDetailModal({ file, onClose }: FileDetailModalProps) {
  const { t } = useTranslation(['drive']);

  const handlePreview = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank', 'noopener');
    }
  };

  const handleDownload = () => {
    if (isGoogleNative(file.mimeType)) {
      if (file.webViewLink) {
        window.open(file.webViewLink, '_blank', 'noopener');
      }
    } else {
      const url = driveApiService.getDownloadUrl(file.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleOpenInDrive = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank', 'noopener');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {file.name}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">{t('drive:fileInfo.type')}</span>
              <p className="font-medium text-gray-900 truncate">{file.mimeType.split('/').pop()}</p>
            </div>
            <div>
              <span className="text-gray-500">{t('drive:fileInfo.size')}</span>
              <p className="font-medium text-gray-900">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <span className="text-gray-500">{t('drive:fileInfo.modified')}</span>
              <p className="font-medium text-gray-900">
                {<LocalDateTime value={file.modifiedTime} format='YYYY-MM-DD HH:mm' />}
              </p>
            </div>
            <div>
              <span className="text-gray-500">{t('drive:fileInfo.owner')}</span>
              <p className="font-medium text-gray-900 truncate">
                {file.owners.length > 0 ? file.owners[0] : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          {file.webViewLink && (
            <button
              onClick={handleOpenInDrive}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              {t('drive:openInDrive')}
            </button>
          )}
          {isPreviewable(file.mimeType) && file.webViewLink && (
            <button
              onClick={handlePreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              {t('drive:preview')}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Download className="h-4 w-4" />
            {t('drive:download')}
          </button>
        </div>
      </div>
    </div>
  );
}
