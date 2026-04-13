import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface DriveSettingsResponse {
  configured: boolean;
  impersonateEmail: string | null;
  billingRootFolderId: string | null;
  billingRootFolderName: string | null;
  updatedAt: string | null;
}

interface DriveTestResult {
  success: boolean;
  message: string;
  folderName?: string;
}

export interface SharedDriveItem {
  id: string;
  name: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
}

const driveSettingsKeys = {
  all: ['driveSettings'] as const,
  settings: () => [...driveSettingsKeys.all, 'settings'] as const,
  sharedDrives: () => [...driveSettingsKeys.all, 'sharedDrives'] as const,
  folders: (parentId: string) => [...driveSettingsKeys.all, 'folders', parentId] as const,
};

export const useDriveSettings = () => {
  return useQuery({
    queryKey: driveSettingsKeys.settings(),
    queryFn: () =>
      apiClient
        .get<{ success: boolean; data: DriveSettingsResponse }>('/settings/drive')
        .then((r) => r.data.data),
  });
};

export const useUpdateDriveSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      impersonate_email?: string;
      billing_root_folder_id?: string;
      billing_root_folder_name?: string;
    }) =>
      apiClient
        .put<{ success: boolean; data: DriveSettingsResponse }>('/settings/drive', data)
        .then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveSettingsKeys.all });
    },
  });
};

export const useTestDriveConnection = () => {
  return useMutation({
    mutationFn: () =>
      apiClient
        .post<{ success: boolean; data: DriveTestResult }>('/settings/drive/test')
        .then((r) => r.data.data),
  });
};

export const useListSharedDrives = () => {
  return useMutation({
    mutationFn: () =>
      apiClient
        .get<{ success: boolean; data: SharedDriveItem[]; error?: string }>('/settings/drive/shared-drives')
        .then((r) => {
          if (!r.data.success) throw new Error(r.data.error || 'Failed to list shared drives');
          return r.data.data;
        }),
  });
};

export const useListDriveFolders = (parentId: string, enabled: boolean) => {
  return useQuery({
    queryKey: driveSettingsKeys.folders(parentId),
    queryFn: () =>
      apiClient
        .get<{ success: boolean; data: DriveFolderItem[]; error?: string }>(
          `/settings/drive/folders?parentId=${encodeURIComponent(parentId)}`,
        )
        .then((r) => {
          if (!r.data.success) throw new Error(r.data.error || 'Failed to list folders');
          return r.data.data;
        }),
    enabled: enabled && !!parentId,
  });
};
