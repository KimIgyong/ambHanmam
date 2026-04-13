import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Download,
  Upload,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';
import { DocGeneratedResponse, DiffAnalysisResponse, SectionDiffResponse } from '../service/doc-builder.service';
import { docBuilderService } from '../service/doc-builder.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import {
  useReUploadDocument,
  useTransitionDocument,
  useDocumentTimeline,
  useValidTransitions,
} from '../hooks/useDocBuilder';

interface Props {
  document: DocGeneratedResponse;
  onBack: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700' },
  APPROVED: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  FINALIZED: { bg: 'bg-green-50', text: 'text-green-700' },
  OUTDATED: { bg: 'bg-red-50', text: 'text-red-700' },
  ARCHIVED: { bg: 'bg-gray-50', text: 'text-gray-500' },
};

const ACTION_ICONS: Record<string, typeof FileText> = {
  GENERATED: FileText,
  REVIEW_REQUESTED: Clock,
  APPROVED: CheckCircle,
  FINALIZED: CheckCircle,
  RE_UPLOADED: Upload,
  DIFF_ANALYZED: AlertTriangle,
};

export default function DocumentDetailPanel({ document: doc, onBack }: Props) {
  const { t } = useTranslation('kms');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [diffResult, setDiffResult] = useState<DiffAnalysisResponse | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const reUploadMutation = useReUploadDocument();
  const transitionMutation = useTransitionDocument();
  const { data: timeline } = useDocumentTimeline(doc.dgnId);
  const { data: validTransitions } = useValidTransitions(doc.dgnId);

  const statusStyle = STATUS_STYLES[doc.dgnStatus] || STATUS_STYLES.DRAFT;

  const handleDownload = async () => {
    const blob = await docBuilderService.downloadDocument(doc.dgnId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.dgnTitle.replace(/[^a-zA-Z0-9가-힣\s]/g, '_')}.${doc.dgnFileFormat || 'pptx'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await reUploadMutation.mutateAsync({ dgnId: doc.dgnId, file });
    setDiffResult(result);
  };

  const handleTransition = async (targetStatus: string) => {
    await transitionMutation.mutateAsync({ dgnId: doc.dgnId, status: targetStatus });
  };

  const getAudienceLabel = (aud: string) => {
    const key = `docBuilder.audience${aud.charAt(0) + aud.slice(1).toLowerCase()}` as const;
    return t(key);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{doc.dgnTitle}</h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className={`rounded px-2 py-0.5 font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {doc.dgnStatus}
              </span>
              <span>{getAudienceLabel(doc.dgnAudienceType)}</span>
              <span className="uppercase">{doc.dgnFileFormat}</span>
              <span>{<LocalDateTime value={doc.dgnCreatedAt} format='YYYY-MM-DD HH:mm' />}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            {t('docBuilder.download')}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={reUploadMutation.isPending}
            className="flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {reUploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {t('docBuilder.reUpload')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx,.docx"
            className="hidden"
            onChange={handleReUpload}
          />
        </div>
      </div>

      {/* Lifecycle Actions */}
      {validTransitions && validTransitions.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="mb-2 text-xs font-medium text-blue-700">{t('docBuilder.availableActions')}</p>
          <div className="flex gap-2">
            {validTransitions.map((status) => (
              <button
                key={status}
                onClick={() => handleTransition(status)}
                disabled={transitionMutation.isPending}
                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm hover:bg-blue-50 disabled:opacity-50"
              >
                <ChevronRight className="mr-1 inline h-3 w-3" />
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diff Result */}
      {diffResult && (
        <div className="mb-6 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('docBuilder.diffSummary')}</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{diffResult.summary.totalSections}</p>
                <p className="text-xs text-gray-500">{t('docBuilder.totalSections')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{diffResult.summary.modifiedSections}</p>
                <p className="text-xs text-gray-500">{t('docBuilder.modified')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{diffResult.summary.addedSections}</p>
                <p className="text-xs text-gray-500">{t('docBuilder.added')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{Math.round(diffResult.summary.overallSimilarity * 100)}%</p>
                <p className="text-xs text-gray-500">{t('docBuilder.similarity')}</p>
              </div>
            </div>
          </div>

          {/* Section Diffs */}
          {diffResult.sectionDiffs
            .filter((d) => d.changeType !== 'UNCHANGED')
            .map((diff) => (
              <DiffSectionCard key={diff.sectionCode} diff={diff} />
            ))}

          {/* Data Update Proposals */}
          {diffResult.dataUpdateProposals.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-orange-800">{t('docBuilder.dataUpdateProposals')}</h3>
              <div className="space-y-2">
                {diffResult.dataUpdateProposals.map((p, i) => (
                  <div key={i} className="rounded-md bg-white p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{p.categoryName} &middot; {p.field}</span>
                      <span className="text-xs text-gray-400">{Math.round(p.confidence * 100)}%</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{p.reason}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-red-500 line-through">{JSON.stringify(p.currentValue)}</span>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-green-600">{JSON.stringify(p.proposedValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Toggle */}
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <Clock className="h-4 w-4" />
        {t('docBuilder.timeline')}
        <ChevronRight className={`h-4 w-4 transition-transform ${showTimeline ? 'rotate-90' : ''}`} />
      </button>

      {/* Timeline */}
      {showTimeline && timeline && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="space-y-3">
            {timeline.map((entry) => {
              const Icon = ACTION_ICONS[entry.dehAction] || FileText;
              return (
                <div key={entry.dehId} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{entry.dehAction}</span>
                      {entry.user && <span className="text-gray-500"> &middot; {entry.user.name}</span>}
                    </p>
                    {entry.dehNotes && <p className="text-xs text-gray-500">{entry.dehNotes}</p>}
                    <p className="text-xs text-gray-400">{<LocalDateTime value={entry.dehCreatedAt} format='YYYY-MM-DD HH:mm' />}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DiffSectionCard({ diff }: { diff: SectionDiffResponse }) {
  const [expanded, setExpanded] = useState(false);
  const typeColors = {
    ADDED: 'border-green-200 bg-green-50',
    REMOVED: 'border-red-200 bg-red-50',
    MODIFIED: 'border-yellow-200 bg-yellow-50',
    UNCHANGED: 'border-gray-200 bg-gray-50',
  };

  return (
    <div className={`rounded-lg border p-3 ${typeColors[diff.changeType]}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase">{diff.changeType}</span>
          <span className="text-sm font-medium text-gray-900">{diff.sectionName}</span>
          <span className="text-xs text-gray-500">{Math.round(diff.similarity * 100)}%</span>
        </div>
        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && diff.changes.length > 0 && (
        <div className="mt-3 max-h-60 overflow-auto rounded bg-white p-2 font-mono text-xs">
          {diff.changes.slice(0, 50).map((change, i) => (
            <div
              key={i}
              className={`px-2 py-0.5 ${
                change.type === 'added'
                  ? 'bg-green-50 text-green-800'
                  : change.type === 'removed'
                  ? 'bg-red-50 text-red-800'
                  : 'text-gray-600'
              }`}
            >
              <span className="mr-2 inline-block w-4 text-right text-gray-400">
                {change.type === 'added' ? <Plus className="inline h-3 w-3" /> : change.type === 'removed' ? <Minus className="inline h-3 w-3" /> : ''}
              </span>
              {change.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
