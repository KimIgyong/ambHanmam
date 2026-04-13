# PLAN-amoebaManagement 사용자관리 - 작업계획

**작성일**: 2026-03-05
**기반 문서**: `docs/analysis/REQ-amoebaManagement사용자관리-20260305.md`

---

## 설계 방향

### 핵심 결정사항

1. **Client-Entity 매핑**: `amb_svc_clients` 테이블에 `ent_id` nullable FK 추가
   - 이유: 이름 기반 매칭은 불안정, Entity 중심 서비스 현황 조회에 정확한 FK 필요
   - 기존 데이터: 마이그레이션 없음 (수동 또는 향후 Portal Bridge에서 자동 연결)

2. **페이지 구조**: `/settings/user-management` 목록 + `/settings/user-management/:entityId` 상세 (별도 페이지, 탭 구성)
   - 기존 `SETTINGS_TOTAL_USERS`와 공존 (기존은 User 단위, 신규는 Entity 단위)

3. **API 위치**: 기존 `AdminController`에 엔드포인트 추가 (AdminLevelGuard 공유)

4. **메뉴코드**: `SETTINGS_USER_MANAGEMENT` 신규 추가 (menu-code.constant.ts에 등록)

---

## 단계별 구현 계획

### 1단계: Client Entity에 ent_id FK 추가

**파일**: `apps/api/src/domain/service-management/entity/client.entity.ts`

- `cli_ent_id` (UUID, nullable) 컬럼 추가
- `@ManyToOne(() => HrEntityEntity)` 관계 설정
- TypeORM `synchronize: true` (dev/staging)로 자동 반영

---

### 2단계: 백엔드 API - Entity 목록 조회

**파일**: `apps/api/src/domain/admin/controller/admin.controller.ts`
**파일**: `apps/api/src/domain/admin/service/admin.service.ts`

#### `GET /admin/entities` - Entity 목록 (검색, 필터, 페이지네이션)

**Query Parameters**:
- `search` (string): 법인명 OR MASTER 사용자명 OR MASTER 이메일 통합 검색
- `status` (string): ACTIVE / INACTIVE
- `page` (number, default: 1)
- `limit` (number, default: 20)

**응답 항목**:
```typescript
{
  items: [{
    entityId: string;
    entityCode: string;
    entityName: string;
    entityNameEn: string;
    level: string;           // ROOT / SUBSIDIARY
    status: string;          // ACTIVE / INACTIVE
    masterUser: {            // MASTER 역할 사용자 (usr_role='MASTER' AND usr_company_id=ent_id)
      userId: string;
      name: string;
      email: string;
    } | null;
    memberCount: number;     // entity_user_roles ACTIVE 카운트
    createdAt: string;       // 법인 등록일
  }],
  total, page, limit, totalPages
}
```

**구현 로직**:
```
1. HrEntityEntity 쿼리 빌더
2. LEFT JOIN UserEntity ON (usr_company_id = ent_id AND usr_role = 'MASTER')
3. search → OR(ent_name LIKE, ent_name_en LIKE, master.usr_name LIKE, master.usr_email LIKE)
4. status 필터 → ent_status
5. memberCount: 서브쿼리 또는 별도 카운트 쿼리
6. 정렬: ent_sort_order ASC
```

---

### 3단계: 백엔드 API - Entity 상세 조회

**파일**: `apps/api/src/domain/admin/controller/admin.controller.ts`
**파일**: `apps/api/src/domain/admin/service/admin.service.ts`

#### `GET /admin/entities/:entityId` - Entity 상세 정보

**응답**:
```typescript
{
  // 기본 정보
  entityId, entityCode, entityName, entityNameEn,
  country, currency, regNo, representative,
  phone, email, address, status,
  level, parentEntityName, isHq,
  createdAt, updatedAt,

  // 멤버 현황
  members: {
    total: number;
    byRole: { MASTER: n, MANAGER: n, MEMBER: n, VIEWER: n };
    masterUser: { userId, name, email } | null;
  },

  // 조직 현황
  organization: {
    unitCount: number;
    cellCount: number;
  },
}
```

#### `GET /admin/entities/:entityId/service-usage` - 서비스 사용현황

**응답**:
```typescript
{
  client: {                       // 연결된 SvcClient (ent_id FK로 조회)
    clientId, clientCode, companyName, status
  } | null;
  subscriptions: [{               // 구독 목록
    subscriptionId, serviceName, serviceCode,
    planName, status, startDate, endDate,
    price, currency, maxUsers, actualUsers
  }];
}
```

