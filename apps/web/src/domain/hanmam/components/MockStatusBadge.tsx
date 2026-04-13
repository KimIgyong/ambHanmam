interface Props {
  status: 'completed' | 'inProgress' | 'pending' | 'cancelled' | 'approved' | 'rejected' | 'draft' | 'urgent' | 'normal';
  label?: string;
}

const COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  inProgress: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-700',
  urgent: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  rejected: 'bg-orange-100 text-orange-700',
  draft: 'bg-blue-100 text-blue-600',
  normal: 'bg-gray-100 text-gray-600',
};

export default function MockStatusBadge({ status, label }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status] || COLORS.normal}`}>
      {label || status}
    </span>
  );
}
