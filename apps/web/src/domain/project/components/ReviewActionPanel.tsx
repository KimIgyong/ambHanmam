import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, PauseCircle, MessageSquare, Loader2 } from 'lucide-react';
import { usePerformReviewAction } from '../hooks/useProjectReview';

interface ReviewActionPanelProps {
  projectId: string;
  currentStatus: string;
}

export default function ReviewActionPanel({ projectId, currentStatus }: ReviewActionPanelProps) {
  const { t } = useTranslation('project');
  const [comment, setComment] = useState('');
  const [step, setStep] = useState(1);
  const performAction = usePerformReviewAction();

  const canReview = currentStatus === 'SUBMITTED' || currentStatus === 'REVIEW';

  const handleAction = (action: string) => {
    performAction.mutate(
      { projectId, data: { action, comment: comment || undefined, step } },
      {
        onSuccess: () => {
          setComment('');
        },
      },
    );
  };

  if (!canReview) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('review.title')}</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('review.step')}</label>
          <select
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value={1}>Step 1</option>
            <option value={2}>Step 2</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('review.comment')}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleAction('APPROVE')}
            disabled={performAction.isPending}
            className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {performAction.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t('review.approve')}
          </button>
          <button
            onClick={() => handleAction('REJECT')}
            disabled={performAction.isPending}
            className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            {t('review.reject')}
          </button>
          <button
            onClick={() => handleAction('HOLD')}
            disabled={performAction.isPending}
            className="flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            <PauseCircle className="h-4 w-4" />
            {t('review.hold')}
          </button>
          <button
            onClick={() => handleAction('COMMENT')}
            disabled={performAction.isPending || !comment.trim()}
            className="flex items-center gap-1.5 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            {t('review.comment')}
          </button>
        </div>
      </div>
    </div>
  );
}
