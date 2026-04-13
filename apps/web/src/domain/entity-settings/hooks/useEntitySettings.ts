import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  entitySettingsService,
  InviteMemberDto,
  UpdateMemberDto,
  SetPermissionDto,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  UpdateDriveDto,
  SetQuotaDto,
  CreateCustomAppDto,
  UpdateCustomAppDto,
  SetEntityMenuConfigDto,
} from '../service/entity-settings.service';

/* ── Query Keys ── */

export const entitySettingsKeys = {
  all: ['entity-settings'] as const,
  members: () => [...entitySettingsKeys.all, 'members'] as const,
  invitations: () => [...entitySettingsKeys.all, 'invitations'] as const,
  availableMenus: () => [...entitySettingsKeys.all, 'available-menus'] as const,
  menuConfigs: () => [...entitySettingsKeys.all, 'menu-configs'] as const,
  memberPermissions: (userId: string) =>
    [...entitySettingsKeys.all, 'permissions', userId] as const,
  units: () => [...entitySettingsKeys.all, 'units'] as const,
  unitPermissions: (unitName: string) =>
    [...entitySettingsKeys.all, 'unit-permissions', unitName] as const,
  cells: () => [...entitySettingsKeys.all, 'cells'] as const,
  cellPermissions: (cellId: string) =>
    [...entitySettingsKeys.all, 'cell-permissions', cellId] as const,
  apiKeys: () => [...entitySettingsKeys.all, 'api-keys'] as const,
  drive: () => [...entitySettingsKeys.all, 'drive'] as const,
  usage: () => [...entitySettingsKeys.all, 'usage'] as const,
  dailyHistory: (yearMonth?: string) => [...entitySettingsKeys.all, 'daily-history', yearMonth] as const,
  quota: () => [...entitySettingsKeys.all, 'quota'] as const,
  customApps: (entityId?: string) => [...entitySettingsKeys.all, 'custom-apps', entityId ?? 'own'] as const,
  myCustomApps: () => [...entitySettingsKeys.all, 'my-custom-apps'] as const,
  appStoreSubscriptions: (entityId?: string) => [...entitySettingsKeys.all, 'app-store-subscriptions', entityId ?? 'own'] as const,
  workStatsOverview: (startDate: string, endDate: string) =>
    [...entitySettingsKeys.all, 'work-stats-overview', startDate, endDate] as const,
};

/* ── Members ── */

export const useEntityMembers = () =>
  useQuery({
    queryKey: entitySettingsKeys.members(),
    queryFn: entitySettingsService.getMembers,
  });

export const useInviteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteMemberDto) => entitySettingsService.inviteMember(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.invitations() });
      qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
    },
  });
};

export const useUpdateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: UpdateMemberDto }) =>
      entitySettingsService.updateMember(userId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
    },
  });
};

export const useOrgUnits = () =>
  useQuery({
    queryKey: [...entitySettingsKeys.all, 'org-units'],
    queryFn: entitySettingsService.getOrgUnits,
  });

export const useOrgCells = () =>
  useQuery({
    queryKey: [...entitySettingsKeys.all, 'org-cells'],
    queryFn: entitySettingsService.getOrgCells,
  });

export const useChangeMemberUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, unitId }: { userId: string; unitId: string }) =>
      entitySettingsService.changeMemberUnit(userId, unitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
    },
  });
};

export const useAddMemberCell = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, cellId }: { userId: string; cellId: string }) =>
      entitySettingsService.addMemberCell(userId, cellId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
      await qc.refetchQueries({ queryKey: entitySettingsKeys.members(), type: 'active' });
    },
  });
};

export const useRemoveMemberCell = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, cellId }: { userId: string; cellId: string }) =>
      entitySettingsService.removeMemberCell(userId, cellId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
      await qc.refetchQueries({ queryKey: entitySettingsKeys.members(), type: 'active' });
    },
  });
};

/* ── HR Employee ── */

export const useAvailableEmployees = (userId: string | null) =>
  useQuery({
    queryKey: [...entitySettingsKeys.all, 'available-employees', userId],
    queryFn: () => entitySettingsService.getAvailableEmployees(userId!),
    enabled: !!userId,
  });

