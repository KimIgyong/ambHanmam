import { apiClient } from '@/lib/api-client';

export interface SearchResult {
  id: string;
  module: string;
  type: string;
  title: string;
  snippet: string;
  tags: { tagId: string; name: string; display: string; level: number; color: string | null }[];
  createdAt: string;
  refId: string | null;
}

export interface SearchResponse {
  totalCount: number;
  results: SearchResult[];
  relatedTags: { tagId: string; name: string; display: string; usageCount: number }[];
}

export interface SearchTagResult {
  tagId: string;
  name: string;
  display: string;
  nameLocal: string | null;
  level: number;
  usageCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class SearchService {
  private readonly basePath = '/search';

  search = (params: {
    q?: string;
    modules?: string[];
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams: Record<string, string> = {};
    if (params.q) queryParams.q = params.q;
    if (params.modules?.length) queryParams.modules = params.modules.join(',');
    if (params.tags?.length) queryParams.tags = params.tags.join(',');
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.offset) queryParams.offset = String(params.offset);

    return apiClient
      .get<ApiResponse<SearchResponse>>(this.basePath, { params: queryParams })
      .then((r) => r.data.data);
  };

  searchTags = (q: string, limit = 10) =>
    apiClient
      .get<ApiResponse<SearchTagResult[]>>(`${this.basePath}/tags`, { params: { q, limit } })
      .then((r) => r.data.data);
}

export const searchService = new SearchService();
