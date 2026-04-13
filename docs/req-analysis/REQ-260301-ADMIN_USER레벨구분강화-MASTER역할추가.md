# 요구사항 분석서: ADMIN_LEVEL / USER_LEVEL 구분 강화 및 MASTER 역할 추가

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-01 |
| 분석 범위 | 권한 체계 전반 (packages/types, apps/api, apps/web) |
| 관련 문서 | `REPORT-포탈회원에게내부권한부여시문제점검토-20260301.md` |
| 관련 문서 | `REPORT-권한체계정리-ADMIN_LEVEL-USER_LEVEL-20260301.md` |

---

## 1. 요구사항 원문

> - ADMIN_LEVEL과 USER_LEVEL 구분 강화
> - ADMIN_LEVEL은 사이트, 서비스 전체 관리자 역할
> - USER_LEVEL은 amoebaManagement/ambKMS의 Work Tool, Work Module만 사용 (사이트/서비스 제외), 지정된 법인에서만 사용 (타 법인과 분리, 프로젝트도 제안/승인한 법인 소속만 사용 가능)
> - USER_LEVEL에 MASTER 역할 추가 — 포탈 가입 유저를 어드민에서 승인한 사용자에게 부여, 승인 시 법인코드 부여
> - MASTER는 Settings 메뉴 추가: 해당 법인 멤버 초대, 해당 법인 멤버 메뉴 접근 권한 설정
> - 포탈 가입 회원에게 ADMIN_LEVEL에서 USER_LEVEL/MASTER 역할 아이디를 생성하고 권한을 부여하여 각 사용자별로 서비스 운영할 수 있도록 할 때의 고려사항 및 추가사항 분석
> - **Work Module에서 Agent, Services, Site는 ADMIN 전용으로 분리** (USER_LEVEL 접근 불가)
> - **메뉴 그룹핑**: Work Tool / Work Module 카테고리 재정립
> - **Drive 설정 법인별(테넌트) 분리**: 각 법인이 자체 Google Drive 폴더/설정을 가짐
> - **AI API Key 법인별 설정**: 법인별 자체 API Key 등록 가능 (개발 시에는 공동 사용)
> - **공동 사용 시 법인별 API 토큰 사용량 카운팅 + 제한 설정**
> - **향후 법인별 API 토큰 충전 기능 구현** (선불 크레딧 모델)

---

## 2. AS-IS 현황 분석

### 2.1 현재 레벨-역할 구조

```
ADMIN_LEVEL (HQ 소속)
├── SUPER_ADMIN — 시스템 최고 관리자, 모든 권한
└── ADMIN       — 운영 관리자, 설정 일부 제외

USER_LEVEL (하위 법인 소속)
├── MANAGER — 부서/팀 관리자
├── MEMBER  — 일반 직원
└── VIEWER  — 읽기 전용
```

### 2.2 현재 문제점

| # | 항목 | 현황 |
|---|------|------|
| 1 | **레벨 구분** | 코드상 정의는 있으나, 실제 메뉴/기능 접근에서 ADMIN_LEVEL과 USER_LEVEL의 경계가 불명확 |
| 2 | **사이트/서비스 메뉴** | USER_LEVEL의 MANAGER도 `SETTINGS_MEMBERS`, `SETTINGS_CONVERSATIONS` 등 일부 Settings에 접근 가능 |
| 3 | **법인 간 격리** | `DataScopeInterceptor`가 있으나, 프로젝트 멤버 초대 시 타 법인 사용자 포함 가능 |
| 4 | **포탈 연동 경로 없음** | 포탈 고객(`amb_svc_portal_customers`)과 내부 사용자(`amb_users`)는 완전 분리 |
| 5 | **포탈→내부 전환 프로세스 없음** | 포탈 가입 회원을 내부 사용자로 전환하는 비즈니스 로직이 존재하지 않음 |
| 6 | **API Key 전역 단일** | `amb_api_keys`에 `ent_id` 컬럼 없음, 시스템 전체가 1개 키 공유 |
| 7 | **Drive 설정 전역 단일** | `amb_drive_settings`에 `ent_id` 컬럼 없음, 법인별 폴더 분리 불가 |
| 8 | **토큰 사용량 추적 존재** | `amb_translation_usage`에 `ent_id` 있으나 번역 전용, AI 전체 사용량 추적 미구현 |
| 9 | **Work Module 분류 미정립** | Agent, Services, Site 등 ADMIN 전용 모듈이 일반 모듈과 혼재 |

### 2.3 현재 포탈 ↔ 내부 시스템 구조적 불일치

> 상세 분석: `REPORT-포탈회원에게내부권한부여시문제점검토-20260301.md`

| 항목 | Portal Customer | Internal User |
|------|----------------|---------------|
| 테이블 | `amb_svc_portal_customers` | `amb_users` |
| 역할 | 없음 | 5종 (SUPER_ADMIN~VIEWER) |
| 레벨 | 없음 | ADMIN_LEVEL / USER_LEVEL |
| 조직 | `pct_cli_id` (고객사) | `usr_company_id` (법인 FK) |
| JWT | `portal-jwt` Strategy | `jwt` Strategy |
| 인증 | Bearer Token | Cookie + Bearer |

---

## 3. TO-BE 요구사항

### 3.1 레벨-역할 구조 변경

```
ADMIN_LEVEL (HQ 소속) — 사이트/서비스 전체 관리
├── SUPER_ADMIN — 시스템 최고 관리자
└── ADMIN       — 운영 관리자

USER_LEVEL (하위 법인 소속) — Work Tool / Work Module만 사용
├── MASTER  — [신규] 법인 관리자 (법인 내 멤버 초대 + 권한 설정)
├── MANAGER — 부서/팀 관리자
├── MEMBER  — 일반 직원
└── VIEWER  — 읽기 전용
```

