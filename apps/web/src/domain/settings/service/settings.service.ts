import { apiClient } from '@/lib/api-client';
import {
  ApiKeyResponse,
  SmtpSettingsResponse,
  SiteSettingsResponse,
  MenuPermissionResponse,
  MenuConfigResponse,
  UserMenuPermissionResponse,
  MyMenuItemResponse,
  BaseSingleResponse,
} from '@amb/types';

interface ApiKeyListResponse {
  success: boolean;
  data: ApiKeyResponse[];
  timestamp: string;
}

class SettingsService {
  private readonly basePath = '/settings/api-keys';

  getApiKeys = () =>
    apiClient
      .get<ApiKeyListResponse>(this.basePath)
      .then((r) => r.data.data);

  createApiKey = (data: { provider: string; name: string; api_key: string }) =>
    apiClient
      .post<BaseSingleResponse<ApiKeyResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateApiKey = (id: string, data: { name?: string; api_key?: string; is_active?: boolean }) =>
    apiClient
      .patch<BaseSingleResponse<ApiKeyResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteApiKey = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  testApiKey = (id: string) =>
    apiClient
      .post<BaseSingleResponse<{ success: boolean; message: string }>>(
        `${this.basePath}/${id}/test`,
      )
      .then((r) => r.data.data);

  // SMTP Settings
  getSmtpSettings = () =>
    apiClient
      .get<BaseSingleResponse<SmtpSettingsResponse>>('/settings/smtp')
      .then((r) => r.data.data);

  updateSmtpSettings = (data: {
    host: string;
    port: number;
    user: string;
    pass?: string;
    from: string;
    secure: boolean;
  }) =>
    apiClient
      .put<BaseSingleResponse<SmtpSettingsResponse>>('/settings/smtp', data)
      .then((r) => r.data.data);

  testSmtpConnection = (data: {
    host: string;
    port: number;
    user: string;
    pass?: string;
    from: string;
    secure: boolean;
  }) =>
    apiClient
      .post<BaseSingleResponse<{ success: boolean; message: string }>>(
        '/settings/smtp/test',
        data,
      )
      .then((r) => r.data.data);

  // Menu Permissions (role-based)
  getMenuPermissions = () =>
    apiClient
      .get<BaseSingleResponse<MenuPermissionResponse[]>>('/settings/permissions')
      .then((r) => r.data.data);

  updateMenuPermissions = (data: {
    permissions: Array<{ menu_code: string; role: string; accessible: boolean }>;
  }) =>
    apiClient
      .put<BaseSingleResponse<MenuPermissionResponse[]>>('/settings/permissions', data)
      .then((r) => r.data.data);

  getMyMenus = () =>
    apiClient
      .get<BaseSingleResponse<MyMenuItemResponse[]>>('/settings/permissions/me')
      .then((r) => r.data.data);

  // Menu Config (sort order / enabled)
  getMenuConfigs = () =>
    apiClient
      .get<BaseSingleResponse<MenuConfigResponse[]>>('/settings/menu-config')
      .then((r) => r.data.data);

  updateMenuConfigs = (data: {
    configs: Array<{ menu_code: string; enabled: boolean; sort_order: number }>;
  }) =>
    apiClient
      .put<BaseSingleResponse<MenuConfigResponse[]>>('/settings/menu-config', data)
      .then((r) => r.data.data);

  patchMenuConfig = (menuCode: string, data: { enabled?: boolean; sort_order?: number }) =>
    apiClient
      .patch<BaseSingleResponse<MenuConfigResponse>>(`/settings/menu-config/${menuCode}`, data)
      .then((r) => r.data.data);

  // User-specific Permissions
  getAllUserPermissions = () =>
    apiClient
      .get<BaseSingleResponse<UserMenuPermissionResponse[]>>('/settings/permissions/users')
      .then((r) => r.data.data);

  getUserPermissions = (userId: string) =>
    apiClient
      .get<BaseSingleResponse<UserMenuPermissionResponse[]>>(`/settings/permissions/users/${userId}`)
      .then((r) => r.data.data);

