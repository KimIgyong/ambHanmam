import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useSnapshotCalendar } from '../../hooks/useMyToday';

const SCORE_COLORS: Record<string, string> = {
  HALF: 'bg-orange-400',
  PARTIAL: 'bg-yellow-400',
  ALL_DONE: 'bg-green-400',
  EXCEED: 'bg-purple-500',
  ZERO: 'bg-red-400',
  GOOD: 'bg-blue-400',
  PERFECT: 'bg-green-400',
};

type ViewMode = 'week' | 'month';

/** 주어진 날짜가 속한 주의 일요일~토요일 Date 배열 반환 */
function getWeekDates(base: Date): Date[] {
  const d = new Date(base);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TodayHistoryCalendar() {
  const { t } = useTranslation('today');
  const navigate = useNavigate();
  const now = new Date();
  const todayStr = fmtDate(now);

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [weekBase, setWeekBase] = useState(now);

  const { data } = useSnapshotCalendar(year, month);
  const dayMap = new Map(data?.days.map((d) => [d.date, d]) || []);

  // 주간 뷰에서 사용할 주의 날짜 배열
  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);

  // 주간 뷰 네비게이션 시 데이터가 다른 달에 걸칠 경우 해당 달의 데이터도 필요
  // weekBase 변경 시 year/month를 동기화
  const syncMonthFromWeek = (base: Date) => {
    const m = base.getMonth() + 1;
    const y = base.getFullYear();
    if (y !== year || m !== month) {
      setYear(y);
      setMonth(m);
    }
  };

  const prevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
    syncMonthFromWeek(d);
  };
  const nextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
    syncMonthFromWeek(d);
  };

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  // 월간 달력 그리드
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  // 통계
  const totalDays = data?.days.length || 0;
  const avgScore = totalDays > 0
    ? Math.round((data?.days.reduce((sum, d) => sum + (d.checkScore || 0), 0) || 0) / totalDays)
    : 0;

  const renderDayCell = (dateStr: string, dayNum: number, isCurrentMonth = true) => {
    const snap = dayMap.get(dateStr);
    const isToday = dateStr === todayStr;
    return (
      <button
        key={dateStr}
        onClick={() => snap && navigate(`/today/history/${dateStr}`)}
        className={`relative flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors
          ${isToday ? 'ring-1 ring-indigo-400' : ''}
          ${snap ? 'cursor-pointer font-medium text-gray-800 hover:bg-gray-100' : 'cursor-default text-gray-400'}
          ${!isCurrentMonth ? 'opacity-40' : ''}
        `}
      >
        {dayNum}
        {snap && (
          <span
            className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${
              snap.checkResult ? SCORE_COLORS[snap.checkResult] || 'bg-gray-300' : 'bg-gray-300'
            }`}
          />
        )}
      </button>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {/* 헤더 + 뷰 모드 토글 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">
            {t('history.title', { defaultValue: 'History' })}
          </span>
        </div>
        <div className="flex rounded-md border border-gray-200 text-[10px]">
          <button
            onClick={() => setViewMode('week')}
            className={`px-2 py-0.5 rounded-l-md transition-colors ${
              viewMode === 'week' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t('history.weekView', { defaultValue: '주간' })}
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-2 py-0.5 rounded-r-md transition-colors ${
              viewMode === 'month' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t('history.monthView', { defaultValue: '월간' })}
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <>
          {/* 주간 네비게이션 */}
          <div className="mb-3 flex items-center justify-between">
            <button onClick={prevWeek} className="rounded p-1 hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <span className="text-xs font-medium text-gray-700">
              {fmtDate(weekDates[0]).slice(5)} ~ {fmtDate(weekDates[6]).slice(5)}
            </span>
            <button onClick={nextWeek} className="rounded p-1 hover:bg-gray-100">
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {dayLabels.map((d) => (
              <div key={d} className="text-[10px] font-medium text-gray-400">{d}</div>
            ))}
          </div>

          {/* 주간 날짜 셀 */}
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((d) => renderDayCell(fmtDate(d), d.getDate()))}
          </div>
        </>
      ) : (
        <>
          {/* 월간 네비게이션 */}
          <div className="mb-3 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded p-1 hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {year}.{String(month).padStart(2, '0')}
            </span>
            <button onClick={nextMonth} className="rounded p-1 hover:bg-gray-100">
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {dayLabels.map((d) => (
              <div key={d} className="text-[10px] font-medium text-gray-400">{d}</div>
            ))}
          </div>

          {/* 월간 날짜 셀 */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return renderDayCell(dateStr, day);
            })}
          </div>

          {/* 통계 */}
          {totalDays > 0 && (
            <div className="mt-3 text-center text-[10px] text-gray-400">
              {t('history.stats', {
                defaultValue: '이번 달 {{days}}일 기록 · 평균 달성도 {{avg}}%',
                days: totalDays,
                avg: avgScore,
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
