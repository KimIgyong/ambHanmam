import { apiClient } from '@/lib/api-client';

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  entity_id?: string;
  status?: string;
  role?: string;
}

export interface AdminUserItem {
  userId: string;
  email: string;
  name: string;
  role: string;
  levelCode: string;
  status: string;
  unit: string;
  companyId: string | null;
  companyName: string | null;
  joinMethod: string;
  createdAt: string;
}

export interface AdminEntityUserRole {
  eurId: string;
  entityId: string;
  entityCode: string;
  entityName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AdminUnitUserRole {
  uurId: string;
  unitId: string;
  unitName: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isPrimary: boolean;
  entityCode: string;
  entityName: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EntityManagementItem {
  entityId: string;
  entityCode: string;
  entityName: string;
  entityNameEn: string;
  level: string;
  status: string;
  masterUser: { userId: string; name: string; email: string } | null;
  memberCount: number;
  createdAt: string;
}

export interface EntityDetail {
  entityId: string;
  entityCode: string;
  entityName: string;
  entityNameEn: string;
  country: string;
  currency: string;
  regNo: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  level: string;
  parentEntityName: string | null;
  isHq: boolean;
  createdAt: string;
  updatedAt: string;
  members: {
    total: number;
    byRole: Record<string, number>;
    masterUser: { userId: string; name: string; email: string } | null;
  };
  organization: { unitCount: number; cellCount: number };
}

export interface EntityServiceUsage {
  client: { clientId: string; clientCode: string; companyName: string; status: string } | null;
  subscriptions: {
    subscriptionId: string;
    serviceName: string;
    serviceCode: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string | null;
    price: number | null;
    currency: string;
    maxUsers: number | null;
    actualUsers: number;
  }[];
}

export interface EntityAiUsage {
  summary: {
    daily: { totalTokens: number; inputTokens: number; outputTokens: number; requestCount: number };
    monthly: { totalTokens: number; inputTokens: number; outputTokens: number; requestCount: number };
    quota: { dailyLimit: number; monthlyLimit: number; actionOnExceed: string } | null;
    warnings: { monthlyPercent: number | null; quotaStage: string };
  };
  topUsers: { userId: string; userName: string; userEmail: string; totalTokens: number; requestCount: number }[];
}

class AdminServiceClass {
  private readonly basePath = '/admin';

  getUsers(params: AdminUserQuery = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<AdminUserItem> }>(
        `${this.basePath}/users`,
        { params },
      )
      .then((r) => r.data.data);
  }

  getEntityUserRoles(params: { page?: number; limit?: number; search?: string; entity_id?: string } = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<AdminEntityUserRole> }>(
        `${this.basePath}/entity-user-roles`,
        { params },
      )
      .then((r) => r.data.data);
  }

