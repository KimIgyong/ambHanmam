import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { PgConfigResponse, PgConnectionTestResult } from '@amb/types';

const pgKeys = {
  all: ['pgConfigs'] as const,
  list: (entityId?: string) => [...pgKeys.all, 'list', entityId] as const,
  detail: (id: string) => [...pgKeys.all, 'detail', id] as const,
};

export const usePgConfigs = (entityId?: string) => {
  return useQuery({
    queryKey: pgKeys.list(entityId),
    queryFn: async () => {
      const params = entityId ? { entity_id: entityId } : {};
      const res = await apiClient.get<{ data: PgConfigResponse[] }>(
        '/payment-gateway/configs',
        { params },
      );
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const usePgConfig = (id: string) => {
  return useQuery({
    queryKey: pgKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<{ data: PgConfigResponse }>(
        `/payment-gateway/configs/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreatePgConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      entity_id?: string;
      provider: string;
      merchant_id: string;
      encode_key: string;
      refund_key: string;
      cancel_pw: string;
      environment?: string;
      callback_url?: string;
      noti_url?: string;
      window_color?: string;
      currency?: string;
      is_active?: boolean;
    }) => {
      const res = await apiClient.post<{ data: PgConfigResponse }>(
        '/payment-gateway/configs',
        data,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pgKeys.all });
    },
  });
};

export const useUpdatePgConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await apiClient.patch<{ data: PgConfigResponse }>(
        `/payment-gateway/configs/${id}`,
        data,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pgKeys.all });
    },
  });
};

export const useDeletePgConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/payment-gateway/configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pgKeys.all });
    },
  });
};

export const useTestPgConnection = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<{ data: PgConnectionTestResult }>(
        `/payment-gateway/configs/${id}/test`,
      );
      return res.data.data;
    },
  });
};
