import { apiClient } from '@/lib/api-client';
import { HrPayrollPeriodResponse, HrPayrollDetailResponse } from '@amb/types';

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

class PayrollApiService {
  private readonly basePath = '/hr/payroll';

  getPeriods = () =>
    apiClient
      .get<ListResponse<HrPayrollPeriodResponse>>(this.basePath)
      .then((r) => r.data.data);

  createPeriod = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrPayrollPeriodResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  getPeriodById = (periodId: string) =>
    apiClient
      .get<SingleResponse<HrPayrollPeriodResponse>>(`${this.basePath}/${periodId}`)
      .then((r) => r.data.data);

  calculatePayroll = (periodId: string) =>
    apiClient
      .post<SingleResponse<HrPayrollPeriodResponse>>(`${this.basePath}/${periodId}/calculate`)
      .then((r) => r.data.data);

  submitForApproval = (periodId: string) =>
    apiClient
      .post<SingleResponse<HrPayrollPeriodResponse>>(`${this.basePath}/${periodId}/submit`)
      .then((r) => r.data.data);

  approve = (periodId: string) =>
    apiClient
      .post<SingleResponse<HrPayrollPeriodResponse>>(`${this.basePath}/${periodId}/approve`)
      .then((r) => r.data.data);

  finalize = (periodId: string) =>
    apiClient
      .post<SingleResponse<HrPayrollPeriodResponse>>(`${this.basePath}/${periodId}/finalize`)
      .then((r) => r.data.data);

  reject = (periodId: string) =>
    apiClient
      .post<SingleResponse<HrPayrollPeriodResponse>>(`${this.basePath}/${periodId}/reject`)
      .then((r) => r.data.data);

  getDetails = (periodId: string) =>
    apiClient
      .get<ListResponse<HrPayrollDetailResponse>>(`${this.basePath}/${periodId}/details`)
      .then((r) => r.data.data);

  getDetailByEmployee = (periodId: string, empId: string) =>
    apiClient
      .get<SingleResponse<HrPayrollDetailResponse>>(`${this.basePath}/${periodId}/details/${empId}`)
      .then((r) => r.data.data);
}

export const payrollApiService = new PayrollApiService();
