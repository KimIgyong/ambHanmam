import { apiClient } from '@/lib/api-client';
import { KmsTagResponse, KmsWorkItemTagResponse } from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

class KmsService {
  private readonly basePath = '/kms';

  // Tag CRUD
  getTagTree = () =>
    apiClient
      .get<ListResponse<KmsTagResponse>>(`${this.basePath}/tags/tree`)
      .then((r) => r.data.data);

  searchTags = (query: string, limit = 10) =>
    apiClient
      .get<ListResponse<KmsTagResponse>>(`${this.basePath}/tags/search`, {
        params: { q: query, limit },
      })
      .then((r) => r.data.data);

  autocomplete = (prefix: string, limit = 8) =>
    apiClient
      .get<ListResponse<KmsTagResponse>>(`${this.basePath}/tags/autocomplete`, {
        params: { prefix, limit },
      })
      .then((r) => r.data.data);

  getTag = (id: string) =>
    apiClient
      .get<SingleResponse<KmsTagResponse>>(`${this.basePath}/tags/${id}`)
      .then((r) => r.data.data);

  createTag = (data: {
    name: string;
    name_local?: string;
    level?: number;
    parent_id?: string;
    color?: string;
    is_system?: boolean;
  }) =>
    apiClient
      .post<SingleResponse<KmsTagResponse>>(`${this.basePath}/tags`, data)
      .then((r) => r.data.data);

  updateTag = (id: string, data: {
    name?: string;
    name_local?: string;
    level?: number;
    parent_id?: string;
    color?: string;
  }) =>
    apiClient
      .put<SingleResponse<KmsTagResponse>>(`${this.basePath}/tags/${id}`, data)
      .then((r) => r.data.data);

  deleteTag = (id: string) =>
    apiClient.delete(`${this.basePath}/tags/${id}`);

  // Tag Assignment
  getWorkItemTags = (witId: string) =>
    apiClient
      .get<ListResponse<KmsWorkItemTagResponse>>(`${this.basePath}/items/${witId}/tags`)
      .then((r) => r.data.data);

  assignTag = (witId: string, data: {
    tag_id?: string;
    tag_name?: string;
    source?: string;
    confidence?: number;
    weight?: number;
  }) =>
    apiClient
      .post<SingleResponse<KmsWorkItemTagResponse>>(`${this.basePath}/items/${witId}/tags`, data)
      .then((r) => r.data.data);

  removeTag = (witId: string, tagId: string) =>
    apiClient.delete(`${this.basePath}/items/${witId}/tags/${tagId}`);

  getWorkItemsForTag = (tagId: string, limit = 50) =>
    apiClient
      .get<ListResponse<string>>(`${this.basePath}/tags/${tagId}/items`, {
        params: { limit },
      })
      .then((r) => r.data.data);
}

export const kmsService = new KmsService();
