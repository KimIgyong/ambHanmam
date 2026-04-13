import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useProjectDetail, useSubmitProposal } from '../hooks/useProject';
import { useReviewHistory, useGeneratePreAnalysis } from '../hooks/useProjectReview';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import AiAnalysisPanel from '../components/AiAnalysisPanel';
import SimilarProjectsList from '../components/SimilarProjectsList';
import ReviewActionPanel from '../components/ReviewActionPanel';
import ProjectMemberList from '../components/ProjectMemberList';
import { LocalDateTime } from '@/components/common/LocalDateTime';

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('project');

  const { data: project, isLoading } = useProjectDetail(id!);
  const { data: reviews = [] } = useReviewHistory(id!);
  const submitProposal = useSubmitProposal();
  const generateAnalysis = useGeneratePreAnalysis();

  if (isLoading || !project) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading...</div>;
  }

  const canSubmit = project.status === 'DRAFT' || project.status === 'REJECTED';
  const canReview = project.status === 'SUBMITTED' || project.status === 'REVIEW';

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/project/proposals')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">{project.code}</p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        {canSubmit && (
          <button
            onClick={() => submitProposal.mutate({ id: project.projectId })}
            disabled={submitProposal.isPending}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitProposal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('proposal.submit')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            {project.title && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase">{t('proposal.title')}</h3>
                <p className="mt-1 text-sm text-gray-900">{project.title}</p>
              </div>
            )}
            {project.purpose && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase">{t('proposal.purpose')}</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{project.purpose}</p>
              </div>
            )}
            {project.goal && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase">{t('proposal.goal')}</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{project.goal}</p>
              </div>
            )}
            {project.summary && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase">{t('proposal.summary')}</h3>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{project.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-500">{t('project.category')}</span>
                <p className="text-sm font-medium">{project.category ? t(`category.${project.category}`) : '-'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t('project.priority')}</span>
                <p className="text-sm font-medium">{t(`priority.${project.priority}`)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t('project.proposer')}</span>
                <p className="text-sm font-medium">{project.proposerName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">{t('project.manager')}</span>
                <p className="text-sm font-medium">{project.managerName || '-'}</p>
              </div>
              {project.budget && (
                <>
                  <div>
                    <span className="text-xs text-gray-500">{t('project.budget')}</span>
                    <p className="text-sm font-medium">{Number(project.budget).toLocaleString()} {project.currency}</p>
                  </div>
                </>
              )}
              {project.startDate && (
                <div>
                  <span className="text-xs text-gray-500">{t('project.startDate')}</span>
                  <p className="text-sm font-medium">{project.startDate}</p>
                </div>
              )}
              {project.endDate && (
                <div>
                  <span className="text-xs text-gray-500">{t('project.endDate')}</span>
                  <p className="text-sm font-medium">{project.endDate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Review History */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('review.history')}</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">{t('review.noReviews')}</p>
            ) : (
              <div className="space-y-2">
                {reviews.map((r) => (
                  <div key={r.reviewId} className="flex items-start gap-3 rounded bg-gray-50 p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{r.reviewerName}</span>
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          r.action === 'APPROVE' ? 'bg-green-100 text-green-700' :
                          r.action === 'REJECT' ? 'bg-red-100 text-red-700' :
                          r.action === 'HOLD' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {t(`review.${r.action.toLowerCase()}`, r.action)}
                        </span>
                        <span className="text-xs text-gray-400">Step {r.step}</span>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                      <p className="text-xs text-gray-400 mt-1">{<LocalDateTime value={r.createdAt} format='YYYY-MM-DD HH:mm' />}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Action */}
          {canReview && <ReviewActionPanel projectId={project.projectId} currentStatus={project.status} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <AiAnalysisPanel
            analysisJson={project.aiAnalysisJson}
            onGenerate={() => generateAnalysis.mutate(project.projectId)}
            isGenerating={generateAnalysis.isPending}
          />
          <SimilarProjectsList similarProjectsJson={project.similarProjectsJson} />
          <ProjectMemberList projectId={project.projectId} />
        </div>
      </div>
    </div>
  );
}
