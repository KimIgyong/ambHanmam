import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEntityManagementList } from '../hooks/useAdmin';

export default function EntityManagementPage() {
  const { t } = useTranslation(['entityManagement', 'common', 'members']);
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useEntityManagementList({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
            <Building2 className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('entityManagement:title')}</h1>
            <p className="text-sm text-gray-500">{t('entityManagement:subtitle')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('entityManagement:search')}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          >
            <option value="">{t('entityManagement:allStatus')}</option>
            <option value="ACTIVE">{t('members:userStatus.ACTIVE')}</option>
            <option value="INACTIVE">{t('members:userStatus.INACTIVE')}</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">{t('entityManagement:noEntities')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.no')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.entityCode')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.entityName')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.level')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.master')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.members')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.signupDate')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.items.map((entity, idx) => (
                    <tr key={entity.entityId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {(data.page - 1) * data.limit + idx + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-600">
                        {entity.entityCode}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/user-management/${entity.entityId}`)}
                          className="text-rose-600 hover:text-rose-800 hover:underline"
                        >
                          {entity.entityName}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          entity.level === 'ROOT' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t(`entityManagement:level.${entity.level}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {entity.masterUser ? (
                          <div>
                            <div className="font-medium text-gray-900">{entity.masterUser.name}</div>
                            <div className="text-xs text-gray-400">{entity.masterUser.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{t('entityManagement:noMaster')}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-600">
                        {entity.memberCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(entity.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          entity.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {t(`members:userStatus.${entity.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {t('entityManagement:pagination', { total: data.total, page: data.page, totalPages: data.totalPages })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
