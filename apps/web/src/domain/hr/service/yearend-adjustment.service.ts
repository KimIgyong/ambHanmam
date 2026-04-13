import { apiClient } from '@/lib/api-client';
import { HrYearendAdjustmentResponse } from '@amb/types';

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

class YearendAdjustmentApiService {
  private readonly basePath = '/hr/yearend';

  getList = (taxYear: number) =>
    apiClient
      .get<ListResponse<HrYearendAdjustmentResponse>>(this.basePath, {
        params: { tax_year: taxYear },
      })
      .then((r) => r.data.data);

  getById = (id: string) =>
    apiClient
      .get<SingleResponse<HrYearendAdjustmentResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  create = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrYearendAdjustmentResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  update = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrYearendAdjustmentResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  delete = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  applyToPayroll = (id: string, periodId: string) =>
    apiClient
      .post<SingleResponse<HrYearendAdjustmentResponse>>(`${this.basePath}/${id}/apply/${periodId}`)
      .then((r) => r.data.data);

  applyBatch = (taxYear: number, periodId: string) =>
    apiClient
      .post<SingleResponse<{ appliedCount: number; totalPending: number }>>(`${this.basePath}/apply-batch`, {
        tax_year: taxYear,
        period_id: periodId,
      })
      .then((r) => r.data.data);

  importExcel = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<SingleResponse<{ row: number; code: string; status: string }[]>>(
        `${this.basePath}/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data.data);
  };
}

export const yearendAdjustmentApiService = new YearendAdjustmentApiService();
