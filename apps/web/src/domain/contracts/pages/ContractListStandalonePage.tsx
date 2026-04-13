import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, FileText } from 'lucide-react';
import { useContractList } from '@/domain/billing/hooks/useContract';
import ContractStatusBadge from '@/domain/billing/components/contract/ContractStatusBadge';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const DIRECTIONS = ['RECEIVABLE', 'PAYABLE'] as const;
const CATEGORIES = ['TECH_BPO', 'SI_DEV', 'MAINTENANCE', 'MARKETING', 'GENERAL_AFFAIRS', 'OTHER'] as const;
const STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'RENEWED', 'TERMINATED', 'LIQUIDATED'] as const;

export default function ContractListStandalonePage() {
  const { t } = useTranslation(['billing', 'common']);
  const navigate = useNavigate();
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const queryParams: Record<string, string> = {};
  if (search) queryParams.search = search;
  if (direction) queryParams.direction = direction;
  if (category) queryParams.category = category;
  if (status) queryParams.status = status;

  const { data: contracts = [], isLoading } = useContractList(queryParams);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">{t('billing:contract.title')}</h1>
          </div>
        </div>

        {/* Filters */}
        {currentEntity && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('billing:contract.searchPlaceholder')}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">{t('billing:contract.allDirections')}</option>
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>{t(`billing:contract.direction.${d}`)}</option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">{t('billing:contract.allCategories')}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`billing:contract.category.${c}`)}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">{t('billing:contract.allStatuses')}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`billing:contract.status.${s}`)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {!currentEntity ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">{t('billing:selectEntity')}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">{t('common:loading')}</div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">{t('billing:contract.noResults')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('billing:contract.noResultsDesc')}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.title')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.partner')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.direction')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.type')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.period')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.documents')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {contracts.map((contract) => (
                <tr
                  key={contract.contractId}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/billing/contracts/${contract.contractId}`)}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 max-w-[250px] truncate">
                    {contract.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    <span className="font-mono text-xs text-gray-400 mr-1">{contract.partnerCode}</span>
                    {contract.partnerName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      contract.direction === 'RECEIVABLE' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {t(`billing:contract.direction.${contract.direction}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    {t(`billing:contract.category.${contract.category}`)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600">
                    {t(`billing:contract.type.${contract.type}`)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-right font-mono text-gray-700">
                    {formatCurrency(contract.amount, contract.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                    {contract.startDate}
                    {contract.endDate ? ` ~ ${contract.endDate}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <ContractStatusBadge status={contract.status} />
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={contract.note || ''}>
                    {contract.note || '-'}
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
