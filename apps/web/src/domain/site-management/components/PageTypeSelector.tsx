import { useTranslation } from 'react-i18next';
import {
  FileText,
  LayoutList,
  Newspaper,
  Mail,
  Info,
  ClipboardList,
  CreditCard,
  Layout,
  LucideIcon,
} from 'lucide-react';

interface PageTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

interface PageTypeOption {
  type: string;
  icon: LucideIcon;
}

const PAGE_TYPES: PageTypeOption[] = [
  { type: 'STATIC', icon: FileText },
  { type: 'BOARD', icon: LayoutList },
  { type: 'BLOG', icon: Newspaper },
  { type: 'SUBSCRIPTION', icon: Mail },
  { type: 'SERVICE_INFO', icon: Info },
  { type: 'SERVICE_APPLY', icon: ClipboardList },
  { type: 'PAYMENT', icon: CreditCard },
  { type: 'LANDING', icon: Layout },
];

export default function PageTypeSelector({ value, onChange }: PageTypeSelectorProps) {
  const { t } = useTranslation(['site']);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {PAGE_TYPES.map(({ type, icon: Icon }) => {
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-750'
            }`}
          >
            <Icon
              className={`h-6 w-6 ${
                isSelected
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  isSelected
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {t(`site:pageType.${type}`)}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  isSelected
                    ? 'text-indigo-500 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t(`site:pageType.${type}_desc`)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
