# hanmam → AMB 전체 기능 통합 분석서

> 작성일: 2026-04-14  
> 목적: hanmam(Java/Spring + MyBatis + MySQL) 전체 기능을 AMB(NestJS + React + PostgreSQL)에 통합

---

## 1. 시스템 비교 요약

| 항목 | hanmam (레거시) | AMB (현행) |
|------|----------------|-----------|
| **Backend** | Spring Boot + MyBatis + MySQL | NestJS 10 + TypeORM + PostgreSQL 15 |
| **Frontend** | Apache Tiles (SSR) + jQuery | React 18 + TypeScript + TailwindCSS |
| **인증** | Session 기반 (Spring Security) | JWT 기반 (Access/Refresh Token) |
| **권한** | 비트필드 (`USER_AUTH` 정수) | 레벨+역할 기반 (4레벨 × 10역할) |
| **멀티법인** | 단일 회사 (`COMP_NO` 필터) | 다법인 (`ent_id` 격리) |
| **다국어** | 미지원 | i18n 기본 (ko/en/vi) |
| **AI** | 미지원 | Claude API 연동 |
| **파일** | 로컬 파일시스템 | Drive 모듈 (로컬/클라우드) |

---

## 2. 기능 매핑 총괄표

### 범례
- **O** : AMB에 동등 기능 존재 → 데이터 마이그레이션만 필요
- **△** : AMB에 유사 기능 존재 → 확장/보강 필요
- **X** : AMB에 미존재 → 신규 개발 필요

### 2.1 포털 모듈 (25개)

| # | hanmam 모듈 | 기능 | AMB 대응 도메인 | 매핑 |
|---|------------|------|----------------|------|
| 1 | **User** | 사용자/조직 관리, 프로필, 로그 | `auth`, `hr`, `members`, `unit` | **O** |
| 2 | **Daily** | 나의업무 (일일계획/실적) | `today` (daily missions) | **△** |
| 3 | **Schedule** | 일정 공유, 휴일 관리 | `calendar` | **△** |
| 4 | **Project** | 프로젝트 관리 (계층형) | `project` | **△** |
| 5 | **Notice** | 쪽지 (사용자간 DM) | `notices`, `notification` | **△** |
| 6 | **File** | 파일 첨부/다운로드 | `drive` | **O** |
| 7 | **Customer** | 고객사 관리 | `service-management` (clients) | **△** |
| 8 | **Call** | 업무연락 (핵심 워크플로우) | — | **X** |
| 9 | **BBS** | 게시판 (다중 게시판) | — | **X** |
| 10 | **Weekly** | 주간보고 | — | **X** |
| 11 | **Meeting** | 회의록 | `meeting-notes` | **△** |
| 12 | **Vacation** | 휴가 관리 | `attendance` (부분) | **△** |
| 13 | **Career** | 사원 이력/경력 관리 | — | **X** |
| 14 | **Certificate** | 증명서 신청/발급 | — | **X** |
| 15 | **Consult** | 상담 관리 | — | **X** |
| 16 | **Credential** | 기술자 자격 파일 | — | **X** |
| 17 | **Design/Memo** | 설계문서 (트리형 지식관리) | `kms` (유사) | **△** |
| 18 | **DocRegister** | 문서대장 | — | **X** |
| 19 | **Equip** | 장비/자산 관리 | `asset` (유사) | **△** |
| 20 | **Mail** | 내부 메일 | `amoeba-talk` (채팅) | **△** |
| 21 | **Menu** | 나의 메뉴 (즐겨찾기) | — | **X** |
| 22 | **Modifier** | 문서 수정자 추적 | — | **X** |
| 23 | **Product** | 상품/서비스 카탈로그 | — | **X** |
| 24 | **Reserve** | 예약 (회의실/차량) | — | **X** |
| 25 | **Resource** | IP/네트워크 자원 관리 | — | **X** |
| 26 | **Salary** | 인건비 관리 | — | **X** |

### 2.2 경영관리(Biz) 모듈 (12개)

