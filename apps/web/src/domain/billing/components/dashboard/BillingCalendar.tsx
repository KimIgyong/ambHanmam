import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useBillingCalendar } from '../../hooks/usePayment';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BillingCalendar() {
  const { t } = useTranslation(['billing']);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const { data: calendarData = [] } = useBillingCalendar(yearMonth);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  // Index contracts by date
  const contractsByDate = new Map<string, typeof calendarData[0]['contracts']>();
  for (const entry of calendarData) {
    contractsByDate.set(entry.date, entry.contracts);
  }

  const goBack = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };

  const goForward = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-orange-500" />
          {t('billing:dashboard.billingCalendar')}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={goForward} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAY_NAMES.map((day) => (
          <div key={day} className="py-1 text-center text-[10px] font-medium text-gray-400 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="min-h-[60px] bg-gray-50 rounded" />;
          }

          const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const contracts = contractsByDate.get(dateStr) || [];

          return (
            <div
              key={idx}
              className={`min-h-[60px] rounded p-1 ${isToday ? 'bg-orange-50 ring-1 ring-orange-300' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className={`text-[11px] font-medium ${isToday ? 'text-orange-600' : 'text-gray-500'}`}>
                {day}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {contracts.slice(0, 3).map((ctr, ci) => (
                  <div
                    key={ci}
                    className={`truncate rounded px-1 py-0.5 text-[9px] font-medium ${
                      ctr.generated
                        ? 'bg-gray-100 text-gray-500'
                        : ctr.direction === 'RECEIVABLE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                    title={`${ctr.partnerName} - ${ctr.title} (${ctr.currency} ${Number(ctr.amount).toLocaleString()})`}
                  >
                    {ctr.partnerName}
                  </div>
                ))}
                {contracts.length > 3 && (
                  <div className="text-[9px] text-gray-400 pl-1">+{contracts.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded bg-blue-100 border border-blue-300" />
          {t('billing:dashboard.receivable')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded bg-red-100 border border-red-300" />
          {t('billing:dashboard.payable')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded bg-gray-100 border border-gray-300" />
          {t('billing:dashboard.calendarGenerated')}
        </span>
      </div>
    </div>
  );
}
