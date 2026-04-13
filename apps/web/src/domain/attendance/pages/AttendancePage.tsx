import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Trash2, Save, Plus, X, Settings, Pencil } from 'lucide-react';
import { AttendanceResponse, ATTENDANCE_TYPE, START_TIME_OPTIONS } from '@amb/types';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useMemberList } from '@/domain/members/hooks/useMembers';
import {
  useTeamAttendanceList,
  useCreateAttendances,
  useUpdateAttendance,
  useDeleteAttendance,
  useAttendanceMembers,
  useAmendAttendance,
} from '../hooks/useAttendance';
import AttendanceTypeBadge from '../components/AttendanceTypeBadge';
import AttendanceMemberModal from '../components/AttendanceMemberModal';
import PageTitle from '@/global/components/PageTitle';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function getCurrentWeekMonday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  // Sunday=0 → offset 6, Monday=1 → offset 0, etc.
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - offset);
  return monday;
}

type LevelFilter = 'ALL' | 'USER_LEVEL' | 'CLIENT_LEVEL';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isDateEditable(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMonth = new Date(today);
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  return date >= today && date <= oneMonth;
}

function calculateEndTime(type: string, startTime: string): string | null {
  switch (type) {
    case 'OFFICE':
    case 'REMOTE':
    case 'OUTSIDE_WORK':
    case 'BUSINESS_TRIP':
    case 'EXTERNAL_SITE': {
      const [h, m] = startTime.split(':');
      const hour = parseInt(h) + 9;
      return `${hour.toString().padStart(2, '0')}:${m}`;
    }
    case 'AM_HALF':
      return '17:00';
    case 'PM_HALF':
      return '12:00';
    case 'DAY_OFF':
    case 'MENSTRUATION':
      return null;
    default:
      return null;
  }
}

function getDisplayStartTime(type: string, startTime: string): string | null {
  switch (type) {
    case 'OFFICE':
    case 'REMOTE':
    case 'OUTSIDE_WORK':
    case 'BUSINESS_TRIP':
    case 'EXTERNAL_SITE':
    case 'PM_HALF':
      return startTime;
    case 'AM_HALF':
      return '13:00';
    case 'DAY_OFF':
    case 'MENSTRUATION':
      return null;
    default:
      return null;
  }
}

// Type-based cell text color
const TYPE_TEXT_COLOR: Record<string, string> = {
  OFFICE: 'text-gray-700',
  REMOTE: 'text-green-700',
  OUTSIDE_WORK: 'text-blue-600',
  BUSINESS_TRIP: 'text-purple-600',
  EXTERNAL_SITE: 'text-teal-600',
  DAY_OFF: 'text-red-600',
  AM_HALF: 'text-amber-700',
  PM_HALF: 'text-orange-700',
  MENSTRUATION: 'text-pink-600',
};

interface MemberRow {
  userId: string;
  userName: string;
  levelCode?: string;
  schedules: Record<string, AttendanceResponse>;
}

