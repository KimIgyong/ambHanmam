import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApiService } from '../service/project.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const projectKeys = {
  all: ['projects'] as const,
  list: (entityId: string | undefined, params?: Record<string, string>) =>
    [...projectKeys.all, 'list', entityId, params] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  members: (id: string) => [...projectKeys.all, 'members', id] as const,
  clients: (id: string) => [...projectKeys.all, 'clients', id] as const,
  similar: (id: string) => [...projectKeys.all, 'similar', id] as const,
  notes: (id: string) => [...projectKeys.all, 'notes', id] as const,
  comments: (id: string) => [...projectKeys.all, 'comments', id] as const,
};

export const useProjectList = (params?: { status?: string; category?: string; priority?: string; search?: string; sort?: string; scope?: string }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: projectKeys.list(entityId, params as Record<string, string>),
    queryFn: () => projectApiService.getProjects(params),
    enabled: !!entityId,
  });
};

export const useProjectDetail = (id: string) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectApiService.getProjectById(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => projectApiService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      projectApiService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectApiService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useSubmitProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      projectApiService.submitProposal(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useProjectMembers = (projectId: string) => {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => projectApiService.getMembers(projectId),
    enabled: !!projectId,
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { user_id: string; role: string } }) =>
      projectApiService.addMember(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, memberId }: { projectId: string; memberId: string }) =>
      projectApiService.removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useSimilarProjects = (id: string) => {
  return useQuery({
    queryKey: projectKeys.similar(id),
    queryFn: () => projectApiService.getSimilarProjects(id),
    enabled: false, // Manual trigger
  });
};

// ── Project Clients (고객사 배정) ──

export const useProjectClients = (projectId: string) => {
  return useQuery({
    queryKey: projectKeys.clients(projectId),
    queryFn: () => projectApiService.getProjectClients(projectId),
    enabled: !!projectId,
  });
};

export const useAddProjectClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, cliId }: { projectId: string; cliId: string }) =>
      projectApiService.addProjectClient(projectId, cliId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useRemoveProjectClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, clientId }: { projectId: string; clientId: string }) =>
      projectApiService.removeProjectClient(projectId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

// ── Project Notes (linked meeting notes) ──

export const useProjectNotes = (projectId: string) => {
  return useQuery({
    queryKey: projectKeys.notes(projectId),
    queryFn: () => projectApiService.getProjectNotes(projectId),
    enabled: !!projectId,
  });
};

// ── Project Comments ──

export const useProjectComments = (projectId: string) => {
  return useQuery({
    queryKey: projectKeys.comments(projectId),
    queryFn: () => projectApiService.getProjectComments(projectId),
    enabled: !!projectId,
  });
};

export const useAddProjectComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, content }: { projectId: string; content: string }) =>
      projectApiService.addProjectComment(projectId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.comments(variables.projectId) });
    },
  });
};

export const useDeleteProjectComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, commentId }: { projectId: string; commentId: string }) =>
      projectApiService.deleteProjectComment(projectId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.comments(variables.projectId) });
    },
  });
};
