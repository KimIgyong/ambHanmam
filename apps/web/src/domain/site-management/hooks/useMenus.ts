import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsMenuService } from '../service/cms-api.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const menuKeys = {
  all: (entityId?: string) => ['cms-menus', entityId] as const,
  tree: (entityId?: string) => [...menuKeys.all(entityId), 'tree'] as const,
};

export const useMenuTree = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: menuKeys.tree(entityId),
    queryFn: () => cmsMenuService.getMenuTree(),
    enabled: !!entityId,
    staleTime: 1000 * 60,
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: (data: Parameters<typeof cmsMenuService.createMenu>[0]) =>
      cmsMenuService.createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all(entityId) });
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof cmsMenuService.updateMenu>[1] }) =>
      cmsMenuService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all(entityId) });
    },
  });
};

export const useReorderMenus = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: (items: Parameters<typeof cmsMenuService.reorderMenus>[0]) =>
      cmsMenuService.reorderMenus(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all(entityId) });
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useMutation({
    mutationFn: (id: string) => cmsMenuService.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all(entityId) });
    },
  });
};
