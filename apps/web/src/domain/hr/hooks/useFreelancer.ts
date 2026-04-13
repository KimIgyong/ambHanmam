import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { freelancerApiService } from '../service/freelancer.service';
import { useEntityId } from './useEntity';

const freelancerKeys = {
  all: ['hr-freelancers'] as const,
  list: () => [...freelancerKeys.all, 'list'] as const,
  detail: (id: string) => [...freelancerKeys.all, 'detail', id] as const,
};

export const useFreelancerList = () => {
  const entityId = useEntityId();
  return useQuery({
    queryKey: freelancerKeys.list(),
    queryFn: () => freelancerApiService.getFreelancers(),
    enabled: !!entityId,
  });
};

export const useFreelancerDetail = (id: string) => {
  const entityId = useEntityId();
  return useQuery({
    queryKey: freelancerKeys.detail(id),
    queryFn: () => freelancerApiService.getFreelancerById(id),
    enabled: !!id && !!entityId,
  });
};

export const useCreateFreelancer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => freelancerApiService.createFreelancer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: freelancerKeys.all });
    },
  });
};

export const useUpdateFreelancer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      freelancerApiService.updateFreelancer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: freelancerKeys.all });
    },
  });
};

export const useDeleteFreelancer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => freelancerApiService.deleteFreelancer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: freelancerKeys.all });
    },
  });
};
