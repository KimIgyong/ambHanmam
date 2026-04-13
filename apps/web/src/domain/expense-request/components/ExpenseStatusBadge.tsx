import { useTranslation } from 'react-i18next';
import type { ExpenseRequestStatus } from '../service/expenseRequest.service';

interface Props {
  status: ExpenseRequestStatus;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<ExpenseRequestStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED_L1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  EXECUTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export default function ExpenseStatusBadge({ status, size = 'sm' }: Props) {
  const { t } = useTranslation('expenseRequest');
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${STATUS_STYLES[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
