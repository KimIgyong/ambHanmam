# AMB Management - 프로젝트 명세서

**문서버전:** v5.0
**작성일:** 2026-02-14
**최종 수정일:** 2026-03-21

---

## 1. 프로젝트 정보

| 항목 | 값 |
|------|-----|
| 프로젝트 코드 | AMB |
| 프로젝트명 | AMB Management - 회사 업무 AI 에이전트 시스템 |
| DB 이름 | `db_amb_hanmam` |
| 테이블 Prefix | `amb_` |
| API Base Path | `/api/v1` |
| API 포트 | 3019 |
| Web 포트 | 5189 |
| 총 DB 테이블 | 140+개 |
| 도메인 모듈 | 37개 (백엔드) / 36개 (프론트엔드) |

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│          Presentation Layer                                 │
│  Controller, Request/Response DTO, Validation               │
├─────────────────────────────────────────────────────────────┤
│          Application Layer                                  │
│  Service, Mapper, AgentFactory                              │
├─────────────────────────────────────────────────────────────┤
│          Domain Layer                                       │
│  Entity, BaseAgentService, 9 Department Agents              │
├─────────────────────────────────────────────────────────────┤
│          Infrastructure Layer                               │
│  TypeORM Repository, Claude API, Google Drive, Mail, File   │
│  pgvector, pg_trgm                                          │
├─────────────────────────────────────────────────────────────┤
│          External Services                                  │
│  Postal Mail Server, Google Drive API, Anthropic Claude     │
└─────────────────────────────────────────────────────────────┘
```

## 3. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| Frontend | React | 18.x |
| Frontend | TypeScript | 5.x |
| Frontend | TailwindCSS | 3.x |
| Frontend | Vite | 5.x |
| Frontend | Zustand | 4.x |
| Frontend | React Query (TanStack) | 5.x |
| Frontend | React Hook Form + Zod | 7.x / 3.x |
| Frontend | React Router | 6.x |
| Frontend | Tiptap Editor | 3.x |
| Frontend | DOMPurify | 3.x |
| Backend | NestJS | 10.x |
| Backend | TypeORM | 0.3.x |
| Backend | PostgreSQL | 15.x |
| Backend | Passport + JWT | - |
| Backend | Multer (파일 업로드) | - |
| Backend | Nodemailer (SMTP) | 8.x |
| Backend | ImapFlow (IMAP) | 1.x |
| Backend | ExcelJS | 4.x |
| Backend | PDFKit | 0.17.x |
| Backend | @nestjs/schedule (크론) | 6.x |
| Backend | @nestjs/throttler (Rate Limit) | 5.x |
| AI | Anthropic Claude API | @anthropic-ai/sdk 0.24.x |
| 외부 | Google Drive API (googleapis) | 171.x |
| 메일 | Postal (오픈소스 메일 서버) | 3.3.x |
| i18n | i18next, react-i18next | 25.x, 16.x |
| 모노레포 | npm workspaces + Turborepo | 2.8 |

## 4. 도메인 모듈 현황

### 4.1 백엔드 도메인 (apps/api/src/domain) — 37개 모듈

#### 핵심 모듈 (v4.0 기존 17개)

| 모듈 | 주요 기능 | 테이블 수 |
|------|----------|-----------|
| **auth** | JWT 인증 (로그인, 회원가입, 토큰 갱신, 비밀번호 재설정/변경) | 2 |
| **agent** | 9개 부서 AI 에이전트 정보 | 0 |
| **chat** | 대화 CRUD, SSE 스트리밍 메시지 | 2 |
| **todo** | 할일 CRUD (상태: SCHEDULED/IN_PROGRESS/COMPLETED) | 1 |
| **meeting-notes** | 회의록 CRUD (공개범위: PRIVATE/DEPARTMENT/PUBLIC) | 1 |
| **work-schedule** | 근무 일정 관리 (출근/원격/반차/휴가) | 1 |
| **notices** | 공지사항 CRUD, 파일 첨부, 조회수, 읽음 추적 | 3 |
| **drive** | Google Drive 문서함 (폴더 등록, 파일 탐색/검색/다운로드) | 1 |
| **accounting** | 은행 계좌 관리, 거래 CRUD, Excel 가져오기, 잔액 추적 | 2 |
| **hr** | 직원/프리랜서, 급여(VN/KR), 근태, 초과근무, 연차, 퇴직금, 연말정산 | 19 |
| **billing** | 거래처, 계약, SOW, 인보이스, 결제, 문서, 자동 청구 | 9 |
| **webmail** | Postal 연동 메일 계정, 메시지 송수신, 첨부파일, 발송 큐 | 4 |
| **members** | 멤버/그룹 관리, 역할 변경 | 2 |
| **settings** | API 키, SMTP 설정, 메뉴 권한, Drive 설정 | 4 |
| **invitation** | 이메일 초대, 토큰 검증 | 1 |
| **department** | 부서 계층 구조, 사용자-부서 역할, 조직 계층 탐색 | 2 |
| **acl** | 작업물 소유권/가시성, 공유, 코멘트/피드백, 감사 로그 | 4 |
| **kms** | 폭소노미 태그 (3단계), AI 태그 추출, 태그 클라우드, 지식 그래프 | 4 |

#### 확장 모듈 (v5.0 신규 20개)

| 모듈 | 주요 기능 | 테이블 수 |
|------|----------|-----------|
| **project** | 프로젝트 관리 (EPIC, Component, WBS, 간트차트, AI 검토, 멤버, 파일) | 7 |
| **issues** | 이슈 추적 (상태 로그, 참여자, 순번 생성, 코멘트, AI 분석) | 5 |
| **calendar** | 캘린더 (재발 일정, Google 싱크, 참여자, 알림, AI 분석) | 5 |
| **asset** | 자산 관리 (요청, 승인 워크플로, 회의실 예약, 변경 로그) | 6 |
| **amoeba-talk** | 실시간 메시징 (채널, SSE, 번역, 읽음 상태, 리액션, 첨부) | 6 |
| **notification** | 알림 시스템 (SSE, Web Push, 구독 관리) | 2 |
| **client-portal** | 고객사 포털 (인증, 프로젝트 조회, 이슈 등록/추적) | 1 |
| **today** | 오늘 업무 (AI 일일 요약, 미션, 스냅샷, 메모) | 4 |
| **analytics** | 사이트 분석 (이벤트 로깅) | 1 |
| **search** | 통합 검색 (ACL, KMS 크로스 모듈) | 0 |
| **translation** | 다국어 번역 (콘텐츠 번역, 히스토리, 용어집, 사용량) | 4 |
| **expense-request** | 지출 결의 (승인 워크플로, 집행, 예측, 정기 지출) | 7 |
| **report** | 업무 보고서 (AI 일일/주간 생성, 집계) | 1 |
| **site-management** | CMS (메뉴, 페이지, 섹션, 블로그, 구독자, 사이트 설정) | 10 |
| **service-management** | 서비스 카탈로그 (서비스, 플랜, 고객, 구독, 히스토리) | 7 |
| **portal-bridge** | 포털 연동 (고객 읽기전용 싱크, 매핑) | 2 |
| **admin** | 관리자 대시보드 | 0 |
| **entity-settings** | 엔티티 설정 (AI 설정, 커스텀 앱, 로그인 이력, 페이지뷰) | 4 |
| **ai-usage** | AI 사용량 추적 (토큰 사용, 엔티티 요약, API 할당량) | 3 |
| **attendance** | 근태 관리 (출퇴근 기록) | 1 |
| **migration** | Redmine 마이그레이션 (사용자 매핑, 로그) | 2 |

### 4.2 인프라 모듈 (apps/api/src/infrastructure)

| 모듈 | 설명 |
|------|------|
| **claude** | Anthropic Claude API 연동 (스트리밍/비스트리밍, Mock 지원) |
| **mail** | Nodemailer SMTP 이메일 발송 (비밀번호 재설정, 초대 메일) |
| **file** | Multer 기반 파일 업로드/다운로드 (로컬 저장, UUID 파일명) |
| **google-drive** | Google Drive API 연동 (Service Account, 공유 드라이브 지원) |
| **google-calendar** | Google Calendar API 연동 (일정 동기화) |
| **typeorm** | pgvector 커스텀 컬럼 트랜스포머 (`vector.column.ts`) |
| **postal** | Postal 메일 서버 연동 (IMAP 동기화, 웹훅) |
| **web-push** | Web Push 알림 (VAPID 인증) |
| **sse** | Server-Sent Events 관리 (연결 풀, 하트비트) |

### 4.3 전역 설정 (apps/api/src/global)

| 구성요소 | 설명 |
|---------|------|
| **에러 코드** | E1xxx~E27xxx 모듈별 체계 |
| **@Public()** | 인증 불필요 데코레이터 |
| **@CurrentUser()** | 요청 사용자 정보 주입 |
| **@Roles()** | 역할 기반 접근 제어 |
| **RolesGuard** | 역할 검증 (계층: CLIENT_MEMBER < USER < MANAGER < ADMIN < SUPER_ADMIN) |
| **AdminGuard** | ADMIN 전용 가드 |
| **AdminLevelGuard** | ADMIN 레벨 이상 가드 (ADMIN + SUPER_ADMIN) |
| **OwnEntityGuard** | 해당 법인 소속 확인 가드 |
| **MenuGuard** | 메뉴 접근 권한 가드 |
| **EntitySettingsGuard** | 엔티티 설정 접근 가드 |
| **TransformInterceptor** | 표준 응답 포맷 변환 |
| **BusinessException** | 비즈니스 예외 처리 |
| **메뉴 코드** | 35+개 메뉴 권한 코드 |

## 5. DB 테이블 설계

### 네이밍 규칙
- 테이블: `amb_` + snake_case 복수형
- 컬럼: 3자 prefix + snake_case
- PK: `{prefix}_id` (UUID)
- Soft Delete: `{prefix}_deleted_at`

---

### 5.1 인증 모듈 (2개)

#### amb_users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| usr_id (PK) | UUID | 사용자 ID |
| usr_email | VARCHAR(200) UNIQUE | 이메일 |
| usr_password | VARCHAR(200) | bcrypt 해시 |
| usr_name | VARCHAR(50) | 이름 |
| usr_department | VARCHAR(30) | 직무 |
| usr_role | VARCHAR(20) | USER / MANAGER / ADMIN |
| usr_company_email | VARCHAR(200) UNIQUE NULLABLE | 회사 이메일 (@amoeba.site) |
| usr_postal_password | VARCHAR(200) NULLABLE | Postal 계정 비밀번호 (암호화) |
| usr_created_at | TIMESTAMP | 생성일 |
| usr_updated_at | TIMESTAMP | 수정일 |
| usr_deleted_at | TIMESTAMP | 삭제일 (Soft Delete) |

#### amb_password_resets
| 컬럼 | 타입 | 설명 |
|------|------|------|
| prs_id (PK) | UUID | 재설정 ID |
| usr_id (FK) | UUID | 사용자 |
| prs_token | VARCHAR(255) | 재설정 토큰 |
| prs_expires_at | TIMESTAMP | 만료 시각 |
| prs_used_at | TIMESTAMP NULLABLE | 사용 시각 |
| prs_created_at | TIMESTAMP | 생성일 |

---

### 5.2 채팅 모듈 (2개)

#### amb_conversations
| 컬럼 | 타입 | 설명 |
|------|------|------|
| cvs_id (PK) | UUID | 대화 ID |
| usr_id (FK) | UUID | 사용자 |
| cvs_department | VARCHAR(30) | 에이전트 부서 코드 |
| cvs_title | VARCHAR(200) | 대화 제목 |
| cvs_message_count | INTEGER | 메시지 수 |
| cvs_created_at | TIMESTAMP | 생성일 |
| cvs_updated_at | TIMESTAMP | 수정일 |
| cvs_deleted_at | TIMESTAMP | 삭제일 |

#### amb_messages (채팅)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| msg_id (PK) | UUID | 메시지 ID |
| cvs_id (FK) | UUID | 대화 ID |
| msg_role | VARCHAR(20) | user / assistant |
| msg_content | TEXT | 메시지 내용 |
| msg_token_count | INTEGER | 토큰 수 |
| msg_order | INTEGER | 순서 |
| msg_created_at | TIMESTAMP | 생성일 |

---

### 5.3 할일 (1개)

#### amb_todos
| 컬럼 | 타입 | 설명 |
|------|------|------|
| tdo_id (PK) | UUID | 할일 ID |
| usr_id (FK) | UUID | 사용자 |
| tdo_title | VARCHAR(200) | 제목 |
| tdo_description | TEXT | 설명 |
| tdo_status | VARCHAR(20) | SCHEDULED / IN_PROGRESS / COMPLETED |
| tdo_due_date | DATE | 마감일 |
| tdo_tags | TEXT | 태그 (JSON) |
| tdo_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

---

### 5.4 회의록 (1개)

#### amb_meeting_notes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| mtn_id (PK) | UUID | 회의록 ID |
| usr_id (FK) | UUID | 작성자 |
| mtn_title | VARCHAR(200) | 제목 |
| mtn_content | TEXT | 내용 (리치텍스트) |
| mtn_meeting_date | DATE | 회의 날짜 |
| mtn_visibility | VARCHAR(20) | PRIVATE / DEPARTMENT / PUBLIC |
| mtn_department | VARCHAR(30) | 대상 부서 |
| mtn_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

---

### 5.5 근무 일정 (1개)

#### amb_work_schedules
| 컬럼 | 타입 | 설명 |
|------|------|------|
| wks_id (PK) | UUID | 일정 ID |
| usr_id (FK) | UUID | 사용자 |
| wks_date | DATE | 날짜 |
| wks_type | VARCHAR(20) | WORK / REMOTE / DAY_OFF / AM_HALF / PM_HALF |
| wks_start_time | VARCHAR(5) | 출근 시간 |
| wks_end_time | VARCHAR(5) | 퇴근 시간 |
| wks_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

> Unique constraint: (usr_id, wks_date)

---

### 5.6 공지사항 (3개)

#### amb_notices
| 컬럼 | 타입 | 설명 |
|------|------|------|
| ntc_id (PK) | UUID | 공지 ID |
| usr_id (FK) | UUID | 작성자 |
| ntc_title | VARCHAR(200) | 제목 |
| ntc_content | TEXT | 내용 (리치텍스트) |
| ntc_visibility | VARCHAR(20) | PUBLIC / DEPARTMENT |
| ntc_department | VARCHAR(30) NULLABLE | 대상 부서 |
| ntc_is_pinned | BOOLEAN | 상단 고정 |
| ntc_view_count | INTEGER | 조회수 |
| ntc_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

#### amb_notice_attachments
| 컬럼 | 타입 | 설명 |
|------|------|------|
| nta_id (PK) | UUID | 첨부파일 ID |
| ntc_id (FK) | UUID | 공지 ID |
| nta_original_name | VARCHAR(255) | 원본 파일명 |
| nta_stored_name | VARCHAR(255) | 저장 파일명 (UUID) |
| nta_file_size | INTEGER | 파일 크기 |
| nta_mime_type | VARCHAR(100) | MIME 타입 |
| nta_created_at | TIMESTAMP | 생성일 |

#### amb_notice_reads
| 컬럼 | 타입 | 설명 |
|------|------|------|
| ntr_id (PK) | UUID | 읽음 기록 ID |
| ntc_id (FK) | UUID | 공지 ID |
| usr_id (FK) | UUID | 사용자 ID |
| ntr_read_at | TIMESTAMP | 읽은 시각 |

> Unique constraint: (ntc_id, usr_id)

---

### 5.7 멤버/그룹 (2개)

#### amb_groups
| 컬럼 | 타입 | 설명 |
|------|------|------|
| grp_id (PK) | UUID | 그룹 ID |
| grp_name | VARCHAR(100) UNIQUE | 그룹명 |
| grp_description | VARCHAR(500) | 설명 |
| grp_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

#### amb_user_groups
| 컬럼 | 타입 | 설명 |
|------|------|------|
| ugr_id (PK) | UUID | 연결 ID |
| usr_id (FK) | UUID | 사용자 |
| grp_id (FK) | UUID | 그룹 |
| ugr_created_at | TIMESTAMP | 생성일 |

---

### 5.8 초대 (1개)

#### amb_invitations
| 컬럼 | 타입 | 설명 |
|------|------|------|
| inv_id (PK) | UUID | 초대 ID |
| inv_email | VARCHAR(200) | 초대 이메일 |
| inv_token | VARCHAR(255) UNIQUE | 초대 토큰 |
| inv_role | VARCHAR(20) | 부여할 역할 |
| inv_department | VARCHAR(30) | 부여할 부서 |
| inv_group_id | UUID NULLABLE | 그룹 |
| inv_status | VARCHAR(20) | PENDING / ACCEPTED / CANCELLED / EXPIRED |
| inv_invited_by | UUID | 초대자 |
| inv_expires_at | TIMESTAMP | 만료일 |
| inv_accepted_at | TIMESTAMP | 수락일 |
| inv_created_at / updated_at | TIMESTAMP | 시간 정보 |

---

### 5.9 설정 (4개)

#### amb_api_keys
| 컬럼 | 타입 | 설명 |
|------|------|------|
| apk_id (PK) | UUID | API 키 ID |
| apk_provider | VARCHAR(30) | ANTHROPIC / OPENAI / GOOGLE |
| apk_name | VARCHAR(100) | 키 이름 |
| apk_key_encrypted | TEXT | 암호화된 키 |
| apk_key_iv | VARCHAR(64) | IV |
| apk_key_tag | VARCHAR(64) | Auth Tag |
| apk_key_last4 | VARCHAR(4) | 마지막 4자리 |
| apk_is_active | BOOLEAN | 활성 여부 |
| apk_created_by | UUID | 생성자 |
| apk_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

#### amb_smtp_settings
| 컬럼 | 타입 | 설명 |
|------|------|------|
| sms_id (PK) | UUID | 설정 ID |
| sms_host | VARCHAR(255) | SMTP 호스트 |
| sms_port | INTEGER | 포트 |
| sms_user | VARCHAR(255) | 사용자 |
| sms_pass_encrypted / iv / tag | TEXT/VARCHAR | 암호화된 비밀번호 |
| sms_from | VARCHAR(255) | 발신 주소 |
| sms_secure | BOOLEAN | TLS 사용 여부 |
| sms_updated_at | TIMESTAMP | 수정일 |
| sms_updated_by | UUID | 수정자 |

#### amb_menu_permissions
| 컬럼 | 타입 | 설명 |
|------|------|------|
| mpm_id (PK) | UUID | 권한 ID |
| mpm_menu_code | VARCHAR(50) | 메뉴 코드 |
| mpm_role | VARCHAR(20) | USER / MANAGER / ADMIN |
| mpm_accessible | BOOLEAN | 접근 가능 여부 |
| mpm_created_at / updated_at | TIMESTAMP | 시간 정보 |

> Unique constraint: (mpm_menu_code, mpm_role)

#### amb_drive_settings
| 컬럼 | 타입 | 설명 |
|------|------|------|
| drs_id (PK) | UUID | 설정 ID |
| drs_impersonate_email | VARCHAR(255) | Google 위임 이메일 |
| drs_billing_root_folder_id | VARCHAR(100) | Billing 루트 폴더 ID |
| drs_billing_root_folder_name | VARCHAR(255) | Billing 루트 폴더 이름 |
| drs_updated_at | TIMESTAMP | 수정일 |

---

### 5.10 문서함 (1개)

#### amb_drive_folders
| 컬럼 | 타입 | 설명 |
|------|------|------|
| drf_id (PK) | UUID | 등록 ID |
| drf_folder_id | VARCHAR(100) UNIQUE | Google Drive 폴더 ID |
| drf_folder_name | VARCHAR(200) | 표시 이름 |
| drf_drive_type | VARCHAR(20) | shared / personal |
| drf_description | VARCHAR(500) NULLABLE | 설명 |
| drf_created_by | UUID | 등록자 |
| drf_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

---

### 5.11 회계 (2개)

#### amb_bank_accounts
| 컬럼 | 타입 | 설명 |
|------|------|------|
| bac_id (PK) | UUID | 계좌 ID |
| usr_id (FK) | UUID | 등록자 |
| bac_bank_name | VARCHAR(100) | 은행명 |
| bac_branch_name | VARCHAR(100) | 지점명 |
| bac_account_number | VARCHAR(50) UNIQUE | 계좌번호 |
| bac_account_alias | VARCHAR(100) | 계좌 별칭 |
| bac_currency | VARCHAR(10) DEFAULT 'VND' | 통화 |
| bac_opening_balance | DECIMAL | 개설 잔액 |
| bac_opening_date | DATE | 개설일 |
| bac_is_active | BOOLEAN | 활성 여부 |
| bac_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

#### amb_transactions
| 컬럼 | 타입 | 설명 |
|------|------|------|
| txn_id (PK) | UUID | 거래 ID |
| bac_id (FK) | UUID | 계좌 ID |
| usr_id (FK) | UUID | 사용자 |
| txn_date | DATE | 거래일 |
| txn_seq_no | INTEGER | 순번 |
| txn_project_name | VARCHAR(200) | 프로젝트명 |
| txn_net_value | DECIMAL | 순액 |
| txn_vat | DECIMAL | 부가세 |
| txn_bank_charge | DECIMAL | 수수료 |
| txn_total_value | DECIMAL | 총액 |
| txn_balance | DECIMAL | 잔액 |
| txn_cumulative_balance | DECIMAL | 누적 잔액 |
| txn_vendor | VARCHAR(200) | 거래처 |
| txn_description | TEXT | 적요 |
| txn_created_at / updated_at / deleted_at | TIMESTAMP | 시간 정보 |

> Index: (bac_id, txn_date)

---

### 5.12 HR 모듈 (19개)

#### amb_hr_entities (법인)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| ent_id (PK) | UUID | 법인 ID |
| ent_code | VARCHAR UNIQUE | 법인 코드 |
| ent_name / ent_name_en | VARCHAR | 법인명 (한글/영문) |
| ent_country | VARCHAR | 국가 (KR, VN) |
| ent_currency | VARCHAR | 기본 통화 |
| ent_reg_no | VARCHAR | 사업자등록번호 |
| ent_address | TEXT | 주소 |
| ent_representative | VARCHAR | 대표자 |
| ent_phone / ent_email | VARCHAR | 연락처 |
| ent_pay_day | INTEGER | 급여 지급일 |
| ent_status | VARCHAR | 상태 |

#### amb_hr_entity_user_roles (법인-사용자 역할)
> Unique: (ent_id, usr_id)
- eur_role: HR_ADMIN / HR_MANAGER / HR_VIEWER
- eur_status: ACTIVE / INACTIVE

#### amb_hr_employees (직원)
| 주요 컬럼 | 설명 |
|----------|------|
| emp_id (PK) | 직원 ID |
| ent_id (FK) | 법인 |
| emp_code (UNIQUE) | 사번 |
| emp_full_name | 성명 |
| emp_nationality | 국적 |
| emp_cccd_number (UNIQUE) | 주민/외국인등록번호 |
| emp_tax_code | 세금 코드 |
| emp_si_number | 사회보험 번호 |
| emp_start_date / emp_end_date | 입사/퇴사일 |
| emp_status | ACTIVE / INACTIVE / ON_LEAVE |
| emp_contract_type | INDEFINITE / DEFINITE / PROBATION |
| emp_department / emp_position | 부서 / 직위 |
| emp_region | HCMC / HANOI / OTHER |
| emp_salary_type | GROSS_TO_NET / NET_TO_GROSS |

#### amb_hr_dependents (부양가족)
- dep_id, emp_id, dep_name, dep_relationship, dep_date_of_birth, dep_cccd_number, dep_tax_code, dep_effective_from/to

#### amb_hr_salary_history (급여 이력)
- slh_id, emp_id, slh_base_salary_vnd/krw/usd, slh_exchange_rate_krw/usd, slh_meal_allowance, slh_cskh/fuel/parking/other_allowance, slh_effective_date

#### amb_hr_system_params (시스템 파라미터)
- hsp_id, ent_id, hsp_param_key, hsp_param_value, hsp_effective_from/to, hsp_description

#### amb_hr_holidays (공휴일)
- hol_id, ent_id, hol_date (UNIQUE), hol_name, hol_name_vi, hol_year

#### amb_hr_payroll_periods (급여 기간)
| 주요 컬럼 | 설명 |
|----------|------|
| pyp_id (PK) | 기간 ID |
| ent_id (FK) | 법인 |
| pyp_year / pyp_month | 연도 / 월 |
| pyp_status | DRAFT / CALCULATING / L1_REVIEW / L2_REVIEW / APPROVED / REJECTED |
| pyp_payment_date | 지급일 |
| pyp_approved_by_l1 / l2 | 1차/2차 승인자 |
| pyp_finalized_at | 확정일 |

> Unique: (ent_id, pyp_year, pyp_month)

#### amb_hr_payroll_details (VN 급여 상세)
- pyd_id, pyp_id, emp_id
- 기본급, 수당 (식대/교통/주차/기타), 사회보험 기반, 회사/직원 보험, 세금, OT, 연차, 상여, 조정, 근무일수, 순급여 (VND/USD)

> Unique: (pyp_id, emp_id)

#### amb_hr_timesheets (근태)
- tms_id, emp_id, pyp_id, tms_work_date, tms_attendance_code, tms_work_hours

> Unique: (emp_id, tms_work_date)

#### amb_hr_ot_records (초과근무)
- otr_id, emp_id, otr_date, otr_time_start/end, otr_type, otr_actual_hours, otr_converted_hours, otr_approval_status, otr_approved_by

#### amb_hr_leave_balances (연차 잔액)
- lvb_id, emp_id, lvb_year, lvb_entitlement, lvb_used, lvb_ot_converted, lvb_carry_forward, lvb_remaining

> Unique: (emp_id, lvb_year)

#### amb_hr_employees_kr (한국 직원 확장)
- ekr_id, emp_id (1:1), ekr_resident_no, ekr_employee_type, ekr_pension_no, ekr_health_ins_no, ekr_employ_ins_no
- 비과세/면세 플래그, 부양가족 수, 원천징수율, 은행 계좌

#### amb_hr_freelancers (프리랜서)
- frl_id, ent_id, frl_code, frl_full_name, frl_resident_no, frl_contract_amount, frl_monthly_amount, frl_payment_type, frl_tax_rate, frl_status

> Unique: (ent_id, frl_code)

#### amb_hr_insurance_params_kr (한국 보험료율)
- ikr_id, ent_id, ikr_effective_from/to
- 국민연금, 건강보험, 장기요양, 고용보험 (회사/직원 요율, 상한/하한)

#### amb_hr_payroll_entries_kr (한국 급여)
- pkr_id, pyp_id, emp_id
- 기본급, 수당, 비과세 항목, 4대보험 공제, 소득세/지방세, 연말정산, 선지급, 순급여

> Unique: (pyp_id, emp_id)

#### amb_hr_tax_simple_table (간이세액표)
- tst_id, ent_id, tst_effective_year, tst_salary_from/to, tst_dependents, tst_tax_amount

> Index: (ent_id, tstEffectiveYear, tstSalaryFrom, tstSalaryTo, tstDependents)

#### amb_hr_business_income_payments (사업소득 지급)
- bip_id, ent_id, frl_id, bip_year_month, bip_payment_date
- bip_gross_amount, bip_weekly_holiday, bip_incentive, bip_total_amount
- bip_income_tax, bip_local_tax, bip_employ_ins, bip_accident_ins, bip_student_loan
- bip_net_amount, bip_status

#### amb_hr_yearend_adjustments (연말정산)
- yea_id, ent_id, emp_id, yea_tax_year, yea_settle_tax, yea_settle_local, yea_applied_month, yea_status, yea_note

> Unique: (ent_id, emp_id, yea_tax_year)

---

### 5.13 Billing 모듈 (9개)

#### amb_bil_partners (거래처)
| 주요 컬럼 | 설명 |
|----------|------|
| ptn_id (PK) | 거래처 ID |
| ent_id (FK) | 법인 |
| ptn_code (UNIQUE w/ ent_id) | 거래처 코드 |
| ptn_type | CLIENT / AFFILIATE / PARTNER / OUTSOURCING |
| ptn_company_name / _local | 회사명 (영문/현지어) |
| ptn_country | 국가 |
| ptn_contact_name / email / phone | 담당자 |
| ptn_tax_id | 사업자번호 |
| ptn_default_currency | 기본 통화 |
| ptn_payment_terms | 결제 조건 (일수) |
| ptn_gdrive_folder_id | Google Drive 폴더 |
| ptn_status | ACTIVE / INACTIVE |

#### amb_bil_contracts (계약)
| 주요 컬럼 | 설명 |
|----------|------|
| ctr_id (PK) | 계약 ID |
| ent_id / ptn_id (FK) | 법인 / 거래처 |
| ctr_direction | INBOUND / OUTBOUND |
| ctr_category | SERVICE / GOODS / LICENSE / CONSULTING |
| ctr_type | FIXED / USAGE_BASED / MILESTONE / AD_HOC |
| ctr_title | 계약명 |
| ctr_start_date / end_date | 시작/종료일 |
| ctr_amount / currency | 금액 / 통화 |
| ctr_status | DRAFT / ACTIVE / SUSPENDED / COMPLETED / TERMINATED / EXPIRED |
| ctr_auto_renew | 자동 갱신 |
| ctr_billing_day / period | 청구일 / 주기 |
| ctr_auto_generate | 인보이스 자동 생성 |
| ctr_predecessor_id | 이전 계약 (갱신 시) |
| ctr_gdrive_folder_id | Google Drive 폴더 |

#### amb_bil_contract_milestones (마일스톤)
- mst_id, ctr_id, mst_seq, mst_label, mst_percentage, mst_amount, mst_due_date, mst_status

#### amb_bil_sow (Scope of Work)
- sow_id, ctr_id, ent_id, sow_title, sow_description, sow_period_start/end, sow_amount, sow_currency, sow_status

#### amb_bil_documents (문서)
- doc_id, ent_id, doc_ref_type (CONTRACT/SOW/INVOICE), doc_ref_id
- doc_type: SIGNED_CONTRACT / APPENDIX / SOW / ACCEPTANCE_MINUTES / INVOICE / PAYMENT_REQUEST / OTHER
- doc_gdrive_file_id, doc_gdrive_url, doc_filename, doc_mime_type, doc_file_size

#### amb_bil_invoices (인보이스)
| 주요 컬럼 | 설명 |
|----------|------|
| inv_id (PK) | 인보이스 ID |
| ent_id / ptn_id / ctr_id / sow_id | 참조 |
| inv_number | 인보이스 번호 |
| inv_direction | RECEIVABLE / PAYABLE |
| inv_date / due_date | 발행일 / 납기일 |
| inv_subtotal / tax_rate / tax_amount / total | 금액 |
| inv_currency | 통화 |
| inv_status | DRAFT / ISSUED / SENT / PAID / OVERDUE / CANCELLED / VOID |
| inv_paid_amount / paid_date | 결제 금액/일시 |
| inv_tax_invoice_type | HOMETAX / SYSTEM |

#### amb_bil_invoice_items (인보이스 항목)
- itm_id, inv_id, itm_seq, itm_description, itm_quantity, itm_unit_price, itm_amount

#### amb_bil_payments (결제)
- pay_id, ent_id, inv_id, pay_amount, pay_currency, pay_date
- pay_method: BANK_TRANSFER / CASH / CHECK / CARD / OTHER
- pay_reference, pay_note

#### amb_bil_contract_history (계약 이력)
- hst_id, ctr_id, ent_id, hst_field, hst_old_value, hst_new_value, hst_changed_by, hst_changed_at

---

### 5.14 웹메일 모듈 (4개)

#### amb_mail_accounts (메일 계정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| mac_id (PK) | UUID | 계정 ID |
| mac_user_id (FK) | UUID | 사용자 |
| mac_email | VARCHAR UNIQUE | 이메일 주소 |
| mac_display_name | VARCHAR | 표시 이름 |
| mac_imap_host / port | VARCHAR / INT | IMAP 서버 |
| mac_smtp_host / port | VARCHAR / INT | SMTP 서버 |
| mac_encrypted_password / iv / tag | TEXT | 암호화된 비밀번호 |
| mac_is_active | BOOLEAN | 활성 여부 |
| mac_last_sync_at | TIMESTAMP | 마지막 동기화 |

#### amb_mail_messages (메일 메시지)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| msg_id (PK) | UUID | 메시지 ID |
| msg_account_id (FK) | UUID | 계정 ID |
| msg_external_id | VARCHAR | Postal UID |
| msg_message_id | VARCHAR | Message-ID 헤더 |
| msg_folder | VARCHAR | INBOX / SENT / DRAFTS / TRASH |
| msg_from / to / cc / bcc | TEXT | 주소 (JSON) |
| msg_subject | VARCHAR | 제목 |
| msg_body_text / body_html | TEXT | 본문 |
| msg_is_read / is_starred | BOOLEAN | 읽음/별표 |
| msg_has_attachments | BOOLEAN | 첨부파일 여부 |
| msg_in_reply_to | VARCHAR | 답장 대상 |
| msg_date | TIMESTAMP | 발송일 |
| msg_deleted_at | TIMESTAMP | 삭제일 |

> Index: (msg_account_id, msg_folder), Unique: (msg_account_id, msg_external_id)

#### amb_mail_attachments (메일 첨부파일)
- mat_id, mat_message_id, mat_account_id, mat_filename, mat_content_type, mat_size, mat_storage_path, mat_content_id

#### amb_mail_queue (메일 발송 큐)
- maq_id, maq_account_id, maq_to/cc/bcc, maq_subject, maq_body_text/html
- maq_status: PENDING / SENDING / SENT / FAILED
- maq_retry_count, maq_error, maq_scheduled_at, maq_sent_at

---

### 5.15 부서 모듈 (2개)

#### amb_departments (부서)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| dep_id (PK) | UUID | 부서 ID |
| ent_id (FK) | UUID | 법인 |
| dep_name | VARCHAR(100) | 부서명 (영문) |
| dep_name_local | VARCHAR(100) NULLABLE | 현지 부서명 |
| dep_parent_id | UUID NULLABLE | 상위 부서 (자기참조) |
| dep_level | INTEGER DEFAULT 1 | 1=Department, 2=Team |
| dep_is_active | BOOLEAN DEFAULT true | 활성 여부 |
| dep_sort_order | INTEGER DEFAULT 0 | 정렬 순서 |
| dep_created_at | TIMESTAMP | 생성일 |
| dep_updated_at | TIMESTAMP | 수정일 |

#### amb_user_dept_roles (사용자-부서 역할)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| udr_id (PK) | UUID | 역할 ID |
| usr_id (FK) | UUID | 사용자 |
| dep_id (FK) | UUID | 부서 |
| udr_role | VARCHAR(20) DEFAULT 'MEMBER' | MEMBER / TEAM_LEAD / DEPARTMENT_HEAD |
| udr_is_primary | BOOLEAN DEFAULT false | 주 소속 여부 |
| udr_started_at | DATE | 시작일 |
| udr_ended_at | DATE NULLABLE | 종료일 |
| udr_created_at | TIMESTAMP | 생성일 |

---

### 5.16 ACL 모듈 (4개)

#### amb_work_items (작업물)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| wit_id (PK) | UUID | 작업물 ID |
| ent_id (FK) | UUID | 법인 |
| wit_type | VARCHAR(20) | DOC / REPORT / TODO / NOTE / EMAIL / ANALYSIS |
| wit_title | VARCHAR(500) | 제목 |
| wit_owner_id (FK) | UUID | 소유자 |
| wit_visibility | VARCHAR(20) DEFAULT 'PRIVATE' | PRIVATE / SHARED / DEPARTMENT / ENTITY / PUBLIC |
| wit_module | VARCHAR(50) NULLABLE | 원본 모듈 (todo, meeting-notes, billing, webmail 등) |
| wit_ref_id | UUID NULLABLE | 모듈별 엔티티 참조 ID |
| wit_content | TEXT NULLABLE | 콘텐츠 본문 |
| wit_created_at | TIMESTAMP | 생성일 |
| wit_updated_at | TIMESTAMP | 수정일 |
| wit_deleted_at | TIMESTAMP | 삭제일 (Soft Delete) |

#### amb_work_item_shares (작업물 공유)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| wis_id (PK) | UUID | 공유 ID |
| wit_id (FK) | UUID | 작업물 |
| wis_target_type | VARCHAR(20) | USER / DEPARTMENT / TEAM / ENTITY |
| wis_target_id | UUID | 대상 ID |
| wis_permission | VARCHAR(20) DEFAULT 'VIEW' | VIEW / COMMENT / EDIT / ADMIN |
| wis_shared_by (FK) | UUID | 공유 실행자 |
| wis_expires_at | TIMESTAMP NULLABLE | 만료일 |
| wis_is_active | BOOLEAN DEFAULT true | 활성 여부 |
| wis_created_at | TIMESTAMP | 생성일 |

#### amb_work_item_comments (작업물 코멘트)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| wic_id (PK) | UUID | 코멘트 ID |
| wit_id (FK) | UUID | 작업물 |
| wic_parent_id | UUID NULLABLE | 답글 대상 (자기참조) |
| wic_author_id (FK) | UUID | 작성자 |
| wic_content | TEXT | 내용 |
| wic_type | VARCHAR(20) DEFAULT 'COMMENT' | COMMENT / FEEDBACK / APPROVAL / REQUEST / MENTION |
| wic_is_private | BOOLEAN DEFAULT false | 비공개 여부 |
| wic_is_edited | BOOLEAN DEFAULT false | 수정 여부 |
| wic_is_deleted | BOOLEAN DEFAULT false | 삭제 여부 |
| wic_created_at | TIMESTAMP | 생성일 |
| wic_updated_at | TIMESTAMP | 수정일 |

#### amb_access_audit_log (접근 감사 로그)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| aal_id (PK) | UUID | 로그 ID |
| aal_user_id (FK) | UUID | 사용자 |
| aal_action | VARCHAR(20) | VIEW / CREATE / EDIT / DELETE / SHARE / ACCESS_DENIED |
| aal_target_type | VARCHAR(50) | WORK_ITEM / DEPARTMENT / TAG 등 |
| aal_target_id | UUID | 대상 ID |
| aal_access_path | VARCHAR(200) NULLABLE | 접근 경로 (권한 획득 경로) |
| aal_details | JSONB NULLABLE | 상세 정보 |
| aal_created_at | TIMESTAMP | 생성일 |

---

### 5.17 KMS 모듈 (4개)

#### amb_kms_tags (태그)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| tag_id (PK) | UUID | 태그 ID |
| ent_id (FK) | UUID | 법인 |
| tag_name | VARCHAR(200) | 정규화 이름 (lowercase, trimmed) |
| tag_display | VARCHAR(200) | 표시 이름 (원본 케이싱) |
| tag_name_local | VARCHAR(200) NULLABLE | 현지어 이름 |
| tag_level | INTEGER DEFAULT 2 | 1=DOMAIN, 2=TOPIC, 3=CONTEXT |
| tag_parent_id | UUID NULLABLE | 상위 태그 (자기참조) |
| tag_color | VARCHAR(20) NULLABLE | 표시 색상 (#hex) |
| tag_is_system | BOOLEAN DEFAULT false | 시스템 태그 여부 |
| tag_usage_count | INTEGER DEFAULT 0 | 사용 횟수 |
| tag_embedding | TEXT NULLABLE | 임베딩 벡터 (pgvector vector(1536)) |
| tag_created_at | TIMESTAMP | 생성일 |
| tag_updated_at | TIMESTAMP | 수정일 |

#### amb_kms_tag_synonyms (태그 동의어)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| tsy_id (PK) | UUID | 동의어 ID |
| tag_id (FK) | UUID | 태그 |
| tsy_synonym | VARCHAR(200) | 동의어 텍스트 |
| tsy_language | VARCHAR(10) NULLABLE | 언어 코드 (en/ko/vi) |
| tsy_created_at | TIMESTAMP | 생성일 |

#### amb_kms_tag_relations (태그 관계)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| trl_id (PK) | UUID | 관계 ID |
| tag_source_id (FK) | UUID | 소스 태그 |
| tag_target_id (FK) | UUID | 타겟 태그 |
| trl_type | VARCHAR(20) | PARENT_CHILD / RELATED / SYNONYM / BROADER / NARROWER |
| trl_weight | DECIMAL(5,4) DEFAULT 1.0 | 관계 강도 |
| trl_co_occur | INTEGER DEFAULT 0 | 동시 출현 횟수 |
| trl_created_at | TIMESTAMP | 생성일 |

#### amb_kms_work_item_tags (작업물-태그 매핑)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| wit_tag_id (PK) | UUID | 매핑 ID |
| wit_id (FK) | UUID | 작업물 |
| tag_id (FK) | UUID | 태그 |
| wtt_source | VARCHAR(20) DEFAULT 'USER_MANUAL' | AI_EXTRACTED / USER_MANUAL / USER_CONFIRMED / USER_REJECTED / SYSTEM |
| wtt_confidence | DECIMAL(5,4) NULLABLE | AI 신뢰도 |
| wtt_weight | DECIMAL(5,4) DEFAULT 1.0 | 가중치 |
| wtt_assigned_by | UUID NULLABLE | 할당자 |
| wtt_created_at | TIMESTAMP | 생성일 |

---

### 5.18 프로젝트 모듈 (7개)

#### kms_projects (프로젝트)
| 주요 컬럼 | 설명 |
|----------|------|
| pjt_id (PK) | 프로젝트 ID |
| pjt_code | 프로젝트 코드 |
| pjt_name | 프로젝트명 |
| pjt_status | DRAFT / APPROVED / REJECTED |
| pjt_priority | 우선순위 |
| pjt_budget | 예산 (decimal) |
| pjt_start_date / pjt_end_date | 시작/종료일 |
| pjt_parent_id | 상위 프로젝트 (자기참조) |

#### kms_project_members (프로젝트 멤버)
- pmb_id, pjt_id, usr_id, pmb_role, pmb_is_active, pmb_joined_at
> Unique: (pjt_id, usr_id)

#### kms_project_files (프로젝트 파일)
- pfl_id, pjt_id, pfl_filename, pfl_gdrive_file_id

#### kms_project_clients (프로젝트 고객)
- pcl_id, pjt_id, cli_id, pcl_status
> Unique: (pjt_id, cli_id)

#### kms_project_reviews (프로젝트 검토)
- prv_id, pjt_id, prv_reviewer_id, prv_step, prv_action, prv_previous_status, prv_new_status

#### amb_project_epics (EPIC)
- epc_id, ent_id, pjt_id, epc_title, epc_status (PLANNED/IN_PROGRESS/DONE/CANCELLED)
> Index: (ent_id, pjt_id)

#### amb_project_components (컴포넌트)
- cmp_id, ent_id, pjt_id, cmp_title, cmp_owner_id
> Index: (ent_id, pjt_id)

---

### 5.19 이슈 모듈 (5개)

#### amb_issues (이슈)
| 주요 컬럼 | 설명 |
|----------|------|
| iss_id (PK) | 이슈 ID |
| iss_type | 이슈 유형 |
| iss_title | 제목 |
| iss_description | 설명 (text) |
| iss_severity | 심각도 |
| iss_status | 상태 (기본: OPEN) |
| iss_priority | 우선순위 (1-5) |
| iss_reporter_id / iss_assignee_id | 보고자 / 담당자 |
| iss_pjt_id / iss_epc_id / iss_cmp_id | 프로젝트/EPIC/컴포넌트 참조 |
| iss_parent_id | 상위 이슈 (자기참조) |
| iss_visibility | PRIVATE / CELL / ENTITY |
| iss_ref_number | 참조번호 |
| iss_redmine_id / iss_github_id | 외부 연동 ID |
| iss_ai_analysis | AI 분석 결과 |
| iss_affected_modules | 영향 모듈 (text[]) |

#### amb_issue_sequences (이슈 순번)
- isq_id, ent_id (UNIQUE), isq_last_number

#### amb_issue_status_logs (상태 로그)
- isl_id, iss_id, isl_change_type, isl_from_status, isl_to_status, isl_changed_by

#### amb_issue_participants (참여자)
- isp_id, iss_id, usr_id, isp_role (PARTICIPANT/FORMER_ASSIGNEE)
> Unique: (iss_id, usr_id)

#### amb_issue_comments (코멘트)
- isc_id, iss_id, isc_author_id, isc_content (text), isc_author_type

---

### 5.20 캘린더 모듈 (5개)

#### amb_calendars (일정)
| 주요 컬럼 | 설명 |
|----------|------|
| cal_id (PK) | 일정 ID |
| ent_id / usr_id | 법인 / 사용자 |
| cal_title | 제목 |
| cal_start_at / cal_end_at | 시작/종료 (timestamptz) |
| cal_is_all_day | 종일 여부 |
| cal_category | WORK (기본) |
| cal_visibility | PRIVATE (기본) |
| cal_google_event_id | Google 캘린더 연동 ID |
| cal_sync_status | NOT_SYNCED / SYNCED |
| project_id | 프로젝트 참조 (nullable) |

> Index: (usr_id, cal_deleted_at), (ent_id, cal_visibility, cal_deleted_at), (cal_start_at, cal_end_at)

#### amb_calendar_recurrences (재발 설정)
- clr_id, cal_id (UNIQUE), clr_freq, clr_interval, clr_end_type, clr_end_date

#### amb_calendar_exceptions (예외)
- cle_id, cal_id, cle_original_date, cle_exception_type (MODIFIED/CANCELLED)

#### amb_calendar_participants (참여자)
- clp_id, cal_id, usr_id, clp_response_status (NONE/ACCEPTED/DECLINED/TENTATIVE), clp_invited_by
> Unique: (cal_id, usr_id)

#### amb_calendar_notifications (알림)
- cln_id, cal_id, cln_reminder_type, cln_custom_minutes, cln_channels (jsonb)

---

### 5.21 자산 모듈 (6개)

#### amb_assets (자산)
| 주요 컬럼 | 설명 |
|----------|------|
| ast_id (PK) | 자산 ID |
| ent_id | 법인 |
| ast_code (UNIQUE) | 자산코드 |
| ast_name | 자산명 |
| ast_category | 분류 |
| ast_ownership_type | 소유 유형 |
| ast_status | 상태 (기본: STORED) |
| ast_manufacturer / ast_model_name / ast_serial_no | 제조사/모델/시리얼 |
| ast_purchase_date / ast_vendor | 구매일/공급처 |
| ast_purchase_amount / ast_currency | 구매액/통화 |
| ast_depreciation_years / ast_residual_value | 감가상각/잔존가치 |
| ast_room_capacity / ast_room_equipments (jsonb) | 회의실 전용: 인원/장비 |

> Index: (ent_id, ast_category), (ent_id, ast_status)

#### amb_asset_requests (자산 요청)
| 주요 컬럼 | 설명 |
|----------|------|
| asr_id (PK) | 요청 ID |
| ent_id | 법인 |
| asr_request_no (UNIQUE) | 요청번호 |
| asr_requester_id | 요청자 |
| asr_request_type | 요청 유형 |
| asr_status | DRAFT 기본 |
| ast_id | 자산 참조 (nullable) |
| asr_asset_select_mode | SPECIFIC / CATEGORY |
| asr_start_at / asr_end_at | 사용 시작/종료 |
| asr_final_approver_id | 최종 승인자 |

#### amb_asset_change_logs (변경 로그)
- acl_id, ast_id, acl_changed_by, acl_field, acl_before_value, acl_after_value

#### amb_asset_approval_histories (승인 이력)
- aah_id, asr_id, aah_step, aah_status, aah_approver_id

#### amb_asset_request_logs (요청 상태 로그)
- arl_id, asr_id, arl_changed_by, arl_from_status, arl_to_status

#### amb_meeting_reservations (회의실 예약)
- mtr_id, asr_id, mtr_title, mtr_attendee_count, mtr_start_at, mtr_end_at

---

### 5.22 Amoeba Talk 모듈 (6개)

#### amb_talk_channels (채널)
- chn_id, chn_name, chn_type, ent_id (nullable), chn_created_by

#### amb_talk_messages (메시지)
| 주요 컬럼 | 설명 |
|----------|------|
| msg_id (PK) | 메시지 ID |
| chn_id (FK) | 채널 |
| usr_id (FK) | 발신자 |
| msg_content | 내용 (text) |
| msg_type | TEXT 기본 |
| msg_parent_id | 스레드 부모 (nullable) |
| msg_is_pinned | 고정 여부 |
| msg_pinned_at / msg_pinned_by | 고정 시각/실행자 |

#### amb_talk_channel_members (채널 멤버)
- chm_id, chn_id, usr_id, chm_role (MEMBER 기본), chm_joined_at, chm_left_at, chm_pinned, chm_muted

#### amb_talk_attachments (첨부파일)
- tat_id, msg_id, tat_original_name, tat_stored_name, tat_file_size, tat_mime_type

#### amb_talk_read_status (읽음 상태)
- trs_id, chn_id, usr_id, trs_last_read_at, trs_last_msg_id
> Unique: (chn_id, usr_id)

#### amb_talk_reactions (리액션)
- rea_id, msg_id, usr_id, rea_type
> Unique: (msg_id, usr_id, rea_type)

---

### 5.23 알림 모듈 (2개)

#### amb_notifications (알림)
- ntf_id, ntf_type, ntf_title, ntf_message, ntf_recipient_id, ntf_sender_id
- ntf_resource_type, ntf_resource_id (대상 리소스 참조)
- ntf_is_read, ntf_read_at, ent_id

#### amb_push_subscriptions (푸시 구독)
- psb_id, usr_id, psb_endpoint, psb_p256dh, psb_auth, ent_id (nullable), psb_user_agent

---

### 5.24 고객포털 모듈 (1개)

#### amb_client_invitations (고객 초대)
- civ_id, civ_email, civ_name, cli_id, civ_role, civ_token (UNIQUE), civ_token_expires
- civ_status (PENDING/ACCEPTED), civ_invited_by, civ_accepted_at

---

### 5.25 오늘 모듈 (4개)

#### amb_today_reports (오늘 리포트)
- tdr_id, ent_id, usr_id, tdr_title, tdr_content (text), tdr_scope (all/team)

#### amb_daily_missions (일일 미션)
- msn_id, ent_id, usr_id, msn_date, msn_content (text)
- msn_check_result (HALF/PARTIAL/ALL_DONE/EXCEED), msn_check_score (smallint)
- msn_registered_lines (jsonb), msn_carry_over_text

#### amb_today_snapshots (스냅샷)
- snp_id, ent_id, usr_id, msn_id, snp_date, snp_title, snp_data (jsonb)

#### amb_today_snapshot_memos (스냅샷 메모)
- smo_id, snp_id, usr_id, smo_content (text), smo_order

---

### 5.26 분석 모듈 (1개)

#### amb_site_event_logs (사이트 이벤트)
- sel_id, sel_site (portal/app), sel_event_type (page_view/login/register_visit/subscription)
- sel_entity_id, sel_user_id, sel_page_path, sel_referrer, sel_ip_address, sel_user_agent
- sel_metadata (jsonb)
> Index: (sel_site, sel_event_type, sel_created_at)

---

### 5.27 번역 모듈 (4개)

#### amb_translation_usage (번역 사용량)
- tus_id, ent_id, usr_id, tus_source_type, tus_source_lang, tus_target_lang
- tus_input_tokens, tus_output_tokens, tus_cost_usd (decimal)

#### amb_content_translations (콘텐츠 번역)
| 주요 컬럼 | 설명 |
|----------|------|
| trn_id (PK) | 번역 ID |
| ent_id | 법인 |
| trn_source_type / trn_source_id / trn_source_field | 원본 참조 |
| trn_source_lang / trn_target_lang | 소스/타겟 언어 |
| trn_method | AI 기본 |
| trn_confidence | 신뢰도 (0-1) |
| trn_is_stale / trn_is_locked | 만료/잠금 여부 |
| trn_version | 버전 |
| trn_source_hash | 원본 해시 |

> Unique: (trn_source_type, trn_source_id, trn_source_field, trn_target_lang)

#### amb_content_translation_history (번역 이력)
- thi_id, trn_id, thi_content (text), thi_method, thi_version, thi_edited_by

#### amb_translation_glossary (용어집)
- gls_id, ent_id, gls_term_en, gls_term_ko, gls_term_vi, gls_category
- gls_context (text), gls_is_deleted, gls_created_by

---

### 5.28 지출결의 모듈 (7개)

#### amb_expense_requests (지출 결의)
| 주요 컬럼 | 설명 |
|----------|------|
| exr_id (PK) | 결의 ID |
| ent_id | 법인 |
| exr_requester_id | 요청자 |
| exr_number (UNIQUE) | 결의번호 |
| exr_title | 제목 |
| exr_type | PRE_APPROVAL / POST_APPROVAL |
| exr_status | DRAFT / PENDING / APPROVED_L1 / APPROVED / EXECUTED / REJECTED / CANCELLED |
| exr_category | TRANSPORTATION / ENTERTAINMENT / OFFICE_SUPPLIES / MEALS 등 |
| exr_frequency | ONE_TIME / RECURRING |
| exr_approver1_id / exr_approver2_id | 1차/2차 승인자 |
| exr_period / exr_start_date / exr_end_date | 정기: 주기/시작/종료 |
| exr_payment_day / exr_next_due_date | 지급일/다음 지급 예정일 |
| exr_parent_id / exr_is_auto_generated | 원본/자동생성 여부 |

> Index: (ent_id, exr_status), (exr_requester_id), (exr_next_due_date)

#### amb_expense_request_items (항목)
- eri_id, exr_id, eri_name, eri_quantity, eri_unit_price, eri_tax_amount

#### amb_expense_approvals (승인)
- eap_id, exr_id, eap_approver_id, eap_level (int), eap_action (APPROVED/REJECTED)

#### amb_expense_attachments (첨부)
- eat_id, exr_id, eat_type (FILE/LINK), eat_uploader_id
- FILE: eat_file_name, eat_file_size, eat_mime_type, eat_storage_key
- LINK: eat_link_url, eat_link_title

#### amb_expense_executions (집행)
- exd_id, exr_id, exd_executed_at, exd_method (CARD/CASH/TRANSFER/OTHER), exd_amount
- exd_receipt_type, exd_receipt_number, exd_executor_id
- 영수증: exd_receipt_file_name, exd_receipt_link_url

#### amb_expense_forecast_reports (예측 리포트)
- efr_id, ent_id, efr_year, efr_month, efr_status (DRAFT/SUBMITTED/APPROVED)
- efr_total_vnd, efr_total_usd, efr_total_krw (다중통화)
> Unique: (ent_id, efr_year, efr_month)

#### amb_expense_forecast_items (예측 항목)
- efi_id, efr_id, efi_type (RECURRING/MANUAL), efi_title, efi_amount

---

### 5.29 보고서 모듈 (1개)

#### amb_work_reports (업무 보고서)
- wkr_id, ent_id, usr_id, wkr_type, wkr_period_start, wkr_period_end
- wkr_raw_data (jsonb), wkr_ai_summary (text), wkr_ai_score (jsonb)

---

### 5.30 CMS 모듈 (10개)

#### amb_cms_menus (CMS 메뉴)
- cmn_id, ent_id, cmn_parent_id (자기참조), cmn_name_en, cmn_name_ko, cmn_slug
- cmn_type (INTERNAL 기본), cmn_external_url, cmn_sort_order, cmn_is_visible
> Unique: (cmn_slug, ent_id)

#### amb_cms_pages (CMS 페이지)
- cmp_id, ent_id, cmn_id, cmp_type, cmp_title, cmp_slug, cmp_description
- cmp_status (DRAFT 기본), cmp_published_at, cmp_current_version, cmp_config (jsonb)

#### amb_cms_page_contents (페이지 콘텐츠)
- cpc_id, cmp_id, cpc_lang (en 기본), cpc_content (text), cpc_sections_json (jsonb)
> Unique: (cmp_id, cpc_lang)

#### amb_cms_page_versions (페이지 버전)
- cpv_id, cmp_id, cpv_version (int), cpv_snapshot (jsonb), cpv_published_by, cpv_note

#### amb_cms_posts (블로그 포스트)
- cpt_id, cmp_id, cpg_id, cpt_title, cpt_content (text), cpt_author_id
- cpt_is_pinned, cpt_view_count, cpt_featured_image, cpt_tags, cpt_status

#### amb_cms_post_attachments (포스트 첨부)
- cpa_id, cpt_id, cpa_file_name, cpa_file_url, cpa_file_size, cpa_mime_type

#### amb_cms_post_categories (포스트 카테고리)
- cpg_id, cmp_id, cpg_name, cpg_sort_order

#### amb_cms_sections (섹션)
- cms_id, cmp_id, cms_type, cms_sort_order, cms_config (jsonb)
- cms_content_en (jsonb), cms_content_ko (jsonb, nullable), cms_is_visible

#### amb_cms_site_config (사이트 설정)
- csc_id, ent_id, csc_key, csc_value (jsonb), csc_version, csc_published_at
> Unique: (csc_key, ent_id)

#### amb_cms_subscribers (구독자)
- csb_id, cmp_id, csb_email, csb_name, csb_is_verified, csb_subscribed_at, csb_unsubscribed_at
> Unique: (cmp_id, csb_email)

---

### 5.31 서비스 관리 모듈 (7개)

#### amb_svc_services (서비스)
- svc_id, svc_code (UNIQUE), svc_name, svc_name_ko, svc_name_vi, svc_description
- svc_category, svc_icon, svc_color, svc_website_url, svc_status (ACTIVE 기본)
- svc_launch_date, svc_sort_order

#### amb_svc_plans (플랜)
- spl_id, svc_id, spl_code, spl_name, spl_billing_cycle (MONTHLY 기본)
- spl_price (decimal 15,2), spl_currency (USD 기본), spl_max_users, spl_features_json
- spl_trial_days (14), spl_overage_unit_price, Stripe 연동 ID
> Unique: (svc_id, spl_code)

#### amb_svc_clients (고객)
- cli_id, cli_code (UNIQUE), cli_type, cli_company_name, cli_country, cli_industry
- cli_status (ACTIVE 기본), cli_account_manager_id, cli_bil_partner_id
- cli_stripe_customer_id, cli_portal_source (MANUAL 기본), cli_ent_id

#### amb_svc_client_contacts (고객 연락처)
- ctc_id, cli_id, ctc_name, ctc_email, ctc_phone, ctc_position, ctc_is_primary

#### amb_svc_client_notes (고객 노트)
- cnt_id, cli_id, sub_id (nullable), cnt_type, cnt_title, cnt_content, cnt_author_id

#### amb_svc_subscriptions (구독)
| 주요 컬럼 | 설명 |
|----------|------|
| sub_id (PK) | 구독 ID |
| cli_id / svc_id / spl_id | 고객/서비스/플랜 |
| sub_status | ACTIVE 기본 |
| sub_start_date / sub_end_date | 시작/종료일 |
| sub_billing_cycle | 결제 주기 |
| sub_price / sub_currency | 금액/통화 |
| sub_discount_rate | 할인율 |
| sub_max_users / sub_actual_users | 최대/실제 사용자 수 |
| sub_auto_renew | 자동 갱신 |
| sub_cancelled_at / sub_cancellation_reason | 취소 정보 |
| Stripe 연동 필드 | 결제 연동 |

#### amb_svc_subscription_history (구독 이력)
- sbh_id, sub_id, sbh_action, sbh_field, sbh_old_value, sbh_new_value, sbh_changed_by

---

### 5.32 포털 연동 모듈 (2개)

#### amb_svc_portal_customers (포털 고객 — 읽기전용)
- pct_id, pct_email, pct_name, pct_phone, pct_company_name, pct_country
- pct_email_verified, pct_cli_id, pct_status

#### amb_portal_user_mappings (포털-사용자 매핑)
- pum_id, pct_id, usr_id, pum_status (ACTIVE 기본)
- pum_created_by, pum_revoked_by, pum_revoked_at

---

### 5.33 엔티티 설정 모듈 (4개)

#### amb_entity_ai_configs (AI 설정)
- eac_id, ent_id, eac_provider (ANTHROPIC 기본), eac_use_shared_key
- eac_api_key (암호화), eac_daily_token_limit, eac_monthly_token_limit, eac_is_active

#### amb_entity_custom_apps (커스텀 앱)
- eca_id, ent_id, eca_code, eca_name, eca_description, eca_icon
- eca_url, eca_auth_mode (jwt 기본), eca_open_mode (iframe 기본)
- eca_allowed_roles (simple-array), eca_sort_order, eca_is_active
> Unique: (ent_id, eca_code)

#### amb_login_histories (로그인 이력)
- lgh_id, usr_id, ent_id (nullable), lgh_ip, lgh_user_agent

#### amb_page_views (페이지뷰)
- pvw_id, usr_id, ent_id, pvw_path, pvw_menu_code

---

### 5.34 AI 사용량 모듈 (3개)

#### amb_ai_token_usage (토큰 사용)
- atu_id, ent_id, usr_id, cvs_id (nullable), atu_source_type (CHAT 기본)
- atu_model, atu_input_tokens, atu_output_tokens, atu_total_tokens
- atu_key_source (SHARED 기본)

#### amb_ai_token_entity_summary (엔티티 요약)
- ats_id, ent_id, ats_date, ats_total_tokens (bigint), ats_input_tokens, ats_output_tokens, ats_request_count
> Unique: (ent_id, ats_date)

#### amb_entity_api_quotas (API 할당량)
- eaq_id, ent_id (UNIQUE), eaq_daily_token_limit (bigint), eaq_monthly_token_limit (bigint)
- eaq_action_on_exceed (WARN 기본), eaq_updated_by

---

### 5.35 근태 모듈 (1개)

#### amb_attendances (근태)
- att_id, ent_id (nullable), usr_id, att_date, att_type, att_start_time, att_end_time
- att_approval_status (APPROVED 기본), att_approved_by, att_approved_at
> Unique: (usr_id, att_date)

---

### 5.36 마이그레이션 모듈 (2개)

#### amb_migration_logs (마이그레이션 로그)
- mgl_id, mgl_batch_id, mgl_source (REDMINE 기본)
- mgl_entity_type (PROJECT/ISSUE/COMMENT/USER), mgl_source_id (int), mgl_target_id (uuid)
- mgl_status (PENDING 기본), mgl_error_message

#### amb_migration_user_map (사용자 매핑)
- redmine_user_id (PK, int), amb_user_id (uuid), redmine_login, redmine_email, mapped_at

---

### 테이블 총괄 (140+개)

#### 핵심 모듈 테이블 (64개)

| 도메인 | 테이블 수 | 테이블명 |
|--------|-----------|----------|
| 인증 | 2 | amb_users, amb_password_resets |
| 채팅 | 2 | amb_conversations, amb_messages |
| 할일 | 1 | amb_todos |
| 회의록 | 1 | amb_meeting_notes |
| 근무일정 | 1 | amb_work_schedules |
| 공지사항 | 3 | amb_notices, amb_notice_attachments, amb_notice_reads |
| 멤버/그룹 | 2 | amb_groups, amb_user_groups |
| 초대 | 1 | amb_invitations |
| 설정 | 4 | amb_api_keys, amb_smtp_settings, amb_menu_permissions, amb_drive_settings |
| 문서함 | 1 | amb_drive_folders |
| 회계 | 2 | amb_bank_accounts, amb_transactions |
| HR | 19 | amb_hr_entities, amb_hr_entity_user_roles, amb_hr_employees, amb_hr_dependents, amb_hr_salary_history, amb_hr_system_params, amb_hr_holidays, amb_hr_payroll_periods, amb_hr_payroll_details, amb_hr_timesheets, amb_hr_ot_records, amb_hr_leave_balances, amb_hr_employees_kr, amb_hr_freelancers, amb_hr_insurance_params_kr, amb_hr_payroll_entries_kr, amb_hr_tax_simple_table, amb_hr_business_income_payments, amb_hr_yearend_adjustments |
| Billing | 9 | amb_bil_partners, amb_bil_contracts, amb_bil_contract_milestones, amb_bil_sow, amb_bil_documents, amb_bil_invoices, amb_bil_invoice_items, amb_bil_payments, amb_bil_contract_history |
| 웹메일 | 4 | amb_mail_accounts, amb_mail_messages, amb_mail_attachments, amb_mail_queue |
| 부서 | 2 | amb_departments, amb_user_dept_roles |
| ACL | 4 | amb_work_items, amb_work_item_shares, amb_work_item_comments, amb_access_audit_log |
| KMS | 4 | amb_kms_tags, amb_kms_tag_synonyms, amb_kms_tag_relations, amb_kms_work_item_tags |

#### 확장 모듈 테이블 (76+개)

| 도메인 | 테이블 수 | 테이블명 |
|--------|-----------|----------|
| 프로젝트 | 7 | kms_projects, kms_project_members, kms_project_files, kms_project_clients, kms_project_reviews, amb_project_epics, amb_project_components |
| 이슈 | 5 | amb_issues, amb_issue_sequences, amb_issue_status_logs, amb_issue_participants, amb_issue_comments |
| 캘린더 | 5 | amb_calendars, amb_calendar_recurrences, amb_calendar_exceptions, amb_calendar_participants, amb_calendar_notifications |
| 자산 | 6 | amb_assets, amb_asset_requests, amb_asset_change_logs, amb_asset_approval_histories, amb_asset_request_logs, amb_meeting_reservations |
| Amoeba Talk | 6 | amb_talk_channels, amb_talk_messages, amb_talk_channel_members, amb_talk_attachments, amb_talk_read_status, amb_talk_reactions |
| 알림 | 2 | amb_notifications, amb_push_subscriptions |
| 고객포털 | 1 | amb_client_invitations |
| 오늘 | 4 | amb_today_reports, amb_daily_missions, amb_today_snapshots, amb_today_snapshot_memos |
| 분석 | 1 | amb_site_event_logs |
| 번역 | 4 | amb_translation_usage, amb_content_translations, amb_content_translation_history, amb_translation_glossary |
| 지출결의 | 7 | amb_expense_requests, amb_expense_request_items, amb_expense_approvals, amb_expense_attachments, amb_expense_executions, amb_expense_forecast_reports, amb_expense_forecast_items |
| 보고서 | 1 | amb_work_reports |
| CMS | 10 | amb_cms_menus, amb_cms_pages, amb_cms_page_contents, amb_cms_page_versions, amb_cms_posts, amb_cms_post_attachments, amb_cms_post_categories, amb_cms_sections, amb_cms_site_config, amb_cms_subscribers |
| 서비스 | 7 | amb_svc_services, amb_svc_plans, amb_svc_clients, amb_svc_client_contacts, amb_svc_client_notes, amb_svc_subscriptions, amb_svc_subscription_history |
| 포털연동 | 2 | amb_svc_portal_customers, amb_portal_user_mappings |
| 엔티티설정 | 4 | amb_entity_ai_configs, amb_entity_custom_apps, amb_login_histories, amb_page_views |
| AI 사용량 | 3 | amb_ai_token_usage, amb_ai_token_entity_summary, amb_entity_api_quotas |
| 근태 | 1 | amb_attendances |
| 마이그레이션 | 2 | amb_migration_logs, amb_migration_user_map |

---

### 관계도 (ERD)

```
=== 핵심 모듈 ===

