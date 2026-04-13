import { apiClient } from '@/lib/api-client';
import { BilSowResponse } from '@amb/types';

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

class SowApiService {
  private readonly basePath = '/billing/sow';

  getSows = (params?: { status?: string; contract_id?: string; search?: string; partner_id?: string }) =>
    apiClient
      .get<ListResponse<BilSowResponse>>(this.basePath, { params })
      .then((r) => r.data.data);

  getSowById = (id: string) =>
    apiClient
      .get<SingleResponse<BilSowResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createSow = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<BilSowResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateSow = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<BilSowResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteSow = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

export const sowApiService = new SowApiService();
