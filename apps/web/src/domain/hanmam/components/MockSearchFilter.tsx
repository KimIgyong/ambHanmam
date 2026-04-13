import { useTranslation } from 'react-i18next';
import { Search, RotateCcw } from 'lucide-react';

export interface FilterField {
  type: 'text' | 'select' | 'radio' | 'date-range';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface Props {
  filters: FilterField[];
}

export default function MockSearchFilter({ filters }: Props) {
  const { t } = useTranslation(['hanmam']);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        {filters.map((f, i) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{f.label}</label>
            {f.type === 'text' && (
              <input
                type="text"
                placeholder={f.placeholder || ''}
                className="h-9 w-44 rounded-md border border-gray-300 px-3 text-sm focus:border-indigo-400 focus:outline-none"
                readOnly
              />
            )}
            {f.type === 'select' && (
              <select className="h-9 w-36 rounded-md border border-gray-300 px-2 text-sm focus:border-indigo-400 focus:outline-none" disabled>
                <option>{t('hanmam:common.all')}</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
            {f.type === 'radio' && (
              <div className="flex items-center gap-2">
                {f.options?.map((o) => (
                  <label key={o.value} className="flex items-center gap-1 text-sm text-gray-600">
                    <input type="radio" name={`filter-${i}`} disabled className="h-3.5 w-3.5" />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
            {f.type === 'date-range' && (
              <div className="flex items-center gap-1">
                <input type="date" className="h-9 w-32 rounded-md border border-gray-300 px-2 text-sm" readOnly />
                <span className="text-gray-400">~</span>
                <input type="date" className="h-9 w-32 rounded-md border border-gray-300 px-2 text-sm" readOnly />
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
            <Search className="h-3.5 w-3.5" />
            {t('hanmam:button.search')}
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <RotateCcw className="h-3.5 w-3.5" />
            {t('hanmam:button.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
