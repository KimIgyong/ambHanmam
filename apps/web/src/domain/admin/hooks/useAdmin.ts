import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminService,
  type AdminUserQuery,
  type UpdateEntityBody,
  type UpdateEntityDriveBody,
  type UpdateEntityAiConfigBody,
} from '../service/admin.service';

export const adminKeys = {
  all: ['admin'] as const,
  users: (params: AdminUserQuery) => [...adminKeys.all, 'users', params] as const,
  entityRoles: (params: Record<string, unknown>) => [...adminKeys.all, 'entity-roles', params] as const,
  unitRoles: (params: Record<string, unknown>) => [...adminKeys.all, 'unit-roles', params] as const,
  entities: (params: Record<string, unknown>) => [...adminKeys.all, 'entities', params] as const,
  entityDetail: (entityId: string) => [...adminKeys.all, 'entity-detail', entityId] as const,
  entityMembers: (entityId: string) => [...adminKeys.all, 'entity-members', entityId] as const,
  entityServiceUsage: (entityId: string) => [...adminKeys.all, 'entity-service', entityId] as const,
  entityAiUsage: (entityId: string) => [...adminKeys.all, 'entity-ai', entityId] as const,
  entitiesDriveSettings: () => [...adminKeys.all, 'entities-drive-settings'] as const,
  entitiesAiConfigs: () => [...adminKeys.all, 'entities-ai-configs'] as const,
  userDeletionPreview: (userId: string) => [...adminKeys.all, 'user-deletion-preview', userId] as const,
};

export const useAdminUsers = (params: AdminUserQuery) => {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.getUsers(params),
  });
};

export const useAdminEntityUserRoles = (params: { page?: number; limit?: number; search?: string; entity_id?: string }) => {
  return useQuery({
    queryKey: adminKeys.entityRoles(params),
    queryFn: () => adminService.getEntityUserRoles(params),
  });
};

export const useAdminUnitUserRoles = (params: { page?: number; limit?: number; search?: string; unit_id?: string }) => {
  return useQuery({
    queryKey: adminKeys.unitRoles(params),
    queryFn: () => adminService.getUnitUserRoles(params),
  });
};

export const useDeleteUnitUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uurId: string) => adminService.deleteUnitUserRole(uurId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
};

export const useEntityManagementList = (params: { page?: number; limit?: number; search?: string; status?: string }) => {
  return useQuery({
    queryKey: adminKeys.entities(params),
    queryFn: () => adminService.getEntities(params),
  });
};

export const useEntityManagementDetail = (entityId: string) => {
  return useQuery({
    queryKey: adminKeys.entityDetail(entityId),
    queryFn: () => adminService.getEntityDetail(entityId),
    enabled: !!entityId,
  });
};

export const useEntityServiceUsage = (entityId: string) => {
  return useQuery({
    queryKey: adminKeys.entityServiceUsage(entityId),
    queryFn: () => adminService.getEntityServiceUsage(entityId),
    enabled: !!entityId,
  });
};

export const useEntityAiUsage = (entityId: string) => {
  return useQuery({
    queryKey: adminKeys.entityAiUsage(entityId),
    queryFn: () => adminService.getEntityAiUsage(entityId),
    enabled: !!entityId,
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, data }: { entityId: string; data: UpdateEntityBody }) =>
      adminService.updateEntity(entityId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.entityDetail(variables.entityId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.entities({}) });
    },
  });
};

export const useEntityMembers = (entityId: string) => {
  return useQuery({
    queryKey: adminKeys.entityMembers(entityId),
    queryFn: () => adminService.getEntityMembers(entityId),
    enabled: !!entityId,
  });
};

export const useEntitiesDriveSettings = () => {
  return useQuery({
    queryKey: adminKeys.entitiesDriveSettings(),
    queryFn: () => adminService.getEntitiesDriveSettings(),
  });
};

export const useUpdateEntityDriveSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, data }: { entityId: string; data: UpdateEntityDriveBody }) =>
      adminService.updateEntityDriveSettings(entityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.entitiesDriveSettings() });
    },
  });
};

export const useDeleteEntityDriveSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) => adminService.deleteEntityDriveSettings(entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.entitiesDriveSettings() });
    },
  });
};

export const useEntitiesAiConfigs = () => {
  return useQuery({
    queryKey: adminKeys.entitiesAiConfigs(),
    queryFn: () => adminService.getEntitiesAiConfigs(),
  });
};

export const useUpdateEntityAiConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, data }: { entityId: string; data: UpdateEntityAiConfigBody }) =>
      adminService.updateEntityAiConfig(entityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.entitiesAiConfigs() });
    },
  });
};

export const useUserDeletionPreview = (userId: string, enabled = false) => {
  return useQuery({
    queryKey: adminKeys.userDeletionPreview(userId),
    queryFn: () => adminService.getUserDeletionPreview(userId),
    enabled: !!userId && enabled,
  });
};

export const usePermanentDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, level, confirmEmail }: { userId: string; level: 1 | 2; confirmEmail: string }) =>
      adminService.permanentDeleteUser(userId, { level, confirm_email: confirmEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
};
