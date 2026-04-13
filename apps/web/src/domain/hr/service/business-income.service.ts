import { apiClient } from '@/lib/api-client';
import { HrBusinessIncomeResponse } from '@amb/types';

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

class BusinessIncomeApiService {
  private readonly basePath = '/hr/business-income';

  getPayments = (yearMonth?: string) =>
    apiClient
      .get<ListResponse<HrBusinessIncomeResponse>>(this.basePath, {
        params: yearMonth ? { year_month: yearMonth } : {},
      })
      .then((r) => r.data.data);

  getPaymentById = (id: string) =>
    apiClient
      .get<SingleResponse<HrBusinessIncomeResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createPayment = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrBusinessIncomeResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updatePayment = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrBusinessIncomeResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deletePayment = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

export const businessIncomeApiService = new BusinessIncomeApiService();
