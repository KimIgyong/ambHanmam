# 요구사항 분석서: 개인정보보호 GDPR/CCPA 적용

- **문서번호**: REQ-개인정보보호GDPR-CCPA적용-20260323
- **작성일**: 2026-03-23
- **상태**: 분석 완료
- **범위**: SYSTEM_LEVEL (전체 시스템)
- **근거**: REPORT-개인정보보호-웹접근성-검토-20260323.md
- **관련 법규**: GDPR (EU), CCPA/CPRA (미국 캘리포니아), PDPD (베트남)

---

## 1. 요구사항 요약

AMA 서비스를 유럽(EU) 및 미국(US) 지역에 제공하기 위해, **GDPR**(General Data Protection Regulation)과 **CCPA/CPRA**(California Consumer Privacy Act)에서 요구하는 개인정보보호 기능을 구현한다.

### 핵심 요구사항

| # | 요구사항 | 우선순위 | GDPR | CCPA |
|---|---------|---------|------|------|
| R-1 | 쿠키 동의 배너 (Cookie Consent Management) | 🔴 Critical | Art. 7 | - |
| R-2 | 동의 기록 시스템 (Consent Records) | 🔴 Critical | Art. 7(1) | - |
| R-3 | 개인정보 처리방침 페이지 (Privacy Policy) | 🔴 Critical | Art. 13-14 | 1798.100 |
| R-4 | 데이터 주체 권리 API (DSR: Data Subject Rights) | 🔴 Critical | Art. 15-20 | 1798.100-125 |
| R-5 | 데이터 침해 통보 시스템 (Breach Notification) | 🟡 Important | Art. 33-34 | 1798.150 |
| R-6 | 데이터 보유/파기 정책 (Retention & Purge) | 🟡 Important | Art. 5(1)(e) | 1798.105 |
| R-7 | 마케팅 수신 동의 관리 (Opt-out/Unsubscribe) | 🟡 Important | Art. 21 | 1798.120 |
| R-8 | DPO 연락처 및 DPIA (Data Protection Officer) | 🟢 Recommended | Art. 37 | - |

### 설계 원칙

1. **Privacy by Design**: 개인정보보호를 시스템 설계 단계에서 고려 (GDPR Art. 25)
2. **데이터 최소 수집**: 서비스 제공에 필수적인 데이터만 수집
3. **동의 기반 처리**: 명시적 사전 동의 후 데이터 처리 (Opt-in 방식)
4. **멀티테넌시 격리**: Entity(법인) 단위 동의 정책 관리
5. **감사 추적성**: 모든 개인정보 처리 행위에 대한 로그 기록

---

## 2. AS-IS 현황 분석

### 2.1 사용자 개인정보(PII) 데이터 현황

| 테이블 | PII 컬럼 | 암호화 | 비고 |
|--------|---------|--------|------|
| `amb_users` | `usr_email`, `usr_name`, `usr_phone`, `usr_company_email` | ❌ 평문 | Salt:12 bcrypt(비밀번호만) |
| `amb_users` | `usr_profile_image`, `usr_signature_image` | ❌ bytea 원문 | 생체 정보 아님 |
| `amb_users` | `usr_last_login_at`, `usr_timezone`, `usr_locale` | ❌ 평문 | 행동 데이터 |
| `amb_users` | `usr_translation_prefs`, `usr_issue_filter_presets` | ❌ JSONB | 프로파일링 데이터 |
| `amb_login_histories` | `lgh_ip`, `lgh_user_agent` | ❌ 평문 | 네트워크/기기 PII |
| `amb_page_views` | `pvw_ip`, `pvw_user_agent`, `pvw_path` | ❌ 평문 | 행동 추적 |
| `amb_hr_members` | 직원 상세 정보 | ❌ 평문 | HR 민감 데이터 |
| `amb_access_audit_log` | `aal_user_id`, `aal_access_path`, `aal_details` | ❌ 평문 | 감사 로그 |
| `amb_smtp_settings` | `sms_password` | ✅ AES-256-GCM | 인증 정보 |
| `amb_api_keys` | `apk_encrypted_key` | ✅ AES-256-GCM | API 인증 정보 |

### 2.2 기존 보안 인프라 (재활용 가능)

