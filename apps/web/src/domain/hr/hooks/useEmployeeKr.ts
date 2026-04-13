import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeKrApiService } from '../service/employee-kr.service';
import { useEntityId } from './useEntity';

const krKeys = {
  all: ['hr-employee-kr'] as const,
  detail: (empId: string) => [...krKeys.all, empId] as const,
};

export const useEmployeeKrInfo = (empId: string) => {
  const entityId = useEntityId();
  return useQuery({
    queryKey: krKeys.detail(empId),
    queryFn: () => employeeKrApiService.getKrInfo(empId),
    enabled: !!empId && !!entityId,
  });
};

export const useCreateEmployeeKr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empId, data }: { empId: string; data: Record<string, unknown> }) =>
      employeeKrApiService.createKrInfo(empId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krKeys.all });
    },
  });
};

export const useUpdateEmployeeKr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empId, data }: { empId: string; data: Record<string, unknown> }) =>
      employeeKrApiService.updateKrInfo(empId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krKeys.all });
    },
  });
};
