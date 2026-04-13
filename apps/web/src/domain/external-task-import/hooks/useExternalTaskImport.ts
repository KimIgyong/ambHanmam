import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalTaskImportService } from '../service/external-task-import.service';

/* ── Query Keys ── */

export const externalTaskKeys = {
  all: ['external-task'] as const,
  tools: () => [...externalTaskKeys.all, 'tools'] as const,
  providers: () => [...externalTaskKeys.all, 'providers'] as const,
  projects: (provider: string, appId: string) =>
    [...externalTaskKeys.all, 'projects', provider, appId] as const,
  groups: (provider: string, appId: string, projectId: string) =>
    [...externalTaskKeys.all, 'groups', provider, appId, projectId] as const,
  tasks: (provider: string, appId: string, groupId: string, opts?: Record<string, any>) =>
    [...externalTaskKeys.all, 'tasks', provider, appId, groupId, opts] as const,
  imported: (params?: Record<string, any>) =>
    [...externalTaskKeys.all, 'imported', params] as const,
  logs: (params?: Record<string, any>) =>
    [...externalTaskKeys.all, 'logs', params] as const,
};

/* ── 설정 Hooks ── */

export const useExternalTools = () =>
  useQuery({
    queryKey: externalTaskKeys.tools(),
    queryFn: () => externalTaskImportService.getTools(),
    staleTime: 2 * 60 * 1000,
  });

export const useCreateExternalTool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { provider: string; name: string; url?: string; api_key: string }) =>
      externalTaskImportService.createTool(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalTaskKeys.tools() });
      qc.invalidateQueries({ queryKey: externalTaskKeys.providers() });
    },
  });
};

export const useUpdateExternalTool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; url?: string; api_key?: string; is_active?: boolean } }) =>
      externalTaskImportService.updateTool(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalTaskKeys.tools() });
    },
  });
};

export const useDeleteExternalTool = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => externalTaskImportService.deleteTool(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalTaskKeys.tools() });
      qc.invalidateQueries({ queryKey: externalTaskKeys.providers() });
    },
  });
};

export const useTestConnection = () =>
  useMutation({
    mutationFn: (id: string) => externalTaskImportService.testConnection(id),
  });

/* ── 가져오기 Hooks ── */

export const useExternalProviders = () =>
  useQuery({
    queryKey: externalTaskKeys.providers(),
    queryFn: () => externalTaskImportService.getProviders(),
    staleTime: 2 * 60 * 1000,
  });

export const useExternalProjects = (provider: string, appId: string) =>
  useQuery({
    queryKey: externalTaskKeys.projects(provider, appId),
    queryFn: () => externalTaskImportService.getProjects(provider, appId),
    enabled: !!provider && !!appId,
    staleTime: 60 * 1000,
  });

export const useExternalGroups = (provider: string, appId: string, projectId: string) =>
  useQuery({
    queryKey: externalTaskKeys.groups(provider, appId, projectId),
    queryFn: () => externalTaskImportService.getGroups(provider, appId, projectId),
    enabled: !!provider && !!appId && !!projectId,
    staleTime: 60 * 1000,
  });

export const useExternalTasks = (
  provider: string,
  appId: string,
  groupId: string,
  opts?: { cursor?: string; onlyIncomplete?: boolean },
) =>
  useQuery({
    queryKey: externalTaskKeys.tasks(provider, appId, groupId, opts),
    queryFn: () => externalTaskImportService.getTasks(provider, appId, groupId, opts),
    enabled: !!provider && !!appId && !!groupId,
    staleTime: 30 * 1000,
  });

export const useImportTasks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, data }: { provider: string; data: Parameters<typeof externalTaskImportService.importTasks>[1] }) =>
      externalTaskImportService.importTasks(provider, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: externalTaskKeys.imported() });
      qc.invalidateQueries({ queryKey: externalTaskKeys.logs() });
      // Also invalidate task lists so alreadyImported flags get updated
      qc.invalidateQueries({ queryKey: [...externalTaskKeys.all, 'tasks'] });
    },
  });
};

export const useImportedTasks = (params?: { provider?: string; page?: number; size?: number }) =>
  useQuery({
    queryKey: externalTaskKeys.imported(params),
    queryFn: () => externalTaskImportService.getImportedTasks(params),
    staleTime: 30 * 1000,
  });

export const useImportLogs = (params?: { page?: number; size?: number }) =>
  useQuery({
    queryKey: externalTaskKeys.logs(params),
    queryFn: () => externalTaskImportService.getImportLogs(params),
    staleTime: 30 * 1000,
  });
