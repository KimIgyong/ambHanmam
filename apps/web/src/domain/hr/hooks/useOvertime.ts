import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeApiService } from '../service/overtime.service';

const otKeys = {
  all: ['hr-overtime'] as const,
  monthly: (year: number, month: number) => [...otKeys.all, 'monthly', year, month] as const,
};

export const useMonthlyOtRecords = (year: number, month: number) =>
  useQuery({
    queryKey: otKeys.monthly(year, month),
    queryFn: () => overtimeApiService.getMonthlyOtRecords(year, month),
  });

export const useCreateOtRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: overtimeApiService.createOtRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: otKeys.all });
    },
  });
};

export const useUpdateOtRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; data: Record<string, unknown> }) =>
      overtimeApiService.updateOtRecord(params.id, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: otKeys.all });
    },
  });
};

export const useDeleteOtRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: overtimeApiService.deleteOtRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: otKeys.all });
    },
  });
};

export const useApproveOtRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      overtimeApiService.approveOtRecord(params.id, params.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: otKeys.all });
    },
  });
};