export default function AttendancePage({ embedded }: { embedded?: boolean }) {
  const { t } = useTranslation(['attendance', 'common']);
  const currentUser = useAuthStore((s) => s.user);
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekMonday());
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('USER_LEVEL');
  const [selectedCell, setSelectedCell] = useState<{ userId: string; date: string } | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Amendment modal state
  const [amendCell, setAmendCell] = useState<{ userId: string; date: string } | null>(null);
  const [amendType, setAmendType] = useState('OFFICE');
  const [amendStartTime, setAmendStartTime] = useState('09:00');
  const [amendNote, setAmendNote] = useState('');

  // Multi-day mode state
  const [multiDayMode, setMultiDayMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

  // Form state
  const [formType, setFormType] = useState<string>('OFFICE');
  const [formStartTime, setFormStartTime] = useState('09:00');

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const dateFrom = formatDate(weekStart);
  const dateTo = formatDate(weekEnd);

  const { data: members = [] } = useMemberList();
  const { data: memberSettings = [] } = useAttendanceMembers();
  const { data: allSchedules = [], isLoading } = useTeamAttendanceList(dateFrom, dateTo);
  const createMutation = useCreateAttendances();
  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();
  const amendMutation = useAmendAttendance();

  const canAmend = currentUser?.role === 'MASTER' || currentUser?.role === 'MANAGER';

  const weekDays = useMemo(() => {
    return DAY_KEYS.map((key, i) => {
      const date = addDays(weekStart, i);
      return { date: formatDate(date), dayKey: key };
    });
  }, [weekStart]);

  // Build rows: all members with their schedules
  const memberRows = useMemo(() => {
    // Build schedule lookup: userId -> date -> schedule
    const scheduleMap = new Map<string, Record<string, AttendanceResponse>>();
    for (const s of allSchedules) {
      if (!scheduleMap.has(s.userId)) {
        scheduleMap.set(s.userId, {});
      }
      scheduleMap.get(s.userId)![s.date] = s;
    }

    // Build rows from full member list, applying visibility & order settings
    const settingsMap = new Map(memberSettings.map((s) => [s.userId, s]));
    const rows: MemberRow[] = members
      .filter((m) => {
        const setting = settingsMap.get(m.userId);
        // Always show current user; hide if setting says hidden
        if (m.userId === currentUser?.userId) return true;
        if (setting?.hidden) return false;
        // Level filter
        if (levelFilter !== 'ALL') {
          const userLevel = m.levelCode || 'USER_LEVEL';
          if (userLevel !== levelFilter) return false;
        }
        return true;
      })
      .map((m) => ({
        userId: m.userId,
        userName: m.name,
        levelCode: m.levelCode,
        schedules: scheduleMap.get(m.userId) || {},
      }));

    // Sort: current user first, then by custom order, then alphabetical
    rows.sort((a, b) => {
      if (a.userId === currentUser?.userId) return -1;
      if (b.userId === currentUser?.userId) return 1;
      const orderA = settingsMap.get(a.userId)?.order;
      const orderB = settingsMap.get(b.userId)?.order;
      if (orderA != null && orderB != null) return orderA - orderB;
      if (orderA != null) return -1;
      if (orderB != null) return 1;
      return a.userName.localeCompare(b.userName);
    });

    return rows;
  }, [members, allSchedules, currentUser?.userId, memberSettings, levelFilter]);

  // Selected schedule
  const selectedSchedule = useMemo(() => {
    if (!selectedCell) return undefined;
    const row = memberRows.find((r) => r.userId === selectedCell.userId);
    return row?.schedules[selectedCell.date];
  }, [selectedCell, memberRows]);

  const isEdit = !!selectedSchedule;
  const isOwnCell = selectedCell?.userId === currentUser?.userId;

  // Sync form when selection changes
  useEffect(() => {
    if (selectedSchedule) {
      setFormType(selectedSchedule.type);
      const st = selectedSchedule.startTime;
      setFormStartTime(
        st && (START_TIME_OPTIONS as readonly string[]).includes(st) ? st : '09:00',
      );
    } else {
      setFormType('OFFICE');
      setFormStartTime('09:00');
    }
  }, [selectedCell, selectedSchedule]);

  const handlePrevWeek = () => {
    setWeekStart((prev) => addDays(prev, -7));
    setSelectedCell(null);
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => addDays(prev, 7));
    setSelectedCell(null);
  };

  const handleCellClick = (userId: string, date: string) => {
    // Own cell: normal edit flow
    if (userId === currentUser?.userId) {
      if (!isDateEditable(date)) return;
      setMultiDayMode(false);
      setSelectedDays(new Set());
      setAmendCell(null);
      setSelectedCell((prev) =>
        prev?.userId === userId && prev?.date === date ? null : { userId, date },
      );
      return;
    }
    // Other user's cell: MASTER/MANAGER can amend if schedule exists
    if (canAmend) {
      const row = memberRows.find((r) => r.userId === userId);
      const schedule = row?.schedules[date];
      if (schedule) {
        setSelectedCell(null);
        setMultiDayMode(false);
        // Get effective state (latest amendment or original)
        const lastAmendment = schedule.amendments?.length
          ? schedule.amendments[schedule.amendments.length - 1]
          : null;
        setAmendType(lastAmendment?.type || schedule.type);
        setAmendStartTime(
          (lastAmendment?.startTime || schedule.startTime || '09:00') as string,
        );
        setAmendNote('');
        setAmendCell((prev) =>
          prev?.userId === userId && prev?.date === date ? null : { userId, date },
        );
      }
    }
  };

  // Open multi-day mode
  const handleRegisterClick = () => {
    if (!currentUser) return;
    setSelectedCell(null);
    setMultiDayMode(true);
    // Pre-select all editable weekdays that are not yet registered
    const myRow = memberRows.find((r) => r.userId === currentUser.userId);
    const editableDays = new Set<string>();
    for (const d of weekDays) {
      if (isDateEditable(d.date) && !myRow?.schedules[d.date]) {
        editableDays.add(d.date);
      }
    }
    setSelectedDays(editableDays);
    setFormType('OFFICE');
    setFormStartTime('09:00');
  };

  const handleToggleDay = useCallback((date: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, []);

  const showTimeSelector = formType === 'OFFICE' || formType === 'REMOTE' || formType === 'OUTSIDE_WORK' || formType === 'BUSINESS_TRIP' || formType === 'EXTERNAL_SITE' || formType === 'PM_HALF';
  const displayStart = getDisplayStartTime(formType, formStartTime);
  const displayEnd = displayStart ? calculateEndTime(formType, formStartTime) : null;

  const handleSave = () => {
    if (!selectedCell || !isOwnCell) return;

    if (isEdit) {
      updateMutation.mutate(
        {
          id: selectedSchedule!.attendanceId,
          data: { type: formType, start_time: showTimeSelector ? formStartTime : undefined },
        },
        { onSuccess: () => setSelectedCell(null) },
      );
    } else {
      createMutation.mutate(
        {
          schedules: [{
            date: selectedCell.date,
            type: formType,
            start_time: showTimeSelector ? formStartTime : undefined,
          }],
        },
        { onSuccess: () => setSelectedCell(null) },
      );
    }
  };

  const handleMultiDaySave = async () => {
    if (!currentUser || selectedDays.size === 0) return;
    const myRow = memberRows.find((r) => r.userId === currentUser.userId);

    // Check for existing schedules in selected days
    const existingDays = [...selectedDays].filter((d) => myRow?.schedules[d]);
    if (existingDays.length > 0) {
      const confirmed = window.confirm(
        t('attendance:daysAlreadyRegistered', { count: existingDays.length }),
      );
      if (!confirmed) return;
    }

    const newDays = [...selectedDays].filter((d) => !myRow?.schedules[d]);
    const updateDays = [...selectedDays].filter((d) => myRow?.schedules[d]);

    let pendingOps = 0;
    let completedOps = 0;
    const onOpComplete = () => {
      completedOps++;
      if (completedOps >= pendingOps) {
        setMultiDayMode(false);
        setSelectedDays(new Set());
      }
    };

    // Count total operations
    if (newDays.length > 0) pendingOps++;
    pendingOps += updateDays.length;

    if (pendingOps === 0) {
      setMultiDayMode(false);
      setSelectedDays(new Set());
      return;
    }

    // Batch create new schedules
    if (newDays.length > 0) {
      createMutation.mutate(
        {
          schedules: newDays.map((date) => ({
            date,
            type: formType,
            start_time: showTimeSelector ? formStartTime : undefined,
          })),
        },
        { onSuccess: onOpComplete },
      );
    }

    // Update existing schedules one by one
    for (const date of updateDays) {
      const existing = myRow!.schedules[date];
      updateMutation.mutate(
        {
          id: existing.attendanceId,
          data: { type: formType, start_time: showTimeSelector ? formStartTime : undefined },
        },
        { onSuccess: onOpComplete },
      );
    }
  };

  const handleDelete = () => {
    if (!selectedSchedule || !isOwnCell) return;
    deleteMutation.mutate(selectedSchedule.attendanceId, {
      onSuccess: () => setSelectedCell(null),
    });
  };

  const weekLabel = t('attendance:weekOf', { start: dateFrom, end: dateTo });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={embedded ? '' : 'flex h-full flex-col overflow-hidden'}>
      {/* Header */}
      {!embedded && (
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>{t('attendance:title')}</PageTitle>
            <p className="mt-1 text-sm text-gray-500">{t('attendance:subtitle')}</p>
          </div>
          {currentUser?.role === 'MASTER' && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              {t('attendance:memberManage.button', { defaultValue: '기록자 관리' })}
            </button>
          )}
        </div>
      </div>
      )}

      {/* Week Navigation */}
      <div className="shrink-0 bg-white px-6 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevWeek}
              className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[220px] text-center">
              {weekLabel}
            </span>
            <button
              onClick={handleNextWeek}
              className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* Level Filter */}
            <div className="ml-4 flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
              {([
                { key: 'USER_LEVEL' as LevelFilter, label: t('attendance:filter.employee', { defaultValue: '직원' }) },
                { key: 'CLIENT_LEVEL' as LevelFilter, label: t('attendance:filter.client', { defaultValue: '고객사' }) },
                { key: 'ALL' as LevelFilter, label: t('attendance:filter.all', { defaultValue: '전체' }) },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setLevelFilter(key)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    levelFilter === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleRegisterClick}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('attendance:addSchedule')}
          </button>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="flex-1 overflow-auto pb-[100px]">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            {t('common:loading')}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th className="border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-[180px]">
                  Name
                </th>
                {weekDays.map((day) => {
                  const dateObj = new Date(day.date + 'T00:00:00');
                  const isWeekend = day.dayKey === 'sat' || day.dayKey === 'sun';
                  return (
                    <th
                      key={day.date}
                      className={`border-b border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold ${
                        isWeekend ? 'bg-gray-50 text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      <div>{t(`attendance:dayNames.${day.dayKey}`)}</div>
                      <div className="text-gray-400 font-normal">
                        {dateObj.getMonth() + 1}/{dateObj.getDate()}
                      </div>
                    </th>
                  );
                })}
                <th className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 w-[100px]">
                  NOTE
                </th>
              </tr>
            </thead>
            <tbody>
              {memberRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                    {t('attendance:noSchedule')}
                  </td>
                </tr>
              ) : (
                memberRows.map((row) => {
                  const isMe = row.userId === currentUser?.userId;
                  // Find WFH (REMOTE) note — use effective type (amendment-aware)
                  const remoteNotes = weekDays
                    .filter((d) => {
                      const s = row.schedules[d.date];
                      if (!s) return false;
                      const effectType = s.amendments?.length
                        ? s.amendments[s.amendments.length - 1].type
                        : s.type;
                      return effectType === 'REMOTE';
                    })
                    .map((d) => {
                      const dateObj = new Date(d.date + 'T00:00:00');
                      return `${t(`attendance:dayNames.${d.dayKey}`)} ${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                    });
                  const noteText = remoteNotes.length > 0
                    ? `WFH: ${remoteNotes.join(', ')}`
                    : '';

                  return (
                    <tr
                      key={row.userId}
                      className={`${isMe ? 'bg-indigo-50/40' : 'bg-white'} hover:bg-gray-50/50`}
                    >
                      {/* Name column */}
                      <td className={`border-b border-r border-gray-200 px-4 py-2 text-sm font-medium whitespace-nowrap ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {row.userName}
                        {isMe && <span className="ml-1 text-xs text-indigo-400">*</span>}
                        {row.levelCode === 'CLIENT_LEVEL' && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            Client
                          </span>
                        )}
                      </td>

                      {/* Day cells */}
                      {weekDays.map((day) => {
                        const schedule = row.schedules[day.date];
                        const isCellSelected =
                          selectedCell?.userId === row.userId && selectedCell?.date === day.date;
                        const isAmendSelected =
                          amendCell?.userId === row.userId && amendCell?.date === day.date;
                        const canEdit = isMe && isDateEditable(day.date);
                        const canAmendCell = !isMe && canAmend && !!schedule;
                        const isWeekend = day.dayKey === 'sat' || day.dayKey === 'sun';
                        const hasAmendments = schedule?.amendments && schedule.amendments.length > 0;
                        // Effective state: latest amendment or original
                        const effectiveType = hasAmendments
                          ? schedule!.amendments![schedule!.amendments!.length - 1].type
                          : schedule?.type;
                        const effectiveStart = hasAmendments
                          ? schedule!.amendments![schedule!.amendments!.length - 1].startTime
                          : schedule?.startTime;
                        const effectiveEnd = hasAmendments
                          ? schedule!.amendments![schedule!.amendments!.length - 1].endTime
                          : schedule?.endTime;

                        return (
                          <td
                            key={day.date}
                            onClick={() => handleCellClick(row.userId, day.date)}
                            className={`border-b border-r border-gray-200 px-2 py-2 text-center text-xs transition-colors ${
                              isCellSelected || isAmendSelected
                                ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-400'
                                : isWeekend && !schedule
                                  ? 'bg-gray-50/60'
                                  : canEdit || canAmendCell
                                    ? 'cursor-pointer hover:bg-indigo-50'
                                    : ''
                            }`}
                          >
                            {schedule ? (
                              <div className="flex flex-col items-center gap-0.5 relative">
                                {hasAmendments && (
                                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-400" title={t('attendance:amendment.amended')} />
                                )}
                                {/* Original with strikethrough when amended */}
                                {hasAmendments && (
                                  <span className="text-[9px] text-gray-400 line-through">
                                    {schedule.type === 'DAY_OFF' ? 'OFF'
                                      : schedule.type === 'MENSTRUATION' ? t('attendance:type.MENSTRUATION')
                                      : schedule.type === 'AM_HALF' || schedule.type === 'PM_HALF' ? t(`attendance:type.${schedule.type}`)
                                      : schedule.startTime && schedule.endTime ? `${schedule.startTime}-${schedule.endTime}`
                                      : t(`attendance:type.${schedule.type}`)}
                                  </span>
                                )}
                                {/* Effective state (latest amendment or original) */}
                                {effectiveType === 'DAY_OFF' ? (
                                  <span className="font-semibold text-red-600">OFF</span>
                                ) : effectiveType === 'MENSTRUATION' ? (
                                  <span className="font-semibold text-pink-600">{t('attendance:type.MENSTRUATION')}</span>
                                ) : (
                                  <>
                                    <span className={`text-[11px] font-medium ${TYPE_TEXT_COLOR[effectiveType || ''] || 'text-gray-600'}`}>
                                      {effectiveStart && effectiveEnd
                                        ? `${effectiveStart} - ${effectiveEnd}`
                                        : t(`attendance:type.${effectiveType}`)}
                                    </span>
                                    {(effectiveType === 'AM_HALF' || effectiveType === 'PM_HALF'
                                      || effectiveType === 'OUTSIDE_WORK' || effectiveType === 'BUSINESS_TRIP'
                                      || effectiveType === 'EXTERNAL_SITE') && (
                                      <AttendanceTypeBadge type={effectiveType} />
                                    )}
                                  </>
                                )}
                              </div>
                            ) : canEdit ? (
                              <span className="text-gray-300">-</span>
                            ) : (
                              <span className="text-gray-200">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* NOTE column */}
                      <td className="border-b border-gray-200 px-2 py-2 text-[11px] text-green-700 font-medium whitespace-nowrap">
                        {noteText}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Inline Form — Multi-day mode */}
      {multiDayMode && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('attendance:addSchedule')}
              </h3>
              <button
                onClick={() => { setMultiDayMode(false); setSelectedDays(new Set()); }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Day checkboxes */}
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t('attendance:applyTo')}
              </label>
              <div className="flex flex-wrap gap-3">
                {weekDays.map((day) => {
                  const dateObj = new Date(day.date + 'T00:00:00');
                  const editable = isDateEditable(day.date);
                  const myRow = memberRows.find((r) => r.userId === currentUser?.userId);
                  const hasSchedule = !!myRow?.schedules[day.date];
                  const checked = selectedDays.has(day.date);

                  return (
                    <label
                      key={day.date}
                      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm select-none ${
                        !editable
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : checked
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!editable}
                        onChange={() => handleToggleDay(day.date)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                      />
                      <span>{t(`attendance:dayNames.${day.dayKey}`)}</span>
                      <span className="text-xs text-gray-400">
                        {dateObj.getMonth() + 1}/{dateObj.getDate()}
                      </span>
                      {hasSchedule && (
                        <span className="text-[10px] text-amber-600">({t('attendance:registered')})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Type + Time selectors */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('attendance:form.type')}
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.values(ATTENDANCE_TYPE).map((val) => (
                    <option key={val} value={val}>
                      {t(`attendance:type.${val}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('attendance:form.startTime')}
                </label>
                {showTimeSelector ? (
                  <select
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {START_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
                    {displayStart || '-'}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('attendance:form.endTime')}
                </label>
                <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
                  {displayEnd || '-'}
                  {displayEnd && (
                    <span className="ml-1 text-xs text-gray-400">({t('attendance:form.autoCalculated')})</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleMultiDaySave}
                disabled={isSaving || selectedDays.size === 0}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {t('common:save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Inline Form — Single-edit mode (existing cell click) */}
      {selectedCell && isOwnCell && !multiDayMode && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {isEdit ? t('attendance:editSchedule') : t('attendance:addSchedule')}
                <span className="ml-2 font-normal text-gray-500">{selectedCell.date}</span>
              </h3>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {t('common:close')}
              </button>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('attendance:form.type')}
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.values(ATTENDANCE_TYPE).map((val) => (
                    <option key={val} value={val}>
                      {t(`attendance:type.${val}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('attendance:form.startTime')}
                </label>
                {showTimeSelector ? (
                  <select
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {START_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
                    {displayStart || '-'}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t('attendance:form.endTime')}
                </label>
                <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
                  {displayEnd || '-'}
                  {displayEnd && (
                    <span className="ml-1 text-xs text-gray-400">({t('attendance:form.autoCalculated')})</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isEdit && (
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('common:delete')}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {t('common:save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showMemberModal && (
        <AttendanceMemberModal onClose={() => setShowMemberModal(false)} />
      )}

      {/* Amendment Panel — MASTER/MANAGER editing other user's cell */}
      {amendCell && canAmend && (() => {
        const row = memberRows.find((r) => r.userId === amendCell.userId);
        const schedule = row?.schedules[amendCell.date];
        if (!schedule) return null;

        const showAmendTimeSel = amendType === 'OFFICE' || amendType === 'REMOTE' || amendType === 'OUTSIDE_WORK' || amendType === 'BUSINESS_TRIP' || amendType === 'EXTERNAL_SITE' || amendType === 'PM_HALF';
        const amendDisplayStart = getDisplayStartTime(amendType, amendStartTime);
        const amendDisplayEnd = amendDisplayStart ? calculateEndTime(amendType, amendStartTime) : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setAmendCell(null)}>
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900">
                  <Pencil className="mr-1.5 inline h-4 w-4" />
                  {t('attendance:amendment.title')}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {row?.userName} · {amendCell.date}
                  </span>
                </h3>
                <button onClick={() => setAmendCell(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Original info */}
                <div className="rounded-md bg-gray-50 p-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">{t('attendance:amendment.original')}</div>
                  <div className="text-sm text-gray-700">
                    {t(`attendance:type.${schedule.type}`)}
                    {schedule.startTime && schedule.endTime && (
                      <span className="ml-2 text-gray-500">{schedule.startTime} - {schedule.endTime}</span>
                    )}
                  </div>
                </div>

                {/* Amendment history */}
                {schedule.amendments && schedule.amendments.length > 0 && (
                  <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                    <div className="text-xs font-medium text-orange-600 mb-2">{t('attendance:amendment.history')}</div>
                    <div className="space-y-2">
                      {schedule.amendments.map((amend, idx) => (
                        <div key={amend.amendmentId || idx} className="text-xs text-gray-700 border-l-2 border-orange-300 pl-2">
                          <div className="font-medium">
                            {t(`attendance:type.${amend.type}`)}
                            {amend.startTime && amend.endTime && (
                              <span className="ml-1 text-gray-500">{amend.startTime} - {amend.endTime}</span>
                            )}
                          </div>
                          <div className="text-gray-500 mt-0.5">{amend.note}</div>
                          <div className="text-gray-400 mt-0.5">
                            {t('attendance:amendment.by')}: {amend.amendedByName} · {new Date(amend.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amendment form */}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">{t('attendance:form.type')}</label>
                    <select
                      value={amendType}
                      onChange={(e) => setAmendType(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {Object.values(ATTENDANCE_TYPE).map((val) => (
                        <option key={val} value={val}>{t(`attendance:type.${val}`)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-600">{t('attendance:form.startTime')}</label>
                      {showAmendTimeSel ? (
                        <select
                          value={amendStartTime}
                          onChange={(e) => setAmendStartTime(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {START_TIME_OPTIONS.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
                          {amendDisplayStart || '-'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-600">{t('attendance:form.endTime')}</label>
                      <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
                        {amendDisplayEnd || '-'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">{t('attendance:amendment.note')} *</label>
                    <textarea
                      value={amendNote}
                      onChange={(e) => setAmendNote(e.target.value)}
                      placeholder={t('attendance:amendment.notePlaceholder')}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => setAmendCell(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!amendNote.trim()) return;
                    amendMutation.mutate(
                      {
                        id: schedule.attendanceId,
                        data: {
                          type: amendType,
                          start_time: showAmendTimeSel ? amendStartTime : undefined,
                          note: amendNote.trim(),
                        },
                      },
                      { onSuccess: () => setAmendCell(null) },
                    );
                  }}
                  disabled={!amendNote.trim() || amendMutation.isPending}
                  className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {t('common:save')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