### 3.2 역할별 권한 매트릭스 (TO-BE)

| 구분 | SUPER_ADMIN | ADMIN | MASTER (신규) | MANAGER | MEMBER | VIEWER |
|------|:-----------:|:-----:|:------------:|:-------:|:------:|:------:|
| **레벨** | ADMIN | ADMIN | USER | USER | USER | USER |
| **계층 순위** | 6 | 5 | 4 | 3 | 2 | 1 |
| **데이터 범위** | ALL | ALL | OWN_ORG | OWN_ORG | OWN_ORG | OWN_ORG |
| **사이트 설정** | RW | RW | - | - | - | - |
| **서비스 관리** | RW | RW | - | - | - | - |
| **Agent/Services/Site** | RW | RW | **-** | **-** | **-** | **-** |
| **Work Tool** | RW | RW | RW | RW | RW | R |
| **Work Module** | RW | RW | RW | RW | RW | R |
| **법인 멤버 초대** | 전체 법인 | 전체 법인 | 소속 법인만 | - | - | - |
| **법인 멤버 권한 설정** | 전체 법인 | 전체 법인 | 소속 법인만 | - | - | - |
| **법인 Drive 설정** | 전체 법인 | 전체 법인 | 소속 법인만 | - | - | - |
| **법인 API Key 설정** | 전체 법인 | 전체 법인 | 소속 법인만 | - | - | - |
| **API 사용량 조회** | 전체 법인 | 전체 법인 | 소속 법인만 | - | - | - |

### 3.3 MASTER의 Settings 메뉴 범위

MASTER는 기존 ADMIN Settings가 아닌, **법인 범위 한정 Settings**만 접근:

| Settings 항목 | ADMIN_LEVEL | MASTER | 비고 |
|--------------|:-----------:|:------:|------|
| API Keys | O | **X** | 시스템 전역 설정 |
| SMTP | O | **X** | 시스템 전역 설정 |
| Drive | O | **X** | 시스템 전역 설정 |
| 조직 관리 (Entities) | O | **X** | 법인 생성/수정은 ADMIN만 |
| Site Settings | O | **X** | 사이트 전역 설정 |
| Agent Settings | O | **X** | AI 에이전트 전역 설정 |
| Conversation 관리 | O | **X** | 전체 대화 관리 |
| 전체 권한 설정 (Permissions) | O | **X** | 시스템 전역 권한 |
| **법인 멤버 초대** | O (전체) | **O (소속 법인)** | 신규 |
| **법인 멤버 메뉴 권한** | O (전체) | **O (소속 법인)** | 신규 |
| **법인 멤버 목록** | O (전체) | **O (소속 법인)** | 신규 |
| **법인 Drive 설정** | O (전체) | **O (소속 법인)** | 신규 — 법인별 Drive 폴더/계정 |
| **법인 API Key 관리** | O (전체) | **O (소속 법인)** | 신규 — 자체 키 또는 공동 사용 |
| **법인 API 사용량** | O (전체) | **O (소속 법인)** | 신규 — 사용량 조회, 한도 확인 |

### 3.4 포탈 → 내부 계정 전환 플로우 (TO-BE)

