import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, ExternalLink, RotateCcw, X } from 'lucide-react';
import { BilInvoiceResponse } from '@amb/types';
import { useIssueEinvoice, useCancelEinvoice } from '../../hooks/useInvoice';
import { invoiceApiService } from '../../service/invoice.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface Props {
  invoice: BilInvoiceResponse;
  onAction: () => void;
}

const statusColors: Record<string, string> = {
  NONE: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-blue-100 text-blue-700',
  ISSUED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

export default function EinvoiceSection({ invoice, onAction }: Props) {
  const { t } = useTranslation(['billing', 'common']);
  const issueMutation = useIssueEinvoice();
  const cancelMutation = useCancelEinvoice();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const einvoice = invoice.einvoice;
  const einvStatus = einvoice?.status || 'NONE';

  const canIssue =
    invoice.approvalStatus === 'APPROVED_ADMIN' &&
    (einvStatus === 'NONE' || einvStatus === 'FAILED');

  const canCancel = einvStatus === 'ISSUED';

  const handleIssue = async () => {
    if (!window.confirm(t('billing:einvoice.issueConfirm'))) return;
    await issueMutation.mutateAsync(invoice.invoiceId);
    onAction();
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    await cancelMutation.mutateAsync({ id: invoice.invoiceId, reason: cancelReason });
    setShowCancelModal(false);
    setCancelReason('');
    onAction();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-900">{t('billing:einvoice.title')}</h3>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[einvStatus] || statusColors.NONE}`}>
            {t(`billing:einvoice.status.${einvStatus}`)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canIssue && (
            <button
              onClick={handleIssue}
              disabled={issueMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {einvStatus === 'FAILED' ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('billing:einvoice.retry')}
                </>
              ) : (
                t('billing:einvoice.issue')
              )}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t('billing:einvoice.cancel')}
            </button>
          )}
        </div>
      </div>

      {/* 발행 실패 시 에러 메시지 */}
      {einvStatus === 'FAILED' && einvoice?.error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {einvoice.error}
        </div>
      )}

      {/* 발행 완료 시 정보 표시 */}
      {einvoice && einvStatus !== 'NONE' && einvStatus !== 'FAILED' && (
        <div className="space-y-2 text-sm">
          {einvoice.number && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('billing:einvoice.number')}:</span>
              <span className="font-mono text-gray-900">{einvoice.number}</span>
            </div>
          )}
          {einvoice.gdtCode && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('billing:einvoice.gdtCode')}:</span>
              <span className="font-mono text-gray-900 text-xs">{einvoice.gdtCode}</span>
            </div>
          )}
          {einvoice.issuedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('billing:einvoice.issuedAt')}:</span>
              <span className="text-gray-900">{<LocalDateTime value={einvoice.issuedAt} format='YYYY-MM-DD HH:mm' />}</span>
            </div>
          )}
          {(einvoice.lookupUrl || einvStatus === 'ISSUED') && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {einvoice.lookupUrl && (
                <a
                  href={einvoice.lookupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('billing:einvoice.lookupUrl')}
                </a>
              )}
              <button
                onClick={() => invoiceApiService.downloadEinvoiceXml(invoice.invoiceId)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-3 w-3" />
                {t('billing:einvoice.downloadXml')}
              </button>
              <button
                onClick={() => invoiceApiService.downloadEinvoicePdf(invoice.invoiceId)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-3 w-3" />
                {t('billing:einvoice.downloadPdf')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 취소 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('billing:einvoice.cancel')}</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:einvoice.cancelReason')}
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('billing:einvoice.cancelReasonPlaceholder')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common:close')}
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelMutation.isPending ? t('common:processing') : t('billing:einvoice.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
