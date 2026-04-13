# 작업 계획서: 사용자 그룹 및 권한 관리 체계 구현

> **문서 ID**: PLAN-UserGroupPermission-작업계획-20260222
> **작성일**: 2026-02-22
> **상태**: Phase별 구현 준비 완료

---

## 1. 현행 시스템 분석 요약

### 1.1 현행 인증/인가 구조

| 항목 | 현행 | 문제점 |
|------|------|--------|
| 사용자 그룹 | 없음 (단일 그룹) | 어드민/일반 사용자 구분 불가 |
| 역할 | `ADMIN` / `USER` 2가지 | 세밀한 권한 제어 불가 |
| 상태 | `ACTIVE` / `INACTIVE` 2가지 | 승인대기, 정지 등 미지원 |
| 인가 | `JwtAuthGuard`만 적용 (로그인 여부만 검증) | 역할 기반 접근 제어 미작동 |
| `RolesGuard` | 코드 존재하나 **어떤 컨트롤러에도 미적용** | 사실상 미사용 |
| 메뉴 접근 | 모든 인증 사용자가 모든 메뉴 접근 | 권한 체계 없음 |
| 회원가입 | 없음 (어드민이 직접 DB 또는 API로 생성) | 자체 가입 불가 |
| 초대 | 없음 | 사용자 온보딩에 공백 |
| 초기 관리자 | 시드에 하드코딩 | env 파일 기반 설정 필요 |
| 조직 구조 | 평면적 (HQ/KR/VN 동등) | HQ가 최상위 조직으로서 하위 조직을 소유하는 계층 구조 필요 |

### 1.2 조직 체계 요구사항

```
기존 (잘못된 구조):
  HQ ──── KR ──── VN     ← 3개가 동등한 레벨

요구사항 (올바른 구조):
       HQ (최상위)
       ├── 아메바컴퍼니주식회사 (KR)
       ├── amoeba co.,ltd (VN)
       ├── [향후 추가될 법인 A]
       └── [향후 추가될 법인 B]
```

**핵심 규칙:**
- HQ는 시스템 최상위 조직으로, 사용자가 생성하는 하위 조직(법인)을 소유한다.
- HQ 소속 사용자는 서비스의 모든 메뉴를 관리할 수 있다.
- HQ 소속 사용자는 모든 하위 조직(법인)의 데이터를 작성/열람/수정/삭제할 수 있다.
- 하위 법인 소속 사용자는 해당 법인 범위 내에서만 활동한다.

### 1.3 HQ 소속 vs 하위 조직 소속 비교

| 구분 | HQ 소속 (어드민그룹) | 하위 법인 소속 (사용자그룹) |
|------|---------------------|--------------------------|
| **메뉴 접근** | 모든 메뉴 접근 가능 | 권한에 따라 제한 |
| **데이터 범위** | 전체 하위 조직 데이터 CRUD | 본인 소속 조직 데이터만 |
| **조직 관리** | 하위 조직 생성/수정/삭제 | 불가 |
| **사용자 관리** | 전체 사용자 CRUD + 승인 | 불가 |
| **설정** | 시스템 설정 전체 | 불가 |
| **열람 범위** | 모든 법인의 프로젝트, 이슈, 문서 등 | 본인 법인 데이터만 |

### 1.4 변경 영향 범위

```
영향 범위 (apps/api + apps/web)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[변경] packages/types/       ← 공유 타입 추가
[변경] packages/common/      ← 권한 유틸 추가
[변경] apps/api/auth/        ← 인증 체계 확장
[변경] apps/api/members/     ← 엔티티/서비스/컨트롤러 확장
[추가] apps/api/invitation/  ← 초대 모듈 신규
[변경] apps/api/모든 컨트롤러 ← RolesGuard + DataScope 적용
[변경] apps/web/stores/      ← auth store + org store 확장
[변경] apps/web/router/      ← 권한 기반 라우팅
[변경] apps/web/layout/      ← 동적 메뉴 + 조직 선택
[추가] apps/web/pages/auth/  ← 회원가입, 초대수락, 승인대기 등
[변경] env/                  ← 초기 관리자 환경변수

[영향없음] apps/portal-api/  ← 별도 인증 체계
[영향없음] apps/portal-web/  ← 별도 앱
```

---

## 2. 조직 계층 모델

```
┌──────────────────────────────────────────────────────────────────┐
│                      조직 계층 구조                                │
│                                                                  │
│                    ┌──────────────┐                               │
│                    │     HQ       │  ← 시스템 최상위 (자동 생성)    │
│                    │  (root org)  │     삭제/변경 불가              │
│                    └──────┬───────┘                               │
│                           │                                      │
│              ┌────────────┼────────────┐                         │
│              │            │            │                         │
│     ┌────────▼───┐ ┌─────▼──────┐ ┌───▼──────────┐             │
│     │ KR 법인     │ │ VN 법인    │ │ 향후 법인 N   │ ← 사용자가  │
│     │ (child org)│ │ (child org)│ │ (child org)  │   생성 가능  │
│     └────────────┘ └────────────┘ └──────────────┘             │
│                                                                  │
│  ※ HQ 소속 사용자 = 전체 서비스 관리자                             │
│  ※ 하위 법인 소속 사용자 = 해당 법인 범위 내에서만 활동             │
│  ※ 하위 법인은 HQ 어드민이 생성/수정/삭제                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. 단계별 구현 계획

### Phase 1: 공유 타입 및 상수 정의 (0.5일)

#### 1-1. `packages/types/src/user-group.types.ts` (신규)

```typescript
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
// 사용자 그룹 코드
// ──────────────────────────────────────
export const USER_GROUP_CODE = {
  /** HQ 소속 관리자 그룹 — 전체 서비스 관리, 모든 하위 조직 데이터 CRUD */
  ADMIN_GROUP: 'ADMIN_GROUP',
  /** 하위 법인 소속 사용자 그룹 — 소속 법인 범위 내 활동 */
  USER_GROUP: 'USER_GROUP',
} as const;
export type UserGroupCode = (typeof USER_GROUP_CODE)[keyof typeof USER_GROUP_CODE];

// ──────────────────────────────────────
// 사용자 역할
// ──────────────────────────────────────
export const USER_ROLE = {
  // ── ADMIN_GROUP 전용 (HQ 소속) ──
  /** 시스템 최고 관리자. 모든 권한. */
  SUPER_ADMIN: 'SUPER_ADMIN',
  /** 운영 관리자. 설정 일부 제외한 전체 관리. */
  ADMIN: 'ADMIN',

  // ── USER_GROUP 전용 (하위 법인 소속) ──
  /** 부서/팀 관리자. 소속 법인 내 관리 기능. */
  MANAGER: 'MANAGER',
  /** 일반 직원. 소속 법인 내 기본 기능. */
  MEMBER: 'MEMBER',
  /** 읽기 전용 사용자. */
  VIEWER: 'VIEWER',
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
// 그룹-역할 유효 조합
// ──────────────────────────────────────
export const VALID_GROUP_ROLES: Record<UserGroupCode, readonly UserRole[]> = {
  ADMIN_GROUP: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
  USER_GROUP: [USER_ROLE.MANAGER, USER_ROLE.MEMBER, USER_ROLE.VIEWER],
} as const;

// ──────────────────────────────────────
// 그룹-조직레벨 유효 조합
// ──────────────────────────────────────
export const VALID_GROUP_ORG_LEVEL: Record<UserGroupCode, OrgLevel> = {
  ADMIN_GROUP: ORG_LEVEL.ROOT,        // ADMIN_GROUP은 반드시 HQ(ROOT) 소속
  USER_GROUP: ORG_LEVEL.SUBSIDIARY,   // USER_GROUP은 반드시 하위 법인 소속
} as const;
```

#### 1-2. `packages/types/src/permission.types.ts` (신규)

```typescript
import type { UserRole } from './user-group.types';

// ──────────────────────────────────────
// 데이터 접근 범위
// ──────────────────────────────────────
export const DATA_SCOPE = {
  /** 모든 조직의 데이터 (HQ 소속) */
  ALL: 'ALL',
  /** 소속 조직 데이터만 */
  OWN_ORG: 'OWN_ORG',
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
  MANAGER: 'OWN_ORG',       // 법인 → 소속 법인만
  MEMBER: 'OWN_ORG',        // 법인 → 소속 법인만
  VIEWER: 'OWN_ORG',        // 법인 → 소속 법인 읽기만
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
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
  },
  {
    key: 'chat',
    path: '/chat',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'projects',
    path: '/projects',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'issues',
    path: '/issues',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'notices',
    path: '/notices',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN'],
    readOnlyRoles: ['MANAGER', 'MEMBER', 'VIEWER'],
  },
  {
    key: 'meetingNotes',
    path: '/meeting-notes',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'workSchedule',
    path: '/work-schedule',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'documents',
    path: '/documents',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER'],
    readOnlyRoles: ['VIEWER'],
  },
  {
    key: 'mail',
    path: '/mail',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER'],
  },
  {
    key: 'hr',
    path: '/hr',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN'],
    readOnlyRoles: ['MANAGER'],
  },
  {
    key: 'accounting',
    path: '/accounting',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN'],
    readOnlyRoles: ['MANAGER'],
  },
  {
    key: 'billing',
    path: '/billing',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN'],
    readOnlyRoles: ['MANAGER'],
  },
  {
    key: 'kms',
    path: '/kms',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
    writeRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER'],
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
    key: 'auditLogs',
    path: '/audit-logs',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    readOnlyRoles: ['SUPER_ADMIN', 'ADMIN'],
  },
] as const;
```

#### 1-3. `packages/common/src/permission.util.ts` (신규)

```typescript
import type { UserRole, UserGroupCode } from '@amb/types';
import { VALID_GROUP_ROLES, MENU_PERMISSIONS, ROLE_DATA_SCOPE } from '@amb/types';
import type { DataScope } from '@amb/types';

