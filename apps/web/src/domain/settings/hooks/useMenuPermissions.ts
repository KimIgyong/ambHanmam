import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../service/settings.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const permissionKeys = {
  all: ['menuPermissions'] as const,
  list: () => [...permissionKeys.all, 'list'] as const,
  my: (entityId?: string) => [...permissionKeys.all, 'my', entityId ?? 'none'] as const,
  configs: () => [...permissionKeys.all, 'configs'] as const,
  userPerms: () => [...permissionKeys.all, 'userPerms'] as const,
  userPerm: (userId: string) => [...permissionKeys.all, 'userPerm', userId] as const,
  groupPerms: () => [...permissionKeys.all, 'groupPerms'] as const,
};

// ── 역할별 권한 ──

export const useMenuPermissionList = () => {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: () => settingsService.getMenuPermissions(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateMenuPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      permissions: Array<{ menu_code: string; role: string; accessible: boolean }>;
    }) => settingsService.updateMenuPermissions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.list() });
      queryClient.invalidateQueries({ queryKey: permissionKeys.my() });
    },
  });
};

// ── 내 메뉴 (통합 판정 결과) ──

export const useMyMenus = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: permissionKeys.my(entityId),
    queryFn: () => settingsService.getMyMenus(),
    staleTime: 1000 * 60 * 2,
    enabled: !!entityId,
  });
};

/** @deprecated useMyMenus 사용 권장 — 하위호환용 */
export const useMyPermissions = () => {
  const query = useMyMenus();
  return {
    ...query,
    data: query.data?.map((m) => m.menuCode),
  };
};

// ── 메뉴 설정 (순서/노출) ──

export const useMenuConfigs = () => {
  return useQuery({
    queryKey: permissionKeys.configs(),
    queryFn: () => settingsService.getMenuConfigs(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateMenuConfigs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      configs: Array<{ menu_code: string; enabled: boolean; sort_order: number }>;
    }) => settingsService.updateMenuConfigs(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.configs() });
      queryClient.invalidateQueries({ queryKey: permissionKeys.my() });
    },
  });
};

export const usePatchMenuConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuCode, data }: { menuCode: string; data: { enabled?: boolean; sort_order?: number } }) =>
      settingsService.patchMenuConfig(menuCode, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.configs() });
      queryClient.invalidateQueries({ queryKey: permissionKeys.my() });
    },
  });
};

// ── 사용자별 권한 ──

export const useAllUserPermissions = () => {
  return useQuery({
    queryKey: permissionKeys.userPerms(),
    queryFn: () => settingsService.getAllUserPermissions(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserPermissions = (userId: string) => {
  return useQuery({
    queryKey: permissionKeys.userPerm(userId),
    queryFn: () => settingsService.getUserPermissions(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSetUserPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: {
      userId: string;
      data: { permissions: Array<{ menu_code: string; accessible: boolean }> };
    }) => settingsService.setUserPermissions(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.userPerms() });
      queryClient.invalidateQueries({ queryKey: permissionKeys.my() });
    },
  });
};

export const useRemoveUserPermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, menuCode }: { userId: string; menuCode: string }) =>
      settingsService.removeUserPermission(userId, menuCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.userPerms() });
      queryClient.invalidateQueries({ queryKey: permissionKeys.my() });
    },
  });
};

// ── 그룹별 권한 ──

export const useMenuGroupPermissions = () => {
  return useQuery({
    queryKey: permissionKeys.groupPerms(),
    queryFn: () => settingsService.getMenuGroupPermissions(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateMenuGroupPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      permissions: Array<{ menu_code: string; cel_id: string; accessible: boolean }>;
    }) => settingsService.updateMenuGroupPermissions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.groupPerms() });
      queryClient.invalidateQueries({ queryKey: permissionKeys.my() });
    },
  });
};
