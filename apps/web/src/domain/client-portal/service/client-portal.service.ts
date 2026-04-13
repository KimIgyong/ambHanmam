import { apiClient } from '@/lib/api-client';
import type { ClientIssue, ClientIssueDetail, ClientIssueStatusLog, ClientProject, ClientProjectDetail, PaginationMeta, ProjectMember, CreateClientIssuePayload } from '../types/client-portal.types';

interface IssueQueryParams {
  status?: string;
  project_id?: string;
  search?: string;
  page?: number;
  size?: number;
}

interface ProjectIssueQueryParams {
  status?: string;
  exclude_closed?: string;
  search?: string;
  sort?: string;
  page?: number;
  size?: number;
}

interface ProjectQueryParams {
  search?: string;
  page?: number;
  size?: number;
}

class ClientPortalApiService {
  private readonly basePath = '/client-auth';

  login = (entityCode: string, email: string, password: string) =>
    apiClient.post(`${this.basePath}/login`, { entity_code: entityCode, email, password }).then((r) => r.data.data);

  register = (data: { token: string; name: string; password: string; job_title?: string; phone?: string }) =>
    apiClient.post(`${this.basePath}/register`, data).then((r) => r.data.data);

  verifyInvitation = (token: string) =>
    apiClient.get(`${this.basePath}/invitation/${token}`).then((r) => r.data.data);

  getProfile = () =>
    apiClient.get(`${this.basePath}/me`).then((r) => r.data.data);

  changePassword = (current_password: string, new_password: string) =>
    apiClient.post(`${this.basePath}/change-password`, { current_password, new_password }).then((r) => r.data);

  logout = () =>
    apiClient.post(`${this.basePath}/logout`).catch(() => {});

  // ── Projects ──

  getProjects = (params?: ProjectQueryParams): Promise<{ data: ClientProject[]; pagination: PaginationMeta }> =>
    apiClient.get('/client/projects', { params }).then((r) => r.data);

  getProjectById = (id: string): Promise<ClientProjectDetail> =>
    apiClient.get(`/client/projects/${id}`).then((r) => r.data.data);

  getProjectIssues = (projectId: string, params?: ProjectIssueQueryParams): Promise<{ data: ClientIssue[]; pagination: PaginationMeta }> =>
    apiClient.get(`/client/projects/${projectId}/issues`, { params }).then((r) => ({
      data: r.data.data,
      pagination: r.data.pagination,
    }));

  getProjectMembers = (projectId: string): Promise<ProjectMember[]> =>
    apiClient.get(`/client/projects/${projectId}/members`).then((r) => r.data.data);

  // ── Issues ──

  createIssue = (data: CreateClientIssuePayload): Promise<ClientIssue> =>
    apiClient.post('/client/issues', data).then((r) => r.data.data);

  getMyIssues = (params?: IssueQueryParams): Promise<{ data: ClientIssue[]; pagination: PaginationMeta }> =>
    apiClient.get('/client/issues', { params }).then((r) => r.data);

  getIssueById = (id: string): Promise<ClientIssueDetail> =>
    apiClient.get(`/client/issues/${id}`).then((r) => r.data.data);

  addComment = (issueId: string, content: string) =>
    apiClient.post(`/client/issues/${issueId}/comments`, { content }).then((r) => r.data.data);

  confirmResolution = (issueId: string) =>
    apiClient.post(`/client/issues/${issueId}/confirm`).then((r) => r.data.data);

  getIssueStatusLogs = (issueId: string): Promise<ClientIssueStatusLog[]> =>
    apiClient.get(`/client/issues/${issueId}/status-logs`).then((r) => r.data.data);
}

export const clientPortalApiService = new ClientPortalApiService();