export const useLinkEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, employeeId }: { userId: string; employeeId: string }) =>
      entitySettingsService.linkEmployee(userId, employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
    },
  });
};

export const useUnlinkEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => entitySettingsService.unlinkEmployee(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
    },
  });
};

/* ── Invitations ── */

export const useEntityInvitations = () =>
  useQuery({
    queryKey: entitySettingsKeys.invitations(),
    queryFn: entitySettingsService.getInvitations,
  });

export const useCancelInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entitySettingsService.cancelInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.invitations() });
    },
  });
};

export const useResendInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entitySettingsService.resendInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.invitations() });
    },
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => entitySettingsService.removeMember(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
    },
  });
};

export const useResetMemberPassword = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, mode }: { userId: string; mode: 'email' | 'generate' }) =>
      entitySettingsService.resetMemberPassword(userId, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.members() });
    },
  });
};

export const useDeleteInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entitySettingsService.deleteInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.invitations() });
    },
  });
};

/* ── Permissions ── */

export const useAvailableMenus = () =>
  useQuery({
    queryKey: entitySettingsKeys.availableMenus(),
    queryFn: entitySettingsService.getAvailableMenus,
  });

export const useEntityMenuConfigs = () =>
  useQuery({
    queryKey: entitySettingsKeys.menuConfigs(),
    queryFn: entitySettingsService.getEntityMenuConfigs,
  });

export const useSetEntityMenuConfigs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetEntityMenuConfigDto) => entitySettingsService.setEntityMenuConfigs(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.menuConfigs() });
      qc.invalidateQueries({ queryKey: entitySettingsKeys.availableMenus() });
    },
  });
};

export const useResetEntityMenuConfigs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => entitySettingsService.resetEntityMenuConfigs(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.menuConfigs() });
      qc.invalidateQueries({ queryKey: entitySettingsKeys.availableMenus() });
    },
  });
};

// Unit permissions
export const useUnits = () =>
  useQuery({
    queryKey: entitySettingsKeys.units(),
    queryFn: entitySettingsService.getUnits,
  });

export const useUnitPermissions = (unitName: string | null) =>
  useQuery({
    queryKey: entitySettingsKeys.unitPermissions(unitName || ''),
    queryFn: () => entitySettingsService.getUnitPermissions(unitName!),
    enabled: !!unitName,
  });

export const useSetUnitPermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitName, dto }: { unitName: string; dto: SetPermissionDto }) =>
      entitySettingsService.setUnitPermissions(unitName, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: entitySettingsKeys.unitPermissions(variables.unitName),
      });
    },
  });
};

// Cell permissions
export const useCells = () =>
  useQuery({
    queryKey: entitySettingsKeys.cells(),
    queryFn: entitySettingsService.getCells,
  });

export const useCellPermissions = (cellId: string | null) =>
  useQuery({
    queryKey: entitySettingsKeys.cellPermissions(cellId || ''),
    queryFn: () => entitySettingsService.getCellPermissions(cellId!),
    enabled: !!cellId,
  });

export const useSetCellPermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, dto }: { cellId: string; dto: SetPermissionDto }) =>
      entitySettingsService.setCellPermissions(cellId, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: entitySettingsKeys.cellPermissions(variables.cellId),
      });
    },
  });
};

// Individual permissions
export const useMemberPermissions = (userId: string | null) =>
  useQuery({
    queryKey: entitySettingsKeys.memberPermissions(userId || ''),
    queryFn: () => entitySettingsService.getMemberPermissions(userId!),
    enabled: !!userId,
  });

export const useSetMemberPermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, dto }: { userId: string; dto: SetPermissionDto }) =>
      entitySettingsService.setMemberPermissions(userId, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: entitySettingsKeys.memberPermissions(variables.userId),
      });
    },
  });
};

export const useRemoveMemberPermission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, menuCode }: { userId: string; menuCode: string }) =>
      entitySettingsService.removeMemberPermission(userId, menuCode),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: entitySettingsKeys.memberPermissions(variables.userId),
      });
    },
  });
};

/* ── API Keys ── */

export const useEntityApiKeys = () =>
  useQuery({
    queryKey: entitySettingsKeys.apiKeys(),
    queryFn: entitySettingsService.getApiKeys,
  });

