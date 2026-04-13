import { apiClient } from '@/lib/api-client';
import { HrEmployeeResponse, HrDependentResponse, HrSalaryHistoryResponse } from '@amb/types';

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

class EmployeeApiService {
  private readonly basePath = '/hr';

  // Employees
  getEmployees = (params?: { status?: string; department?: string }) =>
    apiClient
      .get<ListResponse<HrEmployeeResponse>>(`${this.basePath}/employees`, { params })
      .then((r) => r.data.data);

  getEmployeeById = (id: string) =>
    apiClient
      .get<SingleResponse<HrEmployeeResponse>>(`${this.basePath}/employees/${id}`)
      .then((r) => r.data.data);

  createEmployee = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrEmployeeResponse>>(`${this.basePath}/employees`, data)
      .then((r) => r.data.data);

  updateEmployee = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrEmployeeResponse>>(`${this.basePath}/employees/${id}`, data)
      .then((r) => r.data.data);

  deleteEmployee = (id: string) =>
    apiClient.delete(`${this.basePath}/employees/${id}`);

  // Dependents
  getDependents = (empId: string) =>
    apiClient
      .get<ListResponse<HrDependentResponse>>(`${this.basePath}/employees/${empId}/dependents`)
      .then((r) => r.data.data);

  createDependent = (empId: string, data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrDependentResponse>>(`${this.basePath}/employees/${empId}/dependents`, data)
      .then((r) => r.data.data);

  updateDependent = (depId: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrDependentResponse>>(`${this.basePath}/dependents/${depId}`, data)
      .then((r) => r.data.data);

  deleteDependent = (depId: string) =>
    apiClient.delete(`${this.basePath}/dependents/${depId}`);

  // Salary History
  getSalaryHistory = (empId: string) =>
    apiClient
      .get<ListResponse<HrSalaryHistoryResponse>>(`${this.basePath}/employees/${empId}/salary-history`)
      .then((r) => r.data.data);

  createSalaryHistory = (empId: string, data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrSalaryHistoryResponse>>(`${this.basePath}/employees/${empId}/salary-history`, data)
      .then((r) => r.data.data);
}

export const employeeApiService = new EmployeeApiService();
