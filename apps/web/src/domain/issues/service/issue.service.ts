import { apiClient } from '@/lib/api-client';
import { IssueResponse, IssueCommentResponse, IssueStatusLogResponse, BaseSingleResponse } from '@amb/types';

interface IssueListResponse {
  success: boolean;
  data: IssueResponse[];
  totalCount: number;
  timestamp: string;
}

interface IssueCommentListResponse {
  success: boolean;
  data: IssueCommentResponse[];
  timestamp: string;
}

interface StatusLogListResponse {
  success: boolean;
  data: IssueStatusLogResponse[];
  timestamp: string;
}

class IssueService {
  private readonly basePath = '/issues';

  getIssues = (params?: {
    type?: string;
    status?: string;
    severity?: string;
    priority?: string;
    search?: string;
    project_id?: string;
    scope?: string;
    reporter_id?: string;
    cell_id?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient
      .get<IssueListResponse>(this.basePath, { params })
      .then((r) => ({ data: r.data.data, totalCount: r.data.totalCount }));

  getIssueById = (id: string) =>
    apiClient
      .get<BaseSingleResponse<IssueResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createIssue = (data: {
    type: string;
    title: string;
    description: string;
    severity: string;
    priority?: number;
    affected_modules?: string[];
    assignee_id?: string | null;
    participant_ids?: string[];
    project_id?: string;
    start_date?: string;
    due_date?: string;
    done_ratio?: number;
    parent_issue_id?: string;
    google_drive_link?: string;
    source_todo_id?: string;
    source_todo_title?: string;
  }) =>
    apiClient
      .post<BaseSingleResponse<IssueResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateIssue = (id: string, data: {
    type?: string;
    title?: string;
    description?: string;
    severity?: string;
    priority?: number;
    affected_modules?: string[];
    assignee_id?: string | null;
    participant_ids?: string[];
    resolution?: string;
    project_id?: string | null;
    start_date?: string;
    due_date?: string;
    done_ratio?: number;
    parent_issue_id?: string | null;
    google_drive_link?: string | null;
  }) =>
    apiClient
      .patch<BaseSingleResponse<IssueResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  updateIssueStatus = (id: string, status: string, note?: string) =>
    apiClient
      .patch<BaseSingleResponse<IssueResponse>>(`${this.basePath}/${id}/status`, { status, note })
      .then((r) => r.data.data);

  approveIssue = (id: string, note?: string) =>
    apiClient
      .patch<BaseSingleResponse<IssueResponse>>(`${this.basePath}/${id}/approve`, { note })
      .then((r) => r.data.data);

  rejectIssue = (id: string, note?: string) =>
    apiClient
      .patch<BaseSingleResponse<IssueResponse>>(`${this.basePath}/${id}/reject`, { note })
      .then((r) => r.data.data);

  deleteIssue = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  permanentDeleteIssue = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}/permanent`);

  getIssueComments = (issueId: string) =>
    apiClient
      .get<IssueCommentListResponse>(`${this.basePath}/${issueId}/comments`)
      .then((r) => r.data.data);

  addIssueComment = (issueId: string, data: { content: string; parent_id?: string; client_visible?: boolean }) =>
    apiClient
      .post<BaseSingleResponse<IssueCommentResponse>>(`${this.basePath}/${issueId}/comments`, data)
      .then((r) => r.data.data);

  toggleCommentClientVisible = (issueId: string, commentId: string, clientVisible: boolean) =>
    apiClient
      .patch<{ success: boolean; data: { commentId: string; clientVisible: boolean }; timestamp: string }>(
        `${this.basePath}/${issueId}/comments/${commentId}/client-visible`,
        { client_visible: clientVisible },
      )
      .then((r) => r.data.data);

  deleteIssueComment = (issueId: string, commentId: string) =>
    apiClient.delete(`${this.basePath}/${issueId}/comments/${commentId}`);

  toggleCommentReaction = (issueId: string, commentId: string, type: string) =>
    apiClient
      .post<{ success: boolean; data: { type: string; count: number; reacted: boolean }[]; timestamp: string }>(
        `${this.basePath}/${issueId}/comments/${commentId}/reactions`,
        { type },
      )
      .then((r) => r.data.data);

  getIssueStatusLogs = (issueId: string) =>
    apiClient
      .get<StatusLogListResponse>(`${this.basePath}/${issueId}/status-logs`)
      .then((r) => r.data.data);

  getMyIssues = (params?: { size?: number }) =>
    apiClient
      .get<{ success: boolean; data: IssueResponse[]; timestamp: string }>(`${this.basePath}/my`, { params })
      .then((r) => r.data.data);

  getFilterPresets = () =>
    apiClient
      .get<{ success: boolean; data: Array<{ name: string; filters: Record<string, any> }>; timestamp: string }>(`${this.basePath}/filter-presets`)
      .then((r) => r.data.data);

  saveFilterPresets = (presets: Array<{ name: string; filters: Record<string, any> }>) =>
    apiClient
      .put(`${this.basePath}/filter-presets`, { presets });

  // ─── Ratings ─────────────────────────────────────────────────
  upsertRating = (issueId: string, rating: number) =>
    apiClient.put(`/content-ratings/issues/${issueId}`, { rating });

  deleteRating = (issueId: string) =>
    apiClient.delete(`/content-ratings/issues/${issueId}`);
}

export const issueService = new IssueService();