**구현**:
```
1. SvcClientEntity WHERE cli_ent_id = entityId
2. 없으면 client: null, subscriptions: []
3. 있으면 SvcSubscriptionEntity JOIN service, plan WHERE cli_id
```

#### `GET /admin/entities/:entityId/ai-usage` - AI 사용현황

**기존 API 재활용**: `AiUsageService.getEntityUsageSummary(entityId)` 직접 호출

**추가 데이터**: 사용자별 사용량 (상위 10명)
```typescript
{
  summary: { daily, monthly, quota, warnings },  // 기존 AiUsageService
  topUsers: [{                                     // 당월 상위 사용자
    userId, userName, userEmail,
    totalTokens, requestCount
  }]
}
```

---

### 4단계: Admin Module 의존성 추가

**파일**: `apps/api/src/domain/admin/admin.module.ts`

- `TypeOrmModule.forFeature`에 추가:
  - `SvcClientEntity`, `SvcSubscriptionEntity`, `SvcServiceEntity`, `SvcPlanEntity`
  - `CellEntity`
  - `AiTokenUsageEntity`, `AiTokenEntitySummaryEntity`, `EntityApiQuotaEntity`
- `AiUsageModule` import (AiUsageService 주입용)

---

### 5단계: 프론트엔드 - Settings 카드 추가

**파일**: `apps/web/src/domain/settings/pages/SettingsPage.tsx`

`SETTINGS_CARDS` 배열 **맨 앞**에 추가:
```typescript
{
  menuCode: 'SETTINGS_USER_MANAGEMENT',
  titleKey: 'common:settingsPage.userManagement.title',
  descriptionKey: 'common:settingsPage.userManagement.description',
  icon: Building2,  // 법인 중심이므로 Building2
  iconColor: 'text-rose-600',
  bgColor: 'bg-rose-100',
  path: '/settings/user-management',
},
```

**i18n 키 추가** (common.json 3개 언어):
```json
// ko
"userManagement": {
  "title": "사용자 관리",
  "description": "법인별 사용자 현황, 서비스 구독, AI 사용량을 관리합니다"
}
// en
"userManagement": {
  "title": "User Management",
  "description": "Manage users, service subscriptions, and AI usage by entity"
}
// vi
"userManagement": {
  "title": "Quản lý người dùng",
  "description": "Quản lý người dùng, đăng ký dịch vụ và sử dụng AI theo pháp nhân"
}
```

---

### 6단계: 프론트엔드 - API 서비스 & 훅

**파일**: `apps/web/src/domain/admin/service/admin.service.ts`

메서드 추가:
- `getEntities(params)` → `GET /admin/entities`
- `getEntityDetail(entityId)` → `GET /admin/entities/:entityId`
- `getEntityServiceUsage(entityId)` → `GET /admin/entities/:entityId/service-usage`
- `getEntityAiUsage(entityId)` → `GET /admin/entities/:entityId/ai-usage`

**파일**: `apps/web/src/domain/admin/hooks/useAdmin.ts`

훅 추가:
- `useEntityManagementList(params)` - 목록 조회
- `useEntityManagementDetail(entityId)` - 상세 조회
- `useEntityServiceUsage(entityId)` - 서비스 사용현황
- `useEntityAiUsage(entityId)` - AI 사용현황

---

### 7단계: 프론트엔드 - 목록 페이지

**파일**: `apps/web/src/domain/admin/pages/EntityManagementPage.tsx` (신규)

구성:
- 헤더: 아이콘 + 제목 + 부제목
- 검색: 통합 검색 input (법인명/MASTER명/이메일) + 상태 필터 (ALL/ACTIVE/INACTIVE)
- 테이블:

| No. | Entity Code | Entity Name | Level | MASTER | Members | Signup Date | Status |
|-----|-------------|-------------|-------|--------|---------|-------------|--------|

- Entity Name 클릭 → `/settings/user-management/:entityId` 이동
- 페이지네이션 (20개 단위)

---

### 8단계: 프론트엔드 - 상세 페이지 (3개 탭)

**파일**: `apps/web/src/domain/admin/pages/EntityManagementDetailPage.tsx` (신규)

