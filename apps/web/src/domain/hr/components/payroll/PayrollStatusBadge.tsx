import { useTranslation } from 'react-i18next';

interface Props {
  status: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CALCULATING: 'bg-blue-100 text-blue-700',
  CALCULATED: 'bg-yellow-100 text-yellow-700',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-700',
  APPROVED_L1: 'bg-indigo-100 text-indigo-700',
  APPROVED_L2: 'bg-purple-100 text-purple-700',
  FINALIZED: 'bg-green-100 text-green-700',
};

export default function PayrollStatusBadge({ status }: Props) {
  const { t } = useTranslation(['hr']);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {t(`hr:payroll.status.${status}`)}
    </span>
  );
}
