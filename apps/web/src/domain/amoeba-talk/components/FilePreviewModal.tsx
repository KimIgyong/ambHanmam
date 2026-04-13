import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, FileText } from 'lucide-react';

interface FilePreviewModalProps {
  url: string;
  originalName: string;
  mimeType: string;
  onClose: () => void;
}

/** 미리보기 지원 MIME 타입 판별 */
function getPreviewType(mimeType: string, fileName: string): 'pdf' | 'text' | 'markdown' | null {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'text/plain' || fileName.endsWith('.txt')) return 'text';
  if (mimeType === 'text/markdown' || fileName.endsWith('.md')) return 'markdown';
  return null;
}

export default function FilePreviewModal({ url, originalName, mimeType, onClose }: FilePreviewModalProps) {
  const { t } = useTranslation(['talk']);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const previewType = getPreviewType(mimeType, originalName);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // TXT / MD 파일은 fetch 후 텍스트 표시
  useEffect(() => {
    if (previewType !== 'text' && previewType !== 'markdown') return;
    setLoading(true);
    setError(false);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.text();
      })
      .then((text) => setTextContent(text))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [url, previewType]);

  const handleDownload = useCallback(() => {
    const downloadUrl = `${url}/download?name=${encodeURIComponent(originalName)}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [url, originalName]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* 헤더 바: 노치 아래에 배치 */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-white">
          <FileText className="h-5 w-5 shrink-0 text-white/70" />
          <span className="truncate text-sm font-medium">{originalName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            title={t('talk:downloadFile')}
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            title={t('talk:closeImage')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 미리보기 콘텐츠 영역 */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-4">
        {previewType === 'pdf' && (
          <iframe
            src={url}
            title={originalName}
            className="h-full w-full max-w-4xl rounded-lg bg-white"
            style={{ minHeight: '60vh' }}
          />
        )}

        {(previewType === 'text' || previewType === 'markdown') && (
          <div className="h-full w-full max-w-4xl overflow-auto rounded-lg bg-white p-6">
            {loading && (
              <p className="text-center text-sm text-gray-400">{t('talk:translating', { defaultValue: 'Loading...' })}</p>
            )}
            {error && (
              <p className="text-center text-sm text-red-400">{t('talk:filePreviewError')}</p>
            )}
            {textContent !== null && !loading && !error && (
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">{textContent}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
