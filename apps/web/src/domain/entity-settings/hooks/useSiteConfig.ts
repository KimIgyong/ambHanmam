import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useEntityStore } from '@/domain/hr/store/entity.store';

/* ── Site Config ── */

export function useSiteConfig() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['entity-settings', 'site-config', entityId],
    queryFn: () =>
      apiClient
        .get('/entity-settings/site-config', {
          params: entityId ? { entity_id: entityId } : undefined,
        })
        .then((r) => r.data.data),
    enabled: !!entityId,
  });
}

export function useUpdateSiteConfig() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { login_modal_enabled?: boolean; login_modal_title?: string; login_modal_content?: string }) => {
      if (!entityId) throw new Error('entity_id is required');
      return apiClient.put('/entity-settings/site-config', dto, {
        params: { entity_id: entityId },
      }).then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entity-settings', 'site-config', entityId] }),
  });
}

/* ── Menu Tips (admin) ── */

export function useMenuTips(overrideEntityId?: string) {
  const storeEntityId = useEntityStore((s) => s.currentEntity?.entityId);
  const entityId = overrideEntityId ?? storeEntityId;
  return useQuery({
    queryKey: ['entity-settings', 'menu-tips', entityId],
    queryFn: () =>
      apiClient
        .get('/entity-settings/site-config/menu-tips', {
          params: entityId ? { entity_id: entityId } : undefined,
        })
        .then((r) => r.data.data),
    enabled: !!entityId,
  });
}

export function useUpsertMenuTip(overrideEntityId?: string) {
  const storeEntityId = useEntityStore((s) => s.currentEntity?.entityId);
  const entityId = overrideEntityId ?? storeEntityId;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ menuCode, ...dto }: { menuCode: string; title?: string; content?: string; is_active?: boolean; sort_order?: number }) => {
      if (!entityId) throw new Error('entity_id is required');
      return apiClient.put(`/entity-settings/site-config/menu-tips/${menuCode}`, dto, {
        params: { entity_id: entityId },
      }).then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entity-settings', 'menu-tips', entityId] }),
  });
}

/* ── Login Modal (user) ── */

export function useLoginModal() {
  return useQuery({
    queryKey: ['entity-settings', 'login-modal'],
    queryFn: () => apiClient.get('/entity-settings/site-config/login-modal').then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}

/* ── Menu Tip for user (single menu) ── */

export function useMenuTipForPage(menuCode: string | undefined) {
  return useQuery({
    queryKey: ['entity-settings', 'menu-tip', menuCode],
    queryFn: () => apiClient.get(`/entity-settings/site-config/menu-tips/${menuCode}`).then((r) => r.data.data),
    enabled: !!menuCode,
    staleTime: 5 * 60 * 1000,
  });
}
