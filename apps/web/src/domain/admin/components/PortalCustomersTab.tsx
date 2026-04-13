import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, ChevronLeft, ChevronRight, ExternalLink, Trash2, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, X } from 'lucide-react';
import { usePortalCustomers, usePortalMappings, useRevokeMapping, usePortalCountries, useDeletePortalCustomer, useDeletionPreview, usePermanentDeleteCustomer } from '@/domain/portal-bridge/hooks/usePortalBridge';
import type { PortalCustomerQuery } from '@/domain/portal-bridge/service/portal-bridge.service';
import { toast } from 'sonner';

type SubTab = 'customers' | 'mappings';
type SortBy = 'name' | 'email' | 'company' | 'country' | 'created_at';
type SortOrder = 'ASC' | 'DESC';

export default function PortalCustomersTab() {
  const { t } = useTranslation(['totalUsers', 'common']);
  const [subTab, setSubTab] = useState<SubTab>('customers');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('customers')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${subTab === 'customers' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {t('totalUsers:portal.customers')}
        </button>
        <button
          onClick={() => setSubTab('mappings')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${subTab === 'mappings' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          {t('totalUsers:portal.mappings')}
        </button>
      </div>
      {subTab === 'customers' ? <CustomersSubTab /> : <MappingsSubTab />}
    </div>
  );
}

function CustomersSubTab() {
  const { t } = useTranslation(['totalUsers']);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [mappingFilter, setMappingFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [deleteOptionTarget, setDeleteOptionTarget] = useState<{ pctId: string; pctName: string; pctEmail: string; isMapped: boolean } | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<string | null>(null);

  const { data: countries } = usePortalCountries();
  const deleteMutation = useDeletePortalCustomer();

  const params: PortalCustomerQuery = {
    page,
    limit,
    search: search || undefined,
    mapping_filter: mappingFilter,
    status: (statusFilter as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') || undefined,
    country: countryFilter || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  const { data, isLoading } = usePortalCustomers(params);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleSort = (col: SortBy) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortBy }) => {
    if (sortBy !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-gray-300" />;
    return sortOrder === 'ASC'
      ? <ArrowUp className="ml-1 inline h-3 w-3 text-violet-600" />
      : <ArrowDown className="ml-1 inline h-3 w-3 text-violet-600" />;
  };

  const handleDelete = async (pctId: string, _name: string, isMapped: boolean) => {
    const msg = isMapped
      ? `${t('totalUsers:portal.deleteConfirm')}\n\n⚠️ ${t('totalUsers:portal.deleteWithMapping')}`
      : t('totalUsers:portal.deleteConfirm');
    if (!window.confirm(msg)) return;
    try {
      await deleteMutation.mutateAsync(pctId);
      toast.success(t('totalUsers:portal.deleteSuccess'));
    } catch {
      toast.error(t('totalUsers:portal.deleteFailed'));
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
        <select
          value={mappingFilter}
          onChange={(e) => { setMappingFilter(e.target.value as 'all' | 'mapped' | 'unmapped'); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">{t('totalUsers:portal.all')}</option>
          <option value="mapped">{t('totalUsers:portal.mapped')}</option>
          <option value="unmapped">{t('totalUsers:portal.unmapped')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t('totalUsers:portal.allStatuses')}</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
        <select
          value={countryFilter}
          onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">{t('totalUsers:portal.allCountries')}</option>
          {countries?.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
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
                  <th className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" onClick={() => handleSort('name')}>
                    {t('totalUsers:col.name')}<SortIcon col="name" />
                  </th>
                  <th className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" onClick={() => handleSort('email')}>
                    {t('totalUsers:col.email')}<SortIcon col="email" />
                  </th>
                  <th className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" onClick={() => handleSort('company')}>
                    {t('totalUsers:portal.company')}<SortIcon col="company" />
                  </th>
                  <th className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" onClick={() => handleSort('country')}>
                    {t('totalUsers:portal.country')}<SortIcon col="country" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:portal.emailVerified')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:portal.mappingStatus')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.status')}</th>
                  <th className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase text-gray-500" onClick={() => handleSort('created_at')}>
                    {t('totalUsers:col.createdAt')}<SortIcon col="created_at" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items.map((c) => (
                  <tr key={c.pctId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                      <button
                        onClick={() => setDeleteOptionTarget({ pctId: c.pctId, pctName: c.pctName, pctEmail: c.pctEmail, isMapped: c.isMapped })}
                        className="text-violet-600 hover:text-violet-800 hover:underline text-left"
                      >
                        {c.pctName}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.pctEmail}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.pctCompanyName || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.pctCountry || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.pctEmailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.pctEmailVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.isMapped ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.isMapped ? t('totalUsers:portal.mapped') : t('totalUsers:portal.unmapped')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.pctStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        c.pctStatus === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {c.pctStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(c.pctCreatedAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      {!c.isMapped && (
                        <a
                          href="/settings/portal-bridge"
                          className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t('totalUsers:portal.createAccount')}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
        </>
      )}
      {deleteOptionTarget && (
        <DeleteOptionModal
          target={deleteOptionTarget}
          onClose={() => setDeleteOptionTarget(null)}
          onSoftDelete={() => {
            const { pctId, pctName, isMapped } = deleteOptionTarget;
            setDeleteOptionTarget(null);
            handleDelete(pctId, pctName, isMapped);
          }}
          onPermanentDelete={() => {
            const { pctId } = deleteOptionTarget;
            setDeleteOptionTarget(null);
            setPermanentDeleteTarget(pctId);
          }}
        />
      )}
      {permanentDeleteTarget && (
        <PermanentDeleteModal
          pctId={permanentDeleteTarget}
          onClose={() => setPermanentDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function MappingsSubTab() {
  const { t } = useTranslation(['totalUsers']);
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePortalMappings(page, 50);
  const revokeMutation = useRevokeMapping();

  const handleRevoke = async (pumId: string) => {
    if (window.confirm(t('totalUsers:portal.revokeConfirm'))) {
      try {
        await revokeMutation.mutateAsync(pumId);
        toast.success(t('totalUsers:portal.revokeSuccess'));
      } catch {
        toast.error(t('totalUsers:portal.revokeFailed'));
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>;
  }

  if (!data || data.items.length === 0) {
    return <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center"><p className="text-sm text-gray-500">{t('totalUsers:noData')}</p></div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:portal.portalUser')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:portal.internalUser')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.createdAt')}</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.items.map((m) => (
              <tr key={m.pumId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-gray-900">{m.portalCustomer.pctName}</div>
                  <div className="text-gray-500">{m.portalCustomer.pctEmail}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-gray-900">{m.user.usrName}</div>
                  <div className="text-gray-500">{m.user.usrEmail}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.pumStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.pumStatus}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {new Date(m.pumCreatedAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                  {m.pumStatus === 'ACTIVE' && (
                    <button
                      onClick={() => handleRevoke(m.pumId)}
                      disabled={revokeMutation.isPending}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      {t('totalUsers:portal.revoke')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}

function Pagination({ page, totalPages, total, onPageChange }: { page: number; totalPages: number; total: number; onPageChange: (p: number) => void }) {
  const { t } = useTranslation('totalUsers');
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        {t('totalUsers:pagination', { total, page, totalPages })}
      </p>
      <div className="flex gap-2">
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DeleteOptionModal({
  target,
  onClose,
  onSoftDelete,
  onPermanentDelete,
}: {
  target: { pctId: string; pctName: string; pctEmail: string; isMapped: boolean };
  onClose: () => void;
  onSoftDelete: () => void;
  onPermanentDelete: () => void;
}) {
  const { t } = useTranslation(['totalUsers']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('totalUsers:portal.deleteOptionTitle')}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">{target.pctName}</p>
            <p className="text-sm text-gray-500">{target.pctEmail}</p>
          </div>

          <p className="text-sm text-gray-600">{t('totalUsers:portal.deleteOptionDesc')}</p>

          <div className="space-y-2">
            <button
              onClick={onSoftDelete}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-orange-50 hover:border-orange-300 transition-colors"
            >
              <Trash2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{t('totalUsers:portal.softDelete')}</p>
                <p className="text-xs text-gray-500">{t('totalUsers:portal.deleteConfirm')}</p>
              </div>
            </button>

            <button
              onClick={onPermanentDelete}
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-600">{t('totalUsers:portal.permanentDelete')}</p>
                <p className="text-xs text-gray-500">{t('totalUsers:portal.permanentDeleteWarning')}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('totalUsers:portal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function PermanentDeleteModal({ pctId, onClose }: { pctId: string; onClose: () => void }) {
  const { t } = useTranslation(['totalUsers']);
  const { data: preview, isLoading } = useDeletionPreview(pctId);
  const permanentMutation = usePermanentDeleteCustomer();
  const [level, setLevel] = useState<1 | 2>(1);
  const [confirmEmail, setConfirmEmail] = useState('');

  const emailMatch = preview && confirmEmail.toLowerCase() === preview.customer.pctEmail.toLowerCase();
  const canDelete = emailMatch && !permanentMutation.isPending &&
    !(level === 2 && preview?.warnings.hasActiveSubscription);

  const handleDelete = async () => {
    if (!canDelete || !preview) return;
    try {
      await permanentMutation.mutateAsync({
        pctId,
        data: { level, confirm_email: confirmEmail },
      });
      toast.success(t('totalUsers:portal.permanentDeleteSuccess'));
      onClose();
    } catch {
      toast.error(t('totalUsers:portal.permanentDeleteFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('totalUsers:portal.permanentDelete')}</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">{t('totalUsers:portal.permanentDeleteWarning')}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">{preview.customer.pctName}</p>
                <p className="text-sm text-gray-500">{preview.customer.pctEmail}</p>
                {preview.customer.pctCompanyName && (
                  <p className="text-sm text-gray-500">{preview.customer.pctCompanyName}</p>
                )}
                {preview.customer.isSoftDeleted && (
                  <span className="mt-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {t('totalUsers:portal.alreadySoftDeleted')}
                  </span>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">{t('totalUsers:portal.deletionPreviewTitle')}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('totalUsers:portal.previewMappings')}</span>
                    <span className="font-medium">{preview.counts.mappings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('totalUsers:portal.previewPayments')}</span>
                    <span className="font-medium">{preview.counts.payments}</span>
                  </div>
                  {preview.counts.client && (
                    <>
                      <div className="flex justify-between">
                        <span>{t('totalUsers:portal.previewClient')}</span>
                        <span className="font-medium">{preview.counts.client.cliCompanyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('totalUsers:portal.previewSubscriptions')}</span>
                        <span className="font-medium">{preview.counts.subscriptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('totalUsers:portal.previewUsageRecords')}</span>
                        <span className="font-medium">{preview.counts.usageRecords}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">{t('totalUsers:portal.deletionLevel')}</p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={level === 1}
                      onChange={() => setLevel(1)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('totalUsers:portal.level1Title')}</p>
                      <p className="text-xs text-gray-500">{t('totalUsers:portal.level1Desc')}</p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 ${
                    preview.warnings.hasActiveSubscription
                      ? 'border-red-200 bg-red-50 opacity-60'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      checked={level === 2}
                      onChange={() => setLevel(2)}
                      disabled={preview.warnings.hasActiveSubscription}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('totalUsers:portal.level2Title')}</p>
                      <p className="text-xs text-gray-500">{t('totalUsers:portal.level2Desc')}</p>
                      {preview.warnings.hasActiveSubscription && (
                        <p className="mt-1 text-xs font-medium text-red-600">{t('totalUsers:portal.activeSubWarning')}</p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('totalUsers:portal.confirmEmailLabel')}
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={preview.customer.pctEmail}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('totalUsers:portal.cancel')}
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {permanentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('totalUsers:portal.confirmPermanentDelete')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
