import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MockMonthCalendar() {
  const { t } = useTranslation(['hanmam']);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const prev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <button onClick={prev} className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {year}{t('hanmam:common.year')} {month}{t('hanmam:common.month')}
        </span>
        <button onClick={next} className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="p-2">
        <div className="grid grid-cols-7 gap-px">
          {dayNames.map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
              {d}
            </div>
          ))}
          {weeks.flat().map((day, i) => (
            <div
              key={i}
              className={`flex h-20 flex-col rounded border border-transparent p-1 text-sm hover:border-indigo-200 hover:bg-indigo-50/30 ${
                day === null ? 'bg-gray-50/50' : ''
              } ${i % 7 === 0 ? 'text-red-400' : i % 7 === 6 ? 'text-blue-400' : 'text-gray-700'}`}
            >
              {day && (
                <>
                  <span className="text-xs">{day}</span>
                  {day === 5 && (
                    <span className="mt-0.5 truncate rounded bg-indigo-100 px-1 text-[10px] text-indigo-600">
                      {t('hanmam:common.mockData')}
                    </span>
                  )}
                  {day === 12 && (
                    <span className="mt-0.5 truncate rounded bg-green-100 px-1 text-[10px] text-green-600">
                      {t('hanmam:common.mockData')}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