| # | hanmam 모듈 | 기능 | AMB 대응 도메인 | 매핑 |
|---|------------|------|----------------|------|
| 27 | **Account** | 계정과목 (계층형) | `accounting` | **△** |
| 28 | **Bank** | 자금관리 (통장/입출금) | — | **X** |
| 29 | **Bill** | 계산서 관리 | `billing` (다른 성격) | **X** |
| 30 | **Biz** | 경영성과분석 (다단계 P&L) | `analytics` (다른 성격) | **X** |
| 31 | **Budget** | 예산 관리 | — | **X** |
| 32 | **Card** | 법인카드 관리 | — | **X** |
| 33 | **Contract** | 계약 관리 | `billing` (부분) | **△** |
| 34 | **Doc** | 전자결재 시스템 | — | **X** |
| 35 | **Expense** | 지출 관리 | `expense-request` (부분) | **△** |
| 36 | **Invoice** | 세금계산서 | — | **X** |
| 37 | **Sales** | 매출 관리 | — | **X** |
| 38 | **Trade** | 사내거래 | — | **X** |

---

## 3. 매핑 분류별 요약

### 3.1 기존 기능 활용 (O) — 2개
| 모듈 | 설명 |
|------|------|
| User/Org | AMB의 auth + hr + members + unit이 이미 더 고도화됨 |
| File | AMB의 drive 모듈이 이미 중앙 파일 관리 담당 |

### 3.2 확장/보강 필요 (△) — 13개
| 모듈 | AMB 대응 | 보강 내용 |
|------|---------|----------|
| Daily | `today` | hanmam의 업무계획/실적 입력, 근무시간 통계 기능 보강 |
| Schedule | `calendar` | 휴일 관리, 조직별 일정 필터, 일정 유형 확장 |
| Project | `project` | 4단계 계층 구조, 예산 연계, 참여자 관리 보강 |
| Notice | `notices` | 수신/발신함 분리, 답장/전달 기능 |
| Customer | `service-management` | hanmam 고객사 데이터 모델 필드 매핑 |
| Meeting | `meeting-notes` | 참석자 관리, 주간보고 연계 |
| Vacation | `attendance` | 휴가 유형(반차/반반차/경조/특별), 전자결재 연동 |
| Design/Memo | `kms` | 트리형 설계문서 구조, 상태 관리 (설계→코딩→테스트→완료) |
| Equip | `asset` | 장비 유형, 수리이력, 이동이력 관리 |
| Mail | `amoeba-talk` | 기존 내부메일 → Talk 채팅으로 전환 (기능 매핑) |
| Account | `accounting` | 계정과목 트리 구조 보강 |
| Contract | `billing` | 반복 계약, 자동 매출/청구 생성 |
| Expense | `expense-request` | 프로젝트별 지출, 결제 상태 관리 보강 |

### 3.3 신규 개발 필요 (X) — 23개
| 우선순위 | 모듈 | 중요도 | 이유 |
|---------|------|--------|------|
| **P0 (핵심)** | **Call (업무연락)** | ★★★★★ | hanmam의 핵심 워크플로우, 모든 모듈 연결점 |
| **P0 (핵심)** | **Doc (전자결재)** | ★★★★★ | 휴가/지출/매출 승인의 기반 시스템 |
| **P1 (높음)** | BBS (게시판) | ★★★★ | 사내 커뮤니케이션 기본 인프라 |
| **P1 (높음)** | Weekly (주간보고) | ★★★★ | 주요 보고 체계 |
| **P1 (높음)** | Sales (매출) | ★★★★ | 경영관리 핵심 (계약→매출→청구 연결) |
| **P1 (높음)** | Invoice (세금계산서) | ★★★★ | 매출 대금 청구의 필수 요소 |
| **P1 (높음)** | Bank (자금관리) | ★★★★ | 입출금 관리, 매칭의 기반 |
| **P2 (중간)** | Budget (예산) | ★★★ | 프로젝트별 예산 편성/집행 |
| **P2 (중간)** | Card (법인카드) | ★★★ | 법인카드 사용 내역 관리 |
| **P2 (중간)** | Bill (계산서) | ★★★ | 세금계산서 발행/수취 |
| **P2 (중간)** | Biz (경영성과) | ★★★ | 다단계 손익 분석 리포트 |
| **P2 (중간)** | Career (사원이력) | ★★★ | HR 인사 기록 |
| **P2 (중간)** | Reserve (예약) | ★★★ | 회의실/차량 예약 |
| **P2 (중간)** | Product (상품) | ★★★ | 계약/매출과 연결되는 상품 마스터 |
| **P2 (중간)** | Trade (사내거래) | ★★★ | 법인간 거래 기록 |
| **P3 (낮음)** | Certificate (증명서) | ★★ | 증명서 신청/발급 |
| **P3 (낮음)** | Consult (상담) | ★★ | 상담 기록 관리 |
| **P3 (낮음)** | Credential (기술자파일) | ★★ | 기술자 자격 파일 관리 |
| **P3 (낮음)** | DocRegister (문서대장) | ★★ | 문서 번호 관리 |
| **P3 (낮음)** | Salary (인건비) | ★★ | 인건비 관리 (보안 민감) |
| **P3 (낮음)** | Menu (나의메뉴) | ★ | 즐겨찾기 메뉴 |
| **P3 (낮음)** | Modifier (수정자) | ★ | 문서 수정 추적 |
| **P3 (낮음)** | Resource (IP관리) | ★ | IP/네트워크 자원 관리 |

