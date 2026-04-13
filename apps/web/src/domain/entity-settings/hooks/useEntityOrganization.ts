import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  entitySettingsService,
  CreateOrgUnitDto,
  UpdateOrgUnitDto,
  CreateOrgCellDto,
  UpdateOrgCellDto,
  UpdateEntityBasicDto,
  UpdateWorkPayrollDto,
  SaveAiConfigDto,
} from '../service/entity-settings.service';

const orgKeys = {
  all: ['entity-settings', 'organization'] as const,
  basicInfo: () => [...orgKeys.all, 'basic-info'] as const,
  workPayroll: () => [...orgKeys.all, 'work-payroll'] as const,
  aiConfig: () => [...orgKeys.all, 'ai-config'] as const,
  units: () => [...orgKeys.all, 'units'] as const,
  cells: () => [...orgKeys.all, 'cells'] as const,
};

/* ── Entity Basic Info ── */

export function useEntityBasicInfo() {
  return useQuery({
    queryKey: orgKeys.basicInfo(),
    queryFn: () => entitySettingsService.getEntityBasicInfo(),
  });
}

export function useUpdateEntityBasicInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEntityBasicDto) => entitySettingsService.updateEntityBasicInfo(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.basicInfo() }),
  });
}

/* ── Work & Payroll ── */

export function useWorkPayroll() {
  return useQuery({
    queryKey: orgKeys.workPayroll(),
    queryFn: () => entitySettingsService.getWorkPayroll(),
  });
}

export function useUpdateWorkPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWorkPayrollDto) => entitySettingsService.updateWorkPayroll(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.workPayroll() }),
  });
}

/* ── AI Config ── */

export function useAiConfig() {
  return useQuery({
    queryKey: orgKeys.aiConfig(),
    queryFn: () => entitySettingsService.getAiConfig(),
  });
}

export function useSaveAiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveAiConfigDto) => entitySettingsService.saveAiConfig(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.aiConfig() }),
  });
}

/* ── Units ── */

export function useOrgUnits() {
  return useQuery({
    queryKey: orgKeys.units(),
    queryFn: () => entitySettingsService.getOrgUnits(),
  });
}

export function useCreateOrgUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrgUnitDto) => entitySettingsService.createOrgUnit(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.units() }),
  });
}

export function useUpdateOrgUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrgUnitDto }) =>
      entitySettingsService.updateOrgUnit(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.units() }),
  });
}

export function useDeleteOrgUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entitySettingsService.deleteOrgUnit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.units() }),
  });
}

/* ── Cells ── */

export function useOrgCells() {
  return useQuery({
    queryKey: orgKeys.cells(),
    queryFn: () => entitySettingsService.getOrgCells(),
  });
}

export function useCreateOrgCell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrgCellDto) => entitySettingsService.createOrgCell(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.cells() }),
  });
}

export function useUpdateOrgCell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrgCellDto }) =>
      entitySettingsService.updateOrgCell(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.cells() }),
  });
}

export function useDeleteOrgCell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entitySettingsService.deleteOrgCell(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: orgKeys.cells() }),
  });
}
