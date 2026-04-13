import { apiClient } from '@/lib/api-client';
import type { PartnerApp } from '@/domain/partner-portal/service/partner-portal.service';

class PartnerAppAdminService {
  private readonly basePath = '/admin/partner-apps';

  getApps = (params?: { status?: string; partner_id?: string }): Promise<PartnerApp[]> =>
    apiClient.get(this.basePath, { params }).then((r) => r.data.data);

  getApp = (id: string): Promise<PartnerApp> =>
    apiClient.get(`${this.basePath}/${id}`).then((r) => r.data.data);

  startReview = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/review`).then((r) => r.data.data);

  approve = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/approve`).then((r) => r.data.data);

  reject = (id: string, review_note: string) =>
    apiClient.post(`${this.basePath}/${id}/reject`, { review_note }).then((r) => r.data.data);

  publish = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/publish`).then((r) => r.data.data);

  suspend = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/suspend`).then((r) => r.data.data);
}

export const partnerAppAdminService = new PartnerAppAdminService();
