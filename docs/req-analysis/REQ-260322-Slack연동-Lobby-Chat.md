# 요구사항 분석서: Slack ↔ Lobby Chat 양방향 연동

- **문서번호**: REQ-Slack연동-Lobby-Chat-20260322
- **작성일**: 2026-03-22
- **상태**: 작성 완료
- **범위**: USER_LEVEL (Entity별 설정)

---

## 1. 요구사항 요약

Entity(법인) 단위로 Slack 워크스페이스를 연결하고, Slack 지정 채널의 메시지를 AMA Lobby Chat 채널로 실시간 동기화하며, Lobby Chat에서 작성한 메시지를 다시 Slack 해당 채널로 전송하는 양방향 메시지 연동 기능을 구현한다.

---

## 2. AS-IS 현황 분석

### 2.1 Amoeba Talk (Lobby Chat) 아키텍처

| 구성 요소 | 현황 |
|-----------|------|
| **실시간 통신** | SSE (Server-Sent Events) 기반, RxJS Subject 이벤트 버스 |
| **채널 유형** | PUBLIC, PRIVATE, DIRECT |
| **법인 격리** | `amb_talk_channels.ent_id` FK |
| **DB 테이블** | 6개: channels, messages, channel_members, read_status, reactions, attachments |
| **메시지 유형** | TEXT, FILE (+ 번역 지원) |
| **스레드** | `msg_parent_id`로 지원 |
| **알림** | 멘션 기반 푸시 알림 |

### 2.2 기존 외부 서비스 연동 패턴

| 패턴 | 구현 사례 |
|------|----------|
| **API Key 관리** | `amb_api_keys` 테이블, AES-256-GCM 암호화 (entity-specific → system-shared → env 우선순위) |
| **외부 앱 설정** | `amb_entity_custom_apps` (url, auth_mode, api_key 암호화) |
| **Webhook 수신** | Stripe Webhook (서명 검증 + raw body) |
| **AI 설정** | `amb_entity_ai_configs` (provider, api_key, 토큰 한도) |

### 2.3 현재 메시지 전송 흐름

```
사용자 → POST /messages → MessageService.sendMessage()
  → DB 저장
  → TalkSseService.emit({channelId, type: 'message:new', data})
  → RxJS Subject 브로드캐스트
  → SSE 구독자 수신
  → React Query 캐시 무효화
  → 푸시 알림 (멘션)
  → KMS 이벤트 발행
```

---

## 3. TO-BE 요구사항

### 3.1 기능 요구사항 (Functional)

#### FR-01. Slack 워크스페이스 연결 (Entity-Level)

| 항목 | 설명 |
|------|------|
| **설명** | Entity 관리자가 Slack 워크스페이스를 OAuth 2.0으로 연결 |
| **흐름** | Entity Settings → Slack 연동 설정 → "Slack 연결" 버튼 → Slack OAuth 인증 → Bot Token 저장 |
| **저장** | Bot Token, Team ID, Team Name을 암호화하여 DB 저장 |
| **범위** | Entity당 N개 워크스페이스 (1:N) — 여러 Slack 워크스페이스 동시 연결 가능 |
| **해제** | 개별 워크스페이스 연결 해제 시 해당 워크스페이스의 채널 매핑 비활성화, 토큰 삭제 |

#### FR-02. Slack 채널 ↔ AMA 채널 매핑

| 항목 | 설명 |
|------|------|
| **설명** | Slack 채널을 AMA Lobby Chat 채널에 매핑 |
| **옵션 A** | 기존 AMA 채널에 Slack 채널 연결 |
| **옵션 B** | Slack 채널 선택 시 자동으로 AMA 채널 생성 (채널명 동기화) |
| **UI** | 드롭다운으로 Slack 채널 목록 표시 → AMA 채널 선택/생성 |
| **제한** | 1:1 매핑 (하나의 Slack 채널은 하나의 AMA 채널에만 매핑) |
| **상태** | ACTIVE / PAUSED / DISCONNECTED |

#### FR-03. Slack → AMA 메시지 수신 (Inbound)

