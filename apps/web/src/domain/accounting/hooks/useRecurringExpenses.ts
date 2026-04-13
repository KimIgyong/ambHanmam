import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../service/accounting.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const recurringKeys = {
  all: ['recurringExpenses'] as const,
  list: (entityId?: string) => [...recurringKeys.all, 'list', entityId] as const,
  forecast: (entityId?: string, month?: string) => [...recurringKeys.all, 'forecast', entityId, month] as const,
};

export const useRecurringExpenses = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: recurringKeys.list(entityId),
    queryFn: () => accountingService.getRecurringExpenses(),
    enabled: !!entityId,
  });
};

export const useCreateRecurringExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string; bac_id: string; vendor?: string; amount: number;
      currency: string; day_of_month: number; category?: string;
      description?: string; start_date?: string; end_date?: string;
    }) => accountingService.createRecurringExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
};

export const useUpdateRecurringExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      accountingService.updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
};

export const useDeleteRecurringExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountingService.deleteRecurringExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
};

export const useForecast = (month: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: recurringKeys.forecast(entityId, month),
    queryFn: () => accountingService.getForecast(month),
    enabled: !!entityId && !!month,
  });
};
