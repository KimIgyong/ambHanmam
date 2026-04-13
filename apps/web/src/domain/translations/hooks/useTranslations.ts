import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { translationService } from '../service/translation.service';

export function useContentTranslations(sourceType: string, sourceId: string, enabled = true) {
  return useQuery({
    queryKey: ['translations', sourceType, sourceId],
    queryFn: () => translationService.getTranslations(sourceType, sourceId),
    enabled: !!sourceId && enabled,
    select: (res: any) => res.data?.data || res.data || [],
  });
}

export function useTranslation(sourceType: string, sourceId: string, targetLang: string, enabled = true) {
  return useQuery({
    queryKey: ['translation', sourceType, sourceId, targetLang],
    queryFn: () => translationService.getTranslation(sourceType, sourceId, targetLang),
    enabled: !!sourceId && !!targetLang && enabled,
    select: (res: any) => res.data?.data || res.data || [],
  });
}

export function useSaveTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      source_type: string;
      source_id: string;
      target_lang: string;
      translated_content: Record<string, string>;
      method?: string;
    }) => translationService.saveTranslation(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['translations', variables.source_type, variables.source_id] });
      queryClient.invalidateQueries({ queryKey: ['translation', variables.source_type, variables.source_id, variables.target_lang] });
    },
  });
}

export function useUpdateTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trnId, dto }: { trnId: string; dto: { content: string; change_reason?: string } }) =>
      translationService.updateTranslation(trnId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation'] });
    },
  });
}

export function useLockTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trnId: string) => translationService.lockTranslation(trnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation'] });
    },
  });
}

export function useUnlockTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trnId: string) => translationService.unlockTranslation(trnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation'] });
    },
  });
}

export function useTranslationHistory(trnId: string, enabled = true) {
  return useQuery({
    queryKey: ['translationHistory', trnId],
    queryFn: () => translationService.getHistory(trnId),
    enabled: !!trnId && enabled,
    select: (res: any) => res.data?.data || res.data || [],
  });
}

// Glossary hooks
export function useGlossary() {
  return useQuery({
    queryKey: ['glossary'],
    queryFn: () => translationService.getGlossary(),
    select: (res: any) => res.data?.data || res.data || [],
  });
}

export function useCreateTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { term_en: string; term_ko?: string; term_vi?: string; category?: string; context?: string }) =>
      translationService.createTerm(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] });
    },
  });
}

export function useUpdateTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ glsId, dto }: { glsId: string; dto: any }) =>
      translationService.updateTerm(glsId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] });
    },
  });
}

export function useDeleteTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (glsId: string) => translationService.deleteTerm(glsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] });
    },
  });
}
