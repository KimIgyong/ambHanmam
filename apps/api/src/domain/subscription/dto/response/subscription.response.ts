import { SubSubscriptionEntity } from '../../entity/sub-subscription.entity';
import { SubTokenWalletEntity } from '../../entity/sub-token-wallet.entity';
import { SubStorageQuotaEntity } from '../../entity/sub-storage-quota.entity';

export class TokenWalletResponse {
  tokenType: string;
  balance: number;
  lifetimeGranted: number;
  lifetimeConsumed: number;
  nextResetAt: string | null;

  static from(w: SubTokenWalletEntity): TokenWalletResponse {
    return {
      tokenType: w.tkw_token_type,
      balance: w.tkw_balance,
      lifetimeGranted: w.tkw_lifetime_granted,
      lifetimeConsumed: w.tkw_lifetime_consumed,
      nextResetAt: w.tkw_next_reset_at?.toISOString() ?? null,
    };
  }
}

export class StorageQuotaResponse {
  baseGb: number;
  addonGb: number;
  totalGb: number;
  maxGb: number;
  usedBytes: number;
  usedGb: number;
  usedPct: number;
  isUploadBlocked: boolean;

  static from(q: SubStorageQuotaEntity): StorageQuotaResponse {
    return {
      baseGb: q.sqt_base_gb,
      addonGb: q.sqt_addon_gb,
      totalGb: q.totalGb,
      maxGb: q.sqt_max_gb,
      usedBytes: Number(q.sqt_used_bytes),
      usedGb: +q.usedGb.toFixed(3),
      usedPct: +q.usedPct.toFixed(1),
      isUploadBlocked: q.sqt_is_upload_blocked,
    };
  }
}

export class SubscriptionResponse {
  subscriptionId: string;
  planCode: string;
  planTier: string;
  planName: string;
  status: string;
  billingCycle: string;
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
  tokenWallets: TokenWalletResponse[];
  storageQuota: StorageQuotaResponse | null;

  static from(
    sbn: SubSubscriptionEntity,
    wallets: SubTokenWalletEntity[],
    quota: SubStorageQuotaEntity | null,
  ): SubscriptionResponse {
    const monthlyAmount =
      sbn.sbn_paid_user_count * (sbn.plan?.pln_price_per_user ?? 0);
    return {
      subscriptionId: sbn.sbn_id,
      planCode: sbn.plan?.pln_code ?? '',
      planTier: sbn.plan?.pln_tier ?? '',
      planName: sbn.plan?.pln_name ?? '',
      status: sbn.sbn_status,
      billingCycle: sbn.sbn_billing_cycle,
      userCount: sbn.sbn_user_count,
      paidUserCount: sbn.sbn_paid_user_count,
      monthlyAmount,
      startDate: sbn.sbn_created_at?.toISOString() ?? new Date().toISOString(),
      currentPeriodEnd: sbn.sbn_current_period_end?.toISOString() ?? null,
      isCancelScheduled: sbn.sbn_is_cancel_scheduled,
      plan: sbn.plan
        ? {
            planId: sbn.plan.pln_id,
            code: sbn.plan.pln_code,
            tier: sbn.plan.pln_tier,
            name: sbn.plan.pln_name,
            pricePerUser: Number(sbn.plan.pln_price_per_user),
            tokenPerUserMonthly: sbn.plan.pln_token_per_user_monthly,
            baseStorageGb: sbn.plan.pln_storage_base_gb,
            maxStorageGb: sbn.plan.pln_storage_max_gb,
            maxUsers: sbn.plan.pln_max_users,
          }
        : null,
      tokenWallets: wallets.map(TokenWalletResponse.from),
      storageQuota: quota ? StorageQuotaResponse.from(quota) : null,
    };
  }
}

export class PlanResponse {
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

  static from(p: import('../../entity/sub-plan.entity').SubPlanEntity): PlanResponse {
    return {
      planId: p.pln_id,
      code: p.pln_code,
      name: p.pln_name,
      tier: p.pln_tier,
      pricePerUser: Number(p.pln_price_per_user),
      tokenOnetime: p.pln_token_onetime,
      tokenPerUserMonthly: p.pln_token_per_user_monthly,
      tokenAddonUnit: p.pln_token_addon_unit,
      tokenAddonPrice: Number(p.pln_token_addon_price),
      isTokenMonthlyReset: p.pln_is_token_monthly_reset,
      storageBaseGb: p.pln_storage_base_gb,
      storageMaxGb: p.pln_storage_max_gb,
      storageAddonUnitGb: p.pln_storage_addon_unit_gb,
      storageAddonPriceGb: Number(p.pln_storage_addon_price_gb),
      maxUsers: p.pln_max_users,
      minUsers: p.pln_min_users,
      userSlotSize: p.pln_user_slot_size,
      freeUserCount: p.pln_free_user_count,
      isAnnualAvailable: p.pln_is_annual_available,
      annualFreeMonths: p.pln_annual_free_months,
      isReferralEnabled: p.pln_is_referral_enabled,
      referralRewardTokens: p.pln_referral_reward_tokens,
      referralInviteRequired: p.pln_referral_invite_required,
      sortOrder: p.pln_sort_order,
    };
  }
}
