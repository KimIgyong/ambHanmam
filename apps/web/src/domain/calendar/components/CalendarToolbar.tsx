import { useTranslation } from 'react-i18next';
import { CalendarViewType, CalendarFilterMode, useCalendarStore } from '../store/calendar.store';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import ViewScopeTab, { type ViewScope } from '@/shared/components/ViewScopeTab';

const VIEW_OPTIONS: CalendarViewType[] = ['month', 'week', 'day'];

const SCOPE_TO_FILTER: Record<ViewScope, CalendarFilterMode> = {
  mine: 'MY',
  unit: 'UNIT',
  cell: 'CELL',
  all: 'ALL',
  org: 'ALL',
};

const FILTER_TO_SCOPE: Record<string, ViewScope> = {
  MY: 'mine',
  UNIT: 'unit',
  CELL: 'cell',
  ALL: 'all',
  SHARED: 'all',
};

export default function CalendarToolbar() {
  const { t } = useTranslation('calendar');
  const {
    viewType,
    setViewType,
    currentDate,
    goToday,
    goPrev,
    goNext,
    filterMode,
    setFilterMode,
    openForm,
  } = useCalendarStore();

  const titleText = (() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    if (viewType === 'month') return `${y}. ${m}`;
    if (viewType === 'week') {
      const d = currentDate.getDate();
      return `${y}. ${m}. ${d}`;
    }
    return `${y}. ${m}. ${currentDate.getDate()}`;
  })();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      {/* Left: navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={goToday}
          className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {t('today')}
        </button>
        <button
          onClick={goPrev}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold ml-2">{titleText}</h2>
      </div>

      {/* Right: filters + view toggle + add */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter mode - ViewScopeTab */}
        <ViewScopeTab
          activeScope={FILTER_TO_SCOPE[filterMode] || 'all'}
          onScopeChange={(scope) => setFilterMode(SCOPE_TO_FILTER[scope])}
          scopes={['mine', 'unit', 'cell', 'all']}
        />

        {/* View toggle */}
        <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
          {VIEW_OPTIONS.map((v) => (
            <button
              key={v}
              onClick={() => setViewType(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewType === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {t(`view.${v}`)}
            </button>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={() => openForm()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('newSchedule')}
        </button>
      </div>
    </div>
  );
}
