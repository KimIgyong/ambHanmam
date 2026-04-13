import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApiService } from '../service/payroll.service';

const payrollKeys = {
  all: ['hr-payroll'] as const,
  periods: () => [...payrollKeys.all, 'periods'] as const,
  period: (id: string) => [...payrollKeys.all, 'period', id] as const,
  details: (periodId: string) => [...payrollKeys.all, 'details', periodId] as const,
  detail: (periodId: string, empId: string) => [...payrollKeys.all, 'detail', periodId, empId] as const,
};

export const usePayrollPeriods = () => {
  return useQuery({
    queryKey: payrollKeys.periods(),
    queryFn: () => payrollApiService.getPeriods(),
  });
};

export const usePayrollPeriod = (periodId: string) => {
  return useQuery({
    queryKey: payrollKeys.period(periodId),
    queryFn: () => payrollApiService.getPeriodById(periodId),
    enabled: !!periodId,
  });
};

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => payrollApiService.createPeriod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
};

export const useCalculatePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => payrollApiService.calculatePayroll(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
};

export const useSubmitPayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => payrollApiService.submitForApproval(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
};

export const useApprovePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => payrollApiService.approve(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
};

export const useFinalizePayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => payrollApiService.finalize(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
};

export const useRejectPayroll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => payrollApiService.reject(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
};

export const usePayrollDetails = (periodId: string) => {
  return useQuery({
    queryKey: payrollKeys.details(periodId),
    queryFn: () => payrollApiService.getDetails(periodId),
    enabled: !!periodId,
  });
};

export const usePayrollDetailByEmployee = (periodId: string, empId: string) => {
  return useQuery({
    queryKey: payrollKeys.detail(periodId, empId),
    queryFn: () => payrollApiService.getDetailByEmployee(periodId, empId),
    enabled: !!periodId && !!empId,
  });
};
