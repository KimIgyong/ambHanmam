import { ExternalTaskProviderType, ExternalProject, ExternalGroup, ExternalTask, PaginatedExternalResult } from '@amb/types';
import { IssueEntity } from '../../issues/entity/issue.entity';

export interface ProviderConnectionConfig {
  apiKey: string;
  baseUrl?: string;
  extra?: Record<string, string>;
}

export interface ConnectionTestResult {
  success: boolean;
  info?: string;
  error?: string;
}

export interface FetchTasksOptions {
  cursor?: string;
  onlyIncomplete?: boolean;
}

export interface ExternalTaskProvider {
  readonly providerType: ExternalTaskProviderType;
  readonly displayName: string;

  testConnection(config: ProviderConnectionConfig): Promise<ConnectionTestResult>;
  fetchProjects(config: ProviderConnectionConfig): Promise<ExternalProject[]>;
  fetchGroups(config: ProviderConnectionConfig, projectId: string): Promise<ExternalGroup[]>;
  fetchTasks(config: ProviderConnectionConfig, groupId: string, options?: FetchTasksOptions): Promise<PaginatedExternalResult<ExternalTask>>;
  convertToIssueData(task: ExternalTask, defaults: Record<string, any>): Partial<IssueEntity>;
}
