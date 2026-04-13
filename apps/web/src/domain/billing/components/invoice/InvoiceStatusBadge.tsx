import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-blue-50 text-blue-700',
  SENT: 'bg-indigo-50 text-indigo-700',
  PAID: 'bg-green-50 text-green-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
  VOID: 'bg-gray-100 text-gray-400 line-through',
};

interface InvoiceStatusBadgeProps {
  status: string;
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const { t } = useTranslation('billing');
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {t(`billing:invoice.status.${status}`)}
    </span>
  );
}
