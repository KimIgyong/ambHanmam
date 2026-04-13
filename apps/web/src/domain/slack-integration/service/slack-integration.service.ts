import { apiClient } from '@/lib/api-client';

/* ── 응답 타입 ── */

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface SlackWorkspace {
  id: string;
  teamId: string;
  teamName: string;
  isActive: boolean;
  connectedAt: string;
  appId: string;
}

export interface SlackChannelMapping {
  id: string;
  workspaceId: string;
  workspaceName: string;
  slackChannelId: string;
  slackChannelName: string;
  amaChannelId: string;
  amaChannelName: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISCONNECTED';
  direction: 'BIDIRECTIONAL' | 'INBOUND_ONLY' | 'OUTBOUND_ONLY';
  createdAt: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  isMember: boolean;
  numMembers: number;
}

export interface SlackAppConfig {
  apiKeyId: string;
  provider: string;
  name: string;
  keyLast4: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImportHistoryResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
}

export interface SyncMembersResult {
  slackMembers: number;
  matched: number;
  added: number;
  alreadyMember: number;
  unmatched: Array<{ slackUserId: string; displayName: string; email: string | null }>;
}

class SlackIntegrationService {
  private readonly prefix = '/entity-settings/slack';

  /* ── App Config (Client ID / Secret / Signing Secret) ── */

  async getConfig(): Promise<SlackAppConfig[]> {
    const res = await apiClient.get<ApiResponse<SlackAppConfig[]>>(`${this.prefix}/config`);
    return res.data.data;
  }

  async saveConfig(provider: string, value: string): Promise<SlackAppConfig> {
    const res = await apiClient.post<ApiResponse<SlackAppConfig>>(`${this.prefix}/config`, { provider, value });
    return res.data.data;
  }

  async deleteConfig(provider: string): Promise<void> {
    await apiClient.delete(`${this.prefix}/config/${provider}`);
  }

  /* ── Workspaces ── */

  async getWorkspaces(): Promise<SlackWorkspace[]> {
    const res = await apiClient.get<ApiResponse<SlackWorkspace[]>>(`${this.prefix}/workspaces`);
    return res.data.data;
  }

  async connectWithBotToken(botToken: string): Promise<SlackWorkspace> {
    const res = await apiClient.post<ApiResponse<SlackWorkspace>>(`${this.prefix}/workspaces/connect-token`, {
      bot_token: botToken,
    });
    return res.data.data;
  }

  async disconnectWorkspace(id: string): Promise<void> {
    await apiClient.delete(`${this.prefix}/workspaces/${id}`);
  }

  async getSlackChannels(workspaceId: string): Promise<SlackChannel[]> {
    const res = await apiClient.get<ApiResponse<SlackChannel[]>>(`${this.prefix}/workspaces/${workspaceId}/channels`);
    return res.data.data;
  }

  /* ── Channel Mappings ── */

  async getMappings(): Promise<SlackChannelMapping[]> {
    const res = await apiClient.get<ApiResponse<SlackChannelMapping[]>>(`${this.prefix}/mappings`);
    return res.data.data;
  }

  async createMapping(data: {
    swc_id: string;
    slack_channel_id: string;
    slack_channel_name?: string;
    ama_channel_id?: string;
    direction?: string;
  }): Promise<SlackChannelMapping> {
    const res = await apiClient.post<ApiResponse<SlackChannelMapping>>(`${this.prefix}/mappings`, data);
    return res.data.data;
  }

  async updateMapping(id: string, data: {
    status?: string;
    direction?: string;
  }): Promise<SlackChannelMapping> {
    const res = await apiClient.patch<ApiResponse<SlackChannelMapping>>(`${this.prefix}/mappings/${id}`, data);
    return res.data.data;
  }

  async deleteMapping(id: string): Promise<void> {
    await apiClient.delete(`${this.prefix}/mappings/${id}`);
  }

  /* ── Import History ── */

  async importHistory(mappingId: string, data?: {
    oldest?: string;
    latest?: string;
    limit?: number;
  }): Promise<ImportHistoryResult> {
    const res = await apiClient.post<ApiResponse<ImportHistoryResult>>(
      `${this.prefix}/mappings/${mappingId}/import-history`,
      data || {},
    );
    return res.data.data;
  }

  /* ── Sync Members ── */

  async syncMembers(mappingId: string): Promise<SyncMembersResult> {
    const res = await apiClient.post<ApiResponse<SyncMembersResult>>(
      `${this.prefix}/mappings/${mappingId}/sync-members`,
    );
    return res.data.data;
  }

  /* ── OAuth ── */

  getInstallUrl(): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/slack/oauth/install`;
  }
}

export const slackIntegrationService = new SlackIntegrationService();
