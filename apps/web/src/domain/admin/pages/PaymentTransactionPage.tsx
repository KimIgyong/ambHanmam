import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminTransactions,
  useRefundTransaction,
  useQueryTransactionStatus,
  type PgTransaction,
} from '../../payment/hooks/usePaymentTransactions';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-600',
};

const PAGE_SIZE = 20;

export default function PaymentTransactionPage() {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [refundModal, setRefundModal] = useState<PgTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [detailTx, setDetailTx] = useState<PgTransaction | null>(null);

  const { data, isLoading, refetch } = useAdminTransactions({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const refundMutation = useRefundTransaction();
  const queryStatusMutation = useQueryTransactionStatus();

  const handleRefund = async () => {
    if (!refundModal || !refundReason.trim()) return;
    try {
      const result = await refundMutation.mutateAsync({
        id: refundModal.transactionId,
        reason: refundReason.trim(),
      });
      if (result.success) {
        toast.success(t('settings:paymentTransaction.refundSuccess'));
      } else {
        toast.error(result.message);
      }
      setRefundModal(null);
      setRefundReason('');
    } catch {
      toast.error(t('settings:paymentTransaction.refundFailed'));
    }
  };

  const handleQueryStatus = async (tx: PgTransaction) => {
    try {
      await queryStatusMutation.mutateAsync(tx.transactionId);
      refetch();
      toast.success(t('settings:paymentTransaction.statusUpdated'));
    } catch {
      toast.error(t('settings:paymentTransaction.statusQueryFailed'));
    }
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin')}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t('settings:paymentTransaction.title')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('settings:paymentTransaction.subtitle')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="border-none bg-transparent text-sm outline-none"
          >
            <option value="">{t('settings:paymentTransaction.allStatuses')}</option>
            <option value="PENDING">PENDING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          {t('common:refresh')}
        </button>
        {data && (
          <span className="text-sm text-gray-500">
            {t('settings:paymentTransaction.totalCount', { count: data.total })}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('settings:paymentTransaction.invoiceNo')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('settings:paymentTransaction.goodsName')}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                {t('settings:paymentTransaction.amount')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                {t('settings:paymentTransaction.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('settings:paymentTransaction.buyer')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('settings:paymentTransaction.date')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                {t('settings:paymentTransaction.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  {t('common:loading')}
                </td>
              </tr>
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  {t('settings:paymentTransaction.noData')}
                </td>
              </tr>
            ) : (
              data.items.map((tx) => (
                <tr key={tx.transactionId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-900">
                    <button
                      onClick={() => setDetailTx(tx)}
                      className="text-blue-600 hover:underline"
                    >
                      {tx.invoiceNo}
                    </button>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-700">
                    {tx.goodsName.startsWith('QUOTA_PURCHASE:')
                      ? `AI Token Pack`
                      : tx.goodsName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatAmount(tx.amount, tx.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {tx.buyerEmail || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {tx.status === 'PENDING' && (
                        <button
                          onClick={() => handleQueryStatus(tx)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          title={t('settings:paymentTransaction.queryStatus')}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      {tx.status === 'SUCCESS' && (
                        <button
                          onClick={() => {
                            setRefundModal(tx);
                            setRefundReason('');
                          }}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title={t('settings:paymentTransaction.refund')}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {t('settings:paymentTransaction.page', {
              current: page + 1,
              total: totalPages,
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {t('settings:paymentTransaction.detail')}
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['Invoice No', detailTx.invoiceNo],
                ['MerTrxId', detailTx.merTrxId],
                ['TrxId', detailTx.trxId || '-'],
                [t('settings:paymentTransaction.goodsName'), detailTx.goodsName],
                [t('settings:paymentTransaction.amount'), formatAmount(detailTx.amount, detailTx.currency)],
                [t('settings:paymentTransaction.status'), detailTx.status],
                ['Pay Type', detailTx.payType || '-'],
                ['Result', `${detailTx.resultCd || '-'} ${detailTx.resultMsg || ''}`],
                [t('settings:paymentTransaction.buyer'), `${detailTx.buyerName || ''} (${detailTx.buyerEmail || '-'})`],
                [t('settings:paymentTransaction.date'), formatDate(detailTx.createdAt)],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between border-b py-1">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDetailTx(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common:close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {t('settings:paymentTransaction.refundTitle')}
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              {t('settings:paymentTransaction.refundDescription', {
                invoiceNo: refundModal.invoiceNo,
                amount: formatAmount(refundModal.amount, refundModal.currency),
              })}
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder={t('settings:paymentTransaction.refundReasonPlaceholder')}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRefundModal(null);
                  setRefundReason('');
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim() || refundMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t('settings:paymentTransaction.refundConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
