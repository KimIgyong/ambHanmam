import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '../service/members.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const cellKeys = {
  all: ['cells'] as const,
  list: (entityId?: string) => [...cellKeys.all, 'list', entityId] as const,
  members: (id: string) => [...cellKeys.all, 'members', id] as const,
};

export const useCellList = (options?: { allEntities?: boolean }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const skipEntityCheck = options?.allEntities ?? false;
  return useQuery({
    queryKey: skipEntityCheck ? cellKeys.list('all') : cellKeys.list(entityId),
    queryFn: () => membersService.getCells(skipEntityCheck),
    enabled: skipEntityCheck || !!entityId,
  });
};

export const useCreateCell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; entity_id?: string }) =>
      membersService.createCell(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cellKeys.list() });
    },
  });
};

export const useUpdateCell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string; entity_id?: string };
    }) => membersService.updateCell(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cellKeys.list() });
    },
  });
};

export const useDeleteCell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.deleteCell(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cellKeys.list() });
    },
  });
};

export const useCellMembers = (cellId: string) => {
  return useQuery({
    queryKey: cellKeys.members(cellId),
    queryFn: () => membersService.getCellMembers(cellId),
    enabled: !!cellId,
  });
};

export const useAddCellMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, userId }: { cellId: string; userId: string }) =>
      membersService.addCellMember(cellId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cellKeys.all });
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
    },
  });
};

export const useRemoveCellMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, userId }: { cellId: string; userId: string }) =>
      membersService.removeCellMember(cellId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cellKeys.all });
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
    },
  });
};
