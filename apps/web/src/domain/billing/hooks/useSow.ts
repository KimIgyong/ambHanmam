import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sowApiService } from '../service/sow.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const sowKeys = {
  all: ['bil-sow'] as const,
  list: (entityId: string | undefined, params?: Record<string, string>) =>
    [...sowKeys.all, 'list', entityId, params] as const,
  detail: (id: string) => [...sowKeys.all, 'detail', id] as const,
};

export const useSowList = (params?: { status?: string; contract_id?: string; search?: string; partner_id?: string }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: sowKeys.list(entityId, params as Record<string, string>),
    queryFn: () => sowApiService.getSows(params),
    enabled: !!entityId,
  });
};

export const useSowDetail = (id: string) => {
  return useQuery({
    queryKey: sowKeys.detail(id),
    queryFn: () => sowApiService.getSowById(id),
    enabled: !!id,
  });
};

export const useCreateSow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => sowApiService.createSow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
};

export const useUpdateSow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      sowApiService.updateSow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
};

export const useDeleteSow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sowApiService.deleteSow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sowKeys.all });
    },
  });
};
