import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface GridColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface Props {
  columns: GridColumn[];
  data?: Record<string, React.ReactNode>[];
  showCheckbox?: boolean;
  totalCount?: number;
}

export default function MockDataGrid({ columns, data = [], showCheckbox, totalCount }: Props) {
  const { t } = useTranslation(['hanmam']);
  const displayData = data.length > 0 ? data : Array.from({ length: 5 }, (_, i) => {
    const row: Record<string, React.ReactNode> = {};
    columns.forEach((col) => {
      row[col.key] = col.key === 'no' ? i + 1 : '—';
    });
    return row;
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <span className="text-sm text-gray-500">
          {t('hanmam:common.totalCount', { count: totalCount ?? displayData.length })}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {showCheckbox && (
                <th className="w-10 px-3 py-2.5 text-center">
                  <input type="checkbox" disabled className="h-3.5 w-3.5 rounded" />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.map((row, ri) => (
              <tr key={ri} className="hover:bg-gray-50">
                {showCheckbox && (
                  <td className="px-3 py-2.5 text-center">
                    <input type="checkbox" disabled className="h-3.5 w-3.5 rounded" />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 text-gray-700 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
        <span className="text-xs text-gray-400">{t('hanmam:common.page')} 1</span>
        <div className="flex items-center gap-1">
          <button className="rounded p-1 text-gray-400 hover:bg-gray-100" disabled>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">1</button>
          <button className="rounded px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100">2</button>
          <button className="rounded px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100">3</button>
          <button className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
