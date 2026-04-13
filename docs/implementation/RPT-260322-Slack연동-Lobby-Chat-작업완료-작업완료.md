# 작업 완료 보고: Slack ↔ Lobby Chat 양방향 연동

**작성일**: 2026-03-22  
**작업자**: Claude AI  
**관련 문서**: REQ-Slack연동-Lobby-Chat-20260322.md, PLAN-Slack연동-Lobby-Chat-작업계획-20260322.md

---

## 1. 구현 내용 요약

Slack 워크스페이스와 AMA Lobby Chat 간 **양방향 실시간 메시지 연동** 기능 구현.

| 항목 | 내용 |
|------|------|
| **방향** | Slack → AMA (Inbound) + AMA → Slack (Outbound) |
| **인증** | Slack OAuth 2.0 Bot Token + AES-256-GCM 암호화 |
| **보안** | HMAC-SHA256 서명 검증 + 5분 리플레이 방어 + timing-safe 비교 |
| **루프 방지** | 3중 방어 (bot_id 필터 → message mapping 중복 → direction 필터) |
| **결합 방식** | EventEmitter2 기반 느슨한 결합 (순환 의존성 방지) |
| **UI** | Entity Settings > Slack 연동 설정 페이지 + 채팅 Slack 아이콘 표시 |

---

## 2. 변경 파일 목록

### 2.1 신규 생성 (25개)

**Backend - Entity (3개)**
| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/slack-integration/entity/slack-workspace-config.entity.ts` | Slack 워크스페이스 설정 (OAuth 토큰 AES 암호화) |
| `apps/api/src/domain/slack-integration/entity/slack-channel-mapping.entity.ts` | Slack ↔ AMA 채널 매핑 |
| `apps/api/src/domain/slack-integration/entity/slack-message-mapping.entity.ts` | 메시지 매핑 (루프 방지) |

**Backend - Service (5개)**
| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/slack-integration/service/slack-api.service.ts` | @slack/web-api WebClient 래퍼 |
| `apps/api/src/domain/slack-integration/service/slack-oauth.service.ts` | OAuth 2.0 플로우 (install URL + callback) |
| `apps/api/src/domain/slack-integration/service/slack-workspace.service.ts` | 워크스페이스/채널 매핑 CRUD |
| `apps/api/src/domain/slack-integration/service/slack-event.service.ts` | Inbound: Slack → AMA 메시지 처리 |
| `apps/api/src/domain/slack-integration/service/slack-outbound.service.ts` | Outbound: AMA → Slack 메시지 전송 |

**Backend - Controller (3개)**
| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/slack-integration/controller/slack-oauth.controller.ts` | OAuth install/callback 엔드포인트 |
| `apps/api/src/domain/slack-integration/controller/slack-webhook.controller.ts` | POST /webhooks/slack/events (Public) |
| `apps/api/src/domain/slack-integration/controller/slack-admin.controller.ts` | 워크스페이스/매핑 관리 CRUD API |

**Backend - DTO/Event/Module (4개)**
| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/slack-integration/dto/slack-channel-mapping.dto.ts` | 채널 매핑 Create/Update DTO |
| `apps/api/src/domain/slack-integration/dto/slack-event.dto.ts` | Slack Event Payload 인터페이스 |
| `apps/api/src/domain/slack-integration/event/slack-outbound.event.ts` | EventEmitter2 이벤트 상수/타입 |
| `apps/api/src/domain/slack-integration/slack-integration.module.ts` | NestJS 모듈 정의 |

**Frontend (4개)**
| 파일 | 설명 |
|------|------|
| `apps/web/src/domain/slack-integration/service/slack-integration.service.ts` | API 클라이언트 서비스 |
| `apps/web/src/domain/slack-integration/hooks/useSlackIntegration.ts` | React Query 훅 (6개) |
| `apps/web/src/domain/entity-settings/pages/EntitySlackIntegrationPage.tsx` | Slack 연동 설정 페이지 |

**인프라/문서 (6개)**
| 파일 | 설명 |
|------|------|
| `sql/migration_slack_integration.sql` | amb_menu_config + amb_menu_permissions |
| `docs/analysis/REQ-Slack연동-Lobby-Chat-20260322.md` | 요구사항 분석서 |
| `docs/plan/PLAN-Slack연동-Lobby-Chat-작업계획-20260322.md` | 작업 계획서 |

### 2.2 기존 파일 수정 (10개)

