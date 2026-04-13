import { useTranslation } from 'react-i18next';
import { UserCircle2, Users, LayoutGrid, Building2 } from 'lucide-react';
import MyCellIcon from '@/components/common/icons/MyCellIcon';

export type ViewScope = 'mine' | 'unit' | 'cell' | 'all' | 'org';

interface ViewScopeTabProps {
  activeScope: ViewScope;
  onScopeChange: (scope: ViewScope) => void;
  scopes?: ViewScope[];
  className?: string;
}

const ALL_SCOPES: ViewScope[] = ['mine', 'unit', 'cell', 'all', 'org'];

const SCOPE_ICONS: Record<ViewScope, React.ReactNode> = {
  mine: <UserCircle2 className="h-4 w-4 shrink-0" />,
  unit: <Users className="h-4 w-4 shrink-0" />,
  cell: <MyCellIcon size={16} />,
  all:  <LayoutGrid className="h-4 w-4 shrink-0" />,
  org:  <Building2 className="h-4 w-4 shrink-0" />,
};

export default function ViewScopeTab({ activeScope, onScopeChange, scopes, className = '' }: ViewScopeTabProps) {
  const { t } = useTranslation('common');
  const displayScopes = scopes ?? ALL_SCOPES;

  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {displayScopes.map((scope) => (
        <button
          key={scope}
          onClick={() => onScopeChange(scope)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            activeScope === scope
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {SCOPE_ICONS[scope]}
          <span className="hidden sm:inline">{t(`viewScope.${scope}`)}</span>
        </button>
      ))}
    </div>
  );
}
