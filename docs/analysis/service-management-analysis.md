# 서비스 관리 및 고객 통합 관리 요구사항 분석서

> **작성일**: 2026-02-18
> **참조 문서**: `reference/amoeba_service_user_management_require.md`

---

## 1. 현재 구현 분석 (AS-IS)

### 1.1 기존 인프라

| 항목 | 현재 상태 |
|------|-----------|
| 서비스 관리 | **미구현** — 아메바톡/오더/캠페인 등 서비스 정보 미등록 |
| 고객 관리 | 빌링 모듈에 `amb_bil_partners` (거래처)만 존재 — 서비스 이용 관점 부재 |
| 구독 관리 | **미구현** — 서비스별 고객 구독 상태 추적 불가 |
| 고객 통합 뷰 | **미구현** — 고객별 전체 서비스 이용 현황 확인 불가 |

### 1.2 재활용 가능한 기존 모듈

| 모듈 | 재활용 포인트 |
|------|--------------|
| Billing | `amb_bil_partners` FK 연결 (cli_bil_partner_id), `amb_bil_contracts` FK 연결 (sub_contract_id) |
| HR | `EntityGuard`를 통한 법인 격리, `EntitySelector` 컴포넌트 |
| Settings | `MenuConfigService`로 SERVICE_MANAGEMENT 메뉴 자동 등록 |

---

## 2. 신규 데이터 모델

### 2.1 테이블 7개 (신규)

| # | 테이블 | prefix | 설명 | 주요 FK |
|---|--------|--------|------|---------|
| 1 | `amb_svc_services` | svc_ | 서비스 카탈로그 | - |
| 2 | `amb_svc_plans` | spl_ | 서비스 플랜/요금제 | svc_id |
| 3 | `amb_svc_clients` | cli_ | 고객사 | ent_id, usr_id, ptn_id |
| 4 | `amb_svc_client_contacts` | ctc_ | 고객 담당자 | cli_id |
| 5 | `amb_svc_subscriptions` | sub_ | 서비스 구독 | cli_id, svc_id, spl_id, ctr_id |
| 6 | `amb_svc_subscription_history` | sbh_ | 구독 변경 이력 | sub_id |
| 7 | `amb_svc_client_notes` | cnt_ | 고객 메모 | cli_id, sub_id, usr_id |

### 2.2 기능 요구사항 (31개 FR)

| 그룹 | FR 수 | 범위 |
|------|-------|------|
| 서비스 카탈로그 | 7 | FR-SVC-001~007 |
| 고객 관리 | 10 | FR-CLI-001~010 |
| 구독 관리 | 10 | FR-SUB-001~010 |
| 대시보드/분석 | 5 | FR-RPT-001~005 (Phase 2) |

### 2.3 에러 코드

E22xxx 시리즈 (12개): E22001~E22012

### 2.4 메뉴 코드

`SERVICE_MANAGEMENT` — ADMIN/MANAGER: ✅, USER: ❌

---

## 3. 구현 우선순위

### Phase 1 (MVP): 백엔드 전체 + 프론트엔드 기본 UI

**목표**: 서비스/고객/구독 CRUD 완성, 기본 목록/상세 페이지

| 순서 | 대상 | 파일 수 |
|------|------|---------|
| 1 | 상수/타입 수정 | 3 |
| 2 | 엔티티 7개 | 7 |
| 3 | DTO 9개 | 9 |
| 4 | 매퍼 3개 | 3 |
| 5 | 서비스 4개 | 4 |
| 6 | 컨트롤러 3개 | 3 |
| 7 | 모듈 + app.module | 2 |
| 8 | FE 서비스/훅/i18n | 7 |
| 9 | FE 페이지 8개 | 8 |
| 10 | FE 컴포넌트 | 8 |
| 11 | 라우터/메뉴 | 2 |
| **합계** | | **~56** |

### Phase 2 (대시보드/분석): 리포트 기능

**목표**: 대시보드 KPI, 고객 분포, 구독 추이, 이탈률, 크로스셀링

---

## 4. 영향 범위

| 계층 | 변경 대상 | 유형 |
|------|-----------|------|
| DB | 7개 테이블 | 신규 |
| BE | `error-code.constant.ts` | 수정 (E22xxx 추가) |
| BE | `menu-code.constant.ts` | 수정 (SERVICE_MANAGEMENT 추가) |
| BE | `menu-config.service.ts` | 수정 (DEFAULT_MENU_CONFIGS에 추가) |
| BE | `app.module.ts` | 수정 (ServiceModule import) |
| Types | `domain.types.ts` | 수정 (응답 타입 추가) |
| FE | `i18n.ts` | 수정 (service 네임스페이스) |
| FE | `router/index.tsx` | 수정 (/service/* 라우트) |
