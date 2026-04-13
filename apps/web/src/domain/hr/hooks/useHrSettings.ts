import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrSettingsApiService } from '../service/hr-settings.service';

const settingsKeys = {
  all: ['hr-settings'] as const,
  params: () => [...settingsKeys.all, 'params'] as const,
  currentParams: () => [...settingsKeys.all, 'current-params'] as const,
  holidays: (year: number) => [...settingsKeys.all, 'holidays', year] as const,
};

export const useAllParams = () => {
  return useQuery({
    queryKey: settingsKeys.params(),
    queryFn: () => hrSettingsApiService.getAllParams(),
  });
};

export const useCurrentParams = () => {
  return useQuery({
    queryKey: settingsKeys.currentParams(),
    queryFn: () => hrSettingsApiService.getCurrentParams(),
  });
};

export const useUpsertParam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => hrSettingsApiService.upsertParam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
};

export const useHolidays = (year: number) => {
  return useQuery({
    queryKey: settingsKeys.holidays(year),
    queryFn: () => hrSettingsApiService.getHolidays(year),
  });
};

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => hrSettingsApiService.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrSettingsApiService.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
};
