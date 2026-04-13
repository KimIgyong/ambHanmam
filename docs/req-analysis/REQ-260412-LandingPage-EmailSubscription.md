# REQ-260412 — Landing Page Email Subscription (이메일 구독 기능)

## 1. 요구사항 요약 / Requirements Summary

| 항목 | 내용 |
|------|------|
| **요청** | www.amoeba.site 랜딩페이지에 이메일 구독(Newsletter Subscription) 기능 추가 |
| **목적** | 무료체험/가입을 하지 않고 이탈하는 방문자의 이메일을 수집하여 리드(Lead) 확보 및 향후 마케팅 활용 |
| **대상** | www.amoeba.site 방문자 (비회원) |
| **범위** | portal-web 프론트엔드 + apps/api 백엔드 (기존 CMS Subscriber 인프라 활용) |

---

## 2. AS-IS 현황 분석

### 2.1 Frontend — LandingPage CTA 섹션

**파일**: `apps/portal-web/src/pages/public/LandingPage.tsx` (L882-920)

현재 하단 CTA 섹션에는 2개 버튼만 존재:
- **"무료 시작"** → `/register` 라우트 이동
- **"도입 상담 문의"** → `mailto:contact@amoeba.group`

이메일 구독 폼, 뉴스레터 입력 필드: **없음**

### 2.2 Backend — CMS Subscriber 인프라 (이미 구현됨)

**메인 API (`apps/api`)에 CMS Subscriber 시스템이 완전히 구현**되어 있음:

| 구성 요소 | 파일 | 상태 |
|-----------|------|------|
| Entity | `apps/api/src/domain/site-management/entity/cms-subscriber.entity.ts` | ✅ 완료 |
| Service | `apps/api/src/domain/site-management/service/cms-subscriber.service.ts` | ✅ 완료 |
| Controller (Admin) | `apps/api/src/domain/site-management/controller/cms-subscriber.controller.ts` | ✅ 완료 |
| Controller (Public) | `apps/api/src/domain/site-management/controller/cms-public.controller.ts` | ✅ 완료 |
| DTO | `apps/api/src/domain/site-management/dto/request/subscribe.request.ts` | ✅ 완료 |
| Mapper | `apps/api/src/domain/site-management/mapper/cms-subscriber.mapper.ts` | ✅ 완료 |
| Module | `apps/api/src/domain/site-management/site-management.module.ts` | ✅ 등록됨 |
| Error Codes | `E27050` (already subscribed), `E27051` (not found) | ✅ 정의됨 |

#### CmsSubscriberEntity 스키마

```
테이블: amb_cms_subscribers
┌───────────────────────┬──────────────┬─────────────────────────────┐
│ 컬럼                  │ 타입         │ 설명                        │
├───────────────────────┼──────────────┼─────────────────────────────┤
│ csb_id (PK)           │ UUID         │ 구독자 ID                   │
│ cmp_id (FK)           │ UUID         │ CMS Page ID (구독 대상 페이지) │
│ csb_email             │ VARCHAR(255) │ 구독 이메일                 │
│ csb_name              │ VARCHAR(200) │ 구독자 이름 (선택)          │
│ csb_is_verified       │ BOOLEAN      │ 이메일 인증 여부            │
│ csb_subscribed_at     │ TIMESTAMPTZ  │ 구독일시                    │
│ csb_unsubscribed_at   │ TIMESTAMPTZ  │ 구독 취소일시 (NULL=활성)   │
└───────────────────────┴──────────────┴─────────────────────────────┘
UNIQUE: (cmp_id, csb_email)
```

#### 기존 Public API 엔드포인트

```
POST /api/v1/cms/public/pages/:slug/subscribe
Body: { email: string, name?: string }
Response: { success: true, data: { ... } }
```

- **제약**: `cmp_id` (CMS Page ID) 기반으로 구독자를 저장함 → 랜딩페이지에 대응하는 CMS Page가 필요

### 2.3 Frontend — CMS API 클라이언트

