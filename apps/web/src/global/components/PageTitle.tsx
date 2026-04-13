import { useTranslation } from 'react-i18next';
import { BookOpenText } from 'lucide-react';
import { ICON_MAP } from '@/domain/menu/constants/menuConfig';
import { useMenuGuide } from '@/global/contexts/MenuGuideContext';

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTitle({ children, className }: PageTitleProps) {
  const { t } = useTranslation(['common']);
  const { icon, tipTitle, openTip } = useMenuGuide();
  const Icon = icon ? ICON_MAP[icon] : null;

  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-6 w-6 shrink-0 text-gray-400" />}
      <h1 className={`text-2xl font-bold text-gray-900${className ? ` ${className}` : ''}`}>
        {children}
      </h1>
      <button
        type="button"
        onClick={openTip}
        className="rounded-md p-1 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        title={tipTitle ?? t('common:manualTip', { defaultValue: 'Manual / Tip' })}
      >
        <BookOpenText className="h-4 w-4" />
      </button>
    </div>
  );
}
