import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cmsSubscriberService } from '../service/cms-api.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const subscriberKeys = {
  all: (entityId?: string) => ['cms-subscribers', entityId] as const,
  list: (entityId?: string, pageId?: string, filters?: Record<string, string | number | undefined>) =>
    [...subscriberKeys.all(entityId), 'list', pageId, filters] as const,
};

export const useSubscriberList = (pageId: string | null, filters?: {
  search?: string;
  page?: number;
  size?: number;
}) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: subscriberKeys.list(entityId, pageId || '', filters),
    queryFn: () => cmsSubscriberService.getSubscribers(pageId!, filters),
    enabled: !!pageId && !!entityId,
    staleTime: 1000 * 30,
  });
};

export const useExportSubscribers = () => {
  const queryClient = useQueryClient();
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return {
    exportCsv: async (pageId: string) => {
      const blob = await cmsSubscriberService.exportCsv(pageId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${pageId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: subscriberKeys.all(entityId) });
    },
  };
};