**파일**: `apps/portal-web/src/lib/cms-api.ts`

현재 구독 관련 API 호출 함수: **없음**

### 2.4 i18n

구독 관련 번역 키: **없음** (ko/en/vi 모두)

### 2.5 SMTP 인프라

- Gmail SMTP (`smtp.gmail.com:587`) 시스템 발송 기반 존재
- Portal-api에 `PortalMailService` 구현 (인증코드, 환영메일)
- 구독 확인/뉴스레터 발송 기능: **미구현**

---

## 3. TO-BE 요구사항

### 3.1 사용자 스토리

> *"www.amoeba.site를 방문했지만 바로 가입하기엔 아직 이른 방문자가, 이메일만 입력하여 제품 소식/업데이트를 받을 수 있다."*

### 3.2 기능 명세

#### F1. 랜딩페이지 이메일 구독 폼

| 항목 | 내용 |
|------|------|
| 위치 | LandingPage 하단 CTA 섹션 내, 기존 버튼 아래에 배치 |
| UI | 이메일 입력 필드 + "Subscribe" 버튼 (인라인 형태) |
| 필드 | Email (필수), Name (선택, 향후 확장) |
| 유효성 | 프론트엔드 이메일 포맷 검증 |
| 피드백 | 성공: 감사 메시지 표시 / 중복: 이미 구독 안내 / 에러: 재시도 안내 |
| i18n | KO, EN, VI 3개 언어 지원 |

#### F2. 구독 API 연동

| 항목 | 내용 |
|------|------|
| API | `POST /api/v1/cms/public/pages/:slug/subscribe` (기존 API 재사용) |
| 호출 소스 | portal-web → apps/api (메인 백엔드) |
| 필요 조건 | 랜딩페이지용 CMS Page 생성 (`slug: landing`) |

#### F3. 관리자 구독자 확인

| 항목 | 내용 |
|------|------|
| API | `GET /api/v1/cms/pages/:pageId/subscribers` (기존 Admin API) |
| CSV Export | `GET /api/v1/cms/pages/:pageId/subscribers/export` (기존 API) |
| 기능 | AMA 관리자 화면에서 구독자 목록 조회, 검색, CSV 내보내기 |

### 3.3 구현 방안 비교

#### 방안 A: 기존 CMS Subscriber API 활용 (권장)

```
[portal-web] ─→ [apps/api] POST /cms/public/pages/landing/subscribe
                    └→ amb_cms_subscribers 테이블에 저장
```

**장점**:
- 백엔드 코드 변경 최소화 (기존 API 그대로 사용)
- 구독자 관리 (조회/검색/CSV) 이미 구현됨
- 중복 방지 로직 이미 존재 (email + page UNIQUE)

**단점**:
- 랜딩페이지에 대응하는 CMS Page 레코드 필요 (DB에 1개 INSERT)
- portal-web에서 apps/api로 직접 호출 (CORS 설정 필요 여부 확인)

#### 방안 B: portal-api에 독립 구독 API 신규 개발

**장점**: portal-web → portal-api 한 서비스 내 호출
**단점**: 중복 구현 (Entity, Service, Controller 전부 새로 작성), 기존 CMS 시스템과 분리됨

**결론**: **방안 A 채택** — 기존 인프라 최대 활용, 개발 공수 최소화

---

## 4. 갭 분석 (AS-IS → TO-BE)

| # | 갭 | AS-IS | TO-BE | 작업량 |
|---|---|-------|-------|--------|
| G1 | 구독 UI | 없음 | LandingPage CTA 섹션에 이메일 입력 폼 | 프론트엔드 컴포넌트 추가 |
| G2 | i18n 키 | 없음 | subscribe 관련 번역 키 (ko/en/vi) | 번역 파일 추가 |
| G3 | CMS Page 레코드 | 없음 | slug=`landing` CMS Page 1건 | DB INSERT (수동 SQL) |
| G4 | API 호출 함수 | 없음 | `cmsApi.subscribe(slug, email)` | cms-api.ts에 함수 추가 |
| G5 | CORS | portal-web → apps/api 직접 호출 시 확인 필요 | 동일 도메인(ama.amoeba.site) 사용 가능 | 설정 확인/조정 |
| G6 | GA4 이벤트 | 없음 | `newsletter_subscribe` 이벤트 | ga-events.ts에 추가 |

