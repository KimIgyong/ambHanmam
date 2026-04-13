import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Repeat, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import { useCalendarStore } from '../store/calendar.store';
import { Calendar, CreateCalendarBody, UpdateCalendarBody } from '../service/calendar.service';
import { useCreateCalendar, useUpdateCalendar } from '../hooks/useCalendar';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { toUtcIso } from '@/lib/format-utils';

const CATEGORIES = ['WORK', 'MEETING', 'PERSONAL', 'PROJECT', 'HOLIDAY', 'ETC'];
const VISIBILITIES = ['PRIVATE', 'SHARED', 'ENTITY'];
const RECURRENCE_TYPES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#6B7280'];
const WEEKDAY_BITS = [
  { key: 'MON', bit: 0 },
  { key: 'TUE', bit: 1 },
  { key: 'WED', bit: 2 },
  { key: 'THU', bit: 3 },
  { key: 'FRI', bit: 4 },
  { key: 'SAT', bit: 5 },
  { key: 'SUN', bit: 6 },
];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

interface Props {
  schedule?: Calendar | null;
  onClose: () => void;
}

/**
 * UTC ISO 문자열을 사용자 타임존 기준 datetime-local 입력값으로 변환
 * 예: 'Asia/Ho_Chi_Minh' 에서 '2026-03-04T02:00:00Z' → '2026-03-04T09:00'
 */
function toLocalDatetimeValue(iso: string | null | undefined, timezone: string): string {
  if (!iso) {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    // 현재 시간을 해당 타임존 기준으로 변환
    return toTzLocalString(now, timezone);
  }
  return toTzLocalString(new Date(iso), timezone);
}

function toTzLocalString(date: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    return date.toISOString().slice(0, 16);
  }
}