/**
 * 그룹-역할 조합이 유효한지 검증
 */
export function isValidGroupRole(group: UserGroupCode, role: UserRole): boolean {
  return VALID_GROUP_ROLES[group]?.includes(role) ?? false;
}

/**
 * 해당 역할이 접근 가능한 메뉴 목록 반환
 */
export function getAccessibleMenus(role: UserRole) {
  return MENU_PERMISSIONS.filter((menu) => menu.allowedRoles.includes(role));
}

/**
 * 해당 역할이 특정 메뉴에서 읽기 전용인지 확인
 */
export function isReadOnly(role: UserRole, menuKey: string): boolean {
  const menu = MENU_PERMISSIONS.find((m) => m.key === menuKey);
  if (!menu) return true;
  return menu.readOnlyRoles?.includes(role) ?? false;
}

/**
 * 해당 역할이 특정 메뉴에서 쓰기(CUD) 가능한지 확인
 */
export function canWrite(role: UserRole, menuKey: string): boolean {
  const menu = MENU_PERMISSIONS.find((m) => m.key === menuKey);
  if (!menu) return false;
  if (menu.writeRoles) return menu.writeRoles.includes(role);
  return !(menu.readOnlyRoles?.includes(role) ?? false);
}

/**
 * 해당 역할의 데이터 접근 범위 반환
 */
export function getDataScope(role: UserRole): DataScope {
  return ROLE_DATA_SCOPE[role] ?? 'OWN_ONLY';
}

/**
 * HQ(ROOT) 소속 사용자인지 판별
 */
export function isHqUser(groupCode: UserGroupCode): boolean {
  return groupCode === 'ADMIN_GROUP';
}

/**
 * 특정 조직의 데이터에 접근 가능한지 검증
 */
export function canAccessOrgData(
  userGroupCode: UserGroupCode,
  userCompanyId: string,
  targetCompanyId: string,
): boolean {
  if (isHqUser(userGroupCode)) return true;
  return userCompanyId === targetCompanyId;
}
```

#### 1-4. `packages/types/src/index.ts` 수정

```typescript
// ...existing code...
export * from './user-group.types';
export * from './permission.types';
```

#### 1-5. `packages/common/src/index.ts` 수정

```typescript
// ...existing code...
export * from './permission.util';
```

#### Phase 1 체크리스트

- [ ] `packages/types/src/user-group.types.ts` 생성
- [ ] `packages/types/src/permission.types.ts` 생성
- [ ] `packages/common/src/permission.util.ts` 생성
- [ ] `packages/types/src/index.ts`에 export 추가
- [ ] `packages/common/src/index.ts`에 export 추가
- [ ] `npm run build --filter=types --filter=common` 빌드 확인

---

### Phase 2: DB 스키마 변경 + 엔티티 + 시드 + 환경변수 (1일)

#### 2-1. `company.entity.ts` 수정 — 계층 구조 적용

```typescript
// filepath: apps/api/src/domain/members/entity/company.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';

@Entity('amb_companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  cmp_id: string;

  @Column({ type: 'varchar', length: 255 })
  cmp_name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  cmp_code: string;

  /** 조직 레벨: ROOT (HQ) | SUBSIDIARY (하위 법인) */
  @Column({ type: 'varchar', length: 20, default: 'SUBSIDIARY' })
  cmp_level: string;

  /** 상위 조직 ID (ROOT이면 null) */
  @Column({ type: 'uuid', nullable: true })
  cmp_parent_id: string | null;

  @ManyToOne(() => CompanyEntity, (company) => company.children, { nullable: true })
  @JoinColumn({ name: 'cmp_parent_id' })
  parent: CompanyEntity;

  @OneToMany(() => CompanyEntity, (company) => company.parent)
  children: CompanyEntity[];

  /** HQ 조직 여부 (바로가기) */
  @Column({ type: 'boolean', default: false })
  cmp_is_hq: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cmp_country: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cmp_address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cmp_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cmp_email: string;

  @Column({ type: 'text', nullable: true })
  cmp_description: string;

  @Column({ type: 'boolean', default: true })
  cmp_is_active: boolean;

  /** 정렬 순서 */
  @Column({ type: 'int', default: 0 })
  cmp_sort_order: number;

  @CreateDateColumn()
  cmp_created_at: Date;

  @UpdateDateColumn()
  cmp_updated_at: Date;

  @DeleteDateColumn()
  cmp_deleted_at: Date;
}
```

#### 2-2. `member.entity.ts` 수정

```typescript
// filepath: apps/api/src/domain/members/entity/member.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { CompanyEntity } from './company.entity';

@Entity('amb_members')
export class MemberEntity {
  @PrimaryGeneratedColumn('uuid')
  mbr_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  mbr_email: string;

  @Column({ type: 'varchar', length: 255 })
  mbr_password: string;

  @Column({ type: 'varchar', length: 100 })
  mbr_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mbr_phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mbr_department: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mbr_position: string;

  // ── 그룹/역할/상태 ──

  /** 그룹 코드: ADMIN_GROUP | USER_GROUP */
  @Column({ type: 'varchar', length: 30, default: 'USER_GROUP' })
  mbr_group_code: string;

  /** 역할: SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER */
  @Column({ type: 'varchar', length: 30, default: 'MEMBER' })
  mbr_role: string;

  /** 상태: PENDING | ACTIVE | INACTIVE | SUSPENDED | WITHDRAWN */
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  mbr_status: string;

  /** 최초 로그인 시 비밀번호 변경 강제 여부 */
  @Column({ type: 'boolean', default: false })
  mbr_must_change_pw: boolean;

  /** 가입 경로: SEED | REGISTER | INVITE */
  @Column({ type: 'varchar', length: 20, nullable: true })
  mbr_join_method: string;

  // ── 소속 조직 ──

  /**
   * 소속 조직 ID
   * - HQ 소속 = 전체 서비스 관리 + 모든 하위 조직 데이터 접근
   * - 하위 법인 소속 = 해당 법인 데이터만 접근
   */
  @Column({ type: 'uuid', nullable: true })
  mbr_company_id: string;

  @ManyToOne(() => CompanyEntity, { nullable: true })
  @JoinColumn({ name: 'mbr_company_id' })
  company: CompanyEntity;

  // ── 승인/초대 ──

  @Column({ type: 'uuid', nullable: true })
  mbr_approved_by: string;

  @Column({ type: 'timestamp', nullable: true })
  mbr_approved_at: Date;

  @Column({ type: 'uuid', nullable: true })
  mbr_invited_by: string;

  @Column({ type: 'timestamp', nullable: true })
  mbr_last_login_at: Date;

  @Column({ type: 'text', nullable: true })
  mbr_memo: string;

  @CreateDateColumn()
  mbr_created_at: Date;

  @UpdateDateColumn()
  mbr_updated_at: Date;

  @DeleteDateColumn()
  mbr_deleted_at: Date;
}
```

#### 2-3. `invitation.entity.ts` (신규)

```typescript
// filepath: apps/api/src/domain/invitation/entity/invitation.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { MemberEntity } from '../../members/entity/member.entity';
import { CompanyEntity } from '../../members/entity/company.entity';

@Entity('amb_invitations')
export class InvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  inv_id: string;

  /** 초대 대상 이메일 */
  @Column({ type: 'varchar', length: 255 })
  inv_email: string;

  /** 그룹 코드: ADMIN_GROUP | USER_GROUP */
  @Column({ type: 'varchar', length: 30 })
  inv_group_code: string;

  /** 역할: SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER */
  @Column({ type: 'varchar', length: 30 })
  inv_role: string;

  /** 지정 소속 회사 */
  @Column({ type: 'uuid' })
  inv_company_id: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'inv_company_id' })
  company: CompanyEntity;

  /** 초대 토큰 (URL에 포함) */
  @Column({ type: 'varchar', length: 255, unique: true })
  inv_token: string;

  /** 상태: PENDING | ACCEPTED | EXPIRED | CANCELLED */
  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  inv_status: string;

  /** 초대 수락 시 자동 승인 여부 */
  @Column({ type: 'boolean', default: false })
  inv_auto_approve: boolean;

  /** 만료일 */
  @Column({ type: 'timestamp' })
  inv_expires_at: Date;

  /** 초대한 어드민 */
  @Column({ type: 'uuid' })
  inv_invited_by: string;

  @ManyToOne(() => MemberEntity)
  @JoinColumn({ name: 'inv_invited_by' })
  invitedBy: MemberEntity;

  /** 수락 일시 */
  @Column({ type: 'timestamp', nullable: true })
  inv_accepted_at: Date;

  @CreateDateColumn()
  inv_created_at: Date;

  @UpdateDateColumn()
  inv_updated_at: Date;
}
```

#### 2-4. 환경변수 파일 수정

```env
# filepath: env/backend/.env.development
# ...existing code...

# ── 초기 관리자 설정 (시드 데이터용) ──
SEED_ADMIN_EMAIL=admin@company.com
SEED_ADMIN_PASSWORD=adm@pw123
SEED_ADMIN_NAME=System Admin
```

#### 2-5. 시드 파일: `company.seed.ts`

```typescript
// filepath: apps/api/src/database/seeds/company.seed.ts

import { DataSource } from 'typeorm';
import { CompanyEntity } from '../../domain/members/entity/company.entity';

