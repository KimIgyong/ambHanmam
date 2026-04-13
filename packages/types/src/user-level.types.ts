// ──────────────────────────────────────
// 조직 레벨
// ──────────────────────────────────────
export const ORG_LEVEL = {
  /** 최상위 조직 (HQ). 시스템에 1개만 존재. */
  ROOT: 'ROOT',
  /** 하위 법인. HQ가 생성/관리. */
  SUBSIDIARY: 'SUBSIDIARY',
} as const;
export type OrgLevel = (typeof ORG_LEVEL)[keyof typeof ORG_LEVEL];

// ──────────────────────────────────────
// 사용자 레벨 코드
// ──────────────────────────────────────
export const USER_LEVEL_CODE = {
  /** HQ 소속 관리자 레벨 — 전체 서비스 관리, 모든 하위 조직 데이터 CRUD */
  ADMIN_LEVEL: 'ADMIN_LEVEL',
  /** 하위 법인 소속 사용자 레벨 — 소속 법인 범위 내 활동 */
  USER_LEVEL: 'USER_LEVEL',
  /** 파트너사 소속 사용자 레벨 — 자사 파트너 데이터 범위 내 활동 */
  PARTNER_LEVEL: 'PARTNER_LEVEL',
  /** 고객사 소속 사용자 레벨 — 배정된 프로젝트 범위 내 활동 */
  CLIENT_LEVEL: 'CLIENT_LEVEL',
} as const;
export type UserLevelCode = (typeof USER_LEVEL_CODE)[keyof typeof USER_LEVEL_CODE];

// ──────────────────────────────────────
// 사용자 역할
// ──────────────────────────────────────
export const USER_ROLE = {
  // ── ADMIN_LEVEL 전용 (HQ 소속) ──
  /** 시스템 최고 관리자. 모든 권한. */
  SUPER_ADMIN: 'SUPER_ADMIN',
  /** 운영 관리자. 설정 일부 제외한 전체 관리. */
  ADMIN: 'ADMIN',

  // ── USER_LEVEL 전용 (하위 법인 소속) ──
  /** 법인 관리자. 소속 법인 내 멤버/권한/설정 관리. */
  MASTER: 'MASTER',
  /** 부서/팀 관리자. 소속 법인 내 관리 기능. */
  MANAGER: 'MANAGER',
  /** 일반 직원. 소속 법인 내 기본 기능. */
  MEMBER: 'MEMBER',
  /** 읽기 전용 사용자. */
  VIEWER: 'VIEWER',

  // ── PARTNER_LEVEL 전용 (파트너사 소속) ──
  /** 파트너사 관리자. 커스텀앱 등록/관리, 소속 파트너 직원 관리. */
  PARTNER_ADMIN: 'PARTNER_ADMIN',
  /** 파트너사 일반 멤버. 앱 현황 조회. */
  PARTNER_MEMBER: 'PARTNER_MEMBER',

  // ── CLIENT_LEVEL 전용 (고객사 소속) ──
  /** 고객사 관리자. 소속 고객사 직원 초대 가능. */
  CLIENT_ADMIN: 'CLIENT_ADMIN',
  /** 고객사 일반 직원. 배정된 프로젝트 조회, 이슈 등록. */
  CLIENT_MEMBER: 'CLIENT_MEMBER',
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// ──────────────────────────────────────
// 사용자 상태
// ──────────────────────────────────────
export const USER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// ──────────────────────────────────────
// 초대 상태
// ──────────────────────────────────────
export const INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type InvitationStatus = (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

// ──────────────────────────────────────
// 레벨-역할 유효 조합
// ──────────────────────────────────────
export const VALID_LEVEL_ROLES: Record<UserLevelCode, readonly UserRole[]> = {
  ADMIN_LEVEL: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
  USER_LEVEL: [USER_ROLE.MASTER, USER_ROLE.MANAGER, USER_ROLE.MEMBER, USER_ROLE.VIEWER],
  PARTNER_LEVEL: [USER_ROLE.PARTNER_ADMIN, USER_ROLE.PARTNER_MEMBER],
  CLIENT_LEVEL: [USER_ROLE.CLIENT_ADMIN, USER_ROLE.CLIENT_MEMBER],
} as const;

// ──────────────────────────────────────
// 가입 경로
// ──────────────────────────────────────
export const JOIN_METHOD = {
  /** 시스템 초기 시드 데이터 */
  SEED: 'SEED',
  /** 자체 회원가입 */
  REGISTER: 'REGISTER',
  /** 초대를 통한 가입 */
  INVITE: 'INVITE',
  /** 포탈 고객 계정 전환 */
  PORTAL: 'PORTAL',
  /** 파트너사 초대를 통한 가입 */
  PARTNER_INVITE: 'PARTNER_INVITE',
  /** 고객사 초대를 통한 가입 */
  CLIENT_INVITE: 'CLIENT_INVITE',
} as const;
export type JoinMethod = (typeof JOIN_METHOD)[keyof typeof JOIN_METHOD];

// ──────────────────────────────────────
// 레벨-조직레벨 유효 조합
// ──────────────────────────────────────
export const VALID_LEVEL_ORG_LEVEL: Partial<Record<UserLevelCode, OrgLevel>> = {
  ADMIN_LEVEL: ORG_LEVEL.ROOT,        // ADMIN_LEVEL은 반드시 HQ(ROOT) 소속
  USER_LEVEL: ORG_LEVEL.SUBSIDIARY,   // USER_LEVEL은 반드시 하위 법인 소속
  // PARTNER_LEVEL은 조직 레벨 무관 (독립 파트너사 소속)
  // CLIENT_LEVEL은 조직 레벨 무관 (고객사 소속)
} as const;
