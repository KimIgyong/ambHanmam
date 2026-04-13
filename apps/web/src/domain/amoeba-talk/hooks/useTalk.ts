import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { talkService } from '../service/talk.service';

export const talkKeys = {
  all: ['talk'] as const,
  channels: () => [...talkKeys.all, 'channels'] as const,
  channelDetail: (id: string) => [...talkKeys.all, 'channel', id] as const,
  messages: (channelId: string) => [...talkKeys.all, 'messages', channelId] as const,
  searchMessages: (channelId: string, query: string) => [...talkKeys.all, 'searchMessages', channelId, query] as const,
  unread: () => [...talkKeys.all, 'unread'] as const,
  entityMembers: () => [...talkKeys.all, 'entityMembers'] as const,
  clientMembers: () => [...talkKeys.all, 'clientMembers'] as const,
  pinnedMessages: (channelId: string) => [...talkKeys.all, 'pinnedMessages', channelId] as const,
};

export const useChannels = () => {
  return useQuery({
    queryKey: talkKeys.channels(),
    queryFn: () => talkService.getMyChannels(),
    staleTime: 1000 * 30,
  });
};

export const useChannelDetail = (channelId: string | null) => {
  return useQuery({
    queryKey: talkKeys.channelDetail(channelId || ''),
    queryFn: () => talkService.getChannelDetail(channelId!),
    enabled: !!channelId,
  });
};

export const useMessages = (channelId: string | null) => {
  return useInfiniteQuery({
    queryKey: talkKeys.messages(channelId || ''),
    queryFn: ({ pageParam }) => talkService.getMessages(channelId!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!channelId,
    refetchInterval: 1000 * 30,
  });
};

export const useUnreadCounts = () => {
  return useQuery({
    queryKey: talkKeys.unread(),
    queryFn: () => talkService.getUnreadCounts(),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
};

/** Talk 전체 미읽음 합산 */
export const useTotalUnreadCount = () => {
  const { data } = useUnreadCounts();
  if (!data) return 0;
  return data.reduce((sum, u) => sum + (u.unreadCount || 0), 0);
};

export const useEntityMembers = () => {
  return useQuery({
    queryKey: talkKeys.entityMembers(),
    queryFn: () => talkService.getEntityMembers(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useClientMembers = () => {
  return useQuery({
    queryKey: talkKeys.clientMembers(),
    queryFn: () => talkService.getClientMembers(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useStartDm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => talkService.findOrCreateDm(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string; description?: string; member_ids?: string[] }) =>
      talkService.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, data }: { channelId: string; data: { name?: string; description?: string } }) =>
      talkService.updateChannel(channelId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
      queryClient.invalidateQueries({ queryKey: talkKeys.channelDetail(variables.channelId) });
    },
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => talkService.deleteChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useArchiveChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => talkService.archiveChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useUnarchiveChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => talkService.unarchiveChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useDeleteDmChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => talkService.deleteDmChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, content, translateTo, parentId, files, mentionUserIds }: { channelId: string; content: string; translateTo?: string; parentId?: string; files?: File[]; mentionUserIds?: string[] }) =>
      talkService.sendMessage(channelId, { content, translate_to: translateTo, parent_id: parentId, mention_user_ids: mentionUserIds }, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.messages(variables.channelId) });
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      talkService.deleteMessage(channelId, messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.messages(variables.channelId) });
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useHideMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      talkService.hideMessage(channelId, messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.messages(variables.channelId) });
    },
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, userId }: { channelId: string; userId: string }) =>
      talkService.addMember(channelId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channelDetail(variables.channelId) });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, userId }: { channelId: string; userId: string }) =>
      talkService.removeMember(channelId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channelDetail(variables.channelId) });
    },
  });
};

export const useTranslateMessage = () => {
  return useMutation({
    mutationFn: ({
      channelId,
      messageId,
      targetLang,
    }: {
      channelId: string;
      messageId: string;
      targetLang: string;
    }) => talkService.translateMessage(channelId, messageId, targetLang),
  });
};

export const useTranslateAndPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      messageId,
      targetLang,
    }: {
      channelId: string;
      messageId: string;
      targetLang: string;
    }) => talkService.translateAndPost(channelId, messageId, targetLang),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.messages(variables.channelId) });
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useMessageReaders = (channelId: string | null, messageId: string | null) => {
  return useQuery({
    queryKey: [...talkKeys.all, 'readers', channelId, messageId] as const,
    queryFn: () => talkService.getMessageReaders(channelId!, messageId!),
    enabled: !!channelId && !!messageId,
  });
};

export const useSearchMessages = (channelId: string | null, query: string) => {
  return useInfiniteQuery({
    queryKey: talkKeys.searchMessages(channelId || '', query),
    queryFn: ({ pageParam }) =>
      talkService.searchMessages(channelId!, query, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!channelId && query.length >= 2,
  });
};

export const useReactMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId, type }: { channelId: string; messageId: string; type: string }) =>
      talkService.reactMessage(channelId, messageId, type),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.messages(variables.channelId) });
    },
  });
};

export const useTogglePin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => talkService.togglePin(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useToggleMessagePin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      talkService.toggleMessagePin(channelId, messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: talkKeys.messages(variables.channelId) });
      queryClient.invalidateQueries({ queryKey: talkKeys.pinnedMessages(variables.channelId) });
    },
  });
};

export const usePinnedMessages = (channelId: string | null) => {
  return useQuery({
    queryKey: talkKeys.pinnedMessages(channelId || ''),
    queryFn: () => talkService.getPinnedMessages(channelId!),
    enabled: !!channelId,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => talkService.markAsRead(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.unread() });
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};

export const useTyping = () => {
  return useMutation({
    mutationFn: (channelId: string) => talkService.sendTyping(channelId),
  });
};

export const useToggleMute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => talkService.toggleMute(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
    },
  });
};
