import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noticeService } from '../service/notice.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const noticeKeys = {
  all: ['notices'] as const,
  list: (entityId?: string) => [...noticeKeys.all, 'list', entityId] as const,
  recent: (limit: number, entityId?: string) => [...noticeKeys.all, 'recent', limit, entityId] as const,
  detail: (id: string) => [...noticeKeys.all, 'detail', id] as const,
};

export const useNoticeList = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: noticeKeys.list(entityId),
    queryFn: () => noticeService.getNotices(),
    enabled: !!entityId,
  });
};

export const useRecentNotices = (limit = 5, options?: { enabled?: boolean }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: noticeKeys.recent(limit, entityId),
    queryFn: () => noticeService.getRecentNotices(limit),
    staleTime: 1000 * 60,
    enabled: !!entityId && options?.enabled !== false,
  });
};

export const useNoticeDetail = (id: string) => {
  return useQuery({
    queryKey: noticeKeys.detail(id),
    queryFn: () => noticeService.getNoticeById(id),
    enabled: !!id,
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => noticeService.createNotice(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.all });
    },
  });
};

export const useUpdateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: { title?: string; content?: string; visibility?: string; unit?: string; is_pinned?: boolean };
    }) => noticeService.updateNotice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.all });
    },
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticeService.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.all });
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => noticeService.deleteAttachment(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.all });
    },
  });
};