export async function seedCompanies(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(CompanyEntity);

  // ── 1. HQ (최상위 조직) ──
  let hq = await repo.findOne({ where: { cmp_code: 'HQ' } });
  if (!hq) {
    hq = await repo.save(repo.create({
      cmp_name: 'Amoeba HQ',
      cmp_code: 'HQ',
      cmp_level: 'ROOT',
      cmp_parent_id: null,
      cmp_is_hq: true,
      cmp_country: 'Global',
      cmp_description: '아메바 최상위 관리 조직',
      cmp_sort_order: 0,
    }));
  }

  // ── 2. 한국 법인 (HQ 하위) ──
  const kr = await repo.findOne({ where: { cmp_code: 'AMOEBA-KR' } });
  if (!kr) {
    await repo.save(repo.create({
      cmp_name: '아메바컴퍼니주식회사',
      cmp_code: 'AMOEBA-KR',
      cmp_level: 'SUBSIDIARY',
      cmp_parent_id: hq.cmp_id,
      cmp_is_hq: false,
      cmp_country: 'KR',
      cmp_description: '아메바컴퍼니 한국 법인',
      cmp_sort_order: 1,
    }));
  }

  // ── 3. 베트남 법인 (HQ 하위) ──
  const vn = await repo.findOne({ where: { cmp_code: 'AMOEBA-VN' } });
  if (!vn) {
    await repo.save(repo.create({
      cmp_name: 'amoeba co.,ltd',
      cmp_code: 'AMOEBA-VN',
      cmp_level: 'SUBSIDIARY',
      cmp_parent_id: hq.cmp_id,
      cmp_is_hq: false,
      cmp_country: 'VN',
      cmp_description: '아메바 베트남 법인',
      cmp_sort_order: 2,
    }));
  }
}
```

#### 2-6. 시드 파일: `member.seed.ts`

```typescript
// filepath: apps/api/src/database/seeds/member.seed.ts

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { MemberEntity } from '../../domain/members/entity/member.entity';
import { CompanyEntity } from '../../domain/members/entity/company.entity';

export async function seedMembers(dataSource: DataSource): Promise<void> {
  const memberRepo = dataSource.getRepository(MemberEntity);
  const companyRepo = dataSource.getRepository(CompanyEntity);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@company.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'adm@pw123';
  const adminName = process.env.SEED_ADMIN_NAME || 'System Admin';

  // HQ 조직 조회
  const hq = await companyRepo.findOne({ where: { cmp_is_hq: true } });
  if (!hq) {
    throw new Error('HQ 조직이 존재하지 않습니다. company seed를 먼저 실행하세요.');
  }

  const exists = await memberRepo.findOne({ where: { mbr_email: adminEmail } });
  if (!exists) {
    const hashedPw = await bcrypt.hash(adminPassword, 12);
    await memberRepo.save(
      memberRepo.create({
        mbr_email: adminEmail,
        mbr_password: hashedPw,
        mbr_name: adminName,
        mbr_group_code: 'ADMIN_GROUP',
        mbr_role: 'SUPER_ADMIN',
        mbr_status: 'ACTIVE',
        mbr_must_change_pw: true,
        mbr_join_method: 'SEED',
        mbr_company_id: hq.cmp_id,
      }),
    );
  }
}
```

#### 2-7. 마이그레이션 SQL

```sql
-- filepath: apps/api/src/database/migrations/20260222_user_group_permission.sql

-- =====================================================
-- 1. amb_companies: 계층 구조 컬럼 추가
-- =====================================================
ALTER TABLE amb_companies
ADD COLUMN IF NOT EXISTS cmp_level VARCHAR(20) DEFAULT 'SUBSIDIARY',
ADD COLUMN IF NOT EXISTS cmp_parent_id UUID REFERENCES amb_companies(cmp_id),
ADD COLUMN IF NOT EXISTS cmp_is_hq BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cmp_sort_order INT DEFAULT 0;

-- 기존 데이터 매핑
UPDATE amb_companies SET
  cmp_level = 'ROOT',
  cmp_is_hq = true,
  cmp_parent_id = NULL
WHERE cmp_code = 'HQ';

-- 하위 법인은 HQ를 부모로 설정
UPDATE amb_companies SET
  cmp_level = 'SUBSIDIARY',
  cmp_is_hq = false,
  cmp_parent_id = (SELECT cmp_id FROM amb_companies WHERE cmp_code = 'HQ')
WHERE cmp_code != 'HQ' AND cmp_parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_companies_parent ON amb_companies(cmp_parent_id);
CREATE INDEX IF NOT EXISTS idx_companies_level ON amb_companies(cmp_level);
CREATE INDEX IF NOT EXISTS idx_companies_is_hq ON amb_companies(cmp_is_hq);

-- =====================================================
-- 2. amb_members: 그룹/역할/상태 컬럼 추가
-- =====================================================
ALTER TABLE amb_members
ADD COLUMN IF NOT EXISTS mbr_group_code VARCHAR(30) DEFAULT 'USER_GROUP',
ADD COLUMN IF NOT EXISTS mbr_must_change_pw BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mbr_join_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS mbr_approved_by UUID,
ADD COLUMN IF NOT EXISTS mbr_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS mbr_invited_by UUID,
ADD COLUMN IF NOT EXISTS mbr_last_login_at TIMESTAMP;

-- 기존 ADMIN → HQ 소속 ADMIN_GROUP / SUPER_ADMIN
UPDATE amb_members SET
  mbr_group_code = 'ADMIN_GROUP',
  mbr_role = 'SUPER_ADMIN'
WHERE mbr_role = 'ADMIN' AND mbr_deleted_at IS NULL;

-- HQ 소속으로 company_id 설정
UPDATE amb_members SET
  mbr_company_id = (SELECT cmp_id FROM amb_companies WHERE cmp_is_hq = true LIMIT 1)
WHERE mbr_group_code = 'ADMIN_GROUP'
  AND (mbr_company_id IS NULL OR mbr_company_id NOT IN (
    SELECT cmp_id FROM amb_companies WHERE cmp_is_hq = true
  ))
  AND mbr_deleted_at IS NULL;

-- 기존 USER → USER_GROUP / MEMBER
UPDATE amb_members SET
  mbr_group_code = 'USER_GROUP',
  mbr_role = 'MEMBER'
WHERE mbr_role = 'USER' AND mbr_deleted_at IS NULL;

-- 기존 ACTIVE 사용자는 비밀번호 변경 불필요
UPDATE amb_members SET mbr_must_change_pw = false
WHERE mbr_status = 'ACTIVE' AND mbr_deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_members_group ON amb_members(mbr_group_code);
CREATE INDEX IF NOT EXISTS idx_members_status ON amb_members(mbr_status);
CREATE INDEX IF NOT EXISTS idx_members_role ON amb_members(mbr_role);
CREATE INDEX IF NOT EXISTS idx_members_company ON amb_members(mbr_company_id);

