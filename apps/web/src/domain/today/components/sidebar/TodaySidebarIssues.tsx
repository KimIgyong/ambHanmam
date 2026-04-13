import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { useIssueList } from '@/domain/issues/hooks/useIssues';

const SEVERITY_DOTS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  MAJOR: 'bg-orange-400',
  MINOR: 'bg-yellow-400',
};

export default function TodaySidebarIssues() {
  const { t } = useTranslation('today');
  const navigate = useNavigate();
  const { data } = useIssueList({ status: 'IN_PROGRESS,TEST,APPROVED', size: 5 });
  const issues = data?.data;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-semibold text-gray-900">
            {t('sidebar.inProgressIssues', { defaultValue: '진행 중 이슈' })}
          </span>
        </div>
        <button
          onClick={() => navigate('/issues')}
          className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-indigo-500 transition-colors"
        >
          {t('sidebar.viewMore', { defaultValue: '더보기' })}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {!issues?.length ? (
        <p className="text-xs text-gray-400">
          {t('sidebar.noIssues', { defaultValue: '진행 중인 이슈가 없습니다.' })}
        </p>
      ) : (
        <div className="space-y-1.5">
          {issues.map((iss) => (
            <button
              key={iss.issueId}
              onClick={() => navigate(`/issues/${iss.issueId}`)}
              className="group w-full text-left rounded-lg p-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-1.5">
                <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOTS[iss.severity] || 'bg-gray-300'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {iss.refNumber && (
                      <span className="text-[10px] font-mono text-gray-400">{iss.refNumber}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-800 line-clamp-1 group-hover:text-indigo-600">
                    {iss.title}
                  </span>
                  {iss.assigneeName && (
                    <div className="mt-0.5 text-[10px] text-gray-400">{iss.assigneeName}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