| 항목 | 구현 현황 | 파일 |
|------|----------|------|
| AES-256-GCM 암호화 서비스 | ✅ CryptoService | `domain/settings/service/crypto.service.ts` |
| 감사 로그 시스템 | ✅ AuditService + `amb_access_audit_log` | `domain/acl/entity/access-audit-log.entity.ts` |
| Soft Delete 패턴 | ✅ 대부분 엔티티 적용 (`*_deleted_at`) | 전체 도메인 |
| 이메일 마스킹 | ✅ `maskEmail()` 유틸리티 | `packages/common/src/utils.ts` |
| JWT + HttpOnly Cookie | ✅ Access 15분 / Refresh 7일 | `domain/auth/` |
| Rate Limiting | ✅ @nestjs/throttler (로그인: 5/분) | `main.ts`, `auth.controller.ts` |
| OwnEntityGuard | ✅ 멀티테넌시 데이터 격리 | `global/guard/own-entity.guard.ts` |
| Helmet 보안 헤더 | ✅ CSP, HSTS, X-Frame-Options 등 | `main.ts` (L42) |

### 2.3 동의/프라이버시 관련 현황 (미구현)

| 항목 | 현황 |
|------|------|
| 쿠키 동의 배너 | ❌ 없음 — 쿠키 정책 페이지, CMP, 사전 동의 팝업 미존재 |
| 동의 기록 테이블 | ❌ 없음 — `amb_consent_records` 등 관련 엔티티 미존재 |
| 개인정보 처리방침 | ⚠️ 링크만 — LandingPage에 `#` href로 링크만 존재, 실제 콘텐츠 없음 |
| DSR(데이터 주체 권리) API | ❌ 없음 — 데이터 내보내기, 삭제 요청 API 미존재 |
| 데이터 보유 기간 정책 | ❌ 없음 — Soft Delete만 적용, 물리 삭제/보유 기간 미정의 |
| 침해 통보 시스템 | ❌ 없음 — 이상 징후 감지/자동 알림 시스템 미존재 |
| DPO 연락처 공시 | ❌ 없음 |

### 2.4 사용자 삭제 플로우 현황

```
현재: 사용자 탈퇴 요청 → usr_status = 'WITHDRAWN' + usr_deleted_at 설정
      → Soft Delete (DB에 데이터 잔존)
      → 관련 데이터 연쇄 삭제: ❌ 미구현 (대화, 메시지, 이슈 등 잔존)
      → 물리 삭제: ❌ 미구현 (영구 보관)
      → 삭제 확인 알림: ❌ 미발송
```

### 2.5 i18n 현황 (개인정보보호 관련)

| 항목 | 현황 |
|------|------|
| 네임스페이스 | 45+ 존재, `privacy` 또는 `consent` 네임스페이스 **없음** |
| 지원 언어 | ko / en / vi (3개 언어) |
| 번역 방식 | JSON 파일 + `t('ns:key')` 함수 |

---

## 3. TO-BE 요구사항

### 3.1 R-1: 쿠키 동의 배너 (Cookie Consent Management)

#### 3.1.1 기능 요구사항

| # | 요구사항 | 상세 |
|---|---------|------|
| F-1.1 | 쿠키 분류 체계 | 필수(strictly necessary), 성능(analytics), 기능(functional), 마케팅(marketing) 4단계 |
| F-1.2 | 사전 동의 배너 | 첫 방문 시 쿠키 동의 배너 표시 (EU 사용자 필수) |
| F-1.3 | 세부 쿠키 설정 UI | 쿠키 카테고리별 개별 on/off 토글 |
| F-1.4 | 동의 상태 저장 | 쿠키 동의 결과를 localStorage + 서버 DB 이중 저장 |
| F-1.5 | 동의 철회 | 설정 페이지에서 언제든 동의 변경 가능 |
| F-1.6 | 지역 기반 표시 | EU 사용자에게만 사전 동의(opt-in), 비EU는 알림형(opt-out) |
| F-1.7 | 다국어 지원 | ko/en/vi 3개 언어로 쿠키 배너 렌더링 |

#### 3.1.2 적용 대상

| 앱 | 적용 | 비고 |
|----|------|------|
| apps/web | ✅ | 내부 직원용 (로그인 후) — 분석 쿠키 동의 |
| apps/portal-web | ✅ | B2B 고객/파트너 (로그인 전 LandingPage 포함) |

