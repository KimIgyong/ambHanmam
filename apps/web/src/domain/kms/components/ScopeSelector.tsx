import { useTranslation } from 'react-i18next';
import { TagCloudScope, TAG_CLOUD_SCOPE } from '@amb/types';

interface ScopeSelectorProps {
  value: TagCloudScope;
  onChange: (scope: TagCloudScope) => void;
}

export default function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  const { t } = useTranslation('kms');

  const scopes: { key: TagCloudScope; label: string }[] = [
    { key: TAG_CLOUD_SCOPE.MY as TagCloudScope, label: t('scope.my') },
    { key: TAG_CLOUD_SCOPE.TEAM as TagCloudScope, label: t('scope.team') },
    { key: TAG_CLOUD_SCOPE.COMPANY as TagCloudScope, label: t('scope.company') },
  ];

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      {scopes.map((scope) => (
        <button
          key={scope.key}
          onClick={() => onChange(scope.key)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            value === scope.key
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          {scope.label}
        </button>
      ))}
    </div>
  );
}
