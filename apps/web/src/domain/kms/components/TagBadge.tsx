import { useTranslation } from 'react-i18next';
import { TagLevel, TAG_LEVEL } from '@amb/types';

interface TagBadgeProps {
  name: string;
  display?: string;
  level: TagLevel;
  color?: string | null;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const LEVEL_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  [TAG_LEVEL.DOMAIN]: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'D' },
  [TAG_LEVEL.TOPIC]: { bg: 'bg-green-100', text: 'text-green-800', label: 'T' },
  [TAG_LEVEL.CONTEXT]: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'C' },
};

export default function TagBadge({ name, display, level, color, onRemove, onClick, size = 'md' }: TagBadgeProps) {
  const { t } = useTranslation('kms');
  const style = LEVEL_STYLES[level] || LEVEL_STYLES[TAG_LEVEL.TOPIC];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${
        color ? '' : `${style.bg} ${style.text}`
      } ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
      onClick={onClick}
      title={`${t(`level.${level === 1 ? 'domain' : level === 2 ? 'topic' : 'context'}`)}: ${display || name}`}
    >
      <span className="text-[10px] font-bold opacity-60">{style.label}</span>
      {display || name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          ×
        </button>
      )}
    </span>
  );
}