-- =====================================================
-- 3. amb_invitations 테이블 생성
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_invitations (
  inv_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inv_email VARCHAR(255) NOT NULL,
  inv_group_code VARCHAR(30) NOT NULL,
  inv_role VARCHAR(30) NOT NULL,
  inv_company_id UUID NOT NULL REFERENCES amb_companies(cmp_id),
  inv_token VARCHAR(255) NOT NULL UNIQUE,
  inv_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  inv_auto_approve BOOLEAN NOT NULL DEFAULT false,
  inv_expires_at TIMESTAMP NOT NULL,
  inv_invited_by UUID NOT NULL REFERENCES amb_members(mbr_id),
  inv_accepted_at TIMESTAMP,
  inv_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  inv_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_email ON amb_invitations(inv_email);
CREATE INDEX IF NOT EXISTS idx_inv_token ON amb_invitations(inv_token);
CREATE INDEX IF NOT EXISTS idx_inv_status ON amb_invitations(inv_status);
```

#### Phase 2 체크리스트

- [ ] `company.entity.ts` 수정 (계층 구조: cmp_level, cmp_parent_id, cmp_is_hq)
- [ ] `member.entity.ts`에 7개 필드 추가
- [ ] `invitation.entity.ts` 신규 생성
- [ ] `env/backend/.env.development`에 `SEED_ADMIN_*` 추가
- [ ] `company.seed.ts` 수정 (HQ → SUBSIDIARY 계층)
- [ ] `member.seed.ts` 수정 (env 기반 + HQ 소속)
- [ ] 마이그레이션 SQL 작성 및 테스트 실행
- [ ] `app.module.ts`에 `InvitationEntity` 등록
- [ ] `npm run dev:api` 실행 → TypeORM synchronize로 스키마 반영 확인

---

### Phase 3: 백엔드 인증/인가 체계 확장 (2일)

#### 3-1. JWT Payload 확장

```typescript
// filepath: apps/api/src/domain/auth/interface/jwt-payload.interface.ts

export interface JwtPayload {
  /** 사용자 ID (mbr_id) */
  sub: string;
  /** 이메일 */
  email: string;
  /** 그룹: ADMIN_GROUP | USER_GROUP */
  group: string;
  /** 역할: SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER */
  role: string;
  /** 상태: PENDING | ACTIVE | ... */
  status: string;
  /** 소속 조직 ID */
  companyId: string;
  /** 소속 조직이 HQ인지 여부 */
  isHq: boolean;
  /** 비밀번호 변경 필요 여부 */
  mustChangePw: boolean;
}
```

#### 3-2. `auth.service.ts` 수정

```typescript
// filepath: apps/api/src/domain/auth/service/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { MemberEntity } from '../../members/entity/member.entity';
import { JwtPayload } from '../interface/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const member = await this.memberRepo.findOne({
      where: { mbr_email: email },
      relations: ['company'],
    });
    if (!member) {
      throw new UnauthorizedException('E1001');
    }

    const isMatch = await bcrypt.compare(password, member.mbr_password);
    if (!isMatch) {
      throw new UnauthorizedException('E1001');
    }

    // ── 상태 검증 ──
    if (member.mbr_status === 'WITHDRAWN') {
      throw new UnauthorizedException('E1002');
    }
    if (member.mbr_status === 'SUSPENDED') {
      throw new UnauthorizedException('E1003');
    }
    if (member.mbr_status === 'INACTIVE') {
      throw new UnauthorizedException('E1004');
    }
    // PENDING은 로그인 허용하되 프론트에서 승인대기 화면 표시

    // 마지막 로그인 시각 갱신
    await this.memberRepo.update(member.mbr_id, {
      mbr_last_login_at: new Date(),
    });

    const isHq = member.company?.cmp_is_hq ?? false;

    const payload: JwtPayload = {
      sub: member.mbr_id,
      email: member.mbr_email,
      group: member.mbr_group_code,
      role: member.mbr_role,
      status: member.mbr_status,
      companyId: member.mbr_company_id,
      isHq,
      mustChangePw: member.mbr_must_change_pw,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '2h' });
    const refreshToken = this.jwtService.sign(
      { sub: member.mbr_id },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: member.mbr_id,
        email: member.mbr_email,
        name: member.mbr_name,
        group: member.mbr_group_code,
        role: member.mbr_role,
        status: member.mbr_status,
        companyId: member.mbr_company_id,
        companyName: member.company?.cmp_name ?? null,
        isHq,
        mustChangePw: member.mbr_must_change_pw,
      },
    };
  }

  // ── 회원가입 ──
  async register(dto: {
    email: string;
    password: string;
    name: string;
    companyId: string;
    phone?: string;
    department?: string;
    position?: string;
  }) {
    const existing = await this.memberRepo.findOne({
      where: { mbr_email: dto.email },
    });
    if (existing) {
      throw new UnauthorizedException('E1005');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const member = this.memberRepo.create({
      mbr_email: dto.email,
      mbr_password: hashed,
      mbr_name: dto.name,
      mbr_phone: dto.phone,
      mbr_department: dto.department,
      mbr_position: dto.position,
      mbr_company_id: dto.companyId,
      mbr_group_code: 'USER_GROUP',
      mbr_role: 'MEMBER',
      mbr_status: 'PENDING',
      mbr_must_change_pw: false,
      mbr_join_method: 'REGISTER',
    });

    await this.memberRepo.save(member);
    return { message: '회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.' };
  }

  // ── 비밀번호 변경 ──
  async changePassword(userId: string, currentPw: string, newPw: string) {
    const member = await this.memberRepo.findOne({ where: { mbr_id: userId } });
    if (!member) {
      throw new UnauthorizedException('E1006');
    }

    const isMatch = await bcrypt.compare(currentPw, member.mbr_password);
    if (!isMatch) {
      throw new UnauthorizedException('E1007');
    }

    const hashed = await bcrypt.hash(newPw, 12);
    await this.memberRepo.update(userId, {
      mbr_password: hashed,
      mbr_must_change_pw: false,
    });

    return { message: '비밀번호가 변경되었습니다.' };
  }
}
```

#### 3-3. `jwt.strategy.ts` 수정

```typescript
// filepath: apps/api/src/domain/auth/strategy/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interface/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      group: payload.group,
      role: payload.role,
      status: payload.status,
      companyId: payload.companyId,
      isHq: payload.isHq,
      mustChangePw: payload.mustChangePw,
    };
  }
}
```

#### 3-4. `group-role.guard.ts` (신규)

```typescript
// filepath: apps/api/src/domain/auth/guard/group-role.guard.ts
import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GROUPS_KEY, ROLES_KEY } from '../decorator/auth.decorator';

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredGroups = this.reflector.getAllAndOverride<string[]>(GROUPS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredGroups && !requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('E1008');

    // PENDING 상태 사용자 차단
    if (user.status === 'PENDING') {
      throw new ForbiddenException('E1010');
    }

    // ACTIVE가 아닌 경우 차단
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('E1009');
    }

    // 비밀번호 변경 필요 사용자 차단
    if (user.mustChangePw) {
      throw new ForbiddenException('E1011');
    }

    // 그룹 검증
    if (requiredGroups && !requiredGroups.includes(user.group)) {
      throw new ForbiddenException('E1012');
    }

    // 역할 검증
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('E1013');
    }

    return true;
  }
}
```

#### 3-5. `auth.decorator.ts` (신규)

```typescript
// filepath: apps/api/src/domain/auth/decorator/auth.decorator.ts
import { SetMetadata, applyDecorators, UseGuards, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { GroupRoleGuard } from '../guard/group-role.guard';

export const GROUPS_KEY = 'groups';
export const ROLES_KEY = 'roles';

/** 그룹 제한 */
export const RequireGroups = (...groups: string[]) =>
  SetMetadata(GROUPS_KEY, groups);

/** 역할 제한 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/** 인증만 필요 (로그인 + ACTIVE + 비밀번호 변경 완료) */
export const Auth = () =>
  applyDecorators(UseGuards(JwtAuthGuard, GroupRoleGuard));

/** 어드민 전용 (HQ 소속) */
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, GroupRoleGuard),
    RequireGroups('ADMIN_GROUP'),
  );

/** 특정 역할 필요 */
export const RequireAuth = (...roles: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, GroupRoleGuard),
    RequireRoles(...roles),
  );

/** 비밀번호 변경 전/승인대기 상태에서도 허용 (JwtAuthGuard만 적용) */
export const AuthAllowPending = () =>
  applyDecorators(UseGuards(JwtAuthGuard));

/** 현재 사용자 정보 추출 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

#### 3-6. `data-scope.interceptor.ts` (신규) — HQ 전체 접근 핵심

```typescript
// filepath: apps/api/src/domain/auth/interceptor/data-scope.interceptor.ts
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

/**
 * 데이터 조회 시 사용자 소속 조직 기반 자동 필터링
 *
 * - HQ(ADMIN_GROUP) 소속: 필터 없음 → 전체 조직 데이터 반환
 * - 하위 법인(USER_GROUP) 소속: 본인 company_id로 필터링
 */
@Injectable()
export class DataScopeInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return next.handle();

    if (user.group === 'ADMIN_GROUP') {
      request.dataScope = {
        scope: 'ALL',
        companyId: null,
        isHq: true,
      };
    } else {
      request.dataScope = {
        scope: 'OWN_ORG',
        companyId: user.companyId,
        isHq: false,
      };
    }

    return next.handle();
  }
}
```

#### 3-7. `data-scope.decorator.ts` (신규)

```typescript
// filepath: apps/api/src/domain/auth/decorator/data-scope.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface DataScopeInfo {
  /** 범위: 'ALL' (HQ) | 'OWN_ORG' (하위 법인) */
  scope: 'ALL' | 'OWN_ORG';
  /** 필터할 조직 ID (HQ면 null) */
  companyId: string | null;
  /** HQ 소속 여부 */
  isHq: boolean;
}

/**
 * 컨트롤러에서 현재 사용자의 데이터 접근 범위를 주입
 *
 * @example
 * @Get()
 * findAll(@DataScope() scope: DataScopeInfo) {
 *   return this.service.findAll(scope);
 * }
 */
export const DataScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DataScopeInfo => {
    const request = ctx.switchToHttp().getRequest();
    return request.dataScope ?? { scope: 'OWN_ORG', companyId: null, isHq: false };
  },
);
```

#### 3-8. `auth.controller.ts` 수정

```typescript
// filepath: apps/api/src/domain/auth/controller/auth.controller.ts
import { Controller, Post, Body, Put, Get } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { Auth, AuthAllowPending, CurrentUser } from '../decorator/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  async register(@Body() body: {
    email: string;
    password: string;
    name: string;
    companyId: string;
    phone?: string;
    department?: string;
    position?: string;
  }) {
    return this.authService.register(body);
  }

  @AuthAllowPending()
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @AuthAllowPending()
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
```

#### Phase 3 체크리스트

- [ ] `jwt-payload.interface.ts` 생성 (isHq 포함)
- [ ] `auth.service.ts` 수정 (상태 검증, isHq 판별, register, changePassword)
- [ ] `jwt.strategy.ts` 수정 (확장 payload 파싱)
- [ ] `group-role.guard.ts` 신규 생성
- [ ] `auth.decorator.ts` 신규 생성 (@Auth, @AdminOnly, @RequireAuth, @AuthAllowPending, @CurrentUser)
- [ ] `data-scope.interceptor.ts` 신규 생성 (HQ 전체 접근 핵심)
- [ ] `data-scope.decorator.ts` 신규 생성 (@DataScope)
- [ ] `auth.controller.ts` 수정 (register, change-password, me 추가)
- [ ] `auth.module.ts` 수정 (새 가드/인터셉터 등록)
- [ ] 기존 `roles.guard.ts`, `roles.decorator.ts` → deprecated 처리 또는 제거
- [ ] 로그인 API 테스트 (각 상태별 응답 확인)

---

### Phase 4: 백엔드 초대/승인 모듈 (1.5일)

#### 4-1. 초대 모듈 구조

```
apps/api/src/domain/invitation/
├── invitation.module.ts
├── entity/
│   └── invitation.entity.ts          (Phase 2에서 생성 완료)
├── dto/
│   ├── create-invitation.request.ts
│   └── accept-invitation.request.ts
├── service/
│   └── invitation.service.ts
└── controller/
    └── invitation.controller.ts
