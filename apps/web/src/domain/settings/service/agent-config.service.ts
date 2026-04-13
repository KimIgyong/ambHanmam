import { apiClient } from '@/lib/api-client';

export const agentConfigService = {
  getConfigs: () => apiClient.get('/agents/configs'),
  getConfig: (deptCode: string) => apiClient.get(`/agents/configs/${deptCode}`),
  getVisibleAgents: () => apiClient.get('/agents/configs/visible'),
  updateConfig: (deptCode: string, dto: { system_prompt: string; description?: string; is_active?: boolean; visible_cell_ids?: string[] | null }) =>
    apiClient.patch(`/agents/configs/${deptCode}`, dto),
  resetConfig: (deptCode: string) => apiClient.post(`/agents/configs/${deptCode}/reset`),
};
