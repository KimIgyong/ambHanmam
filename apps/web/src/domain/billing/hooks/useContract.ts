import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractApiService } from '../service/contract.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const contractKeys = {
  all: ['bil-contracts'] as const,
  list: (entityId: string | undefined, params?: Record<string, string>) =>
    [...contractKeys.all, 'list', entityId, params] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
  history: (id: string) => [...contractKeys.all, 'history', id] as const,
  expiring: (entityId: string | undefined, days?: number) =>
    [...contractKeys.all, 'expiring', entityId, days] as const,
};

export const useContractList = (params?: { direction?: string; category?: string; type?: string; status?: string; partner_id?: string; search?: string }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: contractKeys.list(entityId, params as Record<string, string>),
    queryFn: () => contractApiService.getContracts(params),
    enabled: !!entityId,
  });
};

export const useContractDetail = (id: string) => {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractApiService.getContractById(id),
    enabled: !!id,
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => contractApiService.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      contractApiService.updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractApiService.deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
};

export const useRenewContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractApiService.renewContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
};

export const useContractHistory = (id: string) => {
  return useQuery({
    queryKey: contractKeys.history(id),
    queryFn: () => contractApiService.getContractHistory(id),
    enabled: !!id,
  });
};

export const useExpiringContracts = (days?: number) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: contractKeys.expiring(entityId, days),
    queryFn: () => contractApiService.getExpiringContracts(days),
    enabled: !!entityId,
  });
};
