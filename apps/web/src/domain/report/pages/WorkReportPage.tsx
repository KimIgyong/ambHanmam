import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileBarChart, Calendar, Loader2, Trash2,
  ChevronLeft, ChevronRight, BarChart3, RefreshCw, BookMarked,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useWorkReports, useDeleteWorkReport, useWorkReportDetail } from '../hooks/useWorkReports';
import MyReportsPanel from '../components/MyReportsPanel';
import type { WorkReportSummary } from '../service/report.service';
import { QuotaExceededBanner } from '@/components/common/QuotaExceededBanner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

type ReportType = 'my-reports' | 'daily' | 'weekly';

// ─── 유틸 ──────────────────────────────────────────────

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ─── 메인 페이지 ─────────────────────────────────────────

export default function WorkReportPage() {
  const { t, i18n } = useTranslation(['report', 'common']);
  const [reportType, setReportType] = useState<ReportType>('my-reports');
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [weekStart, setWeekStart] = useState(() => formatDate(getMonday(new Date())));
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);

  const { data: reports = [], refetch: refetchReports } = useWorkReports(
    reportType === 'my-reports' ? 'daily' : reportType,
  );
  const deleteReport = useDeleteWorkReport();
  const { data: viewingDetail } = useWorkReportDetail(viewingReportId);

  // ─── SSE 스트리밍 리포트 생성 ───────────

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setStreamText('');
    setViewingReportId(null);

    try {
      const entityId = (await import('@/domain/hr/store/entity.store')).useEntityStore.getState().currentEntity?.entityId;
      const currentLang = i18n.language || localStorage.getItem('amb-lang') || 'en';

      let url: string;
      if (reportType === 'daily') {
        url = `${API_BASE_URL}/reports/work/daily/generate?date=${selectedDate}`;
      } else {
        const end = formatDate(addDays(new Date(weekStart), 6));
        url = `${API_BASE_URL}/reports/work/weekly/generate?start=${weekStart}&end=${end}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLang,
          ...(entityId ? { 'X-Entity-Id': entityId } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok || !response.body) throw new Error('Report generation failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content' && data.content) {
                accumulated += data.content;
                setStreamText(accumulated);
              }
            } catch { /* skip parse error */ }
          }
        }
      }

      setIsGenerating(false);
      refetchReports();
      toast.success(t('report:generated', { defaultValue: '리포트가 생성되었습니다' }));
    } catch {
      toast.error(t('common:errors.E9001', { defaultValue: 'An error occurred' }));
      setIsGenerating(false);
    }
  }, [reportType, selectedDate, weekStart, t, i18n.language, refetchReports]);

  const handleDelete = (id: string) => {
    if (!confirm(t('report:deleteConfirm', { defaultValue: '이 리포트를 삭제하시겠습니까?' }))) return;
    deleteReport.mutate(id, {
      onSuccess: () => {
        if (viewingReportId === id) setViewingReportId(null);
        toast.success(t('report:deleted', { defaultValue: '삭제되었습니다' }));
      },
    });
  };

  const handleViewReport = (report: WorkReportSummary) => {
    setStreamText('');
    setViewingReportId(report.id);
  };

  // ─── 날짜 네비게이션 ───────────────────────

  const navigateDate = (direction: -1 | 1) => {
    if (reportType === 'daily') {
      setSelectedDate(formatDate(addDays(new Date(selectedDate), direction)));
    } else {
      setWeekStart(formatDate(addDays(new Date(weekStart), direction * 7)));
    }
  };

  const weekEnd = formatDate(addDays(new Date(weekStart), 6));

  // ─── 표시할 콘텐츠 결정 ───────────────────

  const displayContent = viewingReportId && viewingDetail
    ? viewingDetail.aiSummary
    : streamText || null;

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <QuotaExceededBanner />
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <FileBarChart className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-900">
            {t('report:title', { defaultValue: '업무 리포트' })}
          </h1>
        </div>

        {/* 리포트 타입 탭 */}
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => { setReportType('my-reports'); setViewingReportId(null); setStreamText(''); }}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              reportType === 'my-reports'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookMarked className="h-3.5 w-3.5" />
            {t('report:myReports', { defaultValue: '내 리포트' })}
          </button>
          {(['daily', 'weekly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setReportType(type); setViewingReportId(null); setStreamText(''); }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                reportType === type
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type === 'daily'
                ? t('report:daily', { defaultValue: '일간 리포트' })
                : t('report:weekly', { defaultValue: '주간 리포트' })}
            </button>
          ))}
        </div>
      </div>

      {reportType === 'my-reports' ? (
        <MyReportsPanel />
      ) : (
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* 왼쪽 사이드바: 기간 선택 + 리포트 목록 */}
        <div className="flex w-80 shrink-0 flex-col rounded-xl border bg-white shadow-sm">
          {/* 날짜/주간 네비게이션 */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateDate(-1)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                {reportType === 'daily' ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {weekStart} ~ {weekEnd}
                  </div>
                )}
              </div>
              <button
                onClick={() => navigateDate(1)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('report:generating', { defaultValue: '생성 중...' })}
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  {t('report:generate', { defaultValue: 'AI 리포트 생성' })}
                </>
              )}
            </button>
          </div>

          {/* 저장된 리포트 목록 */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs font-medium uppercase text-gray-500">
                {t('report:savedReports', { defaultValue: '저장된 리포트' })} ({reports.length})
              </span>
              <button
                onClick={() => refetchReports()}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            {reports.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                {t('report:noReports', { defaultValue: '저장된 리포트가 없습니다' })}
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleViewReport(report)}
                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50 ${
                      viewingReportId === report.id ? 'border-l-2 border-l-indigo-500 bg-indigo-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            report.type === 'daily'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {report.type === 'daily' ? 'D' : 'W'}
                          </span>
                          <span className="truncate text-sm font-medium text-gray-900">
                            {report.periodStart}
                            {report.periodStart !== report.periodEnd && ` ~ ${report.periodEnd}`}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                          {report.aiScore?.productivityScore != null && (
                            <span className="font-medium text-indigo-600">
                              {report.aiScore.productivityScore}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
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

        {/* 오른쪽: 리포트 콘텐츠 */}
        <div className="flex flex-1 flex-col rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              {viewingReportId && viewingDetail
                ? `${viewingDetail.periodStart}${viewingDetail.periodStart !== viewingDetail.periodEnd ? ` ~ ${viewingDetail.periodEnd}` : ''}`
                : isGenerating || streamText
                  ? (reportType === 'daily' ? selectedDate : `${weekStart} ~ ${weekEnd}`)
                  : t('report:selectOrGenerate', { defaultValue: '리포트를 선택하거나 생성하세요' })}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {isGenerating && !streamText && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="mt-3 text-sm text-gray-500">
                  {t('report:generating', { defaultValue: '리포트 생성 중...' })}
                </span>
              </div>
            )}

            {displayContent && (
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700 prose-table:text-sm">
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              </div>
            )}

            {isGenerating && streamText && (
              <span className="mt-2 inline-block h-4 w-1 animate-pulse bg-indigo-500" />
            )}

            {!isGenerating && !displayContent && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileBarChart className="h-12 w-12" />
                <p className="mt-3 text-sm">
                  {t('report:emptyState', { defaultValue: '왼쪽에서 날짜를 선택하고 AI 리포트를 생성해보세요' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
