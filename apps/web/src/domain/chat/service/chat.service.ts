import { apiClient } from '@/lib/api-client';
import {
  ConversationResponse,
  ConversationDetailResponse,
  BaseListResponse,
  BaseSingleResponse,
} from '@amb/types';

class ChatService {
  private readonly basePath = '/conversations';

  getConversations = (params?: { page?: number; size?: number; unit?: string }) =>
    apiClient
      .get<BaseListResponse<ConversationResponse>>(this.basePath, { params })
      .then((r) => r.data);

  getConversationDetail = (id: string) =>
    apiClient
      .get<BaseSingleResponse<ConversationDetailResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createConversation = (unitCode: string, title: string) =>
    apiClient
      .post<BaseSingleResponse<ConversationResponse>>(this.basePath, {
        unit_code: unitCode,
        title,
      })
      .then((r) => r.data.data);

  deleteConversation = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

export const chatService = new ChatService();
