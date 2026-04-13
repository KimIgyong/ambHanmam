import { useTranslation } from 'react-i18next';
import { IssueResponse } from '@amb/types';
import IssueItem from './IssueItem';

interface IssueListViewProps {
  issues: IssueResponse[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onIssueClick: (issue: IssueResponse) => void;
}

export default function IssueListView({
  issues,
  totalPages,
  currentPage,
  totalCount,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  onIssueClick,
}: IssueListViewProps) {
  const { t } = useTranslation(['issues']);

  const showFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showTo = Math.min(currentPage * pageSize, totalCount);

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
        {t('issues:noIssues')}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {issues.map((issue) => (
          <IssueItem key={issue.issueId} issue={issue} onClick={onIssueClick} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('issues:pagination.prev')}
            </button>
            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (currentPage > 3) pages.push('...');
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (currentPage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
              }
              return pages.map((p, idx) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`min-w-[36px] rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('issues:pagination.next')}
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              {t('issues:pagination.showing', { from: showFrom, to: showTo, total: totalCount })}
              {' · '}
              {t('issues:pagination.pageInfo', { current: currentPage, total: totalPages })}
            </span>
            <span className="text-gray-300">|</span>
            <label className="flex items-center gap-1.5">
              {t('issues:pagination.perPage')}
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>{size}{t('issues:pagination.perPageUnit')}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {totalPages <= 1 && totalCount > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-500">
          <span>{t('issues:pagination.showing', { from: showFrom, to: showTo, total: totalCount })}</span>
          <span className="text-gray-300">|</span>
          <label className="flex items-center gap-1.5">
            {t('issues:pagination.perPage')}
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}{t('issues:pagination.perPageUnit')}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </>
  );
}