| 파일 | 변경 내용 |
|------|----------|
| `apps/api/package.json` | `@slack/web-api` 의존성 추가 |
| `package-lock.json` | lockfile 갱신 |
| `apps/api/src/app.module.ts` | SlackIntegrationModule import 등록 (1줄) |
| `apps/api/src/main.ts` | `/api/v1/webhooks/slack` raw body 캐처 미들웨어 (12줄) |
| `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | EventEmitter2 주입 + 이벤트 발행 (12줄) |
| `apps/web/src/domain/entity-settings/pages/EntitySettingsPage.tsx` | 메뉴 아이템 + MessageSquare 아이콘 (3줄) |
| `apps/web/src/router/index.tsx` | Slack 라우트 + import (5줄) |
| `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx` | [Slack] prefix 아이콘 스타일링 (7줄) |
| `apps/web/src/locales/en/entitySettings.json` | Slack 번역 키 38줄 |
| `apps/web/src/locales/ko/entitySettings.json` | Slack 번역 키 38줄 |
| `apps/web/src/locales/vi/entitySettings.json` | Slack 번역 키 38줄 |
| `env/backend/.env.development` | SLACK_CLIENT_ID/SECRET/SIGNING_SECRET/REDIRECT_URI (6줄) |

---

## 3. API 엔드포인트

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/slack/oauth/install` | JWT | Slack OAuth 시작 (redirect) |
| GET | `/api/v1/slack/oauth/callback` | Public | OAuth 콜백 |
| GET | `/api/v1/entity-settings/slack/workspaces` | JWT | 워크스페이스 목록 |
| DELETE | `/api/v1/entity-settings/slack/workspaces/:id` | JWT | 워크스페이스 연결 해제 |
| GET | `/api/v1/entity-settings/slack/workspaces/:id/channels` | JWT | Slack 채널 목록 |
| GET | `/api/v1/entity-settings/slack/mappings` | JWT | 채널 매핑 목록 |
| POST | `/api/v1/entity-settings/slack/mappings` | JWT | 채널 매핑 생성 |
| PATCH | `/api/v1/entity-settings/slack/mappings/:id` | JWT | 채널 매핑 수정 |
| DELETE | `/api/v1/entity-settings/slack/mappings/:id` | JWT | 채널 매핑 삭제 |
| POST | `/api/v1/webhooks/slack/events` | Public (서명검증) | Slack 이벤트 수신 |

---

## 4. 주요 아키텍처 결정

### 4.1 EventEmitter2 기반 아웃바운드 처리
- **문제**: MessageService → SlackOutboundService 직접 주입 시 AmoebaTalkModule ↔ SlackIntegrationModule 순환 의존성
- **해결**: EventEmitter2 이벤트 발행 (KMS 모듈 기존 패턴 활용)
- **장점**: MessageService 무수정, 모듈 간 느슨한 결합

### 4.2 Raw Body 캐처 미들웨어
- **문제**: Slack 서명 검증에 원본 request body 필수, 기존 `bodyParser: false` + `express.json()` 설정
- **해결**: `/api/v1/webhooks/slack` 경로에만 raw body 캡처 미들웨어 삽입 (json 파서 앞에 배치)

### 4.3 3중 루프 방지
1. `event.bot_id` 체크 (자기 자신 메시지 무시)
2. `amb_slack_message_mappings` 중복 확인 (이미 처리된 Slack ts 무시)
3. `smmDirection` 확인 (INBOUND로 저장된 메시지는 OUTBOUND 재전송 안 함)

---

## 5. 배포 상태

| 환경 | 상태 | 커밋 | 비고 |
|------|------|------|------|
| 스테이징 | ✅ 배포 완료 | `829d051` | DB 테이블 자동 생성 (synchronize) |
| 프로덕션 | 미배포 | - | Slack App 생성 및 환경변수 설정 필요 |

**스테이징 배포 확인:**
- API 서버: `Nest application successfully started` (port 3009)
- 5개 컨테이너 정상 가동
- SQL 마이그레이션: `amb_menu_config` 1건 + `amb_menu_permissions` 5건 INSERT 완료

---

## 6. 프로덕션 배포 전 필요 사항

1. **Slack App 생성**: https://api.slack.com/apps (Bot Token Scopes: channels:history, channels:read, channels:join, chat:write, users:read)
2. **환경 변수 설정**: `docker/production/.env.production`에 SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET, SLACK_OAUTH_REDIRECT_URI 추가
3. **Event Subscriptions**: Slack App Settings > Event Subscriptions > Request URL: `https://ama.amoeba.site/api/v1/webhooks/slack/events`
4. **Bot Events 구독**: `message.channels`
5. **SQL 마이그레이션**: `sql/migration_slack_integration.sql` 실행
6. **DNS/방화벽**: Slack webhook 수신을 위한 인바운드 443 포트 확인

---

## 7. 테스트 확인 사항

- [x] 백엔드 TS 컴파일 에러 없음 (Slack 관련)
- [x] 프론트엔드 Vite 빌드 성공
- [x] 스테이징 서버 정상 기동
- [x] DB 테이블 자동 생성 (synchronize)
- [x] 메뉴 권한 SQL 적용 완료
- [ ] Slack OAuth 연결 (Slack App 설정 후)
- [ ] 양방향 메시지 전송 (Slack App 설정 후)
- [ ] 루프 방지 검증 (Slack App 설정 후)
