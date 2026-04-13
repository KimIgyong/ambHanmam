import { apiClient } from '@/lib/api-client';
import { HrLeaveBalanceResponse } from '@amb/types';

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

class LeaveApiService {
  private readonly basePath = '/hr/leave';

  getLeaveBalances = (year: number) =>
    apiClient
      .get<ListResponse<HrLeaveBalanceResponse>>(this.basePath, { params: { year } })
      .then((r) => r.data.data);

  getEmployeeLeaveBalance = (empId: string, year: number) =>
    apiClient
      .get<SingleResponse<HrLeaveBalanceResponse>>(`${this.basePath}/${empId}`, { params: { year } })
      .then((r) => r.data.data);

  recalculateLeave = (year: number) =>
    apiClient
      .post<SingleResponse<{ recalculatedCount: number }>>(`${this.basePath}/recalculate`, null, { params: { year } })
      .then((r) => r.data.data);

  updateLeaveBalance = (empId: string, year: number, data: {
    entitlement?: number;
    used?: number;
    carry_forward?: number;
    ot_converted?: number;
  }) =>
    apiClient
      .patch<SingleResponse<HrLeaveBalanceResponse>>(`${this.basePath}/${empId}`, data, { params: { year } })
      .then((r) => r.data.data);
}

export const leaveApiService = new LeaveApiService();
