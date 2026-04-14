# AMB Management - Database Schema Reference

> Auto-generated: 2026-04-14
> Source: `apps/api/src/domain/**/entity/*.entity.ts`, `apps/portal-api/src/domain/**/entity/*.entity.ts`

## Table of Contents

| # | Domain | Tables | Description |
|---|--------|--------|-------------|
| 1 | [Auth](#1-auth) | 2 | 사용자, 비밀번호 초기화 |
| 2 | [HR](#2-hr) | 20 | 법인, 직원, 급여, 근태, 휴가, 보험 |
| 3 | [Invitation](#3-invitation) | 1 | 초대 |
| 4 | [Members](#4-members) | 2 | 셀, 사용자-셀 매핑 |
| 5 | [Unit](#5-unit) | 2 | 조직 단위, 사용자-유닛 역할 |
| 6 | [Issues](#6-issues) | 6 | 이슈, 댓글, 참여자, 상태로그 |
| 7 | [Todo](#7-todo) | 4 | 할일, 댓글, 참여자, 상태로그 |
| 8 | [Project](#8-project) | 8 | 프로젝트, 멤버, 에픽, 컴포넌트, 리뷰 |
| 9 | [Meeting Notes](#9-meeting-notes) | 9 | 회의록, 댓글, 폴더, 링크 |
| 10 | [Today](#10-today) | 4 | 데일리 미션, 스냅샷, 리포트 |
| 11 | [Report](#11-report) | 1 | 업무 보고서 |
| 12 | [Chat](#12-chat) | 2 | AI 대화, 메시지 |
| 13 | [Amoeba Talk](#13-amoeba-talk) | 7 | 채팅 채널, 메시지, 반응, 읽음 |
| 14 | [Notices](#14-notices) | 3 | 공지, 첨부파일, 읽음 |
| 15 | [Notification](#15-notification) | 2 | 알림, 웹푸시 구독 |
| 16 | [Calendar](#16-calendar) | 5 | 일정, 참석자, 반복, 알림 |
| 17 | [Translation](#17-translation) | 4 | 번역, 이력, 용어집, 사용량 |
| 18 | [KMS](#18-kms) | 16 | 문서 자산, 태그, DDD 대시보드 |
| 19 | [ACL](#19-acl) | 5 | 작업 항목, 공유, 감사로그 |
| 20 | [Activity Index](#20-activity-index) | 5 | 활동 지수, 평가, 일별 통계 |
| 21 | [Accounting](#21-accounting) | 5 | 은행계좌, 거래, 분석 |
| 22 | [Billing](#22-billing) | 10 | 파트너, 계약, 인보이스, 결제 |
| 23 | [Expense Request](#23-expense-request) | 7 | 경비 신청, 승인, 예측 |
| 24 | [Service Management](#24-service-management) | 7 | 고객사, 서비스, 구독 |
| 25 | [Subscription](#25-subscription) | 10 | 플랜, 구독, 토큰 월렛 |
| 26 | [Payment Gateway](#26-payment-gateway) | 4 | PG 설정, 트랜잭션, AI 충전 |
| 27 | [Asset](#27-asset) | 6 | 자산, 예약, 승인 |
| 28 | [Attendance](#28-attendance) | 3 | 출근, 정책, 수정 |
| 29 | [Settings](#29-settings) | 10 | API키, 메뉴, SMTP, 사이트 |
| 30 | [Entity Settings](#30-entity-settings) | 7 | 법인별 AI/메뉴/사이트 설정 |
| 31 | [Agent](#31-agent) | 1 | AI 에이전트 설정 |
| 32 | [AI Usage](#32-ai-usage) | 3 | AI 토큰 사용량, 쿼터 |
| 33 | [OAuth](#33-oauth) | 3 | OAuth 인증코드, 토큰, API로그 |
| 34 | [Partner App](#34-partner-app) | 3 | 파트너 앱, 버전, 설치 |
| 35 | [Partner](#35-partner) | 1 | 파트너 조직 |
| 36 | [Slack Integration](#36-slack-integration) | 3 | Slack 워크스페이스, 채널, 메시지 매핑 |
| 37 | [Asana Integration](#37-asana-integration) | 2 | Asana 프로젝트/태스크 매핑 |
| 38 | [External Task Import](#38-external-task-import) | 2 | 외부 태스크 가져오기 |
| 39 | [Site Management (CMS)](#39-site-management-cms) | 10 | CMS 메뉴, 페이지, 포스트 |
| 40 | [Drive](#40-drive) | 1 | Google Drive 폴더 |
| 41 | [Client Portal](#41-client-portal) | 1 | 클라이언트 초대 |
| 42 | [Portal Bridge](#42-portal-bridge) | 3 | 포탈-내부 사용자 매핑 |
| 43 | [Analytics](#43-analytics) | 1 | 사이트 이벤트 로그 |
| 44 | [Admin](#44-admin) | 1 | 사이트 에러 로그 |
| 45 | [Migration](#45-migration) | 2 | Redmine 마이그레이션 |
| 46 | [Polar](#46-polar) | 1 | Polar 웹훅 이벤트 |
| 47 | [Portal API](#47-portal-api) | 3 | 포탈 고객, 결제, 이벤트 |

**Total: ~190 tables across 47 domains**

---

## Naming Conventions

- **Table**: `amb_` prefix + snake_case 복수형 (예: `amb_users`, `amb_issues`)
- **Column**: 3자 prefix + snake_case (예: `usr_email`, `iss_title`)
- **PK**: `{prefix}_id` (UUID, auto-generated)
- **Soft Delete**: `{prefix}_deleted_at` (nullable timestamp)
- **Timestamps**: `{prefix}_created_at`, `{prefix}_updated_at`
- **Entity 격리**: `ent_id` (법인 FK) - USER_LEVEL 필수 필터

---

## 1. Auth

### amb_users
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| usr_id | UUID | NO | gen | PK |
| usr_email | VARCHAR(200) | NO | | 이메일 |
| usr_password | VARCHAR(200) | NO | | 비밀번호 해시 |
| usr_name | VARCHAR(50) | NO | | 이름 |
| usr_unit | VARCHAR(30) | NO | | 부서 |
| usr_role | VARCHAR(20) | NO | MEMBER | 역할 |
| usr_company_email | VARCHAR(200) | YES | | 회사 이메일 (unique) |
| usr_token_version | INT | NO | 0 | 토큰 버전 |
| usr_signature_image | BYTEA | YES | | 서명 이미지 |
| usr_level_code | VARCHAR(30) | NO | USER_LEVEL | 레벨: ADMIN_LEVEL, USER_LEVEL |
| usr_status | VARCHAR(20) | NO | PENDING | PENDING/ACTIVE/INACTIVE/SUSPENDED/WITHDRAWN |
| usr_must_change_pw | BOOLEAN | NO | false | 최초 로그인 비밀번호 변경 필수 |
| usr_join_method | VARCHAR(20) | YES | | SEED/REGISTER/INVITE |
| usr_company_id | UUID | YES | | 소속 회사 FK |
| usr_cli_id | UUID | YES | | 클라이언트 FK (CLIENT_LEVEL) |
| usr_partner_id | UUID | YES | | 파트너 FK (PARTNER_LEVEL) |
| usr_approved_by | UUID | YES | | 승인자 |
| usr_approved_at | TIMESTAMP | YES | | 승인 일시 |
| usr_invited_by | UUID | YES | | 초대자 |
| usr_job_title | VARCHAR(100) | YES | | 직함 |
| usr_phone | VARCHAR(30) | YES | | 전화번호 |
| usr_profile_image | BYTEA | YES | | 프로필 이미지 |
| usr_last_login_at | TIMESTAMP | YES | | 마지막 로그인 |
| usr_failed_login_count | INT | NO | 0 | 로그인 실패 횟수 |
| usr_locked_until | TIMESTAMP | YES | | 계정 잠금 시각 |
| usr_translation_prefs | JSONB | YES | | 번역 설정 |
| usr_issue_filter_presets | JSONB | YES | | 이슈 필터 프리셋 |
| usr_timezone | VARCHAR(50) | NO | Asia/Ho_Chi_Minh | 타임존 |
| usr_locale | VARCHAR(10) | NO | vi | UI 언어 |
| usr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| usr_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| usr_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_password_resets
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| prs_id | UUID | NO | gen | PK |
| usr_id | UUID | NO | | 사용자 FK |
| prs_token | VARCHAR(100) | NO | | 리셋 토큰 (unique) |
| prs_expires_at | TIMESTAMP | NO | | 만료 시각 |
| prs_used_at | TIMESTAMP | YES | | 사용 시각 |
| prs_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 2. HR

### amb_hr_entities
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ent_id | UUID | NO | gen | PK |
| ent_code | VARCHAR(10) | NO | | 법인 코드 (unique) |
| ent_name | VARCHAR(200) | NO | | 법인명 (현지어) |
| ent_name_en | VARCHAR(200) | YES | | 법인명 (영문) |
| ent_country | VARCHAR(5) | NO | | 국가 코드 |
| ent_currency | VARCHAR(5) | NO | | 통화 코드 |
| ent_reg_no | VARCHAR(50) | YES | | 사업자등록번호 |
| ent_address | TEXT | YES | | 주소 |
| ent_representative | VARCHAR(100) | YES | | 대표자 |
| ent_phone | VARCHAR(20) | YES | | 전화번호 |
| ent_email | VARCHAR(100) | YES | | 이메일 |
| ent_pay_day | INT | NO | 25 | 급여일 |
| ent_pay_period_type | VARCHAR(30) | NO | MONTHLY_FULL | 급여 기간 유형 |
| ent_pay_period_start | SMALLINT | NO | 1 | 급여 시작일 |
| ent_pay_period_end | SMALLINT | NO | 31 | 급여 종료일 |
| ent_work_hours_per_day | SMALLINT | NO | 8 | 일 근무시간 |
| ent_work_days_per_week | SMALLINT | NO | 5 | 주 근무일수 |
| ent_leave_base_days | SMALLINT | NO | 15 | 연차 기본일수 |
| ent_status | VARCHAR(10) | NO | ACTIVE | 상태 |
| ent_stamp_image | BYTEA | YES | | 법인 도장 이미지 |
| ent_level | VARCHAR(20) | NO | SUBSIDIARY | 계층: HQ/SUBSIDIARY |
| ent_parent_id | UUID | YES | | 상위 법인 FK |
| ent_is_hq | BOOLEAN | NO | false | 본사 여부 |
| ent_sort_order | INT | NO | 0 | 정렬 순서 |
| ent_email_display_name | VARCHAR(200) | YES | | 이메일 표시 이름 |
| ent_email_brand_color | VARCHAR(10) | YES | | 이메일 브랜드 색상 |
| ent_email_logo_url | VARCHAR(500) | YES | | 이메일 로고 URL |
| ent_created_at | TIMESTAMP | NO | NOW() | 생성 |
| ent_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_entity_user_roles
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| eur_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| eur_role | VARCHAR(20) | NO | | 법인 내 역할 |
| eur_status | VARCHAR(10) | NO | ACTIVE | 상태 |
| eur_hidden_from_today | BOOLEAN | NO | false | Today 숨김 |
| eur_hidden_from_attendance | BOOLEAN | NO | false | 출근부 숨김 |
| eur_is_owner | BOOLEAN | NO | false | 법인 오너 여부 |
| eur_attendance_order | INT | YES | | 출근부 순서 |
| eur_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_hr_employees
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| emp_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | YES | | 사용자 FK |
| emp_code | VARCHAR(20) | NO | | 사원 코드 (unique) |
| emp_full_name | VARCHAR(100) | NO | | 이름 |
| emp_nationality | VARCHAR(20) | NO | VIETNAMESE | 국적 |
| emp_cccd_number | VARCHAR(20) | NO | | CCCD/ID 번호 (unique) |
| emp_tax_code | VARCHAR(20) | YES | | 세금 코드 |
| emp_si_number | VARCHAR(20) | YES | | 사회보험 번호 |
| emp_hospital_code | VARCHAR(100) | YES | | 병원 코드 |
| emp_start_date | DATE | NO | | 입사일 |
| emp_end_date | DATE | YES | | 퇴사일 |
| emp_status | VARCHAR(20) | NO | PROBATION | 상태 |
| emp_contract_type | VARCHAR(20) | NO | EMPLOYEE | 계약 유형 |
| emp_department | VARCHAR(50) | NO | | 부서 |
| emp_position | VARCHAR(50) | NO | | 직위 |
| emp_region | VARCHAR(20) | NO | REGION_1 | 지역 |
| emp_salary_type | VARCHAR(10) | NO | GROSS | 급여 유형 |
| emp_work_schedule | VARCHAR(10) | NO | MON_FRI | 근무 스케줄 |
| emp_memo | TEXT | YES | | 메모 |
| emp_created_at | TIMESTAMP | NO | NOW() | 생성 |
| emp_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| emp_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_hr_employees_kr
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ekr_id | UUID | NO | gen | PK |
| emp_id | UUID | NO | | 직원 FK (unique) |
| ekr_resident_no | VARCHAR(256) | YES | | 주민번호 (암호화) |
| ekr_employee_type | VARCHAR(20) | NO | | 한국 직원 유형 |
| ekr_pension_no | VARCHAR(20) | YES | | 연금 번호 |
| ekr_health_ins_no | VARCHAR(20) | YES | | 건강보험 번호 |
| ekr_employ_ins_no | VARCHAR(20) | YES | | 고용보험 번호 |
| ekr_pension_exempt | BOOLEAN | NO | false | 연금 면제 |
| ekr_health_exempt | BOOLEAN | NO | false | 건강보험 면제 |
| ekr_employ_exempt | BOOLEAN | NO | false | 고용보험 면제 |
| ekr_tax_dependents | INT | NO | 1 | 부양가족 수 |
| ekr_withholding_rate | VARCHAR(5) | NO | 100 | 원천징수율 |
| ekr_bank_account | VARCHAR(50) | YES | | 은행 계좌 |
| ekr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| ekr_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_dependents
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| dep_id | UUID | NO | gen | PK |
| emp_id | UUID | NO | | 직원 FK |
| dep_name | VARCHAR(100) | NO | | 이름 |
| dep_relationship | VARCHAR(30) | NO | | 관계 |
| dep_date_of_birth | DATE | NO | | 생년월일 |
| dep_cccd_number | VARCHAR(20) | YES | | CCCD/ID 번호 |
| dep_tax_code | VARCHAR(20) | YES | | 세금 코드 |
| dep_effective_from | DATE | NO | | 유효 시작일 |
| dep_effective_to | DATE | YES | | 유효 종료일 |
| dep_created_at | TIMESTAMP | NO | NOW() | 생성 |
| dep_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| dep_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_hr_freelancers
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| frl_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| frl_code | VARCHAR(10) | NO | | 프리랜서 코드 |
| frl_full_name | VARCHAR(100) | NO | | 이름 |
| frl_resident_no | VARCHAR(256) | YES | | 주민번호 (암호화) |
| frl_nationality | VARCHAR(5) | YES | | 국적 |
| frl_address | TEXT | YES | | 주소 |
| frl_phone | VARCHAR(20) | YES | | 전화번호 |
| frl_contract_start | DATE | YES | | 계약 시작일 |
| frl_contract_end | DATE | YES | | 계약 종료일 |
| frl_contract_amount | DECIMAL(15,0) | NO | 0 | 계약 금액 |
| frl_monthly_amount | DECIMAL(15,0) | NO | 0 | 월 금액 |
| frl_payment_type | VARCHAR(20) | NO | BUSINESS_INCOME | 지급 유형 |
| frl_tax_rate | DECIMAL(4,2) | NO | 3.0 | 세율 |
| frl_status | VARCHAR(15) | NO | ACTIVE | 상태 |
| frl_created_at | TIMESTAMP | NO | NOW() | 생성 |
| frl_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| frl_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_hr_salary_history
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| slh_id | UUID | NO | gen | PK |
| emp_id | UUID | NO | | 직원 FK |
| slh_base_salary_vnd | DECIMAL(15,0) | NO | 0 | 기본급 VND |
| slh_base_salary_krw | DECIMAL(15,0) | NO | 0 | 기본급 KRW |
| slh_base_salary_usd | DECIMAL(15,2) | NO | 0 | 기본급 USD |
| slh_exchange_rate_krw | DECIMAL(10,0) | NO | 1 | KRW 환율 |
| slh_exchange_rate_usd | DECIMAL(10,0) | NO | 1 | USD 환율 |
| slh_meal_allowance | DECIMAL(15,0) | NO | 0 | 식대 |
| slh_cskh_allowance | DECIMAL(15,0) | NO | 0 | CSKH 수당 |
| slh_fuel_allowance | DECIMAL(15,0) | NO | 0 | 유류비 |
| slh_parking_allowance | DECIMAL(15,0) | NO | 0 | 주차비 |
| slh_other_allowance | DECIMAL(15,0) | NO | 0 | 기타 수당 |
| slh_effective_date | DATE | NO | | 적용일 |
| slh_created_at | TIMESTAMP | NO | NOW() | 생성 |
| slh_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_payroll_periods
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pyp_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| pyp_year | INT | NO | | 연도 |
| pyp_month | INT | NO | | 월 |
| pyp_status | VARCHAR(30) | NO | DRAFT | 상태 |
| pyp_payment_date | DATE | YES | | 지급일 |
| pyp_approved_by_l1 | UUID | YES | | L1 승인자 |
| pyp_approved_by_l2 | UUID | YES | | L2 승인자 |
| pyp_finalized_at | TIMESTAMP | YES | | 확정 일시 |
| pyp_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pyp_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_payroll_details
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pyd_id | UUID | NO | gen | PK |
| pyp_id | UUID | NO | | 급여기간 FK |
| emp_id | UUID | NO | | 직원 FK |
| pyd_base_salary | DECIMAL(15,0) | NO | 0 | 기본급 |
| pyd_actual_salary | DECIMAL(15,0) | NO | 0 | 실급여 |
| pyd_meal_allowance | DECIMAL(15,0) | NO | 0 | 식대 |
| pyd_cskh_allowance | DECIMAL(15,0) | NO | 0 | CSKH 수당 |
| pyd_fuel_allowance | DECIMAL(15,0) | NO | 0 | 유류비 |
| pyd_other_allowance | DECIMAL(15,0) | NO | 0 | 기타 수당 |
| pyd_total_income | DECIMAL(15,0) | NO | 0 | 총소득 |
| pyd_insurance_base_si | DECIMAL(15,0) | NO | 0 | 사회보험 기준 |
| pyd_insurance_base_ui | DECIMAL(15,0) | NO | 0 | 고용보험 기준 |
| pyd_company_si_sickness | DECIMAL(15,0) | NO | 0 | 회사 SI 질병 |
| pyd_company_si_accident | DECIMAL(15,0) | NO | 0 | 회사 SI 산재 |
| pyd_company_si_retirement | DECIMAL(15,0) | NO | 0 | 회사 SI 퇴직 |
| pyd_company_hi | DECIMAL(15,0) | NO | 0 | 회사 건강보험 |
| pyd_company_ui | DECIMAL(15,0) | NO | 0 | 회사 고용보험 |
| pyd_company_union | DECIMAL(15,0) | NO | 0 | 회사 조합비 |
| pyd_total_company_insurance | DECIMAL(15,0) | NO | 0 | 회사 보험 합계 |
| pyd_employee_si | DECIMAL(15,0) | NO | 0 | 직원 SI |
| pyd_employee_hi | DECIMAL(15,0) | NO | 0 | 직원 건강보험 |
| pyd_employee_ui | DECIMAL(15,0) | NO | 0 | 직원 고용보험 |
| pyd_total_employee_insurance | DECIMAL(15,0) | NO | 0 | 직원 보험 합계 |
| pyd_self_deduction | DECIMAL(15,0) | NO | 0 | 본인 공제 |
| pyd_dependent_deduction | DECIMAL(15,0) | NO | 0 | 부양가족 공제 |
| pyd_num_dependents | INT | NO | 0 | 부양가족 수 |
| pyd_tax_exempt_income | DECIMAL(15,0) | NO | 0 | 비과세 소득 |
| pyd_taxable_income | DECIMAL(15,0) | NO | 0 | 과세 소득 |
| pyd_pit_amount | DECIMAL(15,0) | NO | 0 | PIT |
| pyd_ot_amount | DECIMAL(15,0) | NO | 0 | 초과근무 수당 |
| pyd_annual_leave_salary | DECIMAL(15,0) | NO | 0 | 연차 수당 |
| pyd_bonus | DECIMAL(15,0) | NO | 0 | 상여금 |
| pyd_adjustment | DECIMAL(15,0) | NO | 0 | 조정액 |
| pyd_standard_working_days | INT | NO | 0 | 기준 근무일수 |
| pyd_actual_working_days | DECIMAL(4,1) | NO | 0 | 실 근무일수 |
| pyd_net_salary_vnd | DECIMAL(15,0) | NO | 0 | 실수령액 VND |
| pyd_net_salary_usd | DECIMAL(15,2) | NO | 0 | 실수령액 USD |
| pyd_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pyd_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_payroll_entries_kr
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pkr_id | UUID | NO | gen | PK |
| pyp_id | UUID | NO | | 급여기간 FK |
| emp_id | UUID | NO | | 직원 FK |
| ent_id | UUID | NO | | 법인 FK |
| pkr_base_pay ~ pkr_net_pay | DECIMAL(15,0) | NO | 0 | 한국 급여 항목 (30+ 컬럼: 기본급, 연장/휴일/야간 OT, 연차수당, 상여, 차량보조, 식대, 보육, 과세/비과세 합계, 4대보험, 소득세/지방세, 연말정산, 선급, 공제합계, 실수령액) |
| pkr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pkr_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_business_income_payments
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| bip_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| frl_id | UUID | NO | | 프리랜서 FK |
| bip_year_month | VARCHAR(7) | NO | | 지급 연월 |
| bip_payment_date | DATE | YES | | 지급일 |
| bip_gross_amount ~ bip_net_amount | DECIMAL(15,0) | NO | 0 | 사업소득 항목 (총액, 주휴, 인센티브, 합계, 선급, 소득세, 지방세, 고용보험, 산재보험, 학자금, 공제합계, 실수령액) |
| bip_status | VARCHAR(15) | NO | DRAFT | 상태 |
| bip_created_at | TIMESTAMP | NO | NOW() | 생성 |
| bip_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_timesheets
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tms_id | UUID | NO | gen | PK |
| emp_id | UUID | NO | | 직원 FK |
| pyp_id | UUID | YES | | 급여기간 FK |
| tms_work_date | DATE | NO | | 근무일 |
| tms_attendance_code | VARCHAR(10) | YES | | 출근 코드 |
| tms_work_hours | DECIMAL(4,1) | NO | 0 | 근무시간 |
| tms_created_at | TIMESTAMP | NO | NOW() | 생성 |
| tms_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_leave_balances
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| lvb_id | UUID | NO | gen | PK |
| emp_id | UUID | NO | | 직원 FK |
| lvb_year | INT | NO | | 연도 |
| lvb_entitlement | DECIMAL(5,1) | NO | 0 | 부여 일수 |
| lvb_used | DECIMAL(5,1) | NO | 0 | 사용 일수 |
| lvb_ot_converted | DECIMAL(5,1) | NO | 0 | OT 전환 일수 |
| lvb_carry_forward | DECIMAL(5,1) | NO | 0 | 이월 일수 |
| lvb_remaining | DECIMAL(5,1) | NO | 0 | 잔여 일수 |
| lvb_created_at | TIMESTAMP | NO | NOW() | 생성 |
| lvb_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_leave_requests
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| lrq_id | UUID | NO | gen | PK |
| emp_id | UUID | NO | | 직원 FK |
| usr_id | UUID | NO | | 사용자 FK |
| ent_id | UUID | YES | | 법인 FK |
| lrq_type | VARCHAR(20) | NO | | ANNUAL/AM_HALF/PM_HALF/SICK/SPECIAL |
| lrq_start_date | DATE | NO | | 시작일 |
| lrq_end_date | DATE | NO | | 종료일 |
| lrq_days | DECIMAL(4,1) | NO | | 일수 |
| lrq_reason | TEXT | YES | | 사유 |
| lrq_status | VARCHAR(20) | NO | PENDING | 상태 |
| lrq_approved_by | UUID | YES | | 승인자 |
| lrq_rejected_reason | TEXT | YES | | 반려 사유 |
| lrq_created_at | TIMESTAMP | NO | NOW() | 생성 |
| lrq_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| lrq_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_hr_ot_records
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| otr_id | UUID | NO | gen | PK |
| emp_id | UUID | NO | | 직원 FK |
| otr_date | DATE | NO | | 초과근무일 |
| otr_time_start | TIME | NO | | 시작 시각 |
| otr_time_end | TIME | NO | | 종료 시각 |
| otr_project_description | TEXT | YES | | 프로젝트 설명 |
| otr_type | VARCHAR(30) | NO | | OT 유형 |
| otr_actual_hours | DECIMAL(4,1) | NO | | 실제 시간 |
| otr_converted_hours | DECIMAL(4,1) | NO | | 환산 시간 |
| otr_approval_status | VARCHAR(20) | NO | PENDING | 승인 상태 |
| otr_approved_by | UUID | YES | | 승인자 |
| otr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| otr_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| otr_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_hr_holidays
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| hol_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| hol_date | DATE | NO | | 휴일 (unique) |
| hol_name | VARCHAR(100) | NO | | 휴일명 (영문) |
| hol_name_vi | VARCHAR(100) | YES | | 휴일명 (베트남어) |
| hol_year | INT | NO | | 연도 |
| hol_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_hr_insurance_params_kr
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ikr_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| ikr_effective_from | DATE | NO | | 유효 시작일 |
| ikr_effective_to | DATE | YES | | 유효 종료일 |
| ikr_pension_rate ~ ikr_employ_emp | DECIMAL(5,3) | NO | | 4대보험 요율 (연금, 건강, 장기요양, 고용보험 각 사업주/근로자) |
| ikr_pension_upper | DECIMAL(15,0) | NO | | 연금 상한 |
| ikr_pension_lower | DECIMAL(15,0) | NO | | 연금 하한 |
| ikr_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_hr_tax_simple_table
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tst_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| tst_effective_year | INT | NO | | 적용 연도 |
| tst_salary_from | DECIMAL(15,0) | NO | | 급여 구간 시작 |
| tst_salary_to | DECIMAL(15,0) | NO | | 급여 구간 종료 |
| tst_dependents | INT | NO | | 부양가족 수 |
| tst_tax_amount | DECIMAL(15,0) | NO | | 세액 |
| tst_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_hr_yearend_adjustments
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| yea_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| emp_id | UUID | NO | | 직원 FK |
| yea_tax_year | INT | NO | | 귀속 연도 |
| yea_settle_tax | DECIMAL(15,0) | NO | 0 | 정산 소득세 |
| yea_settle_local | DECIMAL(15,0) | NO | 0 | 정산 지방세 |
| yea_applied_month | VARCHAR(7) | YES | | 적용 월 |
| yea_status | VARCHAR(10) | NO | PENDING | 상태 |
| yea_note | TEXT | YES | | 비고 |
| yea_created_at | TIMESTAMP | NO | NOW() | 생성 |
| yea_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_hr_system_params
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| hsp_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| hsp_param_key | VARCHAR(50) | NO | | 파라미터 키 |
| hsp_param_value | VARCHAR(50) | NO | | 파라미터 값 |
| hsp_effective_from | DATE | NO | | 유효 시작일 |
| hsp_effective_to | DATE | YES | | 유효 종료일 |
| hsp_description | VARCHAR(200) | YES | | 설명 |
| hsp_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 3. Invitation

### amb_invitations
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| inv_id | UUID | NO | gen | PK |
| inv_email | VARCHAR(200) | NO | | 초대 이메일 |
| inv_token | VARCHAR(100) | NO | | 초대 토큰 (unique) |
| inv_role | VARCHAR(20) | NO | | 역할 |
| inv_unit | VARCHAR(30) | NO | | 부서 |
| inv_cell_id | UUID | YES | | 셀 FK |
| inv_status | VARCHAR(20) | NO | PENDING | 상태 |
| inv_invited_by | UUID | NO | | 초대자 FK |
| inv_expires_at | TIMESTAMP | NO | | 만료 시각 |
| inv_accepted_at | TIMESTAMP | YES | | 수락 시각 |
| inv_level_code | VARCHAR(30) | YES | | ADMIN_LEVEL/USER_LEVEL |
| inv_company_id | UUID | YES | | 회사 FK |
| inv_partner_id | UUID | YES | | 파트너 FK |
| inv_auto_approve | BOOLEAN | NO | false | 자동 승인 |
| inv_last_sent_at | TIMESTAMP | YES | | 마지막 발송 |
| inv_send_count | INT | NO | 0 | 발송 횟수 |
| inv_created_at | TIMESTAMP | NO | NOW() | 생성 |
| inv_updated_at | TIMESTAMP | NO | NOW() | 수정 |

---

## 4. Members

### amb_cells
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| cel_id | UUID | NO | gen | PK |
| cel_name | VARCHAR(100) | NO | | 셀 이름 |
| cel_description | VARCHAR(500) | YES | | 설명 |
| ent_id | UUID | YES | | 법인 FK |
| cel_created_at | TIMESTAMP | NO | NOW() | 생성 |
| cel_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| cel_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_user_cells
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ugr_id | UUID | NO | gen | PK |
| usr_id | UUID | NO | | 사용자 FK |
| cel_id | UUID | NO | | 셀 FK |
| ugr_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 5. Unit

### amb_units
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| unt_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| unt_name | VARCHAR(100) | NO | | 유닛 이름 |
| unt_name_local | VARCHAR(100) | YES | | 현지어 이름 |
| unt_parent_id | UUID | YES | | 상위 유닛 FK |
| unt_level | INT | NO | 1 | 레벨: 1=Unit, 2=Team |
| unt_is_active | BOOLEAN | NO | true | 활성 |
| unt_sort_order | INT | NO | 0 | 정렬 |
| unt_created_at | TIMESTAMP | NO | NOW() | 생성 |
| unt_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_user_unit_roles
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| uur_id | UUID | NO | gen | PK |
| usr_id | UUID | NO | | 사용자 FK |
| unt_id | UUID | NO | | 유닛 FK |
| uur_role | VARCHAR(20) | NO | MEMBER | MEMBER/TEAM_LEAD/UNIT_HEAD |
| uur_is_primary | BOOLEAN | NO | false | 주 역할 여부 |
| uur_started_at | DATE | NO | | 시작일 |
| uur_ended_at | DATE | YES | | 종료일 |
| uur_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 6. Issues

### amb_issues
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| iss_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| iss_type | VARCHAR(20) | NO | | 이슈 유형 |
| iss_title | VARCHAR(200) | NO | | 제목 |
| iss_description | TEXT | NO | | 설명 |
| iss_severity | VARCHAR(20) | NO | | 심각도 |
| iss_status | VARCHAR(20) | NO | OPEN | 상태 |
| iss_priority | INT | NO | 3 | 우선순위 |
| iss_reporter_id | UUID | NO | | 보고자 FK |
| iss_assignee_id | UUID | YES | | 담당자 FK |
| iss_visibility | VARCHAR(20) | NO | ENTITY | 가시성 |
| iss_cell_id | UUID | YES | | 셀 FK |
| pjt_id | UUID | YES | | 프로젝트 FK |
| epc_id | UUID | YES | | 에픽 FK |
| cmp_id | UUID | YES | | 컴포넌트 FK |
| iss_parent_id | UUID | YES | | 상위 이슈 FK |
| iss_ref_number | VARCHAR(50) | YES | | 참조 번호 |
| iss_start_date | DATE | YES | | 시작일 |
| iss_due_date | DATE | YES | | 마감일 |
| iss_done_ratio | INT | NO | 0 | 진행률 |
| iss_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| iss_resolution | TEXT | YES | | 해결 내용 |
| iss_ai_analysis | TEXT | YES | | AI 분석 |
| iss_resolved_at | TIMESTAMP | YES | | 해결 일시 |
| iss_google_drive_link | TEXT | YES | | Drive 링크 |
| iss_redmine_id | INT | YES | | Redmine ID |
| iss_asana_gid | VARCHAR(50) | YES | | Asana GID |
| iss_affected_modules | TEXT[] | YES | | 영향 모듈 배열 |
| iss_created_at | TIMESTAMP | NO | NOW() | 생성 |
| iss_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| iss_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_issue_comments
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| isc_id | UUID | NO | gen | PK |
| iss_id | UUID | NO | | 이슈 FK |
| isc_author_id | UUID | NO | | 작성자 FK |
| isc_author_type | VARCHAR(10) | NO | USER | 작성자 유형 |
| isc_content | TEXT | NO | | 내용 |
| isc_issue_status | VARCHAR(20) | YES | | 댓글 시점 이슈 상태 |
| isc_parent_id | UUID | YES | | 상위 댓글 FK |
| isc_client_visible | BOOLEAN | NO | false | 클라이언트 공개 |
| isc_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_issue_comment_reactions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| icr_id | UUID | NO | gen | PK |
| isc_id | UUID | NO | | 댓글 FK |
| usr_id | UUID | NO | | 사용자 FK |
| icr_type | VARCHAR(20) | NO | | 반응 유형 |
| icr_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_issue_participants
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| isp_id | UUID | NO | gen | PK |
| iss_id | UUID | NO | | 이슈 FK |
| usr_id | UUID | NO | | 사용자 FK |
| isp_role | VARCHAR(20) | NO | PARTICIPANT | 역할 |
| isp_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_issue_sequences
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| isq_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK (unique) |
| isq_last_number | INT | NO | 0 | 마지막 번호 |
| isq_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_issue_status_logs
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| isl_id | UUID | NO | gen | PK |
| iss_id | UUID | NO | | 이슈 FK |
| isl_change_type | VARCHAR(20) | NO | STATUS | 변경 유형 |
| isl_from_status | VARCHAR(100) | NO | | 이전 상태 |
| isl_to_status | VARCHAR(100) | NO | | 변경 상태 |
| isl_changed_by | UUID | NO | | 변경자 FK |
| isl_note | TEXT | YES | | 비고 |
| isl_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 7. Todo

### amb_todos
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tdo_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | NO | | 생성자 FK |
| tdo_title | VARCHAR(200) | NO | | 제목 |
| tdo_description | TEXT | YES | | 설명 |
| tdo_status | VARCHAR(20) | NO | SCHEDULED | SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED |
| tdo_start_date | DATE | YES | | 시작일 |
| tdo_due_date | DATE | YES | | 마감일 |
| tdo_tags | TEXT | YES | | 태그 (콤마 구분) |
| tdo_visibility | VARCHAR(20) | NO | PRIVATE | PRIVATE/CELL/ENTITY |
| tdo_cell_id | UUID | YES | | 셀 FK |
| tdo_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| tdo_recurrence_type | VARCHAR(20) | YES | | DAILY/WEEKLY/MONTHLY |
| tdo_recurrence_day | SMALLINT | YES | | 반복 일자 |
| tdo_parent_id | UUID | YES | | 상위 할일 FK |
| tdo_completed_at | TIMESTAMP | YES | | 완료 일시 |
| tdo_started_at | TIMESTAMP | YES | | 시작 일시 |
| iss_id | UUID | YES | | 이슈 FK |
| pjt_id | UUID | YES | | 프로젝트 FK |
| tdo_created_at | TIMESTAMP | NO | NOW() | 생성 |
| tdo_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| tdo_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_todo_comments
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tcm_id | UUID | NO | gen | PK |
| tdo_id | UUID | NO | | 할일 FK |
| tcm_author_id | UUID | NO | | 작성자 FK |
| tcm_content | TEXT | NO | | 내용 |
| tcm_created_at | TIMESTAMP | NO | NOW() | 생성 |
| tcm_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| tcm_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_todo_participants
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tpt_id | UUID | NO | gen | PK |
| tdo_id | UUID | NO | | 할일 FK |
| usr_id | UUID | NO | | 사용자 FK (unique per todo) |
| tpt_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_todo_status_logs
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tsl_id | UUID | NO | gen | PK |
| tdo_id | UUID | NO | | 할일 FK |
| tsl_from_status | VARCHAR(20) | NO | | 이전 상태 |
| tsl_to_status | VARCHAR(20) | NO | | 변경 상태 |
| tsl_changed_by | UUID | NO | | 변경자 FK |
| tsl_changed_at | TIMESTAMP | NO | NOW() | 변경 일시 |
| tsl_note | TEXT | YES | | 비고 |

---

## 8. Project

### kms_projects
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pjt_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| pjt_code | VARCHAR(50) | NO | | 프로젝트 코드 |
| pjt_name | VARCHAR(300) | NO | | 프로젝트명 |
| pjt_title | VARCHAR(500) | YES | | 타이틀 |
| pjt_purpose | TEXT | YES | | 목적 |
| pjt_goal | TEXT | YES | | 목표 |
| pjt_summary | TEXT | YES | | 요약 |
| pjt_status | VARCHAR(20) | NO | DRAFT | 상태 |
| pjt_category | VARCHAR(30) | YES | | 카테고리 |
| pjt_priority | VARCHAR(10) | NO | MEDIUM | 우선순위 |
| pjt_proposer_id | UUID | NO | | 제안자 FK |
| pjt_manager_id | UUID | YES | | 관리자 FK |
| pjt_sponsor_id | UUID | YES | | 스폰서 FK |
| pjt_dept_id | UUID | YES | | 부서 FK |
| pjt_start_date | DATE | YES | | 시작일 |
| pjt_end_date | DATE | YES | | 종료일 |
| pjt_budget | DECIMAL(15,2) | YES | | 예산 |
| pjt_currency | VARCHAR(3) | NO | USD | 통화 |
| pjt_contract_id | UUID | YES | | 계약 FK |
| pjt_gdrive_folder_id | VARCHAR(100) | YES | | Drive 폴더 ID |
| pjt_ai_draft_json | TEXT | YES | | AI 초안 JSON |
| pjt_ai_analysis_json | TEXT | YES | | AI 분석 JSON |
| pjt_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| pjt_parent_id | UUID | YES | | 상위 프로젝트 FK |
| pjt_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pjt_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| pjt_deleted_at | TIMESTAMP | YES | | Soft delete |

### kms_project_members
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pmb_id | UUID | NO | gen | PK |
| pjt_id | UUID | NO | | 프로젝트 FK |
| usr_id | UUID | NO | | 사용자 FK |
| pmb_role | VARCHAR(20) | NO | | 역할 |
| pmb_is_active | BOOLEAN | NO | true | 활성 |
| pmb_joined_at | TIMESTAMP | NO | NOW() | 참여 일시 |
| pmb_left_at | TIMESTAMP | YES | | 탈퇴 일시 |
| pmb_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pmb_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_project_epics
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| epc_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| pjt_id | UUID | NO | | 프로젝트 FK |
| epc_title | VARCHAR(200) | NO | | 에픽 제목 |
| epc_description | TEXT | YES | | 설명 |
| epc_status | VARCHAR(20) | NO | PLANNED | PLANNED/IN_PROGRESS/DONE/CANCELLED |
| epc_color | VARCHAR(7) | YES | | 색상 |
| epc_start_date | DATE | YES | | 시작일 |
| epc_due_date | DATE | YES | | 마감일 |
| epc_created_by | UUID | NO | | 생성자 FK |
| epc_created_at | TIMESTAMP | NO | NOW() | 생성 |
| epc_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| epc_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_project_components
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| cmp_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| pjt_id | UUID | NO | | 프로젝트 FK |
| cmp_title | VARCHAR(200) | NO | | 컴포넌트 제목 |
| cmp_description | TEXT | YES | | 설명 |
| cmp_color | VARCHAR(7) | YES | | 색상 |
| cmp_owner_id | UUID | YES | | 담당자 FK |
| cmp_created_by | UUID | NO | | 생성자 FK |
| cmp_created_at | TIMESTAMP | NO | NOW() | 생성 |
| cmp_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| cmp_deleted_at | TIMESTAMP | YES | | Soft delete |

### kms_project_clients
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pcl_id | UUID | NO | gen | PK |
| pjt_id | UUID | NO | | 프로젝트 FK (unique with cli_id) |
| cli_id | UUID | NO | | 클라이언트 FK |
| pcl_status | VARCHAR(20) | NO | ACTIVE | 상태 |
| pcl_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pcl_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_project_comments
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pjc_id | UUID | NO | gen | PK |
| pjt_id | UUID | NO | | 프로젝트 FK |
| usr_id | UUID | NO | | 작성자 FK |
| pjc_content | TEXT | NO | | 내용 |
| pjc_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pjc_deleted_at | TIMESTAMP | YES | | Soft delete |

### kms_project_files
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pfl_id | UUID | NO | gen | PK |
| pjt_id | UUID | NO | | 프로젝트 FK |
| pfl_title | VARCHAR(300) | NO | | 파일 제목 |
| pfl_phase | VARCHAR(20) | YES | | 단계 |
| pfl_filename | VARCHAR(300) | NO | | 파일명 |
| pfl_mime_type | VARCHAR(100) | YES | | MIME |
| pfl_file_size | INT | YES | | 파일 크기 |
| pfl_gdrive_file_id | VARCHAR(100) | YES | | Drive 파일 ID |
| pfl_gdrive_url | TEXT | YES | | Drive URL |
| pfl_uploaded_by | UUID | YES | | 업로더 FK |
| pfl_created_at | TIMESTAMP | NO | NOW() | 생성 |

### kms_project_reviews
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| prv_id | UUID | NO | gen | PK |
| pjt_id | UUID | NO | | 프로젝트 FK |
| prv_reviewer_id | UUID | NO | | 리뷰어 FK |
| prv_step | INT | NO | 1 | 리뷰 단계 |
| prv_action | VARCHAR(20) | NO | | 리뷰 액션 |
| prv_comment | TEXT | YES | | 코멘트 |
| prv_previous_status | VARCHAR(20) | NO | | 이전 상태 |
| prv_new_status | VARCHAR(20) | NO | | 새 상태 |
| prv_ai_analysis_json | TEXT | YES | | AI 분석 JSON |
| prv_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 9. Meeting Notes

### amb_meeting_notes
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| mtn_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | NO | | 작성자 FK |
| mtn_title | VARCHAR(200) | NO | | 제목 |
| mtn_content | TEXT | NO | | 내용 |
| mtn_type | VARCHAR(20) | NO | MEMO | 유형 |
| mtn_meeting_date | DATE | NO | | 회의일 |
| mtn_visibility | VARCHAR(20) | NO | PRIVATE | 가시성 |
| mtn_unit | VARCHAR(30) | YES | | 부서 |
| mtn_cell_id | UUID | YES | | 셀 FK |
| mtn_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| mtn_assignee_id | UUID | YES | | 담당자 FK |
| mtn_folder_id | UUID | YES | | 폴더 FK |
| mtn_search_vector | TSVECTOR | YES | | 전문 검색 벡터 |
| mtn_created_at | TIMESTAMP | NO | NOW() | 생성 |
| mtn_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| mtn_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_meeting_note_comments
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| mnc_id | UUID | NO | gen | PK |
| mtn_id | UUID | NO | | 회의록 FK |
| mnc_author_id | UUID | NO | | 작성자 FK |
| mnc_content | TEXT | NO | | 내용 |
| mnc_parent_id | UUID | YES | | 상위 댓글 FK |
| mnc_created_at | TIMESTAMP | NO | NOW() | 생성 |
| mnc_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| mnc_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_meeting_note_folders
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| mnf_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | NO | | 소유자 FK |
| mnf_name | VARCHAR(100) | NO | | 폴더명 |
| mnf_color | VARCHAR(20) | YES | | 색상 |
| mnf_sort_order | INT | NO | 0 | 정렬 |
| mnf_created_at | TIMESTAMP | NO | NOW() | 생성 |
| mnf_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| mnf_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_meeting_note_participants
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| mnpt_id | UUID | NO | gen | PK |
| mtn_id | UUID | NO | | 회의록 FK |
| usr_id | UUID | NO | | 참석자 FK |

### amb_meeting_note_issues
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| mni_id | UUID | NO | PK |
| mtn_id | UUID | NO | 회의록 FK |
| iss_id | UUID | NO | 이슈 FK |

### amb_meeting_note_projects
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| mnp_id | UUID | NO | PK |
| mtn_id | UUID | NO | 회의록 FK |
| pjt_id | UUID | NO | 프로젝트 FK |

### amb_meeting_note_todos
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| mnt_id | UUID | NO | gen | PK |
| mtn_id | UUID | NO | | 회의록 FK |
| tdo_id | UUID | NO | | 할일 FK |
| mnt_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_meeting_note_ratings
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| mnr_id | UUID | NO | gen | PK |
| mtn_id | UUID | NO | | 회의록 FK |
| usr_id | UUID | NO | | 평가자 FK |
| mnr_rating | SMALLINT | NO | | 평점 (1~5) |
| mnr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| mnr_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_note_links
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| nlk_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| nlk_source_note_id | UUID | NO | | 소스 회의록 FK |
| nlk_target_note_id | UUID | YES | | 타겟 회의록 FK |
| nlk_link_text | VARCHAR(500) | NO | | 링크 텍스트 |
| nlk_target_type | VARCHAR(20) | NO | NOTE | 타겟 유형 |
| nlk_target_ref_id | UUID | YES | | 타겟 참조 ID |
| nlk_context | TEXT | YES | | 컨텍스트 |
| nlk_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 10. Today

### amb_daily_missions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| msn_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| msn_date | DATE | NO | | 미션 날짜 |
| msn_content | TEXT | YES | | 미션 내용 |
| msn_check_result | VARCHAR(20) | YES | | HALF/PARTIAL/ALL_DONE/EXCEED |
| msn_check_score | SMALLINT | YES | | 점수 (0~100) |
| msn_registered_lines | JSONB | NO | [] | 등록된 업무 라인 |
| msn_carry_over_text | TEXT | YES | | 이월 메모 |
| msn_created_at | TIMESTAMP | NO | NOW() | 생성 |
| msn_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_today_snapshots
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| snp_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| msn_id | UUID | NO | | 미션 FK |
| snp_date | DATE | NO | | 날짜 |
| snp_title | VARCHAR(100) | NO | | 제목 |
| snp_data | JSONB | NO | {} | 스냅샷 데이터 |
| snp_captured_at | TIMESTAMP | NO | NOW() | 캡처 시각 |
| snp_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_today_snapshot_memos
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| smo_id | UUID | NO | gen | PK |
| snp_id | UUID | NO | | 스냅샷 FK |
| usr_id | UUID | NO | | 사용자 FK |
| smo_content | TEXT | NO | | 메모 내용 |
| smo_order | SMALLINT | NO | 0 | 순서 |
| smo_created_at | TIMESTAMP | NO | NOW() | 생성 |
| smo_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| smo_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_today_reports
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tdr_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| tdr_title | VARCHAR(300) | NO | | 제목 |
| tdr_content | TEXT | NO | | 내용 |
| tdr_scope | VARCHAR(20) | NO | | all / team |
| tdr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| tdr_deleted_at | TIMESTAMP | YES | | Soft delete |

---

## 11. Report

### amb_work_reports
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| wkr_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| wkr_type | VARCHAR(20) | NO | | daily / weekly |
| wkr_period_start | DATE | NO | | 기간 시작 |
| wkr_period_end | DATE | NO | | 기간 종료 |
| wkr_raw_data | JSONB | NO | {} | 원본 데이터 |
| wkr_ai_summary | TEXT | YES | | AI 요약 |
| wkr_ai_score | JSONB | YES | | AI 점수 |
| wkr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| wkr_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| wkr_deleted_at | TIMESTAMP | YES | | Soft delete |

---

## 12. Chat

### amb_conversations
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| cvs_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| cvs_unit | VARCHAR(30) | NO | | 부서 |
| cvs_title | VARCHAR(200) | NO | | 대화 제목 |
| cvs_message_count | INT | NO | 0 | 메시지 수 |
| cvs_created_at | TIMESTAMP | NO | NOW() | 생성 |
| cvs_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| cvs_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_messages
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| msg_id | UUID | NO | gen | PK |
| cvs_id | UUID | NO | | 대화 FK |
| msg_role | VARCHAR(20) | NO | | user/assistant/system |
| msg_content | TEXT | NO | | 내용 |
| msg_token_count | INT | NO | 0 | 토큰 수 |
| msg_order | INT | NO | 0 | 순서 |
| msg_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 13. Amoeba Talk

### amb_talk_channels
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| chn_id | UUID | NO | gen | PK |
| chn_name | VARCHAR(100) | NO | | 채널명 |
| chn_type | VARCHAR(20) | NO | | PUBLIC/PRIVATE/DM |
| chn_description | TEXT | YES | | 설명 |
| ent_id | UUID | YES | | 법인 FK |
| chn_created_by | UUID | NO | | 생성자 FK |
| chn_archived_at | TIMESTAMP | YES | | 보관 일시 |
| chn_archived_by | UUID | YES | | 보관자 FK |
| chn_created_at | TIMESTAMP | NO | NOW() | 생성 |
| chn_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| chn_deleted_at | TIMESTAMP | NO | | Soft delete |

### amb_talk_channel_members
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| chm_id | UUID | NO | gen | PK |
| chn_id | UUID | NO | | 채널 FK |
| usr_id | UUID | NO | | 사용자 FK |
| chm_role | VARCHAR(20) | NO | MEMBER | 역할 |
| chm_joined_at | TIMESTAMP | NO | | 참여 일시 |
| chm_left_at | TIMESTAMP | YES | | 탈퇴 일시 |
| chm_pinned | BOOLEAN | NO | false | 고정 |
| chm_muted | BOOLEAN | NO | false | 음소거 |

### amb_talk_messages
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| msg_id | UUID | NO | gen | PK |
| chn_id | UUID | NO | | 채널 FK |
| usr_id | UUID | NO | | 발신자 FK |
| msg_content | TEXT | NO | | 내용 |
| msg_type | VARCHAR(20) | NO | TEXT | TEXT/FILE/SYSTEM |
| msg_parent_id | UUID | YES | | 스레드 상위 FK |
| msg_is_pinned | BOOLEAN | NO | false | 고정 |
| msg_pinned_at | TIMESTAMP | YES | | 고정 일시 |
| msg_pinned_by | UUID | YES | | 고정자 FK |
| msg_created_at | TIMESTAMP | NO | NOW() | 생성 |
| msg_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| msg_deleted_at | TIMESTAMP | NO | | Soft delete |

### amb_talk_attachments
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| tat_id | UUID | NO | PK |
| msg_id | UUID | NO | 메시지 FK |
| tat_original_name | VARCHAR(255) | NO | 원본 파일명 |
| tat_stored_name | VARCHAR(255) | NO | 저장 파일명 |
| tat_file_size | INT | NO | 파일 크기 |
| tat_mime_type | VARCHAR(100) | NO | MIME |
| tat_created_at | TIMESTAMP | NO | 생성 |

### amb_talk_reactions
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| rea_id | UUID | NO | PK |
| msg_id | UUID | NO | 메시지 FK |
| usr_id | UUID | NO | 사용자 FK |
| rea_type | VARCHAR(20) | NO | 반응 유형 |
| rea_created_at | TIMESTAMP | NO | 생성 |

### amb_talk_read_status
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| trs_id | UUID | NO | PK |
| chn_id | UUID | NO | 채널 FK |
| usr_id | UUID | NO | 사용자 FK |
| trs_last_read_at | TIMESTAMP | NO | 마지막 읽음 |
| trs_last_msg_id | UUID | YES | 마지막 읽은 메시지 FK |

### amb_talk_message_hides
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| tmh_id | UUID | NO | PK |
| msg_id | UUID | NO | 메시지 FK |
| usr_id | UUID | NO | 사용자 FK |
| tmh_hidden_at | TIMESTAMP | NO | 숨김 일시 |

---

## 14. Notices

### amb_notices
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ntc_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | NO | | 작성자 FK |
| ntc_title | VARCHAR(200) | NO | | 제목 |
| ntc_content | TEXT | NO | | 내용 |
| ntc_visibility | VARCHAR(20) | NO | PUBLIC | 가시성 |
| ntc_unit | VARCHAR(30) | YES | | 부서 |
| ntc_cell_id | UUID | YES | | 셀 FK |
| ntc_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| ntc_is_pinned | BOOLEAN | NO | false | 고정 |
| ntc_view_count | INT | NO | 0 | 조회수 |
| ntc_created_at | TIMESTAMP | NO | NOW() | 생성 |
| ntc_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| ntc_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_notice_attachments
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| nta_id | UUID | NO | PK |
| ntc_id | UUID | NO | 공지 FK |
| nta_original_name | VARCHAR(255) | NO | 원본 파일명 |
| nta_stored_name | VARCHAR(255) | NO | 저장 파일명 |
| nta_file_size | INT | NO | 파일 크기 |
| nta_mime_type | VARCHAR(100) | NO | MIME |
| nta_created_at | TIMESTAMP | NO | 생성 |

### amb_notice_reads
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| ntr_id | UUID | NO | PK |
| ntc_id | UUID | NO | 공지 FK |
| usr_id | UUID | NO | 사용자 FK |
| ntr_read_at | TIMESTAMP | NO | 읽음 시각 |

---

## 15. Notification

### amb_notifications
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ntf_id | UUID | NO | gen | PK |
| ntf_type | VARCHAR(30) | NO | | 알림 유형 |
| ntf_title | VARCHAR(500) | NO | | 제목 |
| ntf_message | TEXT | YES | | 메시지 |
| ntf_recipient_id | UUID | NO | | 수신자 FK |
| ntf_sender_id | UUID | NO | | 발신자 FK |
| ntf_resource_type | VARCHAR(30) | NO | | 대상 리소스 유형 |
| ntf_resource_id | UUID | NO | | 대상 리소스 ID |
| ntf_is_read | BOOLEAN | NO | false | 읽음 |
| ntf_read_at | TIMESTAMPTZ | YES | | 읽음 시각 |
| ent_id | UUID | NO | | 법인 FK |
| ntf_created_at | TIMESTAMPTZ | NO | NOW() | 생성 |
| ntf_deleted_at | TIMESTAMPTZ | YES | | Soft delete |

### amb_push_subscriptions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| psb_id | UUID | NO | gen | PK |
| usr_id | UUID | NO | | 사용자 FK |
| ent_id | UUID | YES | | 법인 FK |
| psb_endpoint | VARCHAR(500) | NO | | Web Push 엔드포인트 |
| psb_p256dh | VARCHAR(200) | NO | | ECDH 공개키 |
| psb_auth | VARCHAR(100) | NO | | 인증 시크릿 |
| psb_user_agent | VARCHAR(300) | YES | | User Agent |
| psb_created_at | TIMESTAMPTZ | NO | NOW() | 생성 |

---

## 16. Calendar

### amb_calendars
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| cal_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| usr_id | UUID | NO | | 소유자 FK |
| project_id | UUID | YES | | 프로젝트 FK |
| cal_title | VARCHAR(300) | NO | | 일정 제목 |
| cal_description | TEXT | YES | | 설명 |
| cal_start_at | TIMESTAMPTZ | NO | | 시작 |
| cal_end_at | TIMESTAMPTZ | NO | | 종료 |
| cal_is_all_day | BOOLEAN | NO | false | 종일 이벤트 |
| cal_location | VARCHAR(500) | YES | | 장소 |
| cal_category | VARCHAR(20) | NO | WORK | 카테고리 |
| cal_visibility | VARCHAR(20) | NO | PRIVATE | 가시성 |
| cal_color | VARCHAR(7) | YES | | 색상 |
| cal_recurrence_type | VARCHAR(10) | NO | NONE | 반복 유형 |
| cal_google_event_id | VARCHAR(255) | YES | | Google Calendar ID |
| cal_sync_status | VARCHAR(20) | NO | NOT_SYNCED | 동기화 상태 |
| cal_sync_at | TIMESTAMPTZ | YES | | 동기화 일시 |
| cal_created_at | TIMESTAMP | NO | NOW() | 생성 |
| cal_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| cal_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_calendar_participants
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| clp_id | UUID | NO | gen | PK |
| cal_id | UUID | NO | | 일정 FK |
| usr_id | UUID | NO | | 참석자 FK |
| clp_response_status | VARCHAR(20) | NO | NONE | NONE/ACCEPTED/DECLINED/TENTATIVE |
| clp_responded_at | TIMESTAMPTZ | YES | | 응답 일시 |
| clp_invited_by | UUID | NO | | 초대자 FK |
| clp_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_calendar_recurrences
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| clr_id | UUID | NO | gen | PK |
| cal_id | UUID | NO | | 일정 FK (unique, 1:1) |
| clr_freq | VARCHAR(20) | NO | | DAILY/WEEKLY/MONTHLY/YEARLY |
| clr_interval | INT | NO | 1 | 간격 |
| clr_weekdays | SMALLINT | YES | | 요일 비트마스크 |
| clr_month_day | INT | YES | | 월 반복 일자 |
| clr_end_type | VARCHAR(10) | NO | | NEVER/UNTIL/COUNT |
| clr_end_date | DATE | YES | | 종료일 |
| clr_count | INT | YES | | 반복 횟수 |
| clr_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_calendar_exceptions
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| cle_id | UUID | NO | PK |
| cal_id | UUID | NO | 일정 FK |
| cle_original_date | DATE | NO | 원래 날짜 |
| cle_exception_type | VARCHAR(20) | NO | CANCELLED/MODIFIED |
| cle_new_start_at | TIMESTAMPTZ | YES | 변경 시작 |
| cle_new_end_at | TIMESTAMPTZ | YES | 변경 종료 |
| cle_created_at | TIMESTAMP | NO | 생성 |

### amb_calendar_notifications
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| cln_id | UUID | NO | gen | PK |
| cal_id | UUID | NO | | 일정 FK |
| cln_reminder_type | VARCHAR(20) | NO | | 알림 유형 |
| cln_custom_minutes | INT | YES | | 맞춤 알림 (분) |
| cln_channels | JSONB | NO | ["TALK"] | 알림 채널 |
| cln_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 17. Translation

### amb_content_translations
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| trn_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| trn_source_type | VARCHAR(30) | NO | | 소스 유형 (TODO/POST/PAGE 등) |
| trn_source_id | UUID | NO | | 소스 콘텐츠 ID |
| trn_source_field | VARCHAR(50) | NO | | 소스 필드명 |
| trn_source_lang | VARCHAR(5) | NO | | 소스 언어 |
| trn_target_lang | VARCHAR(5) | NO | | 타겟 언어 |
| trn_content | TEXT | NO | | 번역 내용 |
| trn_source_hash | VARCHAR(64) | YES | | 소스 해시 (변경 감지) |
| trn_method | VARCHAR(20) | NO | AI | AI/MANUAL |
| trn_confidence | DECIMAL(3,2) | YES | | 신뢰도 (0~1) |
| trn_is_stale | BOOLEAN | NO | false | 구버전 여부 |
| trn_is_locked | BOOLEAN | NO | false | 수동 번역 잠금 |
| trn_version | INT | NO | 1 | 버전 |
| trn_translated_by | UUID | NO | | 번역자 FK |
| trn_created_at | TIMESTAMP | NO | NOW() | 생성 |
| trn_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_content_translation_history
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| thi_id | UUID | NO | PK |
| trn_id | UUID | NO | 번역 FK |
| thi_content | TEXT | NO | 이력 내용 |
| thi_method | VARCHAR(20) | NO | 번역 방법 |
| thi_version | INT | NO | 버전 |
| thi_edited_by | UUID | NO | 편집자 FK |
| thi_change_reason | VARCHAR(200) | YES | 변경 사유 |
| thi_created_at | TIMESTAMP | NO | 생성 |

### amb_translation_glossary
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| gls_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| gls_term_en | VARCHAR(200) | NO | | 영문 용어 |
| gls_term_ko | VARCHAR(200) | YES | | 한국어 용어 |
| gls_term_vi | VARCHAR(200) | YES | | 베트남어 용어 |
| gls_category | VARCHAR(50) | YES | | 카테고리 |
| gls_context | TEXT | YES | | 사용 맥락 |
| gls_is_deleted | BOOLEAN | NO | false | 삭제 여부 |
| gls_created_by | UUID | NO | | 생성자 FK |
| gls_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_translation_usage
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tus_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| tus_source_type | VARCHAR(30) | NO | | 소스 유형 |
| tus_source_lang | VARCHAR(5) | NO | | 소스 언어 |
| tus_target_lang | VARCHAR(5) | NO | | 타겟 언어 |
| tus_input_tokens | INT | NO | 0 | 입력 토큰 |
| tus_output_tokens | INT | NO | 0 | 출력 토큰 |
| tus_cost_usd | DECIMAL(10,6) | NO | 0 | 비용 USD |
| tus_created_at | TIMESTAMP | NO | NOW() | 생성 |

---

## 18. KMS

### amb_kms_tags
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| tag_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| tag_name | VARCHAR(200) | NO | | 정규화 이름 (소문자) |
| tag_display | VARCHAR(200) | NO | | 표시 이름 |
| tag_name_local | VARCHAR(200) | YES | | 현지어 이름 |
| tag_level | INT | NO | 2 | 1=DOMAIN, 2=TOPIC, 3=CONTEXT |
| tag_parent_id | UUID | YES | | 상위 태그 FK |
| tag_color | VARCHAR(20) | YES | | 색상 |
| tag_is_system | BOOLEAN | NO | false | 시스템 태그 |
| tag_usage_count | INT | NO | 0 | 사용 횟수 |
| tag_embedding | TEXT | YES | | 벡터 임베딩 |
| tag_created_at | TIMESTAMP | NO | NOW() | 생성 |
| tag_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_kms_tag_relations
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| trl_id | UUID | NO | gen | PK |
| tag_source_id | UUID | NO | | 소스 태그 FK |
| tag_target_id | UUID | NO | | 타겟 태그 FK |
| trl_type | VARCHAR(20) | NO | | PARENT_CHILD/RELATED/SYNONYM/BROADER/NARROWER |
| trl_weight | DECIMAL(5,4) | NO | 1.0 | 가중치 |
| trl_co_occur | INT | NO | 0 | 동시출현 횟수 |
| trl_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_kms_tag_synonyms
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| tsy_id | UUID | NO | PK |
| tag_id | UUID | NO | 태그 FK |
| tsy_synonym | VARCHAR(200) | NO | 동의어 |
| tsy_language | VARCHAR(10) | YES | 언어 |
| tsy_created_at | TIMESTAMP | NO | 생성 |

### amb_kms_work_item_tags
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| wit_tag_id | UUID | NO | gen | PK |
| wit_id | UUID | NO | | 작업항목 FK |
| tag_id | UUID | NO | | 태그 FK |
| wtt_source | VARCHAR(20) | NO | USER_MANUAL | 소스 |
| wtt_confidence | DECIMAL(5,4) | YES | | 신뢰도 |
| wtt_weight | DECIMAL(5,4) | NO | 1.0 | 가중치 |
| wtt_assigned_by | UUID | YES | | 할당자 FK |
| wtt_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_kms_ddd_frameworks
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| fwk_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| fwk_name | VARCHAR(100) | NO | | 프레임워크 이름 (5A Matrix/OKR/BSC) |
| fwk_description | TEXT | YES | | 설명 |
| fwk_template | JSONB | NO | | 템플릿 설정 |
| fwk_version | VARCHAR(20) | NO | 1.0.0 | 버전 |
| fwk_is_active | BOOLEAN | NO | true | 활성 |
| fwk_created_at | TIMESTAMP | NO | NOW() | 생성 |
| fwk_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| fwk_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_kms_ddd_dashboards
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ddb_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| fwk_id | UUID | NO | | 프레임워크 FK |
| ddb_name | VARCHAR(200) | NO | | 대시보드 이름 |
| ddb_scope | VARCHAR(50) | NO | | ENTITY/SERVICE/PROJECT |
| ddb_scope_id | UUID | YES | | 스코프 참조 ID |
| ddb_period_type | VARCHAR(20) | NO | QUARTER | 기간 유형 |
| ddb_config | JSONB | YES | | 설정 |
| ddb_strategy_step | INT | NO | 1 | 전략 단계 1~6 |
| ddb_is_active | BOOLEAN | NO | true | 활성 |
| ddb_created_at | TIMESTAMP | NO | NOW() | 생성 |
| ddb_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| ddb_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_kms_ddd_metrics
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| met_id | UUID | NO | gen | PK |
| fwk_id | UUID | NO | | 프레임워크 FK |
| met_stage | VARCHAR(50) | NO | | 5A 단계 |
| met_key | VARCHAR(100) | NO | | 메트릭 키 |
| met_label | JSONB | NO | | 라벨 (i18n) |
| met_unit | VARCHAR(20) | YES | | 단위 |
| met_direction | VARCHAR(10) | NO | UP | 방향 |
| met_data_source | VARCHAR(50) | YES | | 데이터 소스 |
| met_query_config | JSONB | YES | | 쿼리 설정 |
| met_order | INT | NO | 0 | 순서 |
| met_is_primary | BOOLEAN | NO | false | 주요 KPI |
| met_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_kms_ddd_snapshots
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| snp_id | UUID | NO | gen | PK |
| ddb_id | UUID | NO | | 대시보드 FK |
| met_id | UUID | NO | | 메트릭 FK |
| snp_period | VARCHAR(20) | NO | | 기간 (2026-Q1) |
| snp_value | DECIMAL(18,4) | YES | | 값 |
| snp_prev_value | DECIMAL(18,4) | YES | | 이전 값 |
| snp_change_rate | DECIMAL(8,4) | YES | | 변화율 % |
| snp_target | DECIMAL(18,4) | YES | | 목표 |
| snp_status | VARCHAR(20) | NO | ON_TRACK | 상태 |
| snp_source_type | VARCHAR(20) | NO | AUTO | 소스 유형 |
| snp_annotation | TEXT | YES | | 주석 |
| snp_raw_data | JSONB | YES | | 상세 데이터 |
| snp_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_kms_ddd_gauge_scores
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| gsc_id | UUID | NO | gen | PK |
| ddb_id | UUID | NO | | 대시보드 FK |
| gsc_period | VARCHAR(20) | NO | | 기간 |
| gsc_dimension | VARCHAR(50) | NO | | process/capability/quality |
| gsc_score | DECIMAL(5,2) | NO | | 점수 0~100 |
| gsc_prev_score | DECIMAL(5,2) | YES | | 이전 점수 |
| gsc_details | JSONB | YES | | 세부 점수 |
| gsc_assessed_by | VARCHAR(20) | NO | AI | 평가 주체 |
| gsc_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_kms_ddd_ai_insights
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ais_id | UUID | NO | gen | PK |
| ddb_id | UUID | NO | | 대시보드 FK |
| ais_period | VARCHAR(20) | NO | | 기간 |
| ais_type | VARCHAR(30) | NO | | TREND/ANOMALY/RECOMMENDATION/FORECAST |
| ais_stage | VARCHAR(50) | YES | | 관련 5A 단계 |
| ais_severity | VARCHAR(20) | NO | INFO | 심각도 |
| ais_title | VARCHAR(300) | NO | | 제목 |
| ais_content | TEXT | NO | | AI 분석 내용 |
| ais_data_refs | JSONB | YES | | 근거 데이터 |
| ais_action_items | JSONB | YES | | 실행 항목 |
| ais_is_read | BOOLEAN | NO | false | 읽음 |
| ais_is_actioned | BOOLEAN | NO | false | 실행됨 |
| ais_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_kms_doc_types
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| dtp_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| dtp_code | VARCHAR(30) | NO | | 유형 코드 |
| dtp_name | VARCHAR(200) | NO | | 유형명 |
| dtp_section_template | JSONB | NO | [] | 섹션 템플릿 |
| dtp_base_data_refs | JSONB | NO | [] | 기초 데이터 참조 |
| dtp_is_active | BOOLEAN | NO | true | 활성 |
| dtp_created_at | TIMESTAMP | NO | NOW() | 생성 |
| dtp_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_kms_doc_base_categories / amb_kms_doc_base_data / amb_kms_doc_base_data_history / amb_kms_doc_templates / amb_kms_doc_generated / amb_kms_doc_edit_history / amb_kms_doc_assets

> KMS 문서 생성 시스템의 나머지 테이블들은 기초 데이터 카테고리, 데이터 버전 관리, 문서 템플릿, AI 생성 문서, 편집 이력, 디자인 자산 등을 관리합니다. 상세 스키마는 엔티티 파일을 직접 참조하세요.

---

## 19. ACL

### amb_work_items
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| wit_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| wit_type | VARCHAR(20) | NO | | DOC/REPORT/TODO/NOTE/EMAIL/ANALYSIS |
| wit_title | VARCHAR(500) | NO | | 제목 |
| wit_owner_id | UUID | NO | | 소유자 FK |
| wit_visibility | VARCHAR(20) | NO | PRIVATE | PRIVATE/SHARED/UNIT/CELL/ENTITY/PUBLIC |
| wit_module | VARCHAR(50) | YES | | 모듈 참조 |
| wit_ref_id | UUID | YES | | 모듈별 엔티티 참조 |
| wit_content | TEXT | YES | | 내용 |
| wit_cell_id | UUID | YES | | 셀 FK |
| wit_created_at | TIMESTAMP | NO | NOW() | 생성 |
| wit_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| wit_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_work_item_shares
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| wis_id | UUID | NO | gen | PK |
| wit_id | UUID | NO | | 작업항목 FK |
| wis_target_type | VARCHAR(20) | NO | | USER/UNIT/TEAM/CELL/ENTITY |
| wis_target_id | UUID | NO | | 대상 ID |
| wis_permission | VARCHAR(20) | NO | VIEW | VIEW/COMMENT/EDIT/ADMIN |
| wis_shared_by | UUID | NO | | 공유자 FK |
| wis_expires_at | TIMESTAMP | YES | | 만료 |
| wis_is_active | BOOLEAN | NO | true | 활성 |
| wis_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_work_item_comments
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| wic_id | UUID | NO | gen | PK |
| wit_id | UUID | NO | | 작업항목 FK |
| wic_parent_id | UUID | YES | | 상위 댓글 FK |
| wic_author_id | UUID | NO | | 작성자 FK |
| wic_content | TEXT | NO | | 내용 |
| wic_type | VARCHAR(20) | NO | COMMENT | COMMENT/FEEDBACK/APPROVAL/REQUEST/MENTION |
| wic_is_private | BOOLEAN | NO | false | 비공개 |
| wic_is_edited | BOOLEAN | NO | false | 수정됨 |
| wic_is_deleted | BOOLEAN | NO | false | 삭제됨 |
| wic_created_at | TIMESTAMP | NO | NOW() | 생성 |
| wic_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_access_audit_log
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| aal_id | UUID | NO | PK |
| aal_user_id | UUID | NO | 사용자 FK |
| aal_action | VARCHAR(20) | NO | VIEW/CREATE/EDIT/DELETE/SHARE/ACCESS_DENIED |
| aal_target_type | VARCHAR(50) | NO | 대상 유형 |
| aal_target_id | UUID | NO | 대상 ID |
| aal_access_path | VARCHAR(200) | YES | 접근 경로 |
| aal_details | JSONB | YES | 상세 |
| aal_created_at | TIMESTAMP | NO | 생성 |

### amb_data_audit_log
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| dal_id | UUID | NO | PK |
| dal_user_id | UUID | YES | 사용자 FK |
| dal_action | VARCHAR(20) | NO | UPDATE/SOFT_DELETE/HARD_DELETE |
| dal_entity_name | VARCHAR(100) | NO | 엔티티 클래스명 |
| dal_table_name | VARCHAR(100) | NO | 테이블명 |
| dal_record_id | VARCHAR(255) | NO | 레코드 ID |
| dal_changes | JSONB | YES | 변경 내역 (old/new) |
| dal_ip | VARCHAR(50) | YES | IP 주소 |
| dal_created_at | TIMESTAMP | NO | 생성 |

---

## 20. Activity Index

### amb_activity_weight_configs
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| awc_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| awc_category | VARCHAR(20) | NO | | ISSUE/MEETING_NOTE/COMMENT/TODO/CHAT_MESSAGE |
| awc_weight | SMALLINT | NO | 1 | 활동 가중치 |
| awc_engagement_weight | SMALLINT | NO | 1 | 참여 가중치 |
| awc_daily_cap | INT | YES | | 일일 상한 |
| awc_created_at | TIMESTAMP | NO | NOW() | 생성 |
| awc_updated_at | TIMESTAMP | NO | NOW() | 수정 |

### amb_daily_activity_stats
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| das_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| das_date | DATE | NO | | 날짜 |
| das_issue_count ~ das_chat_count | INT | NO | 0 | 활동 카운트 (이슈/노트/댓글/할일/채팅) |
| das_activity_score | DECIMAL(10,2) | NO | 0 | 활동 점수 |
| das_rating_sum | DECIMAL(10,2) | NO | 0 | 평가 합계 |
| das_rating_count | INT | NO | 0 | 평가 횟수 |
| das_reaction_count | INT | NO | 0 | 반응 횟수 |
| das_engagement_score | DECIMAL(10,2) | NO | 0 | 참여 점수 |
| das_total_score | DECIMAL(10,2) | NO | 0 | 총점 |
| das_created_at | TIMESTAMP | NO | NOW() | 생성 |

### amb_issue_ratings / amb_todo_ratings / amb_comment_ratings

> 이슈/할일/댓글에 대한 1~5점 평가. 공통 구조: `{prefix}_id`, 대상 FK, `usr_id`, `{prefix}_rating` (SMALLINT, CHECK 1~5), `created_at`, `updated_at`

---

## 21. Accounting

### amb_bank_accounts
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| bac_id | UUID | NO | gen | PK |
| ent_id | UUID | YES | | 법인 FK |
| usr_id | UUID | NO | | 사용자 FK |
| bac_bank_name | VARCHAR(100) | NO | | 은행명 |
| bac_account_number | VARCHAR(50) | NO | | 계좌번호 (unique) |
| bac_account_alias | VARCHAR(100) | YES | | 계좌 별칭 |
| bac_currency | VARCHAR(10) | NO | VND | 통화 |
| bac_opening_balance | DECIMAL(18,2) | NO | 0 | 개시 잔액 |
| bac_opening_date | DATE | YES | | 개시일 |
| bac_is_active | BOOLEAN | NO | true | 활성 |
| bac_created_at | TIMESTAMP | NO | NOW() | 생성 |
| bac_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| bac_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_transactions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| txn_id | UUID | NO | gen | PK |
| bac_id | UUID | NO | | 은행계좌 FK |
| usr_id | UUID | NO | | 사용자 FK |
| txn_date | DATE | NO | | 거래일 |
| txn_project_name | VARCHAR(200) | YES | | 프로젝트명 |
| txn_net_value | DECIMAL(18,2) | NO | | 순 금액 |
| txn_vat | DECIMAL(18,2) | NO | 0 | VAT |
| txn_bank_charge | DECIMAL(18,2) | NO | 0 | 수수료 |
| txn_total_value | DECIMAL(18,2) | NO | | 총액 |
| txn_balance | DECIMAL(18,2) | NO | | 거래 후 잔액 |
| txn_cumulative_balance | DECIMAL(18,2) | NO | | 누적 잔액 |
| txn_seq_no | INT | NO | 0 | 순번 |
| txn_vendor | VARCHAR(300) | YES | | 거래처 |
| txn_description | TEXT | YES | | 설명 |
| txn_created_at | TIMESTAMP | NO | NOW() | 생성 |
| txn_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| txn_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_analysis_prompts / amb_analysis_reports / amb_recurring_expenses

> 회계 분석 프롬프트, 분석 보고서, 정기 지출 관리 테이블. 상세 스키마는 엔티티 파일 참조.

---

## 22. Billing

### amb_bil_partners
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ptn_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| ptn_code | VARCHAR(20) | NO | | 파트너 코드 (unique per entity) |
| ptn_type | VARCHAR(20) | NO | | 유형 |
| ptn_company_name | VARCHAR(200) | NO | | 회사명 |
| ptn_company_name_local | VARCHAR(200) | YES | | 현지어 회사명 |
| ptn_country | VARCHAR(256) | YES | | 국가 |
| ptn_contact_name | VARCHAR(100) | YES | | 담당자 |
| ptn_contact_email | VARCHAR(200) | YES | | 이메일 |
| ptn_tax_id | VARCHAR(50) | YES | | 사업자번호 |
| ptn_default_currency | VARCHAR(3) | NO | USD | 기본 통화 |
| ptn_payment_terms | INT | NO | 30 | 결제 조건 (일) |
| ptn_status | VARCHAR(20) | NO | ACTIVE | 상태 |
| ptn_stripe_customer_id | VARCHAR(50) | YES | | Stripe 고객 ID |
| ptn_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| ptn_created_at | TIMESTAMP | NO | NOW() | 생성 |
| ptn_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| ptn_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_bil_contracts
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| ctr_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| ptn_id | UUID | NO | | 파트너 FK |
| ctr_direction | VARCHAR(20) | NO | | 방향 |
| ctr_category | VARCHAR(20) | NO | | 카테고리 |
| ctr_type | VARCHAR(20) | NO | | 유형 |
| ctr_title | VARCHAR(300) | NO | | 제목 |
| ctr_start_date | DATE | NO | | 시작일 |
| ctr_end_date | DATE | YES | | 종료일 |
| ctr_amount | DECIMAL(15,2) | NO | 0 | 계약금액 |
| ctr_currency | VARCHAR(3) | NO | USD | 통화 |
| ctr_status | VARCHAR(20) | NO | DRAFT | 상태 |
| ctr_auto_renew | BOOLEAN | NO | false | 자동갱신 |
| ctr_auto_generate | BOOLEAN | NO | false | 인보이스 자동생성 |
| ctr_billing_day | INT | YES | | 청구일 |
| ctr_billing_period | VARCHAR(20) | YES | | 청구 주기 |
| ctr_stripe_subscription_id | VARCHAR(50) | YES | | Stripe 구독 ID |
| ctr_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| ctr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| ctr_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| ctr_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_bil_invoices
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| inv_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| ptn_id | UUID | NO | | 파트너 FK |
| ctr_id | UUID | YES | | 계약 FK |
| inv_number | VARCHAR(50) | NO | | 인보이스 번호 |
| inv_direction | VARCHAR(20) | NO | | RECEIVABLE/PAYABLE |
| inv_date | DATE | NO | | 발행일 |
| inv_due_date | DATE | YES | | 만기일 |
| inv_subtotal | DECIMAL(15,2) | NO | 0 | 소계 |
| inv_tax_rate | DECIMAL(5,2) | NO | 0 | 세율 |
| inv_tax_amount | DECIMAL(15,2) | NO | 0 | 세액 |
| inv_total | DECIMAL(15,2) | NO | 0 | 합계 |
| inv_currency | VARCHAR(3) | NO | | 통화 |
| inv_status | VARCHAR(20) | NO | DRAFT | DRAFT/ISSUED/SENT/PAID/OVERDUE/CANCELLED/VOID |
| inv_approval_status | VARCHAR(30) | NO | NONE | 승인 상태 |
| inv_einv_status | VARCHAR(20) | NO | NONE | 전자세금계산서 상태 |
| inv_nts_status | VARCHAR(20) | NO | NONE | 국세청 상태 (한국) |
| inv_stripe_invoice_id | VARCHAR(50) | YES | | Stripe 인보이스 ID |
| inv_created_at | TIMESTAMP | NO | NOW() | 생성 |
| inv_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| inv_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_bil_invoice_items / amb_bil_contract_history / amb_bil_contract_milestones / amb_bil_payment_schedules / amb_bil_payments / amb_bil_sow / amb_bil_documents

> Billing 하위 테이블: 인보이스 라인아이템, 계약 변경이력, 마일스톤, 결제 스케줄, 결제, SOW, 문서. 상세 스키마는 엔티티 파일 참조.

---

## 23. Expense Request

### amb_expense_requests
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| exr_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| exr_requester_id | UUID | NO | | 신청자 FK |
| exr_title | VARCHAR(200) | NO | | 제목 |
| exr_type | VARCHAR(20) | NO | | PRE_APPROVAL/POST_APPROVAL |
| exr_frequency | VARCHAR(20) | NO | ONE_TIME | ONE_TIME/RECURRING |
| exr_category | VARCHAR(50) | NO | | 경비 카테고리 |
| exr_expense_date | DATE | NO | | 경비일 |
| exr_total_amount | DECIMAL(18,2) | NO | 0 | 총액 |
| exr_currency | VARCHAR(10) | NO | VND | 통화 |
| exr_status | VARCHAR(30) | NO | DRAFT | DRAFT/PENDING/APPROVED_L1/APPROVED/EXECUTED/REJECTED/CANCELLED |
| exr_number | VARCHAR(30) | YES | | 경비 번호 (unique) |
| exr_created_at | TIMESTAMP | NO | NOW() | 생성 |
| exr_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| exr_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_expense_request_items / amb_expense_approvals / amb_expense_attachments / amb_expense_executions / amb_expense_forecast_reports / amb_expense_forecast_items

> 경비 하위 테이블: 항목, 승인, 첨부, 집행, 예측 보고서, 예측 항목. 상세 스키마는 엔티티 파일 참조.

---

## 24. Service Management

### amb_svc_clients
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| cli_id | UUID | NO | gen | PK |
| cli_code | VARCHAR(20) | NO | | 코드 (unique) |
| cli_type | VARCHAR(20) | NO | | 유형 |
| cli_company_name | VARCHAR(300) | NO | | 회사명 |
| cli_status | VARCHAR(20) | NO | ACTIVE | 상태 |
| cli_account_manager_id | UUID | YES | | 담당자 FK |
| cli_stripe_customer_id | VARCHAR(50) | YES | | Stripe 고객 ID |
| cli_original_lang | VARCHAR(5) | NO | ko | 원본 언어 |
| cli_created_at | TIMESTAMP | NO | NOW() | 생성 |
| cli_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| cli_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_svc_services / amb_svc_plans / amb_svc_subscriptions / amb_svc_subscription_history / amb_svc_client_contacts / amb_svc_client_notes

> 서비스 관리 하위 테이블: 서비스, 플랜, 구독, 구독 변경이력, 고객 담당자, 고객 노트. 상세 스키마는 엔티티 파일 참조.

---

## 25. Subscription

### amb_sub_plans
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| pln_id | UUID | NO | gen | PK |
| pln_code | VARCHAR(20) | NO | | 플랜 코드 (unique) |
| pln_name | VARCHAR(100) | NO | | 플랜명 |
| pln_tier | VARCHAR(20) | NO | | FREE/BASIC/PREMIUM |
| pln_price_per_user | NUMERIC(10,4) | NO | 0 | 사용자당 월 가격 |
| pln_token_per_user_monthly | INT | NO | 0 | 사용자당 월 토큰 |
| pln_max_users | INT | NO | 5 | 최대 사용자 |
| pln_storage_base_gb | INT | NO | 1 | 기본 스토리지 GB |
| pln_is_active | BOOLEAN | NO | true | 활성 |
| pln_created_at | TIMESTAMP | NO | NOW() | 생성 |
| pln_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| pln_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_sub_subscriptions
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| sbn_id | UUID | NO | gen | PK |
| ent_id | UUID | NO | | 법인 FK |
| pln_id | UUID | NO | | 플랜 FK |
| sbn_status | VARCHAR(20) | NO | ACTIVE | ACTIVE/CANCELLED/EXPIRED |
| sbn_billing_cycle | VARCHAR(10) | NO | MONTHLY | MONTHLY/ANNUAL |
| sbn_user_count | INT | NO | 5 | 사용자 수 |
| sbn_pg_subscription_id | VARCHAR(200) | YES | | PG 구독 ID |
| sbn_created_at | TIMESTAMP | NO | NOW() | 생성 |
| sbn_updated_at | TIMESTAMP | NO | NOW() | 수정 |
| sbn_deleted_at | TIMESTAMP | YES | | Soft delete |

### amb_sub_token_wallets / amb_sub_token_ledgers / amb_sub_storage_quotas / amb_sub_plan_tiers / amb_sub_plan_features / amb_sub_plan_addons / amb_pg_subscriptions / amb_pg_webhook_events

> 구독 하위 테이블: 토큰 월렛/원장, 스토리지 쿼터, 플랜 티어/기능/애드온, PG 구독, PG 웹훅. 상세 스키마는 엔티티 파일 참조.

---

## 26. Payment Gateway

### amb_pg_configs / amb_pg_transactions / amb_ai_quota_products / amb_ai_quota_topups

> PG 설정 (Payoo), PG 트랜잭션, AI 쿼터 상품, AI 쿼터 충전. 상세 스키마는 엔티티 파일 참조.

---

## 27. Asset

### amb_assets / amb_asset_requests / amb_asset_approval_histories / amb_asset_change_logs / amb_asset_request_logs / amb_meeting_reservations

> 자산 관리, 자산 요청, 승인 이력, 변경 로그, 요청 로그, 회의실 예약. 상세 스키마는 엔티티 파일 참조.

---

## 28. Attendance

### amb_attendances / amb_attendance_policies / amb_attendance_amendments

> 출근 기록, 출근 정책 (법인별), 출근 수정 요청. 상세 스키마는 엔티티 파일 참조.

---

## 29. Settings

### amb_menu_config / amb_menu_permissions / amb_menu_unit_permissions / amb_menu_cell_permissions / amb_user_menu_permissions / amb_api_keys / amb_drive_settings / amb_email_templates / amb_site_settings / amb_smtp_settings

> 메뉴 설정 및 역할/유닛/셀/사용자별 권한, API키 (AES-256 암호화), Drive 설정, 이메일 템플릿, 사이트 설정, SMTP 설정. 상세 스키마는 엔티티 파일 참조.

---

## 30. Entity Settings

### amb_entity_ai_configs / amb_entity_custom_apps / amb_entity_menu_configs / amb_entity_menu_tips / amb_entity_site_configs / amb_login_histories / amb_page_views

> 법인별 AI 설정, 커스텀 앱, 메뉴 설정, 메뉴 팁, 사이트 설정, 로그인 이력, 페이지 조회. 상세 스키마는 엔티티 파일 참조.

---

## 31. Agent

### amb_agent_configs
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| agc_id | UUID | NO | gen | PK |
| agc_unit_code | VARCHAR(20) | NO | | 유닛 코드 (unique) |
| agc_system_prompt | TEXT | YES | | 시스템 프롬프트 |
| agc_description | TEXT | YES | | 설명 |
| agc_is_active | BOOLEAN | NO | true | 활성 |
| agc_visible_cell_ids | TEXT[] | YES | | 보이는 셀 ID 배열 |
| agc_is_deleted | BOOLEAN | NO | false | 삭제됨 |
| agc_created_at | TIMESTAMP | NO | NOW() | 생성 |
| agc_updated_at | TIMESTAMP | NO | NOW() | 수정 |

---

## 32. AI Usage

### amb_ai_token_usage / amb_ai_token_entity_summary / amb_entity_api_quotas

> AI 토큰 사용 이력 (대화/번역/분석별), 법인별 일별 요약, 법인별 API 쿼터 설정. 상세 스키마는 엔티티 파일 참조.

---

## 33. OAuth

### amb_oauth_authorization_codes / amb_oauth_tokens / amb_open_api_logs

> OAuth 2.0 인증코드 (PKCE 지원), 액세스/리프레시 토큰, Open API 호출 로그. 상세 스키마는 엔티티 파일 참조.

---

## 34. Partner App

### amb_partner_apps / amb_partner_app_versions / amb_partner_app_installs

> 파트너 앱 (앱 스토어), 앱 버전 관리, 법인별 앱 설치. 상세 스키마는 엔티티 파일 참조.

---

## 35. Partner

### amb_partners
> 파트너 조직 관리 (앱 스토어용). `ptn_code` unique. 상세 스키마는 엔티티 파일 참조.

---

## 36. Slack Integration

### amb_slack_workspace_configs / amb_slack_channel_mappings / amb_slack_message_mappings

> Slack 워크스페이스 연동 (토큰 AES 암호화), 채널 매핑 (양방향 동기화), 메시지 매핑. 상세 스키마는 엔티티 파일 참조.

---

## 37. Asana Integration

### amb_asana_project_mappings / amb_asana_task_mappings

> Asana 프로젝트-내부 프로젝트 매핑, Asana 태스크-내부 이슈 매핑. 상세 스키마는 엔티티 파일 참조.

---

## 38. External Task Import

### amb_external_task_mappings / amb_external_import_logs

> 외부 시스템 태스크 매핑, 가져오기 배치 로그. 상세 스키마는 엔티티 파일 참조.

---

## 39. Site Management (CMS)

### amb_cms_menus / amb_cms_pages / amb_cms_page_contents / amb_cms_page_versions / amb_cms_sections / amb_cms_posts / amb_cms_post_categories / amb_cms_post_attachments / amb_cms_site_config / amb_cms_subscribers

> CMS 메뉴 (계층형), 페이지 (다국어 콘텐츠, 버전 관리), 섹션 (HERO/FEATURES/CTA), 블로그 포스트, 카테고리, 첨부파일, 사이트 설정, 구독자. 상세 스키마는 엔티티 파일 참조.

---

## 40. Drive

### amb_drive_folders
> Google Drive 폴더 연동. 상세 스키마는 엔티티 파일 참조.

---

## 41. Client Portal

### amb_client_invitations
> 클라이언트 포탈 초대. 토큰 기반 초대, 상태 관리. 상세 스키마는 엔티티 파일 참조.

---

## 42. Portal Bridge

### amb_svc_portal_customers (readonly) / amb_svc_portal_payments (readonly) / amb_portal_user_mappings

> 포탈 고객/결제 읽기 전용 뷰, 포탈-내부 사용자 매핑. 상세 스키마는 엔티티 파일 참조.

---

## 43. Analytics

### amb_site_event_logs
> 사이트 이벤트 로그 (page_view, login, register_visit, subscription). 인덱스: `(sel_site, sel_event_type, sel_created_at)`. 상세 스키마는 엔티티 파일 참조.

---

## 44. Admin

### amb_site_error_logs
> 프론트엔드/백엔드 에러 로그. 소스 (FRONTEND/BACKEND), 앱 (WEB/API/PORTAL), 상태 (OPEN/RESOLVED/IGNORED). 상세 스키마는 엔티티 파일 참조.

---

## 45. Migration

### amb_migration_logs / amb_migration_user_map
> Redmine 마이그레이션 로그, 사용자 매핑. 상세 스키마는 엔티티 파일 참조.

---

## 46. Polar

### amb_pol_webhook_events
> Polar 결제 웹훅 이벤트. 서명 검증, 처리 상태 관리. 상세 스키마는 엔티티 파일 참조.

---

## 47. Portal API

### amb_svc_portal_customers / amb_svc_portal_payments / amb_site_event_logs (portal)
> 포탈 전용 고객 계정, 결제, 이벤트 로그. 상세 스키마는 엔티티 파일 참조.

---

## ER Diagram - Core Relationships

```
amb_hr_entities (ent_id) ──┬── amb_users (usr_id)
                           │     ├── amb_hr_entity_user_roles
                           │     ├── amb_user_cells ── amb_cells
                           │     └── amb_user_unit_roles ── amb_units
                           │
                           ├── amb_issues
                           │     ├── amb_issue_comments
                           │     ├── amb_issue_participants
                           │     └── amb_issue_status_logs
                           │
                           ├── amb_todos
                           │     ├── amb_todo_comments
                           │     ├── amb_todo_participants
                           │     └── amb_todo_status_logs
                           │
                           ├── kms_projects
                           │     ├── kms_project_members
                           │     ├── amb_project_epics
                           │     └── amb_project_components
                           │
                           ├── amb_meeting_notes
                           │     ├── amb_meeting_note_comments
                           │     └── amb_meeting_note_participants
                           │
                           ├── amb_daily_missions
                           │     └── amb_today_snapshots
                           │
                           ├── amb_talk_channels
                           │     ├── amb_talk_channel_members
                           │     └── amb_talk_messages
                           │           ├── amb_talk_reactions
                           │           └── amb_talk_attachments
                           │
                           ├── amb_bil_partners ── amb_bil_contracts
                           │                        ├── amb_bil_invoices
                           │                        └── amb_bil_sow
                           │
                           ├── amb_sub_subscriptions
                           │     ├── amb_sub_token_wallets
                           │     └── amb_sub_storage_quotas
                           │
                           └── amb_work_items (ACL)
                                 └── amb_work_item_shares
```
