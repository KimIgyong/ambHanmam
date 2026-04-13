import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  const { t } = useTranslation(['drive']);

  return (
    <nav className="flex items-center gap-1 text-sm">
      <button
        onClick={() => onNavigate(-1)}
        className="rounded px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        {t('drive:breadcrumb.root')}
      </button>
      {items.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="rounded px-1.5 py-0.5 font-medium text-gray-900">
              {item.name}
            </span>
          ) : (
            <button
              onClick={() => onNavigate(index)}
              className="rounded px-1.5 py-0.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}
