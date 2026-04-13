import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entityApiService } from '@/domain/hr/service/entity.service';

const entityKeys = {
  all: ['entities'] as const,
  list: () => [...entityKeys.all, 'list'] as const,
};

export const useEntityList = () => {
  return useQuery({
    queryKey: entityKeys.list(),
    queryFn: () => entityApiService.getEntities(),
  });
};

export const useCreateEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => entityApiService.createEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      entityApiService.updateEntity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
};
