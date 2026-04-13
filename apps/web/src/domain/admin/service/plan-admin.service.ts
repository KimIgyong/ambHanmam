import { apiClient } from '@/lib/api-client';

export interface PlanData {
  planId: string;
  code: string;
  name: string;
  tier: string;
  pricePerUser: number;
  tokenOnetime: number;
  tokenPerUserMonthly: number;
  tokenAddonUnit: number;
  tokenAddonPrice: number;
  isTokenMonthlyReset: boolean;
  storageBaseGb: number;
  storageMaxGb: number;
  storageAddonUnitGb: number;
  storageAddonPriceGb: number;
  maxUsers: number;
  minUsers: number;
  userSlotSize: number;
  freeUserCount: number;
  isAnnualAvailable: boolean;
  annualFreeMonths: number;
  isReferralEnabled: boolean;
  referralRewardTokens: number;
  referralInviteRequired: number;
  sortOrder: number;
}

export interface PlanFeatureData {
  featureId: string;
  featureKey: string;
  labelI18nKey: string;
  valueFree: string | null;
  valueBasic: string | null;
  valuePremium: string | null;
  isCheck: boolean;
  highlight: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface PlanTierData {
  tierId: string;
  planId: string;
  tierNumber: number;
  usersMin: number;
  usersMax: number;
  monthlyPrice: number;
  annualPrice: number;
  savings: number;
  tokensMonthly: number;
  sortOrder: number;
  isActive: boolean;
}

export interface PlanAddonData {
  addonId: string;
  addonKey: string;
  labelI18nKey: string;
  valueFree: string | null;
  valueBasic: string | null;
  unit: string | null;
  price: string | null;
  sortOrder: number;
  isActive: boolean;
}

const BASE = '/subscriptions';

export const planAdminService = {
  // ── Admin: Plans ───────────────────────────────────────
  getPlans: (): Promise<PlanData[]> =>
    apiClient.get(`${BASE}/admin/plans`).then((r) => r.data.data),

  updatePlan: (planId: string, data: Record<string, unknown>): Promise<PlanData> =>
    apiClient.put(`${BASE}/admin/plans/${planId}`, data).then((r) => r.data.data),

  // ── Admin: Features ────────────────────────────────────
  getFeatures: (): Promise<PlanFeatureData[]> =>
    apiClient.get(`${BASE}/admin/features`).then((r) => r.data.data),

  createFeature: (data: Record<string, unknown>): Promise<PlanFeatureData> =>
    apiClient.post(`${BASE}/admin/features`, data).then((r) => r.data.data),

  updateFeature: (featureId: string, data: Record<string, unknown>): Promise<PlanFeatureData> =>
    apiClient.put(`${BASE}/admin/features/${featureId}`, data).then((r) => r.data.data),

  deleteFeature: (featureId: string): Promise<void> =>
    apiClient.delete(`${BASE}/admin/features/${featureId}`).then(() => undefined),

  // ── Admin: Tiers ───────────────────────────────────────
  getTiers: (planCode: string): Promise<PlanTierData[]> =>
    apiClient.get(`${BASE}/admin/tiers/${planCode}`).then((r) => r.data.data),

  createTier: (data: Record<string, unknown>): Promise<PlanTierData> =>
    apiClient.post(`${BASE}/admin/tiers`, data).then((r) => r.data.data),

  updateTier: (tierId: string, data: Record<string, unknown>): Promise<PlanTierData> =>
    apiClient.put(`${BASE}/admin/tiers/${tierId}`, data).then((r) => r.data.data),

  deleteTier: (tierId: string): Promise<void> =>
    apiClient.delete(`${BASE}/admin/tiers/${tierId}`).then(() => undefined),

  // ── Admin: Addons ──────────────────────────────────────
  getAddons: (): Promise<PlanAddonData[]> =>
    apiClient.get(`${BASE}/admin/addons`).then((r) => r.data.data),

  createAddon: (data: Record<string, unknown>): Promise<PlanAddonData> =>
    apiClient.post(`${BASE}/admin/addons`, data).then((r) => r.data.data),

  updateAddon: (addonId: string, data: Record<string, unknown>): Promise<PlanAddonData> =>
    apiClient.put(`${BASE}/admin/addons/${addonId}`, data).then((r) => r.data.data),

  deleteAddon: (addonId: string): Promise<void> =>
    apiClient.delete(`${BASE}/admin/addons/${addonId}`).then(() => undefined),
};
