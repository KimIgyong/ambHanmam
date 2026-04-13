import { apiClient } from '@/lib/api-client';
import { TodoResponse, TodoStatusLogResponse, TodoCommentResponse, BaseSingleResponse } from '@amb/types';

interface TodoListResponse {
  success: boolean;
  data: TodoResponse[];
  timestamp: string;
}

interface StatusLogListResponse {
  success: boolean;
  data: TodoStatusLogResponse[];
  timestamp: string;
}

interface TodoCommentListResponse {
  success: boolean;
  data: TodoCommentResponse[];
  timestamp: string;
}

class TodoService {
  private readonly basePath = '/todos';

  getTodos = (params?: { status?: string; date_from?: string; date_to?: string }) =>
    apiClient
      .get<TodoListResponse>(this.basePath, { params })
      .then((r) => r.data.data);

  getTodoById = (id: string) =>
    apiClient
      .get<{ success: boolean; data: TodoResponse }>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  getGroupTodos = (params?: { status?: string; date_from?: string; date_to?: string; search?: string }) =>
    apiClient
      .get<TodoListResponse>(`${this.basePath}/cell`, { params })
      .then((r) => r.data.data);

  getUnitTodos = (params?: { status?: string; date_from?: string; date_to?: string; search?: string }) =>
    apiClient
      .get<TodoListResponse>(`${this.basePath}/unit`, { params })
      .then((r) => r.data.data);

  getCompanyTodos = (params?: { status?: string; date_from?: string; date_to?: string; search?: string }) =>
    apiClient
      .get<TodoListResponse>(`${this.basePath}/company`, { params })
      .then((r) => r.data.data);

  createTodo = (data: { title: string; description?: string; start_date?: string; due_date?: string; tags?: string; issue_id?: string; project_id?: string; participant_ids?: string[] }) =>
    apiClient
      .post<BaseSingleResponse<TodoResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateTodo = (id: string, data: { title?: string; description?: string; status?: string; start_date?: string; due_date?: string; tags?: string; issue_id?: string | null; project_id?: string | null; participant_ids?: string[]; recurrence_type?: string | null; recurrence_day?: number | null; due_date_change_note?: string }) =>
    apiClient
      .patch<BaseSingleResponse<TodoResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  completeTodo = (id: string) =>
    apiClient
      .patch<BaseSingleResponse<TodoResponse>>(`${this.basePath}/${id}/complete`)
      .then((r) => r.data.data);

  reopenTodo = (id: string) =>
    apiClient
      .patch<BaseSingleResponse<TodoResponse>>(`${this.basePath}/${id}/reopen`)
      .then((r) => r.data.data);

  deleteTodo = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  getStatusLogs = (id: string) =>
    apiClient
      .get<StatusLogListResponse>(`${this.basePath}/${id}/status-logs`)
      .then((r) => r.data.data);

  getTodoComments = (todoId: string) =>
    apiClient
      .get<TodoCommentListResponse>(`${this.basePath}/${todoId}/comments`)
      .then((r) => r.data.data);

  addTodoComment = (todoId: string, data: { content: string }) =>
    apiClient
      .post<BaseSingleResponse<TodoCommentResponse>>(`${this.basePath}/${todoId}/comments`, data)
      .then((r) => r.data.data);

  deleteTodoComment = (commentId: string) =>
    apiClient.delete(`${this.basePath}/comments/${commentId}`);

  // ─── Ratings ─────────────────────────────────────────────────
  upsertRating = (todoId: string, rating: number) =>
    apiClient.put(`/content-ratings/todos/${todoId}`, { rating });

  deleteRating = (todoId: string) =>
    apiClient.delete(`/content-ratings/todos/${todoId}`);
}

export const todoService = new TodoService();
