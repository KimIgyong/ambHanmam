import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useImportAssetExcel } from '../hooks/useAsset';

interface AssetExcelImportModalProps {
  onClose: () => void;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  failCount: number;
  errors: { row: number; field: string; message: string }[];
}

export default function AssetExcelImportModal({ onClose }: AssetExcelImportModalProps) {
  const { t } = useTranslation('asset');
  const importMutation = useImportAssetExcel();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((f: File) => {
    if (!f.name.endsWith('.xlsx')) {
      alert(t('excel.invalidFormat'));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert(t('excel.fileTooLarge'));
      return;
    }
    setFile(f);
    setResult(null);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleUpload = useCallback(() => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData, {
      onSuccess: (data) => setResult(data),
    });
  }, [file, importMutation]);

  const isLoading = importMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('excel.importTitle')}</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!result ? (
            <>
              <p className="mb-4 text-sm text-gray-600">{t('excel.importDescription')}</p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
                }`}
              >
                {file ? (
                  <>
                    <FileSpreadsheet className="h-10 w-10 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{t('excel.dragDrop')}</p>
                      <p className="mt-1 text-xs text-gray-500">{t('excel.fileLimit')}</p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
              />

              {importMutation.isError && (
                <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {(importMutation.error as any)?.response?.data?.error?.message || (importMutation.error as Error).message}
                </div>
              )}
            </>
          ) : (
            /* Result */
            <>
              <div className="mb-4 flex items-center gap-3">
                {result.failCount === 0 ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                )}
                <div>
                  <p className="text-lg font-semibold text-gray-900">{t('excel.result')}</p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.totalRows}</p>
                  <p className="text-xs text-gray-500">{t('excel.totalRows')}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                  <p className="text-xs text-green-600">{t('excel.successCount')}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{result.failCount}</p>
                  <p className="text-xs text-red-600">{t('excel.failCount')}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-red-50 text-left text-xs font-medium text-red-700">
                        <th className="px-3 py-2">{t('excel.errorRow')}</th>
                        <th className="px-3 py-2">{t('excel.errorField')}</th>
                        <th className="px-3 py-2">{t('excel.errorMessage')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="px-3 py-2 text-gray-700">{err.row}</td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-600">{err.field}</td>
                          <td className="px-3 py-2 text-gray-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {result ? t('form.cancel') : t('form.cancel')}
          </button>
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('excel.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {t('excel.uploadExcel')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
