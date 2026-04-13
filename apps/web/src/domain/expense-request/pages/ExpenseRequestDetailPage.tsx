import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  XCircle,
  CheckCircle,
  AlertCircle,
  Paperclip,
  Link as LinkIcon,
} from 'lucide-react';
import {
  useExpenseRequestDetail,
  useSubmitExpenseRequest,
  useApproveExpenseRequest,
  useRejectExpenseRequest,
  useCancelExpenseRequest,
  useDeleteExpenseRequest,
  useUploadExpenseAttachment,
  useAddLinkAttachment,
  useDeleteAttachment,
} from '../hooks/useExpenseRequest';
import { useCreateExecution, useUpdateExecution } from '../hooks/useExpenseReport';
import ExpenseStatusBadge from '../components/ExpenseStatusBadge';
import ExpenseApprovalTimeline from '../components/ExpenseApprovalTimeline';
import ExpenseItemsEditor from '../components/ExpenseItemsEditor';
import type { CreateExecutionBody, ExecutionMethod, ReceiptType } from '../service/expenseRequest.service';

export default function ExpenseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('expenseRequest');

  const { data: request, isLoading } = useExpenseRequestDetail(id ?? null);
  const submitMutation = useSubmitExpenseRequest();
  const approveMutation = useApproveExpenseRequest();
  const rejectMutation = useRejectExpenseRequest();
  const cancelMutation = useCancelExpenseRequest();
  const deleteMutation = useDeleteExpenseRequest();
  const uploadAttachment = useUploadExpenseAttachment();
  const addLink = useAddLinkAttachment();
  const deleteAttachment = useDeleteAttachment();
  const createExecution = useCreateExecution();
  const updateExecution = useUpdateExecution();

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showExecution, setShowExecution] = useState(false);
  const [execForm, setExecForm] = useState<CreateExecutionBody>({
    execution_date: new Date().toISOString().split('T')[0],
    execution_method: 'TRANSFER',
    total_amount: 0,
    receipt_type: 'RECEIPT',
  });
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        {t('common.loading')}
      </div>
    );
  }

  const canEdit = request.status === 'DRAFT';
  const canSubmit = request.status === 'DRAFT';
  const canCancel = ['DRAFT', 'PENDING', 'APPROVED_L1'].includes(request.status);
  const canApprove = ['PENDING', 'APPROVED_L1'].includes(request.status);
  const canExecute = request.status === 'APPROVED' && !request.execution;

  const handleDelete = async () => {
    if (!confirm(t('confirm.delete'))) return;
    await deleteMutation.mutateAsync(request.id);
    navigate('/expense-requests');
  };

  const handleSubmit = async () => {
    if (!confirm(t('confirm.submit'))) return;
    await submitMutation.mutateAsync(request.id);
  };

  const handleApprove = async () => {
    await approveMutation.mutateAsync({ id: request.id, data: { comment: approveComment || undefined } });
    setShowApproveModal(false);
    setApproveComment('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert(t('error.rejectReasonRequired'));
      return;
    }
    await rejectMutation.mutateAsync({ id: request.id, data: { reason: rejectReason } });
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleCancel = async () => {
    if (!confirm(t('confirm.cancel'))) return;
    await cancelMutation.mutateAsync(request.id);
  };

  const handleSaveExecution = async () => {
    if (request.execution) {
      await updateExecution.mutateAsync({ id: request.id, data: execForm });
    } else {
      await createExecution.mutateAsync({ id: request.id, data: execForm });
    }
    setShowExecution(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/expense-requests')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                  {request.requestNumber}
                </span>
                <ExpenseStatusBadge status={request.status} size="md" />
                {request.isRecurring && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    {t(`recurringType.${request.recurringType}`)}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                {request.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => navigate(`/expense-requests/${id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  {t('action.edit')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('action.delete')}
                </button>
              </>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4" />
                {t('action.submit')}
              </button>
            )}
            {canApprove && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  {t('approval.reject')}
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t('approval.approve')}
                </button>
              </>
            )}
            {canExecute && (
              <button
                onClick={() => setShowExecution(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {t('action.execute')}
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                {t('action.cancel')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Auto-generated banner */}
          {request.parentRequestId && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  {t('detail.autoGenerated')}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  {t('detail.autoGeneratedDesc')}{' '}
                  <Link
                    to={`/expense-requests/${request.parentRequestId}`}
                    className="underline"
                  >
                    {t('detail.parentRequest')}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">{t('detail.requester')}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                  {request.requesterName}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">{t('detail.requestDate')}</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                  {new Date(request.requestDate).toLocaleDateString()}
                </div>
              </div>
              {request.requiredDate && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400">{t('detail.requiredDate')}</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                    {new Date(request.requiredDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              <div>
                <div className="text-gray-500 dark:text-gray-400">{t('report.totalAmount')}</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {Number(request.totalAmount ?? 0).toLocaleString()} {t('common.currency')}
                </div>
              </div>
              {request.memo && (
                <div className="col-span-2">
                  <div className="text-gray-500 dark:text-gray-400">{t('detail.memo')}</div>
                  <div className="mt-0.5 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {request.memo}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('detail.items')}
            </h3>
            <ExpenseItemsEditor
              items={request.items.map((it) => ({
                name: it.name,
                category: it.category,
                quantity: it.quantity,
                unit_price: it.unitPrice,
                description: it.description ?? undefined,
              }))}
              onChange={() => {}}
              readOnly
            />
          </div>

          {/* Approval Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('detail.approvals')}
            </h3>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <ExpenseApprovalTimeline approvals={request.approvals} />
            </div>
          </div>

          {/* Execution Info */}
          {request.execution && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('detail.execution')}
              </h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{t('execution.executionDate')}</span>
                  <div className="font-medium mt-0.5">
                    {new Date(request.execution.executionDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{t('execution.executionMethod')}</span>
                  <div className="font-medium mt-0.5">
                    {t(`executionMethod.${request.execution.executionMethod}`)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{t('execution.totalAmount')}</span>
                  <div className="font-bold mt-0.5">
                    {Number(request.execution.totalAmount ?? 0).toLocaleString()} {t('common.currency')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">{t('execution.receiptType')}</span>
                  <div className="font-medium mt-0.5">
                    {t(`receiptType.${request.execution.receiptType}`)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('detail.attachments')}
              </h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <Paperclip className="h-3 w-3" />
                  {t('attachment.addFile')}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAttachment.mutate({ id: request.id, file });
                      e.target.value = '';
                    }}
                  />
                </label>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <LinkIcon className="h-3 w-3" />
                  {t('attachment.addLink')}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {request.attachments.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">{t('common.noData')}</p>
              ) : (
                request.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center gap-2 min-w-0">
                      {att.isLink ? (
                        <LinkIcon className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : (
                        <Paperclip className="h-4 w-4 text-gray-400 shrink-0" />
                      )}
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                      >
                        {att.fileName ?? att.fileUrl}
                      </a>
                      {att.fileSize && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {(att.fileSize / 1024).toFixed(1)}KB
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        deleteAttachment.mutate({ expenseId: request.id, attachmentId: att.id })
                      }
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('approval.approve')}
            </h3>
            <textarea
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder={t('approval.commentPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <div className="flex gap-2 justify-end mt-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('form.cancel')}
              </button>
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {t('approval.approve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('approval.reject')}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('approval.rejectReasonPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-2 justify-end mt-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('form.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {t('approval.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Modal */}
      {showExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-[480px]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('execution.title')}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  {t('execution.executionDate')}
                </label>
                <input
                  type="date"
                  value={execForm.execution_date}
                  onChange={(e) => setExecForm((f) => ({ ...f, execution_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">
                    {t('execution.executionMethod')}
                  </label>
                  <select
                    value={execForm.execution_method}
                    onChange={(e) =>
                      setExecForm((f) => ({ ...f, execution_method: e.target.value as ExecutionMethod }))
                    }
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(['CARD', 'CASH', 'TRANSFER', 'OTHER'] as ExecutionMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {t(`executionMethod.${m}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">
                    {t('execution.receiptType')}
                  </label>
                  <select
                    value={execForm.receipt_type}
                    onChange={(e) =>
                      setExecForm((f) => ({ ...f, receipt_type: e.target.value as ReceiptType }))
                    }
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(['RECEIPT', 'TAX_INVOICE', 'NONE'] as ReceiptType[]).map((r) => (
                      <option key={r} value={r}>
                        {t(`receiptType.${r}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  {t('execution.totalAmount')}
                </label>
                <input
                  type="number"
                  min={0}
                  value={execForm.total_amount}
                  onChange={(e) =>
                    setExecForm((f) => ({ ...f, total_amount: Number(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowExecution(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('form.cancel')}
              </button>
              <button
                onClick={handleSaveExecution}
                disabled={createExecution.isPending || updateExecution.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {t('execution.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('attachment.addLink')}
            </h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={t('attachment.linkUrlPlaceholder')}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 justify-end mt-3">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('form.cancel')}
              </button>
              <button
                onClick={() => {
                  if (linkUrl.trim()) {
                    addLink.mutate({ id: request.id, url: linkUrl.trim() });
                    setLinkUrl('');
                    setShowLinkModal(false);
                  }
                }}
                disabled={addLink.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {t('attachment.addLink')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