```

#### 4-2. `create-invitation.request.ts`

```typescript
// filepath: apps/api/src/domain/invitation/dto/create-invitation.request.ts
import { IsEmail, IsString, IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CreateInvitationRequest {
  @IsEmail()
  email: string;

  @IsString()
  group_code: string;

  @IsString()
  role: string;

  @IsUUID()
  company_id: string;

  @IsOptional()
  @IsBoolean()
  auto_approve?: boolean;
}
```

#### 4-3. `accept-invitation.request.ts`

```typescript
// filepath: apps/api/src/domain/invitation/dto/accept-invitation.request.ts
import { IsString, MinLength, IsOptional } from 'class-validator';

export class AcceptInvitationRequest {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;
}
```

#### 4-4. `invitation.service.ts`

```typescript
// filepath: apps/api/src/domain/invitation/service/invitation.service.ts
import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InvitationEntity } from '../entity/invitation.entity';
import { MemberEntity } from '../../members/entity/member.entity';
import { VALID_GROUP_ROLES } from '@amb/types';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invRepo: Repository<InvitationEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepo: Repository<MemberEntity>,
  ) {}

  async create(dto: {
    email: string;
    groupCode: string;
    role: string;
    companyId: string;
    autoApprove: boolean;
    invitedBy: string;
  }) {
    const existing = await this.memberRepo.findOne({
      where: { mbr_email: dto.email },
    });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const pendingInvite = await this.invRepo.findOne({
      where: { inv_email: dto.email, inv_status: 'PENDING' },
    });
    if (pendingInvite) {
      throw new ConflictException('이미 초대가 발송된 이메일입니다.');
    }

    const validRoles = VALID_GROUP_ROLES[dto.groupCode as keyof typeof VALID_GROUP_ROLES];
    if (!validRoles || !validRoles.includes(dto.role as any)) {
      throw new BadRequestException('그룹에 맞지 않는 역할입니다.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invRepo.create({
      inv_email: dto.email,
      inv_group_code: dto.groupCode,
      inv_role: dto.role,
      inv_company_id: dto.companyId,
      inv_token: token,
      inv_status: 'PENDING',
      inv_auto_approve: dto.autoApprove,
      inv_expires_at: expiresAt,
      inv_invited_by: dto.invitedBy,
    });

    await this.invRepo.save(invitation);

    // TODO: 이메일 발송 (SMTP 설정 후)

    return { token, expiresAt };
  }

  async findByToken(token: string) {
    const invitation = await this.invRepo.findOne({
      where: { inv_token: token },
      relations: ['company'],
    });
    if (!invitation) {
      throw new NotFoundException('유효하지 않은 초대입니다.');
    }
    if (invitation.inv_status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 초대입니다.');
    }
    if (new Date() > invitation.inv_expires_at) {
      await this.invRepo.update(invitation.inv_id, { inv_status: 'EXPIRED' });
      throw new BadRequestException('만료된 초대입니다.');
    }
    return invitation;
  }

  async accept(token: string, dto: {
    name: string;
    password: string;
    phone?: string;
    department?: string;
    position?: string;
  }) {
    const invitation = await this.findByToken(token);

    const hashed = await bcrypt.hash(dto.password, 12);
    const status = invitation.inv_auto_approve ? 'ACTIVE' : 'PENDING';

    const member = this.memberRepo.create({
      mbr_email: invitation.inv_email,
      mbr_password: hashed,
      mbr_name: dto.name,
      mbr_phone: dto.phone,
      mbr_department: dto.department,
      mbr_position: dto.position,
      mbr_group_code: invitation.inv_group_code,
      mbr_role: invitation.inv_role,
      mbr_status: status,
      mbr_must_change_pw: false,
      mbr_join_method: 'INVITE',
      mbr_company_id: invitation.inv_company_id,
      mbr_invited_by: invitation.inv_invited_by,
    });

    await this.memberRepo.save(member);

    await this.invRepo.update(invitation.inv_id, {
      inv_status: 'ACCEPTED',
      inv_accepted_at: new Date(),
    });

    return {
      status,
      message: status === 'ACTIVE'
        ? '가입이 완료되었습니다. 로그인해 주세요.'
        : '가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.',
    };
  }

  async findAll(page: number = 1, limit: number = 20) {
    return this.invRepo.findAndCount({
      relations: ['company', 'invitedBy'],
      order: { inv_created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async cancel(invId: string) {
    const invitation = await this.invRepo.findOne({
      where: { inv_id: invId, inv_status: 'PENDING' },
    });
    if (!invitation) {
      throw new NotFoundException('취소할 초대가 없습니다.');
    }
    await this.invRepo.update(invId, { inv_status: 'CANCELLED' });
  }
}
```

#### 4-5. `invitation.controller.ts`

```typescript
// filepath: apps/api/src/domain/invitation/controller/invitation.controller.ts
import { Controller, Post, Get, Put, Param, Body, Query } from '@nestjs/common';
import { InvitationService } from '../service/invitation.service';
import { AdminOnly, CurrentUser } from '../../auth/decorator/auth.decorator';
import { CreateInvitationRequest } from '../dto/create-invitation.request';
import { AcceptInvitationRequest } from '../dto/accept-invitation.request';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @AdminOnly()
  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateInvitationRequest,
  ) {
    return this.invitationService.create({
      email: dto.email,
      groupCode: dto.group_code,
      role: dto.role,
      companyId: dto.company_id,
      autoApprove: dto.auto_approve ?? false,
      invitedBy: user.id,
    });
  }

  @AdminOnly()
  @Get()
  async list(@Query('page') page?: number, @Query('limit') limit?: number) {
    const [data, total] = await this.invitationService.findAll(page, limit);
    return { data, total };
  }

  @AdminOnly()
  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.invitationService.cancel(id);
  }

  // ── Public ──

  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    const inv = await this.invitationService.findByToken(token);
    return {
      email: inv.inv_email,
      companyName: inv.company?.cmp_name,
      groupCode: inv.inv_group_code,
      role: inv.inv_role,
      expiresAt: inv.inv_expires_at,
    };
  }

  @Post('token/:token/accept')
  async accept(
    @Param('token') token: string,
    @Body() dto: AcceptInvitationRequest,
  ) {
    return this.invitationService.accept(token, dto);
  }
}
```

#### 4-6. 승인 기능 — `members.service.ts` 확장

```typescript
// filepath: apps/api/src/domain/members/service/members.service.ts (승인 관련 추가)

// ...existing code...

