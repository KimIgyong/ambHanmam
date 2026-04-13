import { useQuery } from '@tanstack/react-query';
import { entitySettingsService } from '../service/entity-settings.service';

export function useWorkStatsOverview(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['work-stats', 'overview', startDate, endDate],
    queryFn: () => entitySettingsService.getWorkStatsOverview(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useWorkStatsMembers(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['work-stats', 'members', startDate, endDate],
    queryFn: () => entitySettingsService.getWorkStatsMembers(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useWorkStatsLoginHistory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['work-stats', 'login-history', startDate, endDate],
    queryFn: () => entitySettingsService.getWorkStatsLoginHistory(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useWorkStatsApiUsage(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['work-stats', 'api-usage', startDate, endDate],
    queryFn: () => entitySettingsService.getWorkStatsApiUsage(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useWorkStatsMenuUsage(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['work-stats', 'menu-usage', startDate, endDate],
    queryFn: () => entitySettingsService.getWorkStatsMenuUsage(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
