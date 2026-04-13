import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorMap: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    INACTIVE: 'bg-gray-100 text-gray-500',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    WITHDRAWN: 'bg-red-100 text-red-700',
  };
  const { t } = useTranslation('members');

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] || colorMap.ACTIVE}`}
    >
      {t(`userStatus.${status}`)}
    </span>
  );
}