| 항목 | 설명 |
|------|------|
| **설명** | Slack 채널 메시지를 실시간으로 AMA 채널에 표시 |
| **수신 방식** | Slack Events API (HTTP Webhook) |
| **이벤트** | `message` (신규 메시지), `message_changed` (수정), `message_deleted` (삭제) |
| **메시지 표시** | `[Slack] {사용자명}: {메시지 내용}` 형태로 시스템 메시지 또는 가상 사용자로 표시 |
| **파일** | Slack 파일 URL을 AMA 메시지에 링크로 포함 |
| **스레드** | Slack 스레드 → AMA 스레드 매핑 (thread_ts → msg_parent_id) |
| **필터링** | Bot 메시지 무시 (무한 루프 방지), 서브타입 필터링 |

#### FR-04. AMA → Slack 메시지 전송 (Outbound)

| 항목 | 설명 |
|------|------|
| **설명** | AMA Lobby Chat에서 작성한 메시지를 Slack 채널로 전송 |
| **API** | Slack Web API `chat.postMessage` |
| **표시** | Bot 이름으로 전송, 메시지 앞에 `[AMA] {사용자명}:` prefix |
| **파일** | AMA 첨부파일 URL을 Slack 메시지에 포함 |
| **스레드** | AMA 스레드 답글 → Slack thread_ts로 매핑하여 스레드 답글로 전송 |
| **필터링** | Slack에서 수신된 메시지는 재전송하지 않음 (무한 루프 방지) |

#### FR-05. 사용자 매핑 (선택적)

| 항목 | 설명 |
|------|------|
| **설명** | Slack 사용자와 AMA 사용자를 매핑하여 실명 표시 |
| **방식** | 이메일 기반 자동 매핑 (Slack 프로필 이메일 = AMA 사용자 이메일) |
| **미매핑** | Slack display_name 또는 real_name 사용 |
| **우선순위**: Phase 2 (초기 구현에서는 Slack 이름 그대로 사용) |

#### FR-06. 관리자 설정 UI

| 항목 | 설명 |
|------|------|
| **위치** | Entity Settings → 새 탭 "Slack 연동" |
| **기능** | 워크스페이스 추가/해제 (복수 가능), 채널 매핑 CRUD, 연동 상태 모니터링 |
| **권한** | Entity Admin 이상 |

### 3.2 비기능 요구사항 (Non-Functional)

| ID | 항목 | 요구사항 |
|----|------|----------|
| NFR-01 | **실시간성** | Slack 메시지 수신 후 3초 이내 AMA 채널에 표시 |
| NFR-02 | **Rate Limiting** | Slack API 제한 준수 (tier별 1~50 req/min), 재시도 로직 포함 |
| NFR-03 | **보안** | Bot Token AES-256-GCM 암호화 저장, Webhook 서명 검증 (HMAC-SHA256) |
| NFR-04 | **무한 루프 방지** | AMA→Slack으로 보낸 메시지가 Events API로 돌아올 때 무시하는 로직 |
| NFR-05 | **장애 격리** | Slack API 장애 시 AMA 채팅 기능에 영향 없음 |
| NFR-06 | **다중 법인** | Entity별 독립적 Slack 워크스페이스 연결 |
| NFR-07 | **다중 워크스페이스** | Entity당 여러 Slack 워크스페이스 연결 가능 (1:N) |
| NFR-08 | **확장성** | 채널 매핑 수 제한 없음 (Entity당, 워크스페이스당) |
| NFR-09 | **감사 추적** | 연동 설정 변경, 연결/해제 이력 로깅 |

---

## 4. 갭 분석

### 4.1 신규 필요 컴포넌트

| 구분 | 컴포넌트 | 설명 |
|------|---------|------|
| **DB** | `amb_slack_workspace_configs` | Entity별 Slack 워크스페이스 설정 (bot_token, team_id 등) |
| **DB** | `amb_slack_channel_mappings` | Slack 채널 ↔ AMA 채널 매핑 |
| **DB** | `amb_slack_message_mappings` | 메시지 ID 매핑 (Slack ts ↔ AMA msg_id), 중복/루프 방지 |
| **Backend** | `slack-integration` 도메인 모듈 | Controller, Service, Entity, DTO 일체 |
| **Backend** | Slack Webhook Controller | Events API 수신 엔드포인트 (`/api/v1/webhooks/slack/events`) |
| **Backend** | Slack OAuth Controller | OAuth 2.0 인증 흐름 처리 |
| **Backend** | Slack API Service | `@slack/web-api` 래핑 (postMessage, conversations.list 등) |
| **Backend** | Slack Event Processor | 이벤트 유형별 분기 처리 (message, message_changed, message_deleted) |
| **Frontend** | SlackIntegrationTab | Entity Settings 내 Slack 연동 설정 UI |
| **Frontend** | SlackChannelMappingList | 채널 매핑 관리 UI |
| **npm** | `@slack/web-api` | Slack Web API 클라이언트 |

