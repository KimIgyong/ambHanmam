# ambKMS × Amoeba Talk 연동 제안서

> **작성일**: 2026-02-25  
> **버전**: v1.0  
> **API 문서 기준**: https://api-talk.amoeba.site/api/docs-json (OpenAPI 3.0)

---

## 1. Amoeba Talk API 분석 요약

### 1.1 시스템 개요

Amoeba Talk은 **옴니채널 고객 소통 플랫폼**으로, 다음 핵심 기능을 제공한다:

| 모듈 | 설명 | 주요 엔드포인트 | 비고 |
|------|------|----------------|------|
| **Authentication** | JWT 기반 인증 (signin → select-company → token) | `/api/auth/*` | 2-Step 인증 |
| **Social** | 소셜 플랫폼 연동 (Facebook, Zalo, Line, KakaoTalk, Gmail) | `/api/social/*` | OAuth 방식 |
| **Inbox** | 옴니채널 대화 통합 관리 | `/api/inbox/*` | 필터/검색/페이지네이션 |
| **Chat Widget** | 웹사이트 임베드 채팅 위젯 | `/api/widget/*` | API Key 인증 |
| **Lobby** | 내부 팀 채팅 (채널/DM) | `/api/lobby/*` | 실시간 메시징 |
| **Notifications** | 알림/웹 푸시 | `/api/notifications/*` | in-app + push |
| **Team** | 팀 멤버 관리/초대 | `/api/team/*` | OWNER/ADMIN/MEMBER |
| **Companies** | 회사(워크스페이스) 관리 | `/api/companies/*` | 멀티 테넌시 |
| **Store** | 이커머스 연동 (Shopify, Odoo, WooCommerce) | `/api/store/*` | 주문/고객 조회 |
| **Bound Chat** | 대화 그룹핑 (타임라인/프로젝트) | `/api/bound-chat/*` | 고객 여정 분석 |
| **Customer Matching** | 채팅 고객 ↔ 매장 고객 매칭 | `/api/customer-matches/*` | 크로스 플랫폼 |
| **Storage** | S3 파일 관리 (presigned URL) | `/api/storage/*` | 업/다운로드 |
| **Platform Errors** | 플랫폼 에러 모니터링 | `/api/platform-errors/*` | 알림/해제 |

### 1.2 인증 흐름

```
┌─────────┐    ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  로그인   │───▶│  signin      │───▶│  select-company  │───▶│  Bearer JWT  │
│          │    │  (temp_token)│    │  (access_token)  │    │  API 호출     │
└─────────┘    └──────────────┘    └──────────────────┘    └──────────────┘
                                                                 │
                                   ┌──────────────────┐          │ 만료 시
                                   │  refresh          │◀─────────┘
                                   │  (new tokens)     │
                                   └──────────────────┘
```

**인증 단계:**

1. **POST `/api/auth/signin`** — email + password → `temp_token` + `companies[]` 반환
2. **POST `/api/auth/select-company`** — company_id 선택 → `access_token` + `refresh_token` 반환
3. 이후 모든 API는 `Authorization: Bearer {access_token}` 헤더 사용
4. 토큰 만료 시 **POST `/api/auth/refresh`** — `refresh_token` → 새 토큰 쌍 반환

### 1.3 역할 체계

| 역할 | 설명 | Talk 내 권한 |
|------|------|-------------|
| OWNER | 회사 소유자 | 모든 권한 |
| ADMIN | 관리자 | 설정/멤버 관리 |
| MEMBER | 일반 멤버 | 대화 참여/조회 |

---

## 2. 연동 시나리오 및 활용 방안

### 2.1 시나리오 개요

