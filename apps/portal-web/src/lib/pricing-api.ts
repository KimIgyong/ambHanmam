import api from '@/lib/api';

export interface PricingPlan {
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

export interface PricingFeature {
  featureId: string;
  featureKey: string;
  labelI18nKey: string;
  valueFree: string | null;
  valueBasic: string | null;
  valuePremium: string | null;
  isCheck: boolean;
  highlight: boolean;
  sortOrder: number;
}

export interface PricingTier {
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
}

export interface PricingAddon {
  addonId: string;
  addonKey: string;
  labelI18nKey: string;
  valueFree: string | null;
  valueBasic: string | null;
  unit: string | null;
  price: string | null;
  sortOrder: number;
}

export interface FullPricingData {
  plans: PricingPlan[];
  features: PricingFeature[];
  tiers: Record<string, PricingTier[]>;
  addons: PricingAddon[];
}

export const pricingApi = {
  getFullPricingData: (): Promise<FullPricingData> =>
    api.get('/pricing/full').then((r) => r.data.data),
};
