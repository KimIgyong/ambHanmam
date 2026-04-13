import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsPageService } from '../service/cms-api.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const pageKeys = {
  all: (entityId?: string) => ['cms-pages', entityId] as const,
  list: (entityId?: string, filters?: Record<string, string | undefined>) => [...pageKeys.all(entityId), 'list', filters] as const,
  detail: (id: string) => ['cms-pages', 'detail', id] as const,
  versions: (id: string) => ['cms-pages', 'versions', id] as const,
};

export const usePageList = (filters?: { status?: string; type?: string; search?: string }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: pageKeys.list(entityId, filters),
    queryFn: () => cmsPageService.getPages(filters),
    enabled: !!entityId,
    staleTime: 1000 * 60,
  });
};

export const usePageDetail = (id: string | null) => {
  return useQuery({
    queryKey: pageKeys.detail(id || ''),
    queryFn: () => cmsPageService.getPageById(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cmsPageService.updatePage>[1] }) =>
      cmsPageService.updatePage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all(entityId) });
    },
  });
};

export const useSaveContent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: { content: string; lang?: string } }) =>
      cmsPageService.saveContent(pageId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pageKeys.detail(variables.pageId) });
    },
  });
};

export const usePublishPage = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ pageId, note }: { pageId: string; note?: string }) =>
      cmsPageService.publishPage(pageId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all(entityId) });
    },
  });
};

export const useUnpublishPage = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: (pageId: string) => cmsPageService.unpublishPage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all(entityId) });
    },
  });
};

export const usePageVersions = (pageId: string | null) => {
  return useQuery({
    queryKey: pageKeys.versions(pageId || ''),
    queryFn: () => cmsPageService.getVersions(pageId!),
    enabled: !!pageId,
    staleTime: 1000 * 30,
  });
};

export const useRollbackVersion = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ pageId, versionId }: { pageId: string; versionId: string }) =>
      cmsPageService.rollback(pageId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all(entityId) });
    },
  });
};
