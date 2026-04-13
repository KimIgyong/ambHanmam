import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../service/settings.service';

const smtpKeys = {
  all: ['smtpSettings'] as const,
  detail: () => [...smtpKeys.all, 'detail'] as const,
};

export const useSmtpSettings = () => {
  return useQuery({
    queryKey: smtpKeys.detail(),
    queryFn: () => settingsService.getSmtpSettings(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateSmtpSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      host: string;
      port: number;
      user: string;
      pass?: string;
      from: string;
      secure: boolean;
    }) => settingsService.updateSmtpSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smtpKeys.detail() });
    },
  });
};

export const useTestSmtpConnection = () => {
  return useMutation({
    mutationFn: (data: {
      host: string;
      port: number;
      user: string;
      pass?: string;
      from: string;
      secure: boolean;
    }) => settingsService.testSmtpConnection(data),
  });
};