```
┌─ 포탈 회원가입 ─────────────────────────────────────────────┐
│ POST /api/portal/auth/register                              │
│ → amb_svc_portal_customers INSERT (pctStatus='ACTIVE')      │
│ → amb_svc_clients INSERT (cliStatus='PROSPECT')             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─ ADMIN_LEVEL 관리자 콘솔 ───────────────────────────────────┐
│ 1. 포탈 고객 목록 조회                                       │
│ 2. 고객 선택 → "내부 계정 생성" 클릭                         │
│ 3. 입력 항목:                                                │
│    - 법인 선택 (HrEntity, SUBSIDIARY만)                      │
│    - 역할 선택 (MASTER / MANAGER / MEMBER / VIEWER)          │
│    - 부서 선택 (선택사항)                                     │
│    - 자동 승인 여부                                           │
│ 4. 확인 → 내부 사용자 생성                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─ 내부 시스템 계정 생성 ──────────────────────────────────────┐
│ amb_users INSERT:                                            │
│   usr_email = pct_email (포탈과 동일)                        │
│   usr_level_code = 'USER_LEVEL'                              │
│   usr_role = 'MASTER' (또는 지정 역할)                       │
│   usr_company_id = 선택한 법인 ID                            │
│   usr_status = 'ACTIVE' (ADMIN이 직접 승인이므로)            │
│   usr_join_method = 'PORTAL' (신규 가입경로)                 │
│   usr_must_change_pw = true (초기 비밀번호 변경 강제)        │
│   usr_approved_by = 승인 관리자 ID                           │
│   usr_approved_at = NOW()                                    │
│                                                              │
│ 매핑 테이블 INSERT:                                          │
│   amb_portal_user_mappings (신규 테이블)                     │
│   pct_id ←→ usr_id 연결                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 갭 분석 (Gap Analysis)

### 4.1 타입/상수 변경 필요

| 파일 | 현재 | 변경사항 |
|------|------|---------|
| `packages/types/src/user-level.types.ts` | `USER_ROLE`에 MASTER 없음 | `MASTER: 'MASTER'` 추가 |
| 〃 | `VALID_LEVEL_ROLES.USER_LEVEL`에 MASTER 없음 | `['MASTER', 'MANAGER', ...]` 추가 |
| `packages/types/src/permission.types.ts` | `ROLE_DATA_SCOPE`에 MASTER 없음 | `MASTER: 'OWN_ORG'` 추가 |
| 〃 | `MENU_PERMISSIONS`에 MASTER 접근 범위 없음 | MASTER 역할 권한 정의 추가 |
| `apps/api/src/global/guard/roles.guard.ts` | `ROLE_HIERARCHY`에 MASTER 없음 | `MASTER: 4` 추가 (MANAGER 위) |
| `apps/api/src/global/constant/menu-code.constant.ts` | `DEFAULT_PERMISSIONS`에 MASTER 없음 | MASTER 기본 권한 추가 |

### 4.2 백엔드 신규 개발 필요

| # | 항목 | 설명 | 복잡도 |
|---|------|------|:------:|
| 1 | **포탈-내부 매핑 테이블** | `amb_portal_user_mappings` (pct_id ↔ usr_id) | 낮음 |
| 2 | **포탈 고객 조회 API** | ADMIN이 포탈 고객 목록/상세 조회 | 중간 |
| 3 | **내부 계정 생성 API** | 포탈 고객 → 내부 사용자 전환 + 법인/역할 부여 | 높음 |
| 4 | **MASTER Settings API** | 법인 범위 멤버 초대/권한 설정 | 높음 |
| 5 | **MASTER 가드** | 법인 범위 제한 가드 (OwnEntityGuard) | 중간 |
| 6 | **프로젝트 법인 격리 강화** | 프로젝트 CRUD 시 `ent_id` 강제 필터링 | 중간 |
| 7 | **USER_LEVEL Settings 접근 제한** | 기존 MANAGER의 Settings 접근 차단 | 낮음 |
| 8 | **가입경로 추가** | `usr_join_method`에 `'PORTAL'` 값 추가 | 낮음 |
| 9 | **법인별 API Key 관리** | `amb_api_keys`에 `ent_id` 추가, 법인별 키 + 공동 키 분기 로직 | 높음 |
| 10 | **법인별 Drive 설정** | `amb_drive_settings`에 `ent_id` 추가 또는 법인별 테이블 분리 | 중간 |
| 11 | **API 사용량 통합 추적** | 전체 AI 호출(Chat, KMS, Project 등) 법인별 토큰 카운팅 | 높음 |
| 12 | **법인별 API 사용 제한** | 법인별 월간 토큰 한도 설정 + 초과 시 차단/경고 | 높음 |
| 13 | **Work Module ADMIN 전용 분리** | AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT → USER_LEVEL 차단 | 낮음 |

### 4.3 프론트엔드 신규 개발 필요

| # | 항목 | 설명 | 복잡도 |
|---|------|------|:------:|
| 1 | **포탈 고객 관리 페이지** | ADMIN 전용, 포탈 고객 목록/계정 전환 UI | 높음 |
| 2 | **MASTER Settings 페이지** | 법인 멤버 초대/권한 설정 UI | 높음 |
| 3 | **사이드바 분기 처리** | MASTER 역할 시 제한된 Settings 메뉴 표시 | 중간 |
| 4 | **가드 업데이트** | AdminGuard → MASTER용 EntitySettingsGuard 추가 | 중간 |
| 5 | **권한 체계 UI 업데이트** | RolePermissionTab에 MASTER 역할 추가 | 낮음 |

### 4.4 데이터베이스 변경 필요

| # | 테이블 | 변경 유형 | 내용 |
|---|--------|----------|------|
| 1 | `amb_portal_user_mappings` | **신규** | 포탈↔내부 사용자 매핑 |
| 2 | `amb_users` | 컬럼 수정 | `usr_role` 허용값에 `MASTER` 추가 |
| 3 | `amb_users` | 컬럼 수정 | `usr_join_method` 허용값에 `PORTAL` 추가 |
| 4 | `amb_menu_permissions` | 데이터 추가 | MASTER 역할의 기본 메뉴 권한 INSERT |
| 5 | `amb_invitations` | 컬럼 추가 | `inv_created_by_role` (초대 생성자 역할, MASTER 추적용) |
| 6 | `amb_api_keys` | 컬럼 추가 | `ent_id` (nullable) — NULL이면 시스템 공동 키, 값 있으면 법인 전용 키 |
| 7 | `amb_drive_settings` | 컬럼 추가 | `ent_id` (nullable) — 법인별 Drive 설정 분리 |
| 8 | `amb_ai_token_usage` | **신규** | 전체 AI API 호출 건별 사용량 기록 (법인, 사용자, 토큰, 소스타입) |
| 9 | `amb_ai_token_entity_summary` | **신규** | 법인별 일별 토큰 사용량 집계 (대시보드/한도 확인용) |
| 10 | `amb_entity_api_quotas` | **신규** | 법인별 API 사용 한도 (일일/월간) 및 크레딧 설정 |

---

## 5. 핵심 고려사항 상세 분석

### 5.1 🔴 포탈 ↔ 내부 계정 연결 전략

**문제**: 포탈 고객(PortalCustomer)과 내부 사용자(User)는 완전히 다른 테이블·인증 체계

**해결 방안: 브릿지 매핑 테이블**

```sql
CREATE TABLE amb_portal_user_mappings (
  pum_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pct_id          UUID NOT NULL REFERENCES amb_svc_portal_customers(pct_id),
  usr_id          UUID NOT NULL REFERENCES amb_users(usr_id),
  pum_created_by  UUID NOT NULL REFERENCES amb_users(usr_id),  -- 매핑 생성한 ADMIN
  pum_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pct_id),  -- 1:1 매핑 (포탈 계정 하나 → 내부 계정 하나)
  UNIQUE(usr_id)   -- 1:1 매핑 (내부 계정 하나 → 포탈 계정 하나)
);
```

**고려사항**:
- 동일 이메일 보장 여부: 포탈 이메일 = 내부 이메일 강제?
- 비밀번호 동기화: 별도 비밀번호 vs 포탈 비밀번호 재사용
  - **권장**: 내부 계정은 별도 초기 비밀번호 발급 + `usr_must_change_pw=true`
- 상태 동기화: 포탈에서 탈퇴 시 내부 계정도 비활성화?

### 5.2 🔴 MASTER의 초대 범위 제한

**현재 초대 시스템**: `inv_company_id`로 법인 지정 가능하나, **초대 생성자의 법인 제한 로직 없음**

**필요한 변경**:

```typescript
// 현재: MANAGER 이상이면 누구나 모든 법인으로 초대 가능
// TO-BE: MASTER는 자신의 법인으로만 초대 가능

