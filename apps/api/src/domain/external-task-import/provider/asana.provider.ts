import { Injectable, Logger } from '@nestjs/common';
import { ExternalTaskProviderType, ExternalProject, ExternalGroup, ExternalTask, PaginatedExternalResult } from '@amb/types';
import { ExternalTaskProvider, ProviderConnectionConfig, ConnectionTestResult, FetchTasksOptions } from '../interface/external-task-provider.interface';
import { IssueEntity } from '../../issues/entity/issue.entity';

const ASANA_BASE = 'https://app.asana.com/api/1.0';

@Injectable()
export class AsanaProvider implements ExternalTaskProvider {
  private readonly logger = new Logger(AsanaProvider.name);
  readonly providerType: ExternalTaskProviderType = 'asana';
  readonly displayName = 'Asana';

  async testConnection(config: ProviderConnectionConfig): Promise<ConnectionTestResult> {
    try {
      const data = await this.get<any>(config.apiKey, '/users/me', { opt_fields: 'name,email,workspaces.name' });
      const workspaces = (data?.data?.workspaces || []).map((w: any) => w.name).join(', ');
      return { success: true, info: `${data?.data?.name} (${workspaces})` };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async fetchProjects(config: ProviderConnectionConfig): Promise<ExternalProject[]> {
    // First get workspaces
    const me = await this.get<any>(config.apiKey, '/users/me', { opt_fields: 'workspaces.gid' });
    const workspaces = me?.data?.workspaces || [];

    const projects: ExternalProject[] = [];
    for (const ws of workspaces) {
      const res = await this.get<any>(config.apiKey, `/workspaces/${ws.gid}/projects`, {
        opt_fields: 'name,notes,permalink_url',
        limit: '100',
      });
      for (const p of res?.data || []) {
        projects.push({
          id: p.gid,
          name: p.name,
          description: p.notes || undefined,
          url: p.permalink_url || undefined,
        });
      }
    }
    return projects;
  }

  async fetchGroups(config: ProviderConnectionConfig, projectId: string): Promise<ExternalGroup[]> {
    const res = await this.get<any>(config.apiKey, `/projects/${projectId}/sections`, {
      opt_fields: 'name',
    });
    return (res?.data || []).map((s: any) => ({
      id: s.gid,
      name: s.name,
    }));
  }

  async fetchTasks(config: ProviderConnectionConfig, groupId: string, options?: FetchTasksOptions): Promise<PaginatedExternalResult<ExternalTask>> {
    const params: Record<string, string> = {
      opt_fields: 'name,notes,assignee.name,assignee.email,due_on,start_on,completed,tags.name,permalink_url,created_at,modified_at',
      limit: '100',
    };
    if (options?.onlyIncomplete) {
      params.completed_since = 'now';
    }
    if (options?.cursor) {
      params.offset = options.cursor;
    }

    const res = await this.get<any>(config.apiKey, `/sections/${groupId}/tasks`, params);
    const tasks: ExternalTask[] = (res?.data || []).map((t: any) => ({
      id: t.gid,
      title: t.name,
      description: t.notes || undefined,
      assignee: t.assignee?.name || undefined,
      assigneeEmail: t.assignee?.email || undefined,
      status: t.completed ? 'CLOSED' : 'OPEN',
      isCompleted: !!t.completed,
      startDate: t.start_on || undefined,
      dueDate: t.due_on || undefined,
      tags: (t.tags || []).map((tag: any) => tag.name),
      url: t.permalink_url || undefined,
      createdAt: t.created_at || undefined,
      updatedAt: t.modified_at || undefined,
    }));

    const nextOffset = res?.next_page?.offset;
    return {
      data: tasks,
      hasMore: !!nextOffset,
      nextCursor: nextOffset || undefined,
    };
  }

  /* Asana 그룹(섹션)명 → AMA Issue Status 매핑 */
  private static readonly GROUP_STATUS_MAP: Record<string, string> = {
    'on hold': 'OPEN',
    '접수준비중': 'OPEN',
    '접수됨': 'APPROVED',
    '작업중': 'IN_PROGRESS',
    '검수중': 'TEST',
    '검수 후 리오픈': 'REOPEN',
    '처리 됨': 'RESOLVED',
    'backlog': 'CLOSED',
    '크리마팀 작업필요': 'OPEN',
  };

  private resolveStatusFromGroup(groupName?: string): string | undefined {
    if (!groupName) return undefined;
    const normalized = groupName.trim().toLowerCase();
    for (const [key, status] of Object.entries(AsanaProvider.GROUP_STATUS_MAP)) {
      if (normalized === key.toLowerCase()) return status;
    }
    return undefined;
  }

  convertToIssueData(task: ExternalTask, defaults: Record<string, any>): Partial<IssueEntity> {
    const mappedStatus = this.resolveStatusFromGroup(defaults._groupName);
    return {
      issType: defaults.type || 'TASK',
      issTitle: task.title.substring(0, 200),
      issDescription: task.description || '',
      issSeverity: defaults.severity || 'MAJOR',
      issStatus: task.isCompleted ? 'CLOSED' : (mappedStatus || 'OPEN'),
      issPriority: defaults.priority ?? 3,
      issVisibility: defaults.visibility || 'ENTITY',
      issStartDate: task.startDate || null,
      issDueDate: task.dueDate || null,
      issDoneRatio: task.isCompleted ? 100 : 0,
      pjtId: defaults.project_id || null,
    };
  }

  /* ── private HTTP ── */

  private async get<T>(apiKey: string, path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${ASANA_BASE}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Asana API ${res.status} ${path}: ${text}`);
      throw new Error(`Asana API responded with ${res.status}`);
    }

    return res.json() as Promise<T>;
  }
}
