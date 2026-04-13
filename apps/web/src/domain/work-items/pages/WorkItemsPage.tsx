import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Loader2 } from 'lucide-react';
import { useWorkItems } from '../hooks/useWorkItems';
import WorkItemCard from '../components/WorkItemCard';
import WorkItemFilterBar from '../components/WorkItemFilterBar';

export default function WorkItemsPage() {
  const { t } = useTranslation('acl');
  const [scope, setScope] = useState('MY');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useWorkItems({
    scope,
    type: type || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Briefcase className="h-5 w-5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('workItem.title')}</h1>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <WorkItemFilterBar
            scope={scope}
            onScopeChange={(s) => { setScope(s); setPage(1); }}
            type={type}
            onTypeChange={(t) => { setType(t); setPage(1); }}
            search={search}
            onSearchChange={(s) => { setSearch(s); setPage(1); }}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="space-y-2">
              {data.items.map((item) => (
                <WorkItemCard key={item.workItemId} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {data.total > data.limit && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-400">
                  {page} / {Math.ceil(data.total / data.limit)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(data.total / data.limit)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
            No work items found.
          </div>
        )}
      </div>
    </div>
  );
}
