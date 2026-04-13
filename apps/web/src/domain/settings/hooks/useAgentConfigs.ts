import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentConfigService } from '../service/agent-config.service';

export function useAgentConfigs() {
  return useQuery({
    queryKey: ['agentConfigs'],
    queryFn: () => agentConfigService.getConfigs(),
    select: (res: any) => res.data?.data || res.data || [],
  });
}

export function useAgentConfig(deptCode: string, enabled = true) {
  return useQuery({
    queryKey: ['agentConfig', deptCode],
    queryFn: () => agentConfigService.getConfig(deptCode),
    enabled: !!deptCode && enabled,
    select: (res: any) => res.data?.data || res.data,
  });
}

export function useVisibleAgents() {
  return useQuery({
    queryKey: ['agentConfigs', 'visible'],
    queryFn: () => agentConfigService.getVisibleAgents(),
    select: (res: any) => res.data?.data || res.data || [],
  });
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deptCode, dto }: { deptCode: string; dto: { system_prompt: string; description?: string; is_active?: boolean; visible_cell_ids?: string[] | null } }) =>
      agentConfigService.updateConfig(deptCode, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['agentConfig'] });
    },
  });
}

export function useResetAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deptCode: string) => agentConfigService.resetConfig(deptCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['agentConfig'] });
    },
  });
}
