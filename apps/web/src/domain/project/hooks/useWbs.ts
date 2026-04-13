import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wbsApiService } from '../service/wbs.service';

const wbsKeys = {
  all: (projectId: string) => ['projects', projectId, 'wbs'] as const,
  tree: (projectId: string, params?: { include_closed?: boolean }) =>
    [...wbsKeys.all(projectId), 'tree', params] as const,
  epics: (projectId: string) => [...wbsKeys.all(projectId), 'epics'] as const,
  components: (projectId: string) => [...wbsKeys.all(projectId), 'components'] as const,
};

export const useWbsTree = (projectId: string, params?: { include_closed?: boolean }) => {
  return useQuery({
    queryKey: wbsKeys.tree(projectId, params),
    queryFn: () => wbsApiService.getWbsTree(projectId, params),
    enabled: !!projectId,
  });
};

export const useEpics = (projectId: string, params?: { include_closed?: boolean }) => {
  return useQuery({
    queryKey: wbsKeys.epics(projectId),
    queryFn: () => wbsApiService.getEpics(projectId, params),
    enabled: !!projectId,
  });
};

export const useComponents = (projectId: string) => {
  return useQuery({
    queryKey: wbsKeys.components(projectId),
    queryFn: () => wbsApiService.getComponents(projectId),
    enabled: !!projectId,
  });
};

export const useCreateEpic = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; status?: string; color?: string; start_date?: string; due_date?: string }) =>
      wbsApiService.createEpic(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
    },
  });
};

export const useUpdateEpic = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ epicId, data }: { epicId: string; data: Record<string, unknown> }) =>
      wbsApiService.updateEpic(projectId, epicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
    },
  });
};

export const useDeleteEpic = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (epicId: string) => wbsApiService.deleteEpic(projectId, epicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
    },
  });
};

export const useCreateComponent = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; color?: string; owner_id?: string }) =>
      wbsApiService.createComponent(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
    },
  });
};

export const useUpdateComponent = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ componentId, data }: { componentId: string; data: Record<string, unknown> }) =>
      wbsApiService.updateComponent(projectId, componentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
    },
  });
};

export const useDeleteComponent = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (componentId: string) => wbsApiService.deleteComponent(projectId, componentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
    },
  });
};

export const useUpdateIssueGroup = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: { group_type: 'epic' | 'component' | 'unassigned'; group_id?: string } }) =>
      wbsApiService.updateIssueGroup(projectId, issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wbsKeys.all(projectId) });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
    },
  });
};
