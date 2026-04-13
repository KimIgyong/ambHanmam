import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApiService } from '../service/project.service';

const reviewKeys = {
  all: ['project-reviews'] as const,
  history: (projectId: string) => [...reviewKeys.all, 'history', projectId] as const,
  recommendation: (projectId: string) => [...reviewKeys.all, 'recommendation', projectId] as const,
};

export const useReviewHistory = (projectId: string) => {
  return useQuery({
    queryKey: reviewKeys.history(projectId),
    queryFn: () => projectApiService.getReviewHistory(projectId),
    enabled: !!projectId,
  });
};

export const useGeneratePreAnalysis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectApiService.generatePreAnalysis(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useGetRecommendation = (projectId: string) => {
  return useQuery({
    queryKey: reviewKeys.recommendation(projectId),
    queryFn: () => projectApiService.getRecommendation(projectId),
    enabled: false, // Manual trigger
  });
};

export const usePerformReviewAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { action: string; comment?: string; step?: number } }) =>
      projectApiService.performReviewAction(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};
