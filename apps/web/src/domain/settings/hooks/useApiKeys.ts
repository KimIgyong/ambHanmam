import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../service/settings.service';

const apiKeyKeys = {
  all: ['apiKeys'] as const,
  list: () => [...apiKeyKeys.all, 'list'] as const,
};

export const useApiKeyList = () => {
  return useQuery({
    queryKey: apiKeyKeys.list(),
    queryFn: () => settingsService.getApiKeys(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { provider: string; name: string; api_key: string }) =>
      settingsService.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
};

export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; api_key?: string; is_active?: boolean };
    }) => settingsService.updateApiKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => settingsService.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
};

export const useTestApiKey = () => {
  return useMutation({
    mutationFn: (id: string) => settingsService.testApiKey(id),
  });
};
