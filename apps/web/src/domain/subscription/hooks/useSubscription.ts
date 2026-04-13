import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../service/subscription.service';

const subscriptionKeys = {
  all: ['subscription'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  tokens: () => [...subscriptionKeys.all, 'tokens'] as const,
  storage: () => [...subscriptionKeys.all, 'storage'] as const,
};

export const usePlans = () =>
  useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: subscriptionService.getPlans,
    staleTime: 1000 * 60 * 10,
  });

export const useSubscription = () =>
  useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: subscriptionService.getSubscription,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

export const useTokenWallets = () =>
  useQuery({
    queryKey: subscriptionKeys.tokens(),
    queryFn: subscriptionService.getTokenWallets,
    staleTime: 1000 * 60,
  });

export const useStorageQuota = () =>
  useQuery({
    queryKey: subscriptionKeys.storage(),
    queryFn: subscriptionService.getStorageQuota,
    staleTime: 1000 * 60,
  });

export const useCheckoutMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionService.createCheckout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.current() });
    },
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionService.cancelSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
  });
};

export const usePurchaseTokens = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionService.purchaseTokens,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.tokens() });
    },
  });
};

export const usePurchaseStorage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionService.purchaseStorage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionKeys.storage() });
    },
  });
};
