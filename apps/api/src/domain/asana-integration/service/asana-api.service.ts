import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface AsanaProject {
  gid: string;
  name: string;
  notes?: string;
  numTasks?: number;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes: string;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  dueOn: string | null;
  startOn: string | null;
  assigneeName: string | null;
  sectionName: string | null;
  priority: string | null;
  permalinkUrl: string | null;
  numSubtasks: number;
}

@Injectable()
export class AsanaApiService {
  private readonly logger = new Logger(AsanaApiService.name);
  private readonly baseUrl = 'https://app.asana.com/api/1.0';

  private getClient(pat: string): AxiosInstance {
    return axios.create({
      baseURL: this.baseUrl,
      headers: { Authorization: `Bearer ${pat}` },
      timeout: 15000,
    });
  }

  async authTest(pat: string): Promise<{ ok: boolean; name?: string; email?: string; error?: string }> {
    try {
      const client = this.getClient(pat);
      const res = await client.get('/users/me', { params: { opt_fields: 'name,email' } });
      const user = res.data?.data;
      return { ok: true, name: user?.name, email: user?.email };
    } catch (error) {
      return { ok: false, error: error?.response?.data?.errors?.[0]?.message || error.message };
    }
  }

  async getProject(pat: string, projectGid: string): Promise<AsanaProject | null> {
    try {
      const client = this.getClient(pat);
      const res = await client.get(`/projects/${projectGid}`, {
        params: { opt_fields: 'name,notes' },
      });
      const p = res.data?.data;
      if (!p) return null;

      // 태스크 수 조회
      const countRes = await client.get(`/projects/${projectGid}/tasks`, {
        params: { opt_fields: 'gid', limit: 1 },
      });
      // Asana doesn't return total count, use a separate call
      const allTasks = await this.getAllTaskGids(client, projectGid);

      return { gid: p.gid, name: p.name, notes: p.notes, numTasks: allTasks.length };
    } catch (error) {
      this.logger.error(`Failed to get Asana project ${projectGid}: ${error.message}`);
      return null;
    }
  }

  async getTasksForProject(
    pat: string,
    projectGid: string,
    opts?: { limit?: number; completedFilter?: 'all' | 'active' | 'completed' },
  ): Promise<AsanaTask[]> {
    const client = this.getClient(pat);
    const allRaw: any[] = [];
    let offset: string | undefined;
    const maxTasks = opts?.limit || 1000;
    const optFields = 'name,notes,assignee.name,due_on,start_on,completed,completed_at,created_at,custom_fields,custom_fields.name,custom_fields.display_value,memberships.section.name,permalink_url,num_subtasks';

    do {
      const params: any = { opt_fields: optFields, limit: Math.min(100, maxTasks - allRaw.length) };
      if (opts?.completedFilter === 'active') params.completed_since = 'now';
      if (offset) params.offset = offset;

      const res = await client.get(`/projects/${projectGid}/tasks`, { params });
      const tasks = res.data?.data || [];
      allRaw.push(...tasks);

      offset = res.data?.next_page?.offset;

      // Rate limit safety: 400ms delay
      if (offset && allRaw.length < maxTasks) {
        await this.delay(400);
      }
    } while (offset && allRaw.length < maxTasks);

    // Filter completed if needed
    let filtered = allRaw;
    if (opts?.completedFilter === 'completed') {
      filtered = allRaw.filter((t) => t.completed);
    }

    return filtered.map((t) => this.mapTask(t));
  }

  private mapTask(raw: any): AsanaTask {
    // Extract priority from custom fields
    let priority: string | null = null;
    if (raw.custom_fields) {
      const priorityField = raw.custom_fields.find(
        (f: any) => f.name?.toLowerCase() === 'priority',
      );
      if (priorityField) {
        priority = priorityField.display_value || null;
      }
    }

    // Extract section name
    let sectionName: string | null = null;
    if (raw.memberships?.length) {
      sectionName = raw.memberships[0]?.section?.name || null;
    }

    return {
      gid: raw.gid,
      name: raw.name || '',
      notes: raw.notes || '',
      completed: raw.completed ?? false,
      completedAt: raw.completed_at || null,
      createdAt: raw.created_at || '',
      dueOn: raw.due_on || null,
      startOn: raw.start_on || null,
      assigneeName: raw.assignee?.name || null,
      sectionName,
      priority,
      permalinkUrl: raw.permalink_url || null,
      numSubtasks: raw.num_subtasks || 0,
    };
  }

  private async getAllTaskGids(client: AxiosInstance, projectGid: string): Promise<string[]> {
    const gids: string[] = [];
    let offset: string | undefined;

    do {
      const params: any = { opt_fields: 'gid', limit: 100 };
      if (offset) params.offset = offset;

      const res = await client.get(`/projects/${projectGid}/tasks`, { params });
      const tasks = res.data?.data || [];
      gids.push(...tasks.map((t: any) => t.gid));
      offset = res.data?.next_page?.offset;

      if (offset) await this.delay(400);
    } while (offset);

    return gids;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
