import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityIndexService, ActivityWeightConfig } from '../service/activity-index.service';

const activityKeys = {
  all: ['activity-index'] as const,
  weights: ['activity-index', 'weights'] as const,
  stats: (filters: Record<string, any>) => ['activity-index', 'stats', filters] as const,
  userDaily: (userId: string, filters: Record<string, any>) => ['activity-index', 'daily', userId, filters] as const,
  myEngagement: ['activity-index', 'my-engagement'] as const,
  myYesterday: ['activity-index', 'my-yesterday'] as const,
};

export const useActivityWeights = () =>
  useQuery({
    queryKey: activityKeys.weights,
    queryFn: () => activityIndexService.getWeights(),
  });

export const useUpdateActivityWeights = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weights: ActivityWeightConfig[]) =>
      activityIndexService.updateWeights(weights),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useMemberActivityStats = (params: { date_from?: string; date_to?: string }) =>
  useQuery({
    queryKey: activityKeys.stats(params),
    queryFn: () => activityIndexService.getMemberStats(params),
  });

export const useUserDailyStats = (userId: string, params: { date_from?: string; date_to?: string }) =>
  useQuery({
    queryKey: activityKeys.userDaily(userId, params),
    queryFn: () => activityIndexService.getUserDailyStats(userId, params),
    enabled: !!userId,
  });

export const useAggregateStats = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => activityIndexService.aggregate(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useMyEngagement = () =>
  useQuery({
    queryKey: activityKeys.myEngagement,
    queryFn: () => activityIndexService.getMyEngagement(),
  });

export const useMyYesterday = () =>
  useQuery({
    queryKey: activityKeys.myYesterday,
    queryFn: () => activityIndexService.getMyYesterday(),
  });