#### 공통
- 상단: 뒤로가기 + Entity Name + Entity Code 뱃지 + Status 뱃지
- 탭 메뉴: 정보 요약 | 서비스 사용현황 | AI 사용현황

#### Tab 1: Entity 정보 요약 (컴포넌트)
**파일**: `apps/web/src/domain/admin/components/EntitySummaryTab.tsx` (신규)

- 기본 정보 카드: 법인코드, 법인명(국내/영문), 국가, 통화, 사업자등록번호, 대표자, 전화, 이메일, 주소
- 조직 구조 카드: Level, 상위 법인, HQ 여부
- 멤버 현황 카드: 총원, 역할별 분포 바, MASTER 정보
- 조직 단위 카드: Unit 수, Cell 수

#### Tab 2: 서비스 사용현황 (컴포넌트)
**파일**: `apps/web/src/domain/admin/components/EntityServiceTab.tsx` (신규)

- 연결된 Client 정보 (없으면 "연결된 고객사 없음" 표시)
- 구독 서비스 목록 테이블: 서비스명, 플랜, 상태, 기간, 가격, 사용자 수

#### Tab 3: AI 사용현황 (컴포넌트)
**파일**: `apps/web/src/domain/admin/components/EntityAiUsageTab.tsx` (신규)

- 쿼터 설정 카드: 일일/월간 한도, 초과 정책
- 당월 사용량 카드: 총 토큰, 입력/출력, 요청 수, 사용률(%)
- 상위 사용자 목록: 이름, 이메일, 토큰, 요청 수

---

### 9단계: 라우터 등록

**파일**: `apps/web/src/router/index.tsx`

`settings/total-users` 근처에 추가:
```tsx
{
  path: 'settings/user-management',
  element: <AdminGuard><EntityManagementPage /></AdminGuard>,
},
{
  path: 'settings/user-management/:entityId',
  element: <AdminGuard><EntityManagementDetailPage /></AdminGuard>,
},
```

---

### 10단계: i18n 네임스페이스

**파일**: `apps/web/src/locales/ko/entityManagement.json` (신규)
**파일**: `apps/web/src/locales/en/entityManagement.json` (신규)
**파일**: `apps/web/src/locales/vi/entityManagement.json` (신규)
**파일**: `apps/web/src/i18n.ts` (네임스페이스 등록)

주요 키:
```json
{
  "title": "사용자 관리",
  "subtitle": "법인별 사용자 현황 및 서비스 사용 정보를 관리합니다",
  "search": "법인명, MASTER 이름 또는 이메일로 검색...",
  "allStatus": "전체 상태",
  "col": {
    "no": "No.",
    "entityCode": "법인코드",
    "entityName": "법인명",
    "level": "유형",
    "master": "MASTER",
    "members": "멤버",
    "signupDate": "등록일",
    "status": "상태"
  },
  "level": { "ROOT": "본사", "SUBSIDIARY": "법인" },
  "noEntities": "등록된 법인이 없습니다",
  "noMaster": "미지정",
  "tabs": {
    "summary": "정보 요약",
    "services": "서비스 사용현황",
    "aiUsage": "AI 사용현황"
  },
  "summary": {
    "basicInfo": "기본 정보",
    "orgStructure": "조직 구조",
    "memberStatus": "멤버 현황",
    "orgUnits": "조직 단위",
    "entityCode": "법인코드",
    "entityName": "법인명",
    "entityNameEn": "법인명 (영문)",
    "country": "국가",
    "currency": "통화",
    "regNo": "사업자등록번호",
    "representative": "대표자",
    "phone": "전화",
    "email": "이메일",
    "address": "주소",
    "parentEntity": "상위 법인",
    "isHq": "본사 여부",
    "totalMembers": "총 멤버",
    "units": "Unit 수",
    "cells": "Cell 수"
  },
  "service": {
    "linkedClient": "연결된 고객사",
    "noClient": "연결된 고객사가 없습니다",
    "subscriptions": "구독 서비스",
    "noSubscriptions": "구독 중인 서비스가 없습니다",
    "serviceName": "서비스",
    "plan": "플랜",
    "period": "기간",
    "price": "가격",
    "users": "사용자"
  },
  "aiUsage": {
    "quota": "쿼터 설정",
    "noQuota": "쿼터 미설정",
    "monthlyUsage": "당월 사용량",
    "dailyLimit": "일일 한도",
    "monthlyLimit": "월간 한도",
    "actionOnExceed": "초과 시",
    "totalTokens": "총 토큰",
    "inputTokens": "입력 토큰",
    "outputTokens": "출력 토큰",
    "requests": "요청 수",
    "usage": "사용률",
    "topUsers": "상위 사용자",
    "WARN": "경고",
    "BLOCK": "차단"
  },
  "back": "목록으로"
}
```

