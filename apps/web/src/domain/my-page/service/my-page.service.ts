import { apiClient } from '@/lib/api-client';
import { BaseSingleResponse, MyProfileResponse } from '@amb/types';

class MyPageService {
  getMyProfile = () =>
    apiClient
      .get<BaseSingleResponse<MyProfileResponse>>('/users/me/profile')
      .then((r) => r.data.data!);

  updateProfile = (data: { phone?: string | null; name?: string; company_email?: string | null }) =>
    apiClient
      .patch('/users/me/profile', data)
      .then((r) => r.data);

  uploadProfileImage = (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post('/users/me/profile-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  };

  deleteProfileImage = () =>
    apiClient.delete('/users/me/profile-image').then((r) => r.data);

  getProfileImageUrl = () => '/api/v1/users/me/profile-image';

  changePassword = (currentPassword: string, newPassword: string) =>
    apiClient
      .post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      .then((r) => r.data);

  updateTimezone = (timezone: string, locale: string) =>
    apiClient
      .patch<BaseSingleResponse<{ timezone: string; locale: string }>>('/users/me/timezone', {
        timezone,
        locale,
      })
      .then((r) => r.data.data!);
}

export const myPageService = new MyPageService();
