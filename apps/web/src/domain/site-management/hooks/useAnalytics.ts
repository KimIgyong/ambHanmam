import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analyticsSettingsService,
  portalAnalyticsService,
  appAnalyticsService,
} from '../service/analytics.service';

// ── GA Settings ──

export function useGaSettings() {
  return useQuery({
    queryKey: ['analytics', 'ga-settings'],
    queryFn: analyticsSettingsService.getSettings,
  });
}

export function useUpdateGaSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: analyticsSettingsService.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['analytics', 'ga-settings'] }),
  });
}

// ── Portal Analytics ──

export function usePortalSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'portal', 'summary', startDate, endDate],
    queryFn: () => portalAnalyticsService.getSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function usePortalVisitorTrend(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'portal', 'visitors', startDate, endDate],
    queryFn: () => portalAnalyticsService.getVisitorTrend(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function usePortalReferrers(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'portal', 'referrers', startDate, endDate],
    queryFn: () => portalAnalyticsService.getReferrers(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function usePortalPages(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'portal', 'pages', startDate, endDate],
    queryFn: () => portalAnalyticsService.getPages(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function usePortalTrafficSources(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'portal', 'traffic-sources', startDate, endDate],
    queryFn: () => portalAnalyticsService.getTrafficSources(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// ── App Analytics ──

export function useAppSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'app', 'summary', startDate, endDate],
    queryFn: () => appAnalyticsService.getSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useAppVisitorTrend(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'app', 'visitors', startDate, endDate],
    queryFn: () => appAnalyticsService.getVisitorTrend(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useAppEntityLogins(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'app', 'entity-logins', startDate, endDate],
    queryFn: () => appAnalyticsService.getEntityLogins(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useAppHourlyPattern(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['analytics', 'app', 'hourly-pattern', startDate, endDate],
    queryFn: () => appAnalyticsService.getHourlyPattern(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