amb_users (1) ──┬── (N) amb_conversations ── (N) amb_messages (채팅)
                ├── (N) amb_password_resets
                ├── (N) amb_todos
                ├── (N) amb_meeting_notes
                ├── (N) amb_work_schedules
                ├── (N) amb_notices ──┬── (N) amb_notice_attachments
                │                    └── (N) amb_notice_reads
                ├── (N) amb_user_groups ── (N) amb_groups
                ├── (N) amb_invitations
                ├── (N) amb_drive_folders
                ├── (N) amb_bank_accounts ── (N) amb_transactions
                ├── (N) amb_mail_accounts ──┬── (N) amb_mail_messages ── (N) amb_mail_attachments
                │                           └── (N) amb_mail_queue
                ├── (N) amb_attendances
                ├── (N) amb_login_histories
                └── (N) amb_page_views

amb_hr_entities (1) ──┬── (N) amb_hr_entity_user_roles
                      ├── (N) amb_hr_employees ──┬── (N) amb_hr_dependents
                      │                          ├── (N) amb_hr_salary_history
                      │                          ├── (1) amb_hr_employees_kr
                      │                          ├── (N) amb_hr_timesheets
                      │                          ├── (N) amb_hr_ot_records
                      │                          └── (N) amb_hr_leave_balances
                      ├── (N) amb_hr_freelancers
                      ├── (N) amb_hr_system_params
                      ├── (N) amb_hr_holidays
                      ├── (N) amb_hr_insurance_params_kr
                      ├── (N) amb_hr_tax_simple_table
                      ├── (N) amb_hr_payroll_periods ──┬── (N) amb_hr_payroll_details
                      │                                └── (N) amb_hr_payroll_entries_kr
                      ├── (N) amb_hr_business_income_payments
                      └── (N) amb_hr_yearend_adjustments

