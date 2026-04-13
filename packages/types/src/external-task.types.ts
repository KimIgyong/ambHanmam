/* ── External Task Import 공유 타입 ── */

export type ExternalTaskProviderType = 'asana' | 'redmine' | 'jira' | 'notion';

export const EXTERNAL_TASK_PROVIDER_TYPES: ExternalTaskProviderType[] = [
  'asana',
  'redmine',
  'jira',
  'notion',
];

/* ── Provider Meta (사용 가능한 프로바이더 목록 응답) ── */

export interface ExternalProviderMeta {
  type: ExternalTaskProviderType;
  displayName: string;
  icon: string;
  isConnected: boolean;
  appId?: string;
  appName?: string;
}

/* ── 프로젝트 / 그룹 / 태스크 ── */

export interface ExternalProject {
  id: string;
  name: string;
  description?: string;
  url?: string;
}

export interface ExternalGroup {
  id: string;
  name: string;
  taskCount?: number;
}

export interface ExternalTask {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  assigneeEmail?: string;
  status?: string;
  isCompleted: boolean;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  doneRatio?: number;
  tags?: string[];
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  alreadyImported?: boolean;
  importedIssueId?: string;
}

export interface PaginatedExternalResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

/* ── Import 요청/응답 ── */

export interface ExternalTaskImportRequest {
  app_id: string;
  task_ids: string[];
  group_id?: string;
  project_name?: string;
  group_name?: string;
  defaults: {
    type?: string;
    severity?: string;
    priority?: number;
    visibility?: string;
    project_id?: string;
  };
}

export interface ExternalTaskImportResultItem {
  external_id: string;
  status: 'imported' | 'skipped' | 'failed';
  issue_id?: string;
  ref_number?: string;
  error?: string;
}

export interface ExternalTaskImportResult {
  batch_id: string;
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  results: ExternalTaskImportResultItem[];
}
