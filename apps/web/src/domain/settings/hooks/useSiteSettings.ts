import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../service/settings.service';

const siteKeys = {
  all: ['siteSettings'] as const,
  detail: () => [...siteKeys.all, 'detail'] as const,
};

export const useSiteSettings = () => {
  return useQuery({
    queryKey: siteKeys.detail(),
    queryFn: () => settingsService.getSiteSettings(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      portal_url?: string;
      portal_domain?: string;
      allowed_ips?: string[];
      allowed_domains?: string[];
      is_public?: boolean;
      logo_url?: string;
      favicon_url?: string;
      index_enabled?: boolean;
      index_html?: string;
    }) => settingsService.updateSiteSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.detail() });
    },
  });
};
