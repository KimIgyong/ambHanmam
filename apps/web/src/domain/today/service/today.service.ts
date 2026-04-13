import { apiClient } from '@/lib/api-client';

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
  todayDueTodos?: MemberTodoItem[];
  overdueTodos?: MemberTodoItem[];
  inProgressTodos?: MemberTodoItem[];
  recentIssues?: MemberIssueItem[];
  issueTotal4w?: number;
  issueResolved4w?: number;
  toReviewCount?: number;
  issueInProgressCount?: number;
  toReviewIssues?: MemberIssueItem[];
  inProgressIssues?: MemberIssueItem[];
  missionContent?: string | null;
  todayAttendanceType?: string | null;
  todayAttendanceId?: string | null;
  todayAttendanceApproval?: string | null;
  isHidden?: boolean;
  cellIds?: string[];
  cellNames?: string[];
}

export interface TodayReportResponse {
  reportId: string;
  title: string;
  content: string;
  scope: string;
  createdAt: string;
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

export type TeamTodayResponse = AllTodayResponse & {
  cells?: { cellId: string; cellName: string }[];
};

// ─── Mission & Snapshot Types ──────────────────────────

export interface MissionInfo {
  msnId: string;
  msnDate: string;
  msnContent: string | null;
  msnCheckResult: string | null;
  msnCheckScore: number | null;
  msnRegisteredLines?: any[];
}

export interface YesterdayMissionInfo {
  msnId: string;
  msnDate: string;
  msnContent: string;
}

export interface MissionCheckLine {
  lineIndex: number;
  text: string;
  state: 'done' | 'incomplete' | 'na';
  subChoice: 'mission' | 'task' | null;
}

export interface MissionCheckResponse {
  msnId: string;
  msnDate: string;
  checkScore: number | null;
  checkResult: string | null;
  registeredLines: Array<{
    lineIndex: number;
    state: string;
    subChoice: string | null;
    itemId: string | null;
  }>;
  carryOverText: string | null;
}

export interface MyTodayWithMission extends MyTodayResponse {
  mission: MissionInfo | null;
  yesterdayMission: YesterdayMissionInfo | null;
  carryOverText: string | null;
}

export interface SaveMissionResponse {
  msnId: string;
  msnDate: string;
  msnContent: string | null;
  snapshotCreated: boolean;
  snapshotId: string | null;
}

export interface SnapshotCalendarDay {
  date: string;
  snpId: string;
  checkResult: string | null;
  checkScore: number | null;
  memoCount: number;
  hasSnapshot: boolean;
}

export interface SnapshotCalendarResponse {
  year: number;
  month: number;
  days: SnapshotCalendarDay[];
}

export interface SnapshotMemo {
  smoId: string;
  usrId: string;
  smoContent: string;
  smoOrder: number;
  smoCreatedAt: string;
  smoUpdatedAt: string;
}

export interface SnapshotDetailResponse {
  snpId: string;
  snpDate: string;
  snpTitle: string;
  snpData: {
    mission: { content: string; checkResult: string | null; checkScore: number | null } | null;
    todos: {
      overdue: any[];
      todayDue: any[];
      inProgress: any[];
      scheduled: any[];
      completedToday: any[];
    };
    issues: any[];
    schedules: any[];
    capturedAt: string;
  };
  snpCapturedAt: string;
  memos: SnapshotMemo[];
  prevDate: string | null;
  nextDate: string | null;
}

class TodayService {
  private readonly basePath = '/today';

  getMyToday = () =>
    apiClient
      .get<{ success: boolean; data: MyTodayWithMission }>(`${this.basePath}/me`)
      .then((r) => r.data.data);

  getAllToday = () =>
    apiClient
      .get<{ success: boolean; data: AllTodayResponse }>(`${this.basePath}/all`)
      .then((r) => r.data.data);

  getTeamToday = () =>
    apiClient
      .get<{ success: boolean; data: TeamTodayResponse }>(`${this.basePath}/team`)
      .then((r) => r.data.data);

  getCellToday = () =>
    apiClient
      .get<{ success: boolean; data: TeamTodayResponse }>(`${this.basePath}/cell`)
      .then((r) => r.data.data);

  getReports = (scope?: string) =>
    apiClient
      .get<{ success: boolean; data: TodayReportResponse[] }>(`${this.basePath}/reports`, { params: scope ? { scope } : {} })
      .then((r) => r.data.data);

  saveReport = (data: { title: string; content: string; scope: string }) =>
    apiClient
      .post<{ success: boolean; data: TodayReportResponse }>(`${this.basePath}/reports`, data)
      .then((r) => r.data.data);

  deleteReport = (reportId: string) =>
    apiClient.delete(`${this.basePath}/reports/${reportId}`);

  toggleMemberHidden = (userId: string, hidden: boolean) =>
    apiClient
      .patch<{ success: boolean; data: { userId: string; hidden: boolean } }>(
        `${this.basePath}/members/${userId}/hidden`,
        { hidden },
      )
      .then((r) => r.data.data);

  // ─── Mission ────────────────────────────────────────

  saveMission = (content: string | null) =>
    apiClient
      .post<{ success: boolean; data: SaveMissionResponse }>(`${this.basePath}/mission`, { content })
      .then((r) => r.data.data);

  updateMission = (date: string, content: string) =>
    apiClient
      .patch(`${this.basePath}/mission/${date}`, { content })
      .then((r) => r.data);

  saveMissionCheck = (date: string, lines: MissionCheckLine[]) =>
    apiClient
      .patch<{ success: boolean; data: MissionCheckResponse }>(`${this.basePath}/mission/${date}/check`, { lines })
      .then((r) => r.data.data);

  // ─── Snapshots ──────────────────────────────────────

  getSnapshotCalendar = (year: number, month: number) =>
    apiClient
      .get<{ success: boolean; data: SnapshotCalendarResponse }>(`${this.basePath}/snapshots/calendar`, { params: { year, month } })
      .then((r) => r.data.data);

  getSnapshotDetail = (date: string) =>
    apiClient
      .get<{ success: boolean; data: SnapshotDetailResponse | null }>(`${this.basePath}/snapshots/${date}`)
      .then((r) => r.data.data);

  // ─── Snapshot Memos ─────────────────────────────────

  addSnapshotMemo = (snpId: string, content: string) =>
    apiClient
      .post<{ success: boolean; data: SnapshotMemo }>(`${this.basePath}/snapshots/${snpId}/memos`, { content })
      .then((r) => r.data.data);

  updateSnapshotMemo = (snpId: string, memoId: string, content: string) =>
    apiClient
      .patch(`${this.basePath}/snapshots/${snpId}/memos/${memoId}`, { content })
      .then((r) => r.data);

  deleteSnapshotMemo = (snpId: string, memoId: string) =>
    apiClient.delete(`${this.basePath}/snapshots/${snpId}/memos/${memoId}`);
}

export const todayService = new TodayService();
