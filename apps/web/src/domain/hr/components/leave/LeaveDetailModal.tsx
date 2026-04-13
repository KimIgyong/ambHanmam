import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useEmployeeLeaveBalance, useUpdateLeaveBalance } from '../../hooks/useLeave';
import { formatDate } from '@/lib/format-utils';

interface LeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  year: number;
  isAdmin?: boolean;
}

export default function LeaveDetailModal({ isOpen, onClose, employeeId, year, isAdmin }: LeaveDetailModalProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: balance, isLoading } = useEmployeeLeaveBalance(employeeId, year);
  const updateMutation = useUpdateLeaveBalance();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    entitlement: 0,
    used: 0,
    otConverted: 0,
    carryForward: 0,
  });

  useEffect(() => {
    if (balance) {
      setForm({
        entitlement: balance.entitlement,
        used: balance.used,
        otConverted: balance.otConverted,
        carryForward: balance.carryForward,
      });
    }
  }, [balance]);

  useEffect(() => {
    if (!isOpen) setIsEditing(false);
  }, [isOpen]);

  const computedRemaining = form.entitlement + form.carryForward - form.used - form.otConverted;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        empId: employeeId,
        year,
        data: {
          entitlement: form.entitlement,
          used: form.used,
          carry_forward: form.carryForward,
          ot_converted: form.otConverted,
        },
      });
      toast.success(t('hr:leave.detail.updateSuccess'));
      setIsEditing(false);
    } catch {
      toast.error(t('hr:leave.detail.updateFailed'));
    }
  };

  if (!isOpen) return null;

  const displayEntitlement = isEditing ? form.entitlement : (balance?.entitlement ?? 0);
  const displayUsed = isEditing ? form.used : (balance?.used ?? 0);

  const usedRatio = displayEntitlement > 0
    ? Math.min((displayUsed / displayEntitlement) * 100, 100)
    : 0;

  const getProgressColor = () => {
    if (usedRatio >= 90) return 'bg-red-500';
    if (usedRatio >= 70) return 'bg-yellow-500';
    return 'bg-teal-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('hr:leave.detail.title')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : balance ? (
          <div className="mt-4 space-y-4">
            {/* Employee Info */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">{balance.employeeName}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span className="font-mono">{balance.employeeCode}</span>
                <span>&middot;</span>
                <span>{balance.department}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>{t('hr:leave.detail.used')} / {t('hr:leave.detail.entitlement')}</span>
                <span className="font-medium text-gray-900">{balance.used} / {balance.entitlement}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor()}`}
                  style={{ width: `${usedRatio}%` }}
                />
              </div>
            </div>

            {/* Detail Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">{t('hr:leave.detail.entitlement')}</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.entitlement}
                    onChange={(e) => setForm((f) => ({ ...f, entitlement: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-lg font-semibold text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-lg font-semibold text-gray-900">{balance.entitlement}</p>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">{t('hr:leave.detail.used')}</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.used}
                    onChange={(e) => setForm((f) => ({ ...f, used: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-lg font-semibold text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-lg font-semibold text-gray-900">{balance.used}</p>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">{t('hr:leave.detail.otConverted')}</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.otConverted}
                    onChange={(e) => setForm((f) => ({ ...f, otConverted: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-lg font-semibold text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-lg font-semibold text-gray-900">{balance.otConverted}</p>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">{t('hr:leave.detail.carryForward')}</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.carryForward}
                    onChange={(e) => setForm((f) => ({ ...f, carryForward: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-lg font-semibold text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-lg font-semibold text-gray-900">{balance.carryForward}</p>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">{t('hr:leave.detail.remaining')}</p>
                <p className="mt-1 text-lg font-semibold text-teal-600">{isEditing ? computedRemaining : balance.remaining}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">{t('hr:leave.detail.yearsOfService')}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{balance.yearsOfService}</p>
              </div>
            </div>

            {/* Start Date */}
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500">{t('hr:leave.detail.startDate')}</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(balance.startDate)}</p>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          {isAdmin && !isEditing && balance && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('common:edit')}
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (balance) {
                    setForm({
                      entitlement: balance.entitlement,
                      used: balance.used,
                      otConverted: balance.otConverted,
                      carryForward: balance.carryForward,
                    });
                  }
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {updateMutation.isPending ? t('common:saving') : t('common:save')}
              </button>
            </>
          )}
          {!isEditing && (
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
