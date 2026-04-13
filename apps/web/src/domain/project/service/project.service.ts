import { apiClient } from '@/lib/api-client';
import { ProjectResponse, ProjectMemberResponse, ProjectReviewResponse, IssueResponse } from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class ProjectApiService {
  private readonly basePath = '/project/projects';
  private readonly reviewPath = '/project/reviews';

  // Project CRUD
  getProjects = (params?: { status?: string; category?: string; priority?: string; search?: string; scope?: string }) =>
    apiClient
      .get<ListResponse<ProjectResponse>>(this.basePath, { params })
      .then((r) => r.data.data);

  getProjectById = (id: string) =>
    apiClient
      .get<SingleResponse<ProjectResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createProject = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<ProjectResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateProject = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<ProjectResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteProject = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  // AI Draft
  generateAiDraft = (data: { title: string; brief_description: string; category?: string; language?: string }) =>
    apiClient
      .post<SingleResponse<Record<string, unknown>>>(`${this.basePath}/ai/draft`, data)
      .then((r) => r.data.data);

  // Similar Projects
  getSimilarProjects = (id: string) =>
    apiClient
      .get<SingleResponse<unknown[]>>(`${this.basePath}/${id}/similar`)
      .then((r) => r.data.data);

  // Submit
  submitProposal = (id: string, comment?: string) =>
    apiClient
      .post<SingleResponse<ProjectResponse>>(`${this.basePath}/${id}/submit`, { comment })
      .then((r) => r.data.data);

  // Approve / Reject
  approveProject = (id: string, comment?: string) =>
    apiClient
      .post<SingleResponse<ProjectResponse>>(`${this.basePath}/${id}/approve`, { comment })
      .then((r) => r.data.data);

  rejectProject = (id: string, data: { comment?: string; reason?: string }) =>
    apiClient
      .post<SingleResponse<ProjectResponse>>(`${this.basePath}/${id}/reject`, data)
      .then((r) => r.data.data);

  // Project Issues
  getProjectIssues = (id: string, params?: { status?: string; type?: string; page?: number; size?: number }) =>
    apiClient
      .get<{ success: boolean; data: IssueResponse[]; totalCount: number; timestamp: string }>(
        `${this.basePath}/${id}/issues`,
        { params },
      )
      .then((r) => ({ data: r.data.data, totalCount: r.data.totalCount }));

  // Project Notes (linked meeting notes)
  getProjectNotes = (id: string) =>
    apiClient
      .get<ListResponse<{
        noteId: string;
        title: string;
        type: string;
        visibility: string;
        meetingDate: string;
        authorName: string;
        createdAt: string;
      }>>(`${this.basePath}/${id}/notes`)
      .then((r) => r.data.data);

  // Members
  getMembers = (projectId: string) =>
    apiClient
      .get<ListResponse<ProjectMemberResponse>>(`${this.basePath}/${projectId}/members`)
      .then((r) => r.data.data);

  addMember = (projectId: string, data: { user_id: string; role: string }) =>
    apiClient
      .post<SingleResponse<ProjectMemberResponse>>(`${this.basePath}/${projectId}/members`, data)
      .then((r) => r.data.data);

  updateMemberRole = (projectId: string, memberId: string, role: string) =>
    apiClient
      .patch<SingleResponse<ProjectMemberResponse>>(`${this.basePath}/${projectId}/members/${memberId}`, { role })
      .then((r) => r.data.data);

  removeMember = (projectId: string, memberId: string) =>
    apiClient.delete(`${this.basePath}/${projectId}/members/${memberId}`);

  // Clients (고객사 배정)
  getProjectClients = (projectId: string) =>
    apiClient
      .get<ListResponse<any>>(`${this.basePath}/${projectId}/clients`)
      .then((r) => r.data.data);

  addProjectClient = (projectId: string, cliId: string) =>
    apiClient
      .post<SingleResponse<any>>(`${this.basePath}/${projectId}/clients`, { cli_id: cliId })
      .then((r) => r.data.data);

  removeProjectClient = (projectId: string, clientId: string) =>
    apiClient.delete(`${this.basePath}/${projectId}/clients/${clientId}`);

  // Project Comments
  getProjectComments = (projectId: string) =>
    apiClient
      .get<ListResponse<{
        commentId: string;
        projectId: string;
        userId: string;
        userName: string;
        content: string;
        createdAt: string;
      }>>(`${this.basePath}/${projectId}/comments`)
      .then((r) => r.data.data);

  addProjectComment = (projectId: string, content: string) =>
    apiClient
      .post<SingleResponse<{
        commentId: string;
        projectId: string;
        userId: string;
        userName: string;
        content: string;
        createdAt: string;
      }>>(`${this.basePath}/${projectId}/comments`, { content })
      .then((r) => r.data.data);

  deleteProjectComment = (projectId: string, commentId: string) =>
    apiClient.delete(`${this.basePath}/${projectId}/comments/${commentId}`);

  // Reviews
  getReviewHistory = (projectId: string) =>
    apiClient
      .get<ListResponse<ProjectReviewResponse>>(`${this.reviewPath}/${projectId}/history`)
      .then((r) => r.data.data);

  generatePreAnalysis = (projectId: string) =>
    apiClient
      .post<SingleResponse<Record<string, unknown>>>(`${this.reviewPath}/${projectId}/pre-analysis`)
      .then((r) => r.data.data);

  getRecommendation = (projectId: string) =>
    apiClient
      .get<SingleResponse<Record<string, unknown>>>(`${this.reviewPath}/${projectId}/recommendation`)
      .then((r) => r.data.data);

  performReviewAction = (projectId: string, data: { action: string; comment?: string; step?: number }) =>
    apiClient
      .post<SingleResponse<ProjectReviewResponse>>(`${this.reviewPath}/${projectId}/action`, data)
      .then((r) => r.data.data);
}

export const projectApiService = new ProjectApiService();
