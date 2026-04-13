import { useTranslation } from 'react-i18next';
import { Lock, Users, Building2, Globe } from 'lucide-react';

const VISIBILITY_CONFIG: Record<string, {
  icon: typeof Lock;
  bg: string;
  text: string;
}> = {
  PRIVATE: { icon: Lock, bg: 'bg-gray-100', text: 'text-gray-600' },
  SHARED: { icon: Users, bg: 'bg-blue-100', text: 'text-blue-600' },
  DEPARTMENT: { icon: Users, bg: 'bg-purple-100', text: 'text-purple-600' },
  ENTITY: { icon: Building2, bg: 'bg-teal-100', text: 'text-teal-600' },
  PUBLIC: { icon: Globe, bg: 'bg-green-100', text: 'text-green-600' },
};

export default function VisibilityBadge({ visibility }: { visibility: string }) {
  const { t } = useTranslation('acl');
  const config = VISIBILITY_CONFIG[visibility] || VISIBILITY_CONFIG.PRIVATE;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="h-3 w-3" />
      {t(`visibility.${visibility}`)}
    </span>
  );
}
