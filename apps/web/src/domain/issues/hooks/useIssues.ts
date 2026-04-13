import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueService } from '../service/issue.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const issueKeys = {
  all: ['issues'] as const,
  list: (entityId?: string, filters?: Record<string, string | number | undefined>) =>
    [...issueKeys.all, 'list', entityId, filters] as const,
  detail: (id: string) => [...issueKeys.all, 'detail', id] as const,
  comments: (issueId: string) => [...issueKeys.all, 'comments', issueId] as const,
  statusLogs: (issueId: string) => [...issueKeys.all, 'status-logs', issueId] as const,
  filterPresets: [...['issues'], 'filter-presets'] as const,
};

export const useIssueList = (filters?: {
  type?: string;
  status?: string;
  severity?: string;
  priority?: string;
  search?: string;
  project_id?: string;
  scope?: string;
  reporter_id?: string;
  cell_id?: string;
  page?: number;
  size?: number;
  enabled?: boolean;
}) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const { enabled, ...queryFilters } = filters || {};
  return useQuery({
    queryKey: issueKeys.list(entityId, queryFilters),
    queryFn: () => issueService.getIssues(Object.keys(queryFilters).length ? queryFilters : undefined),
    staleTime: 1000 * 60,
    enabled: !!entityId && enabled !== false,
  });
};

export const useIssueDetail = (id: string | null) => {
  return useQuery({
    queryKey: issueKeys.detail(id || ''),
    queryFn: () => issueService.getIssueById(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: string;
      title: string;
      description: string;
      severity: string;
      priority?: number;
      affected_modules?: string[];
      assignee_id?: string | null;
      source_todo_id?: string;
      source_todo_title?: string;
    }) => issueService.createIssue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: {
        type?: string;
        title?: string;
        description?: string;
        severity?: string;
        priority?: number;
        affected_modules?: string[];
        assignee_id?: string | null;
        resolution?: string;
      };
    }) => issueService.updateIssue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      issueService.updateIssueStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useApproveIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      issueService.approveIssue(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useRejectIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      issueService.rejectIssue(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => issueService.deleteIssue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const usePermanentDeleteIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => issueService.permanentDeleteIssue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useIssueComments = (issueId: string | null) => {
  return useQuery({
    queryKey: issueKeys.comments(issueId || ''),
    queryFn: () => issueService.getIssueComments(issueId!),
    enabled: !!issueId,
    staleTime: 1000 * 30,
  });
};

export const useAddIssueComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, content, parentId, clientVisible }: { issueId: string; content: string; parentId?: string; clientVisible?: boolean }) =>
      issueService.addIssueComment(issueId, { content, parent_id: parentId, client_visible: clientVisible }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.comments(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
    },
  });
};

export const useDeleteIssueComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, commentId }: { issueId: string; commentId: string }) =>
      issueService.deleteIssueComment(issueId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.comments(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
    },
  });
};

export const useToggleCommentReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, commentId, type }: { issueId: string; commentId: string; type: string }) =>
      issueService.toggleCommentReaction(issueId, commentId, type),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.comments(variables.issueId) });
    },
  });
};

export const useToggleClientVisible = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, commentId, clientVisible }: { issueId: string; commentId: string; clientVisible: boolean }) =>
      issueService.toggleCommentClientVisible(issueId, commentId, clientVisible),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.comments(variables.issueId) });
    },
  });
};

export const useIssueStatusLogs = (issueId: string | null) => {
  return useQuery({
    queryKey: issueKeys.statusLogs(issueId || ''),
    queryFn: () => issueService.getIssueStatusLogs(issueId!),
    enabled: !!issueId,
    staleTime: 1000 * 30,
  });
};

export const useMyIssues = (size = 5) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: [...issueKeys.all, 'my', entityId, size],
    queryFn: () => issueService.getMyIssues({ size }),
    staleTime: 1000 * 60,
    enabled: !!entityId,
  });
};

export const useFilterPresets = () => {
  return useQuery({
    queryKey: issueKeys.filterPresets,
    queryFn: () => issueService.getFilterPresets(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSaveFilterPresets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (presets: Array<{ name: string; filters: Record<string, any> }>) =>
      issueService.saveFilterPresets(presets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.filterPresets });
    },
  });
};

export const useUpsertIssueRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, rating }: { issueId: string; rating: number }) =>
      issueService.upsertRating(issueId, rating),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useDeleteIssueRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (issueId: string) => issueService.deleteRating(issueId),
    onSuccess: (_data, issueId) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};
