import type { UserRole, InvitationStatus } from './user-level.types';

export const UNIT_CODE = {
  LEGAL: 'LEGAL',
  ACCOUNTING: 'ACCOUNTING',
  TRANSLATION: 'TRANSLATION',
  PM: 'PM',
  DEVELOPMENT: 'DEVELOPMENT',
  IT: 'IT',
} as const;

export type UnitCode = (typeof UNIT_CODE)[keyof typeof UNIT_CODE];

export const MESSAGE_ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
  ADMIN: 'admin',
} as const;

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];

export interface UserResponse {
  userId: string;
  email: string;
  name: string;
  unit: string;
  role: UserRole;
  companyEmail: string | null;
  /** ADMIN_LEVEL | USER_LEVEL */
  level?: string;
  /** PENDING | ACTIVE | INACTIVE | SUSPENDED | WITHDRAWN */
  status?: string;
  /** 소속 조직(법인) ID */
  companyId?: string;
  /** 소속 조직명 */
  companyName?: string;
  /** HQ 소속 여부 */
  isHq?: boolean;
  /** 비밀번호 변경 필요 여부 */
  mustChangePw?: boolean;
  /** 서명 이미지 보유 여부 */
  hasSignature?: boolean;
  /** 사용자 타임존 (IANA timezone) */
  timezone?: string;
  /** UI 언어: vi | ko | en */
  locale?: string;
  createdAt: string;
}

export interface ConversationResponse {
  conversationId: string;
  userId: string;
  unit: UnitCode;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  messageId: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokenCount: number;
  order: number;
  createdAt: string;
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[];
}

