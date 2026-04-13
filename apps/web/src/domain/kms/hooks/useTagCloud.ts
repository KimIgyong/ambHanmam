import { useQuery } from '@tanstack/react-query';
import { tagCloudService } from '../service/tag-cloud.service';
import { TagCloudScope } from '@amb/types';
import { useEntityStore } from '@/domain/hr/store/entity.store';

export function useTagCloud(params: {
  scope?: TagCloudScope;
  level?: number;
  period?: string;
  maxTags?: number;
} = {}) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['kms', 'tag-cloud', entityId, params.scope, params.level, params.period, params.maxTags],
    queryFn: () =>
      tagCloudService.getTagCloud({
        scope: params.scope,
        level: params.level,
        period: params.period,
        max_tags: params.maxTags,
      }),
    enabled: !!entityId,
  });
}

export function useTagDetail(tagId: string, includeComparison = false) {
  return useQuery({
    queryKey: ['kms', 'tag-cloud', tagId, 'detail', includeComparison],
    queryFn: () => tagCloudService.getTagDetail(tagId, { include_comparison: includeComparison }),
    enabled: !!tagId,
  });
}

export function useKnowledgeGraph(params: { minUsage?: number; maxNodes?: number } = {}) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['kms', 'knowledge-graph', entityId, params.minUsage, params.maxNodes],
    queryFn: () =>
      tagCloudService.getKnowledgeGraph({
        min_usage: params.minUsage,
        max_nodes: params.maxNodes,
      }),
    enabled: !!entityId,
  });
}
