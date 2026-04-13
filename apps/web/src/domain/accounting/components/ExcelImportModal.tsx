import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, FileSpreadsheet, CheckCircle2, Loader2 } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (formData: FormData) => Promise<void>;
  isLoading: boolean;
  result?: { accountsCreated: number; transactionsImported: number; sheets: string[] } | null;
}

export default function ExcelImportModal({ isOpen, onClose, onImport, isLoading, result }: ExcelImportModalProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await onImport(formData);
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            <div className="text-center">
              <p className="font-medium text-gray-900">{t('accounting:importing')}</p>
              {file && (
                <p className="mt-1 text-sm text-gray-500">{file.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result state
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{t('accounting:importComplete')}</span>
            </div>
            <div className="space-y-2 rounded-lg bg-gray-50 p-4">
              {result.accountsCreated > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('accounting:accountsCreated')}</span>
                  <span className="font-semibold">{result.accountsCreated}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('accounting:transactionsImported')}</span>
                <span className="font-semibold">{result.transactionsImported.toLocaleString()}</span>
              </div>
              {result.sheets.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('accounting:sheetsProcessed')}</span>
                    <span className="font-semibold">{result.sheets.length}</span>
                  </div>
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <p className="mb-1 text-xs text-gray-500">Sheets:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.sheets.map((s) => (
                        <span key={s} className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t('accounting:importDone')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // File select state
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('accounting:importExcel')}</h2>
          <button onClick={handleClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t('accounting:importExcelDesc')}</p>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-emerald-400 hover:bg-emerald-50/50">
            {file ? (
              <>
                <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">{t('accounting:selectFile')}</span>
                <span className="text-xs text-gray-400">.xlsx</span>
              </>
            )}
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {t('accounting:importExcel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
