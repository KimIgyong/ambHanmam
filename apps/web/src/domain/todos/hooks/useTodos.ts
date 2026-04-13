import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoService } from '../service/todo.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const todoKeys = {
  all: ['todos'] as const,
  list: (entityId?: string, filters?: Record<string, string>) => [...todoKeys.all, 'list', entityId, filters] as const,
  detail: (id: string) => [...todoKeys.all, 'detail', id] as const,
  groupList: (entityId?: string, filters?: Record<string, string>) => [...todoKeys.all, 'group', entityId, filters] as const,
  unitList: (entityId?: string, filters?: Record<string, string>) => [...todoKeys.all, 'unit', entityId, filters] as const,
  companyList: (entityId?: string, filters?: Record<string, string>) => [...todoKeys.all, 'company', entityId, filters] as const,
  statusLogs: (id: string) => [...todoKeys.all, 'status-logs', id] as const,
  comments: (todoId: string) => [...todoKeys.all, 'comments', todoId] as const,
};

export const useTodoList = (
  filters?: { status?: string; date_from?: string; date_to?: string; enabled?: boolean },
) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const { enabled, ...queryFilters } = filters || {};
  return useQuery({
    queryKey: todoKeys.list(entityId, queryFilters as Record<string, string>),
    queryFn: () => todoService.getTodos(Object.keys(queryFilters).length ? queryFilters : undefined),
    staleTime: 1000 * 60,
    enabled: !!entityId && enabled !== false,
  });
};

export const useTodoDetail = (todoId: string | null) => {
  return useQuery({
    queryKey: todoKeys.detail(todoId!),
    queryFn: () => todoService.getTodoById(todoId!),
    enabled: !!todoId,
    staleTime: 1000 * 30,
  });
};

export const useGroupTodos = (
  filters?: { status?: string; date_from?: string; date_to?: string; search?: string; enabled?: boolean },
) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const { enabled, ...queryFilters } = filters || {};
  return useQuery({
    queryKey: todoKeys.groupList(entityId, queryFilters as Record<string, string>),
    queryFn: () => todoService.getGroupTodos(Object.keys(queryFilters).length ? queryFilters : undefined),
    staleTime: 1000 * 60,
    enabled: !!entityId && enabled !== false,
  });
};

export const useUnitTodos = (
  filters?: { status?: string; date_from?: string; date_to?: string; search?: string; enabled?: boolean },
) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const { enabled, ...queryFilters } = filters || {};
  return useQuery({
    queryKey: todoKeys.unitList(entityId, queryFilters as Record<string, string>),
    queryFn: () => todoService.getUnitTodos(Object.keys(queryFilters).length ? queryFilters : undefined),
    staleTime: 1000 * 60,
    enabled: !!entityId && enabled !== false,
  });
};

export const useCompanyTodos = (
  filters?: { status?: string; date_from?: string; date_to?: string; search?: string; enabled?: boolean },
) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const { enabled, ...queryFilters } = filters || {};
  return useQuery({
    queryKey: todoKeys.companyList(entityId, queryFilters as Record<string, string>),
    queryFn: () => todoService.getCompanyTodos(Object.keys(queryFilters).length ? queryFilters : undefined),
    staleTime: 1000 * 60,
    enabled: !!entityId && enabled !== false,
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; start_date?: string; due_date?: string; tags?: string; issue_id?: string; participant_ids?: string[] }) =>
      todoService.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; description?: string; status?: string; due_date?: string; tags?: string; issue_id?: string | null; project_id?: string | null; participant_ids?: string[]; recurrence_type?: string | null; recurrence_day?: number | null; due_date_change_note?: string } }) =>
      todoService.updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todoService.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};

export const useCompleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todoService.completeTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};

export const useReopenTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todoService.reopenTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};

export const useTodoStatusLogs = (todoId: string | null) => {
  return useQuery({
    queryKey: todoKeys.statusLogs(todoId || ''),
    queryFn: () => todoService.getStatusLogs(todoId!),
    enabled: !!todoId,
    staleTime: 1000 * 30,
  });
};

export const useTodoComments = (todoId: string | null) => {
  return useQuery({
    queryKey: todoKeys.comments(todoId || ''),
    queryFn: () => todoService.getTodoComments(todoId!),
    enabled: !!todoId,
    staleTime: 1000 * 30,
  });
};

export const useAddTodoComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, content }: { todoId: string; content: string }) =>
      todoService.addTodoComment(todoId, { content }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.comments(variables.todoId) });
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.todoId) });
    },
  });
};

export const useDeleteTodoComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => todoService.deleteTodoComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};

export const useUpsertTodoRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ todoId, rating }: { todoId: string; rating: number }) =>
      todoService.upsertRating(todoId, rating),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.todoId) });
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};

export const useDeleteTodoRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todoId: string) => todoService.deleteRating(todoId),
    onSuccess: (_data, todoId) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(todoId) });
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
};
