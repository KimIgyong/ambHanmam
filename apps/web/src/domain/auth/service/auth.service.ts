import { apiClient } from '@/lib/api-client';
import type { AuthTokenResponse } from '@amb/types';

export interface EntitySearchItem {
  entityId: string;
  code: string;
  name: string;
  nameEn: string | null;
  country: string;
}

interface LoginCompleteResponse {
  step: 'complete';
  tokens: AuthTokenResponse;
}

class AuthService {
  private readonly basePath = '/auth';

  searchEntities = (query: string): Promise<EntitySearchItem[]> =>
    apiClient
      .get<{ success: boolean; data: EntitySearchItem[] }>(`${this.basePath}/entities/search`, {
        params: { q: query },
      })
      .then((r) => r.data.data);

  login = (email: string, password: string, entityCode?: string): Promise<LoginCompleteResponse> =>
    apiClient
      .post<{ success: boolean; data: LoginCompleteResponse }>(`${this.basePath}/login`, {
        entity_code: entityCode || undefined,
        email,
        password,
      })
      .then((r) => r.data.data);

  register = (email: string, password: string, name: string, unit?: string, invitationToken?: string) =>
    apiClient
      .post<{ success: boolean; data: AuthTokenResponse }>(`${this.basePath}/register`, {
        email,
        password,
        name,
        unit,
        invitation_token: invitationToken,
      })
      .then((r) => r.data.data);

  refresh = () =>
    apiClient
      .post<{ success: boolean; data: AuthTokenResponse }>(`${this.basePath}/refresh`)
      .then((r) => r.data.data);

  logout = () =>
    apiClient.post(`${this.basePath}/logout`).catch(() => {});

  findOrganizations = (email: string) =>
    apiClient
      .post(`${this.basePath}/find-organizations`, { email })
      .then((r) => r.data);

  forgotPassword = (email: string, entityCode?: string) =>
    apiClient
      .post(`${this.basePath}/forgot-password`, {
        email,
        entity_code: entityCode || undefined,
      })
      .then((r) => r.data);

  verifyResetToken = (token: string): Promise<{ email: string; entityName: string | null }> =>
    apiClient
      .get<{ success: boolean; data: { email: string; entityName: string | null } }>(
        `${this.basePath}/verify-reset-token`,
        { params: { token } },
      )
      .then((r) => r.data.data);

  resetPassword = (token: string, newPassword: string) =>
    apiClient
      .post(`${this.basePath}/reset-password`, {
        token,
        new_password: newPassword,
      })
      .then((r) => r.data);

  changePassword = (currentPassword: string, newPassword: string) =>
    apiClient
      .post(`${this.basePath}/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
      })
      .then((r) => r.data);

  autoLogin = (token: string) =>
    apiClient
      .post<{ success: boolean; data: { tokens: AuthTokenResponse } }>(
        `${this.basePath}/auto-login`,
        { token },
      )
      .then((r) => r.data.data);

  initialSetup = (data: {
    password: string;
    name: string;
    company_name?: string;
    country_code?: string;
  }) =>
    apiClient
      .patch<{ success: boolean; data: { tokens: AuthTokenResponse } }>(
        `${this.basePath}/initial-setup`,
        data,
      )
      .then((r) => r.data.data);
}

export const authService = new AuthService();
