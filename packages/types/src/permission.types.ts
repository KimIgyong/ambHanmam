import type { UserRole } from './user-level.types';

// ──────────────────────────────────────
// 데이터 접근 범위
// ──────────────────────────────────────
export const DATA_SCOPE = {
  /** 모든 조직의 데이터 (HQ 소속) */
  ALL: 'ALL',
  /** 소속 조직 데이터만 */
  OWN_ORG: 'OWN_ORG',
  /** 소속 파트너사 데이터만 */
  PARTNER: 'PARTNER',
  /** 본인 데이터만 */
  OWN_ONLY: 'OWN_ONLY',
} as const;
export type DataScope = (typeof DATA_SCOPE)[keyof typeof DATA_SCOPE];

// ──────────────────────────────────────
// 역할별 데이터 접근 범위
// ──────────────────────────────────────
export const ROLE_DATA_SCOPE: Record<UserRole, DataScope> = {
  SUPER_ADMIN: 'ALL',       // HQ → 전체 열람/수정
  ADMIN: 'ALL',             // HQ → 전체 열람/수정
  MASTER: 'OWN_ORG',        // 법인 → 소속 법인 관리
  MANAGER: 'OWN_ORG',       // 법인 → 소속 법인만
  MEMBER: 'OWN_ORG',        // 법인 → 소속 법인만
  VIEWER: 'OWN_ORG',        // 법인 → 소속 법인 읽기만
  PARTNER_ADMIN: 'PARTNER', // 파트너사 → 소속 파트너사 데이터만
  PARTNER_MEMBER: 'PARTNER', // 파트너사 → 소속 파트너사 데이터만
  CLIENT_ADMIN: 'OWN_ONLY', // 고객사 → 배정된 프로젝트만
  CLIENT_MEMBER: 'OWN_ONLY', // 고객사 → 배정된 프로젝트만
} as const;

// ──────────────────────────────────────
// 메뉴 권한 정의
// ──────────────────────────────────────
export interface MenuPermission {
  key: string;
  path: string;
  /** 접근 가능 역할 */
  allowedRoles: readonly UserRole[];
  /** 읽기 전용 역할 */
  readOnlyRoles?: readonly UserRole[];
  /** CUD 가능 역할 (allowedRoles의 부분 집합) */
  writeRoles?: readonly UserRole[];
}

export const MENU_PERMISSIONS: readonly MenuPermission[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
  },
  {
    key: 'chat',
    path: '/chat',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'projects',
    path: '/projects',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'issues',
    path: '/issues',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'notices',
    path: '/notices',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER'],
    readOnlyRoles: ['MANAGER', 'MEMBER', 'VIEWER'],
  },
  {
    key: 'meetingNotes',
    path: '/meeting-notes',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'attendance',
    path: '/attendance',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'drive',
    path: '/drive',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'mail',
    path: '/mail',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER'],
  },
  {
    key: 'hr',
    path: '/hr',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER'],
    readOnlyRoles: ['MANAGER'],
  },
  {
    key: 'accounting',
    path: '/accounting',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER'],
    readOnlyRoles: ['MANAGER'],
  },
  {
    key: 'billing',
    path: '/billing',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER'],
    readOnlyRoles: ['MANAGER'],
  },
  {
    key: 'kms',
    path: '/kms',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'members',
    path: '/members',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'settings',
    path: '/settings',
    allowedRoles: ['SUPER_ADMIN'],
    writeRoles: ['SUPER_ADMIN'],
  },
  {
    key: 'entitySettings',
    path: '/entity-settings',
    allowedRoles: ['MASTER'],
    writeRoles: ['MASTER'],
  },
  {
    key: 'auditLogs',
    path: '/audit-logs',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    readOnlyRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
] as const;