### 4.2 기존 컴포넌트 수정

| 컴포넌트 | 수정 내용 |
|---------|----------|
| `MessageService.sendMessage()` | 메시지 저장 후 Slack 채널 매핑 확인 → Slack 전송 호출 추가 |
| `TalkSseService` | Slack 발 메시지도 SSE 이벤트로 브로드캐스트 |
| `TalkChannelEntity` | (변경 없음 — 매핑은 별도 테이블) |
| `TalkMessageEntity` | `msg_external_id` 컬럼 추가 (Slack message ts 저장, 선택적) |
| Entity Settings 라우팅 | Slack 연동 탭 추가 |
| i18n 번역 파일 | Slack 관련 키 추가 (ko/en/vi) |

---

## 5. 시스템 흐름도

### 5.1 Slack → AMA 메시지 수신 흐름

```
Slack 워크스페이스 → Events API HTTP POST
  → POST /api/v1/webhooks/slack/events
  → 서명 검증 (x-slack-signature, x-slack-request-timestamp)
  → 이벤트 디스패치:
    [url_verification] → challenge 응답
    [event_callback.message] →
      → Bot 메시지 체크 (bot_id 있으면 무시)
      → 자체 발송 메시지 체크 (amb_slack_message_mappings에 ts 존재 시 무시)
      → Slack channel_id로 amb_slack_channel_mappings 조회
      → AMA 채널 확인 (chn_id)
      → 메시지 DB 저장 (msg_type: TEXT, usr_id: system/slack-bot)
      → amb_slack_message_mappings에 (slack_ts ↔ msg_id) 저장
      → TalkSseService.emit({channelId, type: 'message:new', data})
      → AMA 사용자 SSE로 수신
```

### 5.2 AMA → Slack 메시지 전송 흐름

```
사용자 → POST /channels/:id/messages
  → MessageService.sendMessage() (기존 로직)
  → DB 저장 완료
  → SlackOutboundService.trySendToSlack(channelId, message)
    → amb_slack_channel_mappings에서 매핑 조회
    → 매핑 없으면 SKIP
    → 매핑 있으면:
      → Slack Web API chat.postMessage 호출
      → 응답의 ts를 amb_slack_message_mappings에 저장 (루프 방지용)
  → (기존) SSE 브로드캐스트, 푸시 알림 등
```

### 5.3 OAuth 인증 흐름

```
관리자 → Entity Settings → Slack 연동 → "연결" 클릭
  → Frontend: window.open('/api/v1/slack/oauth/install?entity_id=xxx')
  → Backend: 302 Redirect → https://slack.com/oauth/v2/authorize
    (client_id, scope, redirect_uri, state=jwt(entity_id))
  → 사용자: Slack에서 워크스페이스 선택 & 권한 허용
  → Slack: Redirect → /api/v1/slack/oauth/callback?code=xxx&state=xxx
  → Backend:
    → state 검증
    → POST https://slack.com/api/oauth.v2.access (code → bot_token)
    → amb_slack_workspace_configs에 저장 (토큰 암호화)
    → 성공 페이지 렌더 또는 Frontend로 redirect
  → Frontend: 연결 상태 갱신
```

---

## 6. 데이터 모델 설계

