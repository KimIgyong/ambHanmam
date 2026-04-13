import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useApprovals, useApproveOrReject, useAssetList } from '../hooks/useAsset';
import type { AssetRequest, AssetRequestListQuery } from '../service/asset.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const REQUEST_STATUSES = ['SUBMITTED', 'L1_APPROVED'] as const;

export default function AssetApprovalTab() {
  const { t } = useTranslation('asset');
  const [query, setQuery] = useState<AssetRequestListQuery>({});
  const { data: approvals, isLoading } = useApprovals(query);
  const { data: assets } = useAssetList();
  const approveOrRejectMutation = useApproveOrReject();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionForm, setActionForm] = useState<{
    action: 'APPROVE' | 'REJECT';
    assignAssetId: string;
    comment: string;
    rejectReason: string;
  }>({ action: 'APPROVE', assignAssetId: '', comment: '', rejectReason: '' });

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      SUBMITTED: 'bg-yellow-100 text-yellow-700',
      L1_APPROVED: 'bg-blue-100 text-blue-700',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  const handleToggle = (req: AssetRequest) => {
    if (expandedId === req.requestId) {
      setExpandedId(null);
    } else {
      setExpandedId(req.requestId);
      setActionForm({ action: 'APPROVE', assignAssetId: '', comment: '', rejectReason: '' });
    }
  };

  const handleAction = async (id: string) => {
    await approveOrRejectMutation.mutateAsync({
      id,
      data: {
        action: actionForm.action,
        assign_asset_id: actionForm.assignAssetId || undefined,
        comment: actionForm.comment || undefined,
        reject_reason: actionForm.rejectReason || undefined,
      },
    });
    setExpandedId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={query.status || ''}
          onChange={(e) => setQuery({ ...query, status: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('common.all')} {t('form.status')}</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`requestStatus.${s}`)}</option>
          ))}
        </select>
      </div>

      {/* Approval list */}
      <div className="space-y-2">
        {isLoading && (
          <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>
        )}
        {!isLoading && (!approvals || approvals.length === 0) && (
          <div className="text-center py-12 text-gray-400">{t('approval.noApprovals')}</div>
        )}
        {approvals?.map((req) => (
          <div key={req.requestId} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {/* Row */}
            <button
              onClick={() => handleToggle(req)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-xs text-gray-500 shrink-0">{req.requestNo}</span>
                <span className="text-sm font-medium truncate">{req.requesterName}</span>
                <span className="text-sm text-gray-500">{t(`requestType.${req.requestType}`)}</span>
                <span className="text-xs text-gray-400">
                  {req.assetName || (req.assetCategory ? t(`category.${req.assetCategory}`) : '')}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(req.status)}`}>
                  {t(`requestStatus.${req.status}`)}
                </span>
                {expandedId === req.requestId ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {/* Expanded action panel */}
            {expandedId === req.requestId && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
                {/* Request details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">{t('request.purpose')}:</span> {req.purpose}</div>
                  <div><span className="text-gray-500">{t('common.period')}:</span> {<LocalDateTime value={req.startAt} format='YYYY-MM-DD HH:mm' />} ~ {<LocalDateTime value={req.endAt} format='YYYY-MM-DD HH:mm' />}</div>
                  {req.place && <div><span className="text-gray-500">{t('request.place')}:</span> {req.place}</div>}
                </div>

                {/* Action type toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActionForm((f) => ({ ...f, action: 'APPROVE' }))}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      actionForm.action === 'APPROVE'
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('approval.approve')}
                  </button>
                  <button
                    onClick={() => setActionForm((f) => ({ ...f, action: 'REJECT' }))}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      actionForm.action === 'REJECT'
                        ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    {t('approval.reject')}
                  </button>
                </div>

                {/* Approve form */}
                {actionForm.action === 'APPROVE' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t('approval.assignAsset')}</label>
                      <select
                        value={actionForm.assignAssetId}
                        onChange={(e) => setActionForm((f) => ({ ...f, assignAssetId: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- {t('approval.assignAsset')} ({t('common.all')}) --</option>
                        {assets?.filter((a) =>
                          !req.assetCategory || a.assetCategory === req.assetCategory
                        ).map((a) => (
                          <option key={a.assetId} value={a.assetId}>
                            [{a.assetCode}] {a.assetName} ({t(`status.${a.status}`)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t('approval.comment')}</label>
                      <input
                        type="text"
                        value={actionForm.comment}
                        onChange={(e) => setActionForm((f) => ({ ...f, comment: e.target.value }))}
                        placeholder={t('approval.commentPlaceholder')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Reject form */}
                {actionForm.action === 'REJECT' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('approval.rejectReason')} <span className="text-red-500">*</span></label>
                    <textarea
                      value={actionForm.rejectReason}
                      onChange={(e) => setActionForm((f) => ({ ...f, rejectReason: e.target.value }))}
                      rows={2}
                      placeholder={t('approval.rejectReasonPlaceholder')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleAction(req.requestId)}
                    disabled={
                      approveOrRejectMutation.isPending ||
                      (actionForm.action === 'REJECT' && !actionForm.rejectReason.trim())
                    }
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                      actionForm.action === 'APPROVE'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionForm.action === 'APPROVE' ? t('approval.approve') : t('approval.reject')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
