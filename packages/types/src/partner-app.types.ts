// ──────────────────────────────────────
// 파트너 앱 상태
// ──────────────────────────────────────
export const PARTNER_APP_STATUS = {
  /** 초안 (등록 직후) */
  DRAFT: 'DRAFT',
  /** 심사 제출됨 */
  SUBMITTED: 'SUBMITTED',
  /** 심사 진행 중 */
  IN_REVIEW: 'IN_REVIEW',
  /** 심사 승인 */
  APPROVED: 'APPROVED',
  /** 심사 거절 */
  REJECTED: 'REJECTED',
  /** 발행 (앱스토어에 노출) */
  PUBLISHED: 'PUBLISHED',
  /** 정지 (관리자에 의해 비활성화) */
  SUSPENDED: 'SUSPENDED',
  /** 지원 종료 */
  DEPRECATED: 'DEPRECATED',
} as const;
export type PartnerAppStatus = (typeof PARTNER_APP_STATUS)[keyof typeof PARTNER_APP_STATUS];

// ──────────────────────────────────────
// 파트너 앱 카테고리
// ──────────────────────────────────────
export const PARTNER_APP_CATEGORY = {
  HR: 'HR',
  BILLING: 'BILLING',
  PROJECT: 'PROJECT',
  GENERAL: 'GENERAL',
} as const;
export type PartnerAppCategory = (typeof PARTNER_APP_CATEGORY)[keyof typeof PARTNER_APP_CATEGORY];

// ──────────────────────────────────────
// 파트너 앱 인증/오픈 모드
// ──────────────────────────────────────
export const PARTNER_APP_AUTH_MODE = {
  JWT: 'jwt',
  API_KEY: 'api_key',
  NONE: 'none',
} as const;
export type PartnerAppAuthMode = (typeof PARTNER_APP_AUTH_MODE)[keyof typeof PARTNER_APP_AUTH_MODE];

export const PARTNER_APP_OPEN_MODE = {
  IFRAME: 'iframe',
  NEW_TAB: 'new_tab',
} as const;
export type PartnerAppOpenMode = (typeof PARTNER_APP_OPEN_MODE)[keyof typeof PARTNER_APP_OPEN_MODE];

// ──────────────────────────────────────
// 파트너 조직 상태
// ──────────────────────────────────────
export const PARTNER_ORG_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type PartnerOrgStatus = (typeof PARTNER_ORG_STATUS)[keyof typeof PARTNER_ORG_STATUS];
