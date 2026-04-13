import { apiClient } from '@/lib/api-client';
import { HrLeaveBalanceResponse, HrLeaveRequestResponse } from '@amb/types';

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  timestamp: string;
}

class LeaveRequestApiService {
  private readonly basePath = '/hr/leave-requests';

  // ─── 본인용 ───

  getMyBalance = (year: number) =>
    apiClient
      .get<SingleResponse<HrLeaveBalanceResponse>>(`${this.basePath}/my/balance`, { params: { year } })
      .then((r) => r.data.data);

  getMyRequests = (year: number) =>
    apiClient
      .get<ListResponse<HrLeaveRequestResponse>>(`${this.basePath}/my`, { params: { year } })
      .then((r) => r.data.data);

  createRequest = (data: {
    type: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }) =>
    apiClient
      .post<SingleResponse<HrLeaveRequestResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  cancelRequest = (id: string) =>
    apiClient
      .patch<{ success: boolean }>(`${this.basePath}/${id}/cancel`)
      .then((r) => r.data);

  // ─── 관리자용 ───

  getRequests = (params: {
    status?: string;
    year?: number;
    page?: number;
    limit?: number;
  }) =>
    apiClient
      .get<PaginatedResponse<HrLeaveRequestResponse>>(this.basePath, { params })
      .then((r) => ({ data: r.data.data, total: r.data.total }));

  approveRequest = (id: string) =>
    apiClient
      .patch<{ success: boolean }>(`${this.basePath}/${id}/approve`)
      .then((r) => r.data);

  rejectRequest = (id: string, reason: string) =>
    apiClient
      .patch<{ success: boolean }>(`${this.basePath}/${id}/reject`, { reason })
      .then((r) => r.data);
}

export const leaveRequestApiService = new LeaveRequestApiService();
