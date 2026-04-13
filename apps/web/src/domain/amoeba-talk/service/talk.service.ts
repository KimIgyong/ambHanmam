import { apiClient } from '@/lib/api-client';
import {
  TalkChannelResponse,
  TalkChannelDetailResponse,
  TalkMessageResponse,
  TalkMessageReaderResponse,
  TalkUnreadSummary,
  BaseSingleResponse,
} from '@amb/types';

interface ChannelListResponse {
  success: boolean;
  data: TalkChannelResponse[];
  timestamp: string;
}

interface MessageListResponse {
  success: boolean;
  data: TalkMessageResponse[];
  nextCursor: string | null;
  timestamp: string;
}

interface SearchMessageListResponse {
  success: boolean;
  data: TalkMessageResponse[];
  nextCursor: string | null;
  totalCount: number;
  timestamp: string;
}

interface TranslateResponse {
  success: boolean;
  data: { translatedContent: string; detectedLanguage: string };
  timestamp: string;
}

interface UnreadResponse {
  success: boolean;
  data: TalkUnreadSummary[];
  timestamp: string;
}

export interface TalkEntityMember {
  userId: string;
  name: string;
  email: string;
}

interface EntityMemberResponse {
  success: boolean;
  data: TalkEntityMember[];
  timestamp: string;
}

class TalkService {
  private readonly basePath = '/talk';

  getMyChannels = () =>
    apiClient
      .get<ChannelListResponse>(`${this.basePath}/channels`)
      .then((r) => r.data.data);

  getEntityMembers = () =>
    apiClient
      .get<EntityMemberResponse>(`${this.basePath}/channels/members`)
      .then((r) => r.data.data);

  getClientMembers = () =>
    apiClient
      .get<EntityMemberResponse>(`${this.basePath}/channels/client-members`)
      .then((r) => r.data.data);

  findOrCreateDm = (targetUserId: string) =>
    apiClient
      .post<BaseSingleResponse<TalkChannelResponse>>(`${this.basePath}/channels/dm`, {
        target_user_id: targetUserId,
      })
      .then((r) => r.data.data);

  getChannelDetail = (channelId: string) =>
    apiClient
      .get<BaseSingleResponse<TalkChannelDetailResponse>>(`${this.basePath}/channels/${channelId}`)
      .then((r) => r.data.data);

  createChannel = (data: { name: string; type: string; description?: string; member_ids?: string[] }) =>
    apiClient
      .post<BaseSingleResponse<TalkChannelResponse>>(`${this.basePath}/channels`, data)
      .then((r) => r.data.data);

  updateChannel = (channelId: string, data: { name?: string; description?: string }) =>
    apiClient
      .patch<BaseSingleResponse<TalkChannelResponse>>(`${this.basePath}/channels/${channelId}`, data)
      .then((r) => r.data.data);

  deleteChannel = (channelId: string) =>
    apiClient.delete(`${this.basePath}/channels/${channelId}`);

  archiveChannel = (channelId: string) =>
    apiClient.patch(`${this.basePath}/channels/${channelId}/archive`);

  unarchiveChannel = (channelId: string) =>
    apiClient.patch(`${this.basePath}/channels/${channelId}/unarchive`);

  deleteDmChannel = (channelId: string) =>
    apiClient.delete(`${this.basePath}/channels/${channelId}/dm`);

  addMember = (channelId: string, userId: string) =>
    apiClient.post(`${this.basePath}/channels/${channelId}/members`, { user_id: userId });

  removeMember = (channelId: string, userId: string) =>
    apiClient.delete(`${this.basePath}/channels/${channelId}/members/${userId}`);

  togglePin = (channelId: string) =>
    apiClient
      .patch<{ success: boolean; data: { isPinned: boolean }; timestamp: string }>(
        `${this.basePath}/channels/${channelId}/pin`,
      )
      .then((r) => r.data.data);

  markAsRead = (channelId: string) =>
    apiClient.post(`${this.basePath}/channels/${channelId}/read`);

  getUnreadCounts = () =>
    apiClient
      .get<UnreadResponse>(`${this.basePath}/channels/unread`)
      .then((r) => r.data.data);

  getMessages = (channelId: string, cursor?: string, limit?: number) =>
    apiClient
      .get<MessageListResponse>(`${this.basePath}/channels/${channelId}/messages`, {
        params: { cursor, limit },
      })
      .then((r) => ({ data: r.data.data, nextCursor: r.data.nextCursor }));