#### 3.1.3 쿠키 분류 기준

| 카테고리 | 예시 | 동의 필요 |
|----------|------|----------|
| Strictly Necessary | JWT refresh token (HttpOnly), CSRF, lang | ❌ 항상 활성 |
| Analytics | 페이지뷰(`amb_page_views`), 유휴 타임아웃 | ✅ 동의 필요 (EU) |
| Functional | 번역 설정(`amb-lang`), 테마, 필터 프리셋 | ✅ 동의 필요 (EU) |
| Marketing | N/A (현재 없음) | ✅ 동의 필요 |

### 3.2 R-2: 동의 기록 시스템 (Consent Records)

#### 3.2.1 DB 스키마 — `amb_consent_records`

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `cnr_id` | UUID (PK) | ✅ | 동의 기록 ID |
| `cnr_user_id` | UUID (FK → amb_users) | ✅ | 동의 사용자 |
| `cnr_ent_id` | UUID (FK → amb_entities) | ✅ | 소속 법인 |
| `cnr_type` | VARCHAR | ✅ | 동의 유형: `COOKIE`, `PRIVACY_POLICY`, `MARKETING`, `DATA_PROCESSING`, `THIRD_PARTY` |
| `cnr_category` | VARCHAR | ✅ | 세부 카테고리 (쿠키: `analytics`, `functional`, `marketing`) |
| `cnr_version` | VARCHAR | ✅ | 정책 버전 (예: `v1.0`, `v2.0`) |
| `cnr_action` | VARCHAR | ✅ | `GRANTED`, `REVOKED`, `UPDATED` |
| `cnr_ip_address` | VARCHAR | ❌ | 동의 시 IP (익명화 저장: 마지막 옥텟 0 처리) |
| `cnr_user_agent` | TEXT | ❌ | 브라우저 정보 |
| `cnr_details` | JSONB | ❌ | 추가 상세 (동의 항목 목록 등) |
| `cnr_expires_at` | TIMESTAMP | ❌ | 동의 만료일 (갱신 필요 시점) |
| `cnr_created_at` | TIMESTAMP | ✅ | 동의 일시 |

#### 3.2.2 DB 스키마 — `amb_consent_policies`

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `cpl_id` | UUID (PK) | ✅ | 정책 ID |
| `cpl_ent_id` | UUID (FK) | ❌ | NULL이면 시스템 공통 정책 |
| `cpl_type` | VARCHAR | ✅ | 정책 유형: `PRIVACY_POLICY`, `COOKIE_POLICY`, `TERMS_OF_SERVICE` |
| `cpl_version` | VARCHAR | ✅ | 버전 (예: `v1.0`) |
| `cpl_locale` | VARCHAR | ✅ | 언어코드: `ko`, `en`, `vi` |
| `cpl_title` | VARCHAR | ✅ | 정책 제목 |
| `cpl_content` | TEXT | ✅ | 정책 본문 (Markdown) |
| `cpl_is_active` | BOOLEAN | ✅ | 현재 활성 버전 여부 |
| `cpl_effective_date` | TIMESTAMP | ✅ | 시행일 |
| `cpl_created_at` | TIMESTAMP | ✅ | 작성일 |
| `cpl_updated_at` | TIMESTAMP | ✅ | 수정일 |

