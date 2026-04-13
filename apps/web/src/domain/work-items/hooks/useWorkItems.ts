import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workItemService } from '../service/work-item.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

export function useWorkItems(params?: {
  type?: string;
  visibility?: string;
  scope?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['work-items', entityId, params],
    queryFn: () => workItemService.getWorkItems(params),
    enabled: !!entityId,
  });
}

export function useWorkItem(id: string) {
  return useQuery({
    queryKey: ['work-items', id],
    queryFn: () => workItemService.getWorkItem(id),
    enabled: !!id,
  });
}

export function useCreateWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof workItemService.createWorkItem>[0]) =>
      workItemService.createWorkItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}

export function useUpdateWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof workItemService.updateWorkItem>[1] }) =>
      workItemService.updateWorkItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}

export function useDeleteWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workItemService.deleteWorkItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}
