import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Check, X } from 'lucide-react';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useSaveTranslation } from '../hooks/useTranslations';

type SourceType = 'TODO' | 'MEETING_NOTE' | 'NOTICE' | 'ISSUE' | 'PROJECT' | 'PARTNER' | 'CLIENT';

interface SaveTranslationDialogProps {
  isOpen: boolean;
  sourceType: SourceType;
  sourceId: string;
  sourceFields: string[];
  originalContent: Record<string, string>;
  originalLang: string;
  onClose: () => void;
  onSaved: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const ALL_LANGS = ['ko', 'en', 'vi'] as const;

export default function SaveTranslationDialog({
  isOpen, sourceType, sourceId, sourceFields, originalContent: _originalContent, originalLang, onClose, onSaved,
}: SaveTranslationDialogProps) {
  const { t } = useTranslation('translation');
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const [phase, setPhase] = useState<'ask' | 'streaming' | 'preview' | 'editing'>('ask');
  const [streamedContent, setStreamedContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const saveMutation = useSaveTranslation();

  // Target languages (all except original)
  const availableTargets = ALL_LANGS.filter((l) => l !== originalLang);
  const [selectedTargets, setSelectedTargets] = useState<string[]>(availableTargets);
  const [completedResults, setCompletedResults] = useState<Record<string, string>>({});
  const [currentTargetLang, setCurrentTargetLang] = useState('');
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);

  if (!isOpen) return null;

  // Check localStorage
  const skipKey = `amb-skip-save-translation-${sourceType}`;
  if (localStorage.getItem(skipKey) === 'true') {
    onClose();
    return null;
  }

  const toggleTarget = (lang: string) => {
    setSelectedTargets((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const streamTranslation = async (targetLang: string, controller: AbortController): Promise<string> => {
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
        target_lang: targetLang,
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
                setStreamedContent(accumulated);
              }
              if (data.done) {
                return data.fullContent || accumulated;
              }
            } catch { /* ignore */ }
          }
        }
      }
    }
    return accumulated;
  };

  const handleYes = async () => {
    if (selectedTargets.length === 0) return;

    setPhase('streaming');
    setStreamedContent('');
    setCompletedResults({});

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const results: Record<string, string> = {};

      for (let i = 0; i < selectedTargets.length; i++) {
        const targetLang = selectedTargets[i];
        setCurrentTargetLang(targetLang);
        setCurrentTargetIndex(i);
        setStreamedContent('');

        const result = await streamTranslation(targetLang, controller);
        results[targetLang] = result;
        setCompletedResults({ ...results });
      }

      // Use the last target's content for editing
      const lastLang = selectedTargets[selectedTargets.length - 1];
      setEditContent(results[lastLang] || '');
      setPhase('preview');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Translation error:', err);
      }
      setPhase('ask');
    }
  };

  const handleNo = () => {
    if (dontAskAgain) {
      localStorage.setItem(skipKey, 'true');
    }
    onClose();
  };

  const handleSaveAsIs = () => {
    // Translation was already saved by the streaming endpoint
    onSaved();
    onClose();
  };

  const handleEditAndSave = () => {
    setPhase('editing');
  };

  const handleSaveEdited = async () => {
    const translatedContent: Record<string, string> = {};
    if (sourceFields.length === 1) {
      translatedContent[sourceFields[0]] = editContent;
    } else {
      translatedContent[sourceFields[0]] = editContent;
    }

    // Save edited version for the last target language
    const lastLang = selectedTargets[selectedTargets.length - 1];
    await saveMutation.mutateAsync({
      source_type: sourceType,
      source_id: sourceId,
      target_lang: lastLang,
      translated_content: translatedContent,
      method: 'AI_EDITED',
    });
    onSaved();
    onClose();
  };

  // Build dynamic title/description based on target languages
  const targetLangNames = selectedTargets.map((l) => t(`lang.${l}`)).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('save.titleDynamic', { langs: targetLangNames })}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          {phase === 'ask' && (
            <div>
              <p className="text-sm text-gray-600">
                {t('save.descriptionDynamic', { langs: targetLangNames })}
              </p>

              {/* Target language selection */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">{t('save.selectTargetLangs')}</p>
                {availableTargets.map((lang) => (
                  <label key={lang} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTargets.includes(lang)}
                      onChange={() => toggleTarget(lang)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{t(`lang.${lang}`)}</span>
                  </label>
                ))}
              </div>

              <label className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dontAskAgain}
                  onChange={(e) => setDontAskAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm text-gray-500">{t('save.dontAskAgain')}</span>
              </label>
            </div>
          )}

          {phase === 'streaming' && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('save.generatingLang', { lang: t(`lang.${currentTargetLang}`), current: currentTargetIndex + 1, total: selectedTargets.length })}
              </div>
              {/* Show completed results */}
              {Object.entries(completedResults).map(([lang, content]) => (
                <div key={lang} className="mb-2">
                  <span className="text-xs font-medium text-green-600">✓ {t(`lang.${lang}`)}</span>
                  <div className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md bg-green-50 p-2 text-xs text-gray-700">
                    {content.slice(0, 200)}{content.length > 200 ? '...' : ''}
                  </div>
                </div>
              ))}
              {/* Current streaming */}
              {streamedContent && (
                <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                  {streamedContent}
                </div>
              )}
            </div>
          )}

          {phase === 'preview' && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {t('save.generatedAll', { count: selectedTargets.length })}
              </div>
              {Object.entries(completedResults).map(([lang, content]) => (
                <div key={lang} className="mb-3">
                  <span className="text-xs font-semibold text-gray-600">{t(`lang.${lang}`)}</span>
                  <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                    {content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {phase === 'editing' && (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {phase === 'ask' && (
            <>
              <button onClick={handleNo} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {t('save.no')}
              </button>
              <button
                onClick={handleYes}
                disabled={selectedTargets.length === 0}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('save.yes')}
              </button>
            </>
          )}
          {phase === 'preview' && (
            <>
              <button onClick={handleEditAndSave} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {t('save.editAndSave')}
              </button>
              <button onClick={handleSaveAsIs} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                {t('save.saveAsIs')}
              </button>
            </>
          )}
          {phase === 'editing' && (
            <>
              <button onClick={() => setPhase('preview')} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {t('edit.cancel')}
              </button>
              <button onClick={handleSaveEdited} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                {t('edit.save')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