#### 3.2.3 API 설계

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/v1/consent/accept` | 동의 등록 | Auth (로그인 사용자) 또는 Anonymous (쿠키만) |
| POST | `/api/v1/consent/revoke` | 동의 철회 | Auth |
| GET | `/api/v1/consent/my-consents` | 내 동의 현황 조회 | Auth |
| GET | `/api/v1/consent/policy/:type` | 정책 내용 조회 (최신 버전) | Public |
| GET | `/api/v1/consent/policy/:type/versions` | 정책 버전 이력 | Public |
| POST | `/api/v1/admin/consent/policy` | 정책 등록/갱신 (관리자) | AdminOnly |
| GET | `/api/v1/admin/consent/records` | 동의 기록 조회 (관리자) | AdminOnly |

### 3.3 R-3: 개인정보 처리방침 페이지

#### 3.3.1 페이지 구성

| 섹션 | 내용 | GDPR 조항 |
|------|------|----------|
| 수집하는 개인정보 항목 | 이메일, 이름, 전화번호, IP, UserAgent, 프로필 이미지 | Art. 13(1)(a) |
| 개인정보 처리 목적 | 서비스 제공, 사용자 인증, 분석, 고객 지원 | Art. 13(1)(c) |
| 보유 및 이용 기간 | 도메인별 보유 기간 (계정: 탈퇴 후 90일, 로그: 1년 등) | Art. 13(2)(a) |
| 제3자 제공 | Anthropic(AI), NICEPAY(결제), 이메일 발송 서비스 | Art. 13(1)(e) |
| 국외 이전 | 한국/베트남 서버, AI 처리(Anthropic US) | Art. 13(1)(f) |
| 데이터 주체 권리 | 열람, 정정, 삭제, 처리 제한, 이동, 반대 | Art. 13(2)(b) |
| DPO 연락처 | 이메일, 주소 | Art. 13(1)(a) |
| 감독기관 불만 제기 | 해당 국가 감독기관 정보 | Art. 13(2)(d) |
| 자동화된 의사결정 | AI 기반 분석/추천 기능 고지 | Art. 13(2)(f) |

#### 3.3.2 다국어 적용

- `ko`: 한국어 개인정보처리방침
- `en`: Privacy Policy (GDPR + CCPA 통합)
- `vi`: Chính sách Bảo mật (PDPD 반영)

#### 3.3.3 표시 위치

| 위치 | 방식 |
|------|------|
| portal-web LandingPage Footer | 상시 링크 (현재 `#` → 실제 페이지로 교체) |
| portal-web 회원가입 | 동의 체크박스 + 링크 |
| web Footer | 상시 링크 |
| 쿠키 배너 | "자세히 보기" 링크 |

### 3.4 R-4: 데이터 주체 권리 API (DSR)

#### 3.4.1 DSR API 설계

| Method | Endpoint | 기능 | GDPR | CCPA |
|--------|----------|------|------|------|
| GET | `/api/v1/my-data/profile` | 내 개인정보 조회 | Art. 15 | 1798.100 |
| GET | `/api/v1/my-data/export` | 데이터 내보내기 (JSON/CSV) | Art. 20 | 1798.100 |
| POST | `/api/v1/my-data/deletion-request` | 삭제 요청 등록 | Art. 17 | 1798.105 |
| POST | `/api/v1/my-data/restrict` | 처리 제한 요청 | Art. 18 | - |
| GET | `/api/v1/my-data/deletion-request/status` | 삭제 요청 상태 확인 | Art. 12 | 1798.130 |

#### 3.4.2 DB 스키마 — `amb_dsr_requests`

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `dsr_id` | UUID (PK) | ✅ | 요청 ID |
| `dsr_user_id` | UUID (FK → amb_users) | ✅ | 요청자 |
| `dsr_ent_id` | UUID (FK) | ✅ | 소속 법인 |
| `dsr_type` | VARCHAR | ✅ | `EXPORT`, `DELETION`, `RESTRICTION`, `ACCESS`, `RECTIFICATION`, `PORTABILITY` |
| `dsr_status` | VARCHAR | ✅ | `PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED` |
| `dsr_reason` | TEXT | ❌ | 요청 사유 |
| `dsr_admin_note` | TEXT | ❌ | 관리자 처리 메모 |
| `dsr_processed_by` | UUID (FK) | ❌ | 처리한 관리자 ID |
| `dsr_processed_at` | TIMESTAMP | ❌ | 처리 완료 일시 |
| `dsr_deadline_at` | TIMESTAMP | ✅ | 법정 처리 기한 (GDPR: 요청+30일) |
| `dsr_export_file_path` | VARCHAR | ❌ | 내보내기 파일 경로 (임시 저장) |
| `dsr_created_at` | TIMESTAMP | ✅ | 요청 일시 |

#### 3.4.3 데이터 내보내기 범위

| 도메인 | 내보내기 항목 | 형식 |
|--------|-------------|------|
| 사용자 프로필 | 이메일, 이름, 전화번호, 직책, 소속, 설정 | JSON |
| 대화 | 채팅 메시지, AI 대화 이력 | JSON |
| 이슈 | 본인 작성 이슈, 댓글 | JSON |
| 회의록 | 본인 참여 회의록 | JSON |
| 출석 | 출퇴근 기록 | CSV |
| 할일 | 본인 할일 목록 | JSON |
| 로그인 이력 | IP, UserAgent, 시간대 | CSV |
| 페이지뷰 | 접속 경로, 시간 | CSV |

