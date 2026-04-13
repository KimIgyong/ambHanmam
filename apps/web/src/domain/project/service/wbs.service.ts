import { apiClient } from '@/lib/api-client';
import { ProjectEpicResponse, ProjectComponentResponse, WbsTreeResponse } from '@amb/types';

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

class WbsApiService {
  private basePath(projectId: string) {
    return `/project/projects/${projectId}`;
  }

  // ─── Epics ───
  getEpics = (projectId: string, params?: { include_closed?: boolean }) =>
    apiClient
      .get<ListResponse<ProjectEpicResponse>>(`${this.basePath(projectId)}/epics`, { params })
      .then((r) => r.data.data);

  createEpic = (projectId: string, data: { title: string; description?: string; status?: string; color?: string; start_date?: string; due_date?: string }) =>
    apiClient
      .post<SingleResponse<ProjectEpicResponse>>(`${this.basePath(projectId)}/epics`, data)
      .then((r) => r.data.data);

  updateEpic = (projectId: string, epicId: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<ProjectEpicResponse>>(`${this.basePath(projectId)}/epics/${epicId}`, data)
      .then((r) => r.data.data);

  deleteEpic = (projectId: string, epicId: string) =>
    apiClient.delete(`${this.basePath(projectId)}/epics/${epicId}`);

  // ─── Components ───
  getComponents = (projectId: string) =>
    apiClient
      .get<ListResponse<ProjectComponentResponse>>(`${this.basePath(projectId)}/components`)
      .then((r) => r.data.data);

  createComponent = (projectId: string, data: { title: string; description?: string; color?: string; owner_id?: string }) =>
    apiClient
      .post<SingleResponse<ProjectComponentResponse>>(`${this.basePath(projectId)}/components`, data)
      .then((r) => r.data.data);

  updateComponent = (projectId: string, componentId: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<ProjectComponentResponse>>(`${this.basePath(projectId)}/components/${componentId}`, data)
      .then((r) => r.data.data);

  deleteComponent = (projectId: string, componentId: string) =>
    apiClient.delete(`${this.basePath(projectId)}/components/${componentId}`);

  // ─── WBS Tree ───
  getWbsTree = (projectId: string, params?: { include_closed?: boolean }) =>
    apiClient
      .get<SingleResponse<WbsTreeResponse>>(`${this.basePath(projectId)}/wbs`, { params })
      .then((r) => r.data.data);

  // ─── Issue Group ───
  updateIssueGroup = (projectId: string, issueId: string, data: { group_type: 'epic' | 'component' | 'unassigned'; group_id?: string }) =>
    apiClient
      .patch<SingleResponse<unknown>>(`${this.basePath(projectId)}/wbs/issues/${issueId}/group`, data)
      .then((r) => r.data.data);
}

export const wbsApiService = new WbsApiService();