  sendMessage = (channelId: string, data: { content: string; type?: string; parent_id?: string; translate_to?: string; mention_user_ids?: string[] }, files?: File[]) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('content', data.content);
      if (data.type) formData.append('type', data.type);
      if (data.parent_id) formData.append('parent_id', data.parent_id);
      if (data.translate_to) formData.append('translate_to', data.translate_to);
      if (data.mention_user_ids?.length) formData.append('mention_user_ids', JSON.stringify(data.mention_user_ids));
      files.forEach((file) => formData.append('files', file));
      return apiClient
        .post<BaseSingleResponse<TalkMessageResponse>>(
          `${this.basePath}/channels/${channelId}/messages`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        )
        .then((r) => r.data.data);
    }
    return apiClient
      .post<BaseSingleResponse<TalkMessageResponse>>(`${this.basePath}/channels/${channelId}/messages`, data)
      .then((r) => r.data.data);
  };

  updateMessage = (channelId: string, messageId: string, data: { content: string }) =>
    apiClient
      .patch<BaseSingleResponse<TalkMessageResponse>>(
        `${this.basePath}/channels/${channelId}/messages/${messageId}`,
        data,
      )
      .then((r) => r.data.data);

  deleteMessage = (channelId: string, messageId: string) =>
    apiClient.delete(`${this.basePath}/channels/${channelId}/messages/${messageId}`);

  hideMessage = (channelId: string, messageId: string) =>
    apiClient.post(`${this.basePath}/channels/${channelId}/messages/${messageId}/hide`);

  translateMessage = (channelId: string, messageId: string, targetLang: string) =>
    apiClient
      .post<TranslateResponse>(
        `${this.basePath}/channels/${channelId}/messages/${messageId}/translate`,
        { target_lang: targetLang },
      )
      .then((r) => r.data.data);

  translateAndPost = (channelId: string, messageId: string, targetLang: string) =>
    apiClient
      .post<BaseSingleResponse<TalkMessageResponse>>(
        `${this.basePath}/channels/${channelId}/messages/${messageId}/translate-and-post`,
        { target_lang: targetLang },
      )
      .then((r) => r.data.data);

  getTranslations = (channelId: string, messageId: string) =>
    apiClient
      .get<{
        success: boolean;
        data: { translations: Array<{ id: string; targetLang: string; content: string; sourceLang: string }> };
        timestamp: string;
      }>(`${this.basePath}/channels/${channelId}/messages/${messageId}/translations`)
      .then((r) => r.data.data);

  reactMessage = (channelId: string, messageId: string, type: string) =>
    apiClient
      .post<{ success: boolean; data: unknown }>(`${this.basePath}/channels/${channelId}/messages/${messageId}/react`, { type })
      .then((r) => r.data.data);

  toggleMessagePin = (channelId: string, messageId: string) =>
    apiClient
      .post<BaseSingleResponse<TalkMessageResponse>>(`${this.basePath}/channels/${channelId}/messages/${messageId}/pin`)
      .then((r) => r.data.data);

  getPinnedMessages = (channelId: string) =>
    apiClient
      .get<{ success: boolean; data: TalkMessageResponse[]; timestamp: string }>(`${this.basePath}/channels/${channelId}/messages/pinned`)
      .then((r) => r.data.data);

  getMessageReaders = (channelId: string, messageId: string) =>
    apiClient
      .get<BaseSingleResponse<TalkMessageReaderResponse>>(
        `${this.basePath}/channels/${channelId}/messages/${messageId}/readers`,
      )
      .then((r) => r.data.data);

  searchMessages = (channelId: string, query: string, cursor?: string, limit?: number) =>
    apiClient
      .get<SearchMessageListResponse>(`${this.basePath}/channels/${channelId}/messages/search`, {
        params: { q: query, cursor, limit },
      })
      .then((r) => ({ data: r.data.data, nextCursor: r.data.nextCursor, totalCount: r.data.totalCount }));

  sendTyping = (channelId: string) =>
    apiClient.post(`${this.basePath}/channels/${channelId}/messages/typing`);

  toggleMute = (channelId: string) =>
    apiClient
      .patch<{ success: boolean; data: { isMuted: boolean }; timestamp: string }>(
        `${this.basePath}/channels/${channelId}/mute`,
      )
      .then((r) => r.data.data);

  sendHeartbeat = () =>
    apiClient.post(`${this.basePath}/presence/heartbeat`);

  getPresenceStatus = (userIds: string[]) =>
    apiClient
      .get<{ success: boolean; data: Record<string, 'online' | 'offline'>; timestamp: string }>(
        `${this.basePath}/presence/status`,
        { params: { user_ids: userIds.join(',') } },
      )
      .then((r) => r.data.data);
}

export const talkService = new TalkService();
