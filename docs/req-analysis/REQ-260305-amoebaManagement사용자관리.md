# REQ-amoebaManagement 사용자관리 (Entity 단위 현황 관리)

**작성일**: 2026-03-05
**요청자**: 관리자
**우선순위**: High

---

## 1. 요구사항 요약

ADMIN_LEVEL (SUPER_ADMIN, ADMIN) 사용자가 **Entity(법인) 단위**로 전체 사용 현황을 파악할 수 있는 관리 페이지를 구현한다.

- Settings 카드뷰에 **"amoebaManagement 사용자 관리"** 카드를 **맨 앞에** 배치
- **목록 뷰**: Entity 단위 목록 (MASTER 사용자 정보 포함)
- **상세 뷰**: 3개 탭 (Entity 요약 / 서비스 사용현황 / AI 사용현황)

---

## 2. AS-IS 현황 분석

### 2.1 기존 관리 기능

| 기능 | 위치 | 관점 | 한계 |
|------|------|------|------|
| **전체 사용자 관리** | Settings > 전체 사용자 (`SETTINGS_TOTAL_USERS`) | **사용자(User) 단위** | Entity 중심이 아닌 개별 사용자 목록 |
| **법인 관리** | Settings > 법인 관리 (`SETTINGS_ENTITIES`) | **법인 설정** | 법인 생성/수정만, 사용 현황 없음 |
| **AI 사용량** | Settings > AI 사용량 (`SETTINGS_AI_USAGE`) | **법인별 AI 통계** | AI만 제공, 서비스 구독 현황 없음 |
| **법인 설정** | Entity Settings (`ENTITY_*`) | **자기 법인만** | MASTER만 접근, 타 법인 못 봄 |

### 2.2 핵심 갭

1. **Entity 중심 통합 뷰 부재**: 법인별로 "누가 MASTER인지 + 서비스 구독 + AI 사용 + 멤버 수"를 한 화면에서 볼 수 없음
2. **서비스 구독 현황 누락**: Client-Subscription 관계는 있지만 Entity와 Client 간 직접 연결 없음
3. **검색 기능 부재**: 기존 전체 사용자는 User 단위 검색만, Entity 중심 검색 불가

### 2.3 데이터 구조 분석

#### Entity-User 관계
```
amb_hr_entities (법인)
  ↕ usr_company_id (User.companyId)
amb_users (사용자)
  - usr_role: MASTER | MANAGER | MEMBER | VIEWER
  - usr_company_id → Entity FK
```

- MASTER 사용자: `usr_role = 'MASTER' AND usr_company_id = entity.ent_id`
- 법인 멤버 수: `amb_hr_entity_user_roles` 테이블의 ACTIVE 역할 카운트

#### Entity-Service 관계 (현재 간접 연결)
```
amb_hr_entities (법인)
  ⇢ (직접 FK 없음)
amb_svc_clients (고객사)
  → amb_svc_subscriptions (구독)
    → amb_svc_services (서비스)
```

**문제**: `amb_svc_clients`에 `ent_id` 컬럼이 없어 법인과 고객사 간 직접 매핑 불가
**현실**: 고객사명(cli_company_name)과 법인명(ent_name)이 대략 일치하지만 정확한 FK 연결 없음

#### Entity-AI 관계 (직접 연결)
```
amb_hr_entities (법인)
  ← ent_id FK
amb_ai_token_usage (상세 로그)
amb_ai_token_entity_summary (일별 집계)
amb_entity_api_quotas (쿼터 설정)
```

### 2.4 현재 스테이징 데이터 현황

#### 등록된 법인 (10개)
| Entity Code | Entity Name | Level | 멤버 수 | MASTER |
|-------------|-------------|-------|---------|--------|
| HQ | Amoeba HQ | ROOT | 2 | test-fremd |
| VN01 | AMOEBA CO., LTD | SUBSIDIARY | 12 | Gray.Kim |
| KR01 | 아메바컴퍼니주식회사 | SUBSIDIARY | 1 | (없음) |
| ENT913 | 아메바파트너스 | SUBSIDIARY | 3 | kanguk |
| BTBZ951 | btbz | SUBSIDIARY | 1 | (없음) |
| SAOSA725 | (주)빛나는별 | SUBSIDIARY | 0 | JS Park |
| SAMJU168 | SamJu Trade | SUBSIDIARY | 0 | SON HYUN SOO |
| SAMJU359 | SamJu | SUBSIDIARY | 0 | 정영식 |
| SKYGR921 | SKYGROUP | SUBSIDIARY | 0 | skyliving |
| UIT327 | UIT | SUBSIDIARY | 0 | Huy Nguyen |

#### 서비스 구독 현황 (Client 기준)
| Client | 서비스 구독 |
|--------|-----------|
| SKYGROUP | amoeba Management, amoeba Talk |
| UIT | amoeba Talk |
| 아메바파트너스 | amoeba Management |
| 기타 7개 | 미구독 |

---

## 3. TO-BE 요구사항

### 3.1 Settings 카드 추가

- **카드명**: "amoebaManagement 사용자 관리" (한국어) / "User Management" (영어) / "Quản lý người dùng" (베트남어)
- **위치**: Settings 카드뷰 **최상단** (맨 앞 배치)
- **접근 권한**: ADMIN_LEVEL 전용 (SUPER_ADMIN, ADMIN)
- **메뉴코드**: `SETTINGS_USER_MANAGEMENT` (신규)
- **경로**: `/settings/user-management`

### 3.2 목록 페이지

#### 검색 영역
| 검색 필드 | 설명 |
|-----------|------|
| 법인명 | Entity Name 부분 검색 |
| MASTER 사용자명 | Entity의 MASTER 역할 User 이름 검색 |
| MASTER 이메일 | Entity의 MASTER 역할 User 이메일 검색 |

