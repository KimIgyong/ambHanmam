export type TodoComputedStatus =
  | 'COMPLETED'
  | 'OVERDUE'
  | 'DUE_TODAY'
  | 'IN_PROGRESS'
  | 'UPCOMING_SOON'
  | 'UPCOMING';

interface TodoForCompute {
  completedAt: Date | null;
  startDate: Date | null;
  dueDate: Date | null;
}

/**
 * 날짜 기반으로 할일의 표시 상태를 자동 계산한다.
 *
 * 판단 트리:
 *   1. completedAt != null → COMPLETED
 *   2. dueDate < today    → OVERDUE
 *   3. dueDate = today    → DUE_TODAY
 *   4. startDate ≤ today (또는 null) → IN_PROGRESS
 *   5. startDate ≤ today + upcomingSoonDays → UPCOMING_SOON
 *   6. 그 외 → UPCOMING
 */
export function computeTodoStatus(
  todo: TodoForCompute,
  today?: Date,
  upcomingSoonDays = 3,
): TodoComputedStatus {
  if (todo.completedAt) return 'COMPLETED';

  const t = today ? stripTime(today) : stripTime(new Date());
  const due = todo.dueDate ? stripTime(todo.dueDate) : null;
  const start = todo.startDate ? stripTime(todo.startDate) : null;

  // dueDate가 오늘 이전이면 OVERDUE
  if (due && due < t) return 'OVERDUE';

  // dueDate가 오늘이면 DUE_TODAY
  if (due && due.getTime() === t.getTime()) return 'DUE_TODAY';

  // startDate가 없거나 오늘 이전/오늘이면 진행 중
  if (!start || start <= t) return 'IN_PROGRESS';

  // startDate가 upcomingSoonDays 이내이면 곧 시작
  const soonLimit = new Date(t);
  soonLimit.setDate(soonLimit.getDate() + upcomingSoonDays);
  if (start <= soonLimit) return 'UPCOMING_SOON';

  return 'UPCOMING';
}

/**
 * 기준일로부터의 D-day 계산 (일 단위).
 *  - 음수 = 지연 (D+N)
 *  - 0    = 오늘 (D-Day)
 *  - 양수 = 남은 일수 (D-N)
 *  - null = date가 없을 때
 */
export function computeDaysFromToday(date: Date | null, today?: Date): number | null {
  if (!date) return null;
  const t = today ? stripTime(today) : stripTime(new Date());
  const d = stripTime(date);
  const diffMs = d.getTime() - t.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * computed status → 레거시 tdo_status 매핑
 */
export function computedToLegacyStatus(computed: TodoComputedStatus): string {
  switch (computed) {
    case 'COMPLETED':
      return 'COMPLETED';
    case 'OVERDUE':
    case 'DUE_TODAY':
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'UPCOMING_SOON':
    case 'UPCOMING':
      return 'SCHEDULED';
  }
}

function stripTime(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
