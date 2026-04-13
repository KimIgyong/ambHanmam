import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsPostService } from '../service/cms-api.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const postKeys = {
  all: (entityId?: string) => ['cms-posts', entityId] as const,
  list: (entityId?: string, pageId?: string, filters?: Record<string, string | number | undefined>) =>
    [...postKeys.all(entityId), 'list', pageId, filters] as const,
  detail: (id: string) => ['cms-posts', 'detail', id] as const,
  categories: (entityId?: string, pageId?: string) => [...postKeys.all(entityId), 'categories', pageId] as const,
};

export const usePostList = (pageId: string | null, filters?: {
  category_id?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: postKeys.list(entityId, pageId || '', filters),
    queryFn: () => cmsPostService.getPosts(pageId!, filters),
    enabled: !!pageId && !!entityId,
    staleTime: 1000 * 30,
  });
};

export const usePostDetail = (postId: string | null) => {
  return useQuery({
    queryKey: postKeys.detail(postId || ''),
    queryFn: () => cmsPostService.getPostById(postId!),
    enabled: !!postId,
    staleTime: 1000 * 30,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: Parameters<typeof cmsPostService.createPost>[1] }) =>
      cmsPostService.createPost(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all(entityId) });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: Parameters<typeof cmsPostService.updatePost>[1] }) =>
      cmsPostService.updatePost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all(entityId) });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: (postId: string) => cmsPostService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all(entityId) });
    },
  });
};

export const usePostCategories = (pageId: string | null) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: postKeys.categories(entityId, pageId || ''),
    queryFn: () => cmsPostService.getCategories(pageId!),
    enabled: !!pageId && !!entityId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ pageId, name }: { pageId: string; name: string }) =>
      cmsPostService.createCategory(pageId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all(entityId) });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: (categoryId: string) => cmsPostService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all(entityId) });
    },
  });
};
