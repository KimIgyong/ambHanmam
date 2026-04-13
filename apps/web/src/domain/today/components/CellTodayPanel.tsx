import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCellToday } from '../hooks/useMyToday';
import TeamTodayPanel from './TeamTodayPanel';

export default function CellTodayPanel() {
  const { t } = useTranslation('today');
  const { data, isLoading } = useCellToday();
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  const cells = data?.cells ?? [];
  const filteredData = selectedCellId && data
    ? { ...data, members: data.members.filter((m) => m.cellIds?.includes(selectedCellId)) }
    : data;

  return (
    <div>
      {/* 셀 선택 필터 */}
      {cells.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{t('cell.myCells')}:</span>
          <button
            onClick={() => setSelectedCellId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedCellId
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('cell.showAll')}
          </button>
          {cells.map((c) => (
            <button
              key={c.cellId}
              onClick={() => setSelectedCellId(c.cellId === selectedCellId ? null : c.cellId)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCellId === c.cellId
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.cellName}
            </button>
          ))}
        </div>
      )}
      <TeamTodayPanel data={filteredData} isLoading={isLoading} />
    </div>
  );
}
