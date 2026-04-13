import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { HrLeaveRequestResponse } from '@amb/types';
import {
  useLeaveRequests,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from '../hooks/useLeaveRequest';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function LeaveRequestAdminPage() {
  const { t } = useTranslation(['hr', 'common']);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useLeaveRequests({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    year,
    page,
    limit: 20,
  });

  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();

  const handleApprove = useCallback(async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success(t('hr:leaveRequest.approveSuccess'));
    } catch {
      toast.error(t('hr:leaveRequest.approveFailed'));
    }
  }, [approveMutation, t]);

  const handleReject = useCallback(async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget, reason: rejectReason });
      toast.success(t('hr:leaveRequest.rejectSuccess'));
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast.error(t('hr:leaveRequest.rejectFailed'));
    }
  }, [rejectTarget, rejectReason, rejectMutation, t]);

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:leaveRequest.adminTitle')}</h1>
              <p className="text-sm text-gray-500">{t('hr:leaveRequest.adminSubtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-300 px-1 py-1">
            <button onClick={() => setYear((y) => y - 1)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[60px] text-center text-sm font-medium text-gray-900">{year}</span>
            <button onClick={() => setYear((y) => y + 1)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="mt-4 flex gap-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t(`hr:leaveRequest.statusTabs.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-400">{t('common:loading')}</div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">{t('hr:leaveRequest.noRequests')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.employee')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.department')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.type')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.period')}</th>
                  <th className="px-4 py-2.5 text-center font-medium text-gray-500">{t('hr:leaveRequest.col.days')}</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.reason')}</th>
                  <th className="px-4 py-2.5 text-center font-medium text-gray-500">{t('hr:leaveRequest.col.status')}</th>
                  <th className="px-4 py-2.5 text-center font-medium text-gray-500">{t('hr:leaveRequest.col.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((req: HrLeaveRequestResponse) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900">{req.employeeName}</span>
                      <span className="ml-1 text-xs text-gray-400">{req.employeeCode}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{req.department}</td>
                    <td className="px-4 py-2.5 text-gray-700">{t(`hr:leaveRequest.types.${req.type}`)}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {req.startDate === req.endDate ? req.startDate : `${req.startDate} ~ ${req.endDate}`}
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{req.days}</td>
                    <td className="max-w-[180px] truncate px-4 py-2.5 text-gray-500">{req.reason || '-'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[req.status] || ''}`}>
                        {t(`hr:leaveRequest.statuses.${req.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {req.status === 'PENDING' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={approveMutation.isPending}
                            className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                          >
                            {t('hr:leaveRequest.approve')}
                          </button>
                          <button
                            onClick={() => setRejectTarget(req.id)}
                            className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            {t('hr:leaveRequest.reject')}
                          </button>
                        </div>
                      )}
                      {req.status !== 'PENDING' && req.approverName && (
                        <span className="text-xs text-gray-400">{req.approverName}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('hr:leaveRequest.rejectTitle')}</h3>
            </div>
            <div className="space-y-4 p-6">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder={t('hr:leaveRequest.rejectReasonPlaceholder')}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {t('hr:leaveRequest.reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
