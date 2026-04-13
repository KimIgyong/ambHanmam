import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { entityApiService } from '../service/entity.service';
import { useEntityStore } from '../store/entity.store';

const entityKeys = {
  all: ['hr-entities'] as const,
  list: () => [...entityKeys.all, 'list'] as const,
  detail: (id: string) => [...entityKeys.all, 'detail', id] as const,
};

export const useEntities = () => {
  const setEntities = useEntityStore((s) => s.setEntities);

  const query = useQuery({
    queryKey: entityKeys.list(),
    queryFn: () => entityApiService.getEntities(),
  });

  useEffect(() => {
    if (query.data) {
      setEntities(query.data);
    }
  }, [query.data, setEntities]);

  return query;
};

export const useCurrentEntity = () => {
  return useEntityStore((s) => s.currentEntity);
};

export const useEntityId = () => {
  const entity = useEntityStore((s) => s.currentEntity);
  return entity?.entityId || null;
};
