import { apiClient } from '@/lib/api-client';

/* ── 응답 타입 ── */

export interface MemberUnitRole {
  unitId: string;
  unitName: string;
  role: string;
  isPrimary: boolean;
}

export interface MemberCellInfo {
  cellId: string;
  cellName: string;
}

export interface MemberHrEmployee {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  status: string;
}

export interface AvailableEmployee {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  status: string;
}

export interface MemberClientInfo {
  clientId: string;
  clientCode: string;
  clientName: string;
  clientStatus: string;
}

export interface EntityMember {
  userId: string;
  email: string;
  name: string;
  role: string;
  unit: string;
  levelCode: string;
  status: string;
  joinMethod: string;
  createdAt: string;
  unitRoles: MemberUnitRole[];
  cells: MemberCellInfo[];
  hrEmployee: MemberHrEmployee | null;
  clientInfo: MemberClientInfo | null;
}

export interface EntityInvitation {
  id: string;
  email: string;
  role: string;
  unit: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface AvailableMenu {
  menuCode: string;
  label: string;
  icon: string;
  path: string;
  category: string;
}

export interface EntityMenuConfigItem {
  menuCode: string;
  label: string;
  icon: string;
  path: string;
  category: 'WORK_TOOL' | 'WORK_MODULE';
  sortOrder: number;
  visible: boolean;
  isOverridden: boolean;
}

export interface MemberPermission {
  menuCode: string;
  accessible: boolean;
}

export interface UnitInfo {
  unitName: string;
  memberCount: number;
}

export interface CellInfo {
  cellId: string;
  cellName: string;
  description: string | null;
}

export interface UnitPermission {
  id: string;
  menuCode: string;
  unitName: string;
  entityId: string;
  accessible: boolean;
}

export interface CellPermission {
  id: string;
  menuCode: string;
  celId: string;
  accessible: boolean;
}

export interface InviteMemberDto {
  email: string;
  role: string;
  department: string;
  group_id?: string;
  company_id?: string;
  auto_approve?: boolean;
  level_code?: string;
  partner_id?: string;
}

export interface UpdateMemberDto {
  role?: string;
  department?: string;
  status?: string;
}

export interface SetPermissionDto {
  permissions: { menu_code: string; accessible: boolean }[];
}

export interface SetEntityMenuConfigDto {
  configs: { menu_code: string; category: 'WORK_TOOL' | 'WORK_MODULE'; sort_order: number; visible?: boolean }[];
}

export interface EntityApiKey {
  apiKeyId: string;
  provider: string;
  name: string;
  keyLast4: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyDto {
  provider: string;
  name: string;
  api_key: string;
}

export interface UpdateApiKeyDto {
  name?: string;
  api_key?: string;
  is_active?: boolean;
}

export type DriveSettingsSource = 'own' | 'inherited' | 'global' | 'none';

export interface DriveSettings {
  configured: boolean;
  source: DriveSettingsSource;
  sourceEntityCode?: string;
  impersonateEmail: string | null;
  billingRootFolderId: string | null;
  billingRootFolderName: string | null;
  updatedAt: string | null;
}

export interface UpdateDriveDto {
  impersonate_email?: string;
  billing_root_folder_id?: string;
  billing_root_folder_name?: string;
}

export interface UsageSummary {
  daily: {
    date: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
  };
  monthly: {
    yearMonth: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
  };
  quota: {
    dailyLimit: number;
    monthlyLimit: number;
    actionOnExceed: string;
  } | null;
  warnings: {
    dailyPercent: number | null;
    monthlyPercent: number | null;
    dailyWarning: boolean;
    dailyCritical: boolean;
    monthlyWarning: boolean;
    monthlyCritical: boolean;
    monthlyRemaining: number | null;
    quotaStage: 'NORMAL' | 'CAUTION' | 'WARNING' | 'SUSPENDED';
  };
}

export interface DailyHistoryItem {
  date: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
}

export interface DailyHistoryResponse {
  yearMonth: string;
  days: DailyHistoryItem[];
}

export interface EntityQuota {
  dailyTokenLimit: number | null;
  monthlyTokenLimit: number | null;
  actionOnExceed: string;
}

export interface SetQuotaDto {
  daily_token_limit?: number;
  monthly_token_limit?: number;
  action_on_exceed?: string;
}

/* ── Entity Basic Info types ── */

export interface EntityBasicInfo {
  entId: string;
  entCode: string;
  entName: string;
  entNameEn: string | null;
  entCountry: string;
  entCurrency: string;
  entRegNo: string | null;
  entAddress: string | null;
  entRepresentative: string | null;
  entPhone: string | null;
  entEmail: string | null;
  entPayDay: number;
  entStatus: string;
  entUpdatedAt: string;
}

export interface UpdateEntityBasicDto {
  ent_name?: string;
  ent_name_en?: string;
  ent_country?: string;
  ent_currency?: string;
  ent_reg_no?: string;
  ent_address?: string;
  ent_representative?: string;
  ent_phone?: string;
  ent_email?: string;
  ent_pay_day?: number;
}

/* ── Work & Payroll types ── */

export interface WorkPayrollSettings {
  entPayDay: number;
  entPayPeriodType: string;
  entPayPeriodStart: number;
  entPayPeriodEnd: number;
  entWorkHoursPerDay: number;
  entWorkDaysPerWeek: number;
  entLeaveBaseDays: number;
}

export interface UpdateWorkPayrollDto {
  ent_pay_day?: number;
  ent_pay_period_type?: string;
  ent_pay_period_start?: number;
  ent_pay_period_end?: number;
  ent_work_hours_per_day?: number;
  ent_work_days_per_week?: number;
  ent_leave_base_days?: number;
}

/* ── AI Config types ── */

export interface AiConfigInfo {
  eacId?: string;
  eacUseSharedKey: boolean;
  eacDailyTokenLimit: number;
  eacMonthlyTokenLimit: number;
  eacIsActive: boolean;
  hasApiKey: boolean;
}

export interface SaveAiConfigDto {
  use_shared_key?: boolean;
  api_key?: string;
  daily_token_limit?: number;
  monthly_token_limit?: number;
  is_active?: boolean;
}

/* ── Organization types ── */

export interface OrgUnit {
  unitId: string;
  name: string;
  nameLocal: string | null;
  parentId: string | null;
  level: number;
  isActive: boolean;
  sortOrder: number;
  entityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrgUnitDto {
  name: string;
  name_local?: string;
  parent_id?: string;
  level?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateOrgUnitDto {
  name?: string;
  name_local?: string;
  parent_id?: string;
  level?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface OrgCell {
  cellId: string;
  name: string;
  description: string | null;
  entityId: string | null;
  entityName: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrgCellDto {
  name: string;
  description?: string;
  entity_id?: string;
}

export interface UpdateOrgCellDto {
  name?: string;
  description?: string;
}

/* ── Custom App types ── */

export interface CustomApp {
  id: string;
  entityId: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  url: string;
  authMode: 'jwt' | 'none' | 'api_key';
  openMode: 'iframe' | 'new_tab';
  apiKeyMasked?: string;
  allowedRoles: string[] | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomAppDto {
  code: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  auth_mode?: 'jwt' | 'none' | 'api_key';
  open_mode?: 'iframe' | 'new_tab';
  api_key?: string;
  allowed_roles?: string[];
  sort_order?: number;
}

export interface UpdateCustomAppDto {
  name?: string;
  description?: string;
  icon?: string;
  url?: string;
  auth_mode?: 'jwt' | 'none' | 'api_key';
  open_mode?: 'iframe' | 'new_tab';
  api_key?: string;
  allowed_roles?: string[];
  sort_order?: number;
  is_active?: boolean;
}

export interface AppTokenResponse {
  token: string | null;
  apiKey?: string;
  expiresAt: string;
}

export interface AppHealthCheckResponse {
  success: boolean;
  status: number;
  url: string;
  error?: string;
}

/* ── App Store types ── */

export interface AppStoreApp {
  appSlug: string;
  appName: string;
  appNameEn: string | null;
  appStatus: 'ACTIVE' | 'COMING_SOON';
  appIconUrl: string | null;
  subscription: {
    subId: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    requestedAt: string;
    approvedAt: string | null;
    expiresAt: string | null;
  } | null;
}

/* ── Work Statistics types ── */

export interface WorkStatsOverview {
  totalMembers: number;
  loginCount: number;
  todosCreated: number;
  todosCompleted: number;
  issuesCreated: number;
  issuesResolved: number;
  meetingNotesCreated: number;
  commentsCount: number;
  aiRequests: number;
  aiTokens: number;
}

export interface WorkStatsMember {
  userId: string;
  name: string;
  email: string;
  unit: string;
  lastLoginAt: string | null;
  loginCount: number;
  todosCreated: number;
  todosCompleted: number;
  issuesCreated: number;
  issuesResolved: number;
  meetingNotesCreated: number;
  commentsCount: number;
  talkMessages: number;
  aiRequests: number;
  aiTokens: number;
}

export interface WorkStatsLoginEntry {
  id: string;
  userId: string;
  name: string;
  email: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface WorkStatsApiUsage {
  userId: string;
  name: string;
  email: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface WorkStatsMenuUsage {
  menuCode: string;
  visits: number;
  uniqueUsers: number;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

/* ── 서비스 ── */

class EntitySettingsApiService {
  private readonly base = '/entity-settings';

  /* ── Members ── */

  getMembers = () =>
    apiClient
      .get<ListResponse<EntityMember>>(`${this.base}/members`)
      .then((r) => r.data.data);

  inviteMember = (dto: InviteMemberDto) =>
    apiClient
      .post<SingleResponse<unknown>>(`${this.base}/members/invite`, dto)
      .then((r) => r.data.data);

  updateMember = (userId: string, dto: UpdateMemberDto) =>
    apiClient
      .patch<SingleResponse<EntityMember>>(`${this.base}/members/${userId}`, dto)
      .then((r) => r.data.data);

  changeMemberUnit = (userId: string, unitId: string) =>
    apiClient
      .put<SingleResponse<{ unitId: string; unitName: string }>>(`${this.base}/members/${userId}/unit`, { unit_id: unitId })
      .then((r) => r.data.data);

  addMemberCell = (userId: string, cellId: string) =>
    apiClient
      .post<SingleResponse<{ cellId: string }>>(`${this.base}/members/${userId}/cells`, { cell_id: cellId })
      .then((r) => r.data.data);

  removeMemberCell = (userId: string, cellId: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/members/${userId}/cells/${cellId}`)
      .then((r) => r.data.data);

  /* ── HR Employee ── */

  getAvailableEmployees = (userId: string) =>
    apiClient
      .get<ListResponse<AvailableEmployee>>(`${this.base}/members/${userId}/available-employees`)
      .then((r) => r.data.data);

  linkEmployee = (userId: string, employeeId: string) =>
    apiClient
      .patch<SingleResponse<MemberHrEmployee>>(`${this.base}/members/${userId}/link-employee`, { employee_id: employeeId })
      .then((r) => r.data.data);

  unlinkEmployee = (userId: string) =>
    apiClient
      .patch<SingleResponse<unknown>>(`${this.base}/members/${userId}/unlink-employee`)
      .then((r) => r.data.data);

  /* ── Invitations ── */

  getInvitations = () =>
    apiClient
      .get<ListResponse<EntityInvitation>>(`${this.base}/invitations`)
      .then((r) => r.data.data);

  cancelInvitation = (id: string) =>
    apiClient
      .patch<SingleResponse<unknown>>(`${this.base}/invitations/${id}/cancel`)
      .then((r) => r.data.data);

  resendInvitation = (id: string) =>
    apiClient
      .post<SingleResponse<unknown>>(`${this.base}/invitations/${id}/resend`)
      .then((r) => r.data.data);

  removeMember = (userId: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/members/${userId}`)
      .then((r) => r.data.data);

  resetMemberPassword = (userId: string, mode: 'email' | 'generate' = 'email') =>
    apiClient
      .post<SingleResponse<{ userId: string; emailSent: boolean; tempPassword?: string }>>(
        `${this.base}/members/${userId}/reset-password`,
        { mode },
      )
      .then((r) => r.data.data);

  deleteInvitation = (id: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/invitations/${id}`)
      .then((r) => r.data.data);

  /* ── Permissions ── */

  getAvailableMenus = () =>
    apiClient
      .get<ListResponse<AvailableMenu>>(`${this.base}/permissions/available-menus`)
      .then((r) => r.data.data);

  getEntityMenuConfigs = () =>
    apiClient
      .get<ListResponse<EntityMenuConfigItem>>(`${this.base}/permissions/menu-config`)
      .then((r) => r.data.data);

  setEntityMenuConfigs = (dto: SetEntityMenuConfigDto) =>
    apiClient
      .put<ListResponse<EntityMenuConfigItem>>(`${this.base}/permissions/menu-config`, dto)
      .then((r) => r.data.data);

  resetEntityMenuConfigs = () =>
    apiClient
      .delete<SingleResponse<{ entityId: string; reset: boolean }>>(`${this.base}/permissions/menu-config`)
      .then((r) => r.data.data);

  // Unit permissions
  getUnits = () =>
    apiClient
      .get<ListResponse<UnitInfo>>(`${this.base}/permissions/units`)
      .then((r) => r.data.data);

  getUnitPermissions = (unitName: string) =>
    apiClient
      .get<ListResponse<UnitPermission>>(`${this.base}/permissions/units/${encodeURIComponent(unitName)}`)
      .then((r) => r.data.data);

  setUnitPermissions = (unitName: string, dto: SetPermissionDto) =>
    apiClient
      .put<SingleResponse<unknown>>(`${this.base}/permissions/units/${encodeURIComponent(unitName)}`, dto)
      .then((r) => r.data.data);

  // Cell permissions
  getCells = () =>
    apiClient
      .get<ListResponse<CellInfo>>(`${this.base}/permissions/cells`)
      .then((r) => r.data.data);

  getCellPermissions = (cellId: string) =>
    apiClient
      .get<ListResponse<CellPermission>>(`${this.base}/permissions/cells/${cellId}`)
      .then((r) => r.data.data);

  setCellPermissions = (cellId: string, dto: SetPermissionDto) =>
    apiClient
      .put<SingleResponse<unknown>>(`${this.base}/permissions/cells/${cellId}`, dto)
      .then((r) => r.data.data);

  // Individual permissions
  getMemberPermissions = (userId: string) =>
    apiClient
      .get<ListResponse<MemberPermission>>(`${this.base}/permissions/users/${userId}`)
      .then((r) => r.data.data);

  setMemberPermissions = (userId: string, dto: SetPermissionDto) =>
    apiClient
      .put<SingleResponse<unknown>>(`${this.base}/permissions/users/${userId}`, dto)
      .then((r) => r.data.data);

  removeMemberPermission = (userId: string, menuCode: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/permissions/users/${userId}/${menuCode}`)
      .then((r) => r.data.data);

  /* ── API Keys ── */

  getApiKeys = () =>
    apiClient
      .get<ListResponse<EntityApiKey>>(`${this.base}/api-keys`)
      .then((r) => r.data.data);

  createApiKey = (dto: CreateApiKeyDto) =>
    apiClient
      .post<SingleResponse<EntityApiKey>>(`${this.base}/api-keys`, dto)
      .then((r) => r.data.data);

  updateApiKey = (id: string, dto: UpdateApiKeyDto) =>
    apiClient
      .patch<SingleResponse<EntityApiKey>>(`${this.base}/api-keys/${id}`, dto)
      .then((r) => r.data.data);

  deleteApiKey = (id: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/api-keys/${id}`)
      .then((r) => r.data.data);

  /* ── Drive ── */

  getDriveSettings = () =>
    apiClient
      .get<SingleResponse<DriveSettings>>(`${this.base}/drive`)
      .then((r) => r.data.data);

  updateDriveSettings = (dto: UpdateDriveDto) =>
    apiClient
      .put<SingleResponse<DriveSettings>>(`${this.base}/drive`, dto)
      .then((r) => r.data.data);

  testDriveConnection = () =>
    apiClient
      .post<SingleResponse<{ success: boolean; message: string; folderName?: string }>>(`${this.base}/drive/test`)
      .then((r) => r.data.data);

  deleteDriveSettings = () =>
    apiClient
      .delete<SingleResponse<DriveSettings>>(`${this.base}/drive`)
      .then((r) => r.data.data);

  /* ── Entity Basic Info ── */

  getEntityBasicInfo = () =>
    apiClient
      .get<SingleResponse<EntityBasicInfo>>(`${this.base}/organization/basic`)
      .then((r) => r.data.data);

  updateEntityBasicInfo = (dto: UpdateEntityBasicDto) =>
    apiClient
      .patch<SingleResponse<EntityBasicInfo>>(`${this.base}/organization/basic`, dto)
      .then((r) => r.data.data);

  /* ── Work & Payroll ── */

  getWorkPayroll = () =>
    apiClient
      .get<SingleResponse<WorkPayrollSettings>>(`${this.base}/organization/work-payroll`)
      .then((r) => r.data.data);

  updateWorkPayroll = (dto: UpdateWorkPayrollDto) =>
    apiClient
      .patch<SingleResponse<WorkPayrollSettings>>(`${this.base}/organization/work-payroll`, dto)
      .then((r) => r.data.data);

  /* ── AI Config ── */

  getAiConfig = () =>
    apiClient
      .get<SingleResponse<AiConfigInfo>>(`${this.base}/organization/ai-config`)
      .then((r) => r.data.data);

  saveAiConfig = (dto: SaveAiConfigDto) =>
    apiClient
      .put<SingleResponse<AiConfigInfo>>(`${this.base}/organization/ai-config`, dto)
      .then((r) => r.data.data);

  /* ── Organization (Units / Cells) ── */

  getOrgUnits = () =>
    apiClient
      .get<ListResponse<OrgUnit>>(`${this.base}/organization/units`)
      .then((r) => r.data.data);

  createOrgUnit = (data: CreateOrgUnitDto) =>
    apiClient
      .post<SingleResponse<OrgUnit>>(`${this.base}/organization/units`, data)
      .then((r) => r.data.data);

  updateOrgUnit = (id: string, data: UpdateOrgUnitDto) =>
    apiClient
      .put<SingleResponse<OrgUnit>>(`${this.base}/organization/units/${id}`, data)
      .then((r) => r.data.data);

  deleteOrgUnit = (id: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/organization/units/${id}`)
      .then((r) => r.data.data);

  getOrgCells = () =>
    apiClient
      .get<ListResponse<OrgCell>>(`${this.base}/organization/cells`)
      .then((r) => r.data.data);

  createOrgCell = (data: CreateOrgCellDto) =>
    apiClient
      .post<SingleResponse<OrgCell>>(`${this.base}/organization/cells`, data)
      .then((r) => r.data.data);

  updateOrgCell = (id: string, data: UpdateOrgCellDto) =>
    apiClient
      .patch<SingleResponse<OrgCell>>(`${this.base}/organization/cells/${id}`, data)
      .then((r) => r.data.data);

  deleteOrgCell = (id: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/organization/cells/${id}`)
      .then((r) => r.data.data);

  /* ── Work Statistics ── */

  getWorkStatsOverview = (startDate: string, endDate: string) =>
    apiClient
      .get<SingleResponse<WorkStatsOverview>>(`${this.base}/work-statistics/overview`, {
        params: { start_date: startDate, end_date: endDate },
      })
      .then((r) => r.data.data);

  getWorkStatsMembers = (startDate: string, endDate: string) =>
    apiClient
      .get<ListResponse<WorkStatsMember>>(`${this.base}/work-statistics/members`, {
        params: { start_date: startDate, end_date: endDate },
      })
      .then((r) => r.data.data);

  getWorkStatsLoginHistory = (startDate: string, endDate: string) =>
    apiClient
      .get<ListResponse<WorkStatsLoginEntry>>(`${this.base}/work-statistics/login-history`, {
        params: { start_date: startDate, end_date: endDate },
      })
      .then((r) => r.data.data);

  getWorkStatsApiUsage = (startDate: string, endDate: string) =>
    apiClient
      .get<ListResponse<WorkStatsApiUsage>>(`${this.base}/work-statistics/api-usage`, {
        params: { start_date: startDate, end_date: endDate },
      })
      .then((r) => r.data.data);

  getWorkStatsMenuUsage = (startDate: string, endDate: string) =>
    apiClient
      .get<ListResponse<WorkStatsMenuUsage>>(`${this.base}/work-statistics/menu-usage`, {
        params: { start_date: startDate, end_date: endDate },
      })
      .then((r) => r.data.data);

  /* ── Custom Apps ── */

  getCustomApps = (entityId?: string) =>
    apiClient
      .get<ListResponse<CustomApp>>(`${this.base}/custom-apps`, {
        params: entityId ? { entity_id: entityId } : undefined,
      })
      .then((r) => r.data.data);

  getMyCustomApps = () =>
    apiClient
      .get<ListResponse<CustomApp>>(`${this.base}/custom-apps/my`)
      .then((r) => r.data.data);

  createCustomApp = (dto: CreateCustomAppDto, entityId?: string) =>
    apiClient
      .post<SingleResponse<CustomApp>>(`${this.base}/custom-apps`, dto, {
        params: entityId ? { entity_id: entityId } : undefined,
      })
      .then((r) => r.data.data);

  updateCustomApp = (id: string, dto: UpdateCustomAppDto, entityId?: string) =>
    apiClient
      .patch<SingleResponse<CustomApp>>(`${this.base}/custom-apps/${id}`, dto, {
        params: entityId ? { entity_id: entityId } : undefined,
      })
      .then((r) => r.data.data);

  deleteCustomApp = (id: string, entityId?: string) =>
    apiClient
      .delete<SingleResponse<unknown>>(`${this.base}/custom-apps/${id}`, {
        params: entityId ? { entity_id: entityId } : undefined,
      })
      .then((r) => r.data.data);

  healthCheckApp = (id: string, entityId?: string) =>
    apiClient
      .post<SingleResponse<AppHealthCheckResponse>>(`${this.base}/custom-apps/${id}/health`, null, {
        params: entityId ? { entity_id: entityId } : undefined,
      })
      .then((r) => r.data.data);

  getAppToken = (id: string) =>
    apiClient
      .post<SingleResponse<AppTokenResponse>>(`${this.base}/custom-apps/${id}/token`)
      .then((r) => r.data.data);

  /* ── App Store ── */

  getAppStoreSubscriptions = (entityId?: string) =>
    apiClient
      .get<ListResponse<AppStoreApp>>(`${this.base}/app-store/subscriptions`, {
        params: entityId ? { entity_id: entityId } : undefined,
      })
      .then((r) => r.data.data);

  /* ── Usage ── */

  getUsageSummary = () =>
    apiClient
      .get<SingleResponse<UsageSummary>>(`${this.base}/usage`)
      .then((r) => r.data.data);

  getMonthlyUsage = (yearMonth?: string) =>
    apiClient
      .get<SingleResponse<unknown>>(`${this.base}/usage/monthly`, {
        params: yearMonth ? { year_month: yearMonth } : undefined,
      })
      .then((r) => r.data.data);

  getDailyHistory = (yearMonth?: string) =>
    apiClient
      .get<SingleResponse<DailyHistoryResponse>>(`${this.base}/usage/daily-history`, {
        params: yearMonth ? { year_month: yearMonth } : undefined,
      })
      .then((r) => r.data.data);

  getQuota = () =>
    apiClient
      .get<SingleResponse<EntityQuota | null>>(`${this.base}/quota`)
      .then((r) => r.data.data);

  setQuota = (dto: SetQuotaDto) =>
    apiClient
      .put<SingleResponse<unknown>>(`${this.base}/quota`, dto)
      .then((r) => r.data.data);
}

export const entitySettingsService = new EntitySettingsApiService();
