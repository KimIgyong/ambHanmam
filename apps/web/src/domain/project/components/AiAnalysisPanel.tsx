import { useTranslation } from 'react-i18next';
import { Brain, Loader2 } from 'lucide-react';

interface AiAnalysisPanelProps {
  analysisJson: string | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export default function AiAnalysisPanel({ analysisJson, onGenerate, isGenerating }: AiAnalysisPanelProps) {
  const { t } = useTranslation('project');

  const analysis = analysisJson ? (() => { try { return JSON.parse(analysisJson); } catch { return null; } })() : null;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-purple-900">{t('review.preAnalysis')}</h3>
        </div>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {t('review.generateAnalysis')}
          </button>
        )}
      </div>

      {analysis ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{t('review.feasibilityScore')}:</span>
            <span className={`text-lg font-bold ${
              analysis.feasibilityScore >= 7 ? 'text-green-600' :
              analysis.feasibilityScore >= 4 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analysis.feasibilityScore}/10
            </span>
          </div>

          {analysis.strengths?.length > 0 && (
            <div>
              <p className="font-medium text-green-700 mb-1">{t('review.strengths')}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                {analysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {analysis.weaknesses?.length > 0 && (
            <div>
              <p className="font-medium text-red-700 mb-1">{t('review.weaknesses')}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                {analysis.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {analysis.risks?.length > 0 && (
            <div>
              <p className="font-medium text-orange-700 mb-1">{t('review.risks')}</p>
              <ul className="space-y-1">
                {analysis.risks.map((r: { description: string; severity: string; mitigation: string }, i: number) => (
                  <li key={i} className="text-gray-600">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs mr-1 ${
                      r.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                      r.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>{r.severity}</span>
                    {r.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-purple-200">
            <span className="font-medium text-gray-700">{t('ai.recommendation')}: </span>
            <span className={`font-bold ${
              analysis.recommendation === 'APPROVE' ? 'text-green-600' :
              analysis.recommendation === 'CONDITIONAL' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analysis.recommendation}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-purple-600">{t('review.generateAnalysis')}</p>
      )}
    </div>
  );
}
