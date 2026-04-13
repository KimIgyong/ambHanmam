import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminUnitUserRoles, useDeleteUnitUserRole } from '../hooks/useAdmin';

export default function UnitUserRolesTab() {
  const { t } = useTranslation(['totalUsers', 'members']);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    page,
    limit: 50,
    search: search || undefined,
  };

  const { data, isLoading } = useAdminUnitUserRoles(params);
  const deleteRole = useDeleteUnitUserRole();

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleDelete = async (uurId: string) => {
    if (window.confirm(t('members:memberDetail.confirmRemoveUnit'))) {
      await deleteRole.mutateAsync(uurId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('totalUsers:search')}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">{t('totalUsers:noData')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.unitName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.userName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.unitRole')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.isPrimary')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.entity')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items.map((r) => (
                  <tr key={r.uurId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{r.unitName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{r.userName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{r.userEmail}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className="inline-flex rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
                        {t(`members:memberDetail.deptRoles.${r.role}`, { defaultValue: r.role })}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {r.isPrimary ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {t('members:memberDetail.isPrimary')}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {r.entityName ? `${r.entityName} (${r.entityCode})` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => handleDelete(r.uurId)}
                        disabled={deleteRole.isPending}
                        className="text-red-500 hover:text-red-700"
                        title={t('common:delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t('totalUsers:pagination', { total: data.total, page: data.page, totalPages: data.totalPages })}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
