import { apiClient } from '@/lib/api-client';
import type { ProjectResponse } from '@amb/types';

export interface AdminConversationParams {
  entity_id?: string;
  department?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface AdminConversationItem {
  conversationId: string;
  userId: string;
  unit: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  entityId: string | null;
  entityCode: string;
  entityName: string;
}

export interface AdminMessageItem {
  messageId: string;
  conversationId: string;
  role: string;
  content: string;
  tokenCount: number;
  order: number;
  createdAt: string;
}

export interface AdminTimelineItem extends AdminMessageItem {
  userName: string;
  userEmail: string;
  unit: string;
  title: string;
  entityId: string | null;
  entityCode: string;
  entityName: string;
}

export interface AdminConversationDetail extends AdminConversationItem {
  messages: AdminMessageItem[];
}

export interface ConvertToKnowledgeData {
  title: string;
  content: string;
  visibility?: string;
  type?: string;
}

export interface SendAdminMessageData {
  content: string;
}

export interface ConvertToIssueData {
  title: string;
  description: string;
  type: string;
  severity: string;
  priority?: number;
  project_id?: string;
  source_message_id?: string;
}

export interface ConvertToNoteData {
  title: string;
  content: string;
  type?: string;
  visibility?: string;
  project_ids?: string[];
  issue_ids?: string[];
  source_message_id?: string;
}

class ConversationAdminService {
  async getConversations(params: AdminConversationParams) {
    const res = await apiClient.get('/conversations/admin', { params });
    return res.data;
  }

  async getTimeline(params: AdminConversationParams & { conversation_id?: string }) {
    const res = await apiClient.get('/conversations/admin/timeline', { params });
    return res.data;
  }

  async getConversationDetail(id: string) {
    const res = await apiClient.get(`/conversations/admin/${id}`);
    return res.data;
  }

  async convertToKnowledge(id: string, data: ConvertToKnowledgeData) {
    const res = await apiClient.post(`/conversations/${id}/convert-to-knowledge`, data);
    return res.data;
  }

  async sendAdminMessage(id: string, data: SendAdminMessageData) {
    const res = await apiClient.post(`/conversations/admin/${id}/messages`, data);
    return res.data;
  }

  async convertToIssue(id: string, data: ConvertToIssueData, entityId?: string) {
    const res = await apiClient.post(`/conversations/${id}/convert-to-issue`, data, {
      headers: entityId ? { 'X-Entity-Id': entityId } : undefined,
    });
    return res.data;
  }

  async convertToNote(id: string, data: ConvertToNoteData, entityId?: string) {
    const res = await apiClient.post(`/conversations/${id}/convert-to-note`, data, {
      headers: entityId ? { 'X-Entity-Id': entityId } : undefined,
    });
    return res.data;
  }

  async getProjectsForEntity(entityId: string): Promise<ProjectResponse[]> {
    const res = await apiClient.get('/project/projects', {
      headers: { 'X-Entity-Id': entityId },
    });
    return res.data.data || [];
  }
}

export const conversationAdminService = new ConversationAdminService();
