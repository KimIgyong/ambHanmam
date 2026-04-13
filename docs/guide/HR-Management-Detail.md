# Amoeba KMS -- 인사관리(HR) 모듈 상세 설명서

> **문서 버전**: v1.0
> **최종 수정일**: 2026-02-18
> **대상 모듈**: `apps/api/src/domain/hr/`, `apps/web/src/domain/hr/`, `packages/types/`

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
11. [다국가 급여 체계](#11-다국가-급여-체계)

---

## 1. 개요

### 1.1 모듈의 목적과 핵심 가치

인사관리(HR) 모듈은 AMB Management 시스템의 핵심 도메인으로서, **다국가(베트남/한국) 법인의 인사·급여·근태를 단일 시스템에서 통합 관리**하는 것을 목적으로 한다. 베트남 현지 법인과 한국 본사의 상이한 노동법·세법·보험 체계를 각각 지원하면서도 하나의 일관된 인터페이스를 제공한다.

**핵심 가치:**

| 가치 | 설명 |
|------|------|
| **다국가 급여 체계** | 베트남(VN) GROSS/NET 급여 계산과 한국(KR) 4대보험·간이세액표 기반 급여 계산을 동시에 지원 |
| **다단계 승인 워크플로우** | 급여 처리의 7단계 상태 관리 (DRAFT → CALCULATING → CALCULATED → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → FINALIZED) |
| **법인별 독립 운영** | 복수의 법인을 등록하고, 법인별 직원·급여·설정을 완전히 격리하여 운영 |
| **근태·초과근무 통합** | 근태 입력 → OT 관리 → 급여 자동 반영까지의 끊김 없는 데이터 흐름 |
| **보고서 자동 생성** | 급여명세서(PDF), 급여대장(Excel), 보험내역서, PIT 보고서, 세무사 연동 자료 자동 생성 |

### 1.2 주요 기능 요약

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                    인사관리(HR) 모듈 기능 맵                       │
  │                                                                  │
  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐      │
  │  │  직원 관리     │  │  프리랜서 관리 │  │  법인 관리          │      │
  │  │              │  │              │  │                   │      │
  │  │ - 직원 CRUD   │  │ - 프리랜서    │  │ - 법인 CRUD        │      │
  │  │ - 부양가족    │  │   CRUD       │  │ - 사용자 역할       │      │
  │  │ - 급여 이력   │  │ - 사업소득    │  │ - 도장 이미지       │      │
  │  │ - KR 확장정보 │  │   지급 관리   │  │ - 법인별 설정       │      │
  │  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘      │
  │         │                 │                     │                │
  │         └────────────┬────┴─────────────────────┘                │
  │                      │                                           │
  │  ┌──────────────┐    │    ┌──────────────────────┐              │
  │  │  근태 관리     │    │    │  급여 처리              │              │
  │  │              │    │    │                      │              │
  │  │ - 월간 근태   │────┼───→│ - 급여기간 관리         │              │
  │  │ - 출석 코드   │    │    │ - VN/KR 급여 계산      │              │
  │  │ - 근무시간    │    │    │ - 7단계 승인            │              │
  │  └──────────────┘    │    │ - 보고서 생성           │              │
  │                      │    └──────────────────────┘              │
  │  ┌──────────────┐    │    ┌──────────────────────┐              │
  │  │  초과근무      │    │    │  연차 관리              │              │
  │  │              │    │    │                      │              │
  │  │ - OT 유형별   │────┘    │ - 부여/사용/이월        │              │
  │  │ - 승인 관리   │         │ - OT 전환              │              │
  │  │ - 변환시간    │         │ - 자동 재계산           │              │
  │  └──────────────┘         └──────────────────────┘              │
  │                                                                  │
  │  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐     │
  │  │  퇴직금 계산   │    │  연말정산      │    │  HR 설정         │     │
  │  │              │    │              │    │                │     │
  │  │ - 시뮬레이션  │    │ - 세금 정산   │    │ - 공휴일 달력    │     │
  │  │ - 확정 처리   │    │ - 급여 반영   │    │ - 시스템 파라미터 │     │
  │  │              │    │ - Excel 임포트│    │ - 보험료율       │     │
  │  └──────────────┘    └──────────────┘    │ - 간이세액표     │     │
  │                                          └────────────────┘     │
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
+----------------+  +------------------+  +-------------------+
| EmployeeList   |  | PayrollDetail    |  | TimesheetPage     |
| EmployeeDetail |  | PayrollList      |  | OvertimePage      |
| FreelancerList |  | SeverancePage    |  | LeavePage         |
| FreelancerDetail| | BusinessIncome   |  | HrSettingsPage    |
+-------+--------+  +--------+---------+  +---------+---------+
        |                     |                      |
        | REST API (3009/api/v1/hr)                  |
        v                     v                      v
+------------------------------------------------------------------+
|                    NestJS Backend (API)                            |
|                                                                    |
|  +------------------+  +------------------+  +------------------+ |
|  | EmployeeCtrl     |  | PayrollCtrl      |  | TimesheetCtrl    | |
|  | (11 endpoints)   |  | (12 endpoints)   |  | (2 endpoints)    | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
|           |                      |                      |          |
|  +--------v---------+  +--------v---------+  +--------v---------+ |
|  | EmployeeService  |  | PayrollService   |  | TimesheetService | |
|  |                  |  | PayrollCalcSvc   |  |                  | |
|  |                  |  | KrPayrollCalcSvc |  |                  | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
|           |                      |                      |          |
+------------------------------------------------------------------+
            |                      |                      |
            v                      v                      v
+------------------------------------------------------------------+
|                PostgreSQL 15 (TypeORM)                             |
|                                                                    |
|  amb_hr_employees          amb_hr_payroll_periods                  |
|  amb_hr_employees_kr       amb_hr_payroll_details                  |
|  amb_hr_dependents         amb_hr_payroll_entries_kr               |
|  amb_hr_salary_history     amb_hr_timesheets                       |
|  amb_hr_freelancers        amb_hr_ot_records                       |
|  amb_hr_entities           amb_hr_leave_balances                   |
|  amb_hr_entity_user_roles  amb_hr_business_income_payments         |
|  amb_hr_holidays           amb_hr_yearend_adjustments              |
|  amb_hr_system_params      amb_hr_insurance_params_kr              |
|                            amb_hr_tax_simple_table                  |
+------------------------------------------------------------------+
```

### 2.2 파일 구조

```
apps/api/src/domain/hr/
├── hr.module.ts                          # 모듈 정의 (19 엔티티, 15 컨트롤러, 25 서비스)
├── controller/
│   ├── employee.controller.ts            # 직원 관리 (11 endpoints)
│   ├── employee-kr.controller.ts         # 한국 직원 확장 (3 endpoints)
│   ├── freelancer.controller.ts          # 프리랜서 관리 (5 endpoints)
│   ├── payroll.controller.ts             # 급여 처리 (12 endpoints)
│   ├── timesheet.controller.ts           # 근태 관리 (2 endpoints)
│   ├── ot-record.controller.ts           # 초과근무 (5 endpoints)
│   ├── leave.controller.ts               # 연차 관리 (3 endpoints)
│   ├── severance.controller.ts           # 퇴직금 (2 endpoints)
│   ├── entity.controller.ts              # 법인 관리 (9 endpoints)
│   ├── business-income.controller.ts     # 사업소득 (5 endpoints)
│   ├── yearend-adjustment.controller.ts  # 연말정산 (8 endpoints)
│   ├── system-param.controller.ts        # 시스템 설정 (6 endpoints)
│   ├── kr-settings.controller.ts         # 한국 설정 (7 endpoints)
│   ├── hr-report.controller.ts           # VN 보고서 (5 endpoints)
│   └── kr-report.controller.ts           # KR 보고서 (5 endpoints)
├── entity/
│   ├── employee.entity.ts
│   ├── employee-kr.entity.ts
│   ├── dependent.entity.ts
│   ├── salary-history.entity.ts
│   ├── freelancer.entity.ts
│   ├── hr-entity.entity.ts
│   ├── entity-user-role.entity.ts
│   ├── payroll-period.entity.ts
│   ├── payroll-detail.entity.ts
│   ├── payroll-entry-kr.entity.ts
│   ├── timesheet.entity.ts
│   ├── ot-record.entity.ts
│   ├── leave-balance.entity.ts
│   ├── holiday.entity.ts
│   ├── system-param.entity.ts
│   ├── business-income.entity.ts
│   ├── yearend-adjustment.entity.ts
│   ├── insurance-params-kr.entity.ts
│   └── tax-simple-table.entity.ts
├── dto/request/
│   ├── create-employee.request.ts
│   ├── update-employee.request.ts
│   ├── create-employee-kr.request.ts
│   ├── update-employee-kr.request.ts
│   ├── create-dependent.request.ts
│   ├── create-salary.request.ts
│   ├── create-freelancer.request.ts
│   ├── update-freelancer.request.ts
│   ├── create-payroll-period.request.ts
│   ├── upsert-timesheet.request.ts
│   ├── create-ot-record.request.ts
│   ├── create-entity.request.ts
│   ├── update-entity.request.ts
│   ├── assign-entity-role.request.ts
│   ├── create-business-income.request.ts
│   ├── update-business-income.request.ts
│   ├── update-yearend-adjustment.request.ts
│   ├── create-holiday.request.ts
│   ├── update-system-param.request.ts
│   └── update-insurance-params-kr.request.ts
└── service/
    ├── employee.service.ts
    ├── employee-kr.service.ts
    ├── freelancer.service.ts
    ├── payroll.service.ts
    ├── payroll-calc.service.ts
    ├── kr-payroll-calc.service.ts
    ├── kr-insurance-calc.service.ts
    ├── kr-tax-calc.service.ts
    ├── timesheet.service.ts
    ├── ot-record.service.ts
    ├── leave.service.ts
    ├── severance.service.ts
    ├── entity.service.ts
    ├── system-param.service.ts
    ├── business-income.service.ts
    ├── yearend-adjustment.service.ts
    ├── insurance-params-kr.service.ts
    ├── tax-table.service.ts
    ├── hr-report.service.ts
    ├── kr-report.service.ts
    ├── payslip-pdf.service.ts
    ├── kr-payslip-pdf.service.ts
    ├── hr-seed.service.ts
    ├── employee-seed.service.ts
    └── entity-seed.service.ts

apps/web/src/domain/hr/
├── pages/
│   ├── HrLayout.tsx
│   ├── EmployeeListPage.tsx
│   ├── EmployeeDetailPage.tsx
│   ├── FreelancerListPage.tsx
│   ├── FreelancerDetailPage.tsx
│   ├── PayrollListPage.tsx
│   ├── PayrollDetailPage.tsx
│   ├── TimesheetPage.tsx
│   ├── OvertimePage.tsx
│   ├── LeavePage.tsx
│   ├── SeverancePage.tsx
│   ├── BusinessIncomePage.tsx
│   ├── YearendAdjustmentPage.tsx
│   ├── HrReportsPage.tsx
│   └── HrSettingsPage.tsx
├── components/
│   ├── employee/
│   │   ├── EmployeeTable.tsx
│   │   ├── EmployeeBasicInfoTab.tsx
│   │   ├── EmployeeSalaryTab.tsx
│   │   ├── EmployeeDependentsTab.tsx
│   │   └── EmployeeKrInfoTab.tsx
│   ├── payroll/
│   │   ├── PayrollPeriodList.tsx
│   │   ├── PayrollDetailView.tsx
│   │   ├── PayrollSummaryTable.tsx
│   │   ├── PayrollStatusBadge.tsx
│   │   └── PayrollProcessing.tsx
│   ├── timesheet/
│   │   ├── TimesheetGrid.tsx
│   │   ├── TimesheetSummary.tsx
│   │   └── AttendanceCodeSelector.tsx
│   ├── overtime/
│   │   ├── OvertimeForm.tsx
│   │   ├── OvertimeTable.tsx
│   │   └── OvertimeSummary.tsx
│   ├── leave/
│   │   ├── LeaveBalanceTable.tsx
│   │   ├── LeaveSummary.tsx
│   │   └── LeaveDetailModal.tsx
│   ├── severance/
│   │   ├── EmployeeSelector.tsx
│   │   └── SeveranceResult.tsx
│   ├── settings/
│   │   ├── HolidayCalendarTab.tsx
│   │   ├── OtRatesTab.tsx
│   │   ├── TaxBracketsTab.tsx
│   │   ├── RegionalWagesTab.tsx
│   │   ├── InsuranceRatesTab.tsx
│   │   ├── KrTaxTableTab.tsx
│   │   └── KrInsuranceParamsTab.tsx
│   └── EntitySelector.tsx
├── hooks/
│   ├── useEmployees.ts
│   ├── useEmployeeKr.ts
│   ├── useFreelancer.ts
│   ├── usePayroll.ts
│   ├── useTimesheet.ts
│   ├── useOvertime.ts
│   ├── useLeave.ts
│   ├── useSeverance.ts
│   ├── useEntity.ts
│   ├── useBusinessIncome.ts
│   ├── useYearendAdjustment.ts
│   ├── useHrSettings.ts
│   ├── useKrSettings.ts
│   └── useHrReports.ts
└── service/
    ├── employee.service.ts
    ├── employee-kr.service.ts
    ├── freelancer.service.ts
    ├── payroll.service.ts
    ├── timesheet.service.ts
    ├── overtime.service.ts
    ├── leave.service.ts
    ├── severance.service.ts
    ├── entity.service.ts
    ├── business-income.service.ts
    ├── yearend-adjustment.service.ts
    ├── hr-settings.service.ts
    ├── kr-settings.service.ts
    └── hr-report.service.ts
```

---

## 3. 데이터 모델

### 3.1 ER 다이어그램 (개념)

```
                        ┌─────────────────┐
                        │  amb_hr_entities │
                        │  (법인)          │
                        └────────┬────────┘
                  ┌──────────────┼──────────────────┐
                  │              │                   │
                  v              v                   v
   ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
   │ amb_hr_employees  │  │amb_hr_       │  │amb_hr_freelancers│
   │ (직원)            │  │entity_user_  │  │(프리랜서)         │
   │                   │  │roles         │  │                  │
   └───┬───┬───┬───┬──┘  └──────────────┘  └────────┬─────────┘
       │   │   │   │                                 │
       │   │   │   │                                 v
       │   │   │   │                     ┌──────────────────────┐
       │   │   │   │                     │amb_hr_business_income│
       │   │   │   │                     │_payments (사업소득)   │
       │   │   │   │                     └──────────────────────┘
       v   │   │   v
 ┌──────┐  │   │  ┌──────────────────┐
 │depend│  │   │  │amb_hr_employees  │
 │ents  │  │   │  │_kr (KR 확장)     │
 │(부양 │  │   │  └──────────────────┘
 │가족) │  │   │
 └──────┘  │   v
           │  ┌──────────────────┐
           │  │amb_hr_salary_    │
           │  │history (급여이력) │
           │  └──────────────────┘
           v
  ┌────────────────────┐
  │amb_hr_payroll_      │───────┐
  │periods (급여기간)    │       │
  └────┬───────────────┘       │
       │                       v
       v                ┌──────────────────┐
  ┌────────────────┐    │amb_hr_payroll_    │
  │amb_hr_payroll_ │    │entries_kr         │
  │details (VN급여)│    │(KR 급여)           │
  └────────────────┘    └──────────────────┘

  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
  │amb_hr_       │  │amb_hr_       │  │amb_hr_leave_     │
  │timesheets    │  │ot_records    │  │balances          │
  │(근태)        │  │(초과근무)     │  │(연차잔액)         │
  └──────────────┘  └──────────────┘  └──────────────────┘
```

### 3.2 테이블 상세

#### 3.2.1 `amb_hr_entities` (법인)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `ent_id` | UUID | PK | 법인 ID |
| `ent_code` | VARCHAR(10) | UNIQUE | 법인 코드 |
| `ent_name` | VARCHAR(200) | NOT NULL | 법인명 |
| `ent_name_en` | VARCHAR(200) | NULL | 영문명 |
| `ent_country` | VARCHAR(5) | NOT NULL | 국가 (KR/VN) |
| `ent_currency` | VARCHAR(5) | NOT NULL | 기본 통화 (KRW/VND/USD) |
| `ent_reg_no` | VARCHAR(50) | NULL | 사업자 등록번호 |
| `ent_address` | TEXT | NULL | 주소 |
| `ent_representative` | VARCHAR(100) | NULL | 대표자명 |
| `ent_phone` | VARCHAR(20) | NULL | 전화번호 |
| `ent_email` | VARCHAR(100) | NULL | 이메일 |
| `ent_pay_day` | INT | DEFAULT 25 | 급여 지급일 (1~31) |
| `ent_status` | VARCHAR(10) | DEFAULT 'ACTIVE' | 상태 (ACTIVE/INACTIVE) |
| `ent_stamp_image` | BYTEA | NULL | 법인 도장 이미지 |
| `ent_created_at` | TIMESTAMP | - | 생성일시 |
| `ent_updated_at` | TIMESTAMP | - | 수정일시 |

#### 3.2.2 `amb_hr_entity_user_roles` (법인 사용자 역할)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `eur_id` | UUID | PK | ID |
| `ent_id` | UUID | FK → entities | 법인 ID |
| `usr_id` | UUID | FK | 사용자 ID |
| `eur_role` | VARCHAR(20) | NOT NULL | 역할 |
| `eur_status` | VARCHAR(10) | DEFAULT 'ACTIVE' | 상태 |
| `eur_created_at` | TIMESTAMP | - | 생성일시 |

**UNIQUE**: (ent_id, usr_id)

#### 3.2.3 `amb_hr_employees` (직원)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `emp_id` | UUID | PK | 직원 ID |
| `ent_id` | UUID | FK → entities | 법인 ID |
| `emp_code` | VARCHAR(10) | NOT NULL | 직원 코드 |
| `emp_full_name` | VARCHAR(100) | NOT NULL | 이름 |
| `emp_nationality` | VARCHAR(15) | NOT NULL | 국적 (VIETNAMESE/FOREIGNER) |
| `emp_cccd_number` | VARCHAR(20) | NULL | CCCD 번호 |
| `emp_tax_code` | VARCHAR(20) | NULL | 세금 코드 |
| `emp_si_number` | VARCHAR(20) | NULL | 사회보험 번호 |
| `emp_hospital_code` | VARCHAR(100) | NULL | 병원 코드 |
| `emp_start_date` | DATE | NOT NULL | 입사일 |
| `emp_end_date` | DATE | NULL | 퇴사일 |
| `emp_status` | VARCHAR(20) | NOT NULL | 상태 (OFFICIAL/PROBATION/PARENTAL_LEAVE/TEMPORARY_LEAVE/RESIGNED) |
| `emp_contract_type` | VARCHAR(20) | DEFAULT 'EMPLOYEE' | 계약 유형 (EMPLOYEE/FREELANCER) |
| `emp_department` | VARCHAR(50) | NOT NULL | 부서 |
| `emp_position` | VARCHAR(50) | NOT NULL | 직책 |
| `emp_region` | VARCHAR(20) | DEFAULT 'REGION_1' | 지역 (REGION_1~4) |
| `emp_salary_type` | VARCHAR(10) | DEFAULT 'GROSS' | 급여 유형 (GROSS/NET) |
| `emp_work_schedule` | VARCHAR(10) | DEFAULT 'MON_FRI' | 근무 형태 (MON_FRI/MON_SAT) |
| `emp_memo` | TEXT | NULL | 메모 |
| `emp_created_at` | TIMESTAMP | - | 생성일시 |
| `emp_updated_at` | TIMESTAMP | - | 수정일시 |
| `emp_deleted_at` | TIMESTAMP | NULL | 삭제일시 (Soft Delete) |

**UNIQUE**: (ent_id, emp_code)
**Relations**: OneToMany → Dependent, SalaryHistory / ManyToOne → HrEntity

#### 3.2.4 `amb_hr_employees_kr` (한국 직원 확장)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `ekr_id` | UUID | PK | ID |
| `emp_id` | UUID | FK, UNIQUE | 직원 ID |
| `ekr_resident_no` | VARCHAR(256) | NULL | 주민등록번호 (암호화 저장) |
| `ekr_employee_type` | VARCHAR(20) | NOT NULL | 유형 (REGULAR/CONTRACT/DAILY/REPRESENTATIVE/INTERN) |
| `ekr_pension_no` | VARCHAR(20) | NULL | 국민연금 번호 |
| `ekr_health_ins_no` | VARCHAR(20) | NULL | 건강보험 번호 |
| `ekr_employ_ins_no` | VARCHAR(20) | NULL | 고용보험 번호 |
| `ekr_pension_exempt` | BOOLEAN | DEFAULT false | 국민연금 면제 여부 |
| `ekr_health_exempt` | BOOLEAN | DEFAULT false | 건강보험 면제 여부 |
| `ekr_employ_exempt` | BOOLEAN | DEFAULT false | 고용보험 면제 여부 |
| `ekr_tax_dependents` | INT | DEFAULT 1 | 세금 피부양자 수 |
| `ekr_withholding_rate` | VARCHAR(5) | DEFAULT '100' | 원천징수율 (80/100/120%) |
| `ekr_bank_account` | VARCHAR(50) | NULL | 급여 계좌 |
| `ekr_created_at` | TIMESTAMP | - | 생성일시 |
| `ekr_updated_at` | TIMESTAMP | - | 수정일시 |

**Relation**: OneToOne → Employee

#### 3.2.5 `amb_hr_dependents` (부양가족)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `dep_id` | UUID | PK | 부양가족 ID |
| `emp_id` | UUID | FK → employees | 직원 ID |
| `dep_name` | VARCHAR(100) | NOT NULL | 부양가족명 |
| `dep_relationship` | VARCHAR(30) | NOT NULL | 관계 |
| `dep_date_of_birth` | DATE | NOT NULL | 생년월일 |
| `dep_cccd_number` | VARCHAR(20) | NULL | CCCD 번호 |
| `dep_tax_code` | VARCHAR(20) | NULL | 세금 코드 |
| `dep_effective_from` | DATE | NOT NULL | 유효 시작일 |
| `dep_effective_to` | DATE | NULL | 유효 종료일 |
| `dep_created_at` | TIMESTAMP | - | 생성일시 |
| `dep_updated_at` | TIMESTAMP | - | 수정일시 |
| `dep_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

#### 3.2.6 `amb_hr_salary_history` (급여 이력)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `slh_id` | UUID | PK | ID |
| `emp_id` | UUID | FK → employees | 직원 ID |
| `slh_base_salary_vnd` | DECIMAL(15,0) | NOT NULL | 기본급 (VND) |
| `slh_base_salary_krw` | DECIMAL(15,0) | DEFAULT 0 | 기본급 (KRW) |
| `slh_base_salary_usd` | DECIMAL(15,2) | DEFAULT 0 | 기본급 (USD) |
| `slh_exchange_rate_krw` | DECIMAL(10,0) | DEFAULT 1 | KRW 환율 |
| `slh_exchange_rate_usd` | DECIMAL(10,0) | DEFAULT 1 | USD 환율 |
| `slh_meal_allowance` | DECIMAL(15,0) | DEFAULT 0 | 식사비 |
| `slh_cskh_allowance` | DECIMAL(15,0) | DEFAULT 0 | CSKH 수당 |
| `slh_fuel_allowance` | DECIMAL(15,0) | DEFAULT 0 | 유류비 |
| `slh_parking_allowance` | DECIMAL(15,0) | DEFAULT 0 | 주차비 |
| `slh_other_allowance` | DECIMAL(15,0) | DEFAULT 0 | 기타 수당 |
| `slh_effective_date` | DATE | NOT NULL | 적용일 |
| `slh_created_at` | TIMESTAMP | - | 생성일시 |
| `slh_updated_at` | TIMESTAMP | - | 수정일시 |

#### 3.2.7 `amb_hr_freelancers` (프리랜서)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `frl_id` | UUID | PK | 프리랜서 ID |
| `ent_id` | UUID | FK → entities | 법인 ID |
| `frl_code` | VARCHAR(10) | NOT NULL | 코드 |
| `frl_full_name` | VARCHAR(100) | NOT NULL | 이름 |
| `frl_resident_no` | VARCHAR(256) | NULL | 주민등록번호 (암호화) |
| `frl_nationality` | VARCHAR(5) | NULL | 국적 |
| `frl_address` | TEXT | NULL | 주소 |
| `frl_phone` | VARCHAR(20) | NULL | 전화 |
| `frl_contract_start` | DATE | NULL | 계약 시작일 |
| `frl_contract_end` | DATE | NULL | 계약 종료일 |
| `frl_contract_amount` | DECIMAL(15,0) | DEFAULT 0 | 계약 금액 |
| `frl_monthly_amount` | DECIMAL(15,0) | DEFAULT 0 | 월간 금액 |
| `frl_payment_type` | VARCHAR(20) | DEFAULT 'BUSINESS_INCOME' | 지급 유형 |
| `frl_tax_rate` | DECIMAL(4,2) | DEFAULT 3.0 | 세율 (%) |
| `frl_status` | VARCHAR(15) | DEFAULT 'ACTIVE' | 상태 (ACTIVE/COMPLETED/TERMINATED) |
| `frl_created_at` | TIMESTAMP | - | 생성일시 |
| `frl_updated_at` | TIMESTAMP | - | 수정일시 |
| `frl_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**UNIQUE**: (ent_id, frl_code)

#### 3.2.8 `amb_hr_payroll_periods` (급여기간)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `pyp_id` | UUID | PK | 급여기간 ID |
| `ent_id` | UUID | FK → entities | 법인 ID |
| `pyp_year` | INT | NOT NULL | 연도 |
| `pyp_month` | INT | NOT NULL | 월 (1~12) |
| `pyp_status` | VARCHAR(30) | DEFAULT 'DRAFT' | 상태 |
| `pyp_payment_date` | DATE | NULL | 지급예정일 |
| `pyp_approved_by_l1` | UUID | NULL | L1 승인자 |
| `pyp_approved_by_l2` | UUID | NULL | L2 승인자 |
| `pyp_finalized_at` | TIMESTAMP | NULL | 최종확정 일시 |
| `pyp_created_at` | TIMESTAMP | - | 생성일시 |
| `pyp_updated_at` | TIMESTAMP | - | 수정일시 |

**UNIQUE**: (ent_id, pyp_year, pyp_month)

**급여 상태 전이:**

```
DRAFT → CALCULATING → CALCULATED → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → FINALIZED
                                         ↓                  ↓              ↓
                                       DRAFT (반려)       DRAFT (반려)    DRAFT (반려)
```

#### 3.2.9 `amb_hr_payroll_details` (베트남 급여 상세)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `pyd_id` | UUID | PK |
| `pyp_id` | UUID | FK → payroll_periods |
| `emp_id` | UUID | FK → employees |
| **기본급** | | |
| `pyd_base_salary` | DECIMAL(15,0) | 기본급 |
| `pyd_actual_salary` | DECIMAL(15,0) | 실지급 기본급 (근무일수 비례) |
| **수당** | | |
| `pyd_meal_allowance` | DECIMAL(15,0) | 식사비 |
| `pyd_cskh_allowance` | DECIMAL(15,0) | CSKH 수당 |
| `pyd_fuel_allowance` | DECIMAL(15,0) | 유류비 |
| `pyd_other_allowance` | DECIMAL(15,0) | 기타 수당 |
| `pyd_total_income` | DECIMAL(15,0) | 총소득 |
| **보험 기준** | | |
| `pyd_insurance_base_si` | DECIMAL(15,0) | 사회보험 기준 |
| `pyd_insurance_base_ui` | DECIMAL(15,0) | 실업보험 기준 |
| **사업주 부담 보험** | | |
| `pyd_company_si_sickness` | DECIMAL(15,0) | 질병보험(회사) |
| `pyd_company_si_accident` | DECIMAL(15,0) | 산재보험(회사) |
| `pyd_company_si_retirement` | DECIMAL(15,0) | 퇴직보험(회사) |
| `pyd_company_hi` | DECIMAL(15,0) | 건강보험(회사) |
| `pyd_company_ui` | DECIMAL(15,0) | 실업보험(회사) |
| `pyd_company_union` | DECIMAL(15,0) | 노조(회사) |
| `pyd_total_company_insurance` | DECIMAL(15,0) | 사업주 부담 합계 |
| **직원 부담 보험** | | |
| `pyd_employee_si` | DECIMAL(15,0) | 사회보험(직원) |
| `pyd_employee_hi` | DECIMAL(15,0) | 건강보험(직원) |
| `pyd_employee_ui` | DECIMAL(15,0) | 실업보험(직원) |
| `pyd_total_employee_insurance` | DECIMAL(15,0) | 직원 부담 합계 |
| **세금** | | |
| `pyd_self_deduction` | DECIMAL(15,0) | 본인 공제 |
| `pyd_dependent_deduction` | DECIMAL(15,0) | 부양가족 공제 |
| `pyd_num_dependents` | INT | 부양가족 수 |
| `pyd_tax_exempt_income` | DECIMAL(15,0) | 비과세 소득 |
| `pyd_taxable_income` | DECIMAL(15,0) | 과세 소득 |
| `pyd_pit_amount` | DECIMAL(15,0) | 근로소득세(PIT) |
| **추가 항목** | | |
| `pyd_ot_amount` | DECIMAL(15,0) | 초과근무 수당 |
| `pyd_annual_leave_salary` | DECIMAL(15,0) | 연차 미사용 수당 |
| `pyd_bonus` | DECIMAL(15,0) | 상여금 |
| `pyd_adjustment` | DECIMAL(15,0) | 조정금 |
| **근무일수** | | |
| `pyd_standard_working_days` | DECIMAL(4,1) | 표준 근무일수 |
| `pyd_actual_working_days` | DECIMAL(4,1) | 실제 근무일수 |
| **최종 결과** | | |
| `pyd_net_salary_vnd` | DECIMAL(15,0) | 순급여 (VND) |
| `pyd_net_salary_usd` | DECIMAL(15,2) | 순급여 (USD) |

**UNIQUE**: (pyp_id, emp_id)

#### 3.2.10 `amb_hr_payroll_entries_kr` (한국 급여)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `pkr_id` | UUID | PK |
| `pyp_id` | UUID | FK → payroll_periods |
| `emp_id` | UUID | FK → employees |
| `ent_id` | UUID | FK → entities |
| **지급 항목** | | |
| `pkr_base_pay` | DECIMAL(15,0) | 기본급 |
| `pkr_ot_extend` | DECIMAL(15,0) | 연장근로수당 |
| `pkr_ot_holiday` | DECIMAL(15,0) | 휴일근로수당 |
| `pkr_ot_night` | DECIMAL(15,0) | 야간근로수당 |
| `pkr_ot_etc` | DECIMAL(15,0) | 기타 OT |
| `pkr_annual_leave` | DECIMAL(15,0) | 연차수당 |
| `pkr_bonus` | DECIMAL(15,0) | 상여금 |
| **비과세** | | |
| `pkr_vehicle_sub` | DECIMAL(15,0) | 자가운전보조금 |
| `pkr_meal_allow` | DECIMAL(15,0) | 식대 |
| `pkr_childcare` | DECIMAL(15,0) | 보육수당 |
| **집계** | | |
| `pkr_taxable_total` | DECIMAL(15,0) | 과세 합계 |
| `pkr_exempt_total` | DECIMAL(15,0) | 비과세 합계 |
| `pkr_gross_total` | DECIMAL(15,0) | 총지급액 |
| **4대보험** | | |
| `pkr_pension` | DECIMAL(15,0) | 국민연금 |
| `pkr_health_ins` | DECIMAL(15,0) | 건강보험 |
| `pkr_longterm_care` | DECIMAL(15,0) | 장기요양보험 |
| `pkr_employ_ins` | DECIMAL(15,0) | 고용보험 |
| **보험 정산** | | |
| `pkr_pension_settle` | DECIMAL(15,0) | 연금 정산 |
| `pkr_health_settle` | DECIMAL(15,0) | 건강 정산 |
| `pkr_longterm_settle` | DECIMAL(15,0) | 장기요양 정산 |
| `pkr_employ_settle` | DECIMAL(15,0) | 고용 정산 |
| **세금** | | |
| `pkr_income_tax` | DECIMAL(15,0) | 소득세 |
| `pkr_local_tax` | DECIMAL(15,0) | 지방소득세 |
| `pkr_yearend_tax` | DECIMAL(15,0) | 연말정산 소득세 |
| `pkr_yearend_local` | DECIMAL(15,0) | 연말정산 지방세 |
| **기타** | | |
| `pkr_prepaid` | DECIMAL(15,0) | 선급금 |
| `pkr_deduction_total` | DECIMAL(15,0) | 공제 합계 |
| `pkr_net_pay` | DECIMAL(15,0) | 실수령액 |

**UNIQUE**: (pyp_id, emp_id)

#### 3.2.11 `amb_hr_timesheets` (근태)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `tms_id` | UUID | PK | ID |
| `emp_id` | UUID | FK → employees | 직원 ID |
| `pyp_id` | UUID | FK → payroll_periods, NULL | 급여기간 ID |
| `tms_work_date` | DATE | NOT NULL | 근무일 |
| `tms_attendance_code` | VARCHAR(10) | NULL | 출석 코드 |
| `tms_work_hours` | DECIMAL(4,1) | DEFAULT 0 | 근무시간 |

**UNIQUE**: (emp_id, tms_work_date)

**출석 코드 (Attendance Code):**

| 코드 | 설명 | 근무시간 |
|------|------|---------|
| `8` | 전일 근무 | 8시간 |
| `4` | 반일 근무 | 4시간 |
| `AL` | Annual Leave (연차) | 0 |
| `PL` | Paid Leave (유급휴가) | 0 |
| `UP` | Unpaid Leave (무급휴가) | 0 |
| `H` | Holiday (공휴일) | 0 |
| `RE` | Rest day (휴무일) | 0 |
| `M` | Maternity (출산휴가) | 0 |
| `SL` | Sick Leave (병가) | 0 |
| `AB` | Absent (결근) | 0 |

#### 3.2.12 `amb_hr_ot_records` (초과근무)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `otr_id` | UUID | PK | ID |
| `emp_id` | UUID | FK → employees | 직원 ID |
| `otr_date` | DATE | NOT NULL | 초과근무일 |
| `otr_time_start` | TIME | NOT NULL | 시작시간 |
| `otr_time_end` | TIME | NOT NULL | 종료시간 |
| `otr_project_description` | TEXT | NULL | 프로젝트/업무 설명 |
| `otr_type` | VARCHAR(30) | NOT NULL | OT 유형 |
| `otr_actual_hours` | DECIMAL(4,1) | NOT NULL | 실제 시간 |
| `otr_converted_hours` | DECIMAL(4,1) | NOT NULL | 변환 시간 |
| `otr_approval_status` | VARCHAR(20) | DEFAULT 'PENDING' | 승인 상태 |
| `otr_approved_by` | UUID | NULL | 승인자 |
| `otr_deleted_at` | TIMESTAMP | NULL | 삭제일시 |

**OT 유형 및 배수:**

| 유형 | 코드 | 배수 |
|------|------|------|
| 평일 초과 | `WEEKDAY_150` | 150% |
| 평일 야간 | `WEEKDAY_NIGHT_200` | 200% |
| 주말 초과 | `WEEKEND_200` | 200% |
| 주말 야간 | `WEEKEND_NIGHT_210` | 210% |
| 공휴일 초과 | `HOLIDAY_300` | 300% |

#### 3.2.13 `amb_hr_leave_balances` (연차 잔액)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `lvb_id` | UUID | PK | ID |
| `emp_id` | UUID | FK → employees | 직원 ID |
| `lvb_year` | INT | NOT NULL | 연도 |
| `lvb_entitlement` | DECIMAL(5,1) | DEFAULT 0 | 부여일수 |
| `lvb_used` | DECIMAL(5,1) | DEFAULT 0 | 사용일수 |
| `lvb_ot_converted` | DECIMAL(5,1) | DEFAULT 0 | OT 전환일수 |
| `lvb_carry_forward` | DECIMAL(5,1) | DEFAULT 0 | 이월일수 |
| `lvb_remaining` | DECIMAL(5,1) | DEFAULT 0 | 잔여일수 |

**UNIQUE**: (emp_id, lvb_year)
**계산**: remaining = entitlement + carry_forward - used - ot_converted

#### 3.2.14 `amb_hr_business_income_payments` (사업소득 지급)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `bip_id` | UUID | PK | ID |
| `ent_id` | UUID | FK → entities | 법인 ID |
| `frl_id` | UUID | FK → freelancers | 프리랜서 ID |
| `bip_year_month` | VARCHAR(7) | NOT NULL | 대상월 (YYYY-MM) |
| `bip_payment_date` | DATE | NULL | 지급일 |
| `bip_gross_amount` | DECIMAL(15,0) | DEFAULT 0 | 총지급액 |
| `bip_weekly_holiday` | DECIMAL(15,0) | DEFAULT 0 | 주휴수당 |
| `bip_incentive` | DECIMAL(15,0) | DEFAULT 0 | 인센티브 |
| `bip_total_amount` | DECIMAL(15,0) | DEFAULT 0 | 합계금액 |
| `bip_prepaid` | DECIMAL(15,0) | DEFAULT 0 | 선급금 |
| `bip_income_tax` | DECIMAL(15,0) | DEFAULT 0 | 소득세 |
| `bip_local_tax` | DECIMAL(15,0) | DEFAULT 0 | 지방소득세 |
| `bip_employ_ins` | DECIMAL(15,0) | DEFAULT 0 | 고용보험 |
| `bip_accident_ins` | DECIMAL(15,0) | DEFAULT 0 | 산재보험 |
| `bip_student_loan` | DECIMAL(15,0) | DEFAULT 0 | 학자금 |
| `bip_deduction_total` | DECIMAL(15,0) | DEFAULT 0 | 공제합계 |
| `bip_net_amount` | DECIMAL(15,0) | DEFAULT 0 | 실수령액 |
| `bip_status` | VARCHAR(15) | DEFAULT 'DRAFT' | 상태 |

#### 3.2.15 설정 테이블들

**`amb_hr_holidays` (공휴일)**

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `hol_id` | UUID | PK |
| `ent_id` | UUID | FK, NULL |
| `hol_date` | DATE | 공휴일 (UNIQUE) |
| `hol_name` | VARCHAR(100) | 공휴일명 |
| `hol_name_vi` | VARCHAR(100) | 베트남어명 |
| `hol_year` | INT | 연도 |

**`amb_hr_system_params` (시스템 파라미터)**

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `hsp_id` | UUID | PK |
| `ent_id` | UUID | FK, NULL |
| `hsp_param_key` | VARCHAR(50) | 파라미터 키 |
| `hsp_param_value` | VARCHAR(50) | 파라미터 값 |
| `hsp_effective_from` | DATE | 유효 시작일 |
| `hsp_effective_to` | DATE | 유효 종료일 |
| `hsp_description` | VARCHAR(200) | 설명 |

**`amb_hr_insurance_params_kr` (한국 4대보험 파라미터)**

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `ikr_id` | UUID | PK |
| `ent_id` | UUID | FK |
| `ikr_effective_from` | DATE | 유효 시작 |
| `ikr_effective_to` | DATE | 유효 종료 |
| `ikr_pension_rate` / `_emp` / `_upper` / `_lower` | DECIMAL | 국민연금 요율/직원부담/상한/하한 |
| `ikr_health_rate` / `_emp` | DECIMAL | 건강보험 요율/직원부담 |
| `ikr_longterm_rate` | DECIMAL | 장기요양 요율 |
| `ikr_employ_rate` / `_emp` | DECIMAL | 고용보험 요율/직원부담 |

**`amb_hr_tax_simple_table` (간이세액표)**

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `tst_id` | UUID | PK |
| `ent_id` | UUID | FK |
| `tst_effective_year` | INT | 적용 연도 |
| `tst_salary_from` | DECIMAL(15,0) | 급여 구간 시작 |
| `tst_salary_to` | DECIMAL(15,0) | 급여 구간 끝 |
| `tst_dependents` | INT | 부양자 수 |
| `tst_tax_amount` | DECIMAL(15,0) | 세액 |

**INDEX**: (ent_id, tst_effective_year, tst_salary_from, tst_salary_to, tst_dependents)

#### 3.2.16 `amb_hr_yearend_adjustments` (연말정산)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|---------|------|
| `yea_id` | UUID | PK | ID |
| `ent_id` | UUID | FK | 법인 ID |
| `emp_id` | UUID | FK | 직원 ID |
| `yea_tax_year` | INT | NOT NULL | 귀속 연도 |
| `yea_settle_tax` | DECIMAL(15,0) | NOT NULL | 추가납부/환급 소득세 |
| `yea_settle_local` | DECIMAL(15,0) | NOT NULL | 추가납부/환급 지방세 |
| `yea_applied_month` | VARCHAR(7) | NULL | 적용월 (YYYY-MM) |
| `yea_status` | VARCHAR(10) | DEFAULT 'PENDING' | 상태 (PENDING/APPLIED) |
| `yea_note` | TEXT | NULL | 비고 |

**UNIQUE**: (ent_id, emp_id, yea_tax_year)

---

## 4. 핵심 프로세스

### 4.1 급여 처리 전체 플로우

```
                     ┌─────────────┐
                     │  급여기간 생성 │
                     │  (DRAFT)     │
                     └──────┬──────┘
                            │
                 ┌──────────v──────────┐
                 │  근태 데이터 확인     │
                 │  - 월간 근태 입력     │
                 │  - OT 승인 확인      │
                 │  - 연차 사용 확인     │
                 └──────────┬──────────┘
                            │
                 ┌──────────v──────────┐
                 │    급여 계산 실행     │
                 │  (CALCULATING)       │
                 │                     │
                 │  ┌─── VN 법인 ────┐ │
                 │  │ PayrollCalcSvc │ │
                 │  │ - 기본급 계산   │ │
                 │  │ - 보험 계산     │ │
                 │  │ - PIT 세금     │ │
                 │  │ - OT 수당     │  │
                 │  └────────────────┘ │
                 │                     │
                 │  ┌─── KR 법인 ────┐ │
                 │  │KrPayrollCalcSvc│ │
                 │  │ - 4대보험      │ │
                 │  │ - 간이세액     │  │
                 │  │ - 비과세 처리  │  │
                 │  └────────────────┘ │
                 │  (CALCULATED)       │
                 └──────────┬──────────┘
                            │
                 ┌──────────v──────────┐
                 │   승인 제출           │
                 │  (PENDING_APPROVAL)  │
                 └──────────┬──────────┘
                            │
                 ┌──────────v──────────┐
                 │   L1 승인 (Manager)  │
                 │  (APPROVED_L1)      │
                 └──────────┬──────────┘
                            │
                 ┌──────────v──────────┐
                 │   L2 승인 (Admin)    │
                 │  (APPROVED_L2)      │
                 └──────────┬──────────┘
                            │
                 ┌──────────v──────────┐
                 │   최종 확정           │
                 │  (FINALIZED)         │
                 │                     │
                 │  - 급여명세서 PDF    │
                 │  - 급여대장 Excel    │
                 │  - 보험내역서        │
                 └─────────────────────┘
```

### 4.2 베트남 급여 계산 로직

```
1. 기본급 계산
   actual_salary = base_salary × (actual_working_days / standard_working_days)

2. 수당 합산
   total_income = actual_salary + meal + cskh + fuel + other + OT_amount

3. 보험 산정 기준
   insurance_base_si = min(base_salary, regional_min_wage × 20)
   insurance_base_ui = min(base_salary, regional_min_wage × 20)

4. 회사 부담 보험
   company_si_sickness  = insurance_base_si × 3%
   company_si_accident  = insurance_base_si × 0.5%
   company_si_retirement = insurance_base_si × 14%
   company_hi           = insurance_base_si × 3%
   company_ui           = insurance_base_ui × 1%
   company_union        = base_salary × 2%

5. 직원 부담 보험
   employee_si = insurance_base_si × 8%
   employee_hi = insurance_base_si × 1.5%
   employee_ui = insurance_base_ui × 1%

6. PIT (근로소득세) 계산
   taxable_income = total_income - employee_insurance - self_deduction - dependent_deduction
   if taxable_income > 0:
     pit_amount = progressive_tax(taxable_income)  # 누진세율 적용

7. 순급여
   net_salary = total_income - total_employee_insurance - pit_amount + bonus + adjustment
```

### 4.3 한국 급여 계산 로직

```
1. 총 지급액 계산
   gross = base_pay + OT수당(연장/휴일/야간/기타) + 연차수당 + 상여
   exempt = 자가운전보조금 + 식대 + 보육수당
   total = gross + exempt

2. 4대보험 (간이세액표 기반)
   pension    = max(min(taxable, upper) - lower, 0) × pension_emp_rate
   health     = taxable × health_emp_rate
   longterm   = health × longterm_rate
   employ_ins = taxable × employ_emp_rate

3. 소득세 (간이세액표 조회)
   income_tax  = lookup_simple_tax_table(taxable_total, dependents)
   income_tax *= withholding_rate (80% / 100% / 120%)
   local_tax   = income_tax × 10%

4. 연말정산 반영 (있을 경우)
   yearend_tax   = yea_settle_tax
   yearend_local = yea_settle_local

5. 실수령액
   deduction = pension + health + longterm + employ_ins
             + income_tax + local_tax + yearend_tax + yearend_local
             + prepaid
   net_pay = gross_total - deduction
```

### 4.4 초과근무 처리 플로우

```
  직원/관리자가 OT 등록
         │
         v
  ┌──────────────┐
  │ OT 기록 생성  │
  │ (PENDING)    │
  └──────┬───────┘
         │
         v
  ┌──────────────┐
  │ Manager 승인  │──── REJECTED → 종료
  │              │
  └──────┬───────┘
         │ APPROVED
         v
  ┌──────────────────┐
  │ 변환시간 계산      │
  │                  │
  │ actual_hours ×   │
  │ OT_RATE(유형)    │
  │ = converted_hrs  │
  └──────┬───────────┘
         │
         v
  급여 계산 시 OT 수당 반영
  ot_amount = Σ(converted_hours × hourly_rate)
```

### 4.5 연차 관리 프로세스

```
연초 부여
  │
  ├── 기본 부여일수 (근속년수 기반)
  ├── 전년도 이월일수 (carry_forward)
  │
  v
사용 추적
  │
  ├── 근태에서 AL 코드 → used 증가
  ├── OT 전환 → ot_converted 증가
  │
  v
잔여일수 자동 계산
  remaining = entitlement + carry_forward - used - ot_converted
```

---

## 5. API 엔드포인트

**Base Path**: `/api/v1/hr`

### 5.1 직원 관리

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/employees` | 직원 목록 조회 | ALL |
| GET | `/employees/:id` | 직원 상세 조회 | ALL |
| POST | `/employees` | 직원 등록 | Admin |
| PATCH | `/employees/:id` | 직원 수정 | Admin |
| DELETE | `/employees/:id` | 직원 삭제 | Admin |
| GET | `/employees/:empId/dependents` | 부양가족 목록 | ALL |
| POST | `/employees/:empId/dependents` | 부양가족 등록 | Admin |
| PATCH | `/dependents/:depId` | 부양가족 수정 | Admin |
| DELETE | `/dependents/:depId` | 부양가족 삭제 | Admin |
| GET | `/employees/:empId/salary-history` | 급여 이력 조회 | ALL |
| POST | `/employees/:empId/salary-history` | 급여 변경 등록 | Admin |

### 5.2 한국 직원 확장

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/employees/:empId/kr` | KR 확장 정보 조회 | Entity |
| POST | `/employees/:empId/kr` | KR 확장 정보 등록 | Entity |
| PATCH | `/employees/:empId/kr` | KR 확장 정보 수정 | Entity |

### 5.3 프리랜서 관리

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/freelancers` | 프리랜서 목록 | Entity |
| GET | `/freelancers/:id` | 프리랜서 상세 | Entity |
| POST | `/freelancers` | 프리랜서 등록 | Entity |
| PATCH | `/freelancers/:id` | 프리랜서 수정 | Entity |
| DELETE | `/freelancers/:id` | 프리랜서 삭제 | Entity |

### 5.4 급여 처리

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/payroll` | 급여기간 목록 | ALL |
| POST | `/payroll` | 급여기간 생성 | Admin |
| GET | `/payroll/:periodId` | 급여기간 상세 | ALL |
| POST | `/payroll/:periodId/calculate` | 급여 계산 실행 | Admin |
| POST | `/payroll/:periodId/submit` | 승인 제출 | Admin |
| POST | `/payroll/:periodId/approve` | L1 승인 | Manager |
| POST | `/payroll/:periodId/finalize` | L2 최종확정 | Admin |
| POST | `/payroll/:periodId/reject` | 반려 | Manager |
| GET | `/payroll/:periodId/details` | VN 급여 상세 목록 | ALL |
| GET | `/payroll/:periodId/details/:empId` | VN 개인 급여 상세 | ALL |
| GET | `/payroll/:periodId/kr-details` | KR 급여 상세 목록 | ALL |
| GET | `/payroll/:periodId/kr-details/:empId` | KR 개인 급여 상세 | ALL |

### 5.5 근태 관리

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/timesheet?year=Y&month=M` | 월간 근태 전체 조회 | ALL |
| PUT | `/timesheet/batch` | 근태 일괄 저장 (upsert) | Admin |

### 5.6 초과근무

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/overtime?year=Y&month=M` | 월별 OT 목록 | ALL |
| POST | `/overtime` | OT 등록 | Admin |
| PATCH | `/overtime/:id` | OT 수정 | Admin |
| DELETE | `/overtime/:id` | OT 삭제 | Admin |
| PATCH | `/overtime/:id/approve` | OT 승인/반려 | Manager |

### 5.7 연차 관리

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/leave?year=Y` | 연차 잔여 목록 | ALL |
| GET | `/leave/:empId?year=Y` | 직원별 연차 상세 | ALL |
| POST | `/leave/recalculate?year=Y` | 연차 재계산 | Admin |

### 5.8 퇴직금

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/severance/calculate/:empId` | 퇴직금 시뮬레이션 | Admin |
| POST | `/severance/confirm/:empId` | 퇴직금 확정 | Admin |

### 5.9 사업소득

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/business-income` | 사업소득 목록 | Entity |
| GET | `/business-income/:id` | 사업소득 상세 | Entity |
| POST | `/business-income` | 사업소득 생성 | Entity |
| PATCH | `/business-income/:id` | 사업소득 수정 | Entity |
| DELETE | `/business-income/:id` | 사업소득 삭제 | Entity |

### 5.10 연말정산

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/yearend?tax_year=YYYY` | 연말정산 목록 | Entity |
| GET | `/yearend/:id` | 연말정산 상세 | Entity |
| POST | `/yearend` | 연말정산 등록 | Admin+Entity |
| PATCH | `/yearend/:id` | 연말정산 수정 | Admin+Entity |
| DELETE | `/yearend/:id` | 연말정산 삭제 | Admin+Entity |
| POST | `/yearend/:id/apply/:periodId` | 개별 급여 반영 | Admin+Entity |
| POST | `/yearend/apply-batch` | 일괄 급여 반영 | Admin+Entity |
| POST | `/yearend/import` | Excel 임포트 | Admin+Entity |

### 5.11 법인 관리

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/entities` | 내 법인 목록 | ALL |
| GET | `/entities/:id` | 법인 상세 | ALL |
| POST | `/entities` | 법인 생성 | Admin |
| PATCH | `/entities/:id` | 법인 수정 | Admin |
| POST | `/entities/:id/users` | 사용자 역할 할당 | Admin |
| GET | `/entities/:id/users` | 사용자 역할 목록 | Admin |
| POST | `/entities/:id/stamp` | 도장 이미지 업로드 | Admin |
| GET | `/entities/:id/stamp` | 도장 이미지 조회 | ALL |
| DELETE | `/entities/:id/stamp` | 도장 이미지 삭제 | Admin |

### 5.12 시스템 설정

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/settings/params` | 시스템 파라미터 목록 | Admin |
| GET | `/settings/params/current` | 현재 유효 파라미터 | ALL |
| POST | `/settings/params` | 파라미터 추가/변경 | Admin |
| GET | `/settings/holidays?year=Y` | 공휴일 목록 | ALL |
| POST | `/settings/holidays` | 공휴일 등록 | Admin |
| DELETE | `/settings/holidays/:id` | 공휴일 삭제 | Admin |

### 5.13 한국 설정

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/kr/insurance-params` | 4대보험 파라미터 목록 | Entity |
| POST | `/kr/insurance-params` | 4대보험 파라미터 추가 | Entity |
| DELETE | `/kr/insurance-params/:id` | 4대보험 파라미터 삭제 | Entity |
| GET | `/kr/tax-table` | 간이세액표 요약 | Entity |
| GET | `/kr/tax-table/:year` | 간이세액표 연도별 | Entity |
| POST | `/kr/tax-table/import` | 간이세액표 CSV 임포트 | Entity |
| DELETE | `/kr/tax-table/:year` | 간이세액표 연도별 삭제 | Entity |

### 5.14 보고서 (VN)

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/reports/payslip/:periodId/:empId` | 급여명세서 PDF | Admin |
| GET | `/reports/payroll-register/:periodId` | 급여대장 Excel | Admin |
| GET | `/reports/insurance/:periodId` | 보험내역서 Excel | Admin |
| GET | `/reports/pit/:periodId` | PIT 보고서 Excel | Admin |
| GET | `/reports/employee-roster` | 직원 명부 Excel | Admin |

### 5.15 보고서 (KR)

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/kr-reports/payslip/:periodId/:empId` | KR 급여명세서 PDF | Admin+Entity |
| GET | `/kr-reports/payroll-register/:periodId` | KR 급여대장 Excel | Admin+Entity |
| GET | `/kr-reports/insurance-summary/:periodId` | 4대보험 집계표 Excel | Admin+Entity |
| GET | `/kr-reports/business-income-register` | 사업소득 지급대장 Excel | Admin+Entity |
| GET | `/kr-reports/tax-accountant/:periodId` | 세무사 연동 Excel | Admin+Entity |

---

## 6. 백엔드 서비스

### 6.1 서비스 목록 (25개)

| 서비스 | 설명 |
|--------|------|
| **EmployeeService** | 직원·부양가족·급여이력 CRUD |
| **EmployeeKrService** | 한국 직원 확장정보 관리 |
| **FreelancerService** | 프리랜서 CRUD |
| **PayrollService** | 급여기간 관리, 상태 전이, 승인 워크플로우 |
| **PayrollCalcService** | 베트남 급여 계산 엔진 |
| **KrPayrollCalcService** | 한국 급여 계산 엔진 |
| **KrInsuranceCalcService** | 한국 4대보험 계산 |
| **KrTaxCalcService** | 한국 소득세 계산 (간이세액표) |
| **TimesheetService** | 월간 근태 조회/일괄 저장 |
| **OtRecordService** | 초과근무 CRUD + 승인 |
| **LeaveService** | 연차 잔액 조회/재계산 |
| **SeveranceService** | 퇴직금 시뮬레이션/확정 |
| **EntityService** | 법인 CRUD, 사용자 역할, 도장 관리 |
| **SystemParamService** | 시스템 파라미터 관리 |
| **BusinessIncomeService** | 사업소득 지급 관리 |
| **YearendAdjustmentService** | 연말정산 관리 + 급여 반영 |
| **InsuranceParamsKrService** | 한국 4대보험 파라미터 관리 |
| **TaxTableService** | 간이세액표 관리/CSV 임포트 |
| **HrReportService** | VN 보고서 생성 (Excel) |
| **KrReportService** | KR 보고서 생성 (Excel) |
| **PayslipPdfService** | VN 급여명세서 PDF 생성 |
| **KrPayslipPdfService** | KR 급여명세서 PDF 생성 |
| **HrSeedService** | HR 초기 데이터 시딩 |
| **EmployeeSeedService** | 직원 초기 데이터 시딩 |
| **EntitySeedService** | 법인 초기 데이터 시딩 |

### 6.2 급여 계산 엔진 상세

#### PayrollCalcService (베트남)

```
calculateForPeriod(periodId):
  1. 해당 기간의 모든 직원 조회 (OFFICIAL + PROBATION)
  2. 각 직원별 최신 급여 이력 조회
  3. 근태 데이터에서 실제 근무일수 계산
  4. OT 승인된 기록에서 OT 금액 계산
  5. 보험 계산 (시스템 파라미터 기반 요율 적용)
  6. PIT 세금 계산 (누진세율 + 부양가족 공제)
  7. 순급여 계산
  8. PayrollDetail 엔티티 생성/갱신
```

#### KrPayrollCalcService (한국)

```
calculateForPeriod(periodId):
  1. 한국 법인 직원 조회 + KR 확장정보
  2. 최신 급여 이력 조회
  3. 과세/비과세 항목 분리
  4. 4대보험 계산 (InsuranceParamsKr 기반)
     - 면제 여부 확인 (pension_exempt, health_exempt, employ_exempt)
     - 상한/하한 범위 적용
  5. 소득세 계산 (간이세액표 lookup)
     - 원천징수율 적용 (80/100/120%)
     - 지방소득세 = 소득세 × 10%
  6. 연말정산 반영 (있을 경우)
  7. PayrollEntryKr 엔티티 생성/갱신
```

---

## 7. 프론트엔드 구성

### 7.1 페이지 구성

| 페이지 | 경로 | 설명 |
|--------|------|------|
| HrLayout | `/hr` | HR 모듈 레이아웃 + 좌측 네비게이션 |
| EmployeeListPage | `/hr/employees` | 직원 목록 (검색/필터/정렬) |
| EmployeeDetailPage | `/hr/employees/:id` | 직원 상세 (탭: 기본정보/급여/부양가족/KR정보) |
| FreelancerListPage | `/hr/freelancers` | 프리랜서 목록 |
| FreelancerDetailPage | `/hr/freelancers/:id` | 프리랜서 상세 |
| PayrollListPage | `/hr/payroll` | 급여기간 목록 (상태별 필터) |
| PayrollDetailPage | `/hr/payroll/:periodId` | 급여 상세 (VN/KR 탭 전환) |
| TimesheetPage | `/hr/timesheet` | 달력형 근태 입력 그리드 |
| OvertimePage | `/hr/overtime` | 초과근무 등록/승인 |
| LeavePage | `/hr/leave` | 연차 현황 테이블 |
| SeverancePage | `/hr/severance` | 퇴직금 시뮬레이션 |
| BusinessIncomePage | `/hr/business-income` | 사업소득 지급 관리 |
| YearendAdjustmentPage | `/hr/yearend` | 연말정산 관리 |
| HrReportsPage | `/hr/reports` | 보고서 다운로드 허브 |
| HrSettingsPage | `/hr/settings` | HR 설정 (탭 구성) |

### 7.2 주요 컴포넌트

**직원 상세 탭 구성:**

```
EmployeeDetailPage
├── EmployeeBasicInfoTab      # 기본정보 (인적사항, 근무정보)
├── EmployeeSalaryTab         # 급여정보 (급여이력 테이블, 신규 등록)
├── EmployeeDependentsTab     # 부양가족 (목록, 등록, 수정, 삭제)
└── EmployeeKrInfoTab         # 한국 정보 (4대보험, 세금, 계좌)
```

**급여 상세 구성:**

```
PayrollDetailPage
├── PayrollStatusBadge        # 현재 상태 배지
├── PayrollProcessing         # 계산/제출/승인/반려 버튼
├── PayrollSummaryTable       # 급여 요약 테이블
└── PayrollDetailView         # 개인별 급여 상세 뷰
```

**근태 관리 구성:**

```
TimesheetPage
├── 연월 선택기
├── TimesheetGrid             # 직원×날짜 그리드 (셀 클릭 입력)
│   └── AttendanceCodeSelector  # 출석코드 드롭다운
└── TimesheetSummary          # 월간 합계 (근무일, 휴가일, 부재일)
```

**HR 설정 탭 구성:**

```
HrSettingsPage
├── HolidayCalendarTab        # 공휴일 달력 관리
├── OtRatesTab                # OT 배수 설정
├── TaxBracketsTab            # VN 세금 구간 설정
├── RegionalWagesTab          # VN 지역별 최저임금
├── InsuranceRatesTab         # VN 보험요율 설정
├── KrInsuranceParamsTab      # KR 4대보험 요율
└── KrTaxTableTab             # KR 간이세액표 (CSV 임포트)
```

### 7.3 React Query 훅 구성

| 훅 파일 | 주요 훅 |
|---------|---------|
| useEmployees | `useEmployeeList`, `useEmployeeDetail`, `useCreateEmployee`, `useUpdateEmployee`, `useDeleteEmployee`, `useDependentList`, `useCreateDependent`, `useUpdateDependent`, `useDeleteDependent`, `useSalaryHistoryList`, `useCreateSalaryHistory` |
| usePayroll | `usePayrollPeriods`, `usePayrollPeriod`, `useCreatePeriod`, `useCalculatePayroll`, `useSubmitPayroll`, `useApprovePayroll`, `useFinalizePayroll`, `useRejectPayroll`, `usePayrollDetails` |
| useTimesheet | `useMonthlyTimesheet`, `useBatchUpsert` |
| useOvertime | `useMonthlyOtRecords`, `useCreateOtRecord`, `useUpdateOtRecord`, `useDeleteOtRecord`, `useApproveOtRecord` |
| useLeave | `useLeaveBalances`, `useEmployeeLeaveBalance`, `useRecalculateLeave` |
| useSeverance | `useCalculateSeverance`, `useConfirmSeverance` |
| useEntity | `useMyEntities`, `useEntityDetail`, `useCreateEntity`, `useUpdateEntity`, `useAssignUserRole`, `useEntityRoles` |
| useEmployeeKr | `useGetKrInfo`, `useCreateKrInfo`, `useUpdateKrInfo` |
| useFreelancer | `useFreelancers`, `useFreelancerDetail`, `useCreateFreelancer`, `useUpdateFreelancer`, `useDeleteFreelancer` |
| useBusinessIncome | `useBusinessPayments`, `useBusinessPaymentDetail`, `useCreateBusinessPayment`, `useUpdateBusinessPayment`, `useDeleteBusinessPayment` |
| useYearendAdjustment | `useYearendAdjustmentList`, `useYearendAdjustmentDetail`, `useCreateYearendAdjustment`, `useUpdateYearendAdjustment`, `useDeleteYearendAdjustment`, `useApplyYearendAdjustment` |
| useKrSettings | `useInsuranceParams`, `useCreateInsuranceParam`, `useDeleteInsuranceParam`, `useTaxTable`, `useTaxTableByYear`, `useImportTaxTable`, `useDeleteTaxTable` |
| useHrSettings | `useSystemParams`, `useCurrentParams`, `useUpsertParam`, `useHolidays`, `useCreateHoliday`, `useDeleteHoliday` |
| useHrReports | `useDownloadPayslip`, `useDownloadPayrollRegister`, `useDownloadInsuranceReport`, `useDownloadPitReport`, `useDownloadEmployeeRoster` |

---

## 8. 에러 코드

HR 모듈은 **E5xxx** 계열 에러 코드를 사용한다.

| 코드 | 메시지 | 설명 |
|------|--------|------|
| E5001 | EMPLOYEE_NOT_FOUND | 직원을 찾을 수 없음 |
| E5002 | EMPLOYEE_CODE_DUPLICATE | 직원 코드 중복 |
| E5003 | INVALID_PAYROLL_STATUS | 잘못된 급여 상태 전이 |
| E5004 | PAYROLL_PERIOD_EXISTS | 해당 월 급여기간 이미 존재 |
| E5005 | DEPENDENT_NOT_FOUND | 부양가족을 찾을 수 없음 |
| E5006 | ENTITY_NOT_FOUND | 법인을 찾을 수 없음 |
| E5007 | ENTITY_CODE_DUPLICATE | 법인 코드 중복 |
| E5008 | FREELANCER_NOT_FOUND | 프리랜서를 찾을 수 없음 |
| E5009 | FREELANCER_CODE_DUPLICATE | 프리랜서 코드 중복 |
| E5010 | OT_RECORD_NOT_FOUND | 초과근무 기록을 찾을 수 없음 |
| E5011 | YEAREND_DUPLICATE | 해당 연도 연말정산 이미 존재 |
| E5012 | INSURANCE_PARAMS_NOT_FOUND | 보험 파라미터를 찾을 수 없음 |

---

## 9. 다국어 지원 (i18n)

### 9.1 번역 파일 구조

```
apps/web/src/locales/
├── en/hr.json    # 영어
├── ko/hr.json    # 한국어
└── vi/hr.json    # 베트남어
```

### 9.2 주요 번역 키 네임스페이스

```json
{
  "title": "HR" / "인사관리" / "Quản lý nhân sự",
  "entity": { "select", "name", "code", "country", "currency" },
  "menu": {
    "employees", "timesheet", "overtime", "leave", "payroll",
    "severance", "reports", "settings", "freelancers",
    "businessIncome", "yearend"
  },
  "employee": {
    "list": { "title", "subtitle", "addNew", "search", "empty" },
    "form": { "code", "fullName", "nationality", "startDate", ... },
    "displayStatus": { "active", "inactive", "probation", ... }
  },
  "payroll": { ... },
  "timesheet": { ... },
  "overtime": { ... },
  "leave": { ... },
  "severance": { ... },
  "reports": { ... },
  "settings": { ... }
}
```

### 9.3 사용 방식

```tsx
const { t } = useTranslation(['hr', 'common']);

// 사용 예
<h1>{t('hr:title')}</h1>
<span>{t('hr:employee.form.fullName')}</span>
<button>{t('common:save')}</button>
```

---

## 10. 보안 및 접근 제어

### 10.1 Guard 체계

| Guard | 역할 | 적용 범위 |
|-------|------|----------|
| **AdminGuard** | ADMIN 역할만 접근 허용 | 직원/급여 생성·수정·삭제, 보고서 생성 |
| **ManagerGuard** | MANAGER 이상 접근 허용 | 급여 L1 승인, OT 승인/반려 |
| **EntityGuard** | 법인별 데이터 격리 | 프리랜서, KR 직원, 사업소득, 연말정산, KR 설정 |

### 10.2 데이터 격리

- 모든 엔티티에 `ent_id` (법인 ID) 외래 키 존재
- EntityGuard가 요청 헤더의 `X-Entity-Id` 또는 사용자의 법인 매핑을 검증
- 사용자는 자신에게 할당된 법인의 데이터만 조회/수정 가능

### 10.3 민감 데이터 보호

- 주민등록번호(`ekr_resident_no`, `frl_resident_no`): 암호화 저장 (VARCHAR 256)
- 급여 데이터: Admin 권한 필요
- 보고서 다운로드: Admin 권한 필요

---

## 11. 다국가 급여 체계

### 11.1 베트남 (VN) 급여 특성

| 항목 | 설명 |
|------|------|
| **통화** | VND (베트남 동) + USD 병기 |
| **급여 유형** | GROSS (세전) / NET (세후) |
| **보험 체계** | SI (사회보험) + HI (건강보험) + UI (실업보험) |
| **세금** | PIT 누진세율 (5%~35%) |
| **지역 구분** | REGION_1~4 (최저임금 차등) |
| **근무 형태** | MON_FRI (주5일) / MON_SAT (주6일) |
| **부양가족 공제** | 1인당 4,400,000 VND/월 |

### 11.2 한국 (KR) 급여 특성

| 항목 | 설명 |
|------|------|
| **통화** | KRW (한국 원) |
| **4대보험** | 국민연금 + 건강보험 + 장기요양 + 고용보험 |
| **세금** | 간이세액표 기반 원천징수 |
| **원천징수율** | 80% / 100% / 120% 선택 |
| **비과세 항목** | 식대, 자가운전보조금, 보육수당 |
| **연말정산** | 매년 1회, 추가납부/환급 처리 |
| **직원 유형** | REGULAR/CONTRACT/DAILY/REPRESENTATIVE/INTERN |
| **보험 면제** | 직원별 연금/건강/고용 면제 설정 가능 |

### 11.3 보고서 체계

**VN 보고서:**
- 급여명세서 (PDF) - 직원별 상세 급여 내역
- 급여대장 (Excel) - 전체 직원 급여 요약
- 보험내역서 (Excel) - 사업주/직원 부담 보험 상세
- PIT 보고서 (Excel) - 세무신고용 근로소득세 내역
- 직원 명부 (Excel) - 전체 직원 마스터 데이터

**KR 보고서:**
- 급여명세서 (PDF) - 한국 양식 급여명세서
- 급여대장 (Excel) - 한국식 급여대장
- 4대보험 집계표 (Excel) - 보험료 내역 집계
- 사업소득 지급대장 (Excel) - 프리랜서 지급 내역
- 세무사 연동 (Excel) - 세무대리인 제공용 데이터

---

> **참고**: 이 문서는 소스 코드를 기반으로 자동 생성되었으며, 구현 변경 시 업데이트가 필요합니다.
