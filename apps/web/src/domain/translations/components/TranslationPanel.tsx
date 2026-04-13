import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '@/global/util/sanitize';
import { Languages, AlertTriangle, CheckCircle, Loader2, RefreshCw, Edit3, History, Globe, ArrowRightLeft } from 'lucide-react';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useContentTranslations } from '../hooks/useTranslations';
import { translationService } from '../service/translation.service';
import { TranslationSummary } from '@amb/types';
import TranslationEditModal from './TranslationEditModal';
import TranslationHistoryModal from './TranslationHistoryModal';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { formatDateTimeInTz } from '@/lib/format-utils';

interface TranslationPanelProps {
  sourceType: 'TODO' | 'MEETING_NOTE' | 'NOTICE' | 'ISSUE' | 'ISSUE_COMMENT' | 'PROJECT' | 'PARTNER' | 'CLIENT';
  sourceId: string;
  sourceFields: string[];
  originalLang: string;
  originalContent: Record<string, string>;
  onOriginalLangChange?: (lang: string) => void;
}

const LANG_TABS = ['ko', 'en', 'vi'] as const;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export default function TranslationPanel({
  sourceType, sourceId, sourceFields, originalLang, originalContent,
  onOriginalLangChange,
}: TranslationPanelProps) {
  const { t } = useTranslation('translation');
  const { timezone } = useTimezoneStore();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const [activeLang, setActiveLang] = useState<string>('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [_selectedTrnId, setSelectedTrnId] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const [isBulkTranslating, setIsBulkTranslating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, lang: '' });
  const [currentOriginalLang, setCurrentOriginalLang] = useState(originalLang);
  const [showLangSelector, setShowLangSelector] = useState(false);

  const { data: translations, refetch } = useContentTranslations(sourceType, sourceId);

  // Sync prop changes
  useEffect(() => {
    setCurrentOriginalLang(originalLang);
  }, [originalLang]);

  // Set initial tab to a different language than original
  useEffect(() => {
    if (!activeLang) {
      const defaultLang = currentOriginalLang === 'en' ? 'ko' : 'en';
      setActiveLang(defaultLang);
    }
  }, [currentOriginalLang, activeLang]);

  const handleOriginalLangChange = async (newLang: string) => {
    if (newLang === currentOriginalLang) {
      setShowLangSelector(false);
      return;
    }
    try {
      await translationService.updateOriginalLang(sourceType, sourceId, newLang);
      setCurrentOriginalLang(newLang);
      onOriginalLangChange?.(newLang);
      // 탭이 새 원본 언어와 같으면 다른 언어로 전환
      if (activeLang === newLang) {
        setActiveLang(newLang === 'en' ? 'ko' : 'en');
      }
      refetch();
    } catch (err) {
      console.error('Failed to update original lang:', err);
    }
    setShowLangSelector(false);
  };

  const getSummaryForLang = (lang: string): TranslationSummary | undefined => {
    return (translations as TranslationSummary[])?.find((s) => s.lang === lang);
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('amb-lang') || 'en',
      };
      if (entityId) {
        headers['X-Entity-Id'] = entityId;
      }

      const response = await fetch(`${API_BASE_URL}/translations/translate`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          source_type: sourceType,
          source_id: sourceId,
          source_fields: sourceFields,
          target_lang: activeLang,
        }),
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulated += data.content;
                  setStreamingContent(accumulated);
                }
                if (data.done) {
                  setIsTranslating(false);
                  refetch();
                  return;
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Translation error:', err);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleReTranslate = async (trnId: string) => {
    setIsTranslating(true);
    setStreamingContent('');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept-Language': localStorage.getItem('amb-lang') || 'en',
      };
      if (entityId) {
        headers['X-Entity-Id'] = entityId;
      }

      const response = await fetch(`${API_BASE_URL}/translations/${trnId}/re-translate`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulated += data.content;
                  setStreamingContent(accumulated);
                }
                if (data.done) {
                  setIsTranslating(false);
                  refetch();
                  return;
                }
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch (err) {
      console.error('Re-translate error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const activeSummary = getSummaryForLang(activeLang);
  const isOriginalLang = activeLang === currentOriginalLang;

  // Bulk translate: translate to all non-original languages sequentially
  const handleBulkTranslate = async () => {
    const targetLangs = LANG_TABS.filter((l) => l !== currentOriginalLang);
    setIsBulkTranslating(true);
    setBulkProgress({ current: 0, total: targetLangs.length, lang: '' });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      for (let i = 0; i < targetLangs.length; i++) {
        const lang = targetLangs[i];
        setBulkProgress({ current: i + 1, total: targetLangs.length, lang });
        setActiveLang(lang);
        setStreamingContent('');
        setIsTranslating(true);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept-Language': localStorage.getItem('amb-lang') || 'en',
        };
        if (entityId) headers['X-Entity-Id'] = entityId;

        const response = await fetch(`${API_BASE_URL}/translations/translate`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            source_type: sourceType,
            source_id: sourceId,
            source_fields: sourceFields,
            target_lang: lang,
          }),
          signal: controller.signal,
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    accumulated += data.content;
                    setStreamingContent(accumulated);
                  }
                  if (data.done) break;
                } catch { /* ignore */ }
              }
            }
          }
        }
      }
      refetch();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Bulk translation error:', err);
      }
    } finally {
      setIsTranslating(false);
      setIsBulkTranslating(false);
      setStreamingContent('');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'FRESH':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"><CheckCircle className="h-3 w-3" /> FRESH</span>;
      case 'STALE':
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700"><AlertTriangle className="h-3 w-3" /> STALE</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">NONE</span>;
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('panel.title')}</span>
          {/* 원본 언어 변경 */}
          <div className="relative">
            <button
              onClick={() => setShowLangSelector(!showLangSelector)}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
              title={t('panel.changeOriginalLang')}
            >
              <ArrowRightLeft className="h-3 w-3" />
              {t('panel.originalLangLabel', { lang: t(`lang.${currentOriginalLang}`) })}
            </button>
            {showLangSelector && (
              <div className="absolute left-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white shadow-lg">
                {LANG_TABS.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleOriginalLangChange(lang)}
                    className={`block w-full px-4 py-1.5 text-left text-xs hover:bg-gray-100 ${
                      lang === currentOriginalLang ? 'bg-indigo-50 font-medium text-indigo-600' : 'text-gray-700'
                    }`}
                  >
                    {t(`lang.${lang}`)}
                    {lang === currentOriginalLang && ' ✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleBulkTranslate}
          disabled={isTranslating || isBulkTranslating}
          className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
        >
          {isBulkTranslating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('panel.translateAllProgress', { current: bulkProgress.current, total: bulkProgress.total })}
            </>
          ) : (
            <>
              <Globe className="h-3 w-3" />
              {t('panel.translateAll')}
            </>
          )}
        </button>
      </div>

      {/* Lang Tabs */}
      <div className="flex border-b border-gray-200">
        {LANG_TABS.map((lang) => {
          const summary = getSummaryForLang(lang);
          const isActive = activeLang === lang;
          const isOrig = lang === currentOriginalLang;

          return (
            <button
              key={lang}
              onClick={() => { setActiveLang(lang); setStreamingContent(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(`lang.${lang}`)}
              {isOrig && <span className="text-xs text-gray-400">({t('panel.original')})</span>}
              {!isOrig && summary && getStatusBadge(summary.status)}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="p-4">
        {isOriginalLang ? (
          <div className="space-y-2">
            {sourceFields.map((field) => (
              <div key={field}>
                <span className="text-xs font-medium uppercase text-gray-400">{field}</span>
                <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(originalContent[field]) }} />
              </div>
            ))}
          </div>
        ) : isTranslating ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('panel.translating')}
            </div>
            {streamingContent && (
              <div className="whitespace-pre-wrap rounded-md bg-white p-3 text-sm text-gray-700 shadow-sm">
                {streamingContent}
              </div>
            )}
          </div>
        ) : activeSummary && activeSummary.status !== 'NONE' ? (
          <div className="space-y-3">
            {activeSummary.status === 'STALE' && (
              <div className="flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                {t('panel.staleWarning')}
              </div>
            )}
            <div className="space-y-2">
              {activeSummary.title && (
                <div>
                  <span className="text-xs font-medium uppercase text-gray-400">title</span>
                  <div className="mt-1 text-sm font-medium text-gray-800">{activeSummary.title}</div>
                </div>
              )}
              {activeSummary.content && (
                <div>
                  <span className="text-xs font-medium uppercase text-gray-400">content</span>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeSummary.content) }} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {activeSummary.method === 'AI' ? t('panel.aiTranslated') : t('panel.humanEdited')}
                {activeSummary.translatedAt && ` · ${formatDateTimeInTz(activeSummary.translatedAt, timezone, 'YYYY-MM-DD HH:mm')}`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedTrnId(''); setEditModalOpen(true); }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                >
                  <Edit3 className="h-3 w-3" /> {t('panel.editTranslation')}
                </button>
                <button
                  onClick={() => handleReTranslate('')}
                  className="flex items-center gap-1 rounded px-2 py-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                >
                  <RefreshCw className="h-3 w-3" /> {t('panel.reTranslate')}
                </button>
                <button
                  onClick={() => { setSelectedTrnId(''); setHistoryModalOpen(true); }}
                  className="flex items-center gap-1 rounded px-2 py-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                >
                  <History className="h-3 w-3" /> {t('panel.history')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">{t('panel.noTranslation', { lang: t(`lang.${activeLang}`) })}</p>
            <p className="mt-1 text-xs text-gray-400">{t('panel.noTranslationDesc')}</p>
            <button
              onClick={handleTranslate}
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('panel.translateTo', { lang: t(`lang.${activeLang}`) })}
            </button>
          </div>
        )}
      </div>

      {editModalOpen && (
        <TranslationEditModal
          sourceType={sourceType}
          sourceId={sourceId}
          targetLang={activeLang}
          onClose={() => { setEditModalOpen(false); refetch(); }}
        />
      )}

      {historyModalOpen && (
        <TranslationHistoryModal
          sourceType={sourceType}
          sourceId={sourceId}
          targetLang={activeLang}
          onClose={() => setHistoryModalOpen(false)}
        />
      )}
    </div>
  );
}
