import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, ExternalLink, Trash2, FileText, Link, Plus, Eye, Download } from 'lucide-react';
import { useDocumentList, useUploadDocument, useAddUrlDocument, useDeleteDocument, useDownloadDocument } from '../../hooks/useDocument';
import { BilDocumentResponse } from '@amb/types';
import FilePreviewModal from './FilePreviewModal';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const DOC_TYPES = [
  'SIGNED_CONTRACT',
  'APPENDIX',
  'SOW',
  'ACCEPTANCE_MINUTES',
  'INVOICE',
  'PAYMENT_REQUEST',
  'OTHER',
] as const;

interface DocumentManagerProps {
  refType: 'CONTRACT' | 'SOW' | 'INVOICE';
  refId: string;
}

export default function DocumentManager({ refType, refId }: DocumentManagerProps) {
  const { t } = useTranslation(['billing', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents = [], isLoading } = useDocumentList(refType, refId);
  const uploadMutation = useUploadDocument();
  const addUrlMutation = useAddUrlDocument();
  const deleteMutation = useDeleteDocument();

  const downloadMutation = useDownloadDocument();

  const [docType, setDocType] = useState<string>('OTHER');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlFilename, setUrlFilename] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMutation.mutateAsync({ refType, refId, docType, file });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlSubmit = async () => {
    if (!urlFilename.trim() || !urlValue.trim()) return;
    await addUrlMutation.mutateAsync({
      refType,
      refId,
      docType,
      filename: urlFilename.trim(),
      url: urlValue.trim(),
    });
    setUrlFilename('');
    setUrlValue('');
    setShowUrlForm(false);
  };

  const handleDelete = (doc: BilDocumentResponse) => {
    if (!window.confirm(t('billing:document.deleteConfirm'))) return;
    deleteMutation.mutate(doc.docId);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!refId) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('billing:document.title')}
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {DOC_TYPES.map((dt) => (
              <option key={dt} value={dt}>
                {t(`billing:document.type.${dt}`)}
              </option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploadMutation.isPending ? t('common:processing') : t('billing:document.upload')}
          </button>
          <button
            onClick={() => setShowUrlForm(!showUrlForm)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Link className="h-3.5 w-3.5" />
            {t('billing:document.addUrl')}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* URL Form */}
      {showUrlForm && (
        <div className="mb-3 flex items-end gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {t('billing:document.urlFilename')}
            </label>
            <input
              type="text"
              value={urlFilename}
              onChange={(e) => setUrlFilename(e.target.value)}
              placeholder={t('billing:document.urlFilenamePlaceholder')}
              className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              URL
            </label>
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleUrlSubmit}
            disabled={addUrlMutation.isPending || !urlFilename.trim() || !urlValue.trim()}
            className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Document List */}
      {isLoading ? (
        <div className="py-4 text-center text-xs text-gray-400">{t('common:loading')}</div>
      ) : documents.length === 0 ? (
        <div className="py-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-200" />
          <p className="mt-1 text-xs text-gray-400">{t('billing:document.noDocuments')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <div key={doc.docId} className="flex items-center gap-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm text-gray-900">{doc.filename}</span>
                  <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    {t(`billing:document.type.${doc.docType}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                  {doc.createdAt && (
                    <span>{<LocalDateTime value={doc.createdAt} format='YYYY-MM-DD HH:mm' />}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {doc.gdriveFileId && (
                  <button
                    onClick={() => setPreviewDocId(doc.docId)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                    title={t('billing:document.preview')}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
                {doc.gdriveFileId && (
                  <button
                    onClick={() => downloadMutation.mutate(doc.docId)}
                    disabled={downloadMutation.isPending}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    title={t('billing:document.download')}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                )}
                {doc.gdriveUrl && (
                  <a
                    href={doc.gdriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deleteMutation.isPending}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDocId && (
        <FilePreviewModal
          docId={previewDocId}
          onClose={() => setPreviewDocId(null)}
        />
      )}
    </div>
  );
}
