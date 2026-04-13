import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitService } from '../service/unit.service';

export function useUnitTree(entityId: string) {
  return useQuery({
    queryKey: ['units', 'tree', entityId],
    queryFn: () => unitService.getUnitTree(entityId),
    enabled: !!entityId,
  });
}

export function useAllUnits(entityId: string) {
  return useQuery({
    queryKey: ['units', 'all', entityId],
    queryFn: () => unitService.getAllUnits(entityId),
    enabled: !!entityId,
  });
}

export function useUnitMembers(unitId: string) {
  return useQuery({
    queryKey: ['units', unitId, 'members'],
    queryFn: () => unitService.getUnitMembers(unitId),
    enabled: !!unitId,
  });
}

export function useMyRoles() {
  return useQuery({
    queryKey: ['units', 'my', 'roles'],
    queryFn: () => unitService.getMyRoles(),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, entityId }: { data: Parameters<typeof unitService.createUnit>[0]; entityId: string }) =>
      unitService.createUnit(data, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof unitService.updateUnit>[1] }) =>
      unitService.updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitService.deleteUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useAssignUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof unitService.assignUserRole>[0]) =>
      unitService.assignUserRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitService.removeUserRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