---

## 4. 핵심 비즈니스 규칙 (마이그레이션 시 필수 보존)

### 4.1 프로젝트 중심 구조
```
회사(COMP) → 조직(ORG) → 사업(BIZ) → 세부 프로젝트(SUB)
     ↑ 4단계 계층, tbl_prj.PRJ_LEVEL로 구분

프로젝트 ←── 계약, 매출, 지출, 예산, 업무연락, 인건비 모두 연결
```

### 4.2 전자결재 → 트랜잭션 연동
```
전자결재(Doc) 승인 완료
  ├──→ 휴가 자동 등록 (tbl_vacation.DOC_NO)
  ├──→ 지출 자동 등록 (tbl_expense.DOC_NO)
  └──→ 매출 자동 등록 (tbl_sales.DOC_NO)
```

### 4.3 계약 자동 발행
```
계약(Contract)
  ├── SALES_AUTO=Y → 매월 매출 자동 생성
  ├── INVOICE_AUTO=Y → 매월 세금계산서 자동 생성
  └── EVERY_MONTH=Y → 월 반복 계약
```

### 4.4 자금 매칭 플로우
```
은행 거래내역(Excel) → 업로드 → 파싱(BankInout)
                                     ↓
                              지출/매출과 매칭(BankLink)
                                     ↓
                              대사 완료 (자금 정산)
```

### 4.5 권한 체계 전환
```
hanmam (비트필드)              AMB (레벨+역할)
──────────────────────         ──────────────────────
AUTH_ADMIN(1)           →      ADMIN_LEVEL + ADMIN
AUTH_LEADER(2)          →      USER_LEVEL + MANAGER
AUTH_SALARY(4)          →      기능 권한 모듈 신규 필요
AUTH_TAX(8)             →      기능 권한 모듈 신규 필요
AUTH_BBS(16)            →      기능 권한 모듈 신규 필요
AUTH_DOC(32)            →      기능 권한 모듈 신규 필요
AUTH_FUND(64)           →      기능 권한 모듈 신규 필요
AUTH_BIZ(128)           →      기능 권한 모듈 신규 필요
AUTH_BIZ_DETAIL(256)    →      기능 권한 모듈 신규 필요
AUTH_SUP(512)           →      기능 권한 모듈 신규 필요
AUTH_MEETING(1024)      →      기능 권한 모듈 신규 필요
```

> **중요**: hanmam의 비트필드 기능 권한을 AMB의 레벨/역할 체계에 맞게 **기능 권한(Feature Permission) 모듈**을 신규 설계해야 함

---

## 5. 데이터베이스 마이그레이션 (필수 요건)

> **⚠️ 필수**: 기능 통합 완료 후 hanmam의 MySQL 데이터는 반드시 AMB의 PostgreSQL로 마이그레이션되어 기존 데이터가 AMB에서 그대로 사용 가능해야 한다. 데이터 유실 불가.

