import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessIncomeApiService } from '../service/business-income.service';
import { useEntityId } from './useEntity';

const KEYS = {
  list: (ym?: string) => ['business-income', 'list', ym] as const,
  detail: (id: string) => ['business-income', 'detail', id] as const,
};

export function useBusinessIncomeList(yearMonth?: string) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.list(yearMonth),
    queryFn: () => businessIncomeApiService.getPayments(yearMonth),
    enabled: !!entityId,
  });
}

export function useBusinessIncomeDetail(id: string) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => businessIncomeApiService.getPaymentById(id),
    enabled: !!id && !!entityId,
  });
}

export function useCreateBusinessIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      businessIncomeApiService.createPayment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-income'] }),
  });
}

export function useUpdateBusinessIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      businessIncomeApiService.updatePayment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-income'] }),
  });
}

export function useDeleteBusinessIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => businessIncomeApiService.deletePayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business-income'] }),
  });
}
