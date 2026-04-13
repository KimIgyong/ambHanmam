import { useQuery } from '@tanstack/react-query';
import { accountingService } from '../service/accounting.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const statsKeys = {
  all: ['accountStats'] as const,
  monthly: (accountId: string, params?: Record<string, string>) =>
    [...statsKeys.all, 'monthly', accountId, params] as const,
  topVendors: (accountId: string, params?: Record<string, string>) =>
    [...statsKeys.all, 'topVendors', accountId, params] as const,
  consolidated: (accountIds: string[], params?: Record<string, string>) =>
    [...statsKeys.all, 'consolidated', accountIds.join(','), params] as const,
};

export const useMonthlyStats = (
  accountId: string,
  params?: { start_month?: string; end_month?: string },
) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: statsKeys.monthly(accountId, params as Record<string, string>),
    queryFn: () => accountingService.getMonthlyStats(accountId, params),
    enabled: !!entityId && !!accountId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTopVendors = (
  accountId: string,
  params?: { start_month?: string; end_month?: string; limit?: number },
) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: statsKeys.topVendors(accountId, params as Record<string, string>),
    queryFn: () => accountingService.getTopVendors(accountId, params),
    enabled: !!entityId && !!accountId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useConsolidatedStats = (
  accountIds: string[],
  params?: { start_month?: string; end_month?: string },
) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: statsKeys.consolidated(accountIds, params as Record<string, string>),
    queryFn: () => accountingService.getConsolidatedStats(accountIds, params),
    enabled: !!entityId && accountIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
