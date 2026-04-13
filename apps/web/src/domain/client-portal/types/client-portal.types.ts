/** 이슈 목록 아이템 */
export interface ClientIssue {
  id: string;
  refNumber: string | null;
  type: string;
  title: string;
  severity: string;
  status: string;
  priority: number;
  reporterId: string;
  reporterName: string | null;
  assigneeName: string | null;
  projectId: string;
  projectName: string;
  doneRatio: number;
  createdAt: string;
  updatedAt: string;
}

/** 이슈 코멘트 */
export interface ClientIssueComment {
  id: string;
  content: string;
  authorName: string;
  authorType: string;
  issueStatus: string;
  createdAt: string;
}

/** 이슈 상세 (목록 아이템 + description + comments) */
export interface ClientIssueDetail extends ClientIssue {
  description: string;
  comments: ClientIssueComment[];
}

/** 프로젝트 목록 아이템 */
export interface ClientProject {
  projectId: string;
  code: string;
  name: string;
  status: string;
  category: string | null;
  startDate: string | null;
  endDate: string | null;
  managerName: string | null;
  issueCount: number;
  openIssueCount: number;
}

/** 프로젝트 상세 */
export interface ClientProjectDetail {
  projectId: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  managerName: string | null;
}

/** 페이지네이션 응답 */
export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/** 프로젝트 멤버 */
export interface ProjectMember {
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
}

/** 이슈 생성 페이로드 */
export interface CreateClientIssuePayload {
  project_id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  parent_issue_id?: string;
  assignee_id?: string;
  participant_ids?: string[];
  start_date?: string;
  due_date?: string;
  google_drive_link?: string;
}

/** 이슈 상태 변경 로그 */
export interface ClientIssueStatusLog {
  logId: string;
  changeType: string;
  fromStatus: string;
  toStatus: string;
  changedByName: string;
  note: string | null;
  createdAt: string;
}