async create(dto: CreateInvitationRequest, inviter: UserPayload) {
  // MASTER 역할 검증
  if (inviter.role === 'MASTER') {
    // 1. 초대 대상 법인 = 자신의 법인만 허용
    if (dto.company_id !== inviter.companyId) {
      throw new ForbiddenException('MASTER can only invite to own entity');
    }
    // 2. 초대 역할 제한: MASTER보다 낮은 역할만 초대 가능
    if (!['MANAGER', 'MEMBER', 'VIEWER'].includes(dto.role)) {
      throw new ForbiddenException('MASTER can only assign MANAGER/MEMBER/VIEWER roles');
    }
    // 3. level_code는 반드시 USER_LEVEL
    dto.level_code = 'USER_LEVEL';
  }
}
```

**고려사항**:
- MASTER가 다른 MASTER를 초대할 수 있는가? → **불가 권장** (MASTER는 ADMIN만 부여)
- MASTER가 초대한 사용자의 자동 승인 허용? → 허용 (법인 내 빠른 온보딩)
- 초대 이메일에 법인 정보 포함 필요

### 5.3 🔴 MASTER의 메뉴 권한 설정 범위

**현재 권한 설정**: ADMIN만 접근, 전체 사용자 대상

**MASTER 제한 필요사항**:

```
ADMIN의 권한 설정 범위:
└── 모든 사용자의 모든 메뉴 권한 설정

MASTER의 권한 설정 범위:
├── 대상: 자신의 법인 소속 USER_LEVEL 사용자만 (MANAGER/MEMBER/VIEWER)
├── 메뉴 범위: Work Tool + Work Module만 (Settings 제외)
└── 제한: ADMIN_LEVEL 사용자의 권한 수정 불가
```

**필요한 API 변경**:

| 기존 API | MASTER용 변경/추가 |
|---------|-------------------|
| `GET /settings/permissions/users` | 소속 법인 사용자만 반환 필터 추가 |
| `PUT /settings/permissions/users/:id` | 대상이 같은 법인 + USER_LEVEL인지 검증 |
| `DELETE /settings/permissions/users/:id/:menu` | 대상이 같은 법인 + USER_LEVEL인지 검증 |
| `GET /settings/permissions` (역할별) | MASTER 접근 시 WORK_TOOL/MODULE 카테고리만 반환 |

### 5.4 🔴 USER_LEVEL의 사이트/서비스 메뉴 완전 차단

**현재 MANAGER가 접근 가능한 Settings 메뉴**:
- `SETTINGS_MEMBERS` (true)
- `SETTINGS_CONVERSATIONS` (true)
- `SETTINGS_MAIL_ACCOUNTS` (true)
- `SETTINGS_AGENTS` (true)

**TO-BE**: USER_LEVEL(MASTER 포함)은 기존 ADMIN Settings 전면 차단

| 메뉴 코드 | 현재 MANAGER | TO-BE MANAGER | TO-BE MASTER |
|-----------|:-----------:|:------------:|:------------:|
| SETTINGS_MEMBERS | O | **X** | X (별도 법인 멤버 관리) |
| SETTINGS_CONVERSATIONS | O | **X** | X |
| SETTINGS_MAIL_ACCOUNTS | O | **X** | X |
| SETTINGS_AGENTS | O | **X** | X |
| SETTINGS_API_KEYS | X | X | X |
| SETTINGS_SMTP | X | X | X |
| SETTINGS_PERMISSIONS | X | X | X (별도 법인 권한 관리) |
| **ENTITY_MEMBERS** (신규) | X | X | **O** |
| **ENTITY_PERMISSIONS** (신규) | X | X | **O** |

### 5.5 🔴 프로젝트 법인 격리 강화

**현재 프로젝트 접근**: `kms_projects.ent_id`로 법인 소속이 있으나, 멤버 초대 시 타 법인 사용자 제한 없음

**TO-BE**:
```typescript
// 프로젝트 생성: 반드시 생성자의 법인으로 ent_id 설정
async createProject(dto, user: UserPayload) {
  if (user.level === 'USER_LEVEL') {
    dto.ent_id = user.companyId; // 강제 설정
  }
}

