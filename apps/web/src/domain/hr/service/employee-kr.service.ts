import { apiClient } from '@/lib/api-client';
import { HrEmployeeKrResponse } from '@amb/types';

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class EmployeeKrApiService {
  getKrInfo = (empId: string) =>
    apiClient
      .get<SingleResponse<HrEmployeeKrResponse | null>>(`/hr/employees/${empId}/kr`)
      .then((r) => r.data.data);

  createKrInfo = (empId: string, data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrEmployeeKrResponse>>(`/hr/employees/${empId}/kr`, data)
      .then((r) => r.data.data);

  updateKrInfo = (empId: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrEmployeeKrResponse>>(`/hr/employees/${empId}/kr`, data)
      .then((r) => r.data.data);
}

export const employeeKrApiService = new EmployeeKrApiService();
