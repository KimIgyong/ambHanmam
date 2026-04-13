import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsSectionService } from '../service/cms-api.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const sectionKeys = {
  all: (entityId?: string) => ['cms-sections', entityId] as const,
  list: (entityId?: string, pageId?: string) => [...sectionKeys.all(entityId), 'list', pageId] as const,
};

export const useSectionList = (pageId: string | null) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: sectionKeys.list(entityId, pageId || ''),
    queryFn: () => cmsSectionService.getSections(pageId!),
    enabled: !!pageId && !!entityId,
    staleTime: 1000 * 30,
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: Parameters<typeof cmsSectionService.createSection>[1] }) =>
      cmsSectionService.createSection(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all(entityId) });
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: Parameters<typeof cmsSectionService.updateSection>[1] }) =>
      cmsSectionService.updateSection(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all(entityId) });
    },
  });
};

export const useReorderSections = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ pageId, items }: { pageId: string; items: { id: string; sort_order: number }[] }) =>
      cmsSectionService.reorderSections(pageId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all(entityId) });
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: (sectionId: string) => cmsSectionService.deleteSection(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all(entityId) });
    },
  });
};
