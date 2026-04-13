import { useTranslation } from 'react-i18next';
import { Calculator, Send, CheckCircle, XCircle, Lock } from 'lucide-react';
import {
  useCalculatePayroll,
  useSubmitPayroll,
  useApprovePayroll,
  useFinalizePayroll,
  useRejectPayroll,
} from '../../hooks/usePayroll';
import PayrollStatusBadge from './PayrollStatusBadge';

interface Props {
  periodId: string;
  status: string;
  isAdmin: boolean;
  isManager?: boolean;
  onAction: () => void;
}

export default function PayrollProcessing({ periodId, status, isAdmin, isManager = false, onAction }: Props) {
  const { t } = useTranslation(['hr', 'common']);

  const calculateMut = useCalculatePayroll();
  const submitMut = useSubmitPayroll();
  const approveMut = useApprovePayroll();
  const finalizeMut = useFinalizePayroll();
  const rejectMut = useRejectPayroll();

  const isPending =
    calculateMut.isPending || submitMut.isPending || approveMut.isPending || finalizeMut.isPending || rejectMut.isPending;

  const canApproveL1 = isAdmin || isManager;

  const handleAction = async (action: () => Promise<unknown>) => {
    await action();
    onAction();
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{t('hr:payroll.currentStatus')}:</span>
          <PayrollStatusBadge status={status} />
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && status === 'DRAFT' && (
            <button
              onClick={() => handleAction(() => calculateMut.mutateAsync(periodId))}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Calculator className="h-4 w-4" />
              {t('hr:payroll.calculate')}
            </button>
          )}

          {isAdmin && status === 'CALCULATED' && (
            <button
              onClick={() => handleAction(() => submitMut.mutateAsync(periodId))}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {t('hr:payroll.submit')}
            </button>
          )}

          {canApproveL1 && status === 'PENDING_APPROVAL' && (
            <>
              <button
                onClick={() => handleAction(() => approveMut.mutateAsync(periodId))}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {t('hr:payroll.approve')}
              </button>
              <button
                onClick={() => handleAction(() => rejectMut.mutateAsync(periodId))}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {t('hr:payroll.reject')}
              </button>
            </>
          )}

          {isAdmin && status === 'APPROVED_L1' && (
            <>
              <button
                onClick={() => handleAction(() => finalizeMut.mutateAsync(periodId))}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {t('hr:payroll.finalApprove')}
              </button>
              <button
                onClick={() => handleAction(() => rejectMut.mutateAsync(periodId))}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {t('hr:payroll.reject')}
              </button>
            </>
          )}

          {status === 'FINALIZED' && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Lock className="h-4 w-4" />
              {t('hr:payroll.finalized')}
            </span>
          )}
        </div>
      </div>

      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
          {t('common:processing')}
        </div>
      )}
    </div>
  );
}