- 하나의 통합 검색 input에서 법인명/MASTER명/이메일 동시 검색 (OR 조건)
- 상태 필터: ALL / ACTIVE / INACTIVE

#### 목록 테이블
| # | 컬럼 | 데이터 소스 | 비고 |
|---|------|-----------|------|
| 1 | No. | 순번 | 페이지네이션 연동 |
| 2 | Entity Code | `ent_code` | |
| 3 | Entity Name | `ent_name` | 클릭 → 상세 |
| 4 | Level | `ent_level` | ROOT / SUBSIDIARY 뱃지 |
| 5 | MASTER | `usr_name / usr_email` | `usr_role='MASTER' AND usr_company_id=ent_id` |
| 6 | Members | 멤버 수 | `entity_user_roles` ACTIVE 카운트 |
| 7 | Signup Date | `ent_created_at` | 법인 등록일 |
| 8 | Status | `ent_status` | ACTIVE / INACTIVE 뱃지 |

#### 정렬
- 기본: `ent_sort_order ASC`
- 컬럼 헤더 클릭 정렬 (선택 사항)

### 3.3 상세 페이지 (탭 구성)

Entity Name 클릭 시 상세 페이지 또는 모달로 이동.

#### Tab 1: Entity 정보 요약

| 섹션 | 항목 |
|------|------|
| **기본 정보** | 법인코드, 법인명(국내/영문), 국가, 통화, 사업자등록번호, 대표자, 전화, 이메일, 주소, 등록일 |
| **조직 구조** | Level (ROOT/SUBSIDIARY), 상위 법인, HQ 여부 |
| **멤버 현황** | 총 멤버 수, 역할별 분포 (MASTER/MANAGER/MEMBER/VIEWER), MASTER 사용자 정보 |
| **조직 단위** | Unit 수, Cell 수 |

#### Tab 2: 서비스 사용현황

| 항목 | 설명 |
|------|------|
| **매칭된 Client** | Entity와 연결된 SvcClient 정보 (현재: 이름 매칭 or 향후 ent_id FK 추가) |
| **구독 서비스 목록** | 서비스명, 플랜, 상태, 시작일, 종료일, 가격, 구독자 수 |
| **구독 이력** | 최근 변경 이력 (SvcSubscriptionHistory) |

> **중요 설계 결정 필요**: `amb_svc_clients` 테이블에 `ent_id` FK 추가 여부
> - **옵션 A**: `ent_id` FK 추가 → 정확한 Entity-Client 매핑
> - **옵션 B**: 이름 기반 매칭 (불안정)
> - **권장**: 옵션 A (ent_id FK 추가)

#### Tab 3: AI 사용현황

| 항목 | 설명 | 데이터 소스 |
|------|------|-----------|
| **쿼터 설정** | 일일/월간 토큰 한도, 초과 시 정책 | `amb_entity_api_quotas` |
| **당월 사용량** | 총 토큰, 입력/출력 분리, 요청 수 | `amb_ai_token_entity_summary` |
| **일별 추이** | 최근 30일 일별 사용량 차트 | `amb_ai_token_entity_summary` |
| **사용자별** | 법인 내 사용자별 토큰 사용량 | `amb_ai_token_usage` GROUP BY usr_id |

> **기존 구현 활용**: `AiUsageService.getEntityUsageSummary()`, `getAllEntitiesUsage()` 이미 존재

---

## 4. 사용자 플로우

```
[Settings 페이지]
  └→ "amoebaManagement 사용자 관리" 카드 클릭
      └→ [Entity 목록 페이지]
          ├── 검색 (법인명 / MASTER명 / 이메일)
          ├── 상태 필터 (ALL / ACTIVE / INACTIVE)
          └── Entity 행 클릭
              └→ [Entity 상세 페이지]
                  ├── [Tab 1] Entity 정보 요약
                  ├── [Tab 2] 서비스 사용현황
                  └── [Tab 3] AI 사용현황
```

---

## 5. 기술 제약사항 및 고려사항

### 5.1 Entity-Client 매핑 문제
- 현재 `amb_svc_clients`에 `ent_id` 없음
- Portal에서 고객 등록 시 Entity가 자동 생성되는 플로우와 연결 필요
- **단기 해결**: `amb_svc_clients`에 `ent_id` nullable FK 추가
- **장기 해결**: Portal 고객 등록 → Entity 생성 → Client.ent_id 자동 설정

### 5.2 백엔드 API 구조
- 기존 `/admin/users` API: 사용자 단위 조회 → Entity 단위 조회 API 신규 필요
- AI 사용량: 기존 `/settings/ai-usage/entities` API 재활용 가능
- 서비스 구독: Client-Entity 매핑 후 새 API 필요

### 5.3 권한
- ADMIN_LEVEL 전용 (AdminLevelGuard 또는 AdminGuard 활용)
- 기존 `SETTINGS_TOTAL_USERS`와 유사한 권한 레벨

### 5.4 기존 기능과의 관계
| 기존 기능 | 새 기능과의 관계 |
|----------|----------------|
| 전체 사용자 (`SETTINGS_TOTAL_USERS`) | **유지** - User 단위 관리 용도로 공존 |
| 법인 관리 (`SETTINGS_ENTITIES`) | **유지** - 법인 생성/수정 용도 |
| AI 사용량 (`SETTINGS_AI_USAGE`) | 데이터/API 재활용, 새 페이지에서도 표시 |

---

## 6. 비기능 요구사항

- 응답 속도: 목록 조회 < 1초 (10~50개 Entity 기준)
- 페이지네이션: 20개 단위
- 반응형: 테이블 가로 스크롤
- i18n: 한국어, 영어, 베트남어
