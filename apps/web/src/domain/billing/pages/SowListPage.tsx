import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { useSowList, useDeleteSow } from '../hooks/useSow';
import { BilSowResponse } from '@amb/types';

const STATUSES = ['DRAFT', 'SIGNED', 'IN_PROGRESS', 'COMPLETED', 'ACCEPTED'] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SIGNED: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  ACCEPTED: 'bg-purple-50 text-purple-700',
};

export default function SowListPage() {
  const { t } = useTranslation(['billing', 'common']);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const queryParams: Record<string, string> = {};
  if (search) queryParams.search = search;
  if (status) queryParams.status = status;

  const { data: sows = [], isLoading } = useSowList(queryParams);
  const deleteMutation = useDeleteSow();

  const handleDelete = (sow: BilSowResponse) => {
    if (!window.confirm(t('billing:sow.deleteConfirm'))) return;
    deleteMutation.mutate(sow.sowId);
  };

  const formatCurrency = (amount: number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString()}`;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{t('billing:sow.title')}</h1>
          <button
            onClick={() => navigate('/billing/sow/new')}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('billing:sow.addNew')}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('billing:sow.searchPlaceholder')}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">{t('billing:sow.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`billing:sow.status.${s}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">{t('common:loading')}</div>
          </div>
        ) : sows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ClipboardList className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">{t('billing:sow.noResults')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('billing:sow.noResultsDesc')}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:sow.columns.title')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:sow.columns.contract')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:sow.columns.partner')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:sow.columns.period')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:sow.columns.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:sow.columns.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sows.map((sow) => (
                <tr
                  key={sow.sowId}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/billing/sow/${sow.sowId}`)}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 max-w-[250px] truncate">
                    {sow.title}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                    {sow.contractTitle}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    {sow.partnerName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                    {sow.periodStart} ~ {sow.periodEnd}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-right font-mono text-gray-700">
                    {formatCurrency(sow.amount, sow.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[sow.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t(`billing:sow.status.${sow.status}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sow);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {t('common:delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
