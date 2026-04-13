import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  portalBridgeService,
  type PortalCustomerQuery,
  type CreateInternalAccountRequest,
} from '../service/portal-bridge.service';

export const portalBridgeKeys = {
  all: ['portal-bridge'] as const,
  customers: (params: PortalCustomerQuery) =>
    [...portalBridgeKeys.all, 'customers', params] as const,
  countries: () => [...portalBridgeKeys.all, 'countries'] as const,
  mappings: (page: number, limit: number) =>
    [...portalBridgeKeys.all, 'mappings', page, limit] as const,
  deletionPreview: (pctId: string) =>
    [...portalBridgeKeys.all, 'deletion-preview', pctId] as const,
};

export const usePortalCustomers = (params: PortalCustomerQuery) => {
  return useQuery({
    queryKey: portalBridgeKeys.customers(params),
    queryFn: () => portalBridgeService.getCustomers(params),
  });
};

export const usePortalCountries = () => {
  return useQuery({
    queryKey: portalBridgeKeys.countries(),
    queryFn: () => portalBridgeService.getCountries(),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePortalMappings = (page: number, limit: number) => {
  return useQuery({
    queryKey: portalBridgeKeys.mappings(page, limit),
    queryFn: () => portalBridgeService.getMappings(page, limit),
  });
};

export const useCreateInternalAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pctId,
      data,
    }: {
      pctId: string;
      data: CreateInternalAccountRequest;
    }) => portalBridgeService.createInternalAccount(pctId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalBridgeKeys.all });
    },
  });
};

export const useRevokeMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pumId: string) => portalBridgeService.revokeMapping(pumId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalBridgeKeys.all });
    },
  });
};

export const useDeletePortalCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pctId: string) => portalBridgeService.deleteCustomer(pctId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalBridgeKeys.all });
    },
  });
};

export const useDeletionPreview = (pctId: string | null) => {
  return useQuery({
    queryKey: portalBridgeKeys.deletionPreview(pctId || ''),
    queryFn: () => portalBridgeService.getDeletionPreview(pctId!),
    enabled: !!pctId,
  });
};

export const usePermanentDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pctId, data }: { pctId: string; data: { level: number; confirm_email: string } }) =>
      portalBridgeService.deleteCustomerPermanent(pctId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalBridgeKeys.all });
    },
  });
};
