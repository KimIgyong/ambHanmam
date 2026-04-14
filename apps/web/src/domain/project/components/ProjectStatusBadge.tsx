import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  ON_HOLD: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-200 text-slate-600',
  CANCELLED: 'bg-gray-200 text-gray-500',
};

interface ProjectStatusBadgeProps {
  status: string;
}

export default function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const { t } = useTranslation('project');
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {t(`status.${status}`, status)}
    </span>
  );
}
