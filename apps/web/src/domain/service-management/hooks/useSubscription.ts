import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApiService } from '../service/subscription.service';

const subscriptionKeys = {
  all: ['svc-subscriptions'] as const,
  list: (params?: Record<string, string | undefined>) => [...subscriptionKeys.all, 'list', params] as const,
  detail: (id: string) => [...subscriptionKeys.all, 'detail', id] as const,
  history: (id: string) => [...subscriptionKeys.all, 'history', id] as const,
  expiring: (days?: number) => [...subscriptionKeys.all, 'expiring', days] as const,
};

export const useSubscriptionList = (params?: { service?: string; status?: string; client?: string; expiring?: string }) => {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => subscriptionApiService.getSubscriptions(params),
  });
};

export const useSubscriptionDetail = (id: string) => {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => subscriptionApiService.getSubscriptionById(id),
    enabled: !!id,
  });
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => subscriptionApiService.createSubscription(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }); },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      subscriptionApiService.updateSubscription(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }); },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      subscriptionApiService.cancelSubscription(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }); },
  });
};

export const useSuspendSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionApiService.suspendSubscription(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }); },
  });
};

export const useResumeSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionApiService.resumeSubscription(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }); },
  });
};

export const useRenewSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionApiService.renewSubscription(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }); },
  });
};

export const useSubscriptionHistory = (id: string) => {
  return useQuery({
    queryKey: subscriptionKeys.history(id),
    queryFn: () => subscriptionApiService.getHistory(id),
    enabled: !!id,
  });
};

export const useExpiringSubscriptions = (days?: number) => {
  return useQuery({
    queryKey: subscriptionKeys.expiring(days),
    queryFn: () => subscriptionApiService.getExpiring(days),
  });
};
