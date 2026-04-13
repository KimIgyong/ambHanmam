import { useTranslation } from 'react-i18next';

interface WorkItemFilterBarProps {
  scope: string;
  onScopeChange: (scope: string) => void;
  type: string;
  onTypeChange: (type: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export default function WorkItemFilterBar({
  scope,
  onScopeChange,
  type,
  onTypeChange,
  search,
  onSearchChange,
}: WorkItemFilterBarProps) {
  const { t } = useTranslation('acl');

  const scopes = [
    { value: 'MY', label: t('workItem.filter.myItems') },
    { value: 'SHARED', label: t('workItem.filter.shared') },
    { value: 'TEAM', label: t('workItem.filter.team') },
    { value: 'ALL', label: t('workItem.filter.all') },
  ];

  const types = [
    { value: '', label: t('common:all', { ns: 'common' }) },
    { value: 'DOC', label: t('workItem.type.DOC') },
    { value: 'REPORT', label: t('workItem.type.REPORT') },
    { value: 'TODO', label: t('workItem.type.TODO') },
    { value: 'NOTE', label: t('workItem.type.NOTE') },
    { value: 'EMAIL', label: t('workItem.type.EMAIL') },
    { value: 'ANALYSIS', label: t('workItem.type.ANALYSIS') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Scope Tabs */}
      <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
        {scopes.map((s) => (
          <button
            key={s.value}
            onClick={() => onScopeChange(s.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              scope === s.value
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 focus:border-indigo-500 focus:outline-none"
      >
        {types.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search..."
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 focus:border-indigo-500 focus:outline-none w-48"
      />
    </div>
  );
}
