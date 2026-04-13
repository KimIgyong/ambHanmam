import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnerAdminService } from '../service/partner-admin.service';

const partnerKeys = {
  all: ['admin-partners'] as const,
  list: (search?: string) => [...partnerKeys.all, 'list', search] as const,
  detail: (id: string) => [...partnerKeys.all, 'detail', id] as const,
};

export const usePartnerAdminList = (search?: string) => {
  return useQuery({
    queryKey: partnerKeys.list(search),
    queryFn: () => partnerAdminService.getPartners(search),
  });
};

export const usePartnerAdminDetail = (id: string) => {
  return useQuery({
    queryKey: partnerKeys.detail(id),
    queryFn: () => partnerAdminService.getPartner(id),
    enabled: !!id,
  });
};

export const useCreatePartnerAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partnerAdminService.createPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
};

export const useUpdatePartnerAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      partnerAdminService.updatePartner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
};

export const useDeletePartnerAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnerAdminService.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
};
