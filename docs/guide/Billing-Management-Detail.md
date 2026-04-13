# Amoeba KMS -- 계약/거래처 관리(Billing) 모듈 상세 설명서

> **문서 버전**: v1.0
> **최종 수정일**: 2026-02-18
> **대상 모듈**: `apps/api/src/domain/billing/`, `apps/web/src/domain/billing/`, `packages/types/`

---

## 목차

1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [데이터 모델](#3-데이터-모델)
4. [핵심 프로세스](#4-핵심-프로세스)
5. [API 엔드포인트](#5-api-엔드포인트)
6. [백엔드 서비스](#6-백엔드-서비스)
7. [프론트엔드 구성](#7-프론트엔드-구성)
8. [에러 코드](#8-에러-코드)
9. [다국어 지원 (i18n)](#9-다국어-지원-i18n)
10. [보안 및 접근 제어](#10-보안-및-접근-제어)
11. [자동화 및 외부 연동](#11-자동화-및-외부-연동)

---

## 1. 개요

### 1.1 모듈의 목적과 핵심 가치

계약/거래처 관리(Billing) 모듈은 AMB Management 시스템의 **수익·비용 관리 핵심 도메인**으로서, 거래처 등록부터 계약 체결, 인보이스 발행, 결제 추적, 보고서 생성까지의 **전체 매출/매입 라이프사이클을 통합 관리**한다.

**핵심 가치:**

| 가치 | 설명 |
|------|------|
| **거래처 통합 관리** | CLIENT, AFFILIATE, PARTNER, OUTSOURCING, GENERAL_AFFAIRS 5가지 유형의 거래처를 단일 시스템에서 관리 |
| **계약 라이프사이클** | DRAFT → ACTIVE → EXPIRING → RENEWED/EXPIRED/TERMINATED 상태 전이와 자동 갱신 |
| **자동 청구서 생성** | FIXED 계약의 월별 청구서를 billingDay 기준으로 자동 생성 (Cron Job) |
| **다단계 승인 워크플로우** | 청구서 검토(REVIEW) → 매니저 승인 → 관리자 최종 승인의 4단계 프로세스 |
| **대시보드 & 리포트** | 매출/비용 요약, 미수금/미지급 현황, 계약 타임라인, 월별 매트릭스 등 12종 리포트 |
| **Google Drive 연동** | 계약 문서, 인보이스 PDF의 자동 Google Drive 저장 및 미리보기 |

### 1.2 주요 기능 요약

```
  ┌──────────────────────────────────────────────────────────────────┐
  │              계약/거래처 관리(Billing) 모듈 기능 맵                │
  │                                                                  │
  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐      │
  │  │  거래처 관리   │  │  계약 관리     │  │  SOW 관리          │      │
  │  │              │  │              │  │                   │      │
  │  │ - 거래처 CRUD │  │ - 계약 CRUD  │  │ - SOW CRUD        │      │
  │  │ - 5가지 유형  │  │ - 마일스톤    │  │ - 용역기간 관리    │      │
  │  │ - 연락처 관리  │  │ - 자동 갱신   │  │ - 상태 관리        │      │
  │  │ - GDrive 연동 │  │ - 변경이력    │  │                   │      │
  │  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘      │
  │         │                 │                     │                │
  │         └────────────┬────┴─────────────────────┘                │
  │                      │                                           │
  │  ┌──────────────────────────────────────────────┐               │
  │  │              인보이스 관리                      │               │
  │  │                                              │               │
  │  │  - 청구서 CRUD (RECEIVABLE / PAYABLE)        │               │
  │  │  - 자동 번호 생성 (ENT_CUR_YYYY_MM_SEQ)     │               │
  │  │  - 품목(Items) 관리                          │               │
  │  │  - 4단계 승인 워크플로우                      │               │
  │  │  - PDF 생성 & 이메일 발송                    │               │
  │  │  - 무효화 & 재발급                           │               │
  │  │  - 세금계산서 관리 (HOMETAX / SYSTEM)        │               │
  │  └──────────────────────┬───────────────────────┘               │
  │                         │                                        │
  │  ┌──────────────┐      │      ┌──────────────────────┐         │
  │  │  결제 관리     │      │      │  문서 관리              │         │
  │  │              │      │      │                      │         │
  │  │ - 결제 등록   │◄─────┘      │ - Google Drive 업로드 │         │
  │  │ - 미수금/미지급│             │ - 미리보기/다운로드    │         │
  │  │ - 결제 취소   │             │ - URL 문서 추가       │         │
  │  └──────────────┘             └──────────────────────┘         │
  │                                                                  │
  │  ┌──────────────────────────────────────────────┐               │
  │  │              자동화 & 대시보드                   │               │
  │  │                                              │               │
  │  │  - FIXED 계약 자동 청구서 생성                 │               │
  │  │  - 만료 임박 계약 알림                         │               │
  │  │  - 미발행 청구서 경고                          │               │
  │  │  - 대시보드 요약/차트/매트릭스                  │               │
  │  │  - 12종 보고서 (Excel 내보내기)               │               │
  │  └──────────────────────────────────────────────┘               │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 2. 시스템 아키텍처

### 2.1 모듈 구조도

```
+------------------------------------------------------------------+
|                      사용자 (브라우저)                               |
+------------------------------------------------------------------+
         |                    |                     |
         | HTTP (5179)       | HTTP (5179)         | HTTP (5179)
         v                    v                     v
+------------------+  +------------------+  +-------------------+
| BillingDashboard |  | ContractList/    |  | InvoiceList/      |
| PartnerList/     |  | ContractDetail   |  | InvoiceDetail     |
| PartnerDetail    |  | SowList/Detail   |  | PaymentList       |
+--------+---------+  +--------+---------+  +---------+---------+
         |                      |                      |
         | REST API (3009/api/v1/billing)               |
         v                      v                      v
+------------------------------------------------------------------+
|                    NestJS Backend (API)                            |
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  | PartnerCtrl      |  | ContractCtrl     |  | InvoiceCtrl      | |
|  | (5 endpoints)    |  | (8 endpoints)    |  | (13 endpoints)   | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
|  | SowCtrl (5)      |  | PaymentCtrl (5)  |  | DocumentCtrl (6) | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
|  | AutomationCtrl   |  | ReportCtrl       |                      |
|  | (5 endpoints)    |  | (12 endpoints)   |                      |
|  +--------+---------+  +--------+---------+                      |
|           |                      |                                |
|  +--------v---------+  +--------v---------+                      |
|  | PartnerService   |  | ContractService  |  InvoiceService      |
|  | SowService       |  | PaymentService   |  InvoiceApprovalSvc  |
|  | BillingAutoSvc   |  | BillingReportSvc |  InvoicePdfSvc       |
|  | DocumentService  |  | InvoiceEmailSvc  |  InvoiceTodoSvc      |
|  +--------+---------+  +--------+---------+  InvoiceNumberingSvc |
+------------------------------------------------------------------+
            |                      |                      |
            v                      v                      v
+------------------------------------------------------------------+
|                PostgreSQL 15 (TypeORM)                             |
|                                                                    |
|  amb_bil_partners              amb_bil_invoices                    |
|  amb_bil_contracts             amb_bil_invoice_items               |
|  amb_bil_contract_milestones   amb_bil_payments                   |
|  amb_bil_contract_history      amb_bil_documents                  |
|  amb_bil_sow                                                      |
+------------------------------------------------------------------+
            |
            v
+------------------------------------------------------------------+
|  외부 서비스                                                       |
|  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐         |
|  │ Google Drive │  │ Google Sheets│  │ Postal Mail     │         |
|  │ (문서 저장)  │  │ (사용량 추적) │  │ (이메일 발송)    │         |
|  └─────────────┘  └──────────────┘  └─────────────────┘         |
+------------------------------------------------------------------+
```

### 2.2 파일 구조

```
apps/api/src/domain/billing/
├── billing.module.ts                          # 모듈 정의
├── controller/
│   ├── partner.controller.ts                  # 거래처 (5 endpoints)
│   ├── contract.controller.ts                 # 계약 (8 endpoints)
│   ├── sow.controller.ts                      # SOW (5 endpoints)
│   ├── invoice.controller.ts                  # 인보이스 (13 endpoints)
│   ├── payment.controller.ts                  # 결제 (5 endpoints)
│   ├── billing-document.controller.ts         # 문서 (6 endpoints)
│   ├── billing-automation.controller.ts       # 자동화 (5 endpoints)
│   └── billing-report.controller.ts           # 보고서 (12 endpoints)
├── entity/
│   ├── partner.entity.ts
│   ├── contract.entity.ts
│   ├── contract-milestone.entity.ts
│   ├── contract-history.entity.ts
│   ├── sow.entity.ts
│   ├── invoice.entity.ts
│   ├── invoice-item.entity.ts
│   ├── payment.entity.ts
│   └── document.entity.ts
├── dto/request/
│   ├── create-partner.request.ts
│   ├── update-partner.request.ts
│   ├── create-contract.request.ts
│   ├── update-contract.request.ts
│   ├── create-sow.request.ts
│   ├── update-sow.request.ts
│   ├── create-invoice.request.ts
│   ├── update-invoice.request.ts
│   ├── send-invoice-email.request.ts
│   ├── create-payment.request.ts
│   └── generate-invoices.request.ts
└── service/
    ├── partner.service.ts
    ├── contract.service.ts
    ├── sow.service.ts
    ├── invoice.service.ts
    ├── invoice-approval.service.ts
    ├── invoice-numbering.service.ts
    ├── invoice-pdf.service.ts
    ├── invoice-email.service.ts
    ├── invoice-todo.service.ts
    ├── payment.service.ts
    ├── billing-document.service.ts
    ├── billing-automation.service.ts
    ├── billing-report.service.ts
    ├── work-report.service.ts
    └── partner-seed.service.ts

apps/web/src/domain/billing/
├── pages/
│   ├── BillingLayout.tsx
│   ├── BillingDashboardPage.tsx
│   ├── PartnerListPage.tsx
│   ├── PartnerDetailPage.tsx
│   ├── ContractListPage.tsx
│   ├── ContractDetailPage.tsx
│   ├── SowListPage.tsx
│   ├── SowDetailPage.tsx
│   ├── InvoiceListPage.tsx
│   ├── InvoiceDetailPage.tsx
│   └── PaymentListPage.tsx
├── components/
│   ├── partner/
│   │   ├── PartnerBasicInfoTab.tsx
│   │   ├── PartnerContractsTab.tsx
│   │   ├── PartnerInvoicesTab.tsx
│   │   └── PartnerSowTab.tsx
│   ├── contract/
│   │   ├── ContractStatusBadge.tsx
│   │   ├── ContractHistoryLog.tsx
│   │   └── MilestoneEditor.tsx
│   ├── invoice/
│   │   ├── InvoiceStatusBadge.tsx
│   │   ├── InvoiceItemsEditor.tsx
│   │   ├── InvoiceApprovalActions.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── SendEmailModal.tsx
│   │   └── BulkGenerateModal.tsx
│   ├── dashboard/
│   │   ├── BillingCalendar.tsx
│   │   ├── OverdueBillingAlert.tsx
│   │   ├── MonthlyFeeMatrix.tsx
│   │   └── TaxInvoiceHistory.tsx
│   └── common/
│       ├── DocumentManager.tsx
│       └── FilePreviewModal.tsx
├── hooks/
│   ├── usePartner.ts
│   ├── useContract.ts
│   ├── useSow.ts
│   ├── useInvoice.ts
│   ├── useInvoiceApproval.ts
│   ├── usePayment.ts
│   ├── useDocument.ts
│   └── useBillingReport.ts
└── service/
    ├── partner.service.ts
    ├── contract.service.ts
    ├── sow.service.ts
    ├── invoice.service.ts
    ├── payment.service.ts
    ├── document.service.ts
    └── billing-report.service.ts
```

---

## 3. 데이터 모델

### 3.1 ER 다이어그램 (개념)

```
                    ┌──────────────────┐
                    │  amb_hr_entities  │
                    │  (법인)           │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────────────────┐
              │              │                           │
              v              v                           v
  ┌──────────────────┐  ┌────────────────┐  ┌────────────────────┐
  │ amb_bil_partners │  │ amb_bil_       │  │ amb_bil_invoices    │
  │ (거래처)          │  │ contracts      │  │ (청구서)             │
  │                  │  │ (계약)          │  │                    │
  └──────┬───────────┘  └───┬──────┬─────┘  └──┬─────────┬──────┘
         │                  │      │            │         │
         │                  │      │            │         v
         │                  │      v            │  ┌──────────────┐
         │                  │  ┌───────────┐   │  │amb_bil_      │
         │                  │  │amb_bil_   │   │  │invoice_items │
         │                  │  │contract_  │   │  │(청구서 품목)   │
         │                  │  │milestones │   │  └──────────────┘
         │                  │  └───────────┘   │
         │                  │                   v
         │                  │  ┌───────────┐  ┌──────────────┐
         │                  │  │amb_bil_   │  │amb_bil_      │
         │                  │  │contract_  │  │payments      │
         │                  │  │history    │  │(결제)         │
         │                  │  │(변경이력)  │  └──────────────┘
         │                  │  └───────────┘
         │                  │
         │                  v
         │           ┌──────────────┐
         │           │ amb_bil_sow  │
         │           │ (SOW)        │
         │           └──────────────┘
         │
         │           ┌──────────────────┐
         └──────────→│ amb_bil_documents│
                     │ (문서)            │
                     └──────────────────┘
```

### 3.2 테이블 상세

#### 3.2.1 `amb_bil_partners` (거래처)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `ptn_id` | UUID | PK | 거래처 ID |
| `ent_id` | UUID | FK → hr_entities | 법인 ID |
| `ptn_code` | VARCHAR(20) | NOT NULL | 거래처 코드 |
| `ptn_type` | VARCHAR(20) | NOT NULL | 유형 |
| `ptn_company_name` | VARCHAR(200) | NOT NULL | 회사명 |
| `ptn_company_name_local` | VARCHAR(200) | NULL | 현지 회사명 |
| `ptn_country` | VARCHAR(10) | NULL | 국가 |
| `ptn_contact_name` | VARCHAR(100) | NULL | 담당자명 |
| `ptn_contact_email` | VARCHAR(100) | NULL | 담당자 이메일 |
| `ptn_contact_phone` | VARCHAR(20) | NULL | 담당자 전화 |
| `ptn_address` | TEXT | NULL | 주소 |
| `ptn_tax_id` | VARCHAR(50) | NULL | 사업자번호 |
| `ptn_biz_type` | VARCHAR(100) | NULL | 업태 |
| `ptn_biz_category` | VARCHAR(100) | NULL | 종목 |
| `ptn_ceo_name` | VARCHAR(100) | NULL | 대표자명 |
| `ptn_default_currency` | VARCHAR(3) | DEFAULT 'USD' | 기본 통화 |
| `ptn_payment_terms` | INT | DEFAULT 30 | 결제 조건 (일) |
| `ptn_status` | VARCHAR(10) | DEFAULT 'ACTIVE' | 상태 |
| `ptn_cross_entity_ref` | VARCHAR(50) | NULL | 법인간 참조 |
| `ptn_gdrive_folder_id` | VARCHAR(100) | NULL | Google Drive 폴더 ID |
| `ptn_note` | TEXT | NULL | 메모 |
| `ptn_created_at` | TIMESTAMP | - | 생성일시 |
| `ptn_updated_at` | TIMESTAMP | - | 수정일시 |
| `ptn_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**거래처 유형:**

| 유형 | 코드 | 설명 |
|------|------|------|
| 고객사 | `CLIENT` | 매출 발생 거래처 |
| 계열사 | `AFFILIATE` | 그룹 내 계열사 |
| 파트너 | `PARTNER` | 협력 파트너 |
| 외주 | `OUTSOURCING` | 외주/하청 업체 |
| 총무 | `GENERAL_AFFAIRS` | 총무 관련 거래처 |

**거래처 상태:**

| 상태 | 코드 | 설명 |
|------|------|------|
| 활성 | `ACTIVE` | 거래 진행 중 |
| 비활성 | `INACTIVE` | 거래 중단 |
| 잠재 | `PROSPECT` | 잠재 거래처 |

#### 3.2.2 `amb_bil_contracts` (계약)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `ctr_id` | UUID | PK | 계약 ID |
| `ent_id` | UUID | FK | 법인 ID |
| `ptn_id` | UUID | FK → partners | 거래처 ID |
| `ctr_direction` | VARCHAR(20) | NOT NULL | 방향 (RECEIVABLE/PAYABLE) |
| `ctr_category` | VARCHAR(30) | NOT NULL | 카테고리 |
| `ctr_type` | VARCHAR(20) | NOT NULL | 계약 유형 |
| `ctr_title` | VARCHAR(200) | NOT NULL | 계약명 |
| `ctr_description` | TEXT | NULL | 설명 |
| `ctr_start_date` | DATE | NOT NULL | 계약 시작일 |
| `ctr_end_date` | DATE | NULL | 계약 종료일 |
| `ctr_amount` | DECIMAL(15,2) | DEFAULT 0 | 계약 금액 |
| `ctr_currency` | VARCHAR(3) | DEFAULT 'USD' | 통화 |
| `ctr_status` | VARCHAR(20) | DEFAULT 'DRAFT' | 상태 |
| `ctr_auto_renew` | BOOLEAN | DEFAULT false | 자동 갱신 여부 |
| `ctr_billing_day` | INT | NULL | 청구일 (1~31) |
| `ctr_billing_period` | VARCHAR(20) | NULL | 청구 주기 |
| `ctr_auto_generate` | BOOLEAN | DEFAULT false | 청구서 자동 생성 |
| `ctr_unit_price` | DECIMAL(15,2) | NULL | 단가 (사용량 기반) |
| `ctr_unit_desc` | VARCHAR(100) | NULL | 단위 설명 |
| `ctr_predecessor_id` | UUID | NULL | 선행 계약 ID (갱신 시) |
| `ctr_gdrive_folder_id` | VARCHAR(100) | NULL | Google Drive 폴더 |
| `ctr_note` | TEXT | NULL | 메모 |
| `ctr_gsheet_url` | TEXT | NULL | Google Sheet URL |
| `ctr_gsheet_tab_pattern` | VARCHAR(50) | NULL | Sheet 탭 패턴 |
| `ctr_assigned_user_id` | UUID | NULL | 담당자 ID |
| `ctr_created_at` | TIMESTAMP | - | 생성일시 |
| `ctr_updated_at` | TIMESTAMP | - | 수정일시 |
| `ctr_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**계약 방향:**

| 방향 | 코드 | 설명 |
|------|------|------|
| 매출 | `RECEIVABLE` | 우리가 청구하는 계약 (매출) |
| 매입 | `PAYABLE` | 우리가 지급하는 계약 (비용) |

**계약 카테고리:**

| 카테고리 | 코드 | 설명 |
|----------|------|------|
| 기술 BPO | `TECH_BPO` | 기술 기반 비즈니스 프로세스 아웃소싱 |
| SI 개발 | `SI_DEV` | 시스템 통합 / 소프트웨어 개발 |
| 유지보수 | `MAINTENANCE` | 시스템 유지보수 |
| 컨설팅 | `CONSULTING` | 컨설팅 서비스 |
| 임대 | `RENTAL` | 장비/공간 임대 |
| 기타 | `OTHER` | 기타 계약 |

**계약 유형:**

| 유형 | 코드 | 설명 | 청구 방식 |
|------|------|------|----------|
| 정액 | `FIXED` | 월정액 계약 | 매월 동일 금액 자동 생성 |
| 사용량 | `USAGE_BASED` | 사용량 기반 | 수량 입력 후 생성 |
| 마일스톤 | `MILESTONE` | 단계별 지급 | 마일스톤 완료 시 |
| 단발 | `AD_HOC` | 일회성 계약 | 수동 생성 |

**계약 상태 전이:**

```
DRAFT ──→ ACTIVE ──→ EXPIRING ──→ EXPIRED
  │          │          │            │
  │          │          │            └──→ RENEWED (재계약)
  │          │          │
  │          │          └──→ RENEWED (재계약)
  │          │          └──→ TERMINATED (해지)
  │          │          └──→ LIQUIDATED (청산)
  │          │
  │          └──→ TERMINATED (해지)
  │          └──→ LIQUIDATED (청산)
  │
  └──→ TERMINATED (해지)
```

#### 3.2.3 `amb_bil_contract_milestones` (계약 마일스톤)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `mst_id` | UUID | PK | 마일스톤 ID |
| `ctr_id` | UUID | FK → contracts | 계약 ID |
| `mst_seq` | INT | NOT NULL | 순서 |
| `mst_label` | VARCHAR(200) | NOT NULL | 마일스톤명 |
| `mst_percentage` | DECIMAL(5,2) | DEFAULT 0 | 비율 (%) |
| `mst_amount` | DECIMAL(15,2) | DEFAULT 0 | 금액 |
| `mst_due_date` | DATE | NULL | 예정일 |
| `mst_status` | VARCHAR(20) | DEFAULT 'PENDING' | 상태 (PENDING/COMPLETED) |

#### 3.2.4 `amb_bil_contract_history` (계약 변경이력)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `cth_id` | UUID | PK | 이력 ID |
| `ctr_id` | UUID | FK → contracts | 계약 ID |
| `cth_field` | VARCHAR(50) | NOT NULL | 변경 필드명 |
| `cth_old_value` | TEXT | NULL | 변경 전 값 |
| `cth_new_value` | TEXT | NULL | 변경 후 값 |
| `cth_changed_by` | UUID | NOT NULL | 변경자 ID |
| `cth_changed_at` | TIMESTAMP | NOT NULL | 변경 일시 |

#### 3.2.5 `amb_bil_sow` (SOW)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `sow_id` | UUID | PK | SOW ID |
| `ctr_id` | UUID | FK → contracts | 계약 ID |
| `ent_id` | UUID | FK | 법인 ID |
| `sow_title` | VARCHAR(200) | NOT NULL | SOW명 |
| `sow_description` | TEXT | NULL | 설명 |
| `sow_period_start` | DATE | NOT NULL | 용역 시작일 |
| `sow_period_end` | DATE | NOT NULL | 용역 종료일 |
| `sow_amount` | DECIMAL(15,2) | DEFAULT 0 | 금액 |
| `sow_currency` | VARCHAR(3) | DEFAULT 'USD' | 통화 |
| `sow_status` | VARCHAR(20) | DEFAULT 'DRAFT' | 상태 |
| `sow_note` | TEXT | NULL | 메모 |
| `sow_created_at` | TIMESTAMP | - | 생성일시 |
| `sow_updated_at` | TIMESTAMP | - | 수정일시 |
| `sow_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**SOW 상태 전이:**

```
DRAFT → SIGNED → IN_PROGRESS → COMPLETED → ACCEPTED
```

#### 3.2.6 `amb_bil_invoices` (청구서)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `inv_id` | UUID | PK | 청구서 ID |
| `ent_id` | UUID | FK | 법인 ID |
| `ptn_id` | UUID | FK → partners | 거래처 ID |
| `ctr_id` | UUID | FK → contracts, NULL | 계약 ID |
| `sow_id` | UUID | FK, NULL | SOW ID |
| `inv_number` | VARCHAR(50) | NOT NULL | 청구서 번호 |
| `inv_direction` | VARCHAR(20) | NOT NULL | 방향 (RECEIVABLE/PAYABLE) |
| `inv_date` | DATE | NOT NULL | 청구일 |
| `inv_due_date` | DATE | NULL | 납기일 |
| `inv_service_period_start` | DATE | NULL | 용역기간 시작 |
| `inv_service_period_end` | DATE | NULL | 용역기간 종료 |
| **금액** | | | |
| `inv_subtotal` | DECIMAL(15,2) | DEFAULT 0 | 공급가액 |
| `inv_tax_rate` | DECIMAL(5,2) | DEFAULT 0 | 세율 (%) |
| `inv_tax_amount` | DECIMAL(15,2) | DEFAULT 0 | 세액 |
| `inv_total` | DECIMAL(15,2) | DEFAULT 0 | 합계 |
| `inv_currency` | VARCHAR(3) | NOT NULL | 통화 |
| **상태** | | | |
| `inv_status` | VARCHAR(20) | DEFAULT 'DRAFT' | 청구서 상태 |
| `inv_paid_amount` | DECIMAL(15,2) | DEFAULT 0 | 결제완료 금액 |
| `inv_paid_date` | DATE | NULL | 결제 완료일 |
| **세금계산서** | | | |
| `inv_internal_code` | VARCHAR(50) | NULL | 내부 관리 코드 |
| `inv_tax_invoice_type` | VARCHAR(20) | NULL | 세금계산서 유형 |
| **승인** | | | |
| `inv_approval_status` | VARCHAR(30) | DEFAULT 'NONE' | 승인 상태 |
| `inv_reviewer_id` | UUID | NULL | 검토자 |
| `inv_reviewed_at` | TIMESTAMP | NULL | 검토일시 |
| `inv_approver_manager_id` | UUID | NULL | 매니저 승인자 |
| `inv_approved_manager_at` | TIMESTAMP | NULL | 매니저 승인일시 |
| `inv_approver_admin_id` | UUID | NULL | 관리자 승인자 |
| `inv_approved_admin_at` | TIMESTAMP | NULL | 관리자 승인일시 |
| `inv_rejection_reason` | TEXT | NULL | 거절 사유 |
| `inv_gsheet_url` | TEXT | NULL | Google Sheet URL |
| `inv_note` | TEXT | NULL | 메모 |
| `inv_created_at` | TIMESTAMP | - | 생성일시 |
| `inv_updated_at` | TIMESTAMP | - | 수정일시 |
| `inv_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**Relations**: OneToMany → InvoiceItem / ManyToOne → Partner, Contract, HrEntity

**청구서 상태 전이:**

```
DRAFT ──→ ISSUED ──→ SENT ──→ PAID
  │          │         │
  │          │         └──→ OVERDUE ──→ PAID
  │          │         └──→ VOID
  │          │
  │          └──→ PAID
  │          └──→ OVERDUE ──→ PAID
  │          └──→ VOID
  │
  └──→ CANCELLED
```

**불변 상태**: PAID, CANCELLED, VOID (수정 불가)

**승인 상태 전이:**

```
NONE → PENDING_REVIEW → PENDING_APPROVAL → APPROVED_MANAGER → APPROVED_ADMIN
                                    ↑               ↑               ↑
                                    └── REJECTED ───┴───────────────┘
```

**세금계산서 유형:**

| 유형 | 코드 | 설명 |
|------|------|------|
| 홈택스 | `HOMETAX` | 홈택스에서 직접 발행 |
| 시스템 | `SYSTEM` | 시스템 자체 발행 |

#### 3.2.7 `amb_bil_invoice_items` (청구서 품목)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `itm_id` | UUID | PK | 품목 ID |
| `inv_id` | UUID | FK → invoices | 청구서 ID |
| `itm_seq` | INT | NOT NULL | 순서 |
| `itm_description` | VARCHAR(500) | NOT NULL | 품목 설명 |
| `itm_quantity` | DECIMAL(10,2) | DEFAULT 1 | 수량 |
| `itm_unit_price` | DECIMAL(15,2) | NOT NULL | 단가 |
| `itm_amount` | DECIMAL(15,2) | NOT NULL | 금액 |

#### 3.2.8 `amb_bil_payments` (결제)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `pay_id` | UUID | PK | 결제 ID |
| `ent_id` | UUID | FK | 법인 ID |
| `inv_id` | UUID | FK → invoices | 청구서 ID |
| `pay_amount` | DECIMAL(15,2) | NOT NULL | 결제액 |
| `pay_currency` | VARCHAR(3) | NOT NULL | 통화 |
| `pay_date` | DATE | NOT NULL | 결제일 |
| `pay_method` | VARCHAR(30) | DEFAULT 'BANK_TRANSFER' | 결제 방법 |
| `pay_reference` | VARCHAR(100) | NULL | 참조번호 |
| `pay_note` | TEXT | NULL | 메모 |
| `pay_created_at` | TIMESTAMP | - | 생성일시 |
| `pay_updated_at` | TIMESTAMP | - | 수정일시 |
| `pay_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**결제 방법:**

| 방법 | 코드 | 설명 |
|------|------|------|
| 은행 송금 | `BANK_TRANSFER` | 계좌이체 (기본값) |
| 현금 | `CASH` | 현금 결제 |
| 수표 | `CHECK` | 수표 결제 |
| 카드 | `CARD` | 카드 결제 |
| 기타 | `OTHER` | 기타 방법 |

#### 3.2.9 `amb_bil_documents` (문서)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `doc_id` | UUID | PK | 문서 ID |
| `ent_id` | UUID | FK | 법인 ID |
| `doc_ref_type` | VARCHAR(20) | NOT NULL | 참조 유형 |
| `doc_ref_id` | UUID | NOT NULL | 참조 ID |
| `doc_type` | VARCHAR(30) | NOT NULL | 문서 유형 |
| `doc_gdrive_file_id` | VARCHAR(100) | NULL | Google Drive 파일 ID |
| `doc_gdrive_url` | VARCHAR(500) | NULL | Google Drive URL |
| `doc_filename` | VARCHAR(300) | NOT NULL | 파일명 |
| `doc_mime_type` | VARCHAR(50) | NULL | MIME 타입 |
| `doc_file_size` | BIGINT | NULL | 파일 크기 (바이트) |
| `doc_uploaded_by` | UUID | NULL | 업로드자 ID |
| `doc_created_at` | TIMESTAMP | - | 생성일시 |
| `doc_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**참조 유형:**

| 유형 | 코드 | 설명 |
|------|------|------|
| 계약 | `CONTRACT` | 계약 관련 문서 |
| SOW | `SOW` | SOW 관련 문서 |
| 청구서 | `INVOICE` | 청구서 관련 문서 |

**문서 유형:**

| 유형 | 코드 | 설명 |
|------|------|------|
| 서명 계약서 | `SIGNED_CONTRACT` | 서명 완료된 계약서 |
| 부록 | `APPENDIX` | 계약 부록 |
| SOW | `SOW` | SOW 문서 |
| 검수 의사록 | `ACCEPTANCE_MINUTES` | 검수 의사록 |
| 청구서 | `INVOICE` | 청구서 원본 |
| 지급 요청서 | `PAYMENT_REQUEST` | 지급 요청서 |
| 기타 | `OTHER` | 기타 문서 |

---

## 4. 핵심 프로세스

### 4.1 계약 → 청구서 → 결제 전체 플로우

```
  ┌──────────────┐
  │ 거래처 등록    │
  └──────┬───────┘
         │
  ┌──────v───────┐
  │ 계약 체결     │ ←─── 마일스톤 설정 (MILESTONE 유형)
  │ (DRAFT)      │ ←─── 자동 생성 설정 (FIXED 유형)
  └──────┬───────┘
         │ 계약 활성화
  ┌──────v───────┐
  │ 계약 활성     │
  │ (ACTIVE)     │
  └──────┬───────┘
         │
    ┌────┴────────────────────────────────┐
    │                                     │
    v (자동)                              v (수동)
  ┌──────────────┐               ┌──────────────┐
  │ 자동 청구서   │               │ 수동 청구서   │
  │ 생성 (Cron)  │               │ 생성          │
  │              │               │              │
  │ billingDay   │               │ 품목 입력     │
  │ 기준 매월    │               │ 금액 확인     │
  └──────┬───────┘               └──────┬───────┘
         │                              │
         └──────────┬───────────────────┘
                    │
           ┌────────v────────┐
           │ 승인 워크플로우   │
           │                 │
           │ PENDING_REVIEW  │
           │      ↓          │
           │ PENDING_APPROVAL│
           │      ↓          │
           │ APPROVED_MANAGER│
           │      ↓          │
           │ APPROVED_ADMIN  │
           └────────┬────────┘
                    │
           ┌────────v────────┐
           │ 청구서 발행      │
           │ (ISSUED)        │
           │                 │
           │ - PDF 생성      │
           │ - Drive 저장    │
           └────────┬────────┘
                    │
           ┌────────v────────┐
           │ 이메일 발송      │
           │ (SENT)          │
           │                 │
           │ - PDF 첨부      │
           │ - 거래처 이메일  │
           └────────┬────────┘
                    │
           ┌────────v────────┐
           │ 결제 등록        │──→ 부분 결제 가능
           │                 │
           │ paid_amount     │
           │ += payment      │
           └────────┬────────┘
                    │
           ┌────────v────────┐
           │ 결제 완료        │
           │ (PAID)          │
           │                 │
           │ paid >= total   │
           └─────────────────┘
```

### 4.2 자동 청구서 생성 프로세스

```
  Cron Job / 수동 POST /automation/generate
         │
         v
  ┌────────────────────────────────┐
  │ 1. 청구 대상 계약 조회          │
  │    - status = ACTIVE           │
  │    - auto_generate = true      │
  │    - 기간 내 (start ≤ now ≤ end)│
  │    - 해당 월 청구서 미생성       │
  └──────────────┬─────────────────┘
                 │
  ┌──────────────v─────────────────┐
  │ 2. 계약별 청구서 생성           │
  │    - 청구서 번호 자동 생성      │
  │      (ENT_CUR_YYYY_MM_SEQ)    │
  │    - 용역기간 계산              │
  │      (billing_period 기반)     │
  │    - 품목 자동 생성             │
  │      (계약 정보 기반)           │
  └──────────────┬─────────────────┘
                 │
  ┌──────────────v─────────────────┐
  │ 3. 결과 반환                    │
  │    - generated: 생성 건수       │
  │    - skipped: 건너뛴 건수       │
  │    - invoiceIds: 생성된 ID 목록 │
  └────────────────────────────────┘
```

### 4.3 청구서 승인 워크플로우 상세

```
  ┌──────────────────┐
  │  NONE (초기상태)   │
  └────────┬─────────┘
           │ submitForReview()
           v
  ┌──────────────────┐
  │ PENDING_REVIEW   │ ←── 검토자에게 Todo 생성
  │ (검토 대기)       │
  └────────┬─────────┘
           │ approveReview()
           v
  ┌──────────────────┐
  │ PENDING_APPROVAL │ ←── MANAGER 권한자에게 Todo 생성
  │ (승인 대기)       │
  └────────┬─────────┘
           │ approveManager()  [MANAGER 권한 필요]
           v
  ┌──────────────────┐
  │ APPROVED_MANAGER │ ←── ADMIN 권한자에게 Todo 생성
  │ (매니저 승인)     │
  └────────┬─────────┘
           │ approveAdmin()  [ADMIN 권한 필요]
           v
  ┌──────────────────┐
  │ APPROVED_ADMIN   │ ←── 청구서 발행 가능
  │ (최종 승인)       │
  └──────────────────┘

  ※ 모든 단계에서 reject() 가능 → REJECTED 상태
  ※ rejection_reason 기록
```

### 4.4 계약 갱신 프로세스

```
  POST /contracts/:id/renew
           │
           v
  ┌──────────────────────────────┐
  │ 1. 기존 계약 상태 → RENEWED  │
  └──────────────┬───────────────┘
                 │
  ┌──────────────v───────────────┐
  │ 2. 새 계약 생성               │
  │    - start_date = 기존 end  │
  │      + 1일                   │
  │    - predecessor_id = 기존  │
  │      계약 ID                 │
  │    - 기본 정보 복사           │
  │    - 마일스톤/문서는 복제 안함 │
  └──────────────┬───────────────┘
                 │
  ┌──────────────v───────────────┐
  │ 3. 새 계약 반환 (DRAFT)      │
  └──────────────────────────────┘
```

### 4.5 청구서 무효화 및 재발급

```
  POST /invoices/:id/void-reissue
           │
           v
  ┌──────────────────────────────┐
  │ 1. 기존 청구서 상태 → VOID   │
  └──────────────┬───────────────┘
                 │
  ┌──────────────v───────────────┐
  │ 2. 새 청구서 생성 (DRAFT)    │
  │    - 기존 정보 복사           │
  │    - 품목 복사               │
  │    - 새 청구서 번호 부여      │
  └──────────────┬───────────────┘
                 │
  ┌──────────────v───────────────┐
  │ 3. 새 청구서 반환             │
  └──────────────────────────────┘
```

---

## 5. API 엔드포인트

**Base Path**: `/api/v1/billing`

### 5.1 거래처 관리

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| GET | `/partners` | 거래처 목록 | Query: `type`, `status`, `search` |
| GET | `/partners/:id` | 거래처 상세 | - |
| POST | `/partners` | 거래처 등록 | `CreatePartnerRequest` |
| PATCH | `/partners/:id` | 거래처 수정 | `UpdatePartnerRequest` |
| DELETE | `/partners/:id` | 거래처 삭제 | - |

### 5.2 계약 관리

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| GET | `/contracts` | 계약 목록 | Query: `direction`, `category`, `type`, `status`, `partner_id`, `search` |
| GET | `/contracts/expiring` | 만료 임박 계약 | Query: `days` (기본 30) |
| GET | `/contracts/:id` | 계약 상세 | - |
| GET | `/contracts/:id/history` | 계약 변경이력 | - |
| POST | `/contracts` | 계약 등록 | `CreateContractRequest` (마일스톤 포함 가능) |
| PATCH | `/contracts/:id` | 계약 수정 | `UpdateContractRequest` (변경이력 자동 기록) |
| DELETE | `/contracts/:id` | 계약 삭제 | - |
| POST | `/contracts/:id/renew` | 계약 갱신 | - |

### 5.3 SOW 관리

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| GET | `/sow` | SOW 목록 | Query: `status`, `contract_id`, `partner_id`, `search` |
| GET | `/sow/:id` | SOW 상세 | - |
| POST | `/sow` | SOW 등록 | `CreateSowRequest` |
| PATCH | `/sow/:id` | SOW 수정 | `UpdateSowRequest` |
| DELETE | `/sow/:id` | SOW 삭제 | - |

### 5.4 청구서 관리

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| GET | `/invoices` | 청구서 목록 | Query: `status`, `direction`, `search`, `year_month`, `partner_id` |
| GET | `/invoices/:id` | 청구서 상세 | - |
| POST | `/invoices` | 청구서 등록 | `CreateInvoiceRequest` (품목 포함) |
| PATCH | `/invoices/:id` | 청구서 수정 | `UpdateInvoiceRequest` (DRAFT만 가능) |
| DELETE | `/invoices/:id` | 청구서 삭제 | - |
| GET | `/invoices/:id/pdf` | PDF 다운로드 | Query: `save_to_drive` |
| POST | `/invoices/:id/send-email` | 이메일 발송 | `SendInvoiceEmailRequest` |
| POST | `/invoices/:id/void-reissue` | 무효화 + 재발급 | - |
| POST | `/invoices/:id/submit-review` | 검토 요청 | - |
| POST | `/invoices/:id/approve-review` | 검토 승인 | - |
| POST | `/invoices/:id/approve-manager` | 매니저 승인 | MANAGER 권한 |
| POST | `/invoices/:id/approve-admin` | 최종 승인 | ADMIN 권한 |
| POST | `/invoices/:id/reject` | 거절 | `{ reason: string }` |

### 5.5 결제 관리

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| GET | `/payments` | 결제 목록 | Query: `invoice_id`, `direction`, `search`, `year_month` |
| GET | `/payments/by-invoice/:invoiceId` | 청구서별 결제 | - |
| GET | `/payments/outstanding` | 미수금/미지급 현황 | - |
| POST | `/payments` | 결제 등록 | `CreatePaymentRequest` |
| DELETE | `/payments/:id` | 결제 취소 | - |

### 5.6 문서 관리

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| GET | `/documents` | 문서 목록 | Query: `ref_type`, `ref_id` |
| GET | `/documents/:id/preview` | 문서 미리보기 | - |
| GET | `/documents/:id/download` | 문서 다운로드 | - |
| POST | `/documents/upload` | 파일 업로드 | FormData: `file`, `ref_type`, `ref_id`, `doc_type`, `partner_id` |
| POST | `/documents/url` | URL 문서 추가 | `{ ref_type, ref_id, doc_type, filename, url }` |
| DELETE | `/documents/:id` | 문서 삭제 | - |

### 5.7 자동화

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/automation/due-contracts` | 이번 달 청구 대상 계약 |
| GET | `/automation/usage-based` | 사용량 기반 입력 대기 |
| GET | `/automation/billing-calendar` | 월별 청구 일정 |
| GET | `/automation/overdue-billings` | 미발행 청구서 경고 |
| POST | `/automation/generate` | FIXED 계약 청구서 일괄 생성 |

### 5.8 보고서

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/reports/summary` | 대시보드 요약 카드 |
| GET | `/reports/revenue` | 월별 매출/비용 요약 |
| GET | `/reports/outstanding` | 미수금/미지급 상세 |
| GET | `/reports/contract-timeline` | 계약 만료 타임라인 |
| GET | `/reports/partner-distribution` | 거래처 유형별 분포 |
| GET | `/reports/category-breakdown` | 카테고리별 계약 현황 |
| GET | `/reports/monthly-matrix` | 월별 청구 금액 매트릭스 |
| GET | `/reports/tax-invoices` | 세금계산서 발행 이력 |
| GET | `/reports/consolidated` | 법인간 통합 조회 |
| GET | `/reports/export/invoices` | 청구서 Excel 내보내기 |
| GET | `/reports/export/monthly-matrix` | 월별 매트릭스 Excel |
| GET | `/reports/export/tax-invoices` | 세금계산서 Excel |

---

## 6. 백엔드 서비스

### 6.1 서비스 목록

| 서비스 | 설명 |
|--------|------|
| **PartnerService** | 거래처 CRUD, 코드 중복 검증 |
| **ContractService** | 계약 CRUD, 상태 전이, 마일스톤, 변경이력, 갱신 |
| **SowService** | SOW CRUD, 상태 전이 |
| **InvoiceService** | 청구서 CRUD, 상태 전이, 무효화+재발급 |
| **InvoiceApprovalService** | 4단계 승인 워크플로우 관리 |
| **InvoiceNumberingService** | 청구서 번호 자동 생성 |
| **InvoicePdfService** | 청구서 PDF 생성, Google Drive 저장 |
| **InvoiceEmailService** | 청구서 이메일 발송 (PDF 첨부) |
| **InvoiceTodoService** | 승인 워크플로우 관련 Todo 생성 |
| **PaymentService** | 결제 등록/취소, 미수금 현황 |
| **BillingDocumentService** | 문서 업로드/다운로드, Google Drive 연동 |
| **BillingAutomationService** | 자동 청구서 생성, 청구 대상 조회 |
| **BillingReportService** | 12종 보고서 생성 (JSON/Excel) |
| **WorkReportService** | 근무 보고서 관리 |
| **PartnerSeedService** | 초기 데이터 시딩 |

### 6.2 ContractService 상세

```typescript
// 상태 전환 규칙
const VALID_TRANSITIONS = {
  DRAFT:    ['ACTIVE', 'TERMINATED'],
  ACTIVE:   ['EXPIRING', 'RENEWED', 'TERMINATED', 'LIQUIDATED'],
  EXPIRING: ['RENEWED', 'EXPIRED', 'TERMINATED', 'LIQUIDATED'],
  EXPIRED:  ['RENEWED'],
};

// 계약 수정 시 변경이력 자동 기록
update(id, dto, entityId, userId):
  1. 기존 계약 조회
  2. 변경된 필드 감지
  3. 각 변경 필드에 대해 ContractHistory 생성
     { field, old_value, new_value, changed_by, changed_at }
  4. 계약 엔티티 업데이트

// 계약 갱신
renewContract(id, entityId):
  1. 기존 계약 → status = RENEWED
  2. 새 계약 생성
     - start_date = 기존 end_date + 1일
     - predecessor_id = 기존 계약 ID
     - 마일스톤/문서 복제 안함
  3. 새 계약 반환
```

### 6.3 InvoiceService 상세

```typescript
// 상태 전환 규칙
const VALID_TRANSITIONS = {
  DRAFT:     ['ISSUED', 'CANCELLED'],
  ISSUED:    ['SENT', 'PAID', 'OVERDUE', 'VOID'],
  SENT:      ['PAID', 'OVERDUE', 'VOID'],
  OVERDUE:   ['PAID', 'VOID'],
};

// 불변 상태 (수정 불가)
const IMMUTABLE_STATUSES = ['PAID', 'CANCELLED', 'VOID'];

// 청구서 생성
create(dto, entityId):
  1. 청구서 번호 자동 생성 (InvoiceNumberingService)
  2. Invoice 엔티티 생성
  3. 품목(items) 일괄 생성
  4. Eager loading으로 반환

// 무효화 + 재발급
voidAndReissue(id, entityId):
  1. 기존 청구서 → status = VOID
  2. 새 청구서 생성 (DRAFT)
     - 기존 정보 복사
     - 기존 품목 복사
     - 새 번호 부여
  3. 새 청구서 반환
```

### 6.4 PaymentService 상세

```typescript
// 결제 등록
create(dto, entityId):
  1. 청구서 조회
  2. 미결제 금액 검증: amount ≤ (total - paid_amount)
     → 초과 시 E4007 에러
  3. Payment 엔티티 생성
  4. 청구서 paid_amount += amount
  5. paid_amount >= total 이면:
     → status = PAID, paid_date = now

// 결제 취소
delete(id, entityId):
  1. Payment 조회
  2. 청구서 paid_amount -= amount
  3. 상태 복원 (PAID → 이전 상태)
  4. Payment 소프트 삭제
```

### 6.5 BillingAutomationService 상세

```typescript
// 자동 청구서 일괄 생성
generateMonthlyInvoices(entityId, yearMonth):
  1. 대상 계약 조회:
     - status = ACTIVE
     - auto_generate = true
     - start_date ≤ yearMonth ≤ end_date
     - type = FIXED
  2. 기존 청구서 확인 (중복 방지)
  3. 계약별 청구서 생성:
     - 번호 자동 부여
     - billing_period 기반 용역기간 계산
     - amount, currency 복사
     - 품목 자동 생성
  4. 결과 반환:
     { generated, skipped, invoiceIds }
```

### 6.6 BillingReportService 상세

```typescript
// 대시보드 요약
getDashboardSummary(entityId):
  → 총 계약수, 활성 계약, 이번달 청구서, 미수금, 미지급

// 월별 매출/비용
getRevenueSummary(entityId, year):
  → [{ month, receivable, payable, currency }]

// 월별 청구 금액 매트릭스
getMonthlyFeeMatrix(entityId, year):
  → 거래처 × 월 형태의 금액 테이블

// Excel 내보내기
exportInvoicesToExcel(entityId, params):
  → 청구서 전체 내역 Excel 파일

exportMonthlyMatrixToExcel(entityId, year):
  → 월별 매트릭스 Excel 파일

exportTaxInvoicesToExcel(entityId, params):
  → 세금계산서 발행 이력 Excel 파일
```

---

## 7. 프론트엔드 구성

### 7.1 페이지 구성

| 페이지 | 경로 | 설명 |
|--------|------|------|
| BillingLayout | `/billing` | 좌측 네비게이션 + Entity Selector |
| BillingDashboardPage | `/billing/dashboard` | 대시보드 (요약 카드, 차트, 매트릭스) |
| PartnerListPage | `/billing/partners` | 거래처 목록 (검색/유형 필터) |
| PartnerDetailPage | `/billing/partners/:id` | 거래처 상세 (4개 탭) |
| ContractListPage | `/billing/contracts` | 계약 목록 (방향/카테고리/유형/상태 필터) |
| ContractDetailPage | `/billing/contracts/:id` | 계약 상세 (마일스톤, 변경이력) |
| SowListPage | `/billing/sow` | SOW 목록 |
| SowDetailPage | `/billing/sow/:id` | SOW 상세 |
| InvoiceListPage | `/billing/invoices` | 청구서 목록 (상태/방향/월 필터) |
| InvoiceDetailPage | `/billing/invoices/:id` | 청구서 상세 (품목, 승인, 결제) |
| PaymentListPage | `/billing/payments` | 결제 목록 |

### 7.2 주요 컴포넌트

**거래처 상세 탭 구성:**

```
PartnerDetailPage
├── PartnerBasicInfoTab       # 기본정보 (회사정보, 담당자, 결제조건)
├── PartnerContractsTab       # 해당 거래처의 계약 목록
├── PartnerInvoicesTab        # 해당 거래처의 청구서 목록
└── PartnerSowTab             # 해당 거래처의 SOW 목록
```

**계약 상세 구성:**

```
ContractDetailPage
├── ContractStatusBadge       # 상태 배지
├── 기본정보 폼 (방향, 카테고리, 유형, 금액, 기간)
├── MilestoneEditor           # 마일스톤 추가/수정/삭제 (MILESTONE 유형)
├── ContractHistoryLog        # 변경이력 타임라인
└── DocumentManager           # 관련 문서 관리
```

**청구서 상세 구성:**

```
InvoiceDetailPage
├── InvoiceStatusBadge        # 청구서 상태 배지
├── 기본정보 (번호, 날짜, 거래처, 금액)
├── InvoiceItemsEditor        # 품목 추가/수정/삭제
├── InvoiceApprovalActions    # 승인 액션 버튼들
│   ├── [검토 요청] → [검토 승인] → [매니저 승인] → [최종 승인]
│   └── [거절] (사유 입력)
├── PaymentForm               # 결제 등록 폼
├── SendEmailModal            # 이메일 발송 모달
└── DocumentManager           # 관련 문서 관리
```

**대시보드 구성:**

```
BillingDashboardPage
├── 요약 카드 (총 계약, 활성 계약, 이번달 청구, 미수금)
├── OverdueBillingAlert       # 미발행 청구서 경고
├── BillingCalendar           # 월별 청구 일정 달력
├── MonthlyFeeMatrix          # 거래처 × 월 금액 매트릭스
├── TaxInvoiceHistory         # 세금계산서 발행 이력
└── BulkGenerateModal         # 일괄 청구서 생성 모달
```

### 7.3 React Query 훅 구성

| 훅 파일 | 주요 훅 |
|---------|---------|
| usePartner | `usePartnerList`, `usePartnerDetail`, `useCreatePartner`, `useUpdatePartner`, `useDeletePartner` |
| useContract | `useContractList`, `useContractDetail`, `useCreateContract`, `useUpdateContract`, `useDeleteContract`, `useRenewContract`, `useContractHistory` |
| useSow | `useSowList`, `useSowDetail`, `useCreateSow`, `useUpdateSow`, `useDeleteSow` |
| useInvoice | `useInvoiceList`, `useInvoiceDetail`, `useCreateInvoice`, `useUpdateInvoice`, `useDeleteInvoice`, `useSendInvoiceEmail`, `useVoidAndReissue` |
| useInvoiceApproval | `useSubmitForReview`, `useApproveReview`, `useApproveManager`, `useApproveAdmin`, `useRejectInvoice` |
| usePayment | `usePaymentList`, `usePaymentsByInvoice`, `useOutstanding`, `useCreatePayment`, `useDeletePayment` |
| useDocument | `useDocumentList`, `useUploadDocument`, `useDeleteDocument` |
| useBillingReport | `useDashboardSummary`, `useRevenueSummary`, `useMonthlyMatrix`, `useExportInvoices`, `useExportMonthlyMatrix`, `useExportTaxInvoices` |

---

## 8. 에러 코드

Billing 모듈은 **E4xxx** 계열 에러 코드를 사용한다.

| 코드 | 메시지 | 설명 |
|------|--------|------|
| E4001 | PARTNER_NOT_FOUND | 거래처를 찾을 수 없음 |
| E4002 | PARTNER_CODE_DUPLICATE | 거래처 코드 중복 |
| E4003 | CONTRACT_NOT_FOUND | 계약을 찾을 수 없음 |
| E4004 | INVOICE_NOT_FOUND | 청구서를 찾을 수 없음 |
| E4005 | SOW_NOT_FOUND | SOW를 찾을 수 없음 |
| E4006 | INVALID_STATE_TRANSITION | 불가능한 상태 전환 |
| E4007 | PAYMENT_EXCEEDS_BALANCE | 결제액이 미결제 금액 초과 |
| E4008 | INVOICE_IMMUTABLE | 불변 상태의 청구서 수정 시도 |
| E4009 | DOCUMENT_NOT_FOUND | 문서를 찾을 수 없음 |
| E4010 | APPROVAL_PERMISSION_DENIED | 승인 권한 없음 |

---

## 9. 다국어 지원 (i18n)

### 9.1 번역 파일 구조

```
apps/web/src/locales/
├── en/billing.json    # English
├── ko/billing.json    # 한국어
└── vi/billing.json    # Tiếng Việt
```

### 9.2 주요 번역 키 네임스페이스

```json
{
  "title": "Client & Partner Management" / "계약/거래처 관리" / "Quản lý hợp đồng",
  "menu": {
    "dashboard": "Dashboard" / "대시보드",
    "partners": "Partners" / "거래처",
    "contracts": "Contracts" / "계약",
    "sow": "SOW",
    "invoices": "Invoices" / "청구서",
    "payments": "Payments" / "결제",
    "settings": "Settings" / "설정"
  },
  "partner": {
    "list": { "title", "addNew", "search", "empty" },
    "form": { "code", "type", "companyName", "contactName", ... },
    "type": { "client", "affiliate", "partner", "outsourcing", "generalAffairs" },
    "status": { "active", "inactive", "prospect" }
  },
  "contract": {
    "direction": { "receivable", "payable" },
    "category": { "techBpo", "siDev", "maintenance", ... },
    "type": { "fixed", "usageBased", "milestone", "adHoc" },
    "status": { "draft", "active", "expiring", "expired", ... }
  },
  "invoice": {
    "status": { "draft", "issued", "sent", "paid", "overdue", "cancelled", "void" },
    "approval": { "none", "pendingReview", "pendingApproval", ... }
  },
  "payment": { ... },
  "sow": { ... },
  "dashboard": { ... }
}
```

### 9.3 사용 방식

```tsx
const { t } = useTranslation(['billing', 'common']);

<h1>{t('billing:title')}</h1>
<span>{t('billing:contract.direction.receivable')}</span>
<button>{t('common:save')}</button>
```

---

## 10. 보안 및 접근 제어

### 10.1 Guard 체계

| Guard | 역할 | 적용 범위 |
|-------|------|----------|
| **EntityGuard** | 법인별 데이터 격리 | 모든 Billing 엔드포인트 |
| **ManagerGuard** | MANAGER 이상 | 청구서 매니저 승인 |
| **AdminGuard** | ADMIN만 | 청구서 최종 승인, 설정 변경 |

### 10.2 데이터 격리

- 모든 엔티티에 `ent_id` 외래 키 → 법인별 데이터 완전 격리
- `cross_entity_ref` 필드로 법인 간 동일 거래처 참조 가능
- 법인 간 통합 보고서는 별도 `consolidated` API로 제공

### 10.3 감사 추적 (Audit Trail)

- **계약 변경이력**: `amb_bil_contract_history` 테이블에 필드별 변경 기록
- **청구서 승인 이력**: `reviewer_id`, `approver_manager_id`, `approver_admin_id`와 각 일시 기록
- **결제 이력**: 결제 등록/취소 시 타임스탬프 기록
- **Soft Delete**: 모든 주요 엔티티에 `deleted_at` 컬럼

---

## 11. 자동화 및 외부 연동

### 11.1 자동 청구서 생성 (Cron Job)

| 항목 | 설명 |
|------|------|
| **대상** | `auto_generate = true` + `type = FIXED` + `status = ACTIVE` |
| **주기** | 매월 billingDay (계약별 설정) |
| **실행** | POST `/automation/generate` 또는 Cron |
| **중복 방지** | 해당 월 기존 청구서 존재 시 건너뛰기 |

### 11.2 Google Drive 연동

| 기능 | 설명 |
|------|------|
| **거래처 폴더** | `ptn_gdrive_folder_id` — 거래처별 전용 폴더 |
| **계약 폴더** | `ctr_gdrive_folder_id` — 계약별 문서 보관 |
| **문서 업로드** | 파일 업로드 시 자동 Google Drive 저장 |
| **PDF 저장** | 청구서 PDF 생성 시 `save_to_drive=true` 옵션 |
| **미리보기** | Google Drive embed URL로 문서 미리보기 |

### 11.3 Google Sheets 연동

| 기능 | 설명 |
|------|------|
| **계약 시트** | `ctr_gsheet_url` — 계약 관련 Google Sheet |
| **탭 패턴** | `ctr_gsheet_tab_pattern` — 월별 탭 자동 생성 |
| **사용량 추적** | USAGE_BASED 계약의 사용량 입력 |
| **청구서 시트** | `inv_gsheet_url` — 청구서 시트 URL |

### 11.4 이메일 발송

| 기능 | 설명 |
|------|------|
| **발송 대상** | 거래처 담당자 이메일 (`ptn_contact_email`) |
| **첨부 파일** | 청구서 PDF 자동 첨부 |
| **발송 서비스** | Postal Mail Server 연동 |
| **발송 후 상태** | 청구서 상태 → SENT |

### 11.5 Todo 연동

| 이벤트 | Todo 생성 대상 | 설명 |
|--------|---------------|------|
| PENDING_REVIEW | 검토자 | 청구서 검토 요청 알림 |
| PENDING_APPROVAL | MANAGER 권한자 | 매니저 승인 요청 알림 |
| APPROVED_MANAGER | ADMIN 권한자 | 최종 승인 요청 알림 |

### 11.6 청구서 번호 규칙

```
형식: {ENT_CODE}_{CURRENCY}_{YYYY}_{MM}_{SEQ}

예시:
  AMB_USD_2026_02_001   (AMB 법인, USD, 2026년 2월, 1번째)
  AMB_KRW_2026_02_002   (AMB 법인, KRW, 2026년 2월, 2번째)

SEQ: 법인+통화+연월 기준 자동 증가
```

---

> **참고**: 이 문서는 소스 코드를 기반으로 자동 생성되었으며, 구현 변경 시 업데이트가 필요합니다.