### 6.1 amb_slack_workspace_configs

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `swc_id` | UUID PK | |
| `ent_id` | UUID FK (INDEX) | 법인 ID (1:N — Entity당 여러 워크스페이스 가능) |
| `swc_team_id` | varchar(50) | Slack Team/Workspace ID |
| `swc_team_name` | varchar(200) | Slack 워크스페이스 이름 |
| `swc_bot_token_enc` | text | Bot Token (암호화) |
| `swc_bot_token_iv` | varchar(100) | 암호화 IV |
| `swc_bot_token_tag` | varchar(100) | 암호화 Tag |
| `swc_bot_user_id` | varchar(50) | Bot User ID (루프 방지) |
| `swc_app_id` | varchar(50) | Slack App ID |
| `swc_is_active` | boolean | 활성 여부 |
| `swc_connected_at` | timestamp | 연결 일시 |
| `swc_connected_by` | UUID FK | 연결한 사용자 |
| `swc_created_at` | timestamp | |
| `swc_updated_at` | timestamp | |
| `swc_deleted_at` | timestamp | Soft Delete |

### 6.2 amb_slack_channel_mappings

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `scm_id` | UUID PK | |
| `swc_id` | UUID FK | 워크스페이스 설정 ID |
| `ent_id` | UUID FK | 법인 ID |
| `scm_slack_channel_id` | varchar(50) | Slack Channel ID |
| `scm_slack_channel_name` | varchar(200) | Slack 채널 이름 |
| `chn_id` | UUID FK | AMA Talk Channel ID |
| `scm_status` | varchar(20) | ACTIVE / PAUSED / DISCONNECTED |
| `scm_direction` | varchar(20) | BIDIRECTIONAL / INBOUND_ONLY / OUTBOUND_ONLY |
| `scm_created_at` | timestamp | |
| `scm_updated_at` | timestamp | |
| `scm_deleted_at` | timestamp | |

### 6.3 amb_slack_message_mappings

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `smm_id` | UUID PK | |
| `scm_id` | UUID FK | 채널 매핑 ID |
| `smm_slack_ts` | varchar(50) | Slack 메시지 timestamp (고유 ID) |
| `smm_slack_thread_ts` | varchar(50) | Slack 스레드 parent ts (nullable) |
| `msg_id` | UUID FK | AMA 메시지 ID |
| `smm_direction` | varchar(10) | INBOUND (Slack→AMA) / OUTBOUND (AMA→Slack) |
| `smm_created_at` | timestamp | |

**인덱스**:
- `UNIQUE (scm_id, smm_slack_ts)` — Slack 측 중복 방지
- `UNIQUE (msg_id)` — AMA 측 중복 방지 (1:1)
- `INDEX (smm_slack_thread_ts)` — 스레드 매핑 조회용

---

## 7. Slack App 설정 사양

### 7.1 필요 Bot Token Scopes

| Scope | 용도 |
|-------|------|
| `channels:history` | 공개 채널 메시지 읽기 |
| `channels:read` | 공개 채널 목록 조회 |
| `channels:join` | 공개 채널 자동 참여 |
| `chat:write` | 메시지 전송 |
| `users:read` | 사용자 정보 조회 (이름, 이메일) |
| `users:read.email` | 사용자 이메일 조회 (사용자 매핑) |
| `groups:history` | 비공개 채널 메시지 읽기 (선택) |
| `groups:read` | 비공개 채널 목록 조회 (선택) |

### 7.2 Events API 구독 이벤트

| Event | 설명 |
|-------|------|
| `message.channels` | 공개 채널 메시지 |
| `message.groups` | 비공개 채널 메시지 (선택) |

### 7.3 Events API vs Socket Mode 비교

| 항목 | Events API (HTTP Webhook) | Socket Mode (WebSocket) |
|------|--------------------------|------------------------|
| **인프라** | 공개 URL 필요 (이미 보유) | 공개 URL 불필요 |
| **배포** | 서버 재시작 시 자동 복구 | 연결 재수립 필요 |
| **확장성** | HTTP 라우팅으로 분산 가능 | 단일 연결 유지 필요 |
| **선택** | **✅ 권장** | 개발 환경용 |

→ **Events API (HTTP Webhook) 채택**: AMA가 이미 공개 도메인(ama.amoeba.site)을 보유하고, Stripe Webhook 수신 패턴이 검증되어 있음.

---

## 8. 보안 요구사항

