import { apiClient } from '@/lib/api-client';
import { BilPartnerResponse } from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class PartnerApiService {
  private readonly basePath = '/billing/partners';

  getPartners = (params?: { type?: string; status?: string; search?: string }) =>
    apiClient
      .get<ListResponse<BilPartnerResponse>>(this.basePath, { params })
      .then((r) => r.data.data);

  getPartnerById = (id: string) =>
    apiClient
      .get<SingleResponse<BilPartnerResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createPartner = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<BilPartnerResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updatePartner = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<BilPartnerResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deletePartner = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

export const partnerApiService = new PartnerApiService();
