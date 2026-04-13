import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, FileText } from 'lucide-react';
import { useInvoiceList, useDeleteInvoice } from '../hooks/useInvoice';
import InvoiceStatusBadge from '../components/invoice/InvoiceStatusBadge';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { BilInvoiceResponse } from '@amb/types';

const STATUSES = ['DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID'] as const;
const DIRECTIONS = ['RECEIVABLE', 'PAYABLE'] as const;

export default function InvoiceListPage() {
  const { t } = useTranslation(['billing', 'common']);
  const navigate = useNavigate();
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const isVN = currentEntity?.country === 'VN';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [direction, setDirection] = useState('');
  const [yearMonth, setYearMonth] = useState('');

  const queryParams: Record<string, string> = {};
  if (search) queryParams.search = search;
  if (status) queryParams.status = status;
  if (direction) queryParams.direction = direction;
  if (yearMonth) queryParams.year_month = yearMonth;

  const { data: invoices = [], isLoading } = useInvoiceList(queryParams);
  const deleteMutation = useDeleteInvoice();

  const handleDelete = (inv: BilInvoiceResponse) => {
    if (!window.confirm(t('billing:invoice.deleteConfirm'))) return;
    deleteMutation.mutate(inv.invoiceId);
  };

  const formatCurrency = (amount: number, currency: string) =>
    `${currency} ${Number(amount).toLocaleString()}`;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{t('billing:invoice.title')}</h1>
          <button
            onClick={() => navigate('/billing/invoices/new')}
            className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('billing:invoice.addNew')}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('billing:invoice.searchPlaceholder')}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">{t('billing:invoice.allDirections')}</option>
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>{t(`billing:contract.direction.${d}`)}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">{t('billing:invoice.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`billing:invoice.status.${s}`)}</option>
            ))}
          </select>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">{t('common:loading')}</div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">{t('billing:invoice.noResults')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('billing:invoice.noResultsDesc')}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.number')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.partner')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.dueDate')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.total')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.status')}
                </th>
                {isVN && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('billing:invoice.columns.einvoice')}
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoices.map((inv) => (
                <tr
                  key={inv.invoiceId}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/billing/invoices/${inv.invoiceId}`)}
                >
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                    {inv.number}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                    [{inv.partnerCode}] {inv.partnerName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                    {inv.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                    {inv.dueDate || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-right font-mono text-gray-700">
                    {formatCurrency(inv.total, inv.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  {isVN && (
                    <td className="whitespace-nowrap px-6 py-3 text-sm">
                      {inv.einvoice ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.einvoice.status === 'ISSUED' ? 'bg-green-100 text-green-700' :
                          inv.einvoice.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                          inv.einvoice.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          inv.einvoice.status === 'CANCELLED' ? 'bg-gray-200 text-gray-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {t(`billing:einvoice.status.${inv.einvoice.status}`)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
                    {!['PAID', 'CANCELLED', 'VOID'].includes(inv.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(inv);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {t('common:delete')}
                      </button>
                    )}
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