### 5.1 DB 전환 규칙

| 항목 | hanmam (MySQL) | AMB (PostgreSQL) | 변환 규칙 |
|------|----------------|-------------------|----------|
| DB | MySQL 5.x/8.x | PostgreSQL 15 | 타입 매핑 필요 |
| PK | 자동증가 정수 (`XXX_NO`) | UUID (`xxx_id`) | 정수→UUID 매핑 테이블 생성, FK 참조 일괄 변환 |
| 테이블명 | `tbl_xxx` | `amb_xxx` | prefix 변환 |
| 컬럼명 | 대문자 (`USER_NAME`) | 3자 prefix + snake_case (`usr_name`) | 컬럼 매핑 정의 |
| Soft Delete | `DEL_YN` (Y/N) | `xxx_deleted_at` (timestamp) | Y → `NOW()`, N → `NULL` |
| 날짜 | `VARCHAR` (YYYYMMDD) | `TIMESTAMP` | 문자열→타임스탬프 파싱 |
| Boolean | `VARCHAR` (Y/N) 또는 `INT` (0/1) | `BOOLEAN` | 타입 변환 |
| 파일 참조 | `ATTACH_FILE_ID` (문자열) | `xxx_file_id` (UUID FK) | 파일 매핑 테이블 |
| 멀티법인 | `COMP_NO` (단순 필터) | `ent_id` (UUID FK, 격리 필수) | COMP_NO → ent_id 매핑 |
| 인코딩 | utf8mb4 | UTF-8 | 호환 (변환 불필요) |

### 5.2 마이그레이션 대상 규모
- hanmam: **~40개 테이블** (MySQL)
- AMB 기존: **~190개 테이블** (PostgreSQL)
- 통합 후 예상: **~220개 테이블** (신규 ~30개 추가)

### 5.3 PK 변환 전략

hanmam의 정수 PK를 AMB의 UUID PK로 전환할 때, FK 참조 무결성을 유지해야 한다.

```
1) 매핑 테이블 생성
   amb_migration_pk_map (
     map_id          UUID PK,
     map_source_table VARCHAR,     -- 'tbl_call'
     map_source_pk    INTEGER,     -- 원본 정수 PK
     map_target_table VARCHAR,     -- 'amb_calls'
     map_target_pk    UUID,        -- 신규 UUID PK
     map_created_at   TIMESTAMP
   )

2) 변환 순서: 마스터 테이블 → 트랜잭션 테이블 → 연결 테이블
   tbl_user → tbl_org → tbl_prj → tbl_call → tbl_doc → ...

3) FK 참조 변환: 매핑 테이블 JOIN으로 UUID FK 일괄 UPDATE
```

### 5.4 멀티법인 대응

hanmam은 단일/소수 법인(`COMP_NO`) 구조이나, AMB는 `ent_id` 격리 필수:

```
변환 규칙:
- tbl_user.COMP_NO → amb_users.usr_company_id (ent_id 매핑)
- COMP_NO가 없는 데이터 → 기본 법인(default entity)에 배정
- COMP_NO별 데이터 → 해당 법인의 ent_id로 매핑
```

### 5.5 마이그레이션 실행 계획

```
Phase A: 사전 준비
  ├── 테이블별 컬럼 매핑 정의서 작성
  ├── PK 매핑 테이블 생성
  └── 마이그레이션 스크립트 템플릿 작성

Phase B: 마스터 데이터
  ├── 회사/조직 (tbl_org → amb_hr_entities, amb_units)
  ├── 사용자 (tbl_user → amb_users + amb_hr_entity_user_roles)
  ├── 계정과목 (tbl_account → amb_accounts)
  ├── 고객사 (tbl_customer → amb_svc_clients)
  └── 상품 (tbl_product → amb_products)

Phase C: 트랜잭션 데이터
  ├── 업무연락 (tbl_call → amb_calls)
  ├── 프로젝트 (tbl_prj → amb_kms_projects 보강)
  ├── 전자결재 (tbl_doc → amb_docs)
  ├── 계약/매출/지출/세금계산서
  └── 자금/카드/예산

Phase D: 보조 데이터
  ├── 게시판/공지/일정/휴가
  ├── 파일 데이터 (tbl_file → amb_drive_files)
  └── 물리 파일 이동 (파일시스템)

Phase E: 검증
  ├── 건수 대사 (원본 vs 이관 테이블별 COUNT 일치 확인)
  ├── 샘플 데이터 상세 검증
  ├── FK 참조 무결성 검증
  └── 사용자 인수 테스트 (UAT)
```

