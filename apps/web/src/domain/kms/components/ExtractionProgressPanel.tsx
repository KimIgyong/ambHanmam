import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';

interface BatchEvent {
  type: 'progress' | 'file_done' | 'error' | 'complete';
  fileId?: string;
  fileName?: string;
  current?: number;
  total?: number;
  error?: string;
  result?: { categories: any[] };
}

interface ExtractionProgressPanelProps {
  events: BatchEvent[];
  isRunning: boolean;
}

export default function ExtractionProgressPanel({ events, isRunning }: ExtractionProgressPanelProps) {
  const { t } = useTranslation('kms');

  const lastProgress = events.filter((e) => e.current != null).slice(-1)[0];
  const current = lastProgress?.current || 0;
  const total = lastProgress?.total || 1;
  const pct = Math.round((current / total) * 100);

  const completedFiles = events.filter((e) => e.type === 'file_done');
  const errorFiles = events.filter((e) => e.type === 'error');
  const isComplete = events.some((e) => e.type === 'complete');

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            {isComplete
              ? t('docBuilder.wizard.extractionComplete')
              : t('docBuilder.wizard.extracting')}
          </span>
          <span className="text-gray-500">{current} / {total}</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gray-200">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* File Status List */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
        {completedFiles.map((event, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
            <FileText className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate text-sm text-gray-700">{event.fileName || event.fileId}</span>
            <span className="ml-auto text-xs text-green-600">
              {event.result?.categories.length || 0} {t('docBuilder.wizard.categoriesExtracted')}
            </span>
          </div>
        ))}
        {errorFiles.map((event, i) => (
          <div key={`err-${i}`} className="flex items-center gap-3 px-3 py-2 bg-red-50">
            <XCircle className="h-4 w-4 shrink-0 text-red-500" />
            <FileText className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate text-sm text-gray-700">{event.fileId}</span>
            <span className="ml-auto text-xs text-red-500">{event.error}</span>
          </div>
        ))}
        {isRunning && !isComplete && (
          <div className="flex items-center gap-3 px-3 py-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t('docBuilder.wizard.processing')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
