import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApiService } from '../service/employee.service';

const employeeKeys = {
  all: ['hr-employees'] as const,
  list: (params?: { status?: string; department?: string }) =>
    [...employeeKeys.all, 'list', params] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
  dependents: (empId: string) => [...employeeKeys.all, 'dependents', empId] as const,
  salaryHistory: (empId: string) => [...employeeKeys.all, 'salary-history', empId] as const,
};

export const useEmployeeList = (params?: { status?: string; department?: string }) => {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeeApiService.getEmployees(params),
  });
};

export const useEmployeeDetail = (id: string) => {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeApiService.getEmployeeById(id),
    enabled: !!id,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => employeeApiService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      employeeApiService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApiService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

// Dependents
export const useDependentList = (empId: string) => {
  return useQuery({
    queryKey: employeeKeys.dependents(empId),
    queryFn: () => employeeApiService.getDependents(empId),
    enabled: !!empId,
  });
};

export const useCreateDependent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empId, data }: { empId: string; data: Record<string, unknown> }) =>
      employeeApiService.createDependent(empId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

export const useUpdateDependent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ depId, data }: { depId: string; data: Record<string, unknown> }) =>
      employeeApiService.updateDependent(depId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

export const useDeleteDependent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (depId: string) => employeeApiService.deleteDependent(depId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};

// Salary History
export const useSalaryHistoryList = (empId: string) => {
  return useQuery({
    queryKey: employeeKeys.salaryHistory(empId),
    queryFn: () => employeeApiService.getSalaryHistory(empId),
    enabled: !!empId,
  });
};

export const useCreateSalaryHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empId, data }: { empId: string; data: Record<string, unknown> }) =>
      employeeApiService.createSalaryHistory(empId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
};