amb_bil_partners ──── (N) amb_bil_contracts ──┬── (N) amb_bil_contract_milestones
                                              ├── (N) amb_bil_sow
                                              ├── (N) amb_bil_contract_history
                                              └── (N) amb_bil_invoices ──┬── (N) amb_bil_invoice_items
                                                                        └── (N) amb_bil_payments
amb_bil_documents (다형성: CONTRACT/SOW/INVOICE 참조)

amb_departments (1) ──┬── (N) amb_user_dept_roles ── (N→1) amb_users
                      └── (N) amb_departments (자기참조 - 부서 계층)

amb_work_items (1) ──┬── (N) amb_work_item_shares
                     ├── (N) amb_work_item_comments (자기참조 - 답글)
                     └── (N) amb_kms_work_item_tags ── (N→1) amb_kms_tags

amb_kms_tags (1) ──┬── (N) amb_kms_tag_synonyms
                   ├── (N) amb_kms_tag_relations (소스/타겟)
                   └── (N) amb_kms_tags (자기참조 - 태그 계층)

=== 확장 모듈 ===

kms_projects (1) ──┬── (N) kms_project_members ── (N→1) amb_users
                   ├── (N) kms_project_files
                   ├── (N) kms_project_clients ── (N→1) amb_svc_clients
                   ├── (N) kms_project_reviews
                   ├── (N) amb_project_epics
                   └── (N) amb_project_components

