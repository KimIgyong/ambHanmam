# AMA (Amoeba Management) ERD - 데이터베이스 설계 문서

**문서버전:** v1.0
**작성일:** 2026-03-23
**기준:** 스테이징 데이터베이스 (db_amb)
**총 테이블 수:** 188개
**총 FK 관계:** 201개

---

## 목차

1. [데이터베이스 개요](#1-데이터베이스-개요)
2. [도메인별 ERD](#2-도메인별-erd)
3. [테이블 상세 명세](#3-테이블-상세-명세)
4. [FK 관계 목록](#4-fk-관계-목록)
5. [네이밍 컨벤션 요약](#5-네이밍-컨벤션-요약)

---

## 1. 데이터베이스 개요

### 1.1 데이터베이스 정보

| 항목 | 값 |
|------|-----|
| **Database Name** | `db_amb` |
| **DBMS** | PostgreSQL 15+ |
| **Table Prefix** | `amb_` (기본), `kms_` (프로젝트 관리) |
| **PK 전략** | UUID (`uuid_generate_v4()`, `gen_random_uuid()`) |
| **Soft Delete** | `{prefix}_deleted_at` (NULL = 활성) |
| **Timestamp** | `{prefix}_created_at`, `{prefix}_updated_at` |
| **암호화** | AES-256-GCM (API Key, SMTP, PG Config 등) |

### 1.2 도메인별 테이블 분류 (15개 도메인)

| # | 도메인 | 테이블 수 | 설명 |
|---|--------|----------|------|
| 1 | **Core (사용자/인증)** | 12 | 사용자, 로그인, 비밀번호, 초대, 권한, 감사로그 |
| 2 | **Entity (조직)** | 6 | 법인, 셀, 부서(유닛), 역할 할당 |
| 3 | **AI/Chat** | 8 | 대화, 메시지, AI 토큰, 에이전트, 분석 프롬프트/리포트 |
| 4 | **HR/급여** | 15 | 직원, 급여, 근태, 휴가, OT, 보험, 간이세액, 연말정산 |
| 5 | **Billing (계약/청구)** | 8 | 계약, 마일스톤, SOW, 송장, 수금, 파트너, 문서 |
| 6 | **Accounting (회계)** | 4 | 은행계좌, 거래내역, 반복비용, 경비예측 |
| 7 | **Project/Issues** | 9 | 프로젝트, 이슈, 에픽, 컴포넌트, 댓글, 참여자 |
| 8 | **KMS (지식관리)** | 15 | 태그, 문서생성, 기반데이터, DDD, 작업아이템 |
| 9 | **Amoeba Talk** | 7 | 채널, 메시지, 첨부파일, 구성원, 리액션, 읽음 |
| 10 | **Communication** | 14 | 메일, 공지, 알림, 캘린더, 번역, 회의록 |
| 11 | **Todo/Today** | 8 | 할일, 데일리리포트, 스냅샷, 미션 |
| 12 | **Expense/Asset** | 10 | 경비요청, 승인, 자산관리, 결재 |
| 13 | **Service Mgmt** | 14 | 서비스, 구독, 클라이언트, 플랜, 포털고객, 결제 |
| 14 | **Integration** | 10 | Redmine/Asana 연동, Slack, 파트너앱, PG |
| 15 | **Settings/Config** | 13 | 메뉴, SMTP, API키, 사이트, CMS |

---

## 2. 도메인별 ERD

### 2.1 Core - 사용자/인증

```
┌────────────────────┐       ┌──────────────────────┐
│    amb_users       │       │ amb_hr_entities       │
│────────────────────│       │──────────────────────│
│ usr_id (PK/UUID)   │──┐    │ ent_id (PK/UUID)     │
│ usr_email          │  │    │ ent_code             │
│ usr_password       │  │    │ ent_name             │
│ usr_name           │  │    │ ent_type             │
│ usr_phone          │  │    │ ent_country          │
│ usr_role           │  │    │ ent_currency         │
│ usr_level          │  ├───→│ ent_parent_id (FK)   │──┐ (자기참조)
│ usr_status         │  │    │ ent_deleted_at       │  │
│ usr_company_id(FK) │──┘    └──────────────────────┘  │
│ usr_cli_id (FK)    │──→ amb_svc_clients              │
│ usr_partner_id(FK) │──→ amb_partners                 │
│ usr_timezone       │                                 │
│ usr_language       │       ┌──────────────────────┐  │
│ usr_deleted_at     │       │   amb_cells           │  │
└────────┬───────────┘       │──────────────────────│  │
         │                   │ cel_id (PK/UUID)     │  │
         │                   │ ent_id (FK)          │──┘
         │                   │ cel_name             │
         │                   │ cel_description      │
         │                   └──────────────────────┘
         │
         ├──→ amb_login_histories (lgh_id, usr_id, lgh_ip, lgh_user_agent)
         ├──→ amb_password_resets (prs_id, usr_id, prs_token, prs_expires_at)
         ├──→ amb_access_audit_log (aal_id, aal_user_id, aal_action, aal_target_type)
         └──→ amb_push_subscriptions (psb_id, usr_id, psb_endpoint)
```

**조직 관련 테이블:**

| 테이블 | PK | 설명 |
|--------|-----|------|
| `amb_units` | `unt_id` | 부서 계층 구조 (unt_parent_id 자기참조) |
| `amb_user_unit_roles` | `uur_id` | 사용자-부서 역할 매핑 |
| `amb_user_cells` | `uc_id` | 사용자-셀 소속 |
| `amb_hr_entity_user_roles` | `eur_id` | 법인-사용자 역할 관리 |
| `amb_user_menu_permissions` | `ump_id` | 사용자별 메뉴 권한 |
| `amb_invitations` | `inv_id` | 사용자 초대 |

### 2.2 AI/Chat 도메인

```
┌─────────────────────┐      ┌─────────────────────────┐
│  amb_conversations  │      │    amb_messages          │
│─────────────────────│      │─────────────────────────│
│ cvs_id (PK/UUID)    │←─────│ msg_id (PK/UUID)        │
│ ent_id (FK)         │      │ cvs_id (FK)             │
│ usr_id (FK)         │      │ msg_role (user/assistant)│
│ cvs_title           │      │ msg_content (text)      │
│ cvs_unit_code       │      │ msg_token_count         │
│ cvs_is_active       │      │ msg_order               │
│ cvs_deleted_at      │      │ msg_created_at          │
└─────────────────────┘      └─────────────────────────┘

┌──────────────────────────┐  ┌─────────────────────────────┐
│ amb_ai_token_usage       │  │ amb_ai_token_entity_summary  │
│──────────────────────────│  │─────────────────────────────│
│ atu_id (PK/UUID)         │  │ ats_id (PK/UUID)            │
│ ent_id (FK)              │  │ ent_id (FK)                 │
│ usr_id (FK)              │  │ ats_date                    │
│ cvs_id (FK)              │  │ ats_total_tokens (bigint)   │
│ atu_source_type          │  │ ats_input_tokens            │
│ atu_model                │  │ ats_output_tokens           │
│ atu_input/output_tokens  │  │ ats_request_count           │
│ atu_key_source           │  └─────────────────────────────┘
└──────────────────────────┘

┌────────────────────────┐   ┌────────────────────────────┐
│ amb_agent_configs      │   │ amb_analysis_prompts       │
│────────────────────────│   │────────────────────────────│
│ agc_id (PK/UUID)       │   │ anp_id (PK/UUID)           │
│ agc_unit_code          │   │ ent_id                     │
│ agc_system_prompt      │   │ anp_name                   │
│ agc_is_active          │   │ anp_system_prompt          │
│ agc_visible_cell_ids   │   │ anp_user_prompt            │
└────────────────────────┘   │ anp_is_default             │
                             └────────────────────────────┘
┌─────────────────────────┐  ┌──────────────────────────┐
│ amb_ai_quota_products   │  │ amb_ai_quota_topups      │
│─────────────────────────│  │──────────────────────────│
│ aqp_id (PK/UUID)        │←─│ aqt_id (PK/UUID)         │
│ aqp_name                │  │ ent_id (FK)              │
│ aqp_token_amount        │  │ usr_id                   │
│ aqp_price               │  │ pgt_id (FK) → PG거래     │
│ aqp_currency            │  │ aqp_id (FK)              │
│ aqp_is_active           │  │ aqt_token_amount         │
└─────────────────────────┘  │ aqt_status               │
                             └──────────────────────────┘
```

### 2.3 HR/급여 도메인

```
amb_hr_entities (법인)
    │
    ├── amb_hr_employees (emp_id, usr_id FK, ent_id FK)
    │       │           직원 마스터 (입사일, 직급, 급여정보)
    │       │
    │       ├── amb_hr_employees_kr (emp_id FK) ── 한국 특화 (주민번호, 4대보험)
    │       ├── amb_hr_dependents (dep_id, emp_id FK) ── 부양가족
    │       ├── amb_hr_salary_history (slh_id, emp_id FK) ── 급여 이력
    │       ├── amb_hr_leave_balances (hlb_id, emp_id FK) ── 잔여 휴가
    │       ├── amb_hr_leave_requests (hlr_id, emp_id FK, usr_id FK) ── 휴가 신청
    │       ├── amb_hr_ot_records (otr_id, emp_id FK) ── OT 기록
    │       ├── amb_hr_timesheets (hts_id, emp_id FK, pyp_id FK) ── 근무시간
    │       └── amb_hr_yearend_adjustments (hya_id, emp_id FK) ── 연말정산
    │
    ├── amb_hr_payroll_periods (pyp_id, ent_id FK)
    │       │           급여기간 (연월, 마감여부)
    │       │
    │       ├── amb_hr_payroll_details (pyd_id, pyp_id FK, emp_id FK) ── VN 급여명세
    │       └── amb_hr_payroll_entries_kr (pek_id, pyp_id FK, emp_id FK) ── KR 급여명세
    │
    ├── amb_hr_freelancers (frl_id, ent_id FK) ── 프리랜서 관리
    │       └── amb_hr_business_income_payments (bip_id, frl_id FK) ── 사업소득 지급
    │
    ├── amb_hr_holidays (hol_id) ── 공휴일
    ├── amb_hr_insurance_params_kr (hip_id, ent_id FK) ── 한국 보험요율
    ├── amb_hr_system_params (hsp_id) ── HR 시스템 파라미터
    ├── amb_hr_tax_simple_table (hts_id, ent_id FK) ── 간이세액표
    └── amb_attendances (att_id, usr_id FK, ent_id FK) ── 출퇴근 기록
```

### 2.4 Billing (계약/청구) 도메인

```
┌───────────────────────┐
│   amb_bil_partners    │
│───────────────────────│
│ ptn_id (PK/UUID)      │←──┐
│ ent_id (FK)           │   │
│ ptn_company_name      │   │
│ ptn_contact_name      │   │
│ ptn_email             │   │
└───────────────────────┘   │
                            │
┌───────────────────────┐   │      ┌─────────────────────────┐
│   amb_bil_contracts   │   │      │  amb_bil_invoices       │
│───────────────────────│   │      │─────────────────────────│
│ ctr_id (PK/UUID)      │←─┤──────│ inv_id (PK/UUID)        │
│ ent_id (FK)           │  │      │ ent_id (FK)             │
│ ptn_id (FK)           │──┘      │ ctr_id (FK)             │
│ ctr_title             │         │ ptn_id (FK)             │
│ ctr_type              │         │ inv_number              │
│ ctr_amount            │         │ inv_amount              │
│ ctr_status            │         │ inv_status              │
│ ctr_start/end_date    │         │ inv_due_date            │
└──────┬────────────────┘         └──────┬──────────────────┘
       │                                 │
       ├── amb_bil_contract_history      ├── amb_bil_invoice_items
       ├── amb_bil_contract_milestones   └── amb_bil_payments (pmt_id, inv_id FK)
       └── amb_bil_sow (sow_id, ctr_id FK)

amb_bil_documents (bld_id, ent_id FK) ── 첨부문서
```

### 2.5 Accounting (회계) 도메인

```
┌──────────────────────┐       ┌───────────────────────┐
│  amb_bank_accounts   │       │  amb_transactions     │
│──────────────────────│       │───────────────────────│
│ bac_id (PK/UUID)     │←──────│ txn_id (PK/UUID)      │
│ ent_id (FK)          │       │ bac_id (FK)           │
│ bac_bank_name        │       │ txn_date              │
│ bac_account_number   │       │ txn_amount            │
│ bac_currency         │       │ txn_type              │
│ bac_balance          │       │ txn_description       │
└──────────┬───────────┘       └───────────────────────┘
           │
           └── amb_recurring_expenses (rex_id, bac_id FK)
                 반복 경비 (월 단위 자동발생)

┌──────────────────────────────┐  ┌───────────────────────────────┐
│ amb_expense_forecast_reports │  │ amb_expense_forecast_items    │
│──────────────────────────────│  │───────────────────────────────│
│ efr_id (PK/UUID)             │←─│ efi_id (PK/UUID)              │
│ ent_id                       │  │ efr_id (FK)                  │
│ efr_year_month               │  │ efi_category                 │
│ efr_status                   │  │ efi_amount                   │
└──────────────────────────────┘  └───────────────────────────────┘
```

### 2.6 Project/Issues 도메인

```
┌────────────────────────┐
│    kms_projects        │
│────────────────────────│
│ pjt_id (PK/UUID)       │←──┐
│ ent_id (FK)            │   │
│ pjt_name               │   │
│ pjt_code               │   │
│ pjt_status             │   │
│ pjt_parent_id (FK)     │───┘ (자기참조)
│ pjt_sponsor_id (FK)    │──→ amb_users
│ pjt_proposer_id (FK)   │──→ amb_users
└────────┬───────────────┘
         │
         ├── kms_project_members (pmb_id, pjt_id FK, usr_id FK)
         ├── kms_project_files (pfl_id, pjt_id FK)
         ├── kms_project_clients (pcl_id, pjt_id FK, cli_id FK)
         ├── kms_project_reviews (prv_id, pjt_id FK)
         │
         ├── amb_project_epics (epc_id, pjt_id FK, ent_id FK)
         └── amb_project_components (cmp_id, pjt_id FK, ent_id FK)

┌────────────────────────┐
│      amb_issues        │
│────────────────────────│
│ iss_id (PK/UUID)       │←──┐
│ ent_id (FK)            │   │
│ pjt_id (FK) → project  │   │
│ epc_id (FK) → epic     │   │
│ cmp_id (FK) → component│   │
│ iss_type               │   │
│ iss_title              │   │
│ iss_status             │   │
│ iss_priority           │   │
│ iss_reporter_id (FK)   │   │
│ iss_assignee_id (FK)   │   │
│ iss_visibility         │   │
│ iss_cell_id            │   │
│ iss_deleted_at         │   │
└────────┬───────────────┘   │
         │                   │
         ├── amb_issue_comments (isc_id, iss_id FK, isc_author_id FK)
         ├── amb_issue_participants (isp_id, iss_id FK, usr_id FK)
         ├── amb_issue_status_logs (isl_id, iss_id FK)
         └── amb_issue_sequences (isq_id) ── 이슈번호 시퀀스
```

### 2.7 Amoeba Talk (메시징) 도메인

```
┌─────────────────────────┐
│   amb_talk_channels     │
│─────────────────────────│
│ chn_id (PK/UUID)        │←──┐
│ chn_name                │   │
│ chn_type (DM/GROUP/...) │   │
│ chn_description         │   │
│ ent_id                  │   │
│ chn_created_by          │   │
│ chn_archived_at         │   │
└──────┬──────────────────┘   │
       │                      │
       ├── amb_talk_channel_members (chm_id, chn_id FK, usr_id FK)
       │     chm_role (OWNER/MEMBER), chm_pinned, chm_muted
       │
       ├── amb_talk_messages (msg_id, chn_id, usr_id)
       │     msg_content, msg_type, msg_is_pinned
       │     │
       │     ├── amb_talk_attachments (tat_id, msg_id FK)
       │     ├── amb_talk_reactions (trx_id, msg_id)
       │     └── amb_talk_message_hides (tmh_id, msg_id, usr_id)
       │
       └── amb_talk_read_status (trs_id, chn_id, usr_id)
             trs_last_read_at (읽음 위치 추적)
```

### 2.8 Communication 도메인

```
[메일]
amb_mail_accounts (mac_id) ── IMAP/SMTP 계정 (암호화)
  ├── amb_mail_messages (msg_id, msg_account_id)
  ├── amb_mail_attachments (mat_id, mat_message_id)
  └── amb_mail_queue (maq_id, maq_account_id)

[공지]
amb_notices (ntc_id, ent_id FK, usr_id FK)
  ├── ntc_visibility (PUBLIC/PRIVATE/CELL)
  ├── amb_notice_attachments (nta_id, ntc_id FK)
  └── amb_notice_reads (ntr_id, ntc_id, usr_id)

[알림]
amb_notifications (ntf_id, ent_id FK)
  ntf_type, ntf_recipient_id, ntf_sender_id
  ntf_resource_type, ntf_resource_id (다형성 참조)

[캘린더]
amb_calendars (cal_id, ent_id FK, usr_id FK)
  ├── amb_calendar_participants (clp_id, cal_id FK, usr_id FK)
  ├── amb_calendar_exceptions (cle_id, cal_id FK)
  ├── amb_calendar_recurrences (clr_id, cal_id FK)
  └── amb_calendar_notifications (cln_id, cal_id FK)

[회의록]
amb_meeting_notes (mtn_id, ent_id FK, usr_id FK)
  mtn_type (MEMO/MINUTES), mtn_visibility, mtn_cell_id
  ├── amb_meeting_note_comments (mnc_id, mtn_id FK)
  ├── amb_meeting_note_participants (mnpt_id, mtn_id FK, usr_id FK)
  ├── amb_meeting_note_issues (mni_id, mtn_id FK, iss_id FK)
  ├── amb_meeting_note_projects (mnp_id, mtn_id FK, pjt_id FK)
  └── amb_meeting_note_ratings (mnr_id, mtn_id FK, usr_id FK)

[번역]
amb_content_translations (trn_id)
  ├── amb_content_translation_history (cth_id, trn_id FK)
  └── amb_translation_glossary (tlg_id)
amb_translation_usage (tlu_id)
```

### 2.9 Todo/Today 도메인

```
[할 일]
amb_todos (tdo_id, ent_id FK, usr_id FK)
  tdo_parent_id (FK → self) ── 하위 할일
  iss_id (FK → issues) ── 이슈 연결
  ├── amb_todo_comments (tdc_id, tdo_id FK)
  ├── amb_todo_participants (tdp_id, tdo_id FK, usr_id FK)
  └── amb_todo_status_logs (tsl_id, tdo_id FK)

[오늘/데일리]
amb_today_reports (tdr_id) ── 오늘 리포트
amb_today_snapshots (snp_id) ── 오늘 스냅샷
  └── amb_today_snapshot_memos (snm_id, snp_id FK)
amb_daily_missions (dmn_id) ── 일일 미션

[워크리포트]
amb_work_reports (wkr_id) ── 작업 보고서
amb_work_items (wit_id, ent_id FK, wit_owner_id FK)
  ├── amb_work_item_comments (wic_id, wit_id FK)
  ├── amb_work_item_shares (wis_id, wit_id FK)
  └── amb_kms_work_item_tags (wtt_id, wit_id FK, tag_id FK)
```

### 2.10 Expense/Asset 도메인

```
[경비요청]
amb_expense_requests (exr_id)
  ├── amb_expense_request_items (eri_id, exr_id FK)
  ├── amb_expense_approvals (exa_id, exr_id FK)
  ├── amb_expense_attachments (eat_id, exr_id FK)
  └── amb_expense_executions (exe_id, exr_id FK)

[자산관리]
amb_assets (ast_id)
  ├── amb_asset_change_logs (acl_id, ast_id FK)
  └── amb_asset_requests (asr_id)
        ├── amb_asset_request_logs (arl_id, asr_id FK)
        ├── amb_asset_approval_histories (aah_id, asr_id FK)
        └── amb_meeting_reservations (mtr_id, asr_id FK)
```

### 2.11 Service Management 도메인

```
┌──────────────────────┐
│  amb_svc_services    │
│──────────────────────│
│ svc_id (PK/UUID)     │←──┐
│ svc_code             │   │
│ svc_name             │   │
│ svc_category         │   │
│ svc_status           │   │
└──────────────────────┘   │
                           │
┌──────────────────────┐   │    ┌──────────────────────────┐
│   amb_svc_plans      │   │    │  amb_svc_subscriptions   │
│──────────────────────│   │    │──────────────────────────│
│ spl_id (PK/UUID)     │←──┤    │ sub_id (PK/UUID)         │
│ svc_id (FK)          │───┘    │ cli_id (FK) → clients    │
│ spl_code             │        │ svc_id (FK) → services   │
│ spl_name             │        │ spl_id (FK) → plans      │
│ spl_price            │        │ sub_status               │
│ spl_billing_cycle    │        │ sub_start/end_date       │
│ spl_max_users        │        │ sub_stripe_subscription_id│
└──────────────────────┘        └──────────┬───────────────┘
                                           │
        ┌──────────────────────────┐       ├── amb_svc_subscription_history
        │   amb_svc_clients        │       └── amb_svc_usage_records
        │──────────────────────────│
        │ cli_id (PK/UUID)         │
        │ cli_company_name         │
        │ cli_type                 │
        │ cli_status               │
        │ cli_ent_id (FK)          │
        │ cli_stripe_customer_id   │
        │ cli_portal_source        │
        └──────┬───────────────────┘
               │
               ├── amb_svc_client_contacts (ctc_id, cli_id FK)
               ├── amb_svc_client_notes (cnt_id, cli_id FK)
               └── amb_client_invitations (civ_id, cli_id FK)

[포털 고객]
amb_svc_portal_customers (pct_id) ── 자체 인증 시스템
  ├── amb_svc_portal_payments (ppm_id, ppm_customer_id FK)
  └── amb_portal_user_mappings (pum_id, pct_id FK, usr_id FK)
```

### 2.12 KMS (지식관리) 도메인

```
[태그 시스템]
amb_kms_tags (tag_id, ent_id FK)
  tag_parent_id (FK → self) ── 계층 구조
  tag_name, tag_display, tag_level
  tag_embedding (AI 임베딩 벡터)
  ├── amb_kms_tag_relations (trl_id, tag_source_id FK, tag_target_id FK)
  │     trl_type (RELATED/SYNONYM/...), trl_weight
  ├── amb_kms_tag_synonyms (tsy_id, tag_id FK)
  └── amb_kms_work_item_tags (wtt_id, tag_id FK, wit_id FK)

[문서생성]
amb_kms_doc_types (dtp_id) ── 문서 유형
amb_kms_doc_templates (dml_id) ── 문서 템플릿
amb_kms_doc_generated (dgn_id) ── 생성된 문서
amb_kms_doc_assets (das_id) ── 문서 첨부자산

[기반데이터]
amb_kms_doc_base_categories (dbc_id) ── 기반데이터 카테고리
amb_kms_doc_base_data (dbd_id) ── 기반데이터
amb_kms_doc_base_data_history (dbh_id) ── 이력
amb_kms_doc_edit_history (deh_id) ── 편집 이력

[DDD 분석]
amb_kms_ddd_frameworks (ddf_id) ── DDD 프레임워크
amb_kms_ddd_metrics (ddm_id) ── 메트릭 정의
amb_kms_ddd_gauge_scores (dgs_id) ── 게이지 점수
amb_kms_ddd_snapshots (dds_id) ── 스냅샷
amb_kms_ddd_dashboards (ddd_id) ── 대시보드
amb_kms_ddd_ai_insights (dai_id) ── AI 인사이트
```

### 2.13 Integration 도메인

```
[Asana 연동]
amb_asana_project_mappings (apm_id, ent_id)
  └── amb_asana_task_mappings (atm_id, apm_id FK)

[Migration (Redmine)]
amb_migration_logs (mgl_id) ── 마이그레이션 이력
amb_migration_user_map (redmine_user_id, amb_user_id FK)

[Slack 연동]
amb_slack_workspace_configs (swc_id, ent_id) ── 워크스페이스 (암호화 토큰)
  └── amb_slack_channel_mappings (scm_id, swc_id FK, chn_id)
        └── amb_slack_message_mappings (smm_id, scm_id)

[파트너앱]
amb_partners (ptn_id)
  └── amb_partner_apps (pap_id, ptn_id FK)
        ├── amb_partner_app_versions (pav_id, pap_id FK)
        └── amb_partner_app_installs (pai_id, pap_id FK, ent_id)

[결제게이트웨이]
amb_pg_configs (pgc_id, ent_id FK) ── PG 설정 (암호화 키)
  └── amb_pg_transactions (pgt_id, pgc_id FK, ent_id FK)
        pgt_status (PENDING/SUCCESS/FAIL/REFUND)
```

### 2.14 Settings/Config 도메인

```
[메뉴 시스템]
amb_menu_config (mcf_id) ── 메뉴 정의
amb_menu_permissions (mpm_id) ── 역할별 메뉴 권한
amb_menu_cell_permissions (mcp_id) ── 셀별 메뉴 권한
amb_menu_unit_permissions (mup_id) ── 유닛별 메뉴 권한

[설정]
amb_smtp_settings (sms_id) ── SMTP 설정 (암호화)
amb_api_keys (apk_id, ent_id FK) ── API 키 (AES-256-GCM)
amb_entity_custom_apps (eca_id, ent_id FK) ── 커스텀 앱
amb_entity_ai_configs (eac_id) ── AI 설정
amb_entity_api_quotas (eaq_id, ent_id FK) ── API 할당량
amb_email_templates (emt_id, ent_id FK) ── 이메일 템플릿
amb_drive_settings (drs_id, ent_id FK) ── Google Drive 설정
amb_drive_folders (drf_id) ── Drive 폴더 매핑

[CMS]
amb_cms_site_config (csc_id, ent_id FK) ── 사이트 설정
amb_cms_pages (cps_id) ── CMS 페이지
amb_cms_page_contents (cpc_id) ── 페이지 콘텐츠
amb_cms_page_versions (cpv_id) ── 버전관리
amb_cms_sections (css_id) ── 섹션
amb_cms_menus (cmn_id) ── CMS 메뉴
amb_cms_posts (cpt_id) ── 게시글
amb_cms_post_attachments (cpa_id) ── 첨부파일
amb_cms_post_categories (cpk_id) ── 카테고리
amb_cms_subscribers (csb_id) ── 구독자

[사이트/분석]
amb_site_settings (sts_id, ent_id) ── 사이트 설정
amb_site_event_logs (sel_id) ── 이벤트 로그
amb_page_views (pvw_id) ── 페이지뷰 추적
```

---

## 3. 테이블 상세 명세

### 3.1 Core 테이블

#### amb_users
| 컬럼명 | 타입 | Nullable | 기본값 | 설명 |
|--------|------|----------|--------|------|
| usr_id | uuid | NO | uuid_generate_v4() | PK |
| usr_email | varchar(200) | NO | | 이메일 (로그인ID) |
| usr_password | varchar(200) | YES | | bcrypt 해시 |
| usr_name | varchar(100) | NO | | 이름 |
| usr_phone | varchar(30) | YES | | 전화번호 |
| usr_role | varchar(20) | NO | 'USER' | USER/MANAGER/ADMIN |
| usr_level | varchar(20) | NO | 'USER_LEVEL' | ADMIN_LEVEL/USER_LEVEL/CLIENT_LEVEL/PARTNER_LEVEL |
| usr_status | varchar(20) | NO | 'PENDING' | PENDING/ACTIVE/INACTIVE/SUSPENDED/WITHDRAWN |
| usr_company_id | uuid | YES | | FK → amb_hr_entities |
| usr_cli_id | uuid | YES | | FK → amb_svc_clients |
| usr_partner_id | uuid | YES | | FK → amb_partners |
| usr_timezone | varchar(50) | YES | | IANA 타임존 |
| usr_language | varchar(10) | YES | 'ko' | 기본 언어 |
| usr_profile_image | varchar(500) | YES | | 프로필 이미지 URL |
| usr_is_password_changed | boolean | NO | false | 초기 비밀번호 변경 여부 |
| usr_created_at | timestamp | NO | now() | 생성일 |
| usr_updated_at | timestamp | NO | now() | 수정일 |
| usr_deleted_at | timestamp | YES | | Soft Delete |

#### amb_hr_entities
| 컬럼명 | 타입 | Nullable | 기본값 | 설명 |
|--------|------|----------|--------|------|
| ent_id | uuid | NO | uuid_generate_v4() | PK |
| ent_code | varchar(30) | NO | | 법인 코드 |
| ent_name | varchar(200) | NO | | 법인명 |
| ent_name_local | varchar(200) | YES | | 현지어 법인명 |
| ent_type | varchar(20) | NO | | COMPANY/TEAM/DIVISION |
| ent_country | varchar(5) | YES | | 국가코드 (KR/VN) |
| ent_currency | varchar(3) | YES | | 통화 (KRW/VND/USD) |
| ent_parent_id | uuid | YES | | FK → self (상위 법인) |
| ent_logo_url | varchar(500) | YES | | 로고 URL |
| ent_tax_id | varchar(50) | YES | | 사업자등록번호 |
| ent_created_at | timestamp | NO | now() | |
| ent_updated_at | timestamp | NO | now() | |
| ent_deleted_at | timestamp | YES | | |

### 3.2 주요 도메인 테이블 (컬럼 수 기준 상위)

| 테이블명 | 컬럼 수 | 주요 용도 |
|---------|---------|----------|
| amb_pg_transactions | 28 | 결제 거래 (PG 응답 전체 보관) |
| amb_pg_configs | 23 | PG 설정 (암호화 키 6종) |
| amb_users | 18+ | 사용자 마스터 |
| amb_svc_clients | 18 | B2B 고객사 |
| amb_svc_portal_customers | 16 | 포털 고객 (별도 인증) |
| amb_hr_employees | 30+ | 직원 마스터 |
| amb_bil_contracts | 20+ | 계약 관리 |
| amb_issues | 22+ | 이슈 추적 |
| amb_kms_tags | 13 | 태그 (임베딩 포함) |
| amb_mail_messages | 18 | 이메일 메시지 |

---

## 4. FK 관계 목록 (201개)

### 4.1 핵심 참조 허브 (가장 많이 참조되는 테이블)

| 테이블 | 참조 횟수 | 역할 |
|--------|----------|------|
| **amb_hr_entities** | 40+ | 멀티테넌트 핵심 (ent_id) |
| **amb_users** | 35+ | 사용자 참조 (usr_id) |
| **amb_hr_employees** | 10+ | HR 도메인 핵심 (emp_id) |
| **kms_projects** | 6 | 프로젝트 참조 (pjt_id) |
| **amb_issues** | 5 | 이슈 참조 (iss_id) |
| **amb_svc_clients** | 5 | 클라이언트 참조 (cli_id) |
| **amb_todos** | 4 | 할 일 참조 (tdo_id) |

### 4.2 전체 FK 관계

| 소스 테이블 | 소스 컬럼 | 대상 테이블 | 대상 컬럼 |
|------------|----------|------------|----------|
| amb_access_audit_log | aal_user_id | amb_users | usr_id |
| amb_ai_quota_topups | ent_id | amb_hr_entities | ent_id |
| amb_ai_quota_topups | aqp_id | amb_ai_quota_products | aqp_id |
| amb_ai_quota_topups | pgt_id | amb_pg_transactions | pgt_id |
| amb_ai_token_entity_summary | ent_id | amb_hr_entities | ent_id |
| amb_ai_token_usage | ent_id | amb_hr_entities | ent_id |
| amb_ai_token_usage | usr_id | amb_users | usr_id |
| amb_ai_token_usage | cvs_id | amb_conversations | cvs_id |
| amb_api_keys | ent_id | amb_hr_entities | ent_id |
| amb_asana_task_mappings | apm_id | amb_asana_project_mappings | apm_id |
| amb_asset_approval_histories | aah_approver_id | amb_users | usr_id |
| amb_asset_approval_histories | asr_id | amb_asset_requests | asr_id |
| amb_asset_change_logs | ast_id | amb_assets | ast_id |
| amb_asset_change_logs | acl_changed_by | amb_users | usr_id |
| amb_asset_request_logs | arl_changed_by | amb_users | usr_id |
| amb_asset_request_logs | asr_id | amb_asset_requests | asr_id |
| amb_attendances | ent_id | amb_hr_entities | ent_id |
| amb_attendances | usr_id | amb_users | usr_id |
| amb_bank_accounts | ent_id | amb_hr_entities | ent_id |
| amb_bil_contract_history | ctr_id | amb_bil_contracts | ctr_id |
| amb_bil_contract_milestones | ctr_id | amb_bil_contracts | ctr_id |
| amb_bil_contracts | ent_id | amb_hr_entities | ent_id |
| amb_bil_contracts | ptn_id | amb_bil_partners | ptn_id |
| amb_bil_documents | ent_id | amb_hr_entities | ent_id |
| amb_bil_invoice_items | inv_id | amb_bil_invoices | inv_id |
| amb_bil_invoices | ent_id | amb_hr_entities | ent_id |
| amb_bil_invoices | ctr_id | amb_bil_contracts | ctr_id |
| amb_bil_invoices | ptn_id | amb_bil_partners | ptn_id |
| amb_bil_partners | ent_id | amb_hr_entities | ent_id |
| amb_bil_payments | ent_id | amb_hr_entities | ent_id |
| amb_bil_payments | inv_id | amb_bil_invoices | inv_id |
| amb_bil_sow | ctr_id | amb_bil_contracts | ctr_id |
| amb_bil_sow | ent_id | amb_hr_entities | ent_id |
| amb_calendar_exceptions | cal_id | amb_calendars | cal_id |
| amb_calendar_notifications | cal_id | amb_calendars | cal_id |
| amb_calendar_participants | usr_id | amb_users | usr_id |
| amb_calendar_participants | clp_invited_by | amb_users | usr_id |
| amb_calendar_participants | cal_id | amb_calendars | cal_id |
| amb_calendar_recurrences | cal_id | amb_calendars | cal_id |
| amb_calendars | ent_id | amb_hr_entities | ent_id |
| amb_calendars | usr_id | amb_users | usr_id |
| amb_cells | ent_id | amb_hr_entities | ent_id |
| amb_client_invitations | civ_invited_by | amb_users | usr_id |
| amb_client_invitations | cli_id | amb_svc_clients | cli_id |
| amb_cms_site_config | csc_updated_by | amb_users | usr_id |
| amb_cms_site_config | ent_id | amb_hr_entities | ent_id |
| amb_cms_site_config | csc_published_by | amb_users | usr_id |
| amb_content_translation_history | trn_id | amb_content_translations | trn_id |
| amb_conversations | ent_id | amb_hr_entities | ent_id |
| amb_conversations | usr_id | amb_users | usr_id |
| amb_drive_settings | ent_id | amb_hr_entities | ent_id |
| amb_email_templates | ent_id | amb_hr_entities | ent_id |
| amb_entity_api_quotas | ent_id | amb_hr_entities | ent_id |
| amb_entity_api_quotas | eaq_updated_by | amb_users | usr_id |
| amb_entity_custom_apps | ent_id | amb_hr_entities | ent_id |
| amb_expense_approvals | exr_id | amb_expense_requests | exr_id |
| amb_expense_attachments | exr_id | amb_expense_requests | exr_id |
| amb_expense_executions | exr_id | amb_expense_requests | exr_id |
| amb_expense_forecast_items | efr_id | amb_expense_forecast_reports | efr_id |
| amb_expense_request_items | exr_id | amb_expense_requests | exr_id |
| amb_hr_business_income_payments | ent_id | amb_hr_entities | ent_id |
| amb_hr_business_income_payments | frl_id | amb_hr_freelancers | frl_id |
| amb_hr_dependents | emp_id | amb_hr_employees | emp_id |
| amb_hr_employees | usr_id | amb_users | usr_id |
| amb_hr_employees | ent_id | amb_hr_entities | ent_id |
| amb_hr_employees_kr | emp_id | amb_hr_employees | emp_id |
| amb_hr_entities | ent_parent_id | amb_hr_entities | ent_id |
| amb_hr_entity_user_roles | ent_id | amb_hr_entities | ent_id |
| amb_hr_freelancers | ent_id | amb_hr_entities | ent_id |
| amb_hr_insurance_params_kr | ent_id | amb_hr_entities | ent_id |
| amb_hr_leave_balances | emp_id | amb_hr_employees | emp_id |
| amb_hr_leave_requests | ent_id | amb_hr_entities | ent_id |
| amb_hr_leave_requests | usr_id | amb_users | usr_id |
| amb_hr_leave_requests | emp_id | amb_hr_employees | emp_id |
| amb_hr_ot_records | emp_id | amb_hr_employees | emp_id |
| amb_hr_payroll_details | pyp_id | amb_hr_payroll_periods | pyp_id |
| amb_hr_payroll_details | emp_id | amb_hr_employees | emp_id |
| amb_hr_payroll_entries_kr | pyp_id | amb_hr_payroll_periods | pyp_id |
| amb_hr_payroll_entries_kr | emp_id | amb_hr_employees | emp_id |
| amb_hr_payroll_entries_kr | ent_id | amb_hr_entities | ent_id |
| amb_hr_salary_history | emp_id | amb_hr_employees | emp_id |
| amb_hr_tax_simple_table | ent_id | amb_hr_entities | ent_id |
| amb_hr_timesheets | pyp_id | amb_hr_payroll_periods | pyp_id |
| amb_hr_timesheets | emp_id | amb_hr_employees | emp_id |
| amb_hr_yearend_adjustments | ent_id | amb_hr_entities | ent_id |
| amb_hr_yearend_adjustments | emp_id | amb_hr_employees | emp_id |
| amb_invitations | inv_partner_id | amb_partners | ptn_id |
| amb_invitations | inv_company_id | amb_hr_entities | ent_id |
| amb_issue_comments | isc_author_id | amb_users | usr_id |
| amb_issue_comments | iss_id | amb_issues | iss_id |
| amb_issue_participants | usr_id | amb_users | usr_id |
| amb_issue_participants | iss_id | amb_issues | iss_id |
| amb_issue_status_logs | iss_id | amb_issues | iss_id |
| amb_issue_status_logs | isl_changed_by | amb_users | usr_id |
| amb_issues | pjt_id | kms_projects | pjt_id |
| amb_issues | ent_id | amb_hr_entities | ent_id |
| amb_issues | iss_reporter_id | amb_users | usr_id |
| amb_issues | iss_assignee_id | amb_users | usr_id |
| amb_issues | epc_id | amb_project_epics | epc_id |
| amb_issues | cmp_id | amb_project_components | cmp_id |
| amb_kms_tag_relations | tag_target_id | amb_kms_tags | tag_id |
| amb_kms_tag_relations | tag_source_id | amb_kms_tags | tag_id |
| amb_kms_tag_synonyms | tag_id | amb_kms_tags | tag_id |
| amb_kms_tags | tag_parent_id | amb_kms_tags | tag_id |
| amb_kms_tags | ent_id | amb_hr_entities | ent_id |
| amb_kms_work_item_tags | wit_id | amb_work_items | wit_id |
| amb_kms_work_item_tags | tag_id | amb_kms_tags | tag_id |
| amb_kms_work_item_tags | wtt_assigned_by | amb_users | usr_id |
| amb_login_histories | usr_id | amb_users | usr_id |
| amb_meeting_note_comments | mtn_id | amb_meeting_notes | mtn_id |
| amb_meeting_note_comments | mnc_author_id | amb_users | usr_id |
| amb_meeting_note_issues | mtn_id | amb_meeting_notes | mtn_id |
| amb_meeting_note_issues | iss_id | amb_issues | iss_id |
| amb_meeting_note_participants | mtn_id | amb_meeting_notes | mtn_id |
| amb_meeting_note_participants | usr_id | amb_users | usr_id |
| amb_meeting_note_projects | mtn_id | amb_meeting_notes | mtn_id |
| amb_meeting_note_projects | pjt_id | kms_projects | pjt_id |
| amb_meeting_note_ratings | usr_id | amb_users | usr_id |
| amb_meeting_note_ratings | mtn_id | amb_meeting_notes | mtn_id |
| amb_meeting_notes | usr_id | amb_users | usr_id |
| amb_meeting_notes | ent_id | amb_hr_entities | ent_id |
| amb_meeting_reservations | asr_id | amb_asset_requests | asr_id |
| amb_messages | cvs_id | amb_conversations | cvs_id |
| amb_migration_user_map | amb_user_id | amb_users | usr_id |
| amb_notice_attachments | ntc_id | amb_notices | ntc_id |
| amb_notices | ent_id | amb_hr_entities | ent_id |
| amb_notices | usr_id | amb_users | usr_id |
| amb_notifications | ent_id | amb_hr_entities | ent_id |
| amb_notifications | ntf_recipient_id | amb_users | usr_id |
| amb_notifications | ntf_sender_id | amb_users | usr_id |
| amb_partner_app_installs | pap_id | amb_partner_apps | pap_id |
| amb_partner_app_versions | pap_id | amb_partner_apps | pap_id |
| amb_partner_apps | ptn_id | amb_partners | ptn_id |
| amb_password_resets | usr_id | amb_users | usr_id |
| amb_pg_configs | ent_id | amb_hr_entities | ent_id |
| amb_pg_transactions | ent_id | amb_hr_entities | ent_id |
| amb_pg_transactions | pgc_id | amb_pg_configs | pgc_id |
| amb_portal_user_mappings | usr_id | amb_users | usr_id |
| amb_portal_user_mappings | pum_created_by | amb_users | usr_id |
| amb_portal_user_mappings | pct_id | amb_svc_portal_customers | pct_id |
| amb_project_components | cmp_owner_id | amb_users | usr_id |
| amb_project_components | ent_id | amb_hr_entities | ent_id |
| amb_project_components | pjt_id | kms_projects | pjt_id |
| amb_project_components | cmp_created_by | amb_users | usr_id |
| amb_project_epics | epc_created_by | amb_users | usr_id |
| amb_project_epics | pjt_id | kms_projects | pjt_id |
| amb_project_epics | ent_id | amb_hr_entities | ent_id |
| amb_recurring_expenses | bac_id | amb_bank_accounts | bac_id |
| amb_slack_channel_mappings | swc_id | amb_slack_workspace_configs | swc_id |
| amb_svc_client_contacts | cli_id | amb_svc_clients | cli_id |
| amb_svc_client_notes | cnt_author_id | amb_users | usr_id |
| amb_svc_client_notes | cli_id | amb_svc_clients | cli_id |
| amb_svc_client_notes | sub_id | amb_svc_subscriptions | sub_id |
| amb_svc_clients | cli_ent_id | amb_hr_entities | ent_id |
| amb_svc_clients | cli_account_manager_id | amb_users | usr_id |
| amb_svc_plans | svc_id | amb_svc_services | svc_id |
| amb_svc_subscription_history | sub_id | amb_svc_subscriptions | sub_id |
| amb_svc_subscriptions | spl_id | amb_svc_plans | spl_id |
| amb_svc_subscriptions | svc_id | amb_svc_services | svc_id |
| amb_svc_subscriptions | cli_id | amb_svc_clients | cli_id |
| amb_talk_attachments | msg_id | amb_talk_messages | msg_id |
| amb_today_snapshot_memos | snp_id | amb_today_snapshots | snp_id |
| amb_todo_comments | tdo_id | amb_todos | tdo_id |
| amb_todo_participants | usr_id | amb_users | usr_id |
| amb_todo_participants | tdo_id | amb_todos | tdo_id |
| amb_todo_status_logs | tdo_id | amb_todos | tdo_id |
| amb_todo_status_logs | tsl_changed_by | amb_users | usr_id |
| amb_todos | usr_id | amb_users | usr_id |
| amb_todos | ent_id | amb_hr_entities | ent_id |
| amb_todos | tdo_parent_id | amb_todos | tdo_id |
| amb_todos | iss_id | amb_issues | iss_id |
| amb_transactions | bac_id | amb_bank_accounts | bac_id |
| amb_units | unt_parent_id | amb_units | unt_id |
| amb_units | ent_id | amb_hr_entities | ent_id |
| amb_user_menu_permissions | ump_granted_by | amb_users | usr_id |
| amb_user_menu_permissions | usr_id | amb_users | usr_id |
| amb_user_unit_roles | usr_id | amb_users | usr_id |
| amb_user_unit_roles | unt_id | amb_units | unt_id |
| amb_users | usr_company_id | amb_hr_entities | ent_id |
| amb_users | usr_cli_id | amb_svc_clients | cli_id |
| amb_users | usr_partner_id | amb_partners | ptn_id |
| amb_work_item_comments | wic_parent_id | amb_work_item_comments | wic_id |
| amb_work_item_comments | wic_author_id | amb_users | usr_id |
| amb_work_item_comments | wit_id | amb_work_items | wit_id |
| amb_work_item_shares | wis_shared_by | amb_users | usr_id |
| amb_work_item_shares | wit_id | amb_work_items | wit_id |
| amb_work_items | ent_id | amb_hr_entities | ent_id |
| amb_work_items | wit_owner_id | amb_users | usr_id |
| kms_project_clients | cli_id | amb_svc_clients | cli_id |
| kms_project_clients | pjt_id | kms_projects | pjt_id |
| kms_project_files | pjt_id | kms_projects | pjt_id |
| kms_project_files | pfl_uploaded_by | amb_users | usr_id |
| kms_project_members | usr_id | amb_users | usr_id |
| kms_project_members | pjt_id | kms_projects | pjt_id |
| kms_project_reviews | pjt_id | kms_projects | pjt_id |
| kms_project_reviews | prv_reviewer_id | amb_users | usr_id |
| kms_projects | pjt_parent_id | kms_projects | pjt_id |
| kms_projects | pjt_sponsor_id | amb_users | usr_id |
| kms_projects | ent_id | amb_hr_entities | ent_id |
| kms_projects | pjt_proposer_id | amb_users | usr_id |

---

## 5. 네이밍 컨벤션 요약

### 5.1 테이블 prefix 매핑

| Prefix | 도메인 | 예시 테이블 |
|--------|--------|------------|
| `amb_` | 공통 (기본 접두사) | amb_users, amb_issues |
| `amb_hr_` | HR/인사 | amb_hr_employees, amb_hr_payroll_periods |
| `amb_bil_` | Billing/청구 | amb_bil_contracts, amb_bil_invoices |
| `amb_kms_` | KMS/지식관리 | amb_kms_tags, amb_kms_doc_generated |
| `amb_talk_` | Amoeba Talk | amb_talk_channels, amb_talk_messages |
| `amb_svc_` | Service Mgmt | amb_svc_clients, amb_svc_subscriptions |
| `amb_cms_` | CMS | amb_cms_pages, amb_cms_posts |
| `amb_pg_` | 결제 게이트웨이 | amb_pg_configs, amb_pg_transactions |
| `amb_mail_` | 메일 | amb_mail_messages, amb_mail_accounts |
| `amb_slack_` | Slack 연동 | amb_slack_workspace_configs |
| `kms_` | 프로젝트 (레거시) | kms_projects, kms_project_members |

### 5.2 컬럼 prefix 매핑

| 컬럼 Prefix | 테이블 | 예시 |
|------------|--------|------|
| `usr_` | amb_users | usr_email, usr_name |
| `ent_` | amb_hr_entities | ent_code, ent_name |
| `iss_` | amb_issues | iss_title, iss_status |
| `chn_` | amb_talk_channels | chn_name, chn_type |
| `msg_` | amb_talk_messages / amb_messages | msg_content |
| `ctr_` | amb_bil_contracts | ctr_title, ctr_amount |
| `inv_` | amb_bil_invoices | inv_number, inv_amount |
| `emp_` | amb_hr_employees | emp_name, emp_join_date |
| `tag_` | amb_kms_tags | tag_name, tag_level |
| `pjt_` | kms_projects | pjt_name, pjt_status |
| `tdo_` | amb_todos | tdo_title, tdo_status |
| `mtn_` | amb_meeting_notes | mtn_title, mtn_content |
| `ntc_` | amb_notices | ntc_title, ntc_content |
| `ntf_` | amb_notifications | ntf_type, ntf_title |
| `cal_` | amb_calendars | cal_title, cal_start_at |
| `bac_` | amb_bank_accounts | bac_bank_name |
| `txn_` | amb_transactions | txn_amount, txn_type |
| `ast_` | amb_assets | ast_name, ast_serial |
| `exr_` | amb_expense_requests | exr_title, exr_amount |
| `pgt_` | amb_pg_transactions | pgt_amount, pgt_status |
| `pgc_` | amb_pg_configs | pgc_provider |
| `apk_` | amb_api_keys | apk_provider, apk_name |
| `mac_` | amb_mail_accounts | mac_email |
| `agc_` | amb_agent_configs | agc_unit_code |
| `atu_` | amb_ai_token_usage | atu_model |
| `ptn_` | amb_partners | ptn_code, ptn_company_name |
| `pap_` | amb_partner_apps | pap_code, pap_name |
| `cli_` | amb_svc_clients | cli_company_name |
| `svc_` | amb_svc_services | svc_code, svc_name |
| `spl_` | amb_svc_plans | spl_code, spl_price |
| `sub_` | amb_svc_subscriptions | sub_status |

### 5.3 공통 패턴

| 패턴 | 규칙 | 비고 |
|------|------|------|
| PK | `{prefix}_id` (uuid) | 예외 없음 |
| Soft Delete | `{prefix}_deleted_at` (timestamp, nullable) | 대부분 테이블 적용 |
| 생성일 | `{prefix}_created_at` (timestamp, NOT NULL, default now()) | |
| 수정일 | `{prefix}_updated_at` (timestamp, NOT NULL, default now()) | |
| 상태 | `{prefix}_status` (varchar(20)) | ENUM 대신 문자열 |
| 다국어 원본 | `{prefix}_original_lang` (varchar(5), default 'ko') | 일부 테이블 |
| 셀 소속 | `{prefix}_cell_id` (uuid, nullable) | 데이터 격리 |
| 법인 소속 | `ent_id` (uuid) | 멀티테넌트 핵심 |
| 가시성 | `{prefix}_visibility` (varchar(20)) | PRIVATE/CELL/ENTITY |
| 암호화 필드 | `{prefix}_encrypted` + `{prefix}_iv` + `{prefix}_tag` | AES-256-GCM 패턴 |
| Boolean | `{prefix}_is_{name}` | is_active, is_pinned 등 |

---

## 문서 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0 | 2026-03-23 | AMA System | 스테이징 DB 기준 최초 작성 (188 테이블, 201 FK) |