#### 3.4.4 삭제 처리 워크플로우

```
사용자 삭제 요청
  → dsr_status = 'PENDING', dsr_deadline_at = now() + 30일
  → 관리자 알림 (이메일 + 시스템 알림)
  → 관리자 검토/승인
  → 승인 시:
    1. 사용자 상태: usr_status = 'WITHDRAWN'
    2. PII 익명화: usr_email → 'deleted_<hash>@anon', usr_name → '삭제된 사용자'
    3. 프로필/서명 이미지 삭제
    4. 로그인 이력 IP 익명화
    5. 페이지뷰 IP 익명화
    6. 대화 메시지: 작성자 연결 해제 (메시지 내용은 법인 소유)
    7. 감사 로그: 보존 (법적 의무)
    8. dsr_status = 'COMPLETED'
    9. 사용자에게 삭제 완료 이메일 발송
  → 거부 시:
    1. dsr_status = 'REJECTED', dsr_admin_note 작성
    2. 사용자에게 거부 사유 이메일 발송
```

#### 3.4.5 관리자 DSR 관리 API

| Method | Endpoint | 기능 |
|--------|----------|------|
| GET | `/api/v1/admin/dsr-requests` | DSR 요청 목록 (필터: 상태, 유형, 기한) |
| GET | `/api/v1/admin/dsr-requests/:id` | 요청 상세 |
| PATCH | `/api/v1/admin/dsr-requests/:id/approve` | 승인 처리 |
| PATCH | `/api/v1/admin/dsr-requests/:id/reject` | 거부 처리 |
| GET | `/api/v1/admin/dsr-requests/overdue` | 기한 초과 요청 목록 |

### 3.5 R-5: 데이터 침해 통보 시스템

#### 3.5.1 이상 감지 규칙

| # | 이벤트 | 임계값 | 심각도 |
|---|--------|--------|--------|
| 1 | 연속 로그인 실패 | 동일 IP 10회/10분 | 🟡 Warning |
| 2 | 다수 계정 접근 시도 | 동일 IP로 5개 이상 계정 | 🔴 Critical |
| 3 | 대량 데이터 조회 | 단일 사용자 1000건 이상/시간 | 🟡 Warning |
| 4 | 비정상 시간대 접근 | 새벽 2-5시 (기준 시간대) 대량 접근 | 🟡 Warning |
| 5 | 관리자 권한 변경 | 비인가 역할 변경 시도 | 🔴 Critical |

#### 3.5.2 통보 프로세스

```
이상 감지 → amb_breach_incidents 기록
  → 즉시 알림: DPO/관리자 이메일 + Slack 웹훅
  → 72시간 타이머 시작 (GDPR Art. 33)
  → 관리자 조사 & 영향 평가
  → 감독기관 통보 필요 판단
    → 필요 시: 통보서 생성 + 발송 기록
    → 고위험 시: 데이터 주체(사용자) 통보 (Art. 34)
```

