import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import { toast } from 'sonner';
import { HrLeaveRequestResponse } from '@amb/types';
import {
  useMyLeaveBalance,
  useMyLeaveRequests,
  useCreateLeaveRequest,
  useCancelLeaveRequest,
} from '../hooks/useLeaveRequest';

const LEAVE_TYPES = ['ANNUAL', 'AM_HALF', 'PM_HALF', 'SICK', 'SPECIAL', 'MENSTRUATION'] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function MyLeavePage({ embedded }: { embedded?: boolean }) {
  const { t } = useTranslation(['hr', 'common']);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showModal, setShowModal] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useMyLeaveBalance(year);
  const { data: requests, isLoading: requestsLoading } = useMyLeaveRequests(year);
  const createMutation = useCreateLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();

  const handleCancel = useCallback(async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success(t('hr:leaveRequest.cancelSuccess'));
    } catch {
      toast.error(t('hr:leaveRequest.cancelFailed'));
    }
  }, [cancelMutation, t]);

  return (
    <div className={embedded ? '' : 'h-full overflow-y-auto'}>
      <div className={embedded ? '' : 'px-6 py-6'}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          {!embedded && (
          <div>
            <PageTitle>{t('hr:leaveRequest.title')}</PageTitle>
            <p className="mt-1 text-sm text-gray-500">{t('hr:leaveRequest.subtitle')}</p>
          </div>
          )}
          <div className="flex items-center gap-3">
            {/* Year Nav */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-300 px-1 py-1">
              <button onClick={() => setYear((y) => y - 1)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[60px] text-center text-sm font-medium text-gray-900">{year}</span>
              <button onClick={() => setYear((y) => y + 1)} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {t('hr:leaveRequest.newRequest')}
            </button>
          </div>
        </div>

        {/* Balance Card */}
        {balanceLoading ? (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            {t('common:loading')}
          </div>
        ) : balance ? (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">{t('hr:leaveRequest.balance')}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-xs text-gray-500">{t('hr:leaveRequest.entitlement')}</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{balance.entitlement}</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <p className="text-xs text-gray-500">{t('hr:leaveRequest.used')}</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">{balance.used}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-xs text-gray-500">{t('hr:leaveRequest.remaining')}</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{balance.remaining}</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-3 text-center">
                <p className="text-xs text-gray-500">{t('hr:leaveRequest.otConverted')}</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">{balance.otConverted}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">{t('hr:leaveRequest.carryForward')}</p>
                <p className="mt-1 text-2xl font-bold text-gray-600">{balance.carryForward}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {t('hr:leaveRequest.yearsOfService', { years: balance.yearsOfService })}
              {' · '}
              {t('hr:leaveRequest.startDate')}: {balance.startDate}
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            {t('hr:leaveRequest.noBalance')}
          </div>
        )}

        {/* Request History */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-700">{t('hr:leaveRequest.history')}</h2>
          </div>
          {requestsLoading ? (
            <div className="p-6 text-center text-sm text-gray-400">{t('common:loading')}</div>
          ) : !requests || requests.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">{t('hr:leaveRequest.noRequests')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.type')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.period')}</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-500">{t('hr:leaveRequest.col.days')}</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">{t('hr:leaveRequest.col.reason')}</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-500">{t('hr:leaveRequest.col.status')}</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-500">{t('hr:leaveRequest.col.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req: HrLeaveRequestResponse) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {t(`hr:leaveRequest.types.${req.type}`)}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {req.startDate === req.endDate
                          ? req.startDate
                          : `${req.startDate} ~ ${req.endDate}`}
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{req.days}</td>
                      <td className="max-w-[200px] truncate px-4 py-2.5 text-gray-500">{req.reason || '-'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[req.status] || ''}`}>
                          {t(`hr:leaveRequest.statuses.${req.status}`)}
                        </span>
                        {req.status === 'REJECTED' && req.rejectedReason && (
                          <p className="mt-0.5 text-xs text-red-400">{req.rejectedReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {req.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            disabled={cancelMutation.isPending}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            {t('hr:leaveRequest.cancel')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <LeaveRequestModal
          onClose={() => setShowModal(false)}
          onSubmit={async (data) => {
            try {
              await createMutation.mutateAsync(data);
              toast.success(t('hr:leaveRequest.createSuccess'));
              setShowModal(false);
            } catch (err: any) {
              toast.error(err?.response?.data?.message || t('hr:leaveRequest.createFailed'));
            }
          }}
          isPending={createMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Create Leave Request Modal ───

function LeaveRequestModal({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  onSubmit: (data: { type: string; start_date: string; end_date: string; reason?: string }) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation(['hr', 'common']);
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<string>('ANNUAL');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');

  const isHalf = type === 'AM_HALF' || type === 'PM_HALF';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      start_date: startDate,
      end_date: isHalf ? startDate : endDate,
      reason: reason || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('hr:leaveRequest.newRequest')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('hr:leaveRequest.col.type')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {LEAVE_TYPES.map((lt) => (
                <option key={lt} value={lt}>{t(`hr:leaveRequest.types.${lt}`)}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('hr:leaveRequest.col.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* End Date (hidden for half-day) */}
          {!isHalf && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:leaveRequest.col.endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('hr:leaveRequest.col.reason')}
              <span className="ml-1 text-xs text-gray-400">({t('common:optional')})</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t('hr:leaveRequest.reasonPlaceholder')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? t('common:processing') : t('hr:leaveRequest.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
