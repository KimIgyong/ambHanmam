import { apiClient } from '@/lib/api-client';
import { TagCloudResponse, KnowledgeGraphResponse } from '@amb/types';

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

class TagCloudService {
  private readonly basePath = '/kms';

  getTagCloud = (params: {
    scope?: string;
    level?: number;
    period?: string;
    max_tags?: number;
  } = {}) =>
    apiClient
      .get<SingleResponse<TagCloudResponse>>(`${this.basePath}/tag-cloud`, { params })
      .then((r) => r.data.data);

  getTagDetail = (tagId: string, params: { include_comparison?: boolean } = {}) =>
    apiClient
      .get<SingleResponse<any>>(`${this.basePath}/tag-cloud/${tagId}/detail`, { params })
      .then((r) => r.data.data);

  getKnowledgeGraph = (params: { min_usage?: number; max_nodes?: number } = {}) =>
    apiClient
      .get<SingleResponse<KnowledgeGraphResponse>>(`${this.basePath}/knowledge-graph`, { params })
      .then((r) => r.data.data);

  triggerAutoTag = (witId: string) =>
    apiClient
      .post(`${this.basePath}/items/${witId}/auto-tag`)
      .then((r) => r.data);

  confirmTag = (witId: string, tagId: string) =>
    apiClient
      .post(`${this.basePath}/items/${witId}/tags/confirm`, { tag_id: tagId })
      .then((r) => r.data.data);

  rejectTag = (witId: string, tagId: string) =>
    apiClient
      .post(`${this.basePath}/items/${witId}/tags/reject`, { tag_id: tagId })
      .then((r) => r.data.data);

  addManualTag = (witId: string, tagName: string, level?: number) =>
    apiClient
      .post(`${this.basePath}/items/${witId}/tags/manual`, { tag_name: tagName, level })
      .then((r) => r.data.data);
}

export const tagCloudService = new TagCloudService();
