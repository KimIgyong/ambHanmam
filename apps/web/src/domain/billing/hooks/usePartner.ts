import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerApiService } from '../service/partner.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const partnerKeys = {
  all: ['bil-partners'] as const,
  list: (entityId: string | undefined, params?: { type?: string; status?: string; search?: string }) =>
    [...partnerKeys.all, 'list', entityId, params] as const,
  detail: (id: string) => [...partnerKeys.all, 'detail', id] as const,
};

export const usePartnerList = (params?: { type?: string; status?: string; search?: string }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: partnerKeys.list(entityId, params),
    queryFn: () => partnerApiService.getPartners(params),
    enabled: !!entityId,
  });
};

export const usePartnerDetail = (id: string) => {
  return useQuery({
    queryKey: partnerKeys.detail(id),
    queryFn: () => partnerApiService.getPartnerById(id),
    enabled: !!id,
  });
};

export const useCreatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => partnerApiService.createPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
};

export const useUpdatePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      partnerApiService.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
};

export const useDeletePartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnerApiService.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
};
