import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Zap, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { usePaymentList, useOutstandingSummary } from '../hooks/usePayment';
import BulkGenerateModal from '../components/invoice/BulkGenerateModal';

const DIRECTIONS = ['', 'RECEIVABLE', 'PAYABLE'] as const;

export default function PaymentListPage() {
  const { t } = useTranslation(['billing', 'common']);

  const now = new Date();
  const [yearMonth, setYearMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  );
  const [direction, setDirection] = useState('');
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const { data: payments = [], isLoading } = usePaymentList({
    direction: direction || undefined,
    search: search || undefined,
    year_month: yearMonth || undefined,
  });
  const { data: outstanding } = useOutstandingSummary();

  const fmt = (n: number) => Number(n).toLocaleString();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{t('billing:payment.title')}</h1>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Zap className="h-4 w-4" />
            {t('billing:automation.title')}
          </button>
        </div>
      </div>

      {/* Outstanding Summary */}
      {outstanding && (
        <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex gap-4">
            {(outstanding.receivable || []).map((r: any, i: number) => (
              <div key={`r-${i}`} className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5">
                <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                <div className="text-xs">
                  <span className="text-blue-600 font-medium">{t('billing:payment.receivableOutstanding')}</span>
                  <span className="ml-2 font-semibold">{r.currency} {fmt(Number(r.outstanding))}</span>
                  <span className="ml-1 text-gray-400">({r.count})</span>
                </div>
              </div>
            ))}
            {(outstanding.payable || []).map((p: any, i: number) => (
              <div key={`p-${i}`} className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5">
                <ArrowUpCircle className="h-4 w-4 text-red-500" />
                <div className="text-xs">
                  <span className="text-red-600 font-medium">{t('billing:payment.payableOutstanding')}</span>
                  <span className="ml-2 font-semibold">{p.currency} {fmt(Number(p.outstanding))}</span>
                  <span className="ml-1 text-gray-400">({p.count})</span>
                </div>
              </div>
            ))}
            {(!outstanding.receivable?.length && !outstanding.payable?.length) && (
              <p className="text-xs text-gray-400">{t('billing:payment.noOutstanding')}</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">{t('billing:invoice.allDirections')}</option>
            {DIRECTIONS.filter(Boolean).map((d) => (
              <option key={d} value={d}>{t(`billing:contract.direction.${d}`)}</option>
            ))}
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('billing:payment.searchPlaceholder')}
              className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-500">{t('common:loading')}</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-sm">{t('billing:payment.noResults')}</p>
            <p className="text-xs mt-1">{t('billing:payment.noResultsDesc')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">{t('billing:payment.columns.date')}</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">{t('billing:payment.columns.invoiceNumber')}</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">{t('billing:payment.columns.partner')}</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">{t('billing:payment.columns.method')}</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">{t('billing:payment.columns.reference')}</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-600">{t('billing:payment.columns.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.paymentId} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-900">{payment.date}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{payment.invoiceNumber}</td>
                  <td className="px-4 py-2.5">{payment.partnerName}</td>
                  <td className="px-4 py-2.5">{t(`billing:payment.method.${payment.method}`)}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{payment.reference || '-'}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{payment.currency} {fmt(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showBulkModal && <BulkGenerateModal onClose={() => setShowBulkModal(false)} />}
    </div>
  );
}