#### 3.5.3 DB 스키마 — `amb_breach_incidents`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `bri_id` | UUID (PK) | 사건 ID |
| `bri_ent_id` | UUID (FK) | 관련 법인 (NULL이면 시스템 전체) |
| `bri_type` | VARCHAR | `BRUTE_FORCE`, `DATA_LEAK`, `UNAUTHORIZED_ACCESS`, `ANOMALY` |
| `bri_severity` | VARCHAR | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `bri_status` | VARCHAR | `DETECTED`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`, `REPORTED` |
| `bri_description` | TEXT | 사건 설명 |
| `bri_affected_users` | INTEGER | 영향 받은 사용자 수 |
| `bri_detection_details` | JSONB | 감지 상세 (IP, 패턴 등) |
| `bri_response_actions` | JSONB | 대응 조치 이력 |
| `bri_authority_notified_at` | TIMESTAMP | 감독기관 통보 일시 |
| `bri_users_notified_at` | TIMESTAMP | 사용자 통보 일시 |
| `bri_detected_at` | TIMESTAMP | 감지 일시 |
| `bri_resolved_at` | TIMESTAMP | 해결 일시 |
| `bri_created_at` | TIMESTAMP | 기록 일시 |

### 3.6 R-6: 데이터 보유/파기 정책 (Retention & Purge)

#### 3.6.1 도메인별 보유 기간 정책

| 데이터 유형 | 보유 기간 | 파기 방법 | 근거 |
|------------|----------|----------|------|
| 탈퇴 사용자 PII | 탈퇴 후 90일 | 익명화 + 물리 삭제 | GDPR Art. 17 |
| 로그인 이력 | 1년 | IP 익명화 후 집계 보관 | GDPR Art. 5(1)(e) |
| 페이지뷰 로그 | 6개월 | IP 익명화 후 집계 보관 | - |
| 감사 로그 | 5년 | 보존 (법적 의무) | 전자상거래법, GDPR Art. 6(1)(c) |
| 대화 메시지 | 법인 정책 (기본: 무기한) | 법인별 설정 가능 | 법인 소유 데이터 |
| Soft Delete 데이터 | 90일 | 물리 삭제 (CASCADE) | GDPR Art. 5(1)(e) |
| DSR 내보내기 파일 | 7일 | 자동 삭제 | 임시 파일 |

#### 3.6.2 자동 파기 스케줄러

| Cron | 작업 | 대상 테이블 |
|------|------|-----------|
| 매일 02:00 UTC | Soft Delete 물리 삭제 (90일 경과) | 전체 Soft Delete 엔티티 |
| 매일 03:00 UTC | 탈퇴 사용자 PII 익명화 (90일 경과) | `amb_users` |
| 매주 월 04:00 UTC | 로그인 이력 IP 익명화 (1년 경과) | `amb_login_histories` |
| 매주 월 04:30 UTC | 페이지뷰 IP 익명화 (6개월 경과) | `amb_page_views` |
| 매일 05:00 UTC | DSR 내보내기 파일 삭제 (7일 경과) | 파일시스템 |
| 매일 06:00 UTC | DSR 기한 초과 알림 | `amb_dsr_requests` |

### 3.7 R-7: 마케팅 수신 동의 관리

#### 3.7.1 수신 동의 컬럼 추가 (`amb_users`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `usr_marketing_email_consent` | BOOLEAN (default: false) | 마케팅 이메일 수신 동의 |
| `usr_marketing_consent_at` | TIMESTAMP | 동의/철회 일시 |

#### 3.7.2 기능

- 이메일 발송 전 수신 동의 확인  
- 내 설정(MyPage)에서 수신 동의 on/off 토글  
- 이메일 본문에 "수신 거부" 1-click 링크 포함  
- 동의 변경 시 `amb_consent_records`에 이력 기록  

---

## 4. 갭 분석

### 4.1 개인정보보호 AS-IS vs TO-BE 비교

| # | 항목 | AS-IS | TO-BE | 갭 | 구현 난이도 |
|---|------|-------|-------|-----|-----------|
| 1 | 쿠키 동의 배너 | ❌ 없음 | 사전동의 팝업 + 카테고리별 설정 | 🔴 신규 개발 | 중 |
| 2 | 동의 기록 시스템 | ❌ 없음 | `amb_consent_records` + `amb_consent_policies` | 🔴 신규 개발 (DB+API+FE) | 중상 |
| 3 | 개인정보 처리방침 | ⚠️ 링크만 | 실제 콘텐츠 3개 언어 + CMS 관리 | 🟡 콘텐츠 + CMS 연동 | 중 |
| 4 | DSR API | ❌ 없음 | 6종 API + 관리자 워크플로우 | 🔴 신규 개발 (대규모) | 상 |
| 5 | 데이터 침해 통보 | ❌ 없음 | 감지 규칙 + 알림 + 추적 | 🔴 신규 개발 | 상 |
| 6 | 보유/파기 정책 | Soft Delete만 | 자동 물리 삭제 + 익명화 Cron | 🟡 기존 확장 | 중 |
| 7 | 마케팅 수신 동의 | ❌ 없음 | 컬럼 추가 + 토글 UI + 이메일 링크 | 🟢 비교적 단순 | 하 |
| 8 | DPO/DPIA | ❌ 없음 | 연락처 공시 + 영향 평가 문서 | 🟢 비기술적 (법률/운영) | 하 |
| 9 | PII 컬럼 암호화 | 비밀번호만 bcrypt | 이메일/전화번호 AES-256-GCM | 🟡 기존 서비스 확장 | 중 |
| 10 | 국외 이전 관리 | ❌ 없음 | SCC 관리, 데이터 저장 지역 제어 | 🟡 법률 + 인프라 | 중상 |

### 4.2 영향도 분석 (사이드 임팩트)

| 영향 대상 | 변경 유형 | 상세 |
|----------|----------|------|
| `amb_users` 테이블 | ALTER TABLE | 마케팅 동의 컬럼 추가 |
| `apps/api/src/domain/` | 신규 모듈 | `consent/`, `dsr/`, `breach/` 3개 NestJS 모듈 |
| `apps/web/src/domain/` | 신규 페이지 | 쿠키 설정, DSR 요청, 내 데이터 관리 |
| `apps/portal-web/src/` | 컴포넌트 추가 | 쿠키 배너, 개인정보 처리방침 페이지 |
| `docker/*/nginx.conf` | 새 라우트 | `/privacy`, `/cookie-policy` 정적 페이지 |
| i18n | 신규 네임스페이스 | `privacy`, `consent` 3개 언어 번역 파일 |
| 이메일 템플릿 | 신규 | DSR 접수 확인, 처리 완료, 침해 통보 |
| 기존 Cron | 충돌 확인 | billing-automation, mail-sync와 시간대 겹침 없도록 배치 |

---

## 5. 사용자 플로우

### 5.1 쿠키 동의 플로우

```
[EU 사용자 첫 방문]
  → 쿠키 배너 표시 (하단 고정)
     ┌─────────────────────────────────────────┐
     │ 🍪 쿠키 설정                              │
     │ 이 웹사이트는 서비스 개선을 위해 쿠키를     │
     │ 사용합니다.                               │
     │                                          │
     │ [모두 수락] [필수만 수락] [설정 관리]       │
     └─────────────────────────────────────────┘

  → [설정 관리] 클릭 시 상세 패널:
     ┌─────────────────────────────────────────┐
     │ ✅ 필수 쿠키 (항상 활성)                   │
     │ ☐ 분석 쿠키                              │
     │ ☐ 기능 쿠키                              │
     │ ☐ 마케팅 쿠키                            │
     │                                          │
     │ [선택 항목 저장]                            │
     └─────────────────────────────────────────┘

  → 동의 결과 저장:
     1. localStorage: 'amb-cookie-consent' = { analytics: true, functional: false, ... }
     2. API 호출: POST /api/v1/consent/accept
     3. amb_consent_records 기록
```

### 5.2 DSR(데이터 주체 권리) 요청 플로우

```
[사용자: 내 설정 → 개인정보 관리]

  ┌──────────────────────────────────────┐
  │ 📋 내 개인정보 관리                     │
  │                                       │
  │ [내 데이터 조회]    → /my-data/profile  │
  │ [데이터 내보내기]   → /my-data/export   │
  │ [처리 제한 요청]    → /my-data/restrict │
  │ [계정 삭제 요청]    → /my-data/deletion │
  │                                       │
  │ 동의 관리                              │
  │ [쿠키 설정 변경]    → /consent/cookies  │
  │ [마케팅 수신 설정]  → on/off 토글       │
  └──────────────────────────────────────┘

[데이터 내보내기 플로우]
  사용자: [데이터 내보내기] 클릭
    → 비밀번호 재확인
    → 내보내기 범위 선택 (전체 / 카테고리별)
    → 형식 선택 (JSON / CSV)
    → 요청 등록 → dsr_status = 'PROCESSING'
    → 백그라운드 작업 → ZIP 파일 생성
    → 완료 시 알림 → 다운로드 링크 (7일간 유효)

[계정 삭제 요청 플로우]
  사용자: [계정 삭제 요청] 클릭
    → 삭제 영향 안내 (삭제될 데이터 목록)
    → 비밀번호 재확인
    → 삭제 사유 선택 (선택사항)
    → 요청 등록 → dsr_status = 'PENDING'
    → 관리자 알림 → 검토/승인/거부
    → 승인 시: 익명화 처리 + 30일 유예 기간
    → 유예 기간 내 철회 가능
```

---

## 6. 기술적 고려사항

### 6.1 백엔드 모듈 구조

```
apps/api/src/domain/
├── consent/                     # 동의 관리 모듈 (신규)
│   ├── consent.module.ts
│   ├── controller/
│   │   ├── consent.controller.ts
│   │   └── consent-admin.controller.ts
│   ├── service/
│   │   └── consent.service.ts
│   ├── entity/
│   │   ├── consent-record.entity.ts
│   │   └── consent-policy.entity.ts
│   └── dto/
│       ├── accept-consent.dto.ts
│       └── consent-policy.dto.ts
│
├── dsr/                          # 데이터 주체 권리 모듈 (신규)
│   ├── dsr.module.ts
│   ├── controller/
│   │   ├── dsr.controller.ts
│   │   └── dsr-admin.controller.ts
│   ├── service/
│   │   ├── dsr.service.ts
│   │   └── data-export.service.ts
│   └── entity/
│       └── dsr-request.entity.ts
│
├── breach/                       # 침해 통보 모듈 (신규)
│   ├── breach.module.ts
│   ├── controller/
│   │   └── breach-admin.controller.ts
│   ├── service/
│   │   ├── breach-detection.service.ts
│   │   └── breach-notification.service.ts
│   └── entity/
│       └── breach-incident.entity.ts
```

### 6.2 프론트엔드 구조

```
apps/web/src/domain/
├── privacy/                      # 개인정보 관리 도메인 (신규)
│   ├── pages/
│   │   ├── MyDataPage.tsx        # 내 데이터 관리 (DSR 요청)
│   │   └── PrivacyPolicyPage.tsx # 개인정보 처리방침 콘텐츠
│   └── components/
│       ├── CookieConsentBanner.tsx
│       ├── CookieSettingsModal.tsx
│       └── DsrRequestForm.tsx
│
apps/portal-web/src/
├── components/
│   ├── CookieConsentBanner.tsx   # 포털용 쿠키 배너
│   └── PrivacyPolicyPage.tsx     # 포털용 처리방침
```

### 6.3 i18n 네임스페이스 추가

| 네임스페이스 | 용도 |
|-------------|------|
| `privacy` | 개인정보 처리방침, DSR 요청 관련 UI 텍스트 |
| `consent` | 쿠키 동의 배너, 동의 관리 UI 텍스트 |

### 6.4 스테이징/프로덕션 DB 마이그레이션

> ⚠️ TypeORM synchronize는 staging/production에서 비활성이므로 수동 SQL 필수

```sql
-- Phase 1: 동의 기록 테이블
CREATE TABLE amb_consent_records (...);
CREATE TABLE amb_consent_policies (...);

-- Phase 1: DSR 요청 테이블
CREATE TABLE amb_dsr_requests (...);

-- Phase 2: 침해 사건 테이블
CREATE TABLE amb_breach_incidents (...);

-- Phase 1: 마케팅 동의 컬럼
ALTER TABLE amb_users ADD COLUMN usr_marketing_email_consent BOOLEAN DEFAULT false;
ALTER TABLE amb_users ADD COLUMN usr_marketing_consent_at TIMESTAMP;
```

### 6.5 외부 의존성

| 라이브러리 | 용도 | 비고 |
|-----------|------|------|
| 없음 (자체 구현) | 쿠키 동의 배너 | CMP SaaS 비용 절감, 커스텀 UI 통일 |
| `archiver` | 데이터 내보내기 ZIP 생성 | 이미 package.json에 있는지 확인 필요 |
| 없음 | 이상 감지 | 기존 감사 로그 + Cron 분석으로 구현 |

### 6.6 보안 고려사항

| 항목 | 대응 방안 |
|------|----------|
| DSR API Rate Limiting | 데이터 내보내기: 1회/일, 삭제 요청: 1회/주 |
| 비밀번호 재확인 | 내보내기/삭제 요청 전 비밀번호 입력 필수 |
| 내보내기 파일 암호화 | ZIP에 사용자 설정 비밀번호 또는 다운로드 링크 OTP |
| IP 익명화 | IPv4: 마지막 옥텟 0 처리, IPv6: 마지막 80비트 제거 |
| GDPR Art. 30 RoPA | 처리활동기록부는 문서 기반 관리 (기술 구현 불필요) |

---

## 문서 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0 | 2026-03-23 | AI 분석 | 최초 작성 — GDPR/CCPA 개인정보보호 요구사항 분석 |