| 항목 | 구현 방법 |
|------|----------|
| **Bot Token 저장** | AES-256-GCM 암호화 (기존 CryptoService 활용) |
| **Webhook 서명 검증** | `x-slack-signature` HMAC-SHA256 검증 (Signing Secret 사용) |
| **OAuth State** | JWT로 entity_id 포함, 만료 시간 설정 (CSRF 방지) |
| **API Key 노출 방지** | Token은 DB에서 마스킹 조회 (last 4자리만) |
| **권한 분리** | Slack 설정은 Entity Admin 이상만 접근 |
| **Rate Limiting** | Slack API 응답 `Retry-After` 헤더 준수, 큐 기반 전송 |

---

## 9. 무한 루프 방지 전략

가장 중요한 기술적 과제는 **양방향 동기화 시 메시지 무한 루프 방지**이다.

### 9.1 루프 발생 시나리오

```
AMA 사용자 메시지 → Slack 전송 → Slack Events API → AMA 수신 → Slack 전송 → ...
```

### 9.2 방지 메커니즘 (3중 방어)

1. **Bot Message 필터링**: Slack 이벤트의 `bot_id` 필드가 자체 Bot User ID와 일치하면 무시
2. **Message Mapping 테이블**: 발송한 메시지의 `slack_ts`를 저장 → 이벤트 수신 시 해당 ts 존재 여부 확인
3. **메시지 메타데이터**: AMA 메시지에 `msg_source: 'slack'` 또는 내부 플래그로 Slack 발 메시지 표시 → Outbound 서비스에서 skip

---

## 10. 기술 제약사항 및 리스크

| # | 제약/리스크 | 영향 | 대응 |
|---|-----------|------|------|
| 1 | Slack Events API 3초 응답 제한 | 무응답 시 재전송 (최대 3회) | 즉시 200 응답 후 비동기 처리 |
| 2 | Slack API Rate Limit (Tier별) | 대량 메시지 시 지연 | 큐 + 재시도, Retry-After 준수 |
| 3 | Slack Free Plan 90일 메시지 제한 | 히스토리 동기화 제한 | 실시간 동기화만 지원, 히스토리 동기화는 Phase 2 |
| 4 | Slack App 심사 | 10개 이상 워크스페이스 설치 시 필요 | 초기에는 자체 워크스페이스만 대상 |
| 5 | 서버 배포 시 Webhook URL 변경 | 이벤트 수신 중단 | URL 불변 유지 (도메인 고정) |
| 6 | SSE 기반 실시간 제한 | Slack 발 메시지 전파는 기존 SSE 활용 | 추가 인프라 불필요 |

---

## 11. 사용자 플로우

### 11.1 관리자: Slack 워크스페이스 연결

1. Entity Settings → "Slack 연동" 탭 클릭
2. "워크스페이스 추가" 버튼 클릭
3. Slack OAuth 화면에서 워크스페이스 선택 & 권한 허용
4. 연결 완료 → 워크스페이스 목록에 추가되고 상태 'CONNECTED'
5. 추가 워크스페이스 필요 시 2~4 반복

### 11.2 관리자: 채널 매핑 설정

1. "채널 매핑 추가" 버튼 클릭
2. 워크스페이스 드롭다운에서 대상 워크스페이스 선택
3. 해당 워크스페이스의 Slack 채널 드롭다운에서 채널 선택
4. AMA 채널 선택 (기존) 또는 새 채널 생성
5. 동기화 방향 선택 (양방향/Slack→AMA/AMA→Slack)
6. "연결" 클릭 → 매핑 활성화

### 11.3 일반 사용자: 메시지 수신/발신

1. AMA Lobby Chat에서 Slack 연동된 채널 입장
2. Slack에서 온 메시지가 `[Slack] 사용자명` 형태로 표시됨
3. AMA에서 메시지 입력 → 자동으로 Slack 채널에도 전송
4. 일반 채널과 동일한 UX (추가 조작 불필요)

---

## 12. 범위 외 사항 (Out of Scope)

- Slack 과거 메시지 히스토리 일괄 동기화 (Phase 2 검토)
- Slack Reactions ↔ AMA Reactions 동기화 (Phase 2)
- Slack 파일 업로드 → AMA 파일 저장 (링크만 제공)
- 사용자 프레즌스(온라인/오프라인) 동기화
- Slack Interactive Components (버튼, 모달 등)
- DM(Direct Message) 매핑
- Slack Enterprise Grid 연동 (단일 Organization Token)
