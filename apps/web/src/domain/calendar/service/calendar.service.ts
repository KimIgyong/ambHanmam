import { apiClient } from '@/lib/api-client';

// ── Response Types ──────────────────────────────────────────

export interface CalendarRecurrence {
  clrId: string;
  calId: string;
  clrFreq: string;
  clrInterval: number;
  clrWeekdays: string[] | null;
  clrMonthDay: number | null;
  clrEndType: string;
  clrEndDate: string | null;
  clrCount: number | null;
}

export interface CalendarException {
  cleId: string;
  calId: string;
  cleOriginalDate: string;
  cleExceptionType: string;
  cleNewStartAt: string | null;
  cleNewEndAt: string | null;
  cleCreatedAt: string;
}

export interface CalendarParticipant {
  clpId: string;
  usrId: string;
  clpResponseStatus: string;
  clpRespondedAt: string | null;
  user?: {
    usrId: string;
    usrName: string;
    usrEmail: string;
  };
}

export interface CalendarNotification {
  clnId: string;
  clnReminderType: string;
  clnCustomMinutes: number | null;
  clnChannels: string[];
}

export interface Calendar {
  calId: string;
  entId: string;
  calTitle: string;
  calDescription: string | null;
  calCategory: string;
  calStartAt: string;
  calEndAt: string;
  calIsAllDay: boolean;
  calLocation: string | null;
  calColor: string | null;
  calVisibility: string;
  calRecurrenceType: string;
  calGoogleEventId: string | null;
  calSyncStatus: string;
  calCreatedAt: string;
  calUpdatedAt: string;
  calDeletedAt: string | null;
  projectId: string | null;
  recurrence?: CalendarRecurrence | null;
  exceptions?: CalendarException[];
  participants?: CalendarParticipant[];
  notifications?: CalendarNotification[];
  owner?: {
    usrId: string;
    usrName: string;
    usrEmail: string;
    usrProfileImage: string | null;
  };
}

// ── List Response (paginated) ───────────────────────────────

export interface CalendarListData {
  items: Calendar[];
  total: number;
  page: number;
  limit: number;
}

// ── Request Params / Bodies ─────────────────────────────────

export interface CalendarListParams {
  start_date?: string;
  end_date?: string;
  category?: string;
  visibility?: string;
  filter_mode?: string;
  page?: number;
  limit?: number;
}

export interface CreateCalendarBody {
  cal_title: string;
  cal_description?: string;
  cal_category?: string;
  cal_start_at: string;
  cal_end_at: string;
  cal_is_all_day?: boolean;
  cal_location?: string;
  cal_color?: string;
  cal_visibility?: string;
  project_id?: string;
  participant_ids?: string[];
  recurrence?: {
    clr_freq: string;
    clr_interval?: number;
    clr_weekdays?: number;
    clr_month_day?: number;
    clr_end_type: string;
    clr_end_date?: string;
    clr_count?: number;
  };
  notification?: {
    cln_reminder_type: string;
    cln_custom_minutes?: number;
    cln_channels?: string[];
  };
}

export interface UpdateCalendarBody {
  cal_title?: string;
  cal_description?: string;
  cal_category?: string;
  cal_start_at?: string;
  cal_end_at?: string;
  cal_is_all_day?: boolean;
  cal_location?: string;
  cal_color?: string;
  cal_visibility?: string;
  project_id?: string;
  participant_ids?: string[];
  recurrence?: {
    clr_freq: string;
    clr_interval?: number;
    clr_weekdays?: number;
    clr_month_day?: number;
    clr_end_type: string;
    clr_end_date?: string;
    clr_count?: number;
  };
  notification?: {
    cln_reminder_type: string;
    cln_custom_minutes?: number;
    cln_channels?: string[];
  };
  current_updated_at?: string;
}

export interface CreateExceptionBody {
  cle_original_date: string;
  cle_exception_type: string;
  cle_new_start_at?: string;
  cle_new_end_at?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// ── Service ─────────────────────────────────────────────────

class CalendarService {
  private readonly basePath = '/calendars';

  // CRUD
  getCalendars = (params: CalendarListParams) =>
    apiClient
      .get<ApiResponse<CalendarListData>>(this.basePath, { params })
      .then((r) => r.data.data);

  getCalendar = (calId: string) =>
    apiClient
      .get<ApiResponse<Calendar>>(`${this.basePath}/${calId}`)
      .then((r) => r.data.data);

  createCalendar = (data: CreateCalendarBody) =>
    apiClient
      .post<ApiResponse<Calendar>>(this.basePath, data)
      .then((r) => r.data.data);

  updateCalendar = (calId: string, data: UpdateCalendarBody) =>
    apiClient
      .patch<ApiResponse<Calendar>>(`${this.basePath}/${calId}`, data)
      .then((r) => r.data.data);

  deleteCalendar = (calId: string) =>
    apiClient.delete(`${this.basePath}/${calId}`);

  // Recurrence Exceptions
  createException = (calId: string, data: CreateExceptionBody) =>
    apiClient
      .post<ApiResponse<CalendarException>>(`${this.basePath}/${calId}/exceptions`, data)
      .then((r) => r.data.data);

  getExceptions = (calId: string) =>
    apiClient
      .get<ApiResponse<CalendarException[]>>(`${this.basePath}/${calId}/exceptions`)
      .then((r) => r.data.data);

  // Participants
  addParticipants = (calId: string, userIds: string[]) =>
    apiClient
      .post<ApiResponse<CalendarParticipant[]>>(`${this.basePath}/${calId}/participants`, { participant_ids: userIds })
      .then((r) => r.data.data);

  respondToCalendar = (calId: string, status: string, comment?: string) =>
    apiClient
      .patch<ApiResponse<CalendarParticipant>>(`${this.basePath}/${calId}/participants/me`, { clp_response_status: status, comment })
      .then((r) => r.data.data);

  removeParticipant = (calId: string, clpId: string) =>
    apiClient.delete(`${this.basePath}/${calId}/participants/${clpId}`);

  // Google Calendar
  connectGoogle = (authCode: string) =>
    apiClient
      .post<ApiResponse<{ connected: boolean }>>(`${this.basePath}/google/connect`, { auth_code: authCode })
      .then((r) => r.data.data);

  disconnectGoogle = () =>
    apiClient
      .delete<ApiResponse<{ disconnected: boolean }>>(`${this.basePath}/google/disconnect`)
      .then((r) => r.data.data);

  syncToGoogle = (calId: string) =>
    apiClient
      .post<ApiResponse<{ synced: boolean }>>(`${this.basePath}/${calId}/google/sync`)
      .then((r) => r.data.data);

  // AI
  aiGenerateToday = () =>
    apiClient
      .post<ApiResponse<unknown>>(`${this.basePath}/ai/generate-today`)
      .then((r) => r.data.data);

  aiGenerateWbs = (body: { project_id?: string; milestones?: string[]; deadline?: string }) =>
    apiClient
      .post<ApiResponse<unknown>>(`${this.basePath}/ai/generate-wbs`, body)
      .then((r) => r.data.data);

  aiOptimizeWeek = (body: { week_start?: string }) =>
    apiClient
      .post<ApiResponse<unknown>>(`${this.basePath}/ai/optimize-week`, body)
      .then((r) => r.data.data);

  aiAnalyzeTeam = (body: { unit_id?: string }) =>
    apiClient
      .post<ApiResponse<unknown>>(`${this.basePath}/ai/analyze-team`, body)
      .then((r) => r.data.data);
}

export const calendarService = new CalendarService();