ambKMS 사용 회사가 Amoeba Talk을 연동하면, **고객 소통 데이터**가 KMS 지식 자산과 통합되어
다음 가치를 제공할 수 있다:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ambKMS × Amoeba Talk 통합 가치                    │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│  고객 소통 지식화  │  AI 에이전트 강화  │  업무 자동화 확장                  │
├─────────────────┼─────────────────┼─────────────────────────────────┤
│ 고객 대화 내용을   │ AI 에이전트가     │ 고객 문의 → 할일 자동  생성         │
│ KMS 태그/지식     │ 고객 대화 이력까지 │ 주문 정보 → 청구 연동              │
│ 그래프에 자동 연결  │ 참조하여 응답     │ 고객 여정 → 프로젝트 보고서          │
└─────────────────┴─────────────────┴─────────────────────────────────┘
```

### 2.2 핵심 연동 시나리오 5가지

#### 시나리오 1: 고객 대화 → KMS 지식 자산화

**목적**: 고객 문의/응대 대화를 분석하여 KMS 태그로 분류하고, 지식베이스에 축적

| 단계 | ambKMS | Amoeba Talk API | 설명 |
|------|--------|-----------------|------|
| ① | 대화 목록 조회 | `GET /api/inbox/conversations` | 최근 대화 목록 가져오기 |
| ② | 대화 내용 조회 | `GET /api/inbox/conversations/{id}/messages` | 메시지 전문 조회 |
| ③ | AI 태그 추출 | KMS `auto-tagging.service` | 대화 내용에서 태그 자동 추출 |
| ④ | WorkItem 생성 | KMS `work-item` + 태그 할당 | 고객 문의를 지식 아이템으로 등록 |
| ⑤ | 지식 그래프 연결 | KMS `knowledge-graph` | 유사 문의/답변 네트워크 구축 |

**활용 API:**
```
GET  /api/inbox/conversations?social_type=zalo&filter_dropdown=all&page=1&limit=20
GET  /api/inbox/conversations/{id}/messages?page=1&limit=50
GET  /api/inbox/conversations/{id}/customer
```

#### 시나리오 2: 내부 팀 채팅(Lobby) ↔ KMS 연동

**목적**: 내부 팀 소통 내용을 KMS 태그/프로젝트와 연결하여 업무 맥락 보존

| 단계 | ambKMS | Amoeba Talk API | 설명 |
|------|--------|-----------------|------|
| ① | 채널 목록 조회 | `GET /api/lobby/channels` | 프로젝트별 채널 조회 |
| ② | 채널 생성 | `POST /api/lobby/channels` | ambKMS 프로젝트별 자동 채널 생성 |
| ③ | 메시지 조회 | `GET /api/lobby/channels/{id}/messages` | 채널 대화 내용 동기화 |
| ④ | 메시지 전송 | `POST /api/lobby/channels/{id}/messages` | ambKMS에서 직접 메시지 전송 |
| ⑤ | AI 태깅 | KMS `content-analyzer` | 대화 내용 분석 및 지식 연결 |

#### 시나리오 3: 웹사이트 채팅 위젯 설정 연동

**목적**: ambKMS 설정에서 Chat Widget을 관리하여 고객 접점 통합

| 단계 | ambKMS | Amoeba Talk API | 설명 |
|------|--------|-----------------|------|
| ① | 위젯 설정 조회 | `GET /api/widget/config` | 현재 위젯 설정 확인 |
| ② | 위젯 설정 변경 | `POST /api/widget/config` | 색상/메시지/도메인 등 설정 |
| ③ | API Key 재발급 | `POST /api/widget/config/regenerate-key` | 보안 키 갱신 |
| ④ | 임베드 코드 배포 | 위젯 `embed_script` 활용 | 고객 웹사이트에 채팅 위젯 설치 |

#### 시나리오 4: 소셜 플랫폼 연결 관리

**목적**: ambKMS 설정 화면에서 소셜 플랫폼(Facebook, Zalo, Line 등) 연결 상태를 통합 관리

| 단계 | ambKMS | Amoeba Talk API | 설명 |
|------|--------|-----------------|------|
| ① | 연결 상태 조회 | `GET /api/social/list` | 현재 연결된 소셜 플랫폼 목록 |
| ② | 새 플랫폼 연결 | `POST /api/social/session/init` | OAuth 흐름 시작 |
| ③ | 연결 상태 폴링 | `GET /api/social/session/{id}` | OAuth 완료 확인 |
| ④ | 계정 선택 | `POST /api/social/session/accounts/{id}` | 연결할 계정/페이지 선택 |
| ⑤ | 연결 해제 | `DELETE /api/social/{id}` | 소셜 연결 해제 |

#### 시나리오 5: 이커머스 연동 + 고객 여정 분석

**목적**: Shopify/Odoo 주문 데이터와 대화 이력을 결합하여 고객 360° 뷰 제공

| 단계 | ambKMS | Amoeba Talk API | 설명 |
|------|--------|-----------------|------|
| ① | 스토어 연결 | `POST /api/store/connect` 또는 `/connect/direct` | Shopify/Odoo 연동 |
| ② | 고객 매칭 | `POST /api/customer-matches` | 채팅 고객 ↔ 스토어 고객 연결 |
| ③ | 주문 이력 조회 | `GET /api/customer-matches/{id}/orders` | 매칭된 고객의 주문 내역 |
| ④ | 대화 그룹핑 | `POST /api/bound-chat` | 관련 대화를 프로젝트로 묶기 |
| ⑤ | 고객 여정 분석 | `GET /api/bound-chat/{id}/customer-journey` | 종합 분석 데이터 |

---

## 3. 기술 연동 방식 제안

### 3.1 인증 연동 아키텍처

ambKMS 회사가 Amoeba Talk을 사용하기 위한 **3가지 인증 연동 방식**을 제안한다:

#### 방식 A: 서비스 계정 방식 (권장)

```
┌──────────────┐                    ┌──────────────────┐
│  ambKMS API  │                    │  Amoeba Talk API │
│  (NestJS)    │                    │                  │
│              │  ① signin          │                  │
│  Talk연동     │───────────────────▶│  /api/auth/signin│
│  Service     │◀───────────────────│  (temp_token)    │
│              │                    │                  │
│              │  ② select-company  │                  │
│              │───────────────────▶│  /api/auth/       │
│              │◀───────────────────│  select-company  │
│              │  (access_token)    │  (JWT pair)      │
│              │                    │                  │
│              │  ③ API 호출         │                  │
│              │───────────────────▶│  Bearer JWT      │
│              │◀───────────────────│  API 응답         │
└──────────────┘                    └──────────────────┘
```

**구현 방법:**
1. Amoeba Talk에 **서비스 계정** 생성 (예: `kms-integration@company.com`)
2. ambKMS 백엔드 설정에 Talk 인증 정보 등록 (AES-256 암호화 저장)
3. ambKMS 서버가 Talk API를 **서버-투-서버** 방식으로 호출
4. 토큰 자동 갱신 로직 구현 (`refresh_token` 활용)

**장점:** 프론트엔드 변경 최소화, 보안 우수 (API키가 서버에만 존재)

#### 방식 B: SSO(Single Sign-On) 연동

```
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│  사용자    │───▶│  ambKMS      │───▶│  Amoeba Talk    │
│  (브라우저) │    │  (로그인 됨)  │    │  (자동 로그인)   │
│           │    │              │    │                  │
│           │    │  JWT 교환     │───▶│  SSO 검증        │
└──────────┘    └──────────────┘    └──────────────────┘
```

**전제 조건:** Amoeba Talk 측에 SSO endpoint 추가 개발 필요 (현재 API 미지원)

#### 방식 C: 사용자별 개별 인증

```
┌──────────────┐    ┌──────────────────┐
│  ambKMS Web  │    │  Amoeba Talk API │
│  (프론트엔드) │    │                  │
│              │    │                  │
│  Talk 로그인  │───▶│  /api/auth/signin│
│  UI (모달)   │◀───│  (회사 선택)      │
│              │    │                  │
│  토큰 저장    │───▶│  Bearer JWT      │
│  (zustand)   │◀───│  API 응답         │
└──────────────┘    └──────────────────┘
```

**장점:** 사용자별 권한 분리
**단점:** UX 복잡 (별도 로그인 필요)

### 3.2 권장 방식: 서비스 계정 + 프록시 패턴

**1단계 (MVP)**: 서비스 계정 방식으로 서버 간 연동
**2단계**: 사용자 매핑 테이블로 개인별 Talk 계정 연결
**3단계**: SSO 연동 (Amoeba Talk 협의 필요)

```
┌─────────────────────────────────────────────────────────┐
│                    ambKMS Backend                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  TalkIntegrationModule                           │   │
│  │  ┌─────────────────┐  ┌───────────────────────┐  │   │
│  │  │ TalkAuthService  │  │ TalkProxyService      │  │   │
│  │  │                  │  │                        │  │   │
│  │  │ - signin()       │  │ - getConversations()   │  │   │
│  │  │ - selectCompany()│  │ - getMessages()        │  │   │
│  │  │ - refreshToken() │  │ - sendMessage()        │  │   │
│  │  │ - tokenCache     │  │ - getSocialConnections()│  │  │
│  │  └─────────────────┘  │ - getChannels()         │  │   │
│  │                        │ - getLobbyMessages()    │  │   │
│  │  ┌─────────────────┐  └───────────────────────┘  │   │
│  │  │ TalkSyncService  │                             │   │
│  │  │                  │  ┌───────────────────────┐  │   │
│  │  │ - syncConversati │  │ TalkController        │  │   │
│  │  │   onsToKms()     │  │ (ambKMS 프론트엔드용)  │  │   │
│  │  │ - tagConversatio │  │                        │  │   │
│  │  │   nContent()     │  │ GET /api/v1/talk/*     │  │   │
│  │  └─────────────────┘  └───────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                              ▲
         │ HTTP (server-to-server)      │ HTTP (browser)
         ▼                              │
┌─────────────────────┐     ┌───────────┴───────────┐
│  Amoeba Talk API    │     │  ambKMS Frontend      │
│  api-talk.amoeba.   │     │  (React)              │
│  site               │     │                       │
└─────────────────────┘     └───────────────────────┘
```

---

## 4. 단계별 구현 로드맵

### Phase 1: 기반 연동 (2주)

| 작업 | 설명 | 파일/위치 |
|------|------|----------|
| Talk 인증 서비스 | Talk signin → select-company → 토큰 관리 | `apps/api/src/domain/talk/service/talk-auth.service.ts` |
| Talk HTTP 클라이언트 | Axios 기반 Talk API 호출 래퍼 | `apps/api/src/domain/talk/service/talk-http.service.ts` |
| Talk 설정 엔티티 | DB에 Talk 인증 정보 저장 (AES-256 암호화) | `apps/api/src/domain/talk/entity/talk-setting.entity.ts` |
| Talk 모듈 등록 | NestJS 모듈 구성 | `apps/api/src/domain/talk/talk.module.ts` |
| Talk 설정 UI | 관리자 설정 > Talk 연동 탭 | `apps/web/src/domain/settings/components/TalkSettingsTab.tsx` |

**DB 테이블 설계:**

```sql
CREATE TABLE amb_talk_settings (
    tks_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tks_entity_id  UUID NOT NULL REFERENCES amb_entities(ent_id),
    tks_api_url    VARCHAR(500) NOT NULL DEFAULT 'https://api-talk.amoeba.site',
    tks_email      VARCHAR(255) NOT NULL,           -- 서비스 계정 이메일
    tks_password   TEXT NOT NULL,                    -- AES-256 암호화
    tks_company_id VARCHAR(100),                     -- Talk 회사 ID
    tks_company_name VARCHAR(255),                   -- Talk 회사 이름
    tks_is_active  BOOLEAN NOT NULL DEFAULT true,
    tks_last_synced_at TIMESTAMPTZ,
    tks_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tks_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tks_deleted_at TIMESTAMPTZ
);

-- Talk 사용자 매핑 (Phase 2)
CREATE TABLE amb_talk_user_mappings (
    tum_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tum_entity_id     UUID NOT NULL REFERENCES amb_entities(ent_id),
    tum_user_id       UUID NOT NULL REFERENCES amb_users(usr_id),
    tum_talk_user_id  INTEGER NOT NULL,              -- Talk 사용자 ID
    tum_talk_email    VARCHAR(255),
    tum_talk_role     VARCHAR(20),                   -- OWNER/ADMIN/MEMBER
    tum_created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Phase 2: Inbox/대화 연동 (2주)

| 작업 | 설명 | 활용 Talk API |
|------|------|--------------|
| 대화 목록 프록시 | Talk 대화 목록을 ambKMS 화면에 표시 | `GET /api/inbox/conversations` |
| 대화 상세/메시지 | 대화 메시지 조회 및 실시간 뷰 | `GET /api/inbox/conversations/{id}/messages` |
| 메시지 전송 | ambKMS에서 직접 고객 응대 메시지 전송 | `POST /api/inbox/conversations/{id}/messages` |
| 고객 정보 조회 | 대화 상대 고객 정보 표시 | `GET /api/inbox/conversations/{id}/customer` |
| 읽음 상태 관리 | 대화 읽음/안읽음 상태 동기화 | `PATCH /api/inbox/conversations/{id}/read-status` |

### Phase 3: KMS 지식화 연동 (2주)

| 작업 | 설명 | 비고 |
|------|------|------|
| 대화 → WorkItem 변환 | 고객 대화를 KMS WorkItem으로 자동 생성 | AI 자동 태깅 적용 |
| 대화 내용 AI 분석 | Claude API로 대화 요약/태그 추출 | 기존 `content-analyzer` 확장 |
| 지식 그래프 연결 | 유사 문의/답변 패턴 네트워크 구축 | `knowledge-graph.service` 활용 |
| 대화 기반 FAQ 생성 | 반복 문의를 FAQ 문서로 자동 생성 | `doc-builder` 연동 |

### Phase 4: Lobby + 소셜 연동 (2주)

| 작업 | 설명 | 활용 Talk API |
|------|------|--------------|
| 내부 채팅 통합 | Lobby 채널을 ambKMS 내 팀 소통으로 활용 | `/api/lobby/*` |
| 소셜 플랫폼 관리 | 소셜 연결 상태 대시보드 | `/api/social/*` |
| Chat Widget 관리 | 위젯 설정/임베드 코드 관리 | `/api/widget/*` |
| 알림 통합 | Talk 알림을 ambKMS 알림에 통합 | `/api/notifications/*` |

### Phase 5: 이커머스 + 고객 360° 뷰 (2주)

| 작업 | 설명 | 활용 Talk API |
|------|------|--------------|
| 스토어 연결 관리 | Shopify/Odoo 연결 설정 | `/api/store/*` |
| 고객 매칭 | 채팅 고객 ↔ 스토어 고객 연결 | `/api/customer-matches` |
| 주문 이력 통합 | 고객의 전체 주문 이력 조회 | `/api/store/{platform}/orders` |
| 고객 여정 분석 | Bound Chat 기반 종합 분석 | `/api/bound-chat/{id}/customer-journey` |

---

## 5. Talk API → ambKMS 프록시 API 매핑

ambKMS 프론트엔드가 Talk 기능을 사용하기 위한 프록시 API 설계:

### 5.1 설정 API

| ambKMS API (프론트 호출용) | Talk API (백엔드 호출) | 설명 |
|--------------------------|----------------------|------|
| `GET /api/v1/talk/settings` | - | Talk 연동 설정 조회 |
| `PUT /api/v1/talk/settings` | `/api/auth/signin` + `/api/auth/select-company` | Talk 연동 설정 저장 + 인증 검증 |
| `POST /api/v1/talk/settings/test` | `/api/auth/signin` | Talk 연결 테스트 |
| `GET /api/v1/talk/companies` | `/api/companies` | Talk 회사 목록 조회 |

### 5.2 Inbox API

| ambKMS API | Talk API | 설명 |
|------------|----------|------|
| `GET /api/v1/talk/conversations` | `GET /api/inbox/conversations` | 대화 목록 |
| `GET /api/v1/talk/conversations/:id/messages` | `GET /api/inbox/conversations/{id}/messages` | 메시지 조회 |
| `POST /api/v1/talk/conversations/:id/messages` | `POST /api/inbox/conversations/{id}/messages` | 메시지 전송 |
| `GET /api/v1/talk/conversations/:id/customer` | `GET /api/inbox/conversations/{id}/customer` | 고객 정보 |
| `PATCH /api/v1/talk/conversations/:id/read` | `PATCH /api/inbox/conversations/{id}/read-status` | 읽음 처리 |
| `DELETE /api/v1/talk/conversations/:id` | `DELETE /api/inbox/conversations/{id}` | 대화 삭제 |
| `POST /api/v1/talk/conversations/:id/files` | `POST /api/inbox/conversations/{id}/files` | 파일 전송 |

### 5.3 Lobby API

| ambKMS API | Talk API | 설명 |
|------------|----------|------|
| `GET /api/v1/talk/channels` | `GET /api/lobby/channels` | 채널 목록 |
| `POST /api/v1/talk/channels` | `POST /api/lobby/channels` | 채널 생성 |
| `GET /api/v1/talk/channels/:id/messages` | `GET /api/lobby/channels/{id}/messages` | 메시지 조회 |
| `POST /api/v1/talk/channels/:id/messages` | `POST /api/lobby/channels/{id}/messages` | 메시지 전송 |
| `PATCH /api/v1/talk/channels/:id/read` | `PATCH /api/lobby/channels/{id}/read` | 읽음 처리 |

### 5.4 Social & Widget API

| ambKMS API | Talk API | 설명 |
|------------|----------|------|
| `GET /api/v1/talk/social/connections` | `GET /api/social/list` | 소셜 연결 목록 |
| `POST /api/v1/talk/social/connect` | `POST /api/social/session/init` | 소셜 연결 시작 |
| `GET /api/v1/talk/social/session/:id` | `GET /api/social/session/{id}` | 연결 상태 확인 |
| `DELETE /api/v1/talk/social/:id` | `DELETE /api/social/{id}` | 소셜 연결 해제 |
| `GET /api/v1/talk/widget/config` | `GET /api/widget/config` | 위젯 설정 조회 |
| `POST /api/v1/talk/widget/config` | `POST /api/widget/config` | 위젯 설정 변경 |

### 5.5 Store & Customer API

| ambKMS API | Talk API | 설명 |
|------------|----------|------|
| `GET /api/v1/talk/store/connections` | `GET /api/store/list` | 스토어 연결 목록 |
| `POST /api/v1/talk/store/connect` | `POST /api/store/connect` | 스토어 연결 (OAuth) |
| `POST /api/v1/talk/store/connect/direct` | `POST /api/store/connect/direct` | 스토어 연결 (API Key) |
| `GET /api/v1/talk/store/:platform/orders` | `GET /api/store/{platform}/orders` | 주문 목록 |
| `GET /api/v1/talk/store/:platform/customers` | `GET /api/store/{platform}/customers` | 고객 목록 |

---

## 6. 프론트엔드 UI 설계

### 6.1 메뉴 구조

```
설정 (Settings)
└── Amoeba Talk 연동
    ├── 연결 설정        — Talk API URL, 서비스 계정 인증
    ├── 소셜 채널 관리    — Facebook, Zalo, Line 등 연결 상태
    ├── Chat Widget 설정  — 위젯 외관/도메인 설정
    └── 스토어 연동       — Shopify, Odoo 연결 상태

업무 (Work)
└── 고객 소통 (Talk)
    ├── Inbox           — 옴니채널 대화 목록 + 메시지 뷰
    ├── 팀 채팅          — Lobby 채널 + DM
    ├── 알림             — Talk 알림 통합 뷰
    └── 고객 분석         — Bound Chat + Customer Journey
```

### 6.2 주요 화면

#### 화면 1: Talk 연동 설정 (`/settings/talk`)

```
┌─────────────────────────────────────────────────────────┐
│  Amoeba Talk 연동 설정                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  API URL:    [https://api-talk.amoeba.site          ]   │
│                                                          │
│  이메일:     [service@company.com                    ]   │
│  비밀번호:   [••••••••••                             ]   │
│                                                          │
│  회사 선택:  [▼ My Company (slug: my-company)        ]   │
│                                                          │
│  상태:  ● 연결됨  (마지막 동기화: 2026-02-25 14:30)        │
│                                                          │
│  [연결 테스트]  [저장]                                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  소셜 플랫폼 연동 현황                                     │
│                                                          │
│  📘 Facebook  │ My Page           │ ● 활성  │ [해제]     │
│  💬 Zalo      │ Company OA        │ ● 활성  │ [해제]     │
│  📧 Gmail     │ support@company   │ ● 활성  │ [해제]     │
│  🟢 Line      │ -                 │ ○ 미연결 │ [연결]     │
│                                                          │
│  [+ 소셜 플랫폼 추가]                                      │
└─────────────────────────────────────────────────────────┘
```

#### 화면 2: Inbox 통합 뷰 (`/talk/inbox`)

```
┌──────────────────┬──────────────────────────────────────┐
│  대화 목록        │  대화 상세                             │
│                  │                                       │
│  🔍 검색          │  👤 홍길동 (Zalo)                     │
│  ○ 전체 ○ 안읽음   │  ──────────────────────────────────── │
│                  │                                       │
│  ▸ 홍길동 (Zalo)  │  [14:25] 안녕하세요, 제품 문의드립니다  │
│    제품 문의...    │                                       │
│    14:30         │  [14:31] 안녕하세요! 어떤 제품 관련      │
│                  │         문의이신가요?                    │
│  ▸ 김철수 (FB)    │                                       │
│    배송 확인...    │  [14:32] A-100 모델 가격이 궁금합니다   │
│    13:45         │                                       │
│                  │  ──────────────────────────────────── │
│  ▸ 이영희 (Email) │  [메시지 입력...              ] [전송]  │
│    결제 문의...    │                                       │
│    12:10         │  ┌──────────────────────────────────┐ │
│                  │  │  📋 KMS 연동                      │ │
│                  │  │  [지식 아이템 생성] [태그 추출]     │ │
│                  │  │  [FAQ 등록]       [할일 생성]     │ │
│                  │  └──────────────────────────────────┘ │
└──────────────────┴──────────────────────────────────────┘
```

---

## 7. 핵심 코드 구조 제안

### 7.1 백엔드 모듈 구조

```
apps/api/src/domain/talk/
├── talk.module.ts                    # NestJS 모듈
├── controller/
│   ├── talk-settings.controller.ts   # 설정 API
│   ├── talk-inbox.controller.ts      # Inbox 프록시
│   ├── talk-lobby.controller.ts      # Lobby 프록시
│   ├── talk-social.controller.ts     # Social 프록시
│   └── talk-store.controller.ts      # Store 프록시
├── service/
│   ├── talk-auth.service.ts          # Talk 인증(signin, select-company, refresh)
│   ├── talk-http.service.ts          # Axios 기반 HTTP 클라이언트
│   ├── talk-inbox.service.ts         # Inbox 비즈니스 로직
│   ├── talk-lobby.service.ts         # Lobby 비즈니스 로직
│   ├── talk-sync.service.ts          # KMS 동기화 (대화 → WorkItem)
│   └── talk-settings.service.ts      # 설정 CRUD
├── entity/
│   ├── talk-setting.entity.ts        # amb_talk_settings
│   └── talk-user-mapping.entity.ts   # amb_talk_user_mappings
├── dto/
│   ├── request/
│   │   ├── save-talk-settings.dto.ts
│   │   └── test-talk-connection.dto.ts
│   └── response/
│       ├── talk-conversation.dto.ts
│       └── talk-message.dto.ts
└── guard/
    └── talk-enabled.guard.ts         # Talk 연동 활성 여부 체크
```

### 7.2 프론트엔드 구조

```
apps/web/src/domain/talk/
├── pages/
│   ├── TalkInboxPage.tsx             # Inbox 메인 화면
│   ├── TalkLobbyPage.tsx             # Lobby 채팅 화면
│   └── TalkDashboardPage.tsx         # 통합 대시보드
├── components/
│   ├── ConversationList.tsx           # 대화 목록
│   ├── MessageView.tsx               # 메시지 뷰
│   ├── MessageInput.tsx              # 메시지 입력
│   ├── CustomerInfoPanel.tsx         # 고객 정보 패널
│   └── KmsIntegrationPanel.tsx       # KMS 연동 패널
├── hooks/
│   ├── useTalkConversations.ts
│   ├── useTalkMessages.ts
│   └── useTalkSettings.ts
├── service/
│   └── talk.service.ts               # API 호출 서비스
└── store/
    └── talk.store.ts                  # zustand 상태 관리

apps/web/src/domain/settings/
├── components/
│   └── TalkSettingsTab.tsx            # Talk 설정 탭 (기존 설정 페이지에 추가)
```

---

## 8. 보안 고려사항

| 항목 | 방안 | 구현 위치 |
|------|------|----------|
| **인증 정보 저장** | Talk 비밀번호를 AES-256-GCM으로 암호화하여 DB 저장 | `talk-settings.service.ts` |
| **토큰 관리** | access_token은 메모리 캐시, refresh_token은 암호화 저장 | `talk-auth.service.ts` |
| **API 프록시** | Talk API를 직접 노출하지 않고, ambKMS 백엔드를 통해서만 호출 | `talk-http.service.ts` |
| **권한 검사** | Talk API 호출 전 ambKMS 권한 체크 (AdminGuard 등) | 각 Controller |
| **감사 로그** | Talk 관련 주요 액션 (연결/해제/메시지 전송) 로깅 | `talk-sync.service.ts` |
| **Rate Limiting** | Talk API 호출 빈도 제한 (분당 60회 등) | `talk-http.service.ts` |

---

## 9. Talk API 응답 형식 참고

모든 Talk API는 통일된 응답 형식을 사용:

```typescript
// 성공 응답
interface TalkSuccessResponse<T> {
    success: true;
    message: string;
    data: T;
    timestamp: string;
}

// 에러 응답
interface TalkErrorResponse {
    statusCode: number;
    errorCode?: string;    // 예: 'AUTH_001'
    status: false;
    message: string;
    timestamp: string;
    path: string;
}
```

**주요 에러 코드:**
- `401` — 인증 토큰 만료/유효하지 않음 → `refresh` 호출 후 재시도
- `404` — 리소스 없음 (대화/고객/연결)
- `422` — 요청 데이터 검증 실패

---

## 10. 결론 및 추천 전략

### 10.1 추천 접근 방식

| 순위 | 전략 | 이유 |
|------|------|------|
| ★★★ | **서비스 계정 + 프록시 패턴** (방식 A) | 보안 우수, 구현 용이, 프론트엔드 변경 최소 |
| ★★ | 사용자별 개별 인증 (방식 C) | 개인별 권한 분리 가능하나, UX 복잡 |
| ★ | SSO 연동 (방식 B) | 최상의 UX이나, Talk 측 개발 필요 |

### 10.2 MVP 스코프

**1차 목표 (4주):**
1. Talk 연동 설정 UI (Phase 1)
2. Inbox 대화 조회/응대 (Phase 2)
3. 대화 → KMS WorkItem 자동 생성 (Phase 3 일부)

**2차 목표 (4주):**
4. Lobby 내부 채팅 통합 (Phase 4)
5. 소셜 플랫폼 관리 (Phase 4)
6. 이커머스 연동 (Phase 5)

### 10.3 Talk API 호출 예시 코드

```typescript
// Talk 인증 서비스 예시
@Injectable()
export class TalkAuthService {
    private tokenCache = new Map<string, { accessToken: string; refreshToken: string; expiresAt: number }>();

    async getAccessToken(entityId: string): Promise<string> {
        const cached = this.tokenCache.get(entityId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.accessToken;
        }
        
        // 토큰 갱신 또는 새로 로그인
        if (cached?.refreshToken) {
            return this.refreshToken(entityId, cached.refreshToken);
        }
        return this.signin(entityId);
    }

    private async signin(entityId: string): Promise<string> {
        const settings = await this.settingsRepo.findOne({ where: { tks_entity_id: entityId } });
        const password = this.cryptoService.decrypt(settings.tks_password);

        // Step 1: signin
        const signinRes = await this.httpService.post('https://api-talk.amoeba.site/api/auth/signin', {
            email: settings.tks_email,
            password,
        });

        // Step 2: select-company
        const selectRes = await this.httpService.post('https://api-talk.amoeba.site/api/auth/select-company', {
            company_id: settings.tks_company_id,
        }, {
            headers: { Authorization: `Bearer ${signinRes.data.data.temp_token}` },
        });

        const { access_token, refresh_token } = selectRes.data.data;
        this.tokenCache.set(entityId, {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: Date.now() + 14 * 60 * 1000, // 14분 (15분 만료 전 갱신)
        });

        return access_token;
    }
}
```

### 10.4 예상 리소스

| 단계 | 기간 | 인력 | 산출물 |
|------|------|------|--------|
| Phase 1 | 2주 | 풀스택 1명 | 설정 UI + 인증 서비스 |
| Phase 2 | 2주 | 풀스택 1명 | Inbox 통합 뷰 |
| Phase 3 | 2주 | 풀스택 1명 + AI 엔지니어 | KMS 지식화 파이프라인 |
| Phase 4 | 2주 | 풀스택 1명 | Lobby + 소셜 + 위젯 |
| Phase 5 | 2주 | 풀스택 1명 | 이커머스 + 360° 뷰 |
| **합계** | **10주** | - | - |