### 5.6 모듈 개발 시 마이그레이션 병행 원칙

> **각 모듈 개발 시 마이그레이션 스크립트를 함께 작성한다.**
> - Entity 설계 시 hanmam 원본 컬럼과의 매핑 코멘트 포함
> - 마이그레이션 SQL 스크립트: `scripts/migration/hanmam/{모듈명}.sql`
> - 변환 검증 쿼리: `scripts/migration/hanmam/verify_{모듈명}.sql`

---

## 6. 통합 단계 제안

### Phase 1: 기반 정비 (1단계)
- [ ] 기능 권한(Feature Permission) 모듈 설계/개발
- [ ] hanmam 비트필드 권한 → AMB 기능 권한 매핑 테이블
- [ ] 공통 코드/상수 정리 (WorkType, MemoType, MemoStatus 등)
- [ ] 마이그레이션 인프라 구축 (PK 매핑 테이블, 변환 스크립트 템플릿)
- [ ] 마스터 데이터 마이그레이션 (회사/조직/사용자/계정과목/고객사/상품)

### Phase 2: 핵심 워크플로우 (2단계)
- [ ] **Call (업무연락)** — 핵심 업무 흐름의 중심축 + 마이그레이션 스크립트
- [ ] **Doc (전자결재)** — 승인 기반 업무 처리의 근간 + 마이그레이션 스크립트
- [ ] **BBS (게시판)** — 사내 커뮤니케이션 + 마이그레이션 스크립트

### Phase 3: 경영관리 핵심 (3단계)
- [ ] **Sales (매출)** + **Invoice (세금계산서)** + **Contract (계약)** + **Product (상품)** + 마이그레이션
- [ ] **Expense (지출)** 보강 + **Budget (예산)** + 마이그레이션
- [ ] **Bank (자금관리)** + **Card (법인카드)** + 마이그레이션

### Phase 4: 경영분석 + HR (4단계)
- [ ] **Biz (경영성과분석)** + **Trade (사내거래)** + 마이그레이션
- [ ] **Account (계정과목)** 보강 + **Bill (계산서)** + 마이그레이션
- [ ] **Career (사원이력)** + **Salary (인건비)** + 마이그레이션
- [ ] **Weekly (주간보고)** + Meeting 보강 + 마이그레이션

### Phase 5: 부가 기능 (5단계)
- [ ] **Reserve (예약)** — 회의실/차량 + 마이그레이션
- [ ] **Certificate (증명서)** + **Consult (상담)** + 마이그레이션
- [ ] **Credential (기술자파일)** + **DocRegister (문서대장)** + 마이그레이션
- [ ] 기존 △ 모듈 보강 (Daily, Schedule, Vacation, Design 등) + 마이그레이션

### Phase 6: 데이터 마이그레이션 최종 검증 + 전환 (6단계)
- [ ] 전체 테이블 건수 대사 (원본 MySQL vs 이관 PostgreSQL)
- [ ] FK 참조 무결성 전수 검증
- [ ] 물리 파일(첨부파일) 이동 및 경로 매핑
- [ ] 사용자 인수 테스트 (UAT)
- [ ] 병행 운영 기간 → 완전 전환

---

## 7. hanmam 모듈별 상세 기능 목록

### 7.1 Call (업무연락) — 핵심 모듈

