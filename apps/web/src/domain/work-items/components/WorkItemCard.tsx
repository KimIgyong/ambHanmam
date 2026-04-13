import { useTranslation } from 'react-i18next';
import { FileText, BarChart3, CheckSquare, StickyNote, Mail, BrainCircuit } from 'lucide-react';
import { WorkItemResponse } from '@amb/types';
import VisibilityBadge from './VisibilityBadge';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const TYPE_ICONS: Record<string, typeof FileText> = {
  DOC: FileText,
  REPORT: BarChart3,
  TODO: CheckSquare,
  NOTE: StickyNote,
  EMAIL: Mail,
  ANALYSIS: BrainCircuit,
};

const TYPE_COLORS: Record<string, string> = {
  DOC: 'bg-blue-100 text-blue-600',
  REPORT: 'bg-orange-100 text-orange-600',
  TODO: 'bg-green-100 text-green-600',
  NOTE: 'bg-yellow-100 text-yellow-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  ANALYSIS: 'bg-pink-100 text-pink-600',
};

interface WorkItemCardProps {
  item: WorkItemResponse;
  onClick?: () => void;
}

export default function WorkItemCard({ item, onClick }: WorkItemCardProps) {
  const { t } = useTranslation('acl');
  const Icon = TYPE_ICONS[item.type] || FileText;
  const colorClass = TYPE_COLORS[item.type] || TYPE_COLORS.DOC;

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
          <VisibilityBadge visibility={item.visibility} />
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          <span>{item.ownerName}</span>
          <span>{t(`workItem.type.${item.type}`)}</span>
          <span>{<LocalDateTime value={item.updatedAt} format='YYYY-MM-DD HH:mm' />}</span>
        </div>
      </div>
    </div>
  );
}
