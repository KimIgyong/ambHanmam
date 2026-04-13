import { useQuery } from '@tanstack/react-query';
import { searchService } from '../service/search.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const searchKeys = {
  all: ['search'] as const,
  results: (entityId?: string, params?: Record<string, unknown>) => [...searchKeys.all, 'results', entityId, params] as const,
  tags: (entityId?: string, q?: string) => [...searchKeys.all, 'tags', entityId, q] as const,
};

export const useSearchResults = (params: {
  q?: string;
  modules?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
  enabled?: boolean;
}) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const { enabled = true, ...searchParams } = params;
  return useQuery({
    queryKey: searchKeys.results(entityId, searchParams as Record<string, unknown>),
    queryFn: () => searchService.search(searchParams),
    enabled: !!entityId && enabled && !!(searchParams.q || searchParams.tags?.length),
    staleTime: 1000 * 30,
  });
};

export const useSearchTags = (q: string, enabled = true) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: searchKeys.tags(entityId, q),
    queryFn: () => searchService.searchTags(q),
    enabled: !!entityId && enabled && q.length >= 1,
    staleTime: 1000 * 60,
  });
};
