import { apiClient } from '@/lib/api-client';
import { DriveFileResponse, DriveFolderRegistration } from '@amb/types';

interface DriveListResponse {
  success: boolean;
  data: {
    files: DriveFileResponse[];
    nextPageToken?: string;
  };
  timestamp: string;
}

interface DriveFolderListResponse {
  success: boolean;
  data: DriveFolderRegistration[];
  timestamp: string;
}

interface DriveFolderSingleResponse {
  success: boolean;
  data: DriveFolderRegistration;
  timestamp: string;
}

interface DriveFileSingleResponse {
  success: boolean;
  data: DriveFileResponse;
  timestamp: string;
}

interface DriveStatusResponse {
  success: boolean;
  data: { configured: boolean };
  timestamp: string;
}

interface SharedDrivesResponse {
  success: boolean;
  data: { id: string; name: string }[];
  timestamp: string;
}

class DriveApiService {
  private readonly basePath = '/drive';

  getStatus = () =>
    apiClient
      .get<DriveStatusResponse>(`${this.basePath}/status`)
      .then((r) => r.data.data);

  getSharedDrives = () =>
    apiClient
      .get<SharedDrivesResponse>(`${this.basePath}/shared-drives`)
      .then((r) => r.data.data);

  getRegisteredFolders = () =>
    apiClient
      .get<DriveFolderListResponse>(`${this.basePath}/folders`)
      .then((r) => r.data.data);

  registerFolder = (data: {
    folder_id: string;
    folder_name: string;
    drive_type: string;
    description?: string;
  }) =>
    apiClient
      .post<DriveFolderSingleResponse>(`${this.basePath}/folders`, data)
      .then((r) => r.data.data);

  unregisterFolder = (id: string) =>
    apiClient.delete(`${this.basePath}/folders/${id}`);

  listFiles = (folderId: string, pageToken?: string, pageSize?: number) =>
    apiClient
      .get<DriveListResponse>(`${this.basePath}/files`, {
        params: { folderId, pageToken, pageSize },
      })
      .then((r) => r.data.data);

  getFileDetail = (fileId: string) =>
    apiClient
      .get<DriveFileSingleResponse>(`${this.basePath}/files/${fileId}`)
      .then((r) => r.data.data);

  getDownloadUrl = (fileId: string) =>
    `${apiClient.defaults.baseURL}${this.basePath}/files/${fileId}/download`;

  searchFiles = (q: string, pageToken?: string) =>
    apiClient
      .get<DriveListResponse>(`${this.basePath}/search`, {
        params: { q, pageToken },
      })
      .then((r) => r.data.data);

  createSubfolder = (parentFolderId: string, folderName: string) =>
    apiClient
      .post<{ success: boolean; data: { folderId: string; name: string } }>(
        `${this.basePath}/create-folder`,
        { parent_folder_id: parentFolderId, folder_name: folderName },
      )
      .then((r) => r.data.data);

  uploadFile = (folderId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId);
    return apiClient
      .post<{
        success: boolean;
        data: { fileId: string; name: string; mimeType: string; webViewLink: string; size: number };
      }>(`${this.basePath}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  };
}

export const driveApiService = new DriveApiService();
