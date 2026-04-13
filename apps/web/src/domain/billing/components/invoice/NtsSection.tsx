import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, RotateCcw, X, RefreshCw } from 'lucide-react';
import { BilInvoiceResponse, NTS_MODIFY_CODE } from '@amb/types';
import {
  useIssueNtsTaxInvoice,
  useCancelNtsTaxInvoice,
  useIssueNtsModified,
} from '../../hooks/useInvoice';
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
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

export default function NtsSection({ invoice, onAction }: Props) {
  const { t } = useTranslation(['billing', 'common']);
  const issueMutation = useIssueNtsTaxInvoice();
  const cancelMutation = useCancelNtsTaxInvoice();
  const modifiedMutation = useIssueNtsModified();
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyCode, setModifyCode] = useState('');
  const [originalInvoiceId, setOriginalInvoiceId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const ntsInfo = invoice.ntsInfo;
  const ntsStatus = ntsInfo?.status || 'NONE';

  const canIssue =
    invoice.approvalStatus === 'APPROVED_ADMIN' &&
    (ntsStatus === 'NONE' || ntsStatus === 'FAILED');

  const canModify = ntsStatus === 'ISSUED' || ntsStatus === 'ACCEPTED';
  const canCancel = ntsStatus === 'ISSUED';

  const handleIssue = async () => {
    if (!window.confirm(t('billing:nts.issueConfirm'))) return;
    await issueMutation.mutateAsync(invoice.invoiceId);
    onAction();
  };

  const handleCancel = async () => {
    if (!window.confirm(t('billing:nts.cancelConfirm'))) return;
    await cancelMutation.mutateAsync(invoice.invoiceId);
    onAction();
  };

  const handleModifiedIssue = async () => {
    if (!modifyCode || !originalInvoiceId) return;
    await modifiedMutation.mutateAsync({
      id: invoice.invoiceId,
      data: { modify_code: modifyCode, original_invoice_id: originalInvoiceId },
    });
    setShowModifyModal(false);
    setModifyCode('');
    setOriginalInvoiceId('');
    onAction();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await invoiceApiService.getNtsStatus(invoice.invoiceId);
      onAction();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">{t('billing:nts.title')}</h3>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[ntsStatus] || statusColors.NONE}`}
          >
            {t(`billing:nts.status.${ntsStatus}`)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canIssue && (
            <button
              onClick={handleIssue}
              disabled={issueMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {ntsStatus === 'FAILED' ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t('billing:einvoice.retry')}
                </>
              ) : (
                t('billing:nts.issue')
              )}
            </button>
          )}
          {canModify && (
            <button
              onClick={() => setShowModifyModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
            >
              {t('billing:nts.issueModified')}
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t('billing:nts.cancel')}
            </button>
          )}
          {ntsStatus !== 'NONE' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {t('billing:nts.refresh')}
            </button>
          )}
        </div>
      </div>

      {/* 발행 실패 시 에러 메시지 */}
      {ntsStatus === 'FAILED' && ntsInfo?.error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {ntsInfo.error}
        </div>
      )}

      {/* 발행 정보 표시 */}
      {ntsInfo && ntsStatus !== 'NONE' && ntsStatus !== 'FAILED' && (
        <div className="space-y-2 text-sm">
          {ntsInfo.mgtKey && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('billing:nts.mgtKey')}:</span>
              <span className="font-mono text-gray-900">{ntsInfo.mgtKey}</span>
            </div>
          )}
          {ntsInfo.confirmNum && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('billing:nts.confirmNum')}:</span>
              <span className="font-mono text-gray-900">{ntsInfo.confirmNum}</span>
            </div>
          )}
          {ntsInfo.issuedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('billing:nts.issuedAt')}:</span>
              <span className="text-gray-900">{<LocalDateTime value={ntsInfo.issuedAt} format='YYYY-MM-DD HH:mm' />}</span>
            </div>
          )}
          {ntsInfo.modifyCode && (
            <div className="flex justify-between">
              <span className="text-gray-500">{t('billing:nts.modifyCode')}:</span>
              <span className="text-gray-900">
                {t(`billing:nts.modifyCodes.${ntsInfo.modifyCode}`)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 수정세금계산서 발행 모달 */}
      {showModifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('billing:nts.issueModified')}
            </h3>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:nts.modifyCode')}
            </label>
            <select
              value={modifyCode}
              onChange={(e) => setModifyCode(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
            >
              <option value="">--</option>
              {Object.entries(NTS_MODIFY_CODE).map(([, value]) => (
                <option key={value} value={value}>
                  {value}. {t(`billing:nts.modifyCodes.${value}`)}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:nts.originalInvoice')} ID
            </label>
            <input
              type="text"
              value={originalInvoiceId}
              onChange={(e) => setOriginalInvoiceId(e.target.value)}
              placeholder="원본 청구서 ID"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModifyModal(false);
                  setModifyCode('');
                  setOriginalInvoiceId('');
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('common:close')}
              </button>
              <button
                onClick={handleModifiedIssue}
                disabled={!modifyCode || !originalInvoiceId || modifiedMutation.isPending}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {modifiedMutation.isPending ? t('common:processing') : t('billing:nts.issueModified')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