async findPending(page: number = 1, limit: number = 20) {
  return this.memberRepo.findAndCount({
    where: { mbr_status: 'PENDING' },
    relations: ['company'],
    order: { mbr_created_at: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
}

async approve(memberId: string, approvedBy: string) {
  const member = await this.memberRepo.findOne({
    where: { mbr_id: memberId, mbr_status: 'PENDING' },
  });
  if (!member) {
    throw new NotFoundException('승인할 사용자를 찾을 수 없습니다.');
  }

  await this.memberRepo.update(memberId, {
    mbr_status: 'ACTIVE',
    mbr_approved_by: approvedBy,
    mbr_approved_at: new Date(),
  });

  return { message: '승인되었습니다.' };
}

async reject(memberId: string, reason?: string) {
  const member = await this.memberRepo.findOne({
    where: { mbr_id: memberId, mbr_status: 'PENDING' },
  });
  if (!member) {
    throw new NotFoundException('거부할 사용자를 찾을 수 없습니다.');
  }

  await this.memberRepo.update(memberId, {
    mbr_status: 'WITHDRAWN',
    mbr_memo: reason ? `거부 사유: ${reason}` : member.mbr_memo,
  });

  return { message: '거부되었습니다.' };
}

async updateStatus(memberId: string, status: string) {
  await this.memberRepo.update(memberId, { mbr_status: status });
  return { message: `상태가 ${status}로 변경되었습니다.` };
}

// ...existing code...
```

#### 4-7. `members.controller.ts`에 승인 API 추가

```typescript
// filepath: apps/api/src/domain/members/controller/members.controller.ts (추가)

// ...existing code...

@AdminOnly()
@Get('pending')
async findPending(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
) {
  const [data, total] = await this.membersService.findPending(page, limit);
  return { data, total };
}

@AdminOnly()
@Put(':id/approve')
async approve(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.membersService.approve(id, user.id);
}

@AdminOnly()
@Put(':id/reject')
async reject(
  @Param('id') id: string,
  @Body() body: { reason?: string },
) {
  return this.membersService.reject(id, body.reason);
}

@AdminOnly()
@Put(':id/status')
async updateStatus(
  @Param('id') id: string,
  @Body() body: { status: string },
) {
  return this.membersService.updateStatus(id, body.status);
}

// ...existing code...
```

#### Phase 4 체크리스트

- [ ] `invitation/` 모듈 디렉토리 구조 생성
- [ ] `create-invitation.request.ts` 생성
- [ ] `accept-invitation.request.ts` 생성
- [ ] `invitation.service.ts` 생성
- [ ] `invitation.controller.ts` 생성
- [ ] `invitation.module.ts` 생성 및 `app.module.ts` 등록
- [ ] `members.service.ts`에 findPending, approve, reject, updateStatus 추가
- [ ] `members.controller.ts`에 승인 관련 엔드포인트 추가
- [ ] 초대 생성 → 수락 → 승인 E2E 플로우 수동 테스트

---

### Phase 5: 기존 컨트롤러에 권한 데코레이터 + DataScope 일괄 적용 (1일)

#### 5-1. 변경 대상 컨트롤러 매핑

| 도메인 | 컨트롤러 파일 | 적용 규칙 |
|--------|-------------|----------|
| `auth` | `auth.controller.ts` | login/register: Public, me/change-pw: `@AuthAllowPending()` |
| `members` | `members.controller.ts` | CRUD: `@AdminOnly()`, 본인조회: `@Auth()` |
| `project` | `project.controller.ts` | 읽기: `@Auth()` + `@DataScope()`, CUD: `@RequireAuth(...)` |
| `project` | `issue.controller.ts` | 읽기: `@Auth()` + `@DataScope()`, CUD: `@RequireAuth(...)` |
| `chat` | `chat.controller.ts` | `@Auth()` |
| `todo` | `todo.controller.ts` | `@Auth()` |
| `meeting-notes` | `meeting-notes.controller.ts` | 읽기: `@Auth()` + `@DataScope()`, CUD: `@RequireAuth(...)` |
| `work-schedule` | `work-schedule.controller.ts` | `@Auth()` + `@DataScope()` |
| `notices` | `notices.controller.ts` | 읽기: `@Auth()`, CUD: `@AdminOnly()` |
| `documents` | `documents.controller.ts` | `@Auth()` + `@DataScope()` |
| `mail` | `mail.controller.ts` | `@RequireAuth('SUPER_ADMIN','ADMIN','MANAGER','MEMBER')` |
| `hr` | `hr.controller.ts` | `@RequireAuth('SUPER_ADMIN','ADMIN','MANAGER')` + `@DataScope()` |
| `accounting` | `accounting.controller.ts` | `@RequireAuth('SUPER_ADMIN','ADMIN','MANAGER')` + `@DataScope()` |
| `billing` | `billing.controller.ts` | `@RequireAuth('SUPER_ADMIN','ADMIN','MANAGER')` + `@DataScope()` |
| `kms` | `kms.controller.ts` | 읽기: `@Auth()`, CUD: `@RequireAuth(...)` |
| `dashboard` | `dashboard.controller.ts` | `@Auth()` + `@DataScope()` |
| `agent` | `agent.controller.ts` | `@Auth()` |
| `service-catalog` | `service-catalog.controller.ts` | 읽기: `@Auth()`, CRUD: `@AdminOnly()` |

#### 5-2. 서비스에서 DataScope 활용 패턴

```typescript
// 예시: project.service.ts

import { DataScopeInfo } from '../../auth/decorator/data-scope.decorator';

async findAll(scope: DataScopeInfo, page: number = 1, limit: number = 20) {
  const qb = this.projectRepo.createQueryBuilder('project')
    .leftJoinAndSelect('project.company', 'company');

  // HQ가 아니면 본인 소속 조직으로 필터링
  if (!scope.isHq && scope.companyId) {
    qb.andWhere('project.prj_company_id = :companyId', {
      companyId: scope.companyId,
    });
  }
  // HQ면 필터 없음 → 전체 조직 데이터 반환

  qb.orderBy('project.prj_created_at', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  return qb.getManyAndCount();
}
```

```typescript
// 예시: project.controller.ts

@Auth()
@Get()
async findAll(
  @DataScope() scope: DataScopeInfo,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
) {
  const [data, total] = await this.projectService.findAll(scope, page, limit);
  return { data, total };
}
```

#### Phase 5 체크리스트

- [ ] `auth.controller.ts` — Public/AuthAllowPending 분리 적용
- [ ] `members.controller.ts` — AdminOnly, 본인조회 Auth
- [ ] `project.controller.ts` — Auth(읽기)+DataScope, RequireAuth(CUD)
- [ ] `issue.controller.ts` — Auth(읽기)+DataScope, RequireAuth(CUD)
- [ ] `chat.controller.ts` — Auth
- [ ] `todo.controller.ts` — Auth
- [ ] `meeting-notes.controller.ts` — Auth(읽기)+DataScope, RequireAuth(CUD)
- [ ] `work-schedule.controller.ts` — Auth+DataScope
- [ ] `notices.controller.ts` — Auth(읽기), AdminOnly(CUD)
- [ ] `documents.controller.ts` — Auth+DataScope
- [ ] `mail.controller.ts` — RequireAuth(VIEWER 제외)
- [ ] `hr.controller.ts` — RequireAuth(관리자급)+DataScope
- [ ] `accounting.controller.ts` — RequireAuth(관리자급)+DataScope
- [ ] `billing.controller.ts` — RequireAuth(관리자급)+DataScope
- [ ] `kms.controller.ts` — Auth(읽기), RequireAuth(CUD)
- [ ] `dashboard.controller.ts` — Auth+DataScope
- [ ] `agent.controller.ts` — Auth
- [ ] Postman/curl로 각 엔드포인트 권한 검증

---

### Phase 6: 프론트엔드 인증 스토어 + 라우터 + 레이아웃 (2일)

#### 6-1. `auth.store.ts` 수정

```typescript
// filepath: apps/web/src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  group: string;
  role: string;
  status: string;
  companyId: string;
  companyName: string | null;
  isHq: boolean;
  mustChangePw: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // 파생 상태 헬퍼
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isPending: () => boolean;
  needsPasswordChange: () => boolean;
  hasRole: (...roles: string[]) => boolean;
  canAccessMenu: (menuKey: string) => boolean;
  isMenuReadOnly: (menuKey: string) => boolean;

  // 액션
  setAuth: (data: { user: User; token: string; refreshToken: string }) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      isAdmin: () => get().user?.group === 'ADMIN_GROUP',
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
      isPending: () => get().user?.status === 'PENDING',
      needsPasswordChange: () => get().user?.mustChangePw === true,
      hasRole: (...roles) => {
        const role = get().user?.role;
        return role ? roles.includes(role) : false;
      },
      canAccessMenu: (menuKey) => {
        const role = get().user?.role;
        if (!role) return false;
        const { MENU_PERMISSIONS } = require('@amb/types');
        const menu = MENU_PERMISSIONS.find((m: any) => m.key === menuKey);
        return menu ? menu.allowedRoles.includes(role) : false;
      },
      isMenuReadOnly: (menuKey) => {
        const role = get().user?.role;
        if (!role) return true;
        const { MENU_PERMISSIONS } = require('@amb/types');
        const menu = MENU_PERMISSIONS.find((m: any) => m.key === menuKey);
        return menu?.readOnlyRoles?.includes(role) ?? false;
      },

      setAuth: (data) =>
        set({
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    { name: 'auth-storage' },
  ),
);
```

#### 6-2. `org.store.ts` (신규) — 조직 선택 상태

```typescript
// filepath: apps/web/src/stores/org.store.ts
import { create } from 'zustand';

interface Organization {
  id: string;
  name: string;
  code: string;
  country: string;
  isHq: boolean;
}

interface OrgState {
  organizations: Organization[];
  /** HQ 사용자가 선택한 조직 ID (null = 전체) */
  selectedOrgId: string | null;
  setOrganizations: (orgs: Organization[]) => void;
  setSelectedOrg: (orgId: string | null) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  organizations: [],
  selectedOrgId: null,
  setOrganizations: (orgs) => set({ organizations: orgs }),
  setSelectedOrg: (orgId) => set({ selectedOrgId: orgId }),
}));
```

#### 6-3. `AuthGuard.tsx` (신규)

```typescript
// filepath: apps/web/src/router/AuthGuard.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function AuthGuard() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.status === 'PENDING') {
    if (location.pathname !== '/pending') {
      return <Navigate to="/pending" replace />;
    }
  }

  if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
    if (location.pathname !== '/inactive') {
      return <Navigate to="/inactive" replace />;
    }
  }

  if (user.mustChangePw) {
    if (location.pathname !== '/force-change-password') {
      return <Navigate to="/force-change-password" replace />;
    }
  }

  return <Outlet />;
}
```

#### 6-4. `RoleGuard.tsx` (신규)

```typescript
// filepath: apps/web/src/router/RoleGuard.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface RoleGuardProps {
  allowedRoles?: string[];
  allowedGroups?: string[];
}

