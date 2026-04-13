import { apiClient } from '@/lib/api-client';
import {
  ExternalProviderMeta,
  ExternalProject,
  ExternalGroup,
  ExternalTask,
  PaginatedExternalResult,
  ExternalTaskImportResult,
  ExternalTaskImportRequest,
} from '@amb/types';

/* ── 응답 타입 ── */

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ExternalTool {
  id: string;
  code: string;
  name: string;
  url: string;
  isActive: boolean;
  icon: string;
  createdAt: string;
}

export interface ImportLog {
  id: string;
  provider: string;
  batchId: string;
  projectName: string | null;
  groupName: string | null;
  totalCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  executedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface ImportedTask {
  mappingId: string;
  provider: string;
  externalId: string;
  externalUrl: string | null;
  externalProject: string | null;
  externalGroup: string | null;
  issueId: string;
  issueTitle: string;
  issueRefNumber: string;
  issueStatus: string;
  importedAt: string;
}

export interface ConnectionTestResult {
  success: boolean;
  info?: string;
  error?: string;
}

/* ── 서비스 ── */

class ExternalTaskImportApiService {
  private readonly settingsBase = '/entity-settings/external-task-tools';
  private readonly importBase = '/issues/external';

  /* ── 설정 (Entity Settings 영역) ── */

  getTools = () =>
    apiClient
      .get<ApiResponse<ExternalTool[]>>(this.settingsBase)
      .then((r) => r.data.data);

  createTool = (data: { provider: string; name: string; url?: string; api_key: string }) =>
    apiClient
      .post<ApiResponse<ExternalTool>>(this.settingsBase, data)
      .then((r) => r.data.data);

  updateTool = (id: string, data: { name?: string; url?: string; api_key?: string; is_active?: boolean }) =>
    apiClient
      .patch<ApiResponse<ExternalTool>>(`${this.settingsBase}/${id}`, data)
      .then((r) => r.data.data);

  deleteTool = (id: string) =>
    apiClient
      .delete(`${this.settingsBase}/${id}`)
      .then(() => undefined);

  testConnection = (id: string) =>
    apiClient
      .post<ApiResponse<ConnectionTestResult>>(`${this.settingsBase}/${id}/test`)
      .then((r) => r.data.data);

  /* ── 가져오기 (Issue 영역) ── */

  getProviders = () =>
    apiClient
      .get<ApiResponse<ExternalProviderMeta[]>>(`${this.importBase}/providers`)
      .then((r) => r.data.data);

  getProjects = (provider: string, appId: string) =>
    apiClient
      .get<ApiResponse<ExternalProject[]>>(`${this.importBase}/${provider}/projects`, {
        params: { app_id: appId },
      })
      .then((r) => r.data.data);

  getGroups = (provider: string, appId: string, projectId: string) =>
    apiClient
      .get<ApiResponse<ExternalGroup[]>>(`${this.importBase}/${provider}/projects/${projectId}/groups`, {
        params: { app_id: appId },
      })
      .then((r) => r.data.data);

  getTasks = (provider: string, appId: string, groupId: string, opts?: { cursor?: string; onlyIncomplete?: boolean }) =>
    apiClient
      .get<ApiResponse<PaginatedExternalResult<ExternalTask>>>(`${this.importBase}/${provider}/groups/${groupId}/tasks`, {
        params: { app_id: appId, cursor: opts?.cursor, only_incomplete: opts?.onlyIncomplete },
      })
      .then((r) => r.data.data);

  importTasks = (provider: string, data: ExternalTaskImportRequest) =>
    apiClient
      .post<ApiResponse<ExternalTaskImportResult>>(`${this.importBase}/${provider}/import`, data)
      .then((r) => r.data.data);

  getImportedTasks = (params?: { provider?: string; page?: number; size?: number }) =>
    apiClient
      .get<ApiResponse<{ data: ImportedTask[]; totalCount: number; hasMore: boolean }>>(`${this.importBase}/imported`, { params })
      .then((r) => r.data.data);

  getImportLogs = (params?: { page?: number; size?: number }) =>
    apiClient
      .get<ApiResponse<{ data: ImportLog[]; totalCount: number; hasMore: boolean }>>(`${this.importBase}/logs`, { params })
      .then((r) => r.data.data);
}

export const externalTaskImportService = new ExternalTaskImportApiService();
