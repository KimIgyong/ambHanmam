import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Building2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePartnerList, useDeletePartner } from '../hooks/usePartner';
import { BilPartnerResponse } from '@amb/types';

const PARTNER_TYPES = ['CLIENT', 'AFFILIATE', 'PARTNER', 'OUTSOURCING', 'GENERAL_AFFAIRS'] as const;

export default function PartnerListPage() {
  const { t } = useTranslation(['billing', 'common']);
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams: Record<string, string> = {};
  if (debouncedSearch) queryParams.search = debouncedSearch;
  if (typeFilter) queryParams.type = typeFilter;
  if (statusFilter) queryParams.status = statusFilter;

  const { data: partners = [], isLoading } = usePartnerList(queryParams);
  const deleteMutation = useDeletePartner();

  const handleDelete = (partner: BilPartnerResponse) => {
    if (!window.confirm(t('billing:partner.deleteConfirm'))) return;
    deleteMutation.mutate(partner.partnerId);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{t('billing:partner.title')}</h1>
          <button
            onClick={() => navigate('/billing/partners/new')}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('billing:partner.addNew')}
          </button>
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('billing:partner.searchPlaceholder')}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">{t('billing:partner.allTypes')}</option>
            {PARTNER_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`billing:partner.type.${type}`)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">{t('billing:partner.allStatuses')}</option>
            <option value="ACTIVE">{t('billing:partner.status.ACTIVE')}</option>
            <option value="INACTIVE">{t('billing:partner.status.INACTIVE')}</option>
            <option value="PROSPECT">{t('billing:partner.status.PROSPECT')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">{t('common:loading')}</div>
          </div>
        ) : partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Building2 className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">{t('billing:partner.noResults')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('billing:partner.noResultsDesc')}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:partner.columns.code')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:partner.columns.companyName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:partner.columns.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:partner.columns.contactName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:partner.columns.contactEmail')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:partner.columns.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {partners.map((partner) => (
                <tr
                  key={partner.partnerId}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/billing/partners/${partner.partnerId}`)}
                >
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-mono text-gray-600">
                    {partner.code}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                    {partner.companyName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {t(`billing:partner.type.${partner.type}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    {partner.contactName || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    {partner.contactEmail || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        partner.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700'
                          : partner.status === 'PROSPECT'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {t(`billing:partner.status.${partner.status}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(partner);
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
