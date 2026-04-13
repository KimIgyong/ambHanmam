import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myPageService } from '../service/my-page.service';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { useAuthStore } from '@/domain/auth/store/auth.store';

const myPageKeys = {
  profile: ['my-profile'] as const,
};

export const useMyProfile = () => {
  return useQuery({
    queryKey: myPageKeys.profile,
    queryFn: () => myPageService.getMyProfile(),
    staleTime: 1000 * 60 * 2,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone?: string | null; name?: string; company_email?: string | null }) => myPageService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPageKeys.profile });
    },
  });
};

export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => myPageService.uploadProfileImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPageKeys.profile });
    },
  });
};

export const useDeleteProfileImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => myPageService.deleteProfileImage(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPageKeys.profile });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      myPageService.changePassword(currentPassword, newPassword),
  });
};

export const useUpdateTimezone = () => {
  const { setTimezone } = useTimezoneStore();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ timezone, locale }: { timezone: string; locale: string }) =>
      myPageService.updateTimezone(timezone, locale),
    onSuccess: (data) => {
      // 전역 timezone store 및 auth user 즉시 동기화
      setTimezone(data.timezone);
      if (user) {
        updateUser({ timezone: data.timezone, locale: data.locale });
      }
    },
  });
};
