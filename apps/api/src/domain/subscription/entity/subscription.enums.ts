// ─────────────────────────────────────────────────────────────
// Subscription Domain Enums
// ─────────────────────────────────────────────────────────────

export enum PlanTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum TokenType {
  BASE = 'BASE',
  ADDON = 'ADDON',
  REFERRAL = 'REFERRAL',
}

export enum LedgerDirection {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum LedgerReason {
  MONTHLY_GRANT = 'MONTHLY_GRANT',
  ONETIME_GRANT = 'ONETIME_GRANT',
  ADDON_PURCHASE = 'ADDON_PURCHASE',
  REFERRAL_REWARD = 'REFERRAL_REWARD',
  AI_USAGE = 'AI_USAGE',
  RESET = 'RESET',
  MANUAL_ADJUST = 'MANUAL_ADJUST',
}

export enum WebhookEventStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  IGNORED = 'IGNORED',
}
