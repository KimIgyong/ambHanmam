import { useTranslation } from 'react-i18next';
import { X, Download, ExternalLink } from 'lucide-react';
import { useDocumentPreview, useDownloadDocument } from '../../hooks/useDocument';

interface FilePreviewModalProps {
  docId: string;
  onClose: () => void;
}

export default function FilePreviewModal({ docId, onClose }: FilePreviewModalProps) {
  const { t } = useTranslation(['billing', 'common']);
  const { data: preview, isLoading } = useDocumentPreview(docId);
  const downloadMutation = useDownloadDocument();

  const isPreviewable =
    preview?.previewUrl &&
    (preview.mimeType?.startsWith('application/pdf') ||
      preview.mimeType?.startsWith('image/') ||
      preview.mimeType?.includes('document') ||
      preview.mimeType?.includes('spreadsheet') ||
      preview.mimeType?.includes('presentation'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative mx-4 flex h-[85vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {preview?.filename || t('common:loading')}
          </h3>
          <div className="flex items-center gap-2">
            {preview?.gdriveFileId && (
              <button
                onClick={() => downloadMutation.mutate(docId)}
                disabled={downloadMutation.isPending}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {t('billing:invoice.downloadPdf')}
              </button>
            )}
            {preview?.gdriveUrl && (
              <a
                href={preview.gdriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Drive
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-gray-400">{t('common:loading')}</div>
            </div>
          ) : isPreviewable ? (
            <iframe
              src={preview.previewUrl || undefined}
              className="h-full w-full border-0"
              title={preview.filename}
              allow="autoplay"
            />
          ) : preview?.gdriveUrl ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <p className="text-sm text-gray-500">
                {t('billing:document.noPreview')}
              </p>
              <a
                href={preview.gdriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {t('billing:document.openInDrive')}
              </a>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">{t('billing:document.noPreview')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
