import { apiClient } from '@/lib/api-client';

export interface SubscriptionData {
  subscriptionId: string;
  planCode: string;
  planTier: string;
  planName: string;
  status: string;
  billingCycle: string | null;
  userCount: number;
  paidUserCount: number;
  monthlyAmount: number;
  startDate: string;
  currentPeriodEnd: string | null;
  isCancelScheduled: boolean;
  plan: {
    planId: string;
    code: string;
    tier: string;
    name: string;
    pricePerUser: number;
    tokenPerUserMonthly: number;
    baseStorageGb: number;
    maxStorageGb: number;
    maxUsers: number;
  } | null;
}

export interface TokenWalletData {
  tokenType: string;
  balance: number;
  lifetimeGranted: number;
  lifetimeConsumed: number;
  lastResetAt: string | null;
  nextResetAt: string | null;
}

export interface StorageQuotaData {
  baseGb: number;
  addonGb: number;
  maxGb: number;
  usedBytes: string;
  totalGb: number;
  usedGb: number;
  usedPct: number;
  isUploadBlocked: boolean;
}

export interface CheckoutResult {
  checkoutUrl: string;
}

export interface PlanData {
  planId: string;
  code: string;
  tier: string;
  name: string;
  pricePerUser: number;
  tokenOnetime: number;
  tokenPerUserMonthly: number;
  baseStorageGb: number;
  maxStorageGb: number;
  maxUsers: number;
  freeUserCount: number;
  isAnnualAvailable: boolean;
  sortOrder: number;
}

export const subscriptionService = {
  getPlans: () =>
    apiClient
      .get<{ success: boolean; data: PlanData[] }>('/subscriptions/plans')
      .then((r) => r.data.data),

  getSubscription: () =>
    apiClient
      .get<{ success: boolean; data: SubscriptionData }>('/subscriptions')
      .then((r) => r.data.data),

  createCheckout: (data: {
    plan_code: string;
    user_count?: number;
    billing_cycle?: string;
  }) =>
    apiClient
      .post<{ success: boolean; data: CheckoutResult }>(
        '/subscriptions/checkout',
        data,
      )
      .then((r) => r.data.data),

  cancelSubscription: () =>
    apiClient
      .post<{ success: boolean }>('/subscriptions/cancel')
      .then((r) => r.data),

  getTokenWallets: () =>
    apiClient
      .get<{
        success: boolean;
        data: { wallets: TokenWalletData[]; totalBalance: number };
      }>('/subscriptions/tokens')
      .then((r) => r.data.data.wallets),

  purchaseTokens: (data: { token_amount: number }) =>
    apiClient
      .post<{ success: boolean; data: CheckoutResult }>(
        '/subscriptions/tokens/purchase',
        data,
      )
      .then((r) => r.data.data),

  getStorageQuota: () =>
    apiClient
      .get<{ success: boolean; data: StorageQuotaData }>(
        '/subscriptions/storage',
      )
      .then((r) => r.data.data),

  purchaseStorage: (data: { storage_gb: number }) =>
    apiClient
      .post<{ success: boolean; data: CheckoutResult }>(
        '/subscriptions/storage/purchase',
        data,
      )
      .then((r) => r.data.data),
};
