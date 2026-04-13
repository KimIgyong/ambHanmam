import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../service/chat.service';
import { useChatStore } from '../store/chat.store';
import { useEntityStore } from '@/domain/hr/store/entity.store';

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: (entityId?: string) => [...conversationKeys.all, 'list', entityId] as const,
  list: (entityId?: string, unit?: string) => [...conversationKeys.lists(entityId), unit] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

export const useConversationList = (unit?: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: conversationKeys.list(entityId, unit),
    queryFn: () => chatService.getConversations({ unit }),
    staleTime: 1000 * 60 * 5,
    enabled: !!entityId,
  });
};

export const useConversationDetail = (id: string | null) => {
  const setMessages = useChatStore((s) => s.setMessages);

  return useQuery({
    queryKey: conversationKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const detail = await chatService.getConversationDetail(id);
      if (detail) {
        setMessages(detail.messages);
      }
      return detail;
    },
    enabled: !!id,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ unitCode, title }: { unitCode: string; title: string }) =>
      chatService.createConversation(unitCode, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
};
