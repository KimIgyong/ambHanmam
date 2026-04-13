import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Send, Clock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import {
  useSubmitForReview,
  useApproveReview,
  useApproveManager,
  useApproveAdmin,
  useRejectInvoice,
} from '../../hooks/useInvoiceApproval';

interface Props {
  invoiceId: string;
  status: string;
  approvalStatus: string;
  onAction: () => void;
}

const APPROVAL_STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  NONE: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'approval.status.NONE' },
  PENDING_REVIEW: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'approval.status.PENDING_REVIEW' },
  PENDING_APPROVAL: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'approval.status.PENDING_APPROVAL' },
  APPROVED_MANAGER: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'approval.status.APPROVED_MANAGER' },
  APPROVED_ADMIN: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'approval.status.APPROVED_ADMIN' },
  REJECTED: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'approval.status.REJECTED' },
};

export default function InvoiceApprovalActions({ invoiceId, status, approvalStatus, onAction }: Props) {
  const { t } = useTranslation(['billing', 'common']);
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role || 'MEMBER';

  const submitForReview = useSubmitForReview();
  const approveReview = useApproveReview();
  const approveManager = useApproveManager();
  const approveAdmin = useApproveAdmin();
  const rejectInvoice = useRejectInvoice();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isPending = submitForReview.isPending || approveReview.isPending ||
    approveManager.isPending || approveAdmin.isPending || rejectInvoice.isPending;

  const handleAction = async (action: () => Promise<unknown>) => {
    await action();
    onAction();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await rejectInvoice.mutateAsync({ id: invoiceId, reason: rejectReason });
    setShowRejectModal(false);
    setRejectReason('');
    onAction();
  };

  const config = APPROVAL_STATUS_CONFIG[approvalStatus] || APPROVAL_STATUS_CONFIG.NONE;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      {/* Status Display */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t('billing:approval.title')}</h3>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}>
          {approvalStatus === 'APPROVED_ADMIN' ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : approvalStatus === 'REJECTED' ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          {t(`billing:${config.label}`)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* DRAFT + NONE → Submit for Review */}
        {status === 'DRAFT' && approvalStatus === 'NONE' && (
          <button
            onClick={() => handleAction(() => submitForReview.mutateAsync(invoiceId))}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
            {t('billing:approval.submitReview')}
          </button>
        )}

        {/* PENDING_REVIEW → Approve / Reject (any user) */}
        {approvalStatus === 'PENDING_REVIEW' && (
          <>
            <button
              onClick={() => handleAction(() => approveReview.mutateAsync(invoiceId))}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              {t('billing:approval.approveReview')}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              {t('billing:approval.reject')}
            </button>
          </>
        )}

        {/* PENDING_APPROVAL → Approve / Reject (MANAGER or ADMIN) */}
        {approvalStatus === 'PENDING_APPROVAL' && (userRole === 'MANAGER' || userRole === 'ADMIN') && (
          <>
            <button
              onClick={() => handleAction(() => approveManager.mutateAsync(invoiceId))}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              {t('billing:approval.approveManager')}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              {t('billing:approval.reject')}
            </button>
          </>
        )}

        {/* APPROVED_MANAGER → Final Approve / Reject (ADMIN only) */}
        {approvalStatus === 'APPROVED_MANAGER' && userRole === 'ADMIN' && (
          <>
            <button
              onClick={() => handleAction(() => approveAdmin.mutateAsync(invoiceId))}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              {t('billing:approval.approveFinal')}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              {t('billing:approval.reject')}
            </button>
          </>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('billing:approval.rejectTitle')}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('billing:approval.rejectPlaceholder')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common:close')}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectInvoice.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t('billing:approval.confirmReject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
