export interface TodoSummaryItem {
  todoId: string;
  title: string;
  status: string;
  dueDate: string;
  visibility: string;
  userName: string;
  userId: string;
}

export interface MyTodaySummary {
  todayDueCount: number;
  overdueCount: number;
  inProgressCount: number;
  completedTodayCount: number;
  issueCount: number;
}

export interface MyTodayResponse {
  todayDue: TodoSummaryItem[];
  overdue: TodoSummaryItem[];
  inProgress: TodoSummaryItem[];
  summary: MyTodaySummary;
}

export interface MemberTodoItem {
  todoId: string;
  title: string;
  dueDate: string;
  status: string;
}

export interface MemberIssueItem {
  issueId: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
}

export interface MemberTodaySummary {
  userId: string;
  userName: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  unitName?: string;
  todayDueCount: number;
  overdueCount: number;
  inProgressCount: number;
  issueCount: number;
  todayDueTodos: MemberTodoItem[];
  overdueTodos: MemberTodoItem[];
  recentIssues: MemberIssueItem[];
  /** 최근 4주 총 이슈 건수 (reporter + assignee) */
  issueTotal4w?: number;
  /** 최근 4주 해결/완료 건수 */
  issueResolved4w?: number;
  /** To Review (OPEN) 건수 */
  toReviewCount?: number;
  /** In Progress (APPROVED, IN_PROGRESS) 이슈 건수 */
  issueInProgressCount?: number;
  /** To Review 이슈 목록 (최대 5개) */
  toReviewIssues?: MemberIssueItem[];
  /** In Progress 이슈 목록 (최대 5개) */
  inProgressIssues?: MemberIssueItem[];
  /** 오늘의 미션 내용 (HTML 또는 null) */
  missionContent?: string | null;
  /** 오늘 출근 유형 (WORK, REMOTE, DAY_OFF, AM_HALF, PM_HALF, MENSTRUATION) */
  todayAttendanceType?: string | null;
  /** 출근 레코드 ID (승인/거절용) */
  todayAttendanceId?: string | null;
  /** REMOTE 승인 상태 (APPROVED, PENDING, REJECTED) — 비예정 WFH인 경우 */
  todayAttendanceApproval?: string | null;
  /** MASTER에게만 노출: 이 사용자가 Today에서 가려진 상태인지 */
  isHidden?: boolean;
  /** 소속 셀 ID 배열 */
  cellIds?: string[];
  /** 소속 셀 이름 배열 */
  cellNames?: string[];
}

export interface AllTodayResponse {
  members: MemberTodaySummary[];
  summary: {
    totalMembers: number;
    totalTodayDue: number;
    totalOverdue: number;
    totalInProgress: number;
    totalIssues: number;
  };
}

export interface TeamTodayResponse {
  members: MemberTodaySummary[];
  /** 사용자 소속 셀 목록 (getCellToday에서만 포함) */
  cells?: { cellId: string; cellName: string }[];
  summary: {
    totalMembers: number;
    totalTodayDue: number;
    totalOverdue: number;
    totalInProgress: number;
    totalIssues: number;
  };
}
