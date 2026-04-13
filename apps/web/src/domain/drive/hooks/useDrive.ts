import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driveApiService } from '../service/drive.service';

const driveKeys = {
  all: ['drive'] as const,
  status: () => [...driveKeys.all, 'status'] as const,
  sharedDrives: () => [...driveKeys.all, 'shared-drives'] as const,
  folders: () => [...driveKeys.all, 'folders'] as const,
  files: (folderId: string, pageToken?: string) =>
    [...driveKeys.all, 'files', folderId, pageToken] as const,
  search: (query: string, pageToken?: string) =>
    [...driveKeys.all, 'search', query, pageToken] as const,
  file: (fileId: string) => [...driveKeys.all, 'file', fileId] as const,
};

export const useDriveStatus = () => {
  return useQuery({
    queryKey: driveKeys.status(),
    queryFn: () => driveApiService.getStatus(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSharedDrives = () => {
  return useQuery({
    queryKey: driveKeys.sharedDrives(),
    queryFn: () => driveApiService.getSharedDrives(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useRegisteredFolders = () => {
  return useQuery({
    queryKey: driveKeys.folders(),
    queryFn: () => driveApiService.getRegisteredFolders(),
  });
};

export const useRegisterFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      folder_id: string;
      folder_name: string;
      drive_type: string;
      description?: string;
    }) => driveApiService.registerFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveKeys.folders() });
    },
  });
};

export const useUnregisterFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => driveApiService.unregisterFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveKeys.folders() });
    },
  });
};

export const useDriveFiles = (folderId: string, pageToken?: string) => {
  return useQuery({
    queryKey: driveKeys.files(folderId, pageToken),
    queryFn: () => driveApiService.listFiles(folderId, pageToken),
    enabled: !!folderId,
  });
};

export const useDriveFilesInfinite = (folderId: string) => {
  return useInfiniteQuery({
    queryKey: [...driveKeys.all, 'files-infinite', folderId] as const,
    queryFn: ({ pageParam }) => driveApiService.listFiles(folderId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled: !!folderId,
  });
};

export const useDriveSearch = (query: string, pageToken?: string) => {
  return useQuery({
    queryKey: driveKeys.search(query, pageToken),
    queryFn: () => driveApiService.searchFiles(query, pageToken),
    enabled: query.length >= 2,
  });
};

export const useDriveSearchInfinite = (query: string) => {
  return useInfiniteQuery({
    queryKey: [...driveKeys.all, 'search-infinite', query] as const,
    queryFn: ({ pageParam }) => driveApiService.searchFiles(query, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled: query.length >= 2,
  });
};

export const useDriveFileDetail = (fileId: string) => {
  return useQuery({
    queryKey: driveKeys.file(fileId),
    queryFn: () => driveApiService.getFileDetail(fileId),
    enabled: !!fileId,
  });
};

export const useCreateSubfolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentFolderId, folderName }: { parentFolderId: string; folderName: string }) =>
      driveApiService.createSubfolder(parentFolderId, folderName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveKeys.all });
    },
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, file }: { folderId: string; file: File }) =>
      driveApiService.uploadFile(folderId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driveKeys.all });
    },
  });
};