amb_issues (1) ──┬── (N) amb_issue_status_logs
                 ├── (N) amb_issue_participants
                 ├── (N) amb_issue_comments
                 └── (1) amb_issue_sequences (법인별)
amb_issues ── (N→1) kms_projects / amb_project_epics / amb_project_components (이슈→프로젝트 계층)
amb_issues (자기참조 - 이슈 계층)

amb_calendars (1) ──┬── (1) amb_calendar_recurrences
                    ├── (N) amb_calendar_exceptions
                    ├── (N) amb_calendar_participants ── (N→1) amb_users
                    └── (N) amb_calendar_notifications

amb_assets (1) ──── (N) amb_asset_change_logs
amb_asset_requests (1) ──┬── (N) amb_asset_approval_histories
                         ├── (N) amb_asset_request_logs
                         └── (1) amb_meeting_reservations

amb_talk_channels (1) ──┬── (N) amb_talk_messages ──┬── (N) amb_talk_attachments
                        │                           └── (N) amb_talk_reactions
                        ├── (N) amb_talk_channel_members
                        └── (N) amb_talk_read_status

amb_notifications (독립 — recipient/sender → amb_users)
amb_push_subscriptions (독립 — usr_id → amb_users)

amb_expense_requests (1) ──┬── (N) amb_expense_request_items
                           ├── (N) amb_expense_approvals
                           ├── (N) amb_expense_attachments
                           └── (N) amb_expense_executions