  getUnitUserRoles(params: { page?: number; limit?: number; search?: string; unit_id?: string } = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<AdminUnitUserRole> }>(
        `${this.basePath}/unit-user-roles`,
        { params },
      )
      .then((r) => r.data.data);
  }

  deleteUnitUserRole(uurId: string) {
    return apiClient.delete(`${this.basePath}/unit-user-roles/${uurId}`);
  }

  getEntities(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<EntityManagementItem> }>(
        `${this.basePath}/entities`,
        { params },
      )
      .then((r) => r.data.data);
  }

  getEntityDetail(entityId: string) {
    return apiClient
      .get<{ success: boolean; data: EntityDetail }>(`${this.basePath}/entities/${entityId}`)
      .then((r) => r.data.data);
  }

  getEntityServiceUsage(entityId: string) {
    return apiClient
      .get<{ success: boolean; data: EntityServiceUsage }>(`${this.basePath}/entities/${entityId}/service-usage`)
      .then((r) => r.data.data);
  }

  getEntityAiUsage(entityId: string) {
    return apiClient
      .get<{ success: boolean; data: EntityAiUsage }>(`${this.basePath}/entities/${entityId}/ai-usage`)
      .then((r) => r.data.data);
  }

  updateEntity(entityId: string, data: UpdateEntityBody) {
    return apiClient
      .patch<{ success: boolean; data: EntityDetail }>(`${this.basePath}/entities/${entityId}`, data)
      .then((r) => r.data.data);
  }

  getEntityMembers(entityId: string) {
    return apiClient
      .get<{ success: boolean; data: EntityMember[] }>(`${this.basePath}/entities/${entityId}/members`)
      .then((r) => r.data.data);
  }

  getEntitiesDriveSettings() {
    return apiClient
      .get<{ success: boolean; data: EntityDriveSettingsItem[] }>(`${this.basePath}/entities-drive-settings`)
      .then((r) => r.data.data);
  }

  updateEntityDriveSettings(entityId: string, data: UpdateEntityDriveBody) {
    return apiClient
      .put<{ success: boolean; data: unknown }>(`${this.basePath}/entities/${entityId}/drive-settings`, data)
      .then((r) => r.data.data);
  }

  deleteEntityDriveSettings(entityId: string) {
    return apiClient
      .delete<{ success: boolean; data: unknown }>(`${this.basePath}/entities/${entityId}/drive-settings`)
      .then((r) => r.data.data);
  }

  getEntitiesAiConfigs() {
    return apiClient
      .get<{ success: boolean; data: EntityAiConfigItem[] }>(`${this.basePath}/entities-ai-configs`)
      .then((r) => r.data.data);
  }

  updateEntityAiConfig(entityId: string, data: UpdateEntityAiConfigBody) {
    return apiClient
      .put<{ success: boolean; data: unknown }>(`${this.basePath}/entities/${entityId}/ai-config`, data)
      .then((r) => r.data.data);
  }

  /* ── Admin Users ── */

  getAdminUsers(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<AdminUserListItem> }>(
        `${this.basePath}/admin-users`,
        { params },
      )
      .then((r) => r.data.data);
  }

  getAdminUser(id: string) {
    return apiClient
      .get<{ success: boolean; data: AdminUserListItem }>(`${this.basePath}/admin-users/${id}`)
      .then((r) => r.data.data);
  }

  createAdminUser(data: CreateAdminUserBody) {
    return apiClient
      .post<{ success: boolean; data: unknown }>(`${this.basePath}/admin-users`, data)
      .then((r) => r.data.data);
  }

  updateAdminUser(id: string, data: UpdateAdminUserBody) {
    return apiClient
      .patch<{ success: boolean; data: AdminUserListItem }>(`${this.basePath}/admin-users/${id}`, data)
      .then((r) => r.data.data);
  }

  resetAdminPassword(id: string) {
    return apiClient
      .post<{ success: boolean; data: { tempPassword: string } }>(`${this.basePath}/admin-users/${id}/reset-password`)
      .then((r) => r.data.data);
  }

  deleteAdminUser(id: string) {
    return apiClient.delete(`${this.basePath}/admin-users/${id}`);
  }

  /* ── Partner Users ── */

  getPartnerUsers(params: { page?: number; limit?: number; search?: string; status?: string; partner_id?: string } = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<PartnerUserListItem> }>(
        `${this.basePath}/partner-users`,
        { params },
      )
      .then((r) => r.data.data);
  }

  getPartnerUser(id: string) {
    return apiClient
      .get<{ success: boolean; data: PartnerUserListItem }>(`${this.basePath}/partner-users/${id}`)
      .then((r) => r.data.data);
  }

  updatePartnerUser(id: string, data: UpdatePartnerUserBody) {
    return apiClient
      .patch<{ success: boolean; data: PartnerUserListItem }>(`${this.basePath}/partner-users/${id}`, data)
      .then((r) => r.data.data);
  }

  resetPartnerPassword(id: string) {
    return apiClient
      .post<{ success: boolean; data: { tempPassword: string } }>(`${this.basePath}/partner-users/${id}/reset-password`)
      .then((r) => r.data.data);
  }

  deletePartnerUser(id: string) {
    return apiClient.delete(`${this.basePath}/partner-users/${id}`);
  }

  /* ── Partner Invitations ── */

  getPartnerInvitations(params: { page?: number; limit?: number; search?: string; status?: string; partner_id?: string } = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<PartnerInvitationItem> }>(
        `${this.basePath}/partner-invitations`,
        { params },
      )
      .then((r) => r.data.data);
  }

  resendPartnerInvitation(id: string) {
    return apiClient
      .post<{ success: boolean }>(`${this.basePath}/partner-invitations/${id}/resend`)
      .then((r) => r.data);
  }

  cancelPartnerInvitation(id: string) {
    return apiClient
      .post<{ success: boolean }>(`${this.basePath}/partner-invitations/${id}/cancel`)
      .then((r) => r.data);
  }

  /* ── User Deletion Preview & Permanent Delete ── */

  getUserDeletionPreview(userId: string) {
    return apiClient
      .get<{ success: boolean; data: UserDeletionPreview }>(`${this.basePath}/users/${userId}/deletion-preview`)
      .then((r) => r.data.data);
  }

  permanentDeleteUser(userId: string, data: { level: 1 | 2; confirm_email: string }) {
    return apiClient
      .delete<{ success: boolean; data: PermanentDeleteResult }>(`${this.basePath}/users/${userId}/permanent`, { data })
      .then((r) => r.data.data);
  }

  /* ── Site Error Logs ── */

  getSiteErrors(params: {
    source?: string;
    app?: string;
    usr_level?: string;
    status?: string;
    http_status?: string;
    error_code?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  } = {}) {
    return apiClient
      .get<{ success: boolean; data: SiteErrorPaginatedResponse }>('/site-errors', { params })
      .then((r) => r.data.data);
  }

  getSiteErrorStats() {
    return apiClient
      .get<{ success: boolean; data: SiteErrorStats }>('/site-errors/stats')
      .then((r) => r.data.data);
  }

  updateSiteErrorStatus(id: string, status: string) {
    return apiClient
      .patch<{ success: boolean; data: SiteErrorItem }>(`/site-errors/${id}/status`, { status })
      .then((r) => r.data.data);
  }

  getErrorCodeReference() {
    return apiClient
      .get<{ success: boolean; data: ErrorCodeEntry[] }>('/site-errors/error-codes')
      .then((r) => r.data.data);
  }
}

