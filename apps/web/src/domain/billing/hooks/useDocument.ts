import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApiService } from '../service/document.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const docKeys = {
  all: ['bil-documents'] as const,
  list: (entityId: string | undefined, refType: string, refId: string) =>
    [...docKeys.all, 'list', entityId, refType, refId] as const,
};

export const useDocumentList = (refType: string, refId: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: docKeys.list(entityId, refType, refId),
    queryFn: () => documentApiService.getDocuments(refType, refId),
    enabled: !!entityId && !!refType && !!refId,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ refType, refId, docType, file }: { refType: string; refId: string; docType: string; file: File }) =>
      documentApiService.uploadDocument(refType, refId, docType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.all });
    },
  });
};

export const useAddUrlDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ refType, refId, docType, filename, url }: { refType: string; refId: string; docType: string; filename: string; url: string }) =>
      documentApiService.addUrlDocument(refType, refId, docType, filename, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.all });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentApiService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.all });
    },
  });
};

export const useDocumentPreview = (docId: string | null) => {
  return useQuery({
    queryKey: [...docKeys.all, 'preview', docId],
    queryFn: () => documentApiService.getPreview(docId!),
    enabled: !!docId,
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: (id: string) => documentApiService.downloadDocument(id),
  });
};
