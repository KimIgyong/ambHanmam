import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, Save, X, Trash2, FileText, Languages } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useTodayReports, useSaveTodayReport, useDeleteTodayReport, useTranslateContent } from '../hooks/useMyToday';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import type { TodayReportResponse } from '../service/today.service';
import { QuotaExceededBanner } from '@/components/common/QuotaExceededBanner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

type Scope = 'all' | 'team' | 'cell' | 'me';

const SCOPE_LABELS: Record<Scope, string> = {
  me: 'My_Today',
  team: 'Unit_Today',
  cell: 'Cell_Today',
  all: 'All_Today',
};

const TRANSLATE_LANGS = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'ko', label: 'KO', flag: '🇰🇷' },
  { code: 'vi', label: 'VI', flag: '🇻🇳' },
] as const;

function generateReportTitle(scope: Scope, authorName: string, existingReports: TodayReportResponse[]): string {
  const label = SCOPE_LABELS[scope];
  const today = new Date().toISOString().split('T')[0];
  const prefix = `${label}_${authorName}_${today}_`;
  const todayReports = existingReports.filter((r) => r.title.startsWith(prefix));
  const seq = String(todayReports.length + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

// ─── AI 분석 모달 ───────────────────────────────────────

interface AnalysisModalProps {
  scope: Scope;
  onClose: () => void;
}

export function AnalysisModal({ scope, onClose }: AnalysisModalProps) {
  const { t, i18n } = useTranslation(['today', 'common']);
  const [analysisText, setAnalysisText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const userName = useAuthStore((s) => s.user?.name || 'Unknown');
  const { data: reports = [] } = useTodayReports(scope);
  const saveReport = useSaveTodayReport();

  const handleAnalysis = useCallback(async () => {
    setIsLoading(true);
    setAnalysisText('');
    setIsSaved(false);

    try {
      const entityId = (await import('@/domain/hr/store/entity.store')).useEntityStore.getState().currentEntity?.entityId;
      const currentLang = i18n.language || localStorage.getItem('amb-lang') || 'en';
      const url = scope === 'me'
        ? `${API_BASE_URL}/today/ai-analysis/me`
        : `${API_BASE_URL}/today/ai-analysis?scope=${scope}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': currentLang,
          ...(entityId ? { 'X-Entity-Id': entityId } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok || !response.body) throw new Error('AI analysis failed');

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
                setAnalysisText(accumulated);
              }
            } catch { /* skip */ }
          }
        }
      }
      setIsLoading(false);
    } catch {
      toast.error(t('common:errors.E9001', { defaultValue: 'An error occurred' }));
      setIsLoading(false);
    }
  }, [scope, t, i18n.language]);

  const handleSave = () => {
    if (!analysisText || isSaved) return;
    const title = generateReportTitle(scope, userName, reports);
    saveReport.mutate(
      { title, content: analysisText, scope },
      {
        onSuccess: () => {
          toast.success(t('today:ai.saved', { defaultValue: 'Report saved' }));
          setIsSaved(true);
        },
      },
    );
  };

  // 모달 열릴 때 자동 분석 시작
  useState(() => { handleAnalysis(); });

  const scopeLabel = scope === 'me'
    ? t('today:ai.generateMy', { defaultValue: 'AI Work Coaching' })
    : t('today:ai.generate', { defaultValue: 'AI Workload Analysis' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">{scopeLabel}</h3>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && analysisText && !isSaved && (
              <button
                onClick={handleSave}
                disabled={saveReport.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {t('today:ai.save', { defaultValue: 'Save Report' })}
              </button>
            )}
            {isSaved && (
              <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600">
                {t('today:ai.saved', { defaultValue: 'Saved' })}
              </span>
            )}
            {!isLoading && analysisText && (
              <button
                onClick={handleAnalysis}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('today:ai.regenerate', { defaultValue: 'Re-analyze' })}
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <QuotaExceededBanner />
          {isLoading && !analysisText && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="ml-2 text-sm text-gray-500">
                {t('today:ai.generating', { defaultValue: 'Analyzing...' })}
              </span>
            </div>
          )}
          {analysisText && (
            <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
              <ReactMarkdown>{analysisText}</ReactMarkdown>
            </div>
          )}
          {isLoading && analysisText && (
            <span className="mt-2 inline-block h-4 w-1 animate-pulse bg-indigo-500" />
          )}
          {!isLoading && analysisText && (
            <TranslatePanel sourceText={analysisText} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 저장된 리포트 목록 모달 ─────────────────────────────

interface ReportsModalProps {
  scope: Scope;
  onClose: () => void;
}

export function ReportsModal({ scope, onClose }: ReportsModalProps) {
  const { t } = useTranslation('today');
  const { data: reports = [] } = useTodayReports(scope);
  const deleteReport = useDeleteTodayReport();
  const [viewingReport, setViewingReport] = useState<TodayReportResponse | null>(null);

  const handleDelete = (reportId: string) => {
    if (!confirm(t('ai.deleteConfirm', { defaultValue: 'Delete this report?' }))) return;
    deleteReport.mutate(reportId, {
      onSuccess: () => {
        if (viewingReport?.reportId === reportId) setViewingReport(null);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('ai.savedReports', { defaultValue: 'Saved Reports' })}
            </h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {reports.length}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽: 리포트 목록 */}
          <div className={`${viewingReport ? 'w-64 border-r' : 'w-full'} overflow-y-auto`}>
            {reports.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-400">
                {t('ai.noReports', { defaultValue: 'No saved reports' })}
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <div
                    key={report.reportId}
                    className={`flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                      viewingReport?.reportId === report.reportId ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => setViewingReport(report)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{report.title}</p>
                      <p className="text-xs text-gray-500">
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
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 리포트 내용 */}
          {viewingReport && (
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-900">{viewingReport.title}</h4>
                <p className="text-xs text-gray-500">{new Date(viewingReport.createdAt).toLocaleString()}</p>
              </div>
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
                <ReactMarkdown>{viewingReport.content}</ReactMarkdown>
              </div>

              {/* 번역 */}
              <ReportTranslation reportId={viewingReport.reportId} reportContent={viewingReport.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 공통 번역 패널 ──────────────────────────────────────

interface TranslatePanelProps {
  sourceText: string;
  reportId?: string;
}

function TranslatePanel({ sourceText, reportId }: TranslatePanelProps) {
  const { t } = useTranslation('today');
  const [sourceLang, setSourceLang] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const translate = useTranslateContent();

  const handleSourceLang = (lang: string) => {
    setSourceLang(lang);
    setTargetLang(null);
    translate.reset();
  };

  const handleTargetLang = (lang: string) => {
    if (!sourceLang) return;
    setTargetLang(lang);
    translate.mutate({
      sourceType: 'REPORT',
      sourceId: reportId || '',
      sourceFields: ['content'],
      targetLang: lang,
      sourceText,
      sourceLang,
    });
  };

  const targetLangs = TRANSLATE_LANGS.filter((l) => l.code !== sourceLang);

  return (
    <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
      {/* 1단계: 원문 언어 선택 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Languages className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <span className="text-xs text-gray-500 flex-shrink-0">{t('ai.sourceLang', { defaultValue: 'Source language' })}:</span>
        {TRANSLATE_LANGS.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSourceLang(lang.code)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              sourceLang === lang.code
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>

      {/* 2단계: 번역할 언어 선택 */}
      {sourceLang && (
        <div className="flex items-center gap-2 flex-wrap">
          <Languages className="h-4 w-4 flex-shrink-0 text-indigo-400" />
          <span className="text-xs text-gray-500 flex-shrink-0">{t('ai.targetLang', { defaultValue: 'Translate to' })}:</span>
          {targetLangs.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleTargetLang(lang.code)}
              disabled={translate.isPending}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                targetLang === lang.code && translate.data
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {lang.flag} {lang.label}
            </button>
          ))}
          {translate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />}
        </div>
      )}

      {/* 번역 결과 */}
      {translate.data && targetLang && !translate.isPending && (
        <div className="mt-1 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
          <ReactMarkdown>{translate.data}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// ─── 리포트 번역 (Saved Reports) ─────────────────────────

function ReportTranslation({ reportId, reportContent }: { reportId: string; reportContent: string }) {
  return <TranslatePanel sourceText={reportContent} reportId={reportId} />;
}
