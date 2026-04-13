import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface SimilarProject {
  projectId: string;
  projectName: string;
  similarityScore: number;
  reason: string;
}

interface SimilarProjectsListProps {
  similarProjectsJson: string | null;
  onCheck?: () => void;
  isChecking?: boolean;
}

export default function SimilarProjectsList({ similarProjectsJson, onCheck, isChecking }: SimilarProjectsListProps) {
  const { t } = useTranslation('project');

  const projects: SimilarProject[] = similarProjectsJson
    ? (() => { try { return JSON.parse(similarProjectsJson); } catch { return []; } })()
    : [];

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-900">{t('similar.title')}</h3>
        </div>
        {onCheck && (
          <button
            onClick={onCheck}
            disabled={isChecking}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {t('similar.check')}
          </button>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-800">{t('similar.warning')}</p>
          {projects.map((p) => (
            <div key={p.projectId} className="rounded bg-white p-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">{p.projectName}</span>
                <span className="text-amber-700 font-medium">
                  {t('similar.score')}: {Math.round(p.similarityScore * 100)}%
                </span>
              </div>
              <p className="text-gray-500 text-xs mt-0.5">{p.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-600">{t('similar.noSimilar')}</p>
      )}
    </div>
  );
}
