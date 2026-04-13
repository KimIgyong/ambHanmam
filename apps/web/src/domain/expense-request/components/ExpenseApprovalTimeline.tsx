import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, XCircle, User } from 'lucide-react';
import type { ExpenseApproval } from '../service/expenseRequest.service';

interface Props {
  approvals: ExpenseApproval[];
}

export default function ExpenseApprovalTimeline({ approvals }: Props) {
  const { t } = useTranslation('expenseRequest');

  if (!approvals.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('approval.noApprover')}</p>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((approval, idx) => (
        <div key={approval.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                approval.status === 'APPROVED'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : approval.status === 'REJECTED'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
              }`}
            >
              {approval.status === 'APPROVED' ? (
                <CheckCircle className="h-4 w-4" />
              ) : approval.status === 'REJECTED' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </div>
            {idx < approvals.length - 1 && (
              <div className="mt-1 h-8 w-0.5 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t(`approval.step${approval.approvalStep}`)}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <User className="h-3 w-3" />
                {approval.approverName}
              </span>
              {approval.isSelfApproval && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {t('approval.selfApproval')}
                </span>
              )}
              {approval.status !== 'PENDING' && (
                <span
                  className={`text-xs ${
                    approval.status === 'APPROVED'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {approval.decidedAt
                    ? new Date(approval.decidedAt).toLocaleDateString()
                    : ''}
                </span>
              )}
            </div>
            {approval.comment && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                {approval.comment}
              </p>
            )}
            {approval.status === 'PENDING' && (
              <p className="mt-0.5 text-xs text-gray-400">{t('approval.pending')}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
