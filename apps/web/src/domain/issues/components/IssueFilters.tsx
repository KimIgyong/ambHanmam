import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Save, X, Bookmark, Users2, UserCheck, Target, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectList } from '@/domain/project/hooks/useProject';
import { useMemberList } from '@/domain/members/hooks/useMembers';
import { useCellList } from '@/domain/members/hooks/useCells';
import { useFilterPresets, useSaveFilterPresets } from '../hooks/useIssues';
import ViewScopeTab, { type ViewScope } from '@/shared/components/ViewScopeTab';

interface IssueFiltersProps {
  filters: {
    type?: string;
    status?: string;
    severity?: string;
    priority?: string;
    search?: string;
    project_id?: string;
    scope?: string;
    reporter_id?: string;
    cell_id?: string;
  };
  onChange: (filters: IssueFiltersProps['filters']) => void;
}

const TYPES = ['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'] as const;
const STATUSES = ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'] as const;
const SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR'] as const;
const PRIORITIES = ['1', '2', '3', '4', '5'] as const;
const MAX_PRESETS = 5;

export default function IssueFilters({ filters, onChange }: IssueFiltersProps) {
  const { t } = useTranslation(['issues', 'common']);
  const { data: projects = [] } = useProjectList();
  const { data: members = [] } = useMemberList();
  const { data: cells = [] } = useCellList();
  const { data: presets = [] } = useFilterPresets();
  const savePresets = useSaveFilterPresets();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSearch = () => {
    onChange({ ...filters, search: searchInput.trim() || undefined });
  };

  const handleSelect = (key: string, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const handleScope = (scope?: string) => {
    onChange({ ...filters, scope });
  };

  const handleViewScope = (vs: ViewScope) => {
    const scopeMap: Record<ViewScope, string | undefined> = {
      mine: 'my',
      unit: 'my_unit',
      cell: 'my_cell',
      all: undefined,
      org: undefined,
    };
    handleScope(scopeMap[vs]);
  };

  const activeViewScope: ViewScope =
    filters.scope === 'my' ? 'mine'
    : filters.scope === 'my_assigned' ? 'mine'
    : filters.scope === 'my_unit' ? 'unit'
    : filters.scope === 'my_cell' ? 'cell'
    : filters.scope === 'my_involved' ? 'mine'
    : 'all';

  const toggleMulti = (key: 'type' | 'status', value: string) => {
    const current = filters[key] ? filters[key]!.split(',') : [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next.length > 0 ? next.join(',') : undefined });
  };

  const selectedTypes = filters.type ? filters.type.split(',') : [];
  const selectedStatuses = filters.status ? filters.status.split(',') : [];

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    if (presets.length >= MAX_PRESETS) {
      toast.error(t('issues:filter.presetMaxReached'));
      return;
    }
    const { search, ...filtersToSave } = filters;
    const newPresets = [...presets, { name: presetName.trim(), filters: filtersToSave }];
    savePresets.mutate(newPresets, {
      onSuccess: () => {
        setPresetName('');
        setShowPresetInput(false);
        toast.success(t('issues:filter.presetSaved'));
      },
    });
  };

  const handleApplyPreset = (preset: { name: string; filters: Record<string, any> }) => {
    onChange({ ...preset.filters } as IssueFiltersProps['filters']);
  };

  const handleDeletePreset = (index: number) => {
    const newPresets = presets.filter((_, i) => i !== index);
    savePresets.mutate(newPresets);
  };

  const SCOPES = [
    { key: 'my_involved', labelKey: 'issues:filter.myInvolved', icon: <Users2 className="h-3.5 w-3.5 shrink-0" /> },
    { key: 'my_assigned', labelKey: 'issues:filter.myAssigned', icon: <UserCheck className="h-3.5 w-3.5 shrink-0" /> },
    { key: 'my',          labelKey: 'issues:filter.myIssues',   icon: <Target className="h-3.5 w-3.5 shrink-0" /> },
    { key: undefined,     labelKey: 'issues:filter.allIssues',  icon: <LayoutGrid className="h-3.5 w-3.5 shrink-0" /> },
  ] as const;

  const hasActiveFilters = filters.type || filters.status || filters.severity || filters.priority || filters.project_id || filters.scope || filters.reporter_id || filters.cell_id;

  return (
    <div className="mb-4 space-y-3">
      {/* Single row: left issue scopes + right view scopes */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          {SCOPES.map(({ key, labelKey, icon }) => (
            <button
              key={labelKey}
              onClick={() => handleScope(key)}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filters.scope === key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{t(labelKey)}</span>
            </button>
          ))}
        </div>

        <ViewScopeTab
          activeScope={activeViewScope}
          onScopeChange={handleViewScope}
          scopes={['mine', 'unit', 'cell', 'all']}
        />
      </div>
      {/* Presets bar */}
      {(presets.length > 0 || hasActiveFilters) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5 text-gray-400" />
          {presets.map((preset, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              <button onClick={() => handleApplyPreset(preset)} className="hover:underline">
                {preset.name}
              </button>
              <button
                onClick={() => handleDeletePreset(idx)}
                className="rounded-full p-0.5 hover:bg-amber-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {hasActiveFilters && !showPresetInput && presets.length < MAX_PRESETS && (
            <button
              onClick={() => setShowPresetInput(true)}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
            >
              <Save className="h-3 w-3" />
              {t('issues:filter.savePreset')}
            </button>
          )}
          {showPresetInput && (
            <span className="inline-flex items-center gap-1">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                placeholder={t('issues:filter.presetName')}
                className="w-32 rounded-full border border-gray-300 px-2.5 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('common:save')}
              </button>
              <button
                onClick={() => { setShowPresetInput(false); setPresetName(''); }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('issues:filter.search')}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Search className="h-4 w-4" />
          {t('issues:filter.searchButton')}
        </button>
      </div>

      {/* Type + Status - multi-select chips (same line) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500">{t('issues:filter.type')}:</span>
        {TYPES.map((v) => (
          <button
            key={v}
            onClick={() => toggleMulti('type', v)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedTypes.includes(v)
                ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`issues:type.${v}`)}
          </button>
        ))}
        <span className="mx-1 h-4 border-l border-gray-300" />
        <span className="text-xs font-medium text-gray-500">{t('issues:filter.status')}:</span>
        {STATUSES.map((v) => (
          <button
            key={v}
            onClick={() => toggleMulti('status', v)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedStatuses.includes(v)
                ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`issues:status.${v}`)}
          </button>
        ))}
      </div>

      {/* Dropdowns: Reporter, Cell, Severity, Priority, Project */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.reporter_id || ''}
          onChange={(e) => handleSelect('reporter_id', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">{t('issues:filter.reporter')}: {t('issues:filter.allReporters')}</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>{m.name}</option>
          ))}
        </select>
        <select
          value={filters.cell_id || ''}
          onChange={(e) => handleSelect('cell_id', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">{t('issues:filter.cell')}: {t('issues:filter.allCells')}</option>
          {cells.map((c) => (
            <option key={c.cellId} value={c.cellId}>{c.name}</option>
          ))}
        </select>
        <select
          value={filters.severity || ''}
          onChange={(e) => handleSelect('severity', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">{t('issues:filter.severity')}: {t('issues:filter.all')}</option>
          {SEVERITIES.map((v) => (
            <option key={v} value={v}>{t(`issues:severity.${v}`)}</option>
          ))}
        </select>
        <select
          value={filters.priority || ''}
          onChange={(e) => handleSelect('priority', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">{t('issues:filter.priority')}: {t('issues:filter.all')}</option>
          {PRIORITIES.map((v) => (
            <option key={v} value={v}>{t(`issues:priority.${v}`)}</option>
          ))}
        </select>
        <select
          value={filters.project_id || ''}
          onChange={(e) => handleSelect('project_id', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">{t('issues:filter.project')}: {t('issues:filter.all')}</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>{p.code ? `[${p.code}] ` : ''}{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
