import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-50 text-green-700',
  EXPIRING: 'bg-yellow-50 text-yellow-700',
  EXPIRED: 'bg-red-50 text-red-600',
  ENDED: 'bg-slate-100 text-slate-700',
  RENEWED: 'bg-blue-50 text-blue-700',
  TERMINATED: 'bg-red-100 text-red-700',
  LIQUIDATED: 'bg-purple-50 text-purple-700',
};

export default function ContractStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation(['billing']);
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {t(`billing:contract.status.${status}`)}
    </span>
  );
}