### CORS 분석 (G5 상세)

portal-web: `www.amoeba.site` → apps/api: `ama.amoeba.site/api/v1/cms/public/...`

- apps/api의 CORS 설정이 `www.amoeba.site`를 허용하는지 확인 필요
- 대안: portal-api를 프록시로 사용하여 portal-web → portal-api → apps/api 중계

---

## 5. 사용자 플로우

### 5.1 이메일 구독 플로우

```
방문자가 www.amoeba.site 랜딩페이지 방문
  ↓
스크롤 → 하단 CTA 섹션 도달
  ↓
"무료 시작" 또는 "도입 상담" 아래에 구독 폼 발견
  ↓
이메일 입력 → "Subscribe" 클릭
  ↓
[프론트엔드] 이메일 포맷 검증
  ↓ (통과)
[API] POST /cms/public/pages/landing/subscribe { email }
  ├─ 성공 (201) → "구독해주셔서 감사합니다!" 메시지
  ├─ 중복 (409) → "이미 구독 중인 이메일입니다" 메시지
  └─ 에러 (4xx/5xx) → "잠시 후 다시 시도해주세요" 메시지
```

### 5.2 UI 와이어프레임 (텍스트)

```
┌─────────────────────────────────────────────────┐
│                CTA SECTION                       │
│                                                  │
│        지금 바로 시작하세요                       │
│   무료 체험, 신용카드 불필요. 팀과 함께...       │
│                                                  │
│   [ ➜ 무료 시작 ]   [ 도입 상담 문의 ]          │
│                                                  │
│   ─────────── or ───────────                    │
│                                                  │
│   📬 제품 소식을 받아보세요                      │
│   ┌───────────────────────┬──────────────┐       │
│   │ your@email.com        │  Subscribe   │       │
│   └───────────────────────┴──────────────┘       │
│                                                  │
│   📧 contact@amoeba.group · 🌐 a.amoeba.site    │
└─────────────────────────────────────────────────┘
```

### 5.3 상태 전이

```
[IDLE] ─────── 이메일 입력 중 ──────→ [TYPING]
  ↑                                       │
  │                                  Subscribe 클릭
  │                                       ↓
  │                                   [LOADING]
  │                                    ├─ 성공 → [SUCCESS] "감사합니다 ✓"
  │                                    ├─ 중복 → [DUPLICATE] "이미 구독 중"
  │                                    └─ 에러 → [ERROR] "재시도해주세요"
  │                                       │
  └───────── 3초 후 자동 리셋 ←───────────┘
```

---

## 6. 기술 제약사항

### 6.1 CORS (Cross-Origin)

| From | To | 상태 |
|------|----|------|
| `www.amoeba.site` (portal-web) | `ama.amoeba.site/api/v1` (apps/api) | **확인 필요** |

- portal-web은 현재 portal-api (`www.amoeba.site/api/v1/portal/*`)만 호출
- apps/api의 CMS Public API (`/api/v1/cms/public/*`)를 직접 호출하려면 CORS에 `www.amoeba.site` 추가 필요
- **대안**: portal-api에 프록시 엔드포인트 추가 → CORS 이슈 회피

### 6.2 CMS Page 의존성

기존 CMS Subscriber API는 `cmp_id` (CMS Page ID) 기반:
- 랜딩페이지에 대응하는 CMS Page 레코드가 DB에 필요
- 프로덕션 DB에 수동 SQL로 INSERT 필요

### 6.3 Rate Limiting

공개 API이므로 스팸 방지 필요:
- 기존 API에 Rate Limit 미적용 상태
- 추천: IP 기반 throttle (10req/min) 또는 간단한 honeypot 필드

