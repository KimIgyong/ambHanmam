import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { severanceApiService } from '../service/severance.service';

const severanceKeys = {
  all: ['hr-severance'] as const,
  calculate: (empId: string, endDate?: string) => [...severanceKeys.all, 'calculate', empId, endDate] as const,
};

export const useSeveranceCalculation = (empId: string, endDate?: string) =>
  useQuery({
    queryKey: severanceKeys.calculate(empId, endDate),
    queryFn: () => severanceApiService.calculateSeverance(empId, endDate),
    enabled: !!empId,
  });

export const useConfirmSeverance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (empId: string) => severanceApiService.confirmSeverance(empId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: severanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['hr-employee'] });
    },
  });
};
