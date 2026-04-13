import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slackIntegrationService } from '../service/slack-integration.service';

/* ── Query Keys ── */

export const slackKeys = {
  all: ['slack'] as const,
  config: () => [...slackKeys.all, 'config'] as const,
  workspaces: () => [...slackKeys.all, 'workspaces'] as const,
  channels: (workspaceId: string) => [...slackKeys.all, 'channels', workspaceId] as const,
  mappings: () => [...slackKeys.all, 'mappings'] as const,
};

/* ── Slack App Config Hooks ── */

export const useSlackConfig = () =>
  useQuery({
    queryKey: slackKeys.config(),
    queryFn: () => slackIntegrationService.getConfig(),
    staleTime: 2 * 60 * 1000,
  });

export const useSaveSlackConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, value }: { provider: string; value: string }) =>
      slackIntegrationService.saveConfig(provider, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.config() });
    },
  });
};

export const useDeleteSlackConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => slackIntegrationService.deleteConfig(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.config() });
    },
  });
};

/* ── Workspace Hooks ── */

export const useSlackWorkspaces = () =>
  useQuery({
    queryKey: slackKeys.workspaces(),
    queryFn: () => slackIntegrationService.getWorkspaces(),
    staleTime: 2 * 60 * 1000,
  });

export const useConnectWithBotToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (botToken: string) => slackIntegrationService.connectWithBotToken(botToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.workspaces() });
    },
  });
};

export const useDisconnectWorkspace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => slackIntegrationService.disconnectWorkspace(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.workspaces() });
      qc.invalidateQueries({ queryKey: slackKeys.mappings() });
    },
  });
};

export const useSlackChannels = (workspaceId: string) =>
  useQuery({
    queryKey: slackKeys.channels(workspaceId),
    queryFn: () => slackIntegrationService.getSlackChannels(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60 * 1000,
  });

/* ── Channel Mapping Hooks ── */

export const useSlackMappings = () =>
  useQuery({
    queryKey: slackKeys.mappings(),
    queryFn: () => slackIntegrationService.getMappings(),
    staleTime: 2 * 60 * 1000,
  });

export const useCreateMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      swc_id: string;
      slack_channel_id: string;
      slack_channel_name?: string;
      ama_channel_id?: string;
      direction?: string;
    }) => slackIntegrationService.createMapping(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.mappings() });
    },
  });
};

export const useUpdateMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; direction?: string } }) =>
      slackIntegrationService.updateMapping(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.mappings() });
    },
  });
};

export const useDeleteMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => slackIntegrationService.deleteMapping(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.mappings() });
    },
  });
};

/* ── Import History ── */

export const useImportHistory = () => {
  return useMutation({
    mutationFn: ({ mappingId, data }: {
      mappingId: string;
      data?: { oldest?: string; latest?: string; limit?: number };
    }) => slackIntegrationService.importHistory(mappingId, data),
  });
};

/* ── Sync Members ── */

export const useSyncMembers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mappingId: string) => slackIntegrationService.syncMembers(mappingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: slackKeys.mappings() });
    },
  });
};