export interface AgentInfoResponse {
  unitCode: UnitCode;
  unitName: string;
  description: string;
  specialties: string[];
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

/** 로그인 2단계 응답: 법인 선택 옵션 */
export interface LoginEntityOption {
  userId: string;
  entityId: string;
  entityName: string;
  entityNameEn: string | null;
  entityCode: string;
  country: string;
  role: string;
  status: string;
}

/** 로그인 응답 (step 기반 분기) */
export type LoginResponse =
  | { step: 'complete'; tokens: AuthTokenResponse }
  | { step: 'select_entity'; entities: LoginEntityOption[]; selectToken: string };

// API 키 관리
export const API_PROVIDER = {
  ANTHROPIC: 'ANTHROPIC',
  OPENAI: 'OPENAI',
  GOOGLE: 'GOOGLE',
  REDMINE: 'REDMINE',
  REDMINE_URL: 'REDMINE_URL',
  MEGAPAY: 'MEGAPAY',
  SLACK_CLIENT_ID: 'SLACK_CLIENT_ID',
  SLACK_CLIENT_SECRET: 'SLACK_CLIENT_SECRET',
  SLACK_SIGNING_SECRET: 'SLACK_SIGNING_SECRET',
} as const;

export type ApiProvider = (typeof API_PROVIDER)[keyof typeof API_PROVIDER];

export interface ApiKeyResponse {
  apiKeyId: string;
  provider: ApiProvider;
  name: string;
  keyLast4: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Invitation — InvitationStatus is imported from user-group.types.ts

export interface InvitationResponse {
  invitationId: string;
  email: string;
  role: UserRole;
  unit: string;
  cellId: string | null;
  cellName: string | null;
  status: InvitationStatus;
  invitedBy: string;
  inviterName: string;
  expiresAt: string;
  acceptedAt: string | null;
  acceptedUserId: string | null;
  lastSentAt: string | null;
  sendCount: number;
  createdAt: string;
}

export interface InvitationValidationResponse {
  valid: boolean;
  email: string;
  role: UserRole;
  unit: string;
  cellId: string | null;
  levelCode?: string;
  companyId?: string | null;
  autoApprove?: boolean;
  entityName?: string | null;
}

// Cell
export interface CellMemberSummary {
  userId: string;
  name: string;
}

export interface CellResponse {
  cellId: string;
  name: string;
  description: string | null;
  entityId: string | null;
  entityCode: string | null;
  entityName: string | null;
  memberCount: number;
  members: CellMemberSummary[];
  createdAt: string;
  updatedAt: string;
}

// SMTP Settings
export interface SmtpSettingsResponse {
  host: string;
  port: number;
  user: string;
  maskedPass: string;
  from: string;
  secure: boolean;
  updatedAt: string | null;
}

export interface SiteSettingsResponse {
  portalUrl: string | null;
  portalDomain: string | null;
  allowedIps: string[];
  allowedDomains: string[];
  isPublic: boolean;
  logoUrl: string | null;
  faviconUrl: string | null;
  indexEnabled: boolean;
  indexHtml: string | null;
  updatedAt: string | null;
}

// Todo
export const TODO_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type TodoStatus = (typeof TODO_STATUS)[keyof typeof TODO_STATUS];

export const TODO_RECURRENCE_TYPE = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type TodoRecurrenceType = (typeof TODO_RECURRENCE_TYPE)[keyof typeof TODO_RECURRENCE_TYPE];

export const TODO_COMPUTED_STATUS = {
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  DUE_TODAY: 'DUE_TODAY',
  IN_PROGRESS: 'IN_PROGRESS',
  UPCOMING_SOON: 'UPCOMING_SOON',
  UPCOMING: 'UPCOMING',
} as const;

export type TodoComputedStatus = (typeof TODO_COMPUTED_STATUS)[keyof typeof TODO_COMPUTED_STATUS];

export interface TodoResponse {
  todoId: string;
  userId: string;
  userName?: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  dueDate: string | null;
  startDate: string | null;
  computedStatus: TodoComputedStatus;
  daysUntilDue: number | null;
  daysUntilStart: number | null;
  tags: string | null;
  completedAt: string | null;
  startedAt: string | null;
  commentCount: number;
  issueId?: string | null;
  issueTitle?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  originalLang: string;
  participants?: TodoParticipantResponse[];
  recurrenceType?: string | null;
  recurrenceDay?: number | null;
  parentId?: string | null;
  avgRating: number | null;
  ratingCount: number;
  myRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoParticipantResponse {
  participantId: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface TodoCommentResponse {
  commentId: string;
  todoId: string;
  authorId: string;
  authorName: string;
  content: string;
  avgRating?: number | null;
  ratingCount?: number;
  myRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStatusLogResponse {
  logId: string;
  todoId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  note: string | null;
}

// Meeting Notes
export const MEETING_VISIBILITY = {
  PRIVATE: 'PRIVATE',
  CELL: 'CELL',
  ENTITY: 'ENTITY',
  PUBLIC: 'PUBLIC',
} as const;

export type MeetingVisibility = (typeof MEETING_VISIBILITY)[keyof typeof MEETING_VISIBILITY];

export const NOTE_TYPE = {
  MEETING_NOTE: 'MEETING_NOTE',
  MEMO: 'MEMO',
} as const;

export type NoteType = (typeof NOTE_TYPE)[keyof typeof NOTE_TYPE];

export interface MeetingNoteResponse {
  meetingNoteId: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  type: NoteType;
  meetingDate: string;
  visibility: MeetingVisibility;
  unit: string | null;
  cellId: string | null;
  originalLang: string;
  assigneeId: string | null;
  assigneeName: string | null;
  folderId: string | null;
  folderName: string | null;
  participants: MeetingNoteParticipantResponse[];
  projects: MeetingNoteProjectResponse[];
  issues: MeetingNoteIssueResponse[];
  commentCount: number;
  avgRating: number | null;
  ratingCount: number;
  myRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNoteParticipantResponse {
  userId: string;
  name: string;
}

export interface MeetingNoteProjectResponse {
  projectId: string;
  name: string;
  code: string;
}

export interface MeetingNoteIssueResponse {
  issueId: string;
  title: string;
  status: string;
}

export interface MeetingNoteCommentResponse {
  commentId: string;
  meetingNoteId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  replies?: MeetingNoteCommentResponse[];
}

export interface MeetingNoteRatingResponse {
  ratingId: string;
  meetingNoteId: string;
  userId: string;
  rating: number;
  createdAt: string;
}

export interface MeetingNoteFolderResponse {
  folderId: string;
  name: string;
  color: string | null;
  sortOrder: number;
  noteCount: number;
  createdAt: string;
}

// Attendance (출퇴근)
export const ATTENDANCE_TYPE = {
  OFFICE: 'OFFICE',
  REMOTE: 'REMOTE',
  OUTSIDE_WORK: 'OUTSIDE_WORK',
  BUSINESS_TRIP: 'BUSINESS_TRIP',
  EXTERNAL_SITE: 'EXTERNAL_SITE',
  DAY_OFF: 'DAY_OFF',
  AM_HALF: 'AM_HALF',
  PM_HALF: 'PM_HALF',
  MENSTRUATION: 'MENSTRUATION',
} as const;

export type AttendanceType = (typeof ATTENDANCE_TYPE)[keyof typeof ATTENDANCE_TYPE];

/** Valid attendance type values for DTO validation */
export const ATTENDANCE_TYPE_VALUES = Object.values(ATTENDANCE_TYPE) as string[];

export const START_TIME_OPTIONS = ['08:00', '08:30', '09:00', '09:30', '10:00'] as const;

export interface AttendanceAmendmentResponse {
  amendmentId: string;
  attendanceId: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  note: string;
  amendedBy: string;
  amendedByName: string;
  createdAt: string;
}

export interface AttendanceResponse {
  attendanceId: string;
  userId: string;
  userName: string;
  date: string;
  type: AttendanceType;
  startTime: string | null;
  endTime: string | null;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  amendments?: AttendanceAmendmentResponse[];
}

export interface AttendancePolicyResponse {
  policyId: string;
  entityId: string;
  remoteDefaultCount: number;
  remoteExtraCount: number;
  remoteBlockOnExceed: boolean;
  leaveAutoDeduct: boolean;
  halfLeaveAutoDeduct: boolean;
  updatedAt: string;
}

// Notice
export const NOTICE_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  UNIT: 'UNIT',
} as const;

export type NoticeVisibility = (typeof NOTICE_VISIBILITY)[keyof typeof NOTICE_VISIBILITY];

export interface NoticeResponse {
  noticeId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  visibility: NoticeVisibility;
  unit: string | null;
  isPinned: boolean;
  viewCount: number;
  attachments: NoticeAttachmentResponse[];
  originalLang: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeAttachmentResponse {
  attachmentId: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

// Menu Permission
export const MENU_CODE = {
  CHAT_ACCOUNTING: 'CHAT_ACCOUNTING',
  CHAT_LEGAL: 'CHAT_LEGAL',
  CHAT_TRANSLATION: 'CHAT_TRANSLATION',
  CHAT_PM: 'CHAT_PM',
  CHAT_DEVELOPMENT: 'CHAT_DEVELOPMENT',
  SETTINGS_MEMBERS: 'SETTINGS_MEMBERS',
  SETTINGS_API_KEYS: 'SETTINGS_API_KEYS',
  SETTINGS_SMTP: 'SETTINGS_SMTP',
  SETTINGS_EMAIL_TEMPLATES: 'SETTINGS_EMAIL_TEMPLATES',
  SETTINGS_PERMISSIONS: 'SETTINGS_PERMISSIONS',
  SETTINGS_ENTITIES: 'SETTINGS_ENTITIES',
  SETTINGS_AGENTS: 'SETTINGS_AGENTS',
  TODO: 'TODO',
  AGENTS: 'AGENTS',
  MEETING_NOTES: 'MEETING_NOTES',
  AMOEBA_TALK: 'AMOEBA_TALK',
  ATTENDANCE: 'ATTENDANCE',
  CALENDAR: 'CALENDAR',
  NOTICES: 'NOTICES',
  DRIVE: 'DRIVE',
  ACCOUNTING: 'ACCOUNTING',
  HR: 'HR',
  BILLING: 'BILLING',
  MAIL: 'MAIL',
  UNITS: 'UNITS',
  WORK_ITEMS: 'WORK_ITEMS',
  KMS: 'KMS',
  PROJECT_MANAGEMENT: 'PROJECT_MANAGEMENT',
  SERVICE_MANAGEMENT: 'SERVICE_MANAGEMENT',
  ISSUES: 'ISSUES',
  ENTITY_EMAIL_TEMPLATE: 'ENTITY_EMAIL_TEMPLATE',
} as const;

export type MenuCode = (typeof MENU_CODE)[keyof typeof MENU_CODE];

export interface MenuPermissionResponse {
  id: string;
  menuCode: MenuCode;
  menuName: string;
  role: string;
  accessible: boolean;
}

export interface MenuConfigResponse {
  id: string;
  menuCode: string;
  labelKey: string;
  icon: string;
  path: string;
  category: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface UserMenuPermissionResponse {
  id: string;
  menuCode: string;
  userId: string;
  userName: string;
  userRole: string;
  accessible: boolean;
  grantedBy: string | null;
  createdAt: string;
}

export interface MyMenuItemResponse {
  menuCode: string;
  path: string;
  icon: string;
  labelKey: string;
  sortOrder: number;
  category: string;
}

// My Page / Profile
export interface MyProfileResponse {
  userId: string;
  email: string;
  name: string;
  unit: string;
  role: string;
  companyEmail: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  units: MyUnitInfo[];
  entities: MyEntityInfo[];
  cells: MyCellInfo[];
}

export interface MyUnitInfo {
  unitId: string;
  unitName: string;
  role: string;
  isPrimary: boolean;
  entityName: string;
}

export interface MyEntityInfo {
  entityId: string;
  entityCode: string;
  entityName: string;
  country: string;
  role: string;
  status: string;
}

export interface MyCellInfo {
  cellId: string;
  cellName: string;
  entityName: string;
}

// Drive / Documents
export const DRIVE_TYPE = {
  SHARED: 'shared',
  PERSONAL: 'personal',
} as const;

export type DriveType = (typeof DRIVE_TYPE)[keyof typeof DRIVE_TYPE];

export interface DriveFileResponse {
  id: string;
  name: string;
  mimeType: string;
  size: string | null;
  iconLink: string | null;
  thumbnailLink: string | null;
  webViewLink: string | null;
  modifiedTime: string;
  createdTime: string;
  owners: string[];
  parentId: string | null;
  isFolder: boolean;
}

export interface DriveFolderRegistration {
  id: string;
  folderId: string;
  folderName: string;
  driveType: DriveType;
  description: string | null;
  createdAt: string;
}

// Currency
export const CURRENCY = { VND: 'VND', USD: 'USD', KRW: 'KRW' } as const;
export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

// Bank Account
export interface BankAccountResponse {
  accountId: string;
  bankName: string;
  branchName: string | null;
  accountNumber: string;
  accountAlias: string | null;
  currency: string;
  openingBalance: number;
  openingDate: string | null;
  isActive: boolean;
  currentBalance: number;
  lastTransactionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Transaction
export interface TransactionResponse {
  transactionId: string;
  accountId: string;
  seqNo: number;
  transactionDate: string;
  projectName: string | null;
  netValue: number;
  vat: number;
  bankCharge: number;
  totalValue: number;
  balance: number;
  cumulativeBalance: number;
  vendor: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Account Summary
export interface AccountSummaryResponse {
  accounts: BankAccountResponse[];
  totalsByCurrency: Record<string, number>;
}

// Monthly Stats
export interface MonthlyStatsResponse {
  month: string;
  deposit: number;
  withdrawal: number;
  net: number;
}

// Top Vendor
export interface TopVendorResponse {
  vendor: string;
  totalAmount: number;
  count: number;
}

// Recurring Expense
export interface RecurringExpenseResponse {
  id: string;
  accountId: string;
  accountAlias: string | null;
  name: string;
  vendor: string | null;
  amount: number;
  currency: string;
  dayOfMonth: number;
  category: string | null;
  description: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Forecast
export interface ForecastItem {
  id: string;
  name: string;
  vendor: string | null;
  expectedAmount: number;
  actualAmount: number | null;
  currency: string;
  dayOfMonth: number;
  category: string | null;
  accountAlias: string | null;
}

export interface ForecastResponse {
  month: string;
  items: ForecastItem[];
  totalsByCurrency: Record<string, number>;
  previousMonth: string;
}

// Webmail
export const MAIL_FOLDER = {
  INBOX: 'INBOX',
  SENT: 'SENT',
  DRAFTS: 'DRAFTS',
  TRASH: 'TRASH',
} as const;
export type MailFolder = (typeof MAIL_FOLDER)[keyof typeof MAIL_FOLDER];

export const MAIL_QUEUE_STATUS = {
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
export type MailQueueStatus = (typeof MAIL_QUEUE_STATUS)[keyof typeof MAIL_QUEUE_STATUS];

export interface MailAccountResponse {
  accountId: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
}

export interface MailMessageResponse {
  messageId: string;
  messageIdHeader: string | null;
  folder: string;
  from: string;
  to: string;
  cc: string | null;
  bcc: string | null;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  date: string | null;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  inReplyTo: string | null;
  attachments: MailAttachmentResponse[];
}

export interface MailAttachmentResponse {
  attachmentId: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface MailMessageListItem {
  messageId: string;
  folder: string;
  from: string;
  to: string;
  subject: string | null;
  date: string | null;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  bodyPreview: string | null;
}

// Member
export interface MemberResponse {
  userId: string;
  email: string;
  name: string;
  unit: string;
  role: UserRole;
  /** ADMIN_LEVEL | USER_LEVEL */
  levelCode?: string;
  status?: string;
  cells: { cellId: string; name: string }[];
  createdAt: string;
  failedLoginCount?: number;
  lockedUntil?: string | null;
}

export interface MemberCellInfo {
  cellId: string;
  name: string;
  entityCode: string | null;
  entityName: string | null;
}

export interface MemberDetailResponse extends MemberResponse {
  companyEmail: string | null;
  jobTitle: string | null;
  memberCells: MemberCellInfo[];
  entityRoles: MemberEntityRole[];
  unitRoles: MemberUnitRole[];
  hrEmployees: MemberHrEmployee[];
}

export interface MemberEntityRole {
  eurId: string;
  entityId: string;
  entityCode: string;
  entityName: string;
  role: string;
  status: string;
}

export interface MemberUnitRole {
  uurId: string;
  unitId: string;
  unitName: string;
  role: string;
  isPrimary: boolean;
  entityCode: string;
  entityName: string;
}

export interface MemberHrEmployee {
  employeeId: string;
  entityCode: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  status: string;
}

// ===== ACL (Access Control) =====

export const UNIT_ROLE = {
  MEMBER: 'MEMBER',
  TEAM_LEAD: 'TEAM_LEAD',
  UNIT_HEAD: 'UNIT_HEAD',
} as const;
export type UnitRole = (typeof UNIT_ROLE)[keyof typeof UNIT_ROLE];

export const UNIT_LEVEL = {
  UNIT: 1,
  TEAM: 2,
} as const;
export type UnitLevel = (typeof UNIT_LEVEL)[keyof typeof UNIT_LEVEL];

export const WORK_ITEM_VISIBILITY = {
  PRIVATE: 'PRIVATE',
  SHARED: 'SHARED',
  UNIT: 'UNIT',
  CELL: 'CELL',
  ENTITY: 'ENTITY',
  PUBLIC: 'PUBLIC',
} as const;
export type WorkItemVisibility = (typeof WORK_ITEM_VISIBILITY)[keyof typeof WORK_ITEM_VISIBILITY];

export const WORK_ITEM_TYPE = {
  DOC: 'DOC',
  REPORT: 'REPORT',
  TODO: 'TODO',
  NOTE: 'NOTE',
  EMAIL: 'EMAIL',
  ANALYSIS: 'ANALYSIS',
} as const;
export type WorkItemType = (typeof WORK_ITEM_TYPE)[keyof typeof WORK_ITEM_TYPE];

export const SHARE_PERMISSION = {
  VIEW: 'VIEW',
  COMMENT: 'COMMENT',
  EDIT: 'EDIT',
  ADMIN: 'ADMIN',
} as const;
export type SharePermission = (typeof SHARE_PERMISSION)[keyof typeof SHARE_PERMISSION];

export const SHARE_TARGET_TYPE = {
  USER: 'USER',
  UNIT: 'UNIT',
  TEAM: 'TEAM',
  CELL: 'CELL',
  ENTITY: 'ENTITY',
} as const;
export type ShareTargetType = (typeof SHARE_TARGET_TYPE)[keyof typeof SHARE_TARGET_TYPE];

export const COMMENT_TYPE = {
  COMMENT: 'COMMENT',
  FEEDBACK: 'FEEDBACK',
  APPROVAL: 'APPROVAL',
  REQUEST: 'REQUEST',
  MENTION: 'MENTION',
} as const;
export type CommentType = (typeof COMMENT_TYPE)[keyof typeof COMMENT_TYPE];

export const AUDIT_ACTION = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  SHARE: 'SHARE',
  ACCESS_DENIED: 'ACCESS_DENIED',
} as const;
export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export interface UnitResponse {
  unitId: string;
  entityId: string;
  name: string;
  nameLocal: string | null;
  parentId: string | null;
  level: number;
  isActive: boolean;
  children?: UnitResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface UserUnitRoleResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  unitId: string;
  unitName: string;
  role: UnitRole;
  isPrimary: boolean;
  startedAt: string;
  endedAt: string | null;
}

export interface WorkItemResponse {
  workItemId: string;
  entityId: string;
  type: WorkItemType;
  title: string;
  ownerId: string;
  ownerName: string;
  visibility: WorkItemVisibility;
  module: string | null;
  refId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemShareResponse {
  shareId: string;
  workItemId: string;
  targetType: ShareTargetType;
  targetId: string;
  targetName: string;
  permission: SharePermission;
  sharedBy: string;
  sharedByName: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface WorkItemCommentResponse {
  commentId: string;
  workItemId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  type: CommentType;
  isPrivate: boolean;
  isEdited: boolean;
  replies?: WorkItemCommentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  permission: SharePermission | null;
  reason: string;
}

// ===== KMS (Knowledge Management System) =====

export const TAG_LEVEL = {
  DOMAIN: 1,
  TOPIC: 2,
  CONTEXT: 3,
} as const;
export type TagLevel = (typeof TAG_LEVEL)[keyof typeof TAG_LEVEL];

export const TAG_SOURCE = {
  AI_EXTRACTED: 'AI_EXTRACTED',
  USER_MANUAL: 'USER_MANUAL',
  USER_CONFIRMED: 'USER_CONFIRMED',
  USER_REJECTED: 'USER_REJECTED',
  SYSTEM: 'SYSTEM',
} as const;
export type TagSource = (typeof TAG_SOURCE)[keyof typeof TAG_SOURCE];

export const TAG_RELATION_TYPE = {
  PARENT_CHILD: 'PARENT_CHILD',
  RELATED: 'RELATED',
  SYNONYM: 'SYNONYM',
  BROADER: 'BROADER',
  NARROWER: 'NARROWER',
} as const;
export type TagRelationType = (typeof TAG_RELATION_TYPE)[keyof typeof TAG_RELATION_TYPE];

export const TAG_CLOUD_SCOPE = {
  MY: 'MY',
  TEAM: 'TEAM',
  COMPANY: 'COMPANY',
} as const;
export type TagCloudScope = (typeof TAG_CLOUD_SCOPE)[keyof typeof TAG_CLOUD_SCOPE];

export interface KmsTagResponse {
  tagId: string;
  entityId: string;
  name: string;
  display: string;
  nameLocal: string | null;
  level: TagLevel;
  parentId: string | null;
  color: string | null;
  isSystem: boolean;
  usageCount: number;
  children?: KmsTagResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface KmsWorkItemTagResponse {
  id: string;
  workItemId: string;
  tagId: string;
  tagName: string;
  tagDisplay: string;
  tagLevel: TagLevel;
  tagColor: string | null;
  source: TagSource;
  confidence: number | null;
  weight: number;
  assignedBy: string | null;
  createdAt: string;
}

export interface TagCloudItemResponse {
  tagId: string;
  name: string;
  display: string;
  nameLocal: string | null;
  level: TagLevel;
  color: string | null;
  weight: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
  relatedTags: { tagId: string; name: string; coOccurrence: number }[];
}

export interface TagCloudResponse {
  scope: TagCloudScope;
  period: string;
  tags: TagCloudItemResponse[];
  totalItems: number;
  generatedAt: string;
}

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  level: TagLevel;
  color: string | null;
  weight: number;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  type: TagRelationType;
  weight: number;
}

export interface KnowledgeGraphResponse {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

// ===== KMS DocBuilder: Parsing / Extraction / Conflict / Gap =====

export interface ParsedDocument {
  type: 'docx' | 'pptx' | 'pdf';
  rawText: string;
  sections?: { title: string; content: string; level: number }[];
  slides?: { slideNumber: number; title: string; content: string; notes?: string }[];
  metadata?: { author?: string; title?: string; created?: string };
}

export interface ExtractionResult {
  sourceFile: string;
  categories: ExtractedCategory[];
}

export interface ExtractedCategory {
  categoryCode: string;
  data: Record<string, any>;
  confidence: number;
}

export interface ConflictReport {
  totalConflicts: number;
  items: ConflictItem[];
}

export interface ConflictItem {
  categoryCode: string;
  fieldKey: string;
  values: { source: string; value: any }[];
}

export interface GapReport {
  totalGaps: number;
  criticalGaps: number;
  items: GapItem[];
}

export interface GapItem {
  categoryCode: string;
  fieldKey: string;
  fieldLabel: string;
  severity: 'critical' | 'warning' | 'info';
}

// ===== Project Management =====

export const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export const PROJECT_CATEGORY = {
  TECH_BPO: 'TECH_BPO',
  SI_DEV: 'SI_DEV',
  INTERNAL: 'INTERNAL',
  R_AND_D: 'R_AND_D',
  MARKETING: 'MARKETING',
  OTHER: 'OTHER',
} as const;
export type ProjectCategory = (typeof PROJECT_CATEGORY)[keyof typeof PROJECT_CATEGORY];

export const PROJECT_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type ProjectPriority = (typeof PROJECT_PRIORITY)[keyof typeof PROJECT_PRIORITY];

export const PROJECT_MEMBER_ROLE = {
  PM: 'PM',
  LEAD: 'LEAD',
  MEMBER: 'MEMBER',
  REVIEWER: 'REVIEWER',
  OBSERVER: 'OBSERVER',
} as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLE)[keyof typeof PROJECT_MEMBER_ROLE];

export const PROJECT_REVIEW_ACTION = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  HOLD: 'HOLD',
  COMMENT: 'COMMENT',
} as const;
export type ProjectReviewAction = (typeof PROJECT_REVIEW_ACTION)[keyof typeof PROJECT_REVIEW_ACTION];

export const PROJECT_FILE_PHASE = {
  PROPOSAL: 'PROPOSAL',
  REVIEW: 'REVIEW',
  EXECUTION: 'EXECUTION',
  CLOSURE: 'CLOSURE',
} as const;
export type ProjectFilePhase = (typeof PROJECT_FILE_PHASE)[keyof typeof PROJECT_FILE_PHASE];

export interface ProjectResponse {
  projectId: string;
  entityId: string;
  code: string;
  name: string;
  title: string | null;
  purpose: string | null;
  goal: string | null;
  summary: string | null;
  status: string;
  category: string | null;
  priority: string;
  proposerId: string;
  proposerName: string;
  managerId: string | null;
  managerName: string | null;
  sponsorId: string | null;
  deptId: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  currency: string;
  contractId: string | null;
  gdriveFolderId: string | null;
  aiDraftJson: string | null;
  aiAnalysisJson: string | null;
  similarProjectsJson: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  note: string | null;
  witId: string | null;
  entityName: string;
  issueCount: number;
  openIssueCount: number;
  memberCount: number;
  parentId: string | null;
  redmineId: number | null;
  originalLang: string;
  members?: ProjectMemberResponse[];
  reviews?: ProjectReviewResponse[];
  files?: ProjectFileResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberResponse {
  memberId: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  leftAt: string | null;
}

export type EpicStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface ProjectEpicResponse {
  epicId: string;
  entityId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: EpicStatus;
  color: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdBy: string;
  createdByName: string;
  issueCount: number;
  doneIssueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectComponentResponse {
  componentId: string;
  entityId: string;
  projectId: string;
  title: string;
  description: string | null;
  color: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdBy: string;
  createdByName: string;
  issueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WbsTreeResponse {
  projectId: string;
  projectTitle: string;
  epics: (ProjectEpicResponse & { issues: IssueResponse[] })[];
  components: (ProjectComponentResponse & { issues: IssueResponse[] })[];
  unassigned: { issues: IssueResponse[] };
}

export interface ProjectReviewResponse {
  reviewId: string;
  projectId: string;
  reviewerId: string;
  reviewerName: string;
  step: number;
  action: string;
  comment: string | null;
  previousStatus: string;
  newStatus: string;
  aiAnalysisJson: string | null;
  createdAt: string;
}

export interface ProjectFileResponse {
  fileId: string;
  projectId: string;
  title: string;
  phase: string | null;
  filename: string;
  mimeType: string | null;
  fileSize: number | null;
  gdriveFileId: string | null;
  gdriveUrl: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

// ===== Service Management =====

export const SVC_SERVICE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DEPRECATED: 'DEPRECATED',
} as const;
export type SvcServiceStatus = (typeof SVC_SERVICE_STATUS)[keyof typeof SVC_SERVICE_STATUS];

export const SVC_SERVICE_CATEGORY = {
  COMMUNICATION: 'COMMUNICATION',
  COMMERCE: 'COMMERCE',
  MARKETING: 'MARKETING',
  PACKAGE: 'PACKAGE',
  OTHER: 'OTHER',
} as const;
export type SvcServiceCategory = (typeof SVC_SERVICE_CATEGORY)[keyof typeof SVC_SERVICE_CATEGORY];

export const SVC_CLIENT_TYPE = {
  COMPANY: 'COMPANY',
  INDIVIDUAL: 'INDIVIDUAL',
} as const;
export type SvcClientType = (typeof SVC_CLIENT_TYPE)[keyof typeof SVC_CLIENT_TYPE];

export const SVC_CLIENT_STATUS = {
  PROSPECT: 'PROSPECT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CHURNED: 'CHURNED',
} as const;
export type SvcClientStatus = (typeof SVC_CLIENT_STATUS)[keyof typeof SVC_CLIENT_STATUS];

export const SVC_SUBSCRIPTION_STATUS = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRING: 'EXPIRING',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type SvcSubscriptionStatus = (typeof SVC_SUBSCRIPTION_STATUS)[keyof typeof SVC_SUBSCRIPTION_STATUS];

export const SVC_SUBSCRIPTION_ACTION = {
  CREATED: 'CREATED',
  ACTIVATED: 'ACTIVATED',
  PLAN_CHANGED: 'PLAN_CHANGED',
  PRICE_CHANGED: 'PRICE_CHANGED',
  SUSPENDED: 'SUSPENDED',
  RESUMED: 'RESUMED',
  RENEWED: 'RENEWED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;
export type SvcSubscriptionAction = (typeof SVC_SUBSCRIPTION_ACTION)[keyof typeof SVC_SUBSCRIPTION_ACTION];

export const SVC_NOTE_TYPE = {
  GENERAL: 'GENERAL',
  MEETING: 'MEETING',
  ISSUE: 'ISSUE',
  FEEDBACK: 'FEEDBACK',
  CALL: 'CALL',
} as const;
export type SvcNoteType = (typeof SVC_NOTE_TYPE)[keyof typeof SVC_NOTE_TYPE];

export const SVC_BILLING_CYCLE = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  ONE_TIME: 'ONE_TIME',
  CUSTOM: 'CUSTOM',
} as const;
export type SvcBillingCycle = (typeof SVC_BILLING_CYCLE)[keyof typeof SVC_BILLING_CYCLE];

export interface SvcServiceResponse {
  serviceId: string;
  code: string;
  name: string;
  nameKo: string | null;
  nameVi: string | null;
  description: string | null;
  category: string;
  icon: string | null;
  color: string | null;
  websiteUrl: string | null;
  status: string;
  launchDate: string | null;
  sortOrder: number;
  planCount?: number;
  activeSubscriptionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SvcPlanResponse {
  planId: string;
  serviceId: string;
  code: string;
  name: string;
  description: string | null;
  billingCycle: string;
  price: number;
  currency: string;
  maxUsers: number | null;
  featuresJson: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SvcClientResponse {
  clientId: string;
  code: string;
  type: string;
  companyName: string;
  companyNameLocal: string | null;
  country: string | null;
  industry: string | null;
  companySize: string | null;
  taxId: string | null;
  address: string | null;
  website: string | null;
  logoUrl: string | null;
  status: string;
  source: string | null;
  referredBy: string | null;
  accountManagerId: string | null;
  accountManagerName: string | null;
  bilPartnerId: string | null;
  note: string | null;
  originalLang: string;
  subscriptionCount?: number;
  activeSubscriptionCount?: number;
  contacts?: SvcClientContactResponse[];
  subscriptions?: SvcSubscriptionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SvcClientContactResponse {
  contactId: string;
  clientId: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  isPrimary: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SvcSubscriptionResponse {
  subscriptionId: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  planId: string | null;
  planName: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  billingCycle: string | null;
  price: number | null;
  currency: string;
  discountRate: number;
  maxUsers: number | null;
  actualUsers: number;
  contractId: string | null;
  autoRenew: boolean;
  cancelledAt: string | null;
  cancellationReason: string | null;
  note: string | null;
  history?: SvcSubscriptionHistoryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface SvcSubscriptionHistoryResponse {
  historyId: string;
  subscriptionId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
}

export interface SvcClientNoteResponse {
  noteId: string;
  clientId: string;
  subscriptionId: string | null;
  type: string;
  title: string | null;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Amoeba Talk =====

export const TALK_CHANNEL_TYPE = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
  DIRECT: 'DIRECT',
} as const;
export type TalkChannelType = (typeof TALK_CHANNEL_TYPE)[keyof typeof TALK_CHANNEL_TYPE];

export const TALK_MEMBER_ROLE = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type TalkMemberRole = (typeof TALK_MEMBER_ROLE)[keyof typeof TALK_MEMBER_ROLE];

export const TALK_MESSAGE_TYPE = {
  TEXT: 'TEXT',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
  TRANSLATION: 'TRANSLATION',
} as const;
export type TalkMessageType = (typeof TALK_MESSAGE_TYPE)[keyof typeof TALK_MESSAGE_TYPE];

export const TALK_REACTION_TYPE = {
  LIKE: 'LIKE',
  CHECK: 'CHECK',
  PRAY: 'PRAY',
  GRIN: 'GRIN',
  LOVE: 'LOVE',
} as const;
export type TalkReactionType = (typeof TALK_REACTION_TYPE)[keyof typeof TALK_REACTION_TYPE];

export interface TalkReactionSummary {
  type: TalkReactionType;
  count: number;
  reacted: boolean;
}

export interface TalkParentMessageSummary {
  id: string;
  senderName: string;
  content: string;
  isDeleted: boolean;
}

export interface TalkChannelResponse {
  id: string;
  name: string;
  type: TalkChannelType;
  description: string | null;
  entityId: string | null;
  createdBy: string;
  createdByName: string | null;
  memberCount: number;
  unreadCount: number;
  lastMessage: TalkMessageResponse | null;
  isPinned?: boolean;
  isMuted?: boolean;
  dmPartnerUserId?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TalkChannelDetailResponse extends TalkChannelResponse {
  members: TalkChannelMemberResponse[];
}

export interface TalkChannelMemberResponse {
  id: string;
  userId: string;
  userName: string;
  role: TalkMemberRole;
  joinedAt: string;
}

export interface TalkAttachmentResponse {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
}

export interface TalkMessageResponse {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: TalkMessageType;
  parentId: string | null;
  parentMessage?: TalkParentMessageSummary | null;
  reactions?: TalkReactionSummary[];
  readCount?: number;
  attachments?: TalkAttachmentResponse[];
  mentions?: { userId: string; userName: string }[];
  isPinned?: boolean;
  pinnedAt?: string | null;
  pinnedByName?: string | null;
  isEdited?: boolean;
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TalkMessageReaderResponse {
  readers: { userId: string; userName: string; readAt: string }[];
  nonReaders: { userId: string; userName: string }[];
}

export interface TalkUnreadSummary {
  channelId: string;
  unreadCount: number;
}

// ===== Issues =====

export type IssueType = 'BUG' | 'FEATURE_REQUEST' | 'OPINION' | 'TASK' | 'OTHER';
export type IssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';
export type IssueStatus = 'OPEN' | 'APPROVED' | 'IN_PROGRESS' | 'TEST' | 'REOPEN' | 'RESOLVED' | 'CLOSED' | 'REJECTED';

export const ISSUE_VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ['APPROVED', 'REJECTED'],
  APPROVED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['TEST', 'RESOLVED'],
  TEST: ['REOPEN', 'RESOLVED'],
  REOPEN: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: ['REOPEN'],
  REJECTED: ['OPEN'],
};

export interface IssueResponse {
  issueId: string;
  entityId: string | null;
  type: IssueType;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  priority: number;
  reporterId: string;
  reporterName: string;
  assignee: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  visibility: 'PRIVATE' | 'CELL' | 'ENTITY';
  cellId: string | null;
  originalLang: string;
  githubId: string | null;
  affectedModules: string[];
  resolution: string | null;
  aiAnalysis: string | null;
  commentCount: number;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  projectManagerId: string | null;
  epicId: string | null;
  epicTitle: string | null;
  epicColor: string | null;
  componentId: string | null;
  componentTitle: string | null;
  componentColor: string | null;
  parentIssueId: string | null;
  parentIssueTitle: string | null;
  googleDriveLink: string | null;
  refNumber: string | null;
  redmineId: number | null;
  startDate: string | null;
  dueDate: string | null;
  doneRatio: number;
  resolvedAt: string | null;
  avgRating: number | null;
  ratingCount: number;
  myRating: number | null;
  createdAt: string;
  updatedAt: string;
  participants?: IssueParticipantResponse[];
}

export interface IssueParticipantResponse {
  participantId: string;
  userId: string;
  userName: string;
  role: 'PARTICIPANT' | 'FORMER_ASSIGNEE';
  createdAt: string;
}

export interface IssueCommentResponse {
  commentId: string;
  issueId: string;
  authorId: string;
  authorName: string;
  authorType: 'USER' | 'AI';
  content: string;
  issueStatus?: string;
  parentId?: string | null;
  clientVisible?: boolean;
  createdAt: string;
  reactions?: { type: string; count: number; reacted: boolean }[];
  replies?: IssueCommentResponse[];
  avgRating?: number | null;
  ratingCount?: number;
  myRating?: number | null;
}

export interface IssueStatusLogResponse {
  logId: string;
  issueId: string;
  changeType: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByName: string;
  note: string | null;
  createdAt: string;
}

// ===== Content Translation =====

export type TranslationSourceType = 'TODO' | 'MEETING_NOTE' | 'NOTICE';
export type TranslationLang = 'en' | 'ko' | 'vi';
export type TranslationMethod = 'AI' | 'HUMAN' | 'AI_EDITED';
export type TranslationStatus = 'FRESH' | 'STALE' | 'NONE';

export interface TranslationResponse {
  id: string;
  sourceType: TranslationSourceType;
  sourceId: string;
  sourceField: string;
  sourceLang: TranslationLang;
  targetLang: TranslationLang;
  content: string;
  method: TranslationMethod;
  confidence: number | null;
  isStale: boolean;
  isLocked: boolean;
  version: number;
  translatedBy: { id: string; name: string };
  lastEditedBy?: { id: string; name: string } | null;
  lastEditedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationSummary {
  lang: TranslationLang;
  status: TranslationStatus;
  title?: string;
  content?: string;
  method?: TranslationMethod;
  translatedAt?: string;
  lastEditedBy?: { id: string; name: string } | null;
}

export interface GlossaryTermResponse {
  id: string;
  termEn: string;
  termKo: string | null;
  termVi: string | null;
  category: string | null;
  context: string | null;
  createdAt: string;
}

export interface TranslationHistoryResponse {
  id: string;
  translationId: string;
  content: string;
  method: TranslationMethod;
  version: number;
  editedBy: { id: string; name: string };
  changeReason: string | null;
  createdAt: string;
}

// ============================================================
// CMS (Site Management)
// ============================================================

export const CMS_PAGE_TYPE = {
  STATIC: 'STATIC',
  BOARD: 'BOARD',
  BLOG: 'BLOG',
  SUBSCRIPTION: 'SUBSCRIPTION',
  SERVICE_INFO: 'SERVICE_INFO',
  SERVICE_APPLY: 'SERVICE_APPLY',
  PAYMENT: 'PAYMENT',
  LANDING: 'LANDING',
} as const;
export type CmsPageType = (typeof CMS_PAGE_TYPE)[keyof typeof CMS_PAGE_TYPE];

export const CMS_PAGE_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type CmsPageStatus = (typeof CMS_PAGE_STATUS)[keyof typeof CMS_PAGE_STATUS];

export const CMS_SECTION_TYPE = {
  HERO: 'HERO',
  FEATURES: 'FEATURES',
  IMAGE_TEXT: 'IMAGE_TEXT',
  TESTIMONIALS: 'TESTIMONIALS',
  FAQ: 'FAQ',
  CTA: 'CTA',
  PRICING: 'PRICING',
  CONTACT: 'CONTACT',
} as const;
export type CmsSectionType = (typeof CMS_SECTION_TYPE)[keyof typeof CMS_SECTION_TYPE];

export const CMS_MENU_TYPE = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
} as const;
export type CmsMenuType = (typeof CMS_MENU_TYPE)[keyof typeof CMS_MENU_TYPE];

export interface CmsMenuResponse {
  id: string;
  parentId: string | null;
  nameEn: string;
  nameKo: string | null;
  slug: string;
  icon: string | null;
  type: string;
  externalUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  page: {
    id: string;
    type: string;
    title: string;
    slug: string;
    status: string;
  } | null;
  children: CmsMenuResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CmsPageResponse {
  id: string;
  menuId: string;
  type: string;
  title: string;
  slug: string;
  description: string | null;
  ogImage: string | null;
  seoKeywords: string | null;
  status: string;
  publishedAt: string | null;
  publishedBy: string | null;
  currentVersion: number;
  config: Record<string, any>;
  contents: CmsPageContentResponse[];
  sections: CmsSectionResponse[];
  menu: { id: string; nameEn: string; nameKo: string | null; slug: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPageListResponse {
  id: string;
  menuId: string;
  type: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  currentVersion: number;
  menu: { nameEn: string; nameKo: string | null; slug: string; icon: string | null } | null;
  updatedAt: string;
}

export interface CmsPageContentResponse {
  id: string;
  lang: string;
  content: string | null;
  sectionsJson: Record<string, any> | null;
  updatedAt: string;
}

export interface CmsVersionResponse {
  id: string;
  version: number;
  publishedBy: string;
  publishedAt: string;
  note: string | null;
}

export interface CmsSectionResponse {
  id: string;
  pageId: string;
  type: string;
  sortOrder: number;
  config: Record<string, any>;
  contentEn: Record<string, any>;
  contentKo: Record<string, any> | null;
  isVisible: boolean;
  createdAt: string;
}

export interface CmsPostResponse {
  id: string;
  pageId: string;
  categoryId: string | null;
  title: string;
  content: string;
  authorId: string;
  isPinned: boolean;
  viewCount: number;
  featuredImage: string | null;
  tags: string | null;
  status: string;
  publishedAt: string | null;
  category: { id: string; name: string } | null;
  attachments: CmsPostAttachmentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CmsPostListResponse {
  id: string;
  pageId: string;
  title: string;
  authorId: string;
  isPinned: boolean;
  viewCount: number;
  featuredImage: string | null;
  tags: string | null;
  status: string;
  category: { id: string; name: string } | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface CmsPostAttachmentResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface CmsSubscriberResponse {
  id: string;
  pageId: string;
  email: string;
  name: string | null;
  isVerified: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

export interface CmsPostCategoryResponse {
  id: string;
  name: string;
  sortOrder: number;
}