---

### 11단계: 메뉴코드 등록

**파일**: `apps/api/src/global/constant/menu-code.constant.ts`

- `SETTINGS_USER_MANAGEMENT` 추가 (ADMIN_MODULE 또는 SETTINGS 그룹)

---

### 12단계: 빌드 및 검증

- `npm run build` 전체 빌드 확인
- 스테이징 배포 후 동작 확인

---

## 수정 파일 목록

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `apps/api/src/domain/service-management/entity/client.entity.ts` | `cli_ent_id` FK 추가 |
| 2 | `apps/api/src/domain/admin/controller/admin.controller.ts` | 4개 엔드포인트 추가 |
| 3 | `apps/api/src/domain/admin/service/admin.service.ts` | Entity 관리 메서드 4개 |
| 4 | `apps/api/src/domain/admin/admin.module.ts` | 의존성 추가 |
| 5 | `apps/api/src/global/constant/menu-code.constant.ts` | 메뉴코드 추가 |
| 6 | `apps/web/src/domain/settings/pages/SettingsPage.tsx` | 카드 추가 (맨 앞) |
| 7 | `apps/web/src/domain/admin/service/admin.service.ts` | API 메서드 4개 |
| 8 | `apps/web/src/domain/admin/hooks/useAdmin.ts` | 훅 4개 |
| 9 | `apps/web/src/domain/admin/pages/EntityManagementPage.tsx` | 목록 페이지 (신규) |
| 10 | `apps/web/src/domain/admin/pages/EntityManagementDetailPage.tsx` | 상세 페이지 (신규) |
| 11 | `apps/web/src/domain/admin/components/EntitySummaryTab.tsx` | 정보 요약 탭 (신규) |
| 12 | `apps/web/src/domain/admin/components/EntityServiceTab.tsx` | 서비스 탭 (신규) |
| 13 | `apps/web/src/domain/admin/components/EntityAiUsageTab.tsx` | AI 탭 (신규) |
| 14 | `apps/web/src/router/index.tsx` | 라우트 2개 |
| 15 | `apps/web/src/i18n.ts` | 네임스페이스 등록 |
| 16 | `apps/web/src/locales/ko/entityManagement.json` | i18n (신규) |
| 17 | `apps/web/src/locales/en/entityManagement.json` | i18n (신규) |
| 18 | `apps/web/src/locales/vi/entityManagement.json` | i18n (신규) |
| 19 | `apps/web/src/locales/ko/common.json` | 카드 i18n |
| 20 | `apps/web/src/locales/en/common.json` | 카드 i18n |
| 21 | `apps/web/src/locales/vi/common.json` | 카드 i18n |

---

## 재사용 기존 코드

| 기존 코드 | 재사용 방식 |
|----------|-----------|
| `AdminLevelGuard` | Entity 관리 API 보호 |
| `AiUsageService.getEntityUsageSummary()` | AI 탭 데이터 |
| `AiUsageService.getAllEntitiesUsage()` | 참조 (필요 시) |
| `InternalUsersTab` 패턴 | 목록 테이블 UI 패턴 |
| `TotalUserManagementPage` 패턴 | 탭 UI 패턴 |
| `adminKeys` 쿼리 키 패턴 | React Query 키 구조 |
| `RoleBadge`, `StatusBadge` | 뱃지 컴포넌트 패턴 |

---

## 검증 체크리스트

1. `npm run build` 빌드 성공
2. Settings 페이지에서 "사용자 관리" 카드가 **맨 앞**에 표시
3. ADMIN_LEVEL이 아닌 사용자에게는 카드 미표시
4. Entity 목록: 검색(법인명/MASTER명/이메일) 동작
5. Entity 목록: 상태 필터 동작
6. Entity 목록: MASTER 사용자 정보 표시
7. 상세 > 정보 요약 탭: 법인 기본정보, 멤버 현황, 조직 단위 표시
8. 상세 > 서비스 탭: Client 연결 및 구독 서비스 목록 표시
9. 상세 > AI 탭: 쿼터 설정, 당월 사용량, 상위 사용자 표시
