import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { asanaIntegrationService } from '../service/asana-integration.service';

/* ── Query Keys ── */

export const asanaKeys = {
  all: ['asana'] as const,
  config: () => [...asanaKeys.all, 'config'] as const,
  mappings: () => [...asanaKeys.all, 'mappings'] as const,
};

/* ── PAT Config Hooks ── */

export const useAsanaConfig = () =>
  useQuery({
    queryKey: asanaKeys.config(),
    queryFn: () => asanaIntegrationService.getConfig(),
    staleTime: 2 * 60 * 1000,
  });

export const useSaveAsanaConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => asanaIntegrationService.saveConfig(value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asanaKeys.config() });
    },
  });
};

export const useDeleteAsanaConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => asanaIntegrationService.deleteConfig(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asanaKeys.config() });
    },
  });
};

export const useTestAsanaConnection = () => {
  return useMutation({
    mutationFn: () => asanaIntegrationService.testConnection(),
  });
};

/* ── Mapping Hooks ── */

export const useAsanaMappings = () =>
  useQuery({
    queryKey: asanaKeys.mappings(),
    queryFn: () => asanaIntegrationService.getMappings(),
    staleTime: 2 * 60 * 1000,
  });

export const useCreateAsanaMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      asana_project_gid: string;
      asana_project_name?: string;
      project_id?: string;
    }) => asanaIntegrationService.createMapping(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asanaKeys.mappings() });
    },
  });
};

export const useDeleteAsanaMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => asanaIntegrationService.deleteMapping(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asanaKeys.mappings() });
    },
  });
};

/* ── Import Hook ── */

export const useImportAsanaTasks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mappingId, data }: {
      mappingId: string;
      data?: { completed_filter?: 'all' | 'active' | 'completed' };
    }) => asanaIntegrationService.importTasks(mappingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: asanaKeys.mappings() });
    },
  });
};