export interface UpdateEntityBody {
  name?: string;
  name_en?: string;
  country?: string;
  currency?: string;
  registration_no?: string;
  address?: string;
  representative?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface EntityMember {
  eurId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userStatus: string;
  role: string;
  createdAt: string;
}

export interface EntityDriveSettingsItem {
  entityId: string;
  entityCode: string;
  entityName: string;
  entityNameEn: string;
  level: string;
  status: string;
  drive: {
    configured: boolean;
    source: 'own' | 'inherited' | 'global' | 'none';
    sourceEntityCode?: string;
    impersonateEmail: string | null;
    billingRootFolderId: string | null;
    billingRootFolderName: string | null;
    updatedAt: string | null;
  };
}

export interface UpdateEntityDriveBody {
  impersonate_email?: string;
  billing_root_folder_id?: string;
  billing_root_folder_name?: string;
}

export interface EntityAiConfigItem {
  entityId: string;
  entityCode: string;
  entityName: string;
  entityNameEn: string;
  level: string;
  status: string;
  aiConfig: {
    configId: string;
    provider: string;
    useSharedKey: boolean;
    hasApiKey: boolean;
    dailyTokenLimit: number;
    monthlyTokenLimit: number;
    isActive: boolean;
    updatedAt: string | null;
  } | null;
}

export interface UpdateEntityAiConfigBody {
  provider?: string;
  use_shared_key?: boolean;
  daily_token_limit?: number;
  monthly_token_limit?: number;
  is_active?: boolean;
}

/* ── Admin User types ── */

export interface AdminUserListItem {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateAdminUserBody {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface UpdateAdminUserBody {
  role?: 'ADMIN' | 'SUPER_ADMIN';
  status?: 'ACTIVE' | 'INACTIVE';
  name?: string;
}

/* ── Partner User types ── */

export interface PartnerUserListItem {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  partnerId: string | null;
  partnerName: string | null;
  partnerCode: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UpdatePartnerUserBody {
  role?: 'PARTNER_ADMIN' | 'PARTNER_MEMBER';
  status?: 'ACTIVE' | 'INACTIVE';
  partner_id?: string;
  name?: string;
}

/* ── Partner Invitation types ── */

export interface PartnerInvitationItem {
  invitationId: string;
  email: string;
  role: string;
  status: string;
  partnerId: string | null;
  partnerName: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  sendCount: number;
  lastSentAt: string | null;
  createdAt: string;
}

/* ── Site Error Log types ── */

export interface SiteErrorItem {
  selId: string;
  selSource: string;
  selApp: string;
  selUsrId: string | null;
  selUsrEmail: string | null;
  selUsrLevel: string | null;
  selEntId: string | null;
  selPageUrl: string | null;
  selApiEndpoint: string | null;
  selHttpMethod: string | null;
  selHttpStatus: number | null;
  selErrorCode: string | null;
  selErrorMessage: string;
  selStackTrace: string | null;
  selUserAgent: string | null;
  selIpAddress: string | null;
  selStatus: string;
  selResolvedBy: string | null;
  selResolvedAt: string | null;
  selCreatedAt: string;
}

export interface SiteErrorPaginatedResponse {
  items: SiteErrorItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SiteErrorStats {
  todayCount: number;
  weekCount: number;
  openCount: number;
  bySource: { source: string; count: string }[];
  byLevel: { level: string; count: string }[];
}

export interface ErrorCodeEntry {
  key: string;
  code: string;
  message: string;
  httpStatus: number;
  category: string;
}

/* ── User Deletion Preview types ── */

export interface UserDeletionPreview {
  user: {
    usrId: string;
    usrEmail: string;
    usrName: string;
    usrRole: string;
    usrLevelCode: string;
    usrStatus: string;
    companyName: string | null;
    isSoftDeleted: boolean;
  };
  counts: {
    entityRoles: number;
    unitRoles: number;
    conversations: number;
    talkChannels: number;
    talkMessages: number;
    todos: number;
    todoParticipants: number;
    workItems: number;
    calendars: number;
    calendarParticipants: number;
    meetingNotes: number;
    meetingNoteFolders: number;
    workReports: number;
    dailyMissions: number;
    attendances: number;
    notifications: number;
    notices: number;
    noticeReads: number;
    pushSubscriptions: number;
    loginHistories: number;
    pageViews: number;
    aiTokenUsages: number;
    pgTransactions: number;
    aiQuotaTopups: number;
  };
  warnings: {
    isSuperAdmin: boolean;
    hasActiveSubscriptions: boolean;
  };
}

export interface PermanentDeleteResult {
  deletedUserId: string;
  deletedEmail: string;
  level: number;
}

export const adminService = new AdminServiceClass();