amb_expense_forecast_reports (1) ── (N) amb_expense_forecast_items

amb_svc_services (1) ── (N) amb_svc_plans
amb_svc_clients (1) ──┬── (N) amb_svc_client_contacts
                      ├── (N) amb_svc_client_notes
                      └── (N) amb_svc_subscriptions ── (N) amb_svc_subscription_history

amb_cms_menus (1) ── (N) amb_cms_pages (1) ──┬── (N) amb_cms_page_contents
                                              ├── (N) amb_cms_page_versions
                                              ├── (N) amb_cms_posts ── (N) amb_cms_post_attachments
                                              ├── (N) amb_cms_post_categories
                                              ├── (N) amb_cms_sections
                                              └── (N) amb_cms_subscribers

amb_today_reports (독립 — ent_id + usr_id)
amb_daily_missions (1) ── (N) amb_today_snapshots (1) ── (N) amb_today_snapshot_memos

amb_ai_token_usage (독립 — ent_id + usr_id + cvs_id 참조)
amb_ai_token_entity_summary (독립 — ent_id 참조)
amb_entity_api_quotas (독립 — ent_id UNIQUE)

amb_svc_portal_customers ── (N) amb_portal_user_mappings ── (N→1) amb_users
amb_client_invitations ── (N→1) amb_svc_clients

