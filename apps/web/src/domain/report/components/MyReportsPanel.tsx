import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, FileText, BookMarked } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTodayReports, useDeleteTodayReport } from '@/domain/today/hooks/useMyToday';
import type { TodayReportResponse } from '@/domain/today/service/today.service';

export default function MyReportsPanel() {
  const { t } = useTranslation(['report', 'today']);
  const { data: reports = [] } = useTodayReports('me');
  const deleteReport = useDeleteTodayReport();
  const [viewingReport, setViewingReport] = useState<TodayReportResponse | null>(null);

  const handleDelete = (reportId: string) => {
    if (!confirm(t('today:ai.deleteConfirm', { defaultValue: 'Delete this report?' }))) return;
    deleteReport.mutate(reportId, {
      onSuccess: () => {
        if (viewingReport?.reportId === reportId) setViewingReport(null);
      },
    });
  };

  return (
    <div className="flex flex-1 gap-4 overflow-hidden">
      {/* 왼쪽: 리포트 목록 */}
      <div className="flex w-80 shrink-0 flex-col rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <BookMarked className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-900">
            {t('report:myReports', { defaultValue: '내 리포트' })}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {reports.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {reports.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-400">
              {t('today:ai.noReports', { defaultValue: '저장된 리포트가 없습니다' })}
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {reports.map((report) => (
                <div
                  key={report.reportId}
                  onClick={() => setViewingReport(report)}
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50 ${
                    viewingReport?.reportId === report.reportId ? 'border-l-2 border-l-indigo-500 bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{report.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(report.reportId); }}
                      className="ml-2 shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽: 리포트 상세 */}
      <div className="flex flex-1 flex-col rounded-xl border bg-white shadow-sm">
        {viewingReport ? (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-gray-900">{viewingReport.title}</h4>
              <p className="text-xs text-gray-500">{new Date(viewingReport.createdAt).toLocaleString()}</p>
            </div>
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
              <ReactMarkdown>{viewingReport.content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-gray-400">
            <FileText className="h-12 w-12" />
            <p className="mt-3 text-sm">
              {t('report:selectReport', { defaultValue: '리포트를 선택해주세요' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
