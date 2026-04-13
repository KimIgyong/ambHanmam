import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kmsService } from '../service/kms.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const KEYS = {
  all: ['kms', 'tags'] as const,
  tree: (entityId?: string) => ['kms', 'tags', 'tree', entityId] as const,
  search: (entityId?: string, q?: string) => ['kms', 'tags', 'search', entityId, q] as const,
  autocomplete: (entityId?: string, prefix?: string) => ['kms', 'tags', 'autocomplete', entityId, prefix] as const,
  detail: (id: string) => ['kms', 'tags', id] as const,
  workItemTags: (witId: string) => ['kms', 'items', witId, 'tags'] as const,
};

export function useTagTree() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.tree(entityId),
    queryFn: kmsService.getTagTree,
    enabled: !!entityId,
  });
}

export function useTagSearch(query: string, enabled = true) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.search(entityId, query),
    queryFn: () => kmsService.searchTags(query),
    enabled: !!entityId && enabled && query.length > 0,
  });
}

export function useTagAutocomplete(prefix: string, enabled = true) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.autocomplete(entityId, prefix),
    queryFn: () => kmsService.autocomplete(prefix),
    enabled: !!entityId && enabled && prefix.length > 0,
  });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => kmsService.getTag(id),
    enabled: !!id,
  });
}

export function useWorkItemTags(witId: string) {
  return useQuery({
    queryKey: KEYS.workItemTags(witId),
    queryFn: () => kmsService.getWorkItemTags(witId),
    enabled: !!witId,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kmsService.createTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof kmsService.updateTag>[1] }) =>
      kmsService.updateTag(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kmsService.deleteTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useAssignTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ witId, data }: { witId: string; data: Parameters<typeof kmsService.assignTag>[1] }) =>
      kmsService.assignTag(witId, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.workItemTags(vars.witId) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useRemoveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ witId, tagId }: { witId: string; tagId: string }) =>
      kmsService.removeTag(witId, tagId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.workItemTags(vars.witId) });
    },
  });
}