// 프로젝트 멤버 추가: 같은 법인 소속만 허용
async addProjectMember(projectId, memberId, user: UserPayload) {
  if (user.level === 'USER_LEVEL') {
    const member = await this.userRepo.findOne(memberId);
    const project = await this.projectRepo.findOne(projectId);
    if (member.usrCompanyId !== project.entId) {
      throw new ForbiddenException('Can only add members from same entity');
    }
  }
}
```

### 5.6 🟡 비밀번호 및 인증 전략

**포탈 → 내부 계정 전환 시 인증 문제**:

| 옵션 | 장점 | 단점 |
|------|------|------|
| A. 별도 비밀번호 발급 | 보안 격리, 각 시스템 독립 | 사용자가 2개 비밀번호 관리 |
| B. 포탈 비밀번호 복사 | 사용자 편의 | 비밀번호 동기화 문제, 보안 약화 |
| C. SSO 통합 | 단일 인증 | 대규모 리팩토링 필요 |

**권장: 옵션 A (별도 비밀번호)**
- ADMIN이 계정 생성 시 임시 비밀번호 자동 생성
- `usr_must_change_pw = true` 설정
- 사용자가 최초 로그인 시 비밀번호 변경 강제
- 향후 SSO 도입 시 자연스럽게 전환 가능

### 5.7 🟡 회사 이메일 생성 정책

**현재**: 내부 사용자 가입 시 `@{domain}` 회사 이메일 자동 생성

**포탈 전환 사용자에게 회사 이메일 필요?**

| 시나리오 | 회사 이메일 생성 | 근거 |
|---------|:-----------:|------|
| MASTER (법인 관리자) | 선택사항 | 법인 대표로서 필요할 수 있음 |
| MANAGER/MEMBER | 선택사항 | 업무에 따라 결정 |
| VIEWER (읽기 전용) | 불필요 | 내부 메일 기능 사용 안 함 |

**권장**: 계정 전환 시 회사 이메일 생성을 **선택 옵션**으로 제공 (기본값: 미생성)

### 5.8 🟡 이중 계정 관리

**문제**: 동일 사용자가 포탈 계정 + 내부 계정 2개를 갖게 됨

**관리 정책 필요**:

| 이벤트 | 처리 정책 |
|--------|----------|
| 포탈 계정 정지/삭제 | 내부 계정도 자동 정지? → **아니오** (독립 운영) |
| 내부 계정 정지 | 포탈 계정에 영향 없음 |
| 포탈 비밀번호 변경 | 내부 계정 비밀번호에 영향 없음 |
| 포탈 이메일 변경 | 내부 계정 이메일은 유지 (매핑 테이블로 연결) |
| 내부 계정 탈퇴(WITHDRAWN) | 매핑 레코드 soft delete, 포탈 계정 유지 |

### 5.9 🟡 감사 추적 (Audit Trail)

**MASTER 활동 추적 필요**:

| 활동 | 기록 항목 |
|------|----------|
| 법인 멤버 초대 | `inv_invited_by` = MASTER의 `usr_id` |
| 멤버 권한 변경 | `ump_granted_by` = MASTER의 `usr_id` |
| 계정 전환 생성 | `pum_created_by`, `usr_approved_by` = ADMIN의 `usr_id` |

### 5.10 🟠 기존 MANAGER Settings 접근 제거 시 사이드 이펙트

**현재 MANAGER가 사용 중인 Settings 기능**:

| 기능 | 영향 | 대안 |
|------|------|------|
| `SETTINGS_MEMBERS` (멤버 관리) | MANAGER가 팀원 목록 확인 불가 | 법인 멤버 조회는 별도 API 유지 |
| `SETTINGS_CONVERSATIONS` (대화 관리) | MANAGER가 AI 대화 관리 불가 | ADMIN에게 의존 |
| `SETTINGS_MAIL_ACCOUNTS` (메일 계정) | MANAGER가 메일 계정 관리 불가 | ADMIN에게 의존 |
| `SETTINGS_AGENTS` (에이전트 설정) | MANAGER가 에이전트 설정 불가 | ADMIN에게 의존 |

**권장**: Settings 차단은 단계적 적용. 1차로 MASTER 기능 추가 후, 2차로 MANAGER Settings 제거

### 5.11 🔴 Work Module ADMIN 전용 분리 (Agent, Services, Site)

**현재**: AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT가 일반 Work Module에 혼재

**TO-BE 메뉴 카테고리 재정립**:

| 카테고리 | 메뉴 | 접근 범위 |
|---------|------|----------|
| **Work Tool** | TODO, MEETING_NOTES, DOCUMENTS, AMOEBA_TALK, ATTENDANCE, NOTICES, ISSUES, PROJECT_MANAGEMENT, CALENDAR, MAIL | 전체 역할 (VIEWER는 R) |
| **Work Module** | ACCOUNTING, HR, BILLING, KMS, DEPARTMENTS, WORK_ITEMS, ASSET_MANAGEMENT | 전체 역할 (VIEWER는 R) |
| **Admin Module** (신규) | AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT | **ADMIN_LEVEL 전용** |

**MASTER/MANAGER/MEMBER/VIEWER** 기본 권한에서 아래 메뉴 **차단**:
- `AGENTS`: false
- `SERVICE_MANAGEMENT`: false
- `SITE_MANAGEMENT`: false

### 5.12 🔴 법인별 API Key 관리

**현재 구조**:
- `amb_api_keys`: `ent_id` 없음, 시스템 전역 단일 키
- `ClaudeService.getApiKey()`: 환경변수 → DB 조회 (provider='ANTHROPIC'), 5분 캐싱

**TO-BE 구조: 법인별 키 + 공동 키 병존**:

```
API Key 해석 우선순위:
1. 법인 전용 키: amb_api_keys WHERE ent_id = :entityId AND apk_is_active = true
2. 시스템 공동 키: amb_api_keys WHERE ent_id IS NULL AND apk_is_active = true
3. 환경변수: CLAUDE_API_KEY (개발 환경 폴백)
```

**고려사항**:
- `amb_api_keys`에 `ent_id` 컬럼 추가 (nullable, FK → amb_hr_entities)
- `ent_id IS NULL` = 시스템 공동 키 (모든 법인이 사용)
- `ent_id = UUID` = 해당 법인 전용 키
- `ClaudeService.getApiKey(entityId?)` 시그니처 변경 필요
- 캐시 키를 `provider + entityId` 조합으로 확장

### 5.13 🔴 법인별 AI 사용량 카운팅

**현재 구조**:
- `amb_translation_usage`: 번역 전용 사용량만 추적 (ent_id 있음)
- `ClaudeService.sendMessage()`: usage 반환 가능 (`withUsage: true`)
- 비용 계산 로직 존재: `(inputTokens * 15 + outputTokens * 75) / 1_000_000`

**TO-BE: 2-테이블 구조 — 건별 이력 + 법인별 일별 집계**

#### 5.13.1 AI 토큰 사용 이력 (`amb_ai_token_usage`)

모든 Claude API 호출을 건별로 기록:

```sql
CREATE TABLE amb_ai_token_usage (
  atu_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id            UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  usr_id            UUID NOT NULL REFERENCES amb_users(usr_id),
  cvs_id            UUID REFERENCES amb_conversations(cvs_id),  -- 대화 연결 (nullable)
  atu_source_type   VARCHAR(30) NOT NULL DEFAULT 'CHAT',        -- CHAT | TRANSLATION | KMS | PROJECT | BILLING | TALK
  atu_model         VARCHAR(100) NOT NULL,
  atu_input_tokens  INTEGER NOT NULL DEFAULT 0,
  atu_output_tokens INTEGER NOT NULL DEFAULT 0,
  atu_total_tokens  INTEGER NOT NULL DEFAULT 0,                 -- input + output 합계
  atu_key_source    VARCHAR(20) NOT NULL DEFAULT 'SHARED',      -- ENTITY | SHARED
  atu_created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_atu_ent_date ON amb_ai_token_usage(ent_id, atu_created_at);
CREATE INDEX idx_atu_usr_date ON amb_ai_token_usage(usr_id, atu_created_at);
CREATE INDEX idx_atu_source ON amb_ai_token_usage(atu_source_type, atu_created_at);
```

#### 5.13.2 법인별 일별 집계 (`amb_ai_token_entity_summary`)

집계 쿼리 성능을 위한 일별 롤업 테이블:

```sql
CREATE TABLE amb_ai_token_entity_summary (
  ats_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id            UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  ats_date          DATE NOT NULL,
  ats_total_tokens  BIGINT NOT NULL DEFAULT 0,
  ats_input_tokens  BIGINT NOT NULL DEFAULT 0,
  ats_output_tokens BIGINT NOT NULL DEFAULT 0,
  ats_request_count INTEGER NOT NULL DEFAULT 0,
  ats_created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ats_ent_date UNIQUE (ent_id, ats_date)
);
```

**집계 방식**: `amb_ai_token_usage` INSERT 후 비동기로 `amb_ai_token_entity_summary` UPSERT (ON CONFLICT UPDATE)

**추적 대상 (모든 Claude API 호출점)**:

| 도메인 | 호출 위치 | source_type |
|--------|----------|-------------|
| Chat (9개 부서) | BaseAgentService.chat/chatStream | `CHAT` |
| Translation | TranslationService.translateStream/Direct | `TRANSLATION` |
| KMS | KmsService (문서 생성, 태깅) | `KMS` |
| Project | ProjectService (AI 분석) | `PROJECT` |
| Billing | BillingService (청구 자동화) | `BILLING` |
| AmoebaTalk | TalkService (메시지 처리) | `TALK` |

### 5.14 🔴 법인별 API 사용 제한 (Quota)

**신규 테이블 `amb_entity_api_quotas`**:

```sql
CREATE TABLE amb_entity_api_quotas (
  eaq_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                   UUID NOT NULL UNIQUE REFERENCES amb_hr_entities(ent_id),
  eaq_daily_token_limit    BIGINT DEFAULT 0,            -- 일일 토큰 한도 (0 = 무제한)
  eaq_monthly_token_limit  BIGINT DEFAULT 0,            -- 월간 토큰 한도 (0 = 무제한)
  eaq_action_on_exceed     VARCHAR(20) DEFAULT 'BLOCK', -- WARN | BLOCK
  eaq_is_shared_key        BOOLEAN DEFAULT true,         -- 공동 키 사용 여부
  eaq_credit_balance       DECIMAL(10,2) DEFAULT 0,      -- 충전 잔액 (향후 충전 기능용)
  eaq_updated_by           UUID REFERENCES amb_users(usr_id),
  eaq_created_at           TIMESTAMPTZ DEFAULT NOW(),
  eaq_updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

**한도 초과 시 동작**:
- `WARN`: 사용 허용 + 관리자 알림
- `BLOCK`: API 호출 차단 + 사용자에게 안내 (기본값)

**한도 사전 경고**: 80%, 95% 도달 시 사전 경고 알림 발송 (MASTER + ADMIN)

**한도 검증**: `amb_ai_token_entity_summary`의 일별/월별 합산으로 빠르게 확인 (건별 테이블 풀스캔 불필요)

**에러 코드**:
- `E4010`: Daily AI token limit exceeded (일일 한도 초과)
- `E4011`: Monthly AI token limit exceeded (월간 한도 초과)

**향후 충전 기능**: `eaq_credit_balance` 컬럼으로 선불 크레딧 모델 지원 가능

### 5.15 🟡 법인별 Drive 설정

**현재 구조**:
- `amb_drive_settings`: 단일 레코드 (ent_id 없음)
- 필드: `drs_impersonate_email`, `drs_billing_root_folder_id`, `drs_billing_root_folder_name`

**TO-BE**:
- `amb_drive_settings`에 `ent_id` 컬럼 추가 (nullable)
- `ent_id IS NULL` = 시스템 기본 설정 (폴백)
- `ent_id = UUID` = 법인별 Drive 루트 폴더 및 impersonate 계정
- MASTER가 자신의 법인 Drive 설정 관리 가능
- UNIQUE 제약: `(ent_id)` — 법인당 1개 설정

**고려사항**:
- Google Workspace 도메인 전체 위임(Domain-wide Delegation)으로 다중 계정 지원 가능
- 법인별 서비스 계정 또는 impersonate 이메일 분리
- 기존 단일 설정은 `ent_id IS NULL` 폴백으로 유지

---

## 6. 신규 테이블/엔티티 설계

### 6.1 포탈-내부 매핑 테이블

```sql
-- 포탈 고객 ↔ 내부 사용자 1:1 매핑
CREATE TABLE amb_portal_user_mappings (
  pum_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pct_id          UUID NOT NULL,           -- FK → amb_svc_portal_customers
  usr_id          UUID NOT NULL,           -- FK → amb_users
  pum_status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE / REVOKED
  pum_created_by  UUID NOT NULL,           -- 매핑 생성한 ADMIN의 usr_id
  pum_revoked_by  UUID,                    -- 매핑 해제한 ADMIN의 usr_id
  pum_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pum_revoked_at  TIMESTAMPTZ,
  CONSTRAINT uq_pum_pct UNIQUE (pct_id),
  CONSTRAINT uq_pum_usr UNIQUE (usr_id)
);
```

### 6.2 MASTER용 메뉴 코드 추가

```typescript
// 신규 메뉴 코드
'ENTITY_MEMBERS'       // MASTER 법인 멤버 관리 (목록, 초대)
'ENTITY_PERMISSIONS'   // MASTER 법인 멤버 메뉴 권한 설정

// 카테고리: ENTITY_SETTINGS (신규 카테고리)
```

---

## 7. 사용자 플로우

### 7.1 ADMIN이 포탈 고객에게 내부 계정 생성

```
1. ADMIN 로그인 → Settings → 포탈 고객 관리
2. 포탈 고객 목록 조회 (이메일, 이름, 가입일, 구독 상태)
3. 고객 선택 → "내부 계정 생성" 버튼
4. 모달 표시:
   ┌─────────────────────────────────────┐
   │ 내부 계정 생성                       │
   ├─────────────────────────────────────┤
   │ 포탈 이메일: user@example.com       │
   │ 포탈 이름:   홍길동                  │
   │                                     │
   │ 법인 선택:   [▼ VIETSOFT Co., Ltd]  │
   │ 역할:       [▼ MASTER            ]  │
   │ 부서:       [▼ (선택사항)         ]  │
   │ 회사 이메일 생성: [ ] (체크박스)     │
   │                                     │
   │         [취소]  [생성]              │
   └─────────────────────────────────────┘
5. 생성 확인 → 내부 계정 생성 + 임시 비밀번호 이메일 발송
6. 대상 사용자: 내부 시스템 로그인 → 비밀번호 변경 → 서비스 이용
```

### 7.2 MASTER가 법인 멤버 초대

```
1. MASTER 로그인 → Settings → 법인 멤버 관리
2. 법인 멤버 목록 조회 (자신의 법인 소속만)
3. "멤버 초대" 버튼 → 초대 모달
   ┌─────────────────────────────────────┐
   │ 법인 멤버 초대                       │
   │ 법인: VIETSOFT Co., Ltd (자동 설정)  │
   ├─────────────────────────────────────┤
   │ 이메일:  [________________]         │
   │ 역할:   [▼ MEMBER        ]         │
   │          (MANAGER/MEMBER/VIEWER)    │
   │ 부서:   [▼ (선택사항)     ]         │
   │ 자동 승인: [✓]                      │
   │                                     │
   │         [취소]  [초대]              │
   └─────────────────────────────────────┘
4. 초대 이메일 발송 → 대상자가 수락 → 법인 멤버로 등록
```

### 7.3 MASTER가 법인 멤버 메뉴 권한 설정

```
1. MASTER 로그인 → Settings → 법인 권한 설정
2. 법인 멤버 목록 + 현재 권한 표시
3. 사용자 선택 → 메뉴별 접근 허용/차단 토글
   ┌─────────────────────────────────────────────────┐
   │ 법인 권한 설정 — VIETSOFT Co., Ltd               │
   ├─────────────────────────────────────────────────┤
   │ 사용자: 김철수 (MEMBER)                          │
   │                                                   │
   │ Work Tools                                        │
   │  [✓] TODO        [✓] Meeting Notes                │
   │  [✓] Documents   [✓] Calendar                     │
   │  [✓] Notices     [ ] Mail                         │
   │  [✓] Attendance  [✓] Issues                       │
   │                                                   │
   │ Work Modules                                      │
   │  [✓] KMS         [ ] Accounting                   │
   │  [ ] HR          [ ] Billing                      │
   │  [✓] Projects    [ ] Service Management           │
   │                                                   │
   │              [저장]                               │
   └─────────────────────────────────────────────────┘
```

---

## 8. 기술 제약사항

### 8.1 인프라 제약

| 제약 | 영향 | 해결 방향 |
|------|------|----------|
| portal-api와 api는 별도 프로세스 | 직접 DB 접근 불가 | api에서 portal DB도 연결하거나 HTTP 호출 |
| JWT Strategy 분리 | 포탈 토큰으로 내부 API 접근 불가 | 내부 시스템은 내부 JWT만 사용 (계정 별도) |
| CORS 도메인 분리 | 프론트 도메인별 API 접근 제한 | 내부 시스템 프론트에서만 내부 API 호출 |

### 8.2 데이터 정합성 제약

| 제약 | 설명 |
|------|------|
| `usr_email` UNIQUE | 포탈과 동일 이메일이면 이미 가입된 경우 충돌 |
| `ent_id` NOT NULL (프로젝트) | USER_LEVEL 사용자의 프로젝트는 반드시 법인 지정 |
| `inv_company_id` | 초대 시 법인 ID 필수 (MASTER 초대 시) |

### 8.3 하위 호환성

| 항목 | 영향 |
|------|------|
| 기존 MANAGER의 Settings 접근 | 차단 시 기존 사용자 불편 → 단계적 적용 |
| 기존 `ROLE_HIERARCHY` | MASTER 추가로 순위 재조정 필요 |
| 기존 `VALID_LEVEL_ROLES` | USER_LEVEL에 MASTER 추가 |
| 프론트엔드 하드코딩된 역할 체크 | `isAdmin()` 등 헬퍼 함수에 MASTER 분기 추가 |

---

## 9. 구현 우선순위 제안

### Phase 1: 기반 작업 (타입/상수/DB)
1. `USER_ROLE`에 MASTER 추가
2. `VALID_LEVEL_ROLES`, `ROLE_DATA_SCOPE`, `ROLE_HIERARCHY` 업데이트
3. `DEFAULT_PERMISSIONS`에 MASTER 기본 권한 추가 + AGENTS/SERVICE_MANAGEMENT/SITE_MANAGEMENT 차단
4. 메뉴 카테고리 재정립: Work Tool / Work Module / Admin Module
5. DB 마이그레이션: `amb_portal_user_mappings` 테이블 생성
6. DB 마이그레이션: `amb_menu_permissions`에 MASTER 권한 데이터 INSERT

### Phase 2: DB 확장 (법인별 설정 테이블)
1. `amb_api_keys` — `ent_id` 컬럼 추가 (nullable)
2. `amb_drive_settings` — `ent_id` 컬럼 추가 (nullable)
3. `amb_ai_usage` — 신규 테이블 생성 (법인별 AI 사용량 추적)
4. `amb_entity_api_quotas` — 신규 테이블 생성 (법인별 API 한도/크레딧)

### Phase 3: 포탈 → 내부 계정 전환 (Backend)
1. 포탈 고객 조회 API (ADMIN 전용)
2. 내부 계정 생성 API (포탈 → 내부 전환)
3. 매핑 테이블 CRUD 서비스
4. 임시 비밀번호 생성 + 이메일 발송

### Phase 4: MASTER 역할 기능 (Backend)
1. MASTER용 법인 멤버 관리 API (조회/초대)
2. MASTER용 법인 권한 설정 API (조회/설정)
3. OwnEntityGuard (법인 범위 제한 가드)
4. 초대 서비스에 MASTER 제한 로직 추가

### Phase 5: 법인별 API Key / Drive / AI 사용량 (Backend)
1. `ClaudeService.getApiKey(entityId?)` — 법인별 키 우선순위 분기
2. 법인별 Drive 설정 CRUD API (MASTER 소속 법인 / ADMIN 전체)
3. AI 사용량 기록 서비스 — 모든 Claude API 호출점에 사용량 INSERT 로직
4. 법인별 API Quota 검증 인터셉터/미들웨어 (WARN / BLOCK)
5. 법인 API Key CRUD API, 법인 사용량 조회 API

### Phase 6: Work Module ADMIN 전용 분리 (Backend + Frontend)
1. AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT → USER_LEVEL 전면 차단
2. 메뉴 가드에 Admin Module 카테고리 검증 추가
3. 사이드바 메뉴 그룹핑: Work Tool / Work Module / Admin Module

### Phase 7: 프론트엔드 — 기본 구조
1. ADMIN 포탈 고객 관리 페이지
2. MASTER Settings 페이지 (멤버 초대, 권한 설정)
3. 사이드바/라우터 MASTER 분기 처리
4. 기존 권한 관리 페이지에 MASTER 역할 추가

### Phase 8: 프론트엔드 — 법인별 설정 페이지
1. MASTER 법인 Drive 설정 페이지
2. MASTER 법인 API Key 관리 페이지
3. 법인 AI 사용량 대시보드 (사용량 차트, 한도 표시)
4. ADMIN 전체 법인 사용량 통합 대시보드

### Phase 9: USER_LEVEL Settings 정리 + 테스트
1. MANAGER의 기존 Settings 접근 제거 (단계적)
2. 프로젝트 법인 격리 강화
3. 전체 테스트 및 검증

---

## 10. 리스크 요약

| # | 리스크 | 심각도 | 확률 | 대응 |
|---|--------|:------:|:----:|------|
| 1 | 포탈 이메일 중복으로 내부 계정 생성 실패 | 🔴 | 중간 | 이메일 중복 시 기존 계정 연결 옵션 제공 |
| 2 | MASTER가 권한 남용 (타 법인 데이터 접근) | 🔴 | 낮음 | OwnEntityGuard로 API 레벨 강제 필터 |
| 3 | 기존 MANAGER 사용자 불편 (Settings 차단) | 🟡 | 높음 | 단계적 적용 + 사전 공지 |
| 4 | 이중 계정 비밀번호 혼란 | 🟡 | 중간 | 명확한 안내 + 향후 SSO 도입 |
| 5 | 포탈 계정 상태와 내부 계정 상태 불일치 | 🟠 | 중간 | 독립 운영 정책 명확화 |
| 6 | 법인별 API Key 없이 공동 키 남용 | 🔴 | 중간 | Quota 시스템으로 법인별 사용량 제한, 초과 시 WARN/BLOCK |
| 7 | AI 사용량 추적 누락 (일부 호출점 미적용) | 🟡 | 중간 | ClaudeService 레벨에서 통합 기록, 모든 호출점 감사 |
| 8 | API Key 캐시 무효화 지연 | 🟠 | 낮음 | 법인별 캐시 키 분리 + 키 변경 시 캐시 즉시 삭제 |
| 9 | Admin Module 분리 시 기존 MANAGER의 Agent/Service 접근 차단 | 🟡 | 높음 | 사전 공지 + 단계적 적용 (Phase 6) |
| 10 | 법인별 Drive 설정 누락 시 서비스 장애 | 🟠 | 낮음 | `ent_id IS NULL` 시스템 기본 설정을 폴백으로 유지 |

---

*작성: Claude Code (자동 분석)*
*분석 대상: apps/portal-api, apps/api, apps/web, packages/types 전체 소스코드*
