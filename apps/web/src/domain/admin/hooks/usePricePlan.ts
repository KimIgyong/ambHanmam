import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  planAdminService,
  type PlanData,
  type PlanFeatureData,
  type PlanTierData,
  type PlanAddonData,
} from '../service/plan-admin.service';

const keys = {
  plans: () => ['admin', 'plans'] as const,
  features: () => ['admin', 'plan-features'] as const,
  tiers: (code: string) => ['admin', 'plan-tiers', code] as const,
  addons: () => ['admin', 'plan-addons'] as const,
};

// ── Queries ──────────────────────────────────────────────

export const useAdminPlans = () =>
  useQuery<PlanData[]>({
    queryKey: keys.plans(),
    queryFn: planAdminService.getPlans,
    staleTime: 1000 * 60 * 5,
  });

export const useAdminFeatures = () =>
  useQuery<PlanFeatureData[]>({
    queryKey: keys.features(),
    queryFn: planAdminService.getFeatures,
    staleTime: 1000 * 60 * 5,
  });

export const useAdminTiers = (planCode: string) =>
  useQuery<PlanTierData[]>({
    queryKey: keys.tiers(planCode),
    queryFn: () => planAdminService.getTiers(planCode),
    staleTime: 1000 * 60 * 5,
    enabled: !!planCode,
  });

export const useAdminAddons = () =>
  useQuery<PlanAddonData[]>({
    queryKey: keys.addons(),
    queryFn: planAdminService.getAddons,
    staleTime: 1000 * 60 * 5,
  });

// ── Mutations ────────────────────────────────────────────

export const useUpdatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: Record<string, unknown> }) =>
      planAdminService.updatePlan(planId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.plans() }),
  });
};

export const useCreateFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planAdminService.createFeature(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.features() }),
  });
};

export const useUpdateFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ featureId, data }: { featureId: string; data: Record<string, unknown> }) =>
      planAdminService.updateFeature(featureId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.features() }),
  });
};

export const useDeleteFeature = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (featureId: string) => planAdminService.deleteFeature(featureId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.features() }),
  });
};

export const useCreateTier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planAdminService.createTier(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plan-tiers'] });
    },
  });
};

export const useUpdateTier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, data }: { tierId: string; data: Record<string, unknown> }) =>
      planAdminService.updateTier(tierId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plan-tiers'] });
    },
  });
};

export const useDeleteTier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tierId: string) => planAdminService.deleteTier(tierId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plan-tiers'] });
    },
  });
};

export const useCreateAddon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => planAdminService.createAddon(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.addons() }),
  });
};

export const useUpdateAddon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ addonId, data }: { addonId: string; data: Record<string, unknown> }) =>
      planAdminService.updateAddon(addonId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.addons() }),
  });
};

export const useDeleteAddon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addonId: string) => planAdminService.deleteAddon(addonId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.addons() }),
  });
};