amb_access_audit_log (독립 — user + target 참조)
amb_api_keys         (독립 — created_by로 사용자 참조)
amb_smtp_settings    (독립 — 단일 레코드)
amb_menu_permissions (독립 — menu_code + role 조합)
amb_drive_settings   (독립 — 단일 레코드)
amb_site_event_logs  (독립 — 이벤트 로깅)
amb_work_reports     (독립 — ent_id + usr_id)
amb_migration_logs   (독립 — 마이그레이션 추적)
amb_migration_user_map (독립 — Redmine↔AMB 사용자 매핑)
```

## 6. API 엔드포인트

### 인증 (`/api/v1/auth`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | /auth/login | Public | 로그인 |
| POST | /auth/register | Public | 회원가입 |
| POST | /auth/refresh | Public | 토큰 갱신 |
| POST | /auth/forgot-password | Public | 비밀번호 재설정 요청 |
| POST | /auth/reset-password | Public | 비밀번호 재설정 |
| POST | /auth/change-password | JWT | 비밀번호 변경 |

### 에이전트 (`/api/v1/agents`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /agents | JWT | 부서 에이전트 목록 |
| GET | /agents/:department | JWT | 부서 에이전트 정보 |

### 대화 (`/api/v1/conversations`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /conversations | JWT | 대화 목록 (페이지네이션, 부서 필터) |
| POST | /conversations | JWT | 새 대화 생성 |
| GET | /conversations/:id | JWT | 대화 상세 (메시지 포함) |
| DELETE | /conversations/:id | JWT | 대화 삭제 (Soft Delete) |
| POST | /conversations/:id/messages | JWT | 메시지 전송 (SSE 스트리밍) |

### 할일 (`/api/v1/todos`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /todos | JWT | 할일 목록 (상태/날짜 필터) |
| POST | /todos | JWT | 할일 생성 |
| PATCH | /todos/:id | JWT | 할일 수정 |
| DELETE | /todos/:id | JWT | 할일 삭제 |

### 회의록 (`/api/v1/meeting-notes`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /meeting-notes | JWT | 회의록 목록 |
| POST | /meeting-notes | JWT | 회의록 생성 |
| GET | /meeting-notes/:id | JWT | 회의록 상세 |
| PATCH | /meeting-notes/:id | JWT | 회의록 수정 |
| DELETE | /meeting-notes/:id | JWT | 회의록 삭제 |

### 근무 일정 (`/api/v1/work-schedules`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /work-schedules/team | JWT | 팀 일정 조회 |
| GET | /work-schedules | JWT | 개인 일정 조회 |
| POST | /work-schedules | JWT | 일정 생성 (벌크) |
| PATCH | /work-schedules/:id | JWT | 일정 수정 |
| DELETE | /work-schedules/:id | JWT | 일정 삭제 |

### 공지사항 (`/api/v1/notices`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /notices | JWT | 공지 목록 |
| GET | /notices/recent | JWT | 최근 공지 (대시보드용) |
| GET | /notices/:id | JWT | 공지 상세 (조회수 +1) |
| POST | /notices | AdminGuard | 공지 생성 (multipart, 파일 첨부) |
| PATCH | /notices/:id | AdminGuard | 공지 수정 |
| DELETE | /notices/:id | AdminGuard | 공지 삭제 |
| DELETE | /notices/attachments/:attachmentId | AdminGuard | 첨부파일 삭제 |

### 문서함 (`/api/v1/drive`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /drive/status | JWT | Drive 연결 상태 확인 |
| GET | /drive/folders | JWT | 등록된 루트 폴더 목록 |
| POST | /drive/folders | AdminGuard | 폴더 등록 |
| DELETE | /drive/folders/:id | AdminGuard | 폴더 등록 해제 |
| GET | /drive/files | JWT | 폴더 내 파일 목록 |
| GET | /drive/files/:fileId | JWT | 파일 상세 메타데이터 |
| GET | /drive/files/:fileId/download | JWT | 파일 다운로드 (프록시) |
| GET | /drive/search | JWT | 전체 검색 |

### 회계 — 계좌 (`/api/v1/accounts`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /accounts | JWT | 계좌 목록 |
| GET | /accounts/summary | JWT | 계좌 요약 |
| GET | /accounts/:id | JWT | 계좌 상세 |
| POST | /accounts | JWT | 계좌 생성 |
| PATCH | /accounts/:id | JWT | 계좌 수정 |
| DELETE | /accounts/:id | JWT | 계좌 삭제 |
| POST | /accounts/import/excel | JWT | Excel 가져오기 (계좌+거래 일괄) |

### 회계 — 거래 (`/api/v1/accounts/:accountId/transactions`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /accounts/:accountId/transactions | JWT | 거래 목록 (날짜/검색 필터) |
| POST | /accounts/:accountId/transactions | JWT | 거래 생성 |
| PATCH | /accounts/:accountId/transactions/:id | JWT | 거래 수정 |
| DELETE | /accounts/:accountId/transactions/:id | JWT | 거래 삭제 |
| POST | /accounts/:accountId/transactions/import | JWT | Excel 가져오기 (거래) |

### HR (`/api/v1/hr/*`) — 12+ 컨트롤러
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 법인 | GET/POST/PATCH /entities | 법인 CRUD |
| 직원 | GET/POST/PATCH/DELETE /employees | 직원 관리, 부양가족/급여이력 조회 |
| 프리랜서 | GET/POST/PATCH/DELETE /freelancers | 프리랜서 관리 |
| 급여 | GET/POST/PATCH /payroll-periods | 급여 기간 CRUD, 계산, L1/L2 승인, 거절 |
| 급여 상세 | GET /payroll-periods/:id/details | 급여 상세 조회 (VN/KR 분기) |
| 근태 | GET/POST /timesheets | 근태 기록 |
| 초과근무 | GET/POST/PATCH /ot-records | OT 기록/승인 |
| 연차 | GET/PATCH /leave-balances | 연차 잔액 관리 |
| 퇴직금 | POST /severance/calculate | 퇴직금 계산 |
| 사업소득 | GET/POST/PATCH /business-income | 사업소득 지급 |
| 연말정산 | GET/POST/PATCH /yearend-adjustments | 연말정산 처리 |
| KR 설정 | GET/PATCH /kr-settings | 한국 세무/보험 설정 |
| KR 직원 | GET/PATCH /employees-kr | 한국 직원 확장 정보 |
| 시스템 파라미터 | GET/POST/PATCH /system-params | HR 시스템 파라미터 |
| 리포트 | GET /reports/* | HR/KR 리포트 |

### Billing (`/api/v1/billing/*`) — 8 컨트롤러
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 거래처 | GET/POST/PATCH/DELETE /partners | 거래처 CRUD |
| 계약 | GET/POST/PATCH/DELETE /contracts | 계약 CRUD, 갱신, 만료 체크, 이력 |
| SOW | GET/POST/PATCH/DELETE /sow | Scope of Work CRUD |
| 인보이스 | GET/POST/PATCH/DELETE /invoices | 인보이스 CRUD, PDF 생성, 메일 발송, Void/재발행 |
| 결제 | GET/POST/PATCH/DELETE /payments | 결제 기록 CRUD |
| 문서 | GET/POST/DELETE /documents | 문서 관리 (Google Drive 연동) |
| 자동 청구 | POST /automation/* | 자동 인보이스 생성 |
| 리포트 | GET /reports/* | Billing 리포트/분석 |

### 웹메일 (`/api/v1/mail/*`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /mail/account | JWT | 메일 계정 정보 |
| POST | /mail/account/sync | JWT | IMAP 동기화 |
| GET | /mail/folders/:folder | JWT | 메일 목록 (inbox/sent/drafts/trash) |
| GET | /mail/messages/:id | JWT | 메일 상세 (읽음 처리) |
| POST | /mail/messages | JWT | 메일 발송 |
| PATCH | /mail/messages/:id | JWT | 읽음/별표/폴더 이동 |
| DELETE | /mail/messages/:id | JWT | 휴지통 이동 |
| POST | /mail/attachments | JWT | 첨부파일 업로드 |
| GET | /mail/attachments/:id | JWT | 첨부파일 다운로드 |

### 멤버 (`/api/v1/members`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /members | @Roles('MANAGER') | 멤버 목록 |
| GET | /members/:id | @Roles('MANAGER') | 멤버 상세 |
| PATCH | /members/:id/role | @Roles('ADMIN') | 역할 변경 |

### 그룹 (`/api/v1/groups`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /groups | JWT | 그룹 목록 |
| POST | /groups | JWT | 그룹 생성 |
| PATCH | /groups/:id | JWT | 그룹 수정 |
| DELETE | /groups/:id | JWT | 그룹 삭제 |
| GET | /groups/:id/members | JWT | 그룹 멤버 조회 |
| POST | /groups/:id/members | JWT | 그룹에 멤버 추가 |
| DELETE | /groups/:id/members/:userId | JWT | 그룹에서 멤버 제거 |

### 초대 (`/api/v1/invitations`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | /invitations | @Roles('MANAGER') | 초대 생성 |
| GET | /invitations | @Roles('MANAGER') | 초대 목록 |
| GET | /invitations/validate/:token | Public | 토큰 검증 |
| PATCH | /invitations/:id/cancel | @Roles('MANAGER') | 초대 취소 |
| POST | /invitations/:id/resend | @Roles('MANAGER') | 재발송 |

### 설정 (API 키, SMTP, 메뉴 권한, Drive)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET/POST/PATCH/DELETE | /api-keys/* | @Roles('ADMIN') | API 키 CRUD + 테스트 |
| GET/PATCH | /smtp-settings | @Roles('ADMIN') | SMTP 설정 |
| POST | /smtp-settings/test | @Roles('ADMIN') | SMTP 테스트 |
| GET | /menu-permissions | @Roles('ADMIN') | 전체 메뉴 권한 |
| GET | /menu-permissions/me | JWT | 현재 사용자 메뉴 권한 |
| PATCH | /menu-permissions/:id | @Roles('ADMIN') | 메뉴 권한 수정 |
| GET/PATCH | /drive-settings | @Roles('ADMIN') | Drive 설정 |

### 부서 (`/api/v1/departments`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /departments/tree | JWT | 부서 계층 트리 조회 |
| GET | /departments | JWT | 전체 부서 목록 |
| GET | /departments/:id | JWT | 부서 상세 |
| POST | /departments | @Roles('MANAGER') | 부서 생성 |
| PUT | /departments/:id | @Roles('MANAGER') | 부서 수정 |
| DELETE | /departments/:id | @Roles('ADMIN') | 부서 삭제 |
| GET | /departments/:id/members | JWT | 부서 멤버 조회 |
| POST | /departments/roles | @Roles('MANAGER') | 사용자-부서 역할 배정 |
| PUT | /departments/roles/:id | @Roles('MANAGER') | 역할 수정 |
| DELETE | /departments/roles/:id | @Roles('MANAGER') | 역할 해제 |
| GET | /departments/hierarchy/visible-users | JWT | 가시 사용자 조회 |
| GET | /departments/hierarchy/subordinates | JWT | 하위 직원 조회 |
| GET | /departments/user/:userId/roles | JWT | 사용자 부서 역할 조회 |
| GET | /departments/my/roles | JWT | 내 부서 역할 조회 |

### 작업물 (`/api/v1/work-items`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /work-items | JWT | 작업물 목록 (type/visibility/scope/search 필터, 페이지네이션) |
| GET | /work-items/:id | JWT | 작업물 상세 |
| POST | /work-items | JWT | 작업물 생성 |
| PUT | /work-items/:id | JWT | 작업물 수정 |
| DELETE | /work-items/:id | JWT | 작업물 삭제 (Soft Delete) |
| GET | /work-items/:id/shares | JWT | 공유 목록 |
| POST | /work-items/:id/shares | JWT | 작업물 공유 |
| DELETE | /work-items/shares/:shareId | JWT | 공유 해제 |
| GET | /work-items/:id/comments | JWT | 코멘트 목록 |
| POST | /work-items/:id/comments | JWT | 코멘트 작성 |
| PUT | /work-items/comments/:commentId | JWT | 코멘트 수정 |
| DELETE | /work-items/comments/:commentId | JWT | 코멘트 삭제 |

### KMS 태그 (`/api/v1/kms`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | /kms/tags | JWT | 태그 생성 |
| GET | /kms/tags/tree | JWT | 태그 계층 트리 |
| GET | /kms/tags/search | JWT | 태그 검색 (q, limit) |
| GET | /kms/tags/autocomplete | JWT | 자동완성 (prefix, limit) |
| GET | /kms/tags/:id | JWT | 태그 상세 |
| PUT | /kms/tags/:id | JWT | 태그 수정 |
| DELETE | /kms/tags/:id | JWT | 태그 삭제 |
| GET | /kms/items/:witId/tags | JWT | 작업물 태그 조회 |
| POST | /kms/items/:witId/tags | JWT | 태그 할당 |
| DELETE | /kms/items/:witId/tags/:tagId | JWT | 태그 해제 |
| GET | /kms/tags/:tagId/items | JWT | 태그별 작업물 조회 |

### KMS 폭소노미 (`/api/v1/kms/items`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | /kms/items/:witId/tags/confirm | JWT | AI 제안 태그 확인 |
| POST | /kms/items/:witId/tags/reject | JWT | AI 제안 태그 거부 |
| POST | /kms/items/:witId/tags/manual | JWT | 수동 태그 추가 (정규화) |
| POST | /kms/items/:witId/auto-tag | JWT | AI 자동 태깅 트리거 |

### KMS 태그 클라우드/지식 그래프 (`/api/v1/kms`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /kms/tag-cloud | JWT | 태그 클라우드 (scope, level, period, max_tags) |
| GET | /kms/tag-cloud/:tagId/detail | JWT | 태그 상세 (스코프 비교, 관련 태그, 타임라인) |
| GET | /kms/knowledge-graph | JWT | 지식 그래프 (min_usage, max_nodes) |

### 파일 (`/api/v1/files`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /files/:filename | JWT | 파일 다운로드 |

### 프로젝트 (`/api/v1/projects`)
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 프로젝트 | GET/POST/PATCH/DELETE /projects | 프로젝트 CRUD, 코드 생성, 상태 전이 |
| 멤버 | GET/POST/DELETE /projects/:id/members | 프로젝트 멤버 관리 |
| 파일 | GET/POST/DELETE /projects/:id/files | Google Drive 연동 파일 관리 |
| 검토 | POST /projects/:id/review | AI 검토 요청, 승인/거절 |
| EPIC | GET/POST/PATCH/DELETE /projects/:id/epics | EPIC 관리 |
| 컴포넌트 | GET/POST/PATCH/DELETE /projects/:id/components | 컴포넌트 관리 |
| WBS | GET /projects/:id/wbs | WBS 구조 조회 |
| 간트 | GET /projects/:id/gantt | 간트 차트 데이터 |

### 이슈 (`/api/v1/issues`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /issues | JWT | 이슈 목록 (프로젝트/상태/우선순위 필터) |
| POST | /issues | JWT | 이슈 생성 (순번 자동 생성) |
| GET | /issues/:id | JWT | 이슈 상세 |
| PATCH | /issues/:id | JWT | 이슈 수정 |
| DELETE | /issues/:id | JWT | 이슈 삭제 |
| GET | /issues/:id/status-logs | JWT | 상태 변경 이력 |
| GET | /issues/:id/comments | JWT | 코멘트 목록 |
| POST | /issues/:id/comments | JWT | 코멘트 작성 |
| PATCH | /issues/comments/:commentId | JWT | 코멘트 수정 |
| DELETE | /issues/comments/:commentId | JWT | 코멘트 삭제 |

### 캘린더 (`/api/v1/calendar`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /calendar | JWT | 일정 목록 (기간 조회) |
| POST | /calendar | JWT | 일정 생성 (재발 포함) |
| GET | /calendar/:id | JWT | 일정 상세 |
| PATCH | /calendar/:id | JWT | 일정 수정 |
| DELETE | /calendar/:id | JWT | 일정 삭제 |
| PATCH | /calendar/:id/participants/:userId | JWT | 참여 응답 (수락/거절/보류) |
| POST | /calendar/google/sync | JWT | Google 캘린더 동기화 |

### 자산 (`/api/v1/assets`)
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 자산 | GET/POST/PATCH/DELETE /assets | 자산 CRUD |
| 요청 | GET/POST/PATCH /asset-requests | 자산 요청, 승인/거절/반려 |
| 회의실 예약 | GET/POST /meeting-reservations | 회의실 예약 관리 |
| 변경로그 | GET /assets/:id/change-logs | 자산 변경 이력 |

### Amoeba Talk (`/api/v1/talk`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /talk/channels | JWT | 채널 목록 |
| POST | /talk/channels | JWT | 채널 생성 |
| GET | /talk/channels/:id | JWT | 채널 상세 |
| PATCH | /talk/channels/:id | JWT | 채널 수정 |
| GET | /talk/channels/:id/messages | JWT | 메시지 목록 |
| POST | /talk/channels/:id/messages | JWT | 메시지 전송 |
| GET | /talk/channels/:id/sse | JWT | SSE 실시간 스트림 |
| POST | /talk/messages/:id/reactions | JWT | 리액션 추가/토글 |
| PATCH | /talk/channels/:id/read | JWT | 읽음 상태 갱신 |
| POST | /talk/channels/:id/members | JWT | 멤버 추가 |
| DELETE | /talk/channels/:id/members/:userId | JWT | 멤버 제거 |

### 알림 (`/api/v1/notifications`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /notifications | JWT | 알림 목록 |
| GET | /notifications/sse | JWT | SSE 실시간 알림 |
| PATCH | /notifications/:id/read | JWT | 읽음 처리 |
| PATCH | /notifications/read-all | JWT | 전체 읽음 |
| POST | /notifications/push-subscription | JWT | 푸시 구독 등록 |
| DELETE | /notifications/push-subscription | JWT | 푸시 구독 해제 |

### 오늘 (`/api/v1/today`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /today/reports | JWT | 리포트 목록 |
| POST | /today/reports/generate | JWT | AI 리포트 생성 (SSE) |
| GET | /today/missions | JWT | 미션 목록 |
| POST | /today/missions | JWT | 미션 생성 |
| GET | /today/snapshots | JWT | 스냅샷 목록 |
| POST | /today/snapshots/:id/memos | JWT | 메모 작성 |

### 번역 (`/api/v1/translation`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | /translation/translate | JWT | 콘텐츠 번역 요청 |
| GET | /translation/:sourceType/:sourceId/:field | JWT | 번역 조회 |
| GET | /translation/history/:translationId | JWT | 번역 이력 |
| GET | /translation/glossary | JWT | 용어집 목록 |
| POST | /translation/glossary | JWT | 용어 추가 |
| PATCH | /translation/glossary/:id | JWT | 용어 수정 |
| DELETE | /translation/glossary/:id | JWT | 용어 삭제 |

### 지출결의 (`/api/v1/expense-requests`)
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 결의 | GET/POST/PATCH/DELETE /expense-requests | 지출 결의 CRUD |
| 승인 | POST /expense-requests/:id/submit | 결재 상신 |
| 승인 | POST /expense-requests/:id/approve | L1/L2 승인 |
| 승인 | POST /expense-requests/:id/reject | 반려 |
| 집행 | POST /expense-requests/:id/execute | 지출 집행 |
| 예측 | GET/POST /expense-forecasts | 지출 예측 리포트 |
| 첨부 | POST/DELETE /expense-requests/:id/attachments | 첨부파일 관리 |

### 보고서 (`/api/v1/reports`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | /reports/work/daily/generate | JWT | AI 일일 보고서 생성 (SSE) |
| GET | /reports/work/daily/data | JWT | 일간 집계 데이터 |
| POST | /reports/work/weekly/generate | JWT | AI 주간 보고서 생성 (SSE) |
| GET | /reports/work | JWT | 보고서 목록 |
| GET | /reports/work/:id | JWT | 보고서 상세 |

### 근태 (`/api/v1/attendance`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /attendance | JWT | 근태 목록 |
| POST | /attendance/check-in | JWT | 출근 |
| POST | /attendance/check-out | JWT | 퇴근 |
| PATCH | /attendance/:id | JWT | 근태 수정 |

### CMS (`/api/v1/cms`)
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 메뉴 | GET/POST/PUT/DELETE /cms/menus | CMS 메뉴 CRUD, 순서 변경 |
| 페이지 | GET/POST/PUT /cms/pages | 페이지 CRUD, 발행/비발행 |
| 콘텐츠 | PUT /cms/pages/:id/content/:lang | 다국어 콘텐츠 수정 |
| 버전 | GET /cms/pages/:id/versions | 버전 이력, 롤백 |
| 섹션 | GET/POST/PUT/DELETE /cms/sections | 페이지 섹션 관리 |
| 포스트 | GET/POST/PATCH/DELETE /cms/posts | 블로그 포스트 CRUD |
| 카테고리 | GET/POST/PATCH/DELETE /cms/post-categories | 포스트 카테고리 |
| 구독 | GET /cms/subscribers | 구독자 목록 |
| 설정 | GET/PUT /cms/site-config | 사이트 설정 |

### 서비스 관리 (`/api/v1/service`)
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 서비스 | GET/POST/PATCH/DELETE /service/services | 서비스 카탈로그 CRUD |
| 플랜 | GET/POST/PATCH/DELETE /service/services/:id/plans | 요금 플랜 관리 |
| 고객 | GET/POST/PATCH/DELETE /service/clients | 고객 CRUD |
| 연락처 | GET/POST/PATCH/DELETE /service/clients/:id/contacts | 고객 연락처 |
| 노트 | GET/POST/PATCH /service/clients/:id/notes | 고객 노트 |
| 구독 | GET/POST/PATCH /service/subscriptions | 구독 CRUD, 취소/일시정지/재개/갱신 |
| 만기 | GET /service/subscriptions/expiring | 만기 예정 구독 |
| 이력 | GET /service/subscriptions/:id/history | 구독 변경 이력 |

### 포털 연동 (`/api/v1/portal-bridge`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /portal-bridge/customers | AdminOnly | 포털 고객 목록 |
| GET | /portal-bridge/customers/:pctId | AdminOnly | 포털 고객 상세 |
| POST | /portal-bridge/customers/:pctId/create-account | AdminOnly | AMB 계정 생성 |
| GET | /portal-bridge/mappings | AdminOnly | 매핑 목록 |
| PATCH | /portal-bridge/mappings/:pumId/revoke | AdminOnly | 매핑 취소 |

### 관리자 (`/api/v1/admin`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| GET | /admin/users | AdminLevelGuard | 전체 사용자 목록 |
| GET | /admin/entity-user-roles | AdminLevelGuard | 엔티티-사용자 역할 |
| GET | /admin/entities | AdminLevelGuard | 엔티티 목록 |
| GET | /admin/entities/:entityId | AdminLevelGuard | 엔티티 상세 |
| PATCH | /admin/entities/:entityId | AdminLevelGuard | 엔티티 수정 |
| GET | /admin/entities/:entityId/members | AdminLevelGuard | 엔티티 멤버 |
| GET | /admin/entities/:entityId/service-usage | AdminLevelGuard | 서비스 사용량 |
| GET | /admin/entities/:entityId/ai-usage | AdminLevelGuard | AI 사용량 |

### 엔티티 설정 (`/api/v1/entity-settings`)
| 카테고리 | 주요 엔드포인트 | 설명 |
|----------|----------------|------|
| 멤버 | GET/POST/PATCH /entity-settings/members | 엔티티 멤버 관리, 초대 |
| 초대 | GET/PATCH /entity-settings/invitations | 초대 목록, 취소, 재발송 |
| 커스텀앱 | GET/POST/PATCH/DELETE /entity-settings/custom-apps | 커스텀 앱 관리 |
| API 키 | GET/POST/PATCH/DELETE /entity-settings/api-keys | API 키 관리 |
| 권한 | GET/PATCH /entity-settings/permissions | 메뉴 권한 관리 |
| Drive | GET/PATCH /entity-settings/drive | Drive 설정 |
| 사용량 | GET /entity-settings/usage | AI 사용량 통계 |
| 조직 | GET/POST/PATCH/DELETE /entity-settings/organization | 조직 구조 관리 |

### 마이그레이션 (`/api/v1/migration`)
| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | /migration/redmine/preview | SUPER_ADMIN | 마이그레이션 미리보기 |
| POST | /migration/redmine/import | SUPER_ADMIN | Redmine 데이터 가져오기 |
| POST | /migration/redmine/import-selected | SUPER_ADMIN | 선택적 가져오기 |
| POST | /migration/redmine/rollback | SUPER_ADMIN | 롤백 |
| GET | /migration/logs | SUPER_ADMIN | 마이그레이션 로그 |
| GET | /migration/redmine/connection | SUPER_ADMIN | 연결 상태 확인 |
| GET | /migration/redmine/projects | SUPER_ADMIN | Redmine 프로젝트 목록 |
| GET | /migration/redmine/issues | SUPER_ADMIN | Redmine 이슈 목록 |

## 7. 에러 코드 체계

| 범위 | 도메인 |
|------|--------|
| E1xxx | 인증/인가 (E1001~E1006) |
| E2xxx | 사용자 (E2001~E2002) |
| E3xxx | 대화 (E3001~E3002) |
| E4xxx | 에이전트 (E4001~E4002) |
| E5xxx | API 키 (E5001~E5004) |
| E6xxx | 초대 (E6001~E6007) |
| E7xxx | 그룹 (E7001~E7004) |
| E8xxx | SMTP/메뉴 권한 (E8001~E8003) |
| E9xxx | 시스템 (E9001~E9002) |
| E10xxx | 할일 (E10001~E10002) |
| E11xxx | 회의록 (E11001~E11002) |
| E12xxx | 근무 일정 (E12001~E12006) |
| E13xxx | 공지사항 (E13001~E13004) |
| E14xxx | Drive/문서함 (E14001~E14005) |
| E15xxx | 회계 (계좌/거래) |
| E16xxx | HR (직원/급여/근태) |
| E17xxx | Billing (계약/인보이스/결제) |
| E18xxx | 웹메일 |
| E19xxx | ACL — 부서/작업물/공유 (E19001~E19009) |
| E20xxx | KMS — 태그/추출 (E20001~E20003) |
| E21xxx | 프로젝트 관리 (E21001~E21016: 프로젝트/EPIC/컴포넌트/멤버/파일/검토) |
| E22xxx | 서비스 관리 (E22001~E22012: 서비스/플랜/고객/구독/연락처/노트) |
| E23xxx | 이슈 (E23001~E23004: 이슈/상태 전이/코멘트/권한) |
| E24xxx | 번역 (E24001~E24008: 번역 서비스/잠금/소스/용어집) |
| E25xxx | 자산 관리 (E25001~E25004: 자산/요청/상태/검증) |
| E26xxx | 캘린더 (E26001~E26012: 일정/접근/충돌/참여자/Google 동기화) |
| E27xxx | CMS (E27001~E27070: 메뉴/페이지/섹션/포스트/구독자/사이트설정) |

## 8. 부서별 에이전트

| 부서 코드 | 이름 | 주요 전문 영역 |
|-----------|------|--------------|
| MANAGEMENT | 경영 | SWOT/BCG, KPI/BSC, 의사결정, 리스크관리 |
| ACCOUNTING | 회계 | K-IFRS, 법인세/부가세, 예산, 결산 |
| HR | 인사 | 근로기준법, 주52시간, 4대보험, 채용/평가 |
| LEGAL | 법무 | 계약서검토, 개인정보보호법, 컴플라이언스 |
| SALES | 영업 | CRM, B2B/B2G, 제안서, 매출분석 |
| IT | IT | ISMS-P, 시스템관리, DX전략 |
| MARKETING | 마케팅 | STP, 디지털마케팅, 캠페인ROI |
| GENERAL_AFFAIRS | 총무 | 구매/자산/시설/안전관리 |
| PLANNING | 기획 | 사업계획, 신사업, PM/WBS |

## 9. 보안 정책

| 정책 | 설정 |
|------|------|
| 비밀번호 해싱 | bcrypt (salt rounds: 12) |
| JWT Access Token | 15분 |
| JWT Refresh Token | 7일 |
| API 키 암호화 | AES-256-GCM |
| SMTP 비밀번호 암호화 | AES-256-GCM |
| 메일 계정 비밀번호 암호화 | AES-256-GCM (IV + Tag) |
| Rate Limiting | 전역: 60req/60s (ThrottlerModule) |
| CORS | 허용 도메인 명시 |
| 파일 업로드 | 10MB 제한, 허용 MIME 화이트리스트, UUID 파일명 |
| 비밀번호 재설정 | UUID 토큰, 1시간 만료, 1회 사용 |
| HTML 메일 본문 | DOMPurify sanitize (XSS 방어) |

## 10. 다국어 (i18n)

### 지원 언어

| 코드 | 언어 | 비고 |
|------|------|------|
| en | English | 기본 언어 (fallback) |
| ko | 한국어 | - |
| vi | Tiếng Việt | - |

### 네임스페이스 (38개)

`common`, `auth`, `chat`, `settings`, `dashboard`, `units`, `members`, `todos`, `meetingNotes`, `agents`, `attendance`, `notices`, `documents`, `accounting`, `hr`, `billing`, `mail`, `acl`, `kms`, `project`, `service`, `talk`, `myPage`, `assistant`, `issues`, `translation`, `calendar`, `asset`, `expenseRequest`, `site`, `notifications`, `entitySettings`, `totalUsers`, `entityManagement`, `today`, `report`, `clientPortal`, `admin`

### 프론트엔드 구조
- **라이브러리**: i18next + react-i18next
- **초기화**: `apps/web/src/i18n.ts`
- **번역 파일**: `apps/web/src/locales/{en,ko,vi}/`
- **언어 선택기**: `LanguageSelector` 컴포넌트 (헤더 우측)
- **저장**: `localStorage('amb-lang')`

### 백엔드 전략
- **에러 메시지**: 영어 고정 (에러 코드 기반, 프론트에서 번역)
- **AI 에이전트 응답**: `Accept-Language` 헤더로 언어 동적 제어

## 11. 포트 매핑

| 서비스 | 포트 | 비고 |
|--------|------|------|
| API (NestJS) | 3019 | |
| Web (Vite) | 5189 | |
| PostgreSQL | 5442 | |
| Adminer | 8099 | |
| Postal Web UI | 5000 | 메일 서버 관리 |
| Postal SMTP | 25, 587 | |
| Postal IMAP | 993 | |
| RabbitMQ Management | 15672 | Postal 메시지 큐 |
| Staging Web (Nginx) | 8088 | 스테이징 환경 |

## 12. 메뉴 권한 코드

| 카테고리 | 코드 | 설명 |
|---------|------|------|
| 부서 채팅 (9개) | CHAT_MANAGEMENT ~ CHAT_PLANNING | 각 부서별 AI 채팅 |
| 설정 (6개) | SETTINGS_MEMBERS, SETTINGS_API_KEYS, SETTINGS_SMTP, SETTINGS_PERMISSIONS, SETTINGS_ENTITIES, SETTINGS_DRIVE | 관리 설정 |
| 기능 메뉴 (17+개) | TODO, AGENTS, MEETING_NOTES, AMOEBA_TALK, ATTENDANCE, CALENDAR, NOTICES, DOCUMENTS, ACCOUNTING, HR, BILLING, MAIL, DEPARTMENTS, WORK_ITEMS, KMS, PROJECT, ISSUES, EXPENSE_REQUESTS, TODAY, WORK_REPORTS | 업무 기능 |
| 관리자 | ADMIN_DASHBOARD, SERVICE_MANAGEMENT, SITE_MANAGEMENT, PORTAL_BRIDGE, MIGRATION | 관리자 전용 |

## 13. 프론트엔드 상태 관리

| 도구 | 용도 | Zustand 스토어명 |
|-----|------|-----------------|
| **Zustand** | 전역 영속 상태 | auth (amb_auth), entity (amb_entity), chat, mail, talk, calendar, notification |
| **React Query** | 서버 상태 + 캐싱 | 모든 API 조회/변경 |
| **localStorage** | 클라이언트 저장소 | 언어 (amb-lang), 토큰, 엔티티, 사이드바 상태 |
| **Component State** | 로컬 UI 상태 | 폼 입력, 모달, 필터 등 |

## 14. 프론트엔드 라우팅

### 인증 라우트 (공개)
```
/login, /register, /forgot-password, /reset-password, /invite/:token
```

### 메인 라우트 (인증 필요 — MainLayout)
```
/                    → DashboardPage
/today               → TodayPage (AI 일일 요약, 미션)
/work-reports        → WorkReportsPage
/todos               → TodoPage
/issues              → IssuesPage
/agents              → AgentsPage
/meeting-notes       → MeetingNotesPage (+ /:id)
/amoeba-talk         → AmoebaTalkPage
/attendance          → AttendancePage
/calendar            → CalendarPage
/expense-requests    → ExpenseRequestPage (+ /new, /:id)
/notices             → NoticesPage (+ /:id)
/contracts           → ContractsPage
/documents           → DocumentsPage
/accounting          → AccountingPage (+ /:accountId)
/mail                → MailPage (MailLayout)
```

### 채팅 라우트 (서브메뉴 레이아웃)
```
/chat/:unit
/chat/:unit/new
/chat/:unit/:conversationId
```

### HR 라우트 (HR 레이아웃)
```
/hr/employees (+ /new, /:id)
/hr/freelancers (+ /new, /:id)
/hr/business-income
/hr/yearend
/hr/timesheet
/hr/overtime
/hr/leave
/hr/payroll (+ /:periodId)
/hr/severance
/hr/reports
/hr/settings
```

### Billing 라우트 (Billing 레이아웃)
```
/billing/dashboard
/billing/partners (+ /new, /:id)
/billing/contracts (+ /new, /:id)
/billing/sow (+ /new, /:id)
/billing/invoices (+ /new, /:id)
/billing/payments
```

### 프로젝트 라우트 (Project 레이아웃)
```
/project/*
```

### KMS 라우트 (KMS 레이아웃)
```
/kms/tag-cloud          → TagCloudPage (기본)
/kms/tags               → TagManagementPage
/kms/knowledge-graph    → KnowledgeGraphPage
```

### 엔티티 설정 라우트 (EntitySettingsGuard)
```
/entity-settings/members
/entity-settings/permissions
/entity-settings/api-keys
/entity-settings/custom-apps
/entity-settings/drive
/entity-settings/organization
/entity-settings/usage
```

### 관리자 라우트 (AdminLayout — AdminLevelGuard)
```
/admin                          → AdminDashboard
/admin/api-keys
/admin/members (+ /:id)
/admin/smtp
/admin/email-templates
/admin/entities (+ /:entityId)
/admin/service/*                → ServiceLayout (서비스/고객/구독)
  /admin/service/dashboard
  /admin/service/services (+ /:id)
  /admin/service/clients (+ /:id)
  /admin/service/subscriptions (+ /:id)
/admin/site/*                   → SiteLayout (CMS 관리)
  /admin/site/menus
  /admin/site/pages (+ /:pageId)
  /admin/site/analytics
  /admin/site/ga-settings
/admin/portal-bridge
/admin/redmine-migration
```

### 고객 포털 라우트 (ClientPortalLayout — 별도 포털)
```
/client-portal/dashboard
/client-portal/projects
/client-portal/issues (+ /new, /:id)
/client-portal/profile
```

### 사이트 미리보기 (공개)
```
/site/preview/:token
```

---

## 문서 이력

| 버전 | 일자 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-02-14 | 최초 작성 (auth, agent, chat) |
| v2.0 | 2026-02-14 | settings, members, invitation, todo, meeting-notes, work-schedule, notices, file upload 모듈 추가 |
| v2.1 | 2026-02-15 | drive 모듈(Google Drive 문서함) 추가, DB 스키마 보강, E14xxx 에러코드 |
| v3.0 | 2026-02-17 | 전체 재작성 — accounting(2 테이블), hr(19 테이블), billing(9 테이블), webmail(4 테이블) 모듈 추가. 총 54개 테이블 반영. 비밀번호 재설정, Drive 설정, 법인 관리 추가. 프론트엔드 라우팅/상태관리/레이아웃 정보 추가. Docker 인프라(스테이징, Postal) 반영. 메뉴 권한 코드 23개 반영 |
| v4.0 | 2026-02-18 | ACL + KMS 폭소노미 통합 — department(2), acl(4), kms(4) 모듈 추가. 총 64개 테이블. 부서 계층 구조, 작업물 소유권/가시성/공유/코멘트, 감사 로그. KMS 3단계 태그(Domain→Topic→Context), AI 태그 추출(Claude), 4단계 정규화(exact→synonym→trigram→create), 태그 클라우드(MY/TEAM/COMPANY 스코프), 지식 그래프. pgvector+pg_trgm 확장. E19xxx/E20xxx 에러코드. 메뉴 권한 코드 26개. i18n 네임스페이스 acl/kms 추가 |
| v5.0 | 2026-03-21 | 전체 재구조화 — 20개 신규 모듈 추가 (project, issues, calendar, asset, amoeba-talk, notification, client-portal, today, analytics, search, translation, expense-request, report, site-management, service-management, portal-bridge, admin, entity-settings, ai-usage, attendance, migration). 총 37개 백엔드 모듈, 140+개 DB 테이블. E21xxx~E27xxx 에러코드 추가. i18n 네임스페이스 38개. 관리자/엔티티설정/CMS/서비스관리/포털연동 라우트 추가. 고객 포털(ClientPortal) 별도 레이아웃. Redmine 마이그레이션 지원. 다중 통화(VND/USD/KRW) 지출결의. AI 토큰 사용량 추적 및 엔티티별 할당량 |