| 기능 | 상세 |
|------|------|
| 목록 뷰 | 전체/미확인/할일/내가작성/관심/종료 6종 필터 |
| 작성 | 제목, 내용, 수신자, 프로젝트 연결, 요청일, 업무유형, 첨부파일 |
| 수신자 관리 | 수신자 추가/삭제, 순서 변경, 완료 처리 |
| 상태 관리 | 진행중(1)/종료(3)/삭제(-1), 담당자 변경 |
| 관심 등록 | 개인 관심 워크리스트 (CallBoard) |
| 통계 | 관리자 대시보드, 사용자별 응답 통계 |
| 복사 | 기존 업무연락 복사하여 새로 작성 |
| 프로젝트 연결 | 프로젝트 변경 가능 |

### 7.2 Doc (전자결재) — 핵심 모듈

| 기능 | 상세 |
|------|------|
| 양식 관리 | 결재 양식 템플릿 (결재선 정의 포함) |
| 문서 작성 | 양식 기반 작성, 재상신, 보고서 작성 |
| 결재선 | 양식 템플릿에서 자동 생성, 순차 승인 |
| 승인/반려 | 코멘트 포함 승인/반려 |
| 참조자 | 참조자 추가/삭제 |
| 문서 목록 | 내 문서/결재 대기/진행 중 3종 |
| 예산 변경 | 지출 시점 변경 보고서 |
| 연동 | 승인 시 휴가/지출/매출 자동 등록 |

### 7.3 경영관리 모듈 관계도

```
                    ┌─────────────┐
                    │  계정과목    │ ◄── 계층형 트리
                    │  (Account)  │
                    └──────┬──────┘
                           │ ACC_CODE 참조
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  매출     │     │  지출     │     │  예산     │
  │ (Sales)  │     │(Expense) │     │ (Budget) │
  └────┬─────┘     └────┬─────┘     └──────────┘
       │                │
       │ SALES_NO       │ EXPENSE_NO
       ▼                ▼
  ┌──────────┐     ┌──────────────┐
  │ 세금계산서 │     │  자금매칭     │
  │(Invoice) │     │ (BankLink)   │
  └──────────┘     └──────┬───────┘
                          │
                    ┌─────┴──────┐
                    │ 입출금내역   │ ◄── Excel 업로드
                    │ (BankInout) │
                    └─────┬──────┘
                          │
                    ┌─────┴──────┐
                    │  통장관리    │
                    │ (BankBook) │
                    └────────────┘

  ┌──────────┐     ┌──────────┐
  │  계약     │────►│  상품     │
  │(Contract)│     │(Product) │
  └────┬─────┘     └──────────┘
       │
       ├── SALES_AUTO ──► 매출 자동 생성
       └── INVOICE_AUTO ► 세금계산서 자동 생성

  ┌──────────┐
  │ 법인카드   │ ◄── Excel 업로드
  │  (Card)  │
  └────┬─────┘
       │
       ├── 카드사 마스터 (CardComp)
       ├── 사용내역 (CardSpend) → 지출 연결
       └── 업로드 이력 (CardUpload)

  ┌──────────┐
  │ 사내거래   │ ◄── 법인간 매출/매입/인건비
  │ (Trade)  │
  └──────────┘

  ┌──────────┐
  │ 경영성과   │ ◄── 매출/지출/인건비/예산 종합 분석
  │  (Biz)   │     다단계(회사→조직→사업→프로젝트)
  └──────────┘
```

---

## 8. 기술적 전환 포인트

| hanmam 패턴 | AMB 전환 방향 |
|-------------|--------------|
| Command 패턴 (`formVO.getCommand()`) | RESTful 엔드포인트 분리 (`GET/POST/PUT/DELETE`) |
| MyBatis XML SQL 매퍼 | TypeORM Entity + QueryBuilder |
| Apache Tiles (SSR) | React SPA + API 호출 |
| Session 기반 인증 | JWT + httpOnly Cookie |
| `DEL_YN` soft delete | `xxx_deleted_at` timestamp |
| 정수 PK (`AUTO_INCREMENT`) | UUID PK |
| jQuery AJAX | Axios + React Query |
| 비트필드 권한 | Feature Permission 테이블 |
| 단일 회사 | `ent_id` 기반 다법인 격리 |
| `tbl_file` 중앙 파일 | AMB Drive 모듈 연동 |
| 한국어 고정 | i18n 다국어 지원 |
