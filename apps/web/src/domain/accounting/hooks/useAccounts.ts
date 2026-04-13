import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../service/accounting.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const accountKeys = {
  all: ['accounts'] as const,
  list: (entityId?: string) => [...accountKeys.all, 'list', entityId] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
  summary: (entityId?: string) => [...accountKeys.all, 'summary', entityId] as const,
};

export const useAccountList = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: accountKeys.list(entityId),
    queryFn: () => accountingService.getAccounts(),
    enabled: !!entityId,
  });
};

export const useAccountById = (id: string) => {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountingService.getAccountById(id),
    enabled: !!id,
  });
};

export const useAccountSummary = (options?: { enabled?: boolean }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: accountKeys.summary(entityId),
    queryFn: () => accountingService.getAccountSummary(),
    staleTime: 1000 * 60,
    enabled: !!entityId && options?.enabled !== false,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      bank_name: string;
      branch_name?: string;
      account_number: string;
      account_alias?: string;
      currency: string;
      opening_balance?: number;
      opening_date?: string;
    }) => accountingService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      accountingService.updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountingService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};

export const useImportExcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => accountingService.importExcel(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
};