  setUserPermissions = (userId: string, data: {
    permissions: Array<{ menu_code: string; accessible: boolean }>;
  }) =>
    apiClient
      .put<BaseSingleResponse<UserMenuPermissionResponse[]>>(`/settings/permissions/users/${userId}`, data)
      .then((r) => r.data.data);

  removeUserPermission = (userId: string, menuCode: string) =>
    apiClient
      .delete(`/settings/permissions/users/${userId}/${menuCode}`);

  // Menu-Cell Permissions
  getMenuGroupPermissions = () =>
    apiClient
      .get<BaseSingleResponse<Array<{ id: string; menuCode: string; celId: string; accessible: boolean }>>>('/settings/permissions/cells')
      .then((r) => r.data.data ?? []);

  updateMenuGroupPermissions = (data: {
    permissions: Array<{ menu_code: string; cel_id: string; accessible: boolean }>;
  }) =>
    apiClient
      .put<BaseSingleResponse<Array<{ id: string; menuCode: string; celId: string; accessible: boolean }>>>('/settings/permissions/cells', data)
      .then((r) => r.data.data ?? []);

  // Mail Account Management (Admin)
  getMailAccounts = (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient
      .get<BaseSingleResponse<unknown>>('/mail/admin/accounts', { params })
      .then((r) => r.data);

  createMailAccount = (data: { user_id: string; email: string; display_name?: string }) =>
    apiClient
      .post<BaseSingleResponse<unknown>>('/mail/admin/accounts', data)
      .then((r) => r.data.data);

  updateMailAccount = (id: string, data: { display_name?: string; is_active?: boolean }) =>
    apiClient
      .patch<BaseSingleResponse<unknown>>(`/mail/admin/accounts/${id}`, data)
      .then((r) => r.data.data);

  getMailAccountSettings = (id: string) =>
    apiClient
      .get<BaseSingleResponse<unknown>>(`/mail/admin/accounts/${id}/settings`)
      .then((r) => r.data.data);

  updateMailAccountSettings = (id: string, data: {
    display_name?: string;
    imap_host?: string;
    imap_port?: number;
    smtp_host?: string;
    smtp_port?: number;
    password?: string;
  }) =>
    apiClient
      .patch<BaseSingleResponse<unknown>>(`/mail/admin/accounts/${id}/settings`, data)
      .then((r) => r.data.data);

  testMailAccountSmtp = (id: string, data: {
    smtp_host?: string;
    smtp_port?: number;
    password?: string;
  }) =>
    apiClient
      .post<BaseSingleResponse<{ success: boolean; message: string }>>(`/mail/admin/accounts/${id}/test-smtp`, data)
      .then((r) => r.data.data);

  getMailSmtpProfiles = () =>
    apiClient
      .get<BaseSingleResponse<Array<{
        code: string;
        name: string;
        host: string | null;
        port: number | null;
        description: string;
      }>>>('/mail/admin/smtp-profiles')
      .then((r) => r.data.data ?? []);

  reissueMailCredential = (id: string) =>
    apiClient
      .post<BaseSingleResponse<unknown>>(`/mail/admin/accounts/${id}/reissue-credential`)
      .then((r) => r.data.data);

  deleteMailAccount = (id: string) =>
    apiClient.delete(`/mail/admin/accounts/${id}`);

  // Site Settings
  getSiteSettings = () =>
    apiClient
      .get<BaseSingleResponse<SiteSettingsResponse>>('/settings/site')
      .then((r) => r.data.data);

  updateSiteSettings = (data: {
    portal_url?: string;
    portal_domain?: string;
    allowed_ips?: string[];
    allowed_domains?: string[];
    is_public?: boolean;
    logo_url?: string;
    favicon_url?: string;
    index_enabled?: boolean;
    index_html?: string;
  }) =>
    apiClient
      .put<BaseSingleResponse<SiteSettingsResponse>>('/settings/site', data)
      .then((r) => r.data.data);

  getIndexPage = () =>
    apiClient
      .get<BaseSingleResponse<{ enabled: boolean; html: string | null }>>('/settings/site/index-page')
      .then((r) => r.data.data);
}

export const settingsService = new SettingsService();