export function RoleGuard({ allowedRoles, allowedGroups }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedGroups && !allowedGroups.includes(user.group)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
```

#### 6-5. `router/index.tsx` 수정 (구조)

```typescript
// filepath: apps/web/src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { RoleGuard } from './RoleGuard';
import { AppLayout } from '../layout/AppLayout';

export const router = createBrowserRouter([
  // ── Public 라우트 ──
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/invite/:token', element: <InviteAcceptPage /> },

  // ── 인증 필수 ──
  {
    element: <AuthGuard />,
    children: [
      { path: '/pending', element: <PendingPage /> },
      { path: '/inactive', element: <InactivePage /> },
      { path: '/force-change-password', element: <ForceChangePasswordPage /> },
      { path: '/unauthorized', element: <UnauthorizedPage /> },

      // ── 메인 레이아웃 ──
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/kms/*', element: <KmsRoutes /> },

          // ── 어드민 전용 ──
          {
            element: <RoleGuard allowedGroups={['ADMIN_GROUP']} />,
            children: [
              { path: '/members/*', element: <MembersRoutes /> },
              { path: '/settings/*', element: <SettingsRoutes /> },
            ],
          },

          // ── 관리자급 ──
          {
            element: <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />,
            children: [
              { path: '/hr/*', element: <HrRoutes /> },
              { path: '/accounting/*', element: <AccountingRoutes /> },
              { path: '/billing/*', element: <BillingRoutes /> },
            ],
          },

          // ── VIEWER 제외 ──
          {
            element: <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER']} />,
            children: [
              { path: '/mail/*', element: <MailRoutes /> },
            ],
          },
        ],
      },
    ],
  },
]);
```

#### 6-6. `OrgSelector.tsx` (신규) — HQ용 조직 선택 드롭다운

```typescript
// filepath: apps/web/src/components/common/OrgSelector.tsx
import { useAuthStore } from '../../stores/auth.store';
import { useOrgStore } from '../../stores/org.store';

export function OrgSelector() {
  const { user } = useAuthStore();
  const { organizations, selectedOrgId, setSelectedOrg } = useOrgStore();

  // HQ 소속이 아니면 렌더링하지 않음
  if (!user?.isHq) return null;

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500">조직:</label>
      <select
        value={selectedOrgId ?? 'ALL'}
        onChange={(e) => setSelectedOrg(e.target.value === 'ALL' ? null : e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="ALL">전체 조직</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.country})
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### 6-7. 사이드바 동적 메뉴 렌더링

```typescript
// filepath: apps/web/src/layout/Sidebar.tsx (메뉴 동적 렌더링)

import { useAuthStore } from '../stores/auth.store';
import { MENU_PERMISSIONS } from '@amb/types';

export function Sidebar() {
  const { user, canAccessMenu, isMenuReadOnly } = useAuthStore();

  const accessibleMenus = MENU_PERMISSIONS.filter((menu) =>
    canAccessMenu(menu.key),
  );

  return (
    <aside>
      <nav>
        {accessibleMenus.map((menu) => (
          <SidebarItem
            key={menu.key}
            path={menu.path}
            label={t(`menu.${menu.key}`)}
            readOnly={isMenuReadOnly(menu.key)}
          />
        ))}
      </nav>
    </aside>
  );
}
```

#### Phase 6 체크리스트

- [ ] `auth.store.ts` 수정 (User에 isHq 추가, 헬퍼 메서드)
- [ ] `org.store.ts` 신규 생성
- [ ] `AuthGuard.tsx` 신규 생성
- [ ] `RoleGuard.tsx` 신규 생성
- [ ] `router/index.tsx` 수정 (가드 적용 + 신규 라우트)
- [ ] `OrgSelector.tsx` 신규 생성
- [ ] `Sidebar.tsx` 수정 (동적 메뉴)
- [ ] `AppLayout.tsx` 수정 (OrgSelector 배치, 사용자 정보 표시 확장)
- [ ] 기존 `PrivateRoute` 코드 → `AuthGuard`로 대체
- [ ] 각 역할로 로그인하여 메뉴 노출 확인

---

### Phase 7: 신규 페이지 구현 (1.5일)

#### 7-1. 페이지 파일 목록

| 파일 | 경로 | 설명 |
|------|------|------|
| `RegisterPage.tsx` | `/register` | 회원가입 |
| `InviteAcceptPage.tsx` | `/invite/:token` | 초대 수락 |
| `PendingPage.tsx` | `/pending` | 승인대기 안내 |
| `InactivePage.tsx` | `/inactive` | 비활성 안내 |
| `ForceChangePasswordPage.tsx` | `/force-change-password` | 비밀번호 변경 강제 |
| `UnauthorizedPage.tsx` | `/unauthorized` | 접근 거부 안내 |

#### 7-2. `RegisterPage.tsx`

```typescript
// filepath: apps/web/src/pages/auth/RegisterPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    companyId: '',
    phone: '',
    department: '',
    position: '',
  });
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 회사 목록 조회 (하위 법인만 — HQ 제외)
  // useEffect로 GET /api/v1/auth/companies?level=SUBSIDIARY 호출

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError(t('register.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        name: form.name,
        company_id: form.companyId,
        phone: form.phone,
        department: form.department,
        position: form.position,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err: any) {
      setError(err.response?.data?.message || t('register.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t('register.title')}</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일, 비밀번호, 이름, 소속회사 선택, 부서, 직급, 연락처 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('register.submit')}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          {t('register.hasAccount')} <Link to="/login" className="text-blue-600">{t('register.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
```

#### 7-3. `PendingPage.tsx`

```typescript
// filepath: apps/web/src/pages/auth/PendingPage.tsx
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';

export function PendingPage() {
  const { t } = useTranslation('auth');
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-4">{t('pending.title')}</h1>
        <p className="text-gray-600 mb-6">{t('pending.message')}</p>
        <p className="text-sm text-gray-500 mb-6">{t('pending.contact')}</p>
        <button
          onClick={logout}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
}
```

#### 7-4. `ForceChangePasswordPage.tsx`

```typescript
// filepath: apps/web/src/pages/auth/ForceChangePasswordPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';

export function ForceChangePasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError(t('changePw.mismatch'));
      return;
    }
    if (form.newPassword.length < 8) {
      setError(t('changePw.tooShort'));
      return;
    }

    try {
      await api.put('/auth/change-password', {
        current_password: form.currentPassword,
        new_password: form.newPassword,
      });
      updateUser({ mustChangePw: false });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('changePw.error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-2xl font-bold">{t('changePw.title')}</h1>
          <p className="text-gray-600 text-sm mt-2">{t('changePw.subtitle')}</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 현재 비밀번호, 새 비밀번호, 확인 필드 */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {t('changePw.submit')}
          </button>
        </form>
        <p className="mt-3 text-xs text-gray-500 text-center">
          {t('changePw.notice')}
        </p>
      </div>
    </div>
  );
}
```

#### 7-5. i18n 번역 키 추가

```json
// filepath: apps/web/src/i18n/locales/ko/auth.json
{
  "register": {
    "title": "회원가입",
    "submit": "가입하기",
    "hasAccount": "이미 계정이 있으신가요?",
    "loginLink": "로그인",
    "passwordMismatch": "비밀번호가 일치하지 않습니다.",
    "error": "회원가입 중 오류가 발생했습니다."
  },
  "pending": {
    "title": "승인 대기",
    "message": "계정이 아직 승인되지 않았습니다. 관리자가 확인 후 승인하면 이메일로 안내드립니다.",
    "contact": "문의: admin@amoeba.com"
  },
  "changePw": {
    "title": "비밀번호 변경",
    "subtitle": "보안을 위해 비밀번호를 변경해 주세요.",
    "mismatch": "새 비밀번호가 일치하지 않습니다.",
    "tooShort": "비밀번호는 최소 8자 이상이어야 합니다.",
    "submit": "변경하기",
    "notice": "변경 전까지 다른 메뉴에 접근할 수 없습니다.",
    "error": "비밀번호 변경 중 오류가 발생했습니다."
  },
  "inactive": {
    "title": "계정 비활성",
    "message": "계정이 비활성화되었습니다. 관리자에게 문의하세요."
  },
  "unauthorized": {
    "title": "접근 권한 없음",
    "message": "이 페이지에 접근할 권한이 없습니다."
  }
}
```

#### Phase 7 체크리스트

- [ ] `RegisterPage.tsx` 생성
- [ ] `InviteAcceptPage.tsx` 생성
- [ ] `PendingPage.tsx` 생성
- [ ] `InactivePage.tsx` 생성
- [ ] `ForceChangePasswordPage.tsx` 생성
- [ ] `UnauthorizedPage.tsx` 생성
- [ ] `locales/ko/auth.json` 번역 추가
- [ ] `locales/en/auth.json` 번역 추가
- [ ] `locales/vi/auth.json` 번역 추가
- [ ] `i18n.ts`에 `auth` 네임스페이스 등록

---

### Phase 8: 조직관리 UI 확장 (1일)

#### 8-1. 멤버 관리 탭 구조

| 탭 | 현행 | 변경 |
|----|------|------|
| 전체 사용자 | ✅ 있음 | 유지 + 그룹/역할/상태 컬럼 추가 |
| 승인 대기 | ❌ 없음 | **신규 추가** |
| 초대 관리 | ❌ 없음 | **신규 추가** |

#### 8-2. 사용자 초대 모달

```
┌────────────────────────────────────┐
│  사용자 초대                        │
│                                    │
│  이메일 *     [                  ]  │
│  그룹 *       [ADMIN_GROUP    ▼ ]  │
│  역할 *       [ADMIN          ▼ ]  │
│  소속회사 *   [HQ             ▼ ]  │
│  자동승인     [ ] 초대 수락 시 즉시 │
│                                    │
│        [취소]      [초대 발송]       │
└────────────────────────────────────┘
```

- 그룹 선택 시 역할 목록 필터링 (`VALID_GROUP_ROLES` 참조)
- 그룹 선택 시 회사 목록 필터링:
  - `ADMIN_GROUP` → HQ만 선택 가능
  - `USER_GROUP` → 하위 법인만 선택 가능

#### Phase 8 체크리스트

- [ ] 멤버 목록 테이블에 `그룹`, `역할`, `상태` 컬럼 추가
- [ ] 승인 대기 탭 컴포넌트 생성
- [ ] 승인/거부 액션 버튼 구현
- [ ] 초대 관리 탭 컴포넌트 생성
- [ ] 초대 모달 컴포넌트 생성 (그룹-역할-회사 연동)
- [ ] 사용자 상태 변경 (ACTIVE ↔ INACTIVE, SUSPENDED) UI

---

### Phase 9: 통합 테스트 + 마이그레이션 검증 (1일)

#### 9-1. 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T-01 | 초기 시드 실행 후 admin@company.com + adm@pw123 로그인 | 로그인 성공, `mustChangePw: true` |
| T-02 | T-01 후 대시보드 접근 | `/force-change-password`로 리다이렉트 |
| T-03 | 비밀번호 변경 | 성공, `mustChangePw: false`, 대시보드 접근 가능 |
| T-04 | SUPER_ADMIN으로 설정 메뉴 접근 | 접근 가능 |
| T-05 | ADMIN으로 설정 메뉴 접근 | `/unauthorized`로 리다이렉트 |
| T-06 | 회원가입 (KR 법인 선택) | 가입 성공, `status: PENDING` |
| T-07 | T-06 사용자 로그인 | 로그인 성공, `/pending` 표시 |
| T-08 | 어드민이 T-06 사용자 승인 | `status: ACTIVE` 변경 |
| T-09 | T-06 사용자 재로그인 | 대시보드 접근 가능 |
| T-10 | 어드민이 초대 생성 (VN, MEMBER, 자동승인 OFF) | 초대 토큰 발급 |
| T-11 | 초대 링크로 접속 → 정보 입력 | 사용자 생성, `status: PENDING` |
| T-12 | 어드민이 초대 생성 (KR, MANAGER, 자동승인 ON) | 초대 수락 시 `status: ACTIVE` |
| T-13 | VIEWER 역할로 공지사항 작성 시도 | `403 Forbidden` |
| T-14 | MEMBER 역할로 HR 메뉴 접근 | `/unauthorized`로 리다이렉트 |
| T-15 | MANAGER 역할로 HR 목록 조회 | 읽기 가능, 생성 버튼 숨김/비활성 |
| T-16 | 기존 데이터 마이그레이션 후 로그인 | 역할 매핑 확인 (ADMIN→SUPER_ADMIN, USER→MEMBER) |
| T-17 | 비활성(INACTIVE) 사용자 로그인 | `E1004` 에러 |
| T-18 | HQ 어드민이 KR 법인 프로젝트 조회 | 전체 데이터 반환 |
| T-19 | KR 법인 사용자가 VN 법인 프로젝트 조회 | 본인 법인 데이터만 반환 |
| T-20 | HQ 어드민이 조직 선택 드롭다운에서 VN 선택 | VN 데이터만 필터링 |

#### 9-2. 배포 순서

```
1. 마이그레이션 SQL 실행 (스키마 + 데이터 변환)
2. 시드 재실행 (HQ + 하위 법인 + 초기 관리자)
3. API 빌드 및 배포
4. Web 빌드 및 배포
5. 검증: admin@company.com 로그인 → 비밀번호 변경 → 전체 메뉴 접근
6. 검증: 기존 사용자 로그인 → 역할 매핑 확인
7. 검증: HQ 사용자로 전체 조직 데이터 접근 확인
```

#### Phase 9 체크리스트

- [ ] 마이그레이션 SQL을 개발 DB에 실행
- [ ] 시드 재실행 확인
- [ ] T-01 ~ T-20 테스트 모두 통과
- [ ] 기존 JWT 토큰 무효화 확인 (재로그인 필요)
- [ ] 스테이징 배포 및 검증
- [ ] `docs/test/TC-UserGroupPermission-Test-20260222.md` 작성

---

## 4. 핵심 데이터 플로우 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                   데이터 접근 플로우                               │
│                                                                 │
│  [API 요청] → [JwtAuthGuard] → [GroupRoleGuard] →               │
│              → [DataScopeInterceptor] → [Controller] → [Service]│
│                                                                 │
│  DataScopeInterceptor가 request에 주입:                          │
│  ┌─────────────────────────────────────────────┐                │
│  │ HQ 소속 (ADMIN_GROUP)                        │                │
│  │ → scope: 'ALL', companyId: null, isHq: true  │                │
│  │ → 서비스에서 조직 필터 적용하지 않음           │                │
│  │ → 전체 하위 조직 데이터 반환                  │                │
│  └─────────────────────────────────────────────┘                │
│  ┌─────────────────────────────────────────────┐                │
│  │ 하위 법인 소속 (USER_GROUP)                   │                │
│  │ → scope: 'OWN_ORG', companyId: 'xxx', false  │                │
│  │ → 서비스에서 WHERE company_id = 'xxx' 필터    │                │
│  │ → 본인 소속 조직 데이터만 반환                 │                │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
│  프론트엔드:                                                     │
│  ┌─────────────────────────────────────────────┐                │
│  │ HQ 소속 → 조직 선택 드롭다운 표시              │                │
│  │         → 특정 법인 선택 시 해당 법인 데이터    │                │
│  │         → 전체 선택 시 모든 데이터             │                │
│  │                                              │                │
│  │ 법인 소속 → 드롭다운 없음                      │                │
│  │          → 본인 법인 데이터만 자동 표시         │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 전체 파일 변경 목록

### 신규 파일 (21개)

| # | 파일 경로 | Phase |
|---|----------|-------|
| 1 | `packages/types/src/user-group.types.ts` | 1 |
| 2 | `packages/types/src/permission.types.ts` | 1 |
| 3 | `packages/common/src/permission.util.ts` | 1 |
| 4 | `apps/api/src/domain/invitation/entity/invitation.entity.ts` | 2 |
| 5 | `apps/api/src/database/migrations/20260222_user_group_permission.sql` | 2 |
| 6 | `apps/api/src/domain/auth/interface/jwt-payload.interface.ts` | 3 |
| 7 | `apps/api/src/domain/auth/guard/group-role.guard.ts` | 3 |
| 8 | `apps/api/src/domain/auth/decorator/auth.decorator.ts` | 3 |
| 9 | `apps/api/src/domain/auth/interceptor/data-scope.interceptor.ts` | 3 |
| 10 | `apps/api/src/domain/auth/decorator/data-scope.decorator.ts` | 3 |
| 11 | `apps/api/src/domain/invitation/dto/create-invitation.request.ts` | 4 |
| 12 | `apps/api/src/domain/invitation/dto/accept-invitation.request.ts` | 4 |
| 13 | `apps/api/src/domain/invitation/service/invitation.service.ts` | 4 |
| 14 | `apps/api/src/domain/invitation/controller/invitation.controller.ts` | 4 |
| 15 | `apps/api/src/domain/invitation/invitation.module.ts` | 4 |
| 16 | `apps/web/src/router/AuthGuard.tsx` | 6 |
| 17 | `apps/web/src/router/RoleGuard.tsx` | 6 |
| 18 | `apps/web/src/stores/org.store.ts` | 6 |
| 19 | `apps/web/src/components/common/OrgSelector.tsx` | 6 |
| 20 | `apps/web/src/pages/auth/RegisterPage.tsx` | 7 |
| 21 | `apps/web/src/pages/auth/InviteAcceptPage.tsx` | 7 |
| 22 | `apps/web/src/pages/auth/PendingPage.tsx` | 7 |
| 23 | `apps/web/src/pages/auth/InactivePage.tsx` | 7 |
| 24 | `apps/web/src/pages/auth/ForceChangePasswordPage.tsx` | 7 |
| 25 | `apps/web/src/pages/error/UnauthorizedPage.tsx` | 7 |

### 수정 파일 (30개+)

| # | 파일 경로 | 변경 내용 | Phase |
|---|----------|----------|-------|
| 1 | `packages/types/src/index.ts` | export 추가 | 1 |
| 2 | `packages/common/src/index.ts` | export 추가 | 1 |
| 3 | `apps/api/.../company.entity.ts` | 계층 구조 (cmp_level, cmp_parent_id, cmp_is_hq) | 2 |
| 4 | `apps/api/.../member.entity.ts` | 7개 컬럼 추가 | 2 |
| 5 | `apps/api/.../company.seed.ts` | HQ→SUBSIDIARY 계층 | 2 |
| 6 | `apps/api/.../member.seed.ts` | env 기반 + HQ 소속 | 2 |
| 7 | `apps/api/src/app.module.ts` | InvitationEntity, InvitationModule 등록 | 2,4 |
| 8 | `env/backend/.env.development` | SEED_ADMIN_* 추가 | 2 |
| 9 | `apps/api/.../auth.service.ts` | 상태검증, isHq, register, changePassword | 3 |
| 10 | `apps/api/.../jwt.strategy.ts` | payload 확장 (isHq) | 3 |
| 11 | `apps/api/.../auth.controller.ts` | register, changePw, me 추가 | 3 |
| 12 | `apps/api/.../auth.module.ts` | 새 가드/인터셉터 등록 | 3 |
| 13 | `apps/api/.../members.service.ts` | 승인/거부/상태변경 메서드 | 4 |
| 14 | `apps/api/.../members.controller.ts` | 승인 API + DataScope 추가 | 4 |
| 15-30+ | `apps/api/.../*/controller/*.ts` (15개+) | @Auth/@AdminOnly/@RequireAuth + @DataScope | 5 |
| 31 | `apps/web/src/stores/auth.store.ts` | User에 isHq 추가, 헬퍼 | 6 |
| 32 | `apps/web/src/router/index.tsx` | AuthGuard/RoleGuard 적용 | 6 |
| 33 | `apps/web/src/layout/Sidebar.tsx` | 동적 메뉴 | 6 |
| 34 | `apps/web/src/layout/AppLayout.tsx` | OrgSelector 배치 | 6 |
| 35 | `apps/web/src/i18n/locales/ko/auth.json` | 번역 추가 | 7 |
| 36 | `apps/web/src/i18n/locales/en/auth.json` | 번역 추가 | 7 |
| 37 | `apps/web/src/i18n/locales/vi/auth.json` | 번역 추가 | 7 |
| 38 | `apps/web/src/i18n/i18n.ts` | auth 네임스페이스 등록 | 7 |

---

## 6. 의존 관계 및 실행 순서

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 5
(타입)      (DB/엔티티)  (인증/인가)  (초대/승인)  (전체 적용)
                                          │
                                          │
Phase 6 ◀──────────────────────────────────┘
(프론트 인증)
     │
     ▼
Phase 7 ──▶ Phase 8 ──▶ Phase 9
(신규 페이지) (조직관리UI) (테스트/배포)
```

**병렬 가능**: Phase 6~8은 Phase 3~5 완료 후 병렬 진행 가능

---

## 7. 리스크 및 완화 전략

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 기존 JWT 토큰 payload 변경으로 세션 끊킴 | 확정 | 중간 | 배포 공지 + 로그인 페이지 안내 문구 |
| 기존 `ADMIN`/`USER` 데이터 매핑 오류 | 중간 | 높음 | 마이그레이션 전 백업, 매핑 SQL 사전 검증 |
| RolesGuard 일괄 적용 시 정상 접근 차단 | 중간 | 높음 | Phase 5를 점진적 적용 (도메인 1개씩) |
| SMTP 미설정 상태에서 초대 이메일 발송 실패 | 높음 | 낮음 | SMTP 미설정 시 토큰 URL 직접 복사 기능 |
| 프론트 빌드 시 packages/types import 실패 | 낮음 | 중간 | `npm run build --filter=types` 선행 빌드 확인 |
| HQ DataScope 적용 누락 (일부 서비스) | 중간 | 중간 | Phase 5 체크리스트로 전수 검증 |

---

**작성일**: 2026-02-22
**상태**: Phase별 구현 준비 완료. 승인 후 Phase 1부터 진행.