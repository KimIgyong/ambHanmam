import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  conversationAdminService,
  AdminConversationParams,
  ConvertToKnowledgeData,
  SendAdminMessageData,
  ConvertToIssueData,
  ConvertToNoteData,
} from '../service/conversation-admin.service';

const conversationAdminKeys = {
  all: ['conversationAdmin'] as const,
  list: (params: AdminConversationParams) => [...conversationAdminKeys.all, 'list', params] as const,
  detail: (id: string) => [...conversationAdminKeys.all, 'detail', id] as const,
  timeline: (params: AdminConversationParams & { conversation_id?: string }) => [...conversationAdminKeys.all, 'timeline', params] as const,
  entityProjects: (entityId: string) => [...conversationAdminKeys.all, 'entity-projects', entityId] as const,
};

export const useAdminConversations = (params: AdminConversationParams) => {
  return useQuery({
    queryKey: conversationAdminKeys.list(params),
    queryFn: () => conversationAdminService.getConversations(params),
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminConversationDetail = (id: string) => {
  return useQuery({
    queryKey: conversationAdminKeys.detail(id),
    queryFn: () => conversationAdminService.getConversationDetail(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminTimeline = (params: AdminConversationParams & { conversation_id?: string }) => {
  return useQuery({
    queryKey: conversationAdminKeys.timeline(params),
    queryFn: () => conversationAdminService.getTimeline(params),
    staleTime: 1000 * 60,
  });
};

export const useEntityProjects = (entityId: string) => {
  return useQuery({
    queryKey: conversationAdminKeys.entityProjects(entityId),
    queryFn: () => conversationAdminService.getProjectsForEntity(entityId),
    enabled: !!entityId,
    staleTime: 1000 * 60,
  });
};

export const useConvertToKnowledge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConvertToKnowledgeData }) =>
      conversationAdminService.convertToKnowledge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationAdminKeys.all });
    },
  });
};

export const useSendAdminMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SendAdminMessageData }) =>
      conversationAdminService.sendAdminMessage(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: conversationAdminKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: conversationAdminKeys.all });
    },
  });
};

export const useConvertToIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, entityId }: { id: string; data: ConvertToIssueData; entityId?: string }) =>
      conversationAdminService.convertToIssue(id, data, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationAdminKeys.all });
    },
  });
};

export const useConvertToNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, entityId }: { id: string; data: ConvertToNoteData; entityId?: string }) =>
      conversationAdminService.convertToNote(id, data, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationAdminKeys.all });
    },
  });
};
