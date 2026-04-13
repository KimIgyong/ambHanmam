import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useApplyExtraction } from '../hooks/useDocBuilder';
import {
  ExtractionResultResponse,
  ConflictReportResponse,
  GapReportResponse,
} from '../service/doc-builder.service';
import DriveDocumentPicker from './DriveDocumentPicker';
import ExtractionProgressPanel from './ExtractionProgressPanel';
import ConflictResolutionPanel from './ConflictResolutionPanel';
import GapAnalysisPanel from './GapAnalysisPanel';
import { Wand2, FolderOpen, Cpu, AlertTriangle, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface InitialSetupWizardProps {
  onComplete: () => void;
}

interface BatchEvent {
  type: 'progress' | 'file_done' | 'error' | 'complete';
  fileId?: string;
  fileName?: string;
  current?: number;
  total?: number;
  result?: ExtractionResultResponse;
  error?: string;
}

const STEPS = ['selectFiles', 'extract', 'resolve', 'apply'] as const;
type Step = typeof STEPS[number];

export default function InitialSetupWizard({ onComplete }: InitialSetupWizardProps) {
  const { t, i18n } = useTranslation('kms');
  const language = i18n.language === 'ko' ? 'ko' : i18n.language === 'vi' ? 'vi' : 'en';
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);

  const [step, setStep] = useState<Step>('selectFiles');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Extraction state
  const [extractionEvents, setExtractionEvents] = useState<BatchEvent[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [allExtractions, setAllExtractions] = useState<ExtractionResultResponse[]>([]);

  // Conflict/Gap state
  const [conflicts, setConflicts] = useState<ConflictReportResponse | null>(null);
  const [gaps, setGaps] = useState<GapReportResponse | null>(null);
  const [resolvedData, setResolvedData] = useState<Record<string, any>>({});

  const applyExtraction = useApplyExtraction();
  const abortRef = useRef<AbortController | null>(null);

  const stepIndex = STEPS.indexOf(step);

  // Step 2: Run batch extraction via SSE
  const startExtraction = useCallback(async () => {
    if (!entityId || selectedFileIds.length === 0) return;

    setIsExtracting(true);
    setExtractionEvents([]);
    setAllExtractions([]);
    abortRef.current = new AbortController();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

    try {
      const response = await fetch(`${API_BASE_URL}/kms/doc-builder/extract/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
          ...(entityId ? { 'X-Entity-Id': entityId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ file_ids: selectedFileIds }),
        signal: abortRef.current.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      const results: ExtractionResultResponse[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: BatchEvent = JSON.parse(line.slice(6));
              setExtractionEvents((prev) => [...prev, event]);

              if (event.type === 'file_done' && event.result) {
                results.push(event.result);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setAllExtractions(results);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setExtractionEvents((prev) => [...prev, { type: 'error', error: error.message }]);
      }
    } finally {
      setIsExtracting(false);
    }
  }, [entityId, selectedFileIds, language]);

  // Step 3: Analyze conflicts and gaps
  const analyzeResults = useCallback(async () => {
    if (!entityId || allExtractions.length === 0) return;

    // Detect conflicts between multiple sources
    if (allExtractions.length > 1) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      try {
        const res = await fetch(`${API_BASE_URL}/kms/doc-builder/conflicts/detect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(entityId ? { 'X-Entity-Id': entityId } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ extractions: allExtractions }),
        });
        const data = await res.json();
        setConflicts(data.data || { totalConflicts: 0, items: [] });
      } catch {
        setConflicts({ totalConflicts: 0, items: [] });
      }
    } else {
      setConflicts({ totalConflicts: 0, items: [] });
    }

    // Gap analysis
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await fetch(`${API_BASE_URL}/kms/doc-builder/gaps?language=${language}`, {
        headers: { ...(entityId ? { 'X-Entity-Id': entityId } : {}) },
        credentials: 'include',
      });
      const data = await res.json();
      setGaps(data.data || { totalGaps: 0, criticalGaps: 0, items: [] });
    } catch {
      setGaps({ totalGaps: 0, criticalGaps: 0, items: [] });
    }
  }, [entityId, allExtractions, language]);

  // Step 4: Apply extractions
  const handleApply = async () => {
    // Merge all extractions, applying conflict resolutions
    const merged: Record<string, Record<string, any>> = {};

    for (const extraction of allExtractions) {
      for (const cat of extraction.categories) {
        if (!merged[cat.categoryCode]) merged[cat.categoryCode] = {};
        merged[cat.categoryCode] = { ...merged[cat.categoryCode], ...cat.data };
      }
    }

    // Override with conflict resolutions
    for (const resolution of Object.values(resolvedData)) {
      const r = resolution as { categoryCode: string; fieldKey: string; value: any };
      if (!merged[r.categoryCode]) merged[r.categoryCode] = {};
      merged[r.categoryCode][r.fieldKey] = r.value;
    }

    const extractions = Object.entries(merged).map(([categoryCode, data]) => ({
      categoryCode,
      data,
      language,
    }));

    await applyExtraction.mutateAsync({ extractions });
    onComplete();
  };

  const handleNext = async () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= STEPS.length) return;

    if (step === 'selectFiles') {
      setStep('extract');
      startExtraction();
    } else if (step === 'extract') {
      setStep('resolve');
      analyzeResults();
    } else if (step === 'resolve') {
      setStep('apply');
    }
  };

  const handleBack = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx < 0) return;
    setStep(STEPS[prevIdx]);
  };

  const canProceed = () => {
    if (step === 'selectFiles') return selectedFileIds.length > 0;
    if (step === 'extract') return !isExtracting && allExtractions.length > 0;
    if (step === 'resolve') return true;
    return true;
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Wand2 className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{t('docBuilder.wizard.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('docBuilder.wizard.subtitle')}</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          const icons = [FolderOpen, Cpu, AlertTriangle, Check];
          const Icon = icons[i];
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isDone
                    ? 'bg-green-100 text-green-700'
                    : isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < stepIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Title */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t(`docBuilder.wizard.step${stepIndex + 1}Title`)}
      </h2>

      {/* Step Content */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        {step === 'selectFiles' && (
          <DriveDocumentPicker
            selectedFileIds={selectedFileIds}
            onSelectionChange={setSelectedFileIds}
          />
        )}

        {step === 'extract' && (
          <ExtractionProgressPanel events={extractionEvents} isRunning={isExtracting} />
        )}

        {step === 'resolve' && (
          <div className="space-y-6">
            {conflicts && (
              <ConflictResolutionPanel
                conflicts={conflicts}
                onResolved={setResolvedData}
              />
            )}
            {gaps && <GapAnalysisPanel gaps={gaps} />}
            {!conflicts && !gaps && (
              <div className="py-6 text-center text-sm text-gray-400">
                {t('docBuilder.wizard.analyzing')}
              </div>
            )}
          </div>
        )}

        {step === 'apply' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('docBuilder.wizard.readyToApply')}
            </h3>
            <p className="text-sm text-gray-500">
              {allExtractions.reduce((sum, e) => sum + e.categories.length, 0)} {t('docBuilder.wizard.categoriesToApply')}
            </p>
            <button
              onClick={handleApply}
              disabled={applyExtraction.isPending}
              className="mt-4 w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {applyExtraction.isPending
                ? t('docBuilder.wizard.applying')
                : t('docBuilder.wizard.applyButton')}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step !== 'apply' && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('docBuilder.wizard.back')}
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('docBuilder.wizard.next')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
