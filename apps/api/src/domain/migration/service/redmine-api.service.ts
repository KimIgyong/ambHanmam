import { Injectable, Logger } from '@nestjs/common';
import { ApiKeyService } from '../../settings/service/api-key.service';

/* ───── Redmine REST API response types ───── */
export interface RedmineApiProject {
  id: number;
  name: string;
  identifier: string;
  description: string;
  status: number;
  parent?: { id: number; name: string };
  created_on: string;
  updated_on: string;
}

export interface RedmineApiIssue {
  id: number;
  project: { id: number; name: string };
  tracker: { id: number; name: string };
  status: { id: number; name: string };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  subject: string;
  description: string;
  start_date: string | null;
  due_date: string | null;
  done_ratio: number;
  estimated_hours: number | null;
  created_on: string;
  updated_on: string;
}

export interface RedmineApiJournal {
  id: number;
  user: { id: number; name: string };
  notes: string;
  created_on: string;
  details: Array<{
    property: string;
    name: string;
    old_value: string | null;
    new_value: string | null;
  }>;
}

export interface RedmineApiIssueDetail extends RedmineApiIssue {
  journals: RedmineApiJournal[];
}

export interface RedmineApiUser {
  id: number;
  login: string;
  firstname: string;
  lastname: string;
  mail: string;
  created_on: string;
}

@Injectable()
export class RedmineApiService {
  private readonly logger = new Logger(RedmineApiService.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  /** DB에서 Redmine 설정(URL, API Key) 조회 */
  private async getConfig(): Promise<{ baseUrl: string; apiKey: string }> {
    const [url, key] = await Promise.all([
      this.apiKeyService.getDecryptedKey('REDMINE_URL'),
      this.apiKeyService.getDecryptedKey('REDMINE'),
    ]);
    return {
      baseUrl: (url || '').replace(/\/+$/, ''),
      apiKey: key || '',
    };
  }

  /* ── Connection check ── */

  async checkConnection(configOverride?: { baseUrl: string; apiKey: string }): Promise<{ connected: boolean; version?: string }> {
    const { baseUrl, apiKey } = configOverride || await this.getConfig();
    if (!baseUrl || !apiKey) {
      return { connected: false };
    }
    try {
      const body = await this.get<any>(baseUrl, apiKey, '/users/current.json');
      return { connected: true, version: body?.user?.login };
    } catch {
      return { connected: false };
    }
  }

  /* ── Projects ── */

  async fetchProjects(offset = 0, limit = 100, configOverride?: { baseUrl: string; apiKey: string }): Promise<{
    projects: RedmineApiProject[];
    totalCount: number;
  }> {
    const { baseUrl, apiKey } = configOverride || await this.getConfig();
    const body = await this.get<any>(baseUrl, apiKey, '/projects.json', { offset, limit });
    return {
      projects: body.projects || [],
      totalCount: body.total_count ?? 0,
    };
  }

  /* ── Issues (list) ── */

  async fetchIssues(params: {
    projectId?: number;
    statusId?: string;
    trackerId?: number;
    assignedToId?: number;
    offset?: number;
    limit?: number;
    sort?: string;
  }, configOverride?: { baseUrl: string; apiKey: string }): Promise<{ issues: RedmineApiIssue[]; totalCount: number }> {
    const requestedLimit = params.limit ?? 25;
    const startOffset = params.offset ?? 0;
    const { baseUrl, apiKey } = configOverride || await this.getConfig();
    const BATCH = 100; // Redmine API max per single request

    const buildQs = (offset: number, limit: number): Record<string, string> => {
      const qs: Record<string, string> = {};
      if (params.projectId) qs.project_id = String(params.projectId);
      if (params.statusId) qs.status_id = params.statusId;
      if (params.trackerId) qs.tracker_id = String(params.trackerId);
      if (params.assignedToId) qs.assigned_to_id = String(params.assignedToId);
      qs.offset = String(offset);
      qs.limit = String(limit);
      if (params.sort) qs.sort = params.sort;
      return qs;
    };

    // Single-page request
    if (requestedLimit <= BATCH) {
      const qs = buildQs(startOffset, requestedLimit);
      const body = await this.get<any>(baseUrl, apiKey, '/issues.json', qs);
      return { issues: body.issues || [], totalCount: body.total_count ?? 0 };
    }

    // Multi-page: batch internally for large limits
    const allIssues: RedmineApiIssue[] = [];
    let totalCount = 0;
    let offset = startOffset;

    while (allIssues.length < requestedLimit) {
      const batchSize = Math.min(BATCH, requestedLimit - allIssues.length);
      const qs = buildQs(offset, batchSize);
      const body = await this.get<any>(baseUrl, apiKey, '/issues.json', qs);
      const batchIssues: RedmineApiIssue[] = body.issues || [];
      totalCount = body.total_count ?? 0;
      allIssues.push(...batchIssues);
      if (batchIssues.length < batchSize) break;
      offset += batchIssues.length;
      if (offset >= totalCount) break;
    }

    return { issues: allIssues, totalCount };
  }

  /* ── Issue detail (with journals) ── */

  async fetchIssueDetail(issueId: number, configOverride?: { baseUrl: string; apiKey: string }): Promise<RedmineApiIssueDetail> {
    const { baseUrl, apiKey } = configOverride || await this.getConfig();
    const body = await this.get<any>(baseUrl, apiKey, `/issues/${issueId}.json`, { include: 'journals' });
    return body.issue;
  }

  /* ── Users ── */

  async fetchUsers(offset = 0, limit = 100): Promise<{
    users: RedmineApiUser[];
    totalCount: number;
  }> {
    const { baseUrl, apiKey } = await this.getConfig();
    const body = await this.get<any>(baseUrl, apiKey, '/users.json', { offset, limit });
    return {
      users: body.users || [],
      totalCount: body.total_count ?? 0,
    };
  }

  /* ──────────── private HTTP helper ──────────── */

  private async get<T>(baseUrl: string, apiKey: string, path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Redmine-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Redmine API ${res.status} ${path}: ${text}`);
      throw new Error(`Redmine API responded with ${res.status}`);
    }

    return res.json() as Promise<T>;
  }
}