export default function CalendarFormModal({ schedule, onClose }: Props) {
  const { t } = useTranslation('calendar');
  const { formInitialDate } = useCalendarStore();
  const { timezone } = useTimezoneStore();
  const createMutation = useCreateCalendar();
  const updateMutation = useUpdateCalendar();

  const isEdit = !!schedule;

  // Form state
  const [title, setTitle] = useState(schedule?.calTitle || '');
  const [description, setDescription] = useState(schedule?.calDescription || '');
  const [category, setCategory] = useState(schedule?.calCategory || 'WORK');
  const [allDay, setAllDay] = useState(schedule?.calIsAllDay || false);
  const [startDatetime, setStartDatetime] = useState(
    schedule ? toLocalDatetimeValue(schedule.calStartAt, timezone) : formInitialDate ? `${formInitialDate}T09:00` : toLocalDatetimeValue(null, timezone),
  );
  const [endDatetime, setEndDatetime] = useState(
    schedule ? toLocalDatetimeValue(schedule.calEndAt, timezone) : formInitialDate ? `${formInitialDate}T10:00` : toLocalDatetimeValue(null, timezone),
  );
  const [location, setLocation] = useState(schedule?.calLocation || '');
  const [color, setColor] = useState(schedule?.calColor || '');

  // 날짜/시간 분리 파생값
  const startDate = startDatetime.slice(0, 10);
  const startTime = startDatetime.slice(11, 16);
  const endDate = endDatetime.slice(0, 10);
  const endTime = endDatetime.slice(11, 16);

  // 30분 단위 시간 슬롯 생성
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  // duration(분) 계산
  const getDurationMinutes = useCallback(() => {
    const s = new Date(startDatetime);
    const e = new Date(endDatetime);
    return Math.max(30, Math.round((e.getTime() - s.getTime()) / 60000));
  }, [startDatetime, endDatetime]);

  // 시작 날짜 변경
  const handleStartDateChange = (newDate: string) => {
    const dur = getDurationMinutes();
    const newStart = `${newDate}T${startTime}`;
    setStartDatetime(newStart);
    const d = new Date(newStart);
    d.setMinutes(d.getMinutes() + dur);
    setEndDatetime(toTzLocalString(d, timezone));
  };

  // 시작 시간 변경 — duration 유지
  const handleStartTimeChange = (newTime: string) => {
    const dur = getDurationMinutes();
    const newStart = `${startDate}T${newTime}`;
    setStartDatetime(newStart);
    const d = new Date(newStart);
    d.setMinutes(d.getMinutes() + dur);
    setEndDatetime(toTzLocalString(d, timezone));
  };

  // 종료 날짜 변경
  const handleEndDateChange = (newDate: string) => {
    if (newDate < startDate) return;
    const newEnd = `${newDate}T${endTime}`;
    if (newEnd <= startDatetime) return;
    setEndDatetime(newEnd);
  };

  // 종료 시간 변경
  const handleEndTimeChange = (newTime: string) => {
    const newEnd = `${endDate}T${newTime}`;
    if (newEnd <= startDatetime) {
      // 다음 날로 넘기기
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDateStr = toTzLocalString(nextDay, timezone).slice(0, 10);
      setEndDatetime(`${nextDateStr}T${newTime}`);
    } else {
      setEndDatetime(newEnd);
    }
  };

  // 종일 모드 시작일 변경
  const handleAllDayStartChange = (newDate: string) => {
    setStartDatetime(`${newDate}T00:00`);
    if (endDatetime.slice(0, 10) < newDate) {
      setEndDatetime(`${newDate}T23:59`);
    }
  };

  // 종일 모드 종료일 변경
  const handleAllDayEndChange = (newDate: string) => {
    if (newDate >= startDate) {
      setEndDatetime(`${newDate}T23:59`);
    }
  };

  // 시간 표시 포맷 (12h or 24h depending on locale)
  const formatTimeLabel = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  // 날짜 표시 포맷
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  // 종료 시간 옵션에 duration 표시
  const getEndTimeOptions = () => {
    return timeSlots.map((slot) => {
      const endCandidate = `${endDate}T${slot}`;
      const startMs = new Date(startDatetime).getTime();
      const endMs = new Date(endCandidate).getTime();
      const diffMin = (endMs - startMs) / 60000;

      let durationLabel = '';
      if (diffMin > 0 && startDate === endDate) {
        if (diffMin < 60) {
          durationLabel = ` (${diffMin}min)`;
        } else {
          const hrs = Math.floor(diffMin / 60);
          const mins = diffMin % 60;
          durationLabel = mins > 0 ? ` (${hrs}h ${mins}m)` : ` (${hrs}h)`;
        }
      }

      return { value: slot, label: `${formatTimeLabel(slot)}${durationLabel}` };
    });
  };
  const [visibility, setVisibility] = useState(schedule?.calVisibility || 'PRIVATE');
  const [recurrenceType, setRecurrenceType] = useState(
    schedule?.recurrence ? schedule.recurrence.clrFreq : 'NONE',
  );
  // Recurrence detail state
  const [weekdaysBitmask, setWeekdaysBitmask] = useState<number>(0);
  const [monthDay, setMonthDay] = useState<number>(new Date().getDate());
  const [yearlyMonth, setYearlyMonth] = useState<number>(new Date().getMonth() + 1);
  const [yearlyDay, setYearlyDay] = useState<number>(new Date().getDate());
  const [recEndType, setRecEndType] = useState<string>(
    schedule?.recurrence?.clrEndType || 'INFINITE',
  );
  const [recEndDate, setRecEndDate] = useState<string>(
    schedule?.recurrence?.clrEndDate || '',
  );
  const [recEndCount, setRecEndCount] = useState<number>(
    schedule?.recurrence?.clrCount ?? 10,
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const daysInMonth = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  }, []);

  const toggleWeekday = (bit: number) => {
    setWeekdaysBitmask((prev) => prev ^ (1 << bit));
  };

  const buildRecurrence = () => {
    if (recurrenceType === 'NONE') return undefined;
    const rec: NonNullable<CreateCalendarBody['recurrence']> = {
      clr_freq: recurrenceType,
      clr_end_type: recEndType,
    };
    if (recurrenceType === 'WEEKLY' && weekdaysBitmask > 0) {
      rec.clr_weekdays = weekdaysBitmask;
    }
    if (recurrenceType === 'MONTHLY') {
      rec.clr_month_day = monthDay;
    }
    if (recurrenceType === 'YEARLY') {
      rec.clr_weekdays = yearlyMonth;
      rec.clr_month_day = yearlyDay;
    }
    if (recEndType === 'DATE' && recEndDate) {
      rec.clr_end_date = recEndDate;
    }
    if (recEndType === 'COUNT') {
      rec.clr_count = recEndCount;
    }
    return rec;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // datetime-local 값(사용자 타임존)을 UTC ISO로 변환
    const startUtc = toUtcIso(startDatetime, timezone);
    const endUtc = toUtcIso(endDatetime, timezone);

    if (isEdit && schedule) {
      const data: UpdateCalendarBody = {
        cal_title: title.trim(),
        cal_description: description.trim() || undefined,
        cal_category: category,
        cal_start_at: startUtc,
        cal_end_at: endUtc,
        cal_is_all_day: allDay,
        cal_location: location.trim() || undefined,
        cal_color: color || undefined,
        cal_visibility: visibility,
        recurrence: buildRecurrence(),
        current_updated_at: schedule.calUpdatedAt,
      };
      await updateMutation.mutateAsync({ calId: schedule.calId, data });
    } else {
      const data: CreateCalendarBody = {
        cal_title: title.trim(),
        cal_description: description.trim() || undefined,
        cal_category: category,
        cal_start_at: startUtc,
        cal_end_at: endUtc,
        cal_is_all_day: allDay,
        cal_location: location.trim() || undefined,
        cal_color: color || undefined,
        cal_visibility: visibility,
        recurrence: buildRecurrence(),
      };
      await createMutation.mutateAsync(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? t('editSchedule') : t('newSchedule')}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Google Calendar style Date/Time picker */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            {/* All day toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('form.allDay')}</span>
            </label>

            {allDay ? (
              /* 종일 모드: 시작 날짜 → 종료 날짜 */
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleAllDayStartChange(e.target.value)}
                    className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleAllDayEndChange(e.target.value)}
                  className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ) : (
              /* 시간 지정 모드: 날짜 + 시간 드롭다운 */
              <div className="space-y-2">
                {/* 시작 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <select
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer min-w-[110px]"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{formatTimeLabel(slot)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* 화살표 구분 */}
                <div className="flex items-center gap-2 pl-5">
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-400">{t('form.endDate')}</span>
                </div>
                {/* 종료 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <select
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer min-w-[110px]"
                    >
                      {getEndTimeOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* 날짜 요약 라벨 */}
                <p className="text-xs text-gray-400 pl-5">
                  {formatDateLabel(startDate)}
                  {startDate !== endDate && ` → ${formatDateLabel(endDate)}`}
                </p>
              </div>
            )}
          </div>

          {/* Visibility | Category (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.visibility')}
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>{t(`visibility.${v}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`category.${c}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('form.locationPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Repeat className="w-4 h-4 inline mr-1" />
              {t('form.recurrence')}
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {RECURRENCE_TYPES.map((r) => (
                <option key={r} value={r}>{t(`recurrence.${r}`)}</option>
              ))}
            </select>
          </div>

          {/* Weekly — Weekday selection */}
          {recurrenceType === 'WEEKLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('recurrenceForm.weekdays')}
              </label>
              <div className="flex gap-1.5">
                {WEEKDAY_BITS.map(({ key, bit }) => {
                  const selected = (weekdaysBitmask & (1 << bit)) !== 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleWeekday(bit)}
                      className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {t(`weekdays.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly — Day of month selection */}
          {recurrenceType === 'MONTHLY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('recurrenceForm.monthDay')}
              </label>
              <select
                value={monthDay}
                onChange={(e) => setMonthDay(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {daysInMonth.map((d) => (
                  <option key={d} value={d}>{d}{t('recurrenceForm.dayUnit', { defaultValue: '일' })}</option>
                ))}
              </select>
            </div>
          )}

          {/* Yearly — Month + Day selection */}
          {recurrenceType === 'YEARLY' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('recurrenceForm.yearlyMonth', { defaultValue: '월' })}
                </label>
                <select
                  value={yearlyMonth}
                  onChange={(e) => setYearlyMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}{t('recurrenceForm.monthUnit', { defaultValue: '월' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('recurrenceForm.yearlyDay', { defaultValue: '일' })}
                </label>
                <select
                  value={yearlyDay}
                  onChange={(e) => setYearlyDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {daysInMonth.map((d) => (
                    <option key={d} value={d}>{d}{t('recurrenceForm.dayUnit', { defaultValue: '일' })}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Recurrence end type */}
          {recurrenceType !== 'NONE' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('recurrenceForm.endType')}
              </label>
              <div className="flex gap-3">
                {(['INFINITE', 'DATE', 'COUNT'] as const).map((et) => (
                  <label key={et} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="recEndType"
                      value={et}
                      checked={recEndType === et}
                      onChange={() => setRecEndType(et)}
                      className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {et === 'INFINITE' ? t('recurrenceForm.endNever') : et === 'DATE' ? t('recurrenceForm.endByDate') : t('recurrenceForm.endByCount')}
                    </span>
                  </label>
                ))}
              </div>
              {recEndType === 'DATE' && (
                <input
                  type="date"
                  value={recEndDate}
                  onChange={(e) => setRecEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}
              {recEndType === 'COUNT' && (
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={recEndCount}
                  onChange={(e) => setRecEndCount(Number(e.target.value))}
                  className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.color')}
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              {color && (
                <button
                  type="button"
                  onClick={() => setColor('')}
                  className="text-xs text-gray-500 hover:text-gray-700 ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : t('form.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
