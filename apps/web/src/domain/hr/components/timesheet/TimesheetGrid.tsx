import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { useMonthlyTimesheet } from '../../hooks/useTimesheet';
import AttendanceCodeSelector from './AttendanceCodeSelector';

interface TimesheetEntry {
  employee_id: string;
  work_date: string;
  attendance_code?: string;
}

interface Props {
  year: number;
  month: number;
  isAdmin: boolean;
  onSave: (entries: TimesheetEntry[]) => void;
  isSaving: boolean;
}

const CYCLE_CODES = [null, '8', 'AL', 'H', null] as const;

function getCellBg(code: string | null): string {
  if (!code) return '';
  switch (code) {
    case '8':
    case '4':
      return 'bg-green-100 text-green-800';
    case 'AL':
    case 'PL':
    case 'SL':
    case 'M':
      return 'bg-orange-100 text-orange-800';
    case 'H':
      return 'bg-blue-100 text-blue-800';
    case 'AB':
    case 'UP':
      return 'bg-red-100 text-red-800';
    case 'RE':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function isWeekend(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatWorkDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function TimesheetGrid({ year, month, isAdmin, onSave, isSaving }: Props) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: employees = [], isLoading } = useMonthlyTimesheet(year, month);

  const [modifications, setModifications] = useState<Record<string, string | null>>({});
  const [selectorState, setSelectorState] = useState<{
    key: string;
    employeeId: string;
    day: number;
  } | null>(null);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const modKey = useCallback(
    (employeeId: string, day: number) => `${employeeId}::${day}`,
    [],
  );

  const getEffectiveCode = useCallback(
    (employeeId: string, day: number, originalCode: string | null): string | null => {
      const key = modKey(employeeId, day);
      if (key in modifications) return modifications[key];
      return originalCode;
    },
    [modifications, modKey],
  );

  const handleCellClick = useCallback(
    (employeeId: string, day: number, currentCode: string | null) => {
      if (!isAdmin) return;

      const currentIndex = CYCLE_CODES.indexOf(currentCode as typeof CYCLE_CODES[number]);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % CYCLE_CODES.length : 1;
      const nextCode = CYCLE_CODES[nextIndex];

      const key = modKey(employeeId, day);
      setModifications((prev) => ({ ...prev, [key]: nextCode }));
    },
    [isAdmin, modKey],
  );

  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, employeeId: string, day: number) => {
      if (!isAdmin) return;
      e.preventDefault();
      const key = modKey(employeeId, day);
      setSelectorState({ key, employeeId, day });
    },
    [isAdmin, modKey],
  );

  const handleSelectorChange = useCallback(
    (code: string | null) => {
      if (!selectorState) return;
      setModifications((prev) => ({ ...prev, [selectorState.key]: code }));
      setSelectorState(null);
    },
    [selectorState],
  );

  const hasChanges = Object.keys(modifications).length > 0;

  const handleSave = useCallback(() => {
    const entries: TimesheetEntry[] = Object.entries(modifications).map(([key, code]) => {
      const [employeeId, dayStr] = key.split('::');
      const day = parseInt(dayStr, 10);
      return {
        employee_id: employeeId,
        work_date: formatWorkDate(year, month, day),
        ...(code != null ? { attendance_code: code } : {}),
      };
    });
    onSave(entries);
    setModifications({});
  }, [modifications, onSave, year, month]);

  const computeSummary = useCallback(
    (employeeId: string, originalEntries: Record<string, { attendanceCode: string | null; workHours: number }>) => {
      let workDays = 0;
      let leaveDays = 0;

      for (const day of days) {
        const dateKey = formatWorkDate(year, month, day);
        const original = originalEntries[dateKey]?.attendanceCode ?? null;
        const code = getEffectiveCode(employeeId, day, original);

        if (code === '8' || code === '4') {
          workDays++;
        } else if (code === 'AL' || code === 'PL' || code === 'SL' || code === 'M' || code === 'UP') {
          leaveDays++;
        }
      }

      return { workDays, leaveDays };
    },
    [days, year, month, getEffectiveCode],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        {t('hr:timesheet.noEmployees')}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Save button */}
      {hasChanges && (
        <div className="sticky top-0 z-10 flex justify-end border-b border-teal-100 bg-teal-50 px-4 py-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? t('hr:timesheet.saving') : t('hr:timesheet.save')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="sticky left-0 z-[5] bg-white px-3 py-2 text-left">
                {t('hr:timesheet.employee')}
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className={`min-w-[32px] px-1 py-2 text-center ${
                    isWeekend(year, month, day) ? 'bg-gray-50' : ''
                  }`}
                >
                  {day}
                </th>
              ))}
              <th className="px-2 py-2 text-center">{t('hr:timesheet.summary.workDays')}</th>
              <th className="px-2 py-2 text-center">{t('hr:timesheet.summary.leaveDays')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const summary = computeSummary(emp.employeeId, emp.entries);
              return (
                <tr key={emp.employeeId} className="transition-colors hover:bg-gray-50/50">
                  <td className="sticky left-0 z-[5] bg-white px-3 py-1.5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-gray-400">
                        {emp.employeeCode}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{emp.employeeName}</span>
                    </div>
                  </td>
                  {days.map((day) => {
                    const dateKey = formatWorkDate(year, month, day);
                    const originalCode = emp.entries[dateKey]?.attendanceCode ?? null;
                    const effectiveCode = getEffectiveCode(emp.employeeId, day, originalCode);
                    const cellKey = modKey(emp.employeeId, day);
                    const isModified = cellKey in modifications;
                    const weekend = isWeekend(year, month, day);

                    return (
                      <td
                        key={day}
                        className={`relative px-1 py-1.5 text-center ${
                          weekend ? 'bg-gray-50' : ''
                        } ${isAdmin ? 'cursor-pointer' : ''}`}
                        onClick={() => handleCellClick(emp.employeeId, day, effectiveCode)}
                        onContextMenu={(e) => handleCellRightClick(e, emp.employeeId, day)}
                        title={
                          effectiveCode
                            ? t(`hr:timesheet.attendance.${effectiveCode}`)
                            : undefined
                        }
                      >
                        {effectiveCode ? (
                          <span
                            className={`inline-flex h-5 min-w-[24px] items-center justify-center rounded px-0.5 text-[10px] font-semibold ${getCellBg(effectiveCode)} ${
                              isModified ? 'ring-1 ring-teal-400' : ''
                            }`}
                          >
                            {effectiveCode}
                          </span>
                        ) : null}

                        {/* Attendance Code Selector (right-click popup) */}
                        {selectorState?.key === cellKey && (
                          <AttendanceCodeSelector
                            value={effectiveCode}
                            onChange={handleSelectorChange}
                            isOpen
                            onClose={() => setSelectorState(null)}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-center font-semibold text-teal-700">
                    {summary.workDays}
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-orange-600">
                    {summary.leaveDays}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
