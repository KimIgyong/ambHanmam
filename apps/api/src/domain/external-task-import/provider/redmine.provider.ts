import { Injectable, Logger } from '@nestjs/common';
import { ExternalTaskProviderType, ExternalProject, ExternalGroup, ExternalTask, PaginatedExternalResult } from '@amb/types';
import { ExternalTaskProvider, ProviderConnectionConfig, ConnectionTestResult, FetchTasksOptions } from '../interface/external-task-provider.interface';
import { IssueEntity } from '../../issues/entity/issue.entity';

/* ── Redmine → AMB 매핑 상수 (기존 migration 모듈에서 재활용) ── */

const TRACKER_MAP: Record<number, string> = {
  1: 'BUG',
  2: 'FEATURE_REQUEST',
  3: 'OPINION',
  4: 'TASK',
};

const STATUS_MAP: Record<number, string> = {
  1: 'OPEN',
  2: 'IN_PROGRESS',
  3: 'RESOLVED',
  4: 'OPEN',
  5: 'CLOSED',
  6: 'REJECTED',
  7: 'APPROVED',
};

const PRIORITY_MAP: Record<number, { priority: number; severity: string }> = {
  1: { priority: 5, severity: 'MINOR' },
  2: { priority: 3, severity: 'MINOR' },
  3: { priority: 2, severity: 'MAJOR' },
  4: { priority: 1, severity: 'MAJOR' },
  5: { priority: 1, severity: 'CRITICAL' },
};

@Injectable()
export class RedmineProvider implements ExternalTaskProvider {
  private readonly logger = new Logger(RedmineProvider.name);
  readonly providerType: ExternalTaskProviderType = 'redmine';
  readonly displayName = 'Redmine';

  async testConnection(config: ProviderConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const body = await this.get<any>(config, '/users/current.json');
      return { success: true, info: `${body?.user?.login} (${body?.user?.mail})` };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async fetchProjects(config: ProviderConnectionConfig): Promise<ExternalProject[]> {
    const allProjects: ExternalProject[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const body = await this.get<any>(config, '/projects.json', { offset, limit });
      const projects = body?.projects || [];
      for (const p of projects) {
        allProjects.push({
          id: String(p.id),
          name: p.name,
          description: p.description || undefined,
        });
      }
      if (projects.length < limit || allProjects.length >= (body?.total_count ?? 0)) break;
      offset += limit;
    }
    return allProjects;
  }

  async fetchGroups(config: ProviderConnectionConfig, projectId: string): Promise<ExternalGroup[]> {
    // Redmine: versions as groups
    try {
      const body = await this.get<any>(config, `/projects/${projectId}/versions.json`);
      return (body?.versions || []).map((v: any) => ({
        id: String(v.id),
        name: v.name,
      }));
    } catch {
      // If no versions, return empty
      return [];
    }
  }

  async fetchTasks(config: ProviderConnectionConfig, groupId: string, options?: FetchTasksOptions): Promise<PaginatedExternalResult<ExternalTask>> {
    const params: Record<string, string | number> = {
      limit: 100,
    };

    // groupId can be "project:{projectId}" or "version:{versionId}"
    if (groupId.startsWith('project:')) {
      params.project_id = groupId.replace('project:', '');
    } else {
      params.fixed_version_id = groupId;
    }

    if (options?.onlyIncomplete) {
      params.status_id = 'open';
    }

    const offset = options?.cursor ? parseInt(options.cursor, 10) : 0;
    params.offset = offset;

    const body = await this.get<any>(config, '/issues.json', params);
    const issues = body?.issues || [];
    const totalCount = body?.total_count ?? 0;

    const tasks: ExternalTask[] = issues.map((i: any) => {
      const statusId = i.status?.id;
      const isClosed = statusId === 5 || statusId === 6;
      return {
        id: String(i.id),
        title: i.subject,
        description: i.description || undefined,
        assignee: i.assigned_to?.name || undefined,
        status: STATUS_MAP[statusId] || 'OPEN',
        isCompleted: isClosed,
        priority: i.priority?.name || undefined,
        startDate: i.start_date || undefined,
        dueDate: i.due_date || undefined,
        doneRatio: i.done_ratio ?? 0,
        url: config.baseUrl ? `${config.baseUrl}/issues/${i.id}` : undefined,
        createdAt: i.created_on || undefined,
        updatedAt: i.updated_on || undefined,
      };
    });

    const nextOffset = offset + issues.length;
    const hasMore = nextOffset < totalCount;

    return {
      data: tasks,
      hasMore,
      nextCursor: hasMore ? String(nextOffset) : undefined,
      totalCount,
    };
  }

  convertToIssueData(task: ExternalTask, defaults: Record<string, any>): Partial<IssueEntity> {
    // Redmine task.id is numeric, use it for tracker/priority mapping from the raw data
    const pm = PRIORITY_MAP[defaults._redminePriorityId] || { priority: defaults.priority ?? 3, severity: defaults.severity || 'MAJOR' };
    return {
      issType: defaults.type || TRACKER_MAP[defaults._redmineTrackerId] || 'TASK',
      issTitle: task.title.substring(0, 200),
      issDescription: task.description || '',
      issSeverity: pm.severity,
      issStatus: task.isCompleted ? 'CLOSED' : (task.status || 'OPEN'),
      issPriority: pm.priority,
      issVisibility: defaults.visibility || 'ENTITY',
      issStartDate: task.startDate || null,
      issDueDate: task.dueDate || null,
      issDoneRatio: task.doneRatio ?? 0,
      issRedmineId: parseInt(task.id, 10) || null,
      pjtId: defaults.project_id || null,
    };
  }

  /* ── private HTTP ── */

  private async get<T>(config: ProviderConnectionConfig, path: string, params?: Record<string, string | number>): Promise<T> {
    if (!config.baseUrl) throw new Error('Redmine baseUrl is required');

    const baseUrl = config.baseUrl.replace(/\/+$/, '');
    const url = new URL(`${baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Redmine-API-Key': config.apiKey,
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
