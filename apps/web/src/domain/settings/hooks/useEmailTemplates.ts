import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface EmailTemplateData {
  code: string;
  subject: string;
  body: string;
  isCustom: boolean;
  updatedAt: string | null;
}

interface TemplateResponse {
  success: boolean;
  data: EmailTemplateData;
}

interface PreviewResponse {
  success: boolean;
  data: { subject: string; html: string };
}

const getTemplate = (code: string, entityId?: string) => {
  const params = entityId ? `?entity_id=${entityId}` : '';
  const base = entityId ? '/entity-settings/email-templates' : '/settings/email-templates';
  return apiClient.get<TemplateResponse>(`${base}/${code}${params}`).then((r) => r.data.data);
};

const upsertTemplate = (code: string, data: { subject: string; body: string }, entityId?: string) => {
  const params = entityId ? `?entity_id=${entityId}` : '';
  const base = entityId ? '/entity-settings/email-templates' : '/settings/email-templates';
  return apiClient.put<TemplateResponse>(`${base}/${code}${params}`, data).then((r) => r.data.data);
};

const deleteTemplate = (code: string, entityId?: string) => {
  const params = entityId ? `?entity_id=${entityId}` : '';
  const base = entityId ? '/entity-settings/email-templates' : '/settings/email-templates';
  return apiClient.delete(`${base}/${code}${params}`);
};

const previewTemplate = (code: string, entityId?: string) => {
  const params = entityId ? `?entity_id=${entityId}` : '';
  const base = entityId ? '/entity-settings/email-templates' : '/settings/email-templates';
  return apiClient.get<PreviewResponse>(`${base}/${code}/preview${params}`).then((r) => r.data.data);
};

export const useEmailTemplate = (code: string, entityId?: string) => {
  return useQuery({
    queryKey: ['emailTemplate', code, entityId ?? 'global'],
    queryFn: () => getTemplate(code, entityId),
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpsertEmailTemplate = (code: string, entityId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { subject: string; body: string }) => upsertTemplate(code, data, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplate', code, entityId ?? 'global'] });
    },
  });
};

export const useDeleteEmailTemplate = (code: string, entityId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTemplate(code, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplate', code, entityId ?? 'global'] });
    },
  });
};

export const usePreviewEmailTemplate = (code: string, entityId?: string) => {
  return useMutation({
    mutationFn: () => previewTemplate(code, entityId),
  });
};
