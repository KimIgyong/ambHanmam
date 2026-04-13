import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../service/accounting.service';

export function useAnalysisReports(accountId: string) {
  return useQuery({
    queryKey: ['analysis-reports', accountId],
    queryFn: () => accountingService.getAnalysisReports(accountId),
    enabled: !!accountId,
  });
}

export function useSaveAnalysisReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: {
      accountId: string;
      data: { title: string; content: string; date_from?: string; date_to?: string; prompt_id?: string };
    }) => accountingService.saveAnalysisReport(accountId, data),
    onSuccess: (_, { accountId }) => {
      qc.invalidateQueries({ queryKey: ['analysis-reports', accountId] });
    },
  });
}

export function useDeleteAnalysisReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, reportId }: { accountId: string; reportId: string }) =>
      accountingService.deleteAnalysisReport(accountId, reportId),
    onSuccess: (_, { accountId }) => {
      qc.invalidateQueries({ queryKey: ['analysis-reports', accountId] });
    },
  });
}

export function useAnalysisPrompts() {
  return useQuery({
    queryKey: ['analysis-prompts'],
    queryFn: () => accountingService.getAnalysisPrompts(),
  });
}

export function useCreateAnalysisPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; system_prompt: string; user_prompt: string; is_default?: boolean }) =>
      accountingService.createAnalysisPrompt(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analysis-prompts'] });
    },
  });
}

export function useUpdateAnalysisPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ promptId, data }: { promptId: string; data: Record<string, unknown> }) =>
      accountingService.updateAnalysisPrompt(promptId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analysis-prompts'] });
    },
  });
}

export function useDeleteAnalysisPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promptId: string) => accountingService.deleteAnalysisPrompt(promptId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analysis-prompts'] });
    },
  });
}
