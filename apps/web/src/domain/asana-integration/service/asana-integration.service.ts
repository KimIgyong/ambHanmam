import { apiClient } from '@/lib/api-client';

/* ── 응답 타입 (백엔드 Response camelCase와 일치) ── */

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AsanaProjectMapping {
  id: string;
  asanaProjectGid: string;
  asanaProjectName: string | null;
  projectId: string | null;
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface AsanaProjectInfo {
  gid: string;
  name: string;
  taskCount: number;
}

export interface AsanaTaskPreview {
  gid: string;
  name: string;
  completed: boolean;
  dueOn: string | null;
  assigneeName: string | null;
  sectionName: string | null;
  priority: string | null;
}

export interface AsanaImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
}

export interface AsanaConnectionTest {
  ok: boolean;
  name?: string;
  email?: string;
  error?: string;
}

export interface AsanaAppConfig {
  apiKeyId: string;
  provider: string;
  name: string;
  keyLast4: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class AsanaIntegrationService {
  private readonly prefix = '/entity-settings/asana';

  /* ── PAT Config ── */

  async getConfig(): Promise<AsanaAppConfig[]> {
    const res = await apiClient.get<ApiResponse<AsanaAppConfig[]>>(`${this.prefix}/config`);
    return res.data.data;
  }

  async saveConfig(value: string): Promise<AsanaAppConfig> {
    const res = await apiClient.post<ApiResponse<AsanaAppConfig>>(`${this.prefix}/config`, {
      provider: 'ASANA_PAT',
      value,
    });
    return res.data.data;
  }

  async deleteConfig(): Promise<void> {
    await apiClient.delete(`${this.prefix}/config`);
  }

  async testConnection(): Promise<AsanaConnectionTest> {
    const res = await apiClient.post<ApiResponse<AsanaConnectionTest>>(`${this.prefix}/test-connection`);
    return res.data.data;
  }

  /* ── Asana Project Info ── */

  async getAsanaProject(gid: string): Promise<AsanaProjectInfo> {
    const res = await apiClient.get<ApiResponse<AsanaProjectInfo>>(`${this.prefix}/projects/${gid}`);
    return res.data.data;
  }

  async previewTasks(gid: string): Promise<AsanaTaskPreview[]> {
    const res = await apiClient.get<ApiResponse<AsanaTaskPreview[]>>(`${this.prefix}/projects/${gid}/tasks`);
    return res.data.data;
  }

  /* ── Project Mappings ── */

  async getMappings(): Promise<AsanaProjectMapping[]> {
    const res = await apiClient.get<ApiResponse<AsanaProjectMapping[]>>(`${this.prefix}/mappings`);
    return res.data.data;
  }

  async createMapping(data: {
    asana_project_gid: string;
    asana_project_name?: string;
    project_id?: string;
  }): Promise<AsanaProjectMapping> {
    const res = await apiClient.post<ApiResponse<AsanaProjectMapping>>(`${this.prefix}/mappings`, data);
    return res.data.data;
  }

  async deleteMapping(id: string): Promise<void> {
    await apiClient.delete(`${this.prefix}/mappings/${id}`);
  }

  /* ── Import ── */

  async importTasks(mappingId: string, data?: {
    completed_filter?: 'all' | 'active' | 'completed';
  }): Promise<AsanaImportResult> {
    const res = await apiClient.post<ApiResponse<AsanaImportResult>>(
      `${this.prefix}/mappings/${mappingId}/import`,
      data || {},
    );
    return res.data.data;
  }
}

export const asanaIntegrationService = new AsanaIntegrationService();
