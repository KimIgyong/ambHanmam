import { apiClient } from '@/lib/api-client';
import { WorkItemResponse } from '@amb/types';

interface PaginatedResponse {
  success: boolean;
  data: {
    items: WorkItemResponse[];
    total: number;
    page: number;
    limit: number;
  };
}

interface SingleResponse {
  success: boolean;
  data: WorkItemResponse;
}

class WorkItemService {
  private readonly basePath = '/work-items';

  getWorkItems = (params?: {
    type?: string;
    visibility?: string;
    scope?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient
      .get<PaginatedResponse>(this.basePath, { params })
      .then((r) => r.data.data);

  getWorkItem = (id: string) =>
    apiClient
      .get<SingleResponse>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createWorkItem = (data: {
    type: string;
    title: string;
    visibility?: string;
    module?: string;
    ref_id?: string;
    content?: string;
  }) =>
    apiClient
      .post<SingleResponse>(this.basePath, data)
      .then((r) => r.data.data);

  updateWorkItem = (id: string, data: {
    title?: string;
    visibility?: string;
    content?: string;
  }) =>
    apiClient
      .put<SingleResponse>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteWorkItem = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

export const workItemService = new WorkItemService();