### 6.4 Email 유효성

- 프론트엔드: HTML5 `type="email"` + 정규식 검증
- 백엔드: `class-validator @IsEmail()` (이미 DTO에 적용됨)
- Double opt-in: v1에서는 미적용 (향후 확장 가능, `csb_is_verified` 필드 존재)

### 6.5 GDPR / 개인정보

- 이메일 수집 시 개인정보 처리 동의 문구 표시 권장
- 구독 취소(Unsubscribe) 메커니즘 필요 (향후)
- 현 단계: 간단한 고지 문구 + 이메일 수집만 진행

### 6.6 프로덕션 DB 현황

- `amb_cms_subscribers` 테이블이 프로덕션에 존재하는지 확인 필요
- TypeORM `synchronize: true`면 자동 생성, `false`면 수동 DDL 필요
- `amb_cms_pages` 테이블에 landing slug의 Page 레코드 INSERT 필요

---

## 7. 구현 범위 및 우선순위

### Phase 1 (MVP — 즉시 구현 가능)

| # | 작업 | 설명 |
|---|------|------|
| 1 | CORS/프록시 확인 | portal-web → apps/api 호출 가능 여부 확인 |
| 2 | DB 준비 | `amb_cms_pages`에 landing slug 레코드 INSERT |
| 3 | 프론트엔드 구독 폼 | LandingPage CTA에 이메일 입력 UI 추가 |
| 4 | API 연동 | cms-api.ts에 subscribe 함수 추가 |
| 5 | i18n | 구독 관련 번역 키 추가 (ko/en/vi) |
| 6 | GA4 이벤트 | `newsletter_subscribe` 이벤트 추적 |

### Phase 2 (향후 확장)

| # | 작업 | 설명 |
|---|------|------|
| 1 | Double opt-in | 구독 확인 이메일 발송 → `csb_is_verified` 업데이트 |
| 2 | 뉴스레터 발송 | 구독자 대상 정기 뉴스레터 발송 기능 |
| 3 | 구독 관리 페이지 | AMA Admin에서 구독자 관리 UI |
| 4 | Unsubscribe | 이메일 내 구독 취소 링크 |
| 5 | Rate Limiting | 스팸 방지 throttle 적용 |

---

## 8. 추정 변경 파일

### 신규 생성
| 파일 | 설명 |
|------|------|
| (없음 — 기존 파일 수정만으로 충분) | |

### 수정
| 파일 | 설명 |
|------|------|
| `apps/portal-web/src/pages/public/LandingPage.tsx` | 구독 폼 UI 추가 |
| `apps/portal-web/src/lib/cms-api.ts` | subscribe API 호출 함수 추가 |
| `apps/portal-web/src/lib/ga-events.ts` | GA4 이벤트 함수 추가 |
| `apps/portal-web/src/locales/ko/common.json` | 한국어 번역 키 |
| `apps/portal-web/src/locales/en/common.json` | 영어 번역 키 |
| `apps/portal-web/src/locales/vi/common.json` | 베트남어 번역 키 |

### DB (수동 SQL)
| 작업 | 설명 |
|------|------|
| `amb_cms_subscribers` DDL | 테이블 미존재 시 CREATE TABLE |
| `amb_cms_pages` INSERT | slug='landing' 레코드 1건 |

---

## 9. 결론 및 권장사항

1. **기존 CMS Subscriber 인프라를 최대한 활용** — 백엔드 신규 개발 최소화
2. **Phase 1 (MVP)만 먼저 구현** — 이메일 수집만 진행, Double opt-in / 뉴스레터 발송은 향후 확장
3. **CORS 또는 프록시 방식 결정이 선행 필요** — portal-web에서 apps/api를 직접 호출할지, portal-api 프록시를 둘지 확인
4. **프로덕션 DB에 CMS 테이블 존재 여부 확인 선행** — DDL 필요 시 수동 실행
