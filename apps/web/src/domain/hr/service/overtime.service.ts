import { apiClient } from '@/lib/api-client';
import { HrOtRecordResponse, HrOtMonthlySummary } from '@amb/types';

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

class OvertimeApiService {
  private readonly basePath = '/hr/overtime';

  getMonthlyOtRecords = (year: number, month: number) =>
    apiClient
      .get<ListResponse<HrOtMonthlySummary>>(this.basePath, { params: { year, month } })
      .then((r) => r.data.data);

  createOtRecord = (data: {
    employee_id: string;
    date: string;
    time_start: string;
    time_end: string;
    project_description?: string;
    ot_type: string;
    actual_hours: number;
    converted_hours: number;
  }) =>
    apiClient
      .post<SingleResponse<HrOtRecordResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateOtRecord = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrOtRecordResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteOtRecord = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  approveOtRecord = (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiClient
      .patch<SingleResponse<HrOtRecordResponse>>(`${this.basePath}/${id}/approve`, { status })
      .then((r) => r.data.data);
}

export const overtimeApiService = new OvertimeApiService();
