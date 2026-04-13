import { apiClient } from '@/lib/api-client';

export interface PartnerApp {
  papId: string;
  ptnId: string;
  papCode: string;
  papName: string;
  papDescription: string | null;
  papIcon: string | null;
  papUrl: string;
  papAuthMode: string;
  papOpenMode: string;
  papCategory: string;
  papStatus: string;
  papVersion: string;
  papReviewNote: string | null;
  papRegisteredBy: string;
  papReviewedBy: string | null;
  papReviewedAt: string | null;
  papPublishedAt: string | null;
  papCreatedAt: string;
  papUpdatedAt: string;
  partner?: { ptnCompanyName: string; ptnCode: string };
}

class PartnerPortalApiService {
  private readonly basePath = '/partner-auth';

  login = (partnerCode: string, email: string, password: string) =>
    apiClient.post(`${this.basePath}/login`, { partner_code: partnerCode, email, password }).then((r) => r.data.data);

  register = (data: { token: string; name: string; password: string; job_title?: string; phone?: string }) =>
    apiClient.post(`${this.basePath}/register`, data).then((r) => r.data.data);

  verifyInvitation = (token: string) =>
    apiClient.get(`${this.basePath}/invitation/${token}`).then((r) => r.data.data);

  getProfile = () =>
    apiClient.get(`${this.basePath}/me`).then((r) => r.data.data);

  updateProfile = (data: { name?: string; job_title?: string; phone?: string }) =>
    apiClient.patch(`${this.basePath}/profile`, data).then((r) => r.data.data);

  changePassword = (current_password: string, new_password: string) =>
    apiClient.post(`${this.basePath}/change-password`, { current_password, new_password }).then((r) => r.data);

  logout = () =>
    apiClient.post(`${this.basePath}/logout`).catch(() => {});

  forgotPassword = (partnerCode: string, email: string) =>
    apiClient.post(`${this.basePath}/forgot-password`, { partner_code: partnerCode, email }).then((r) => r.data);

  // ── Partner Apps ──

  getApps = (status?: string): Promise<PartnerApp[]> =>
    apiClient.get('/partner/apps', { params: status ? { status } : {} }).then((r) => r.data.data);

  getApp = (id: string): Promise<PartnerApp> =>
    apiClient.get(`/partner/apps/${id}`).then((r) => r.data.data);

  createApp = (data: { code: string; name: string; description?: string; icon?: string; url: string; auth_mode?: string; open_mode?: string; category?: string }) =>
    apiClient.post('/partner/apps', data).then((r) => r.data.data);

  updateApp = (id: string, data: { name?: string; description?: string; icon?: string; url?: string; auth_mode?: string; open_mode?: string; category?: string }) =>
    apiClient.patch(`/partner/apps/${id}`, data).then((r) => r.data.data);

  submitApp = (id: string) =>
    apiClient.post(`/partner/apps/${id}/submit`).then((r) => r.data.data);

  deleteApp = (id: string) =>
    apiClient.delete(`/partner/apps/${id}`).then((r) => r.data.data);

  getAppVersions = (id: string) =>
    apiClient.get(`/partner/apps/${id}/versions`).then((r) => r.data.data);

  createAppVersion = (id: string, data: { version: string; url?: string; change_log?: string }) =>
    apiClient.post(`/partner/apps/${id}/versions`, data).then((r) => r.data.data);
}

export const partnerPortalApiService = new PartnerPortalApiService();