export const useCreateApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateApiKeyDto) => entitySettingsService.createApiKey(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.apiKeys() });
    },
  });
};

export const useUpdateApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateApiKeyDto }) =>
      entitySettingsService.updateApiKey(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.apiKeys() });
    },
  });
};

export const useDeleteApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entitySettingsService.deleteApiKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.apiKeys() });
    },
  });
};

/* ── Drive ── */

export const useEntityDriveSettings = () =>
  useQuery({
    queryKey: entitySettingsKeys.drive(),
    queryFn: entitySettingsService.getDriveSettings,
  });

export const useUpdateDriveSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateDriveDto) => entitySettingsService.updateDriveSettings(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.drive() });
    },
  });
};

export const useTestDriveConnection = () => {
  return useMutation({
    mutationFn: () => entitySettingsService.testDriveConnection(),
  });
};

export const useRevertDriveSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => entitySettingsService.deleteDriveSettings(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.drive() });
    },
  });
};

/* ── Usage ── */

export const useEntityUsageSummary = () =>
  useQuery({
    queryKey: entitySettingsKeys.usage(),
    queryFn: entitySettingsService.getUsageSummary,
  });

export const useEntityDailyHistory = (yearMonth?: string) =>
  useQuery({
    queryKey: entitySettingsKeys.dailyHistory(yearMonth),
    queryFn: () => entitySettingsService.getDailyHistory(yearMonth),
  });

export const useEntityQuota = () =>
  useQuery({
    queryKey: entitySettingsKeys.quota(),
    queryFn: entitySettingsService.getQuota,
  });

export const useSetEntityQuota = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetQuotaDto) => entitySettingsService.setQuota(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.quota() });
      qc.invalidateQueries({ queryKey: entitySettingsKeys.usage() });
    },
  });
};

/* ── Custom Apps ── */

/** Work statistics overview for a date range */
export const useWorkStatsOverview = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: entitySettingsKeys.workStatsOverview(startDate, endDate),
    queryFn: () => entitySettingsService.getWorkStatsOverview(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

/** 관리용 커스텀 앱 전체 목록 */
export const useCustomApps = (entityId?: string) =>
  useQuery({
    queryKey: entitySettingsKeys.customApps(entityId),
    queryFn: () => entitySettingsService.getCustomApps(entityId),
    enabled: entityId !== '',
  });

/** 사이드바용 — 현재 사용자 역할에 맞는 활성 앱 목록 */
export const useMyCustomApps = () =>
  useQuery({
    queryKey: entitySettingsKeys.myCustomApps(),
    queryFn: entitySettingsService.getMyCustomApps,
    staleTime: 2 * 60 * 1000, // 2분
  });

export const useCreateCustomApp = (entityId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCustomAppDto) => entitySettingsService.createCustomApp(dto, entityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.customApps(entityId) });
      qc.invalidateQueries({ queryKey: entitySettingsKeys.myCustomApps() });
    },
  });
};

export const useUpdateCustomApp = (entityId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomAppDto }) =>
      entitySettingsService.updateCustomApp(id, dto, entityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.customApps(entityId) });
      qc.invalidateQueries({ queryKey: entitySettingsKeys.myCustomApps() });
    },
  });
};

export const useDeleteCustomApp = (entityId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entitySettingsService.deleteCustomApp(id, entityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entitySettingsKeys.customApps(entityId) });
      qc.invalidateQueries({ queryKey: entitySettingsKeys.myCustomApps() });
    },
  });
};

export const useAppHealthCheck = (entityId?: string) =>
  useMutation({
    mutationFn: (id: string) => entitySettingsService.healthCheckApp(id, entityId),
  });

export const useAppToken = () =>
  useMutation({
    mutationFn: (appId: string) => entitySettingsService.getAppToken(appId),
  });

/** 앱스토어 구독 앱 목록 */
export const useAppStoreSubscriptions = (entityId?: string) =>
  useQuery({
    queryKey: entitySettingsKeys.appStoreSubscriptions(entityId),
    queryFn: () => entitySettingsService.getAppStoreSubscriptions(entityId),
    enabled: entityId !== '',
  });
