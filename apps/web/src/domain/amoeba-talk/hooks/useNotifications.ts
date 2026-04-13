import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useNotificationStore, NotificationItem } from '@/global/store/notification.store';

interface NotificationPage {
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

const QUERY_KEY = ['notifications', 'list'];

export function useNotificationList() {
  return useInfiniteQuery<NotificationPage>({
    queryKey: QUERY_KEY,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get('/notifications', {
        params: { page: pageParam, limit: 20 },
      });
      return res.data.data ?? res.data;
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function useNotificationUnreadCount() {
  const { setUnreadCount } = useNotificationStore();
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread-count');
      const count = res.data.data?.count ?? res.data.count ?? 0;
      setUnreadCount(count);
      return count;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { markAsRead } = useNotificationStore();
  return useMutation({
    mutationFn: async (ntfId: string) => {
      await apiClient.patch(`/notifications/${ntfId}/read`);
      return ntfId;
    },
    onSuccess: (ntfId) => {
      markAsRead(ntfId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotificationStore();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
