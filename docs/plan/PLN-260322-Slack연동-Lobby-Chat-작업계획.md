# 작업 계획서: Slack ↔ Lobby Chat 양방향 연동

- **문서번호**: PLAN-Slack연동-Lobby-Chat-작업계획-20260322
- **작성일**: 2026-03-22
- **상태**: 사이드 임팩트 분석 완료 (2026-03-22 업데이트)
- **관련 분석서**: REQ-Slack연동-Lobby-Chat-20260322
- **기반 브랜치**: `main`
- **작업 브랜치**: `feature/slack-lobby-chat-integration`

---

## 1. 시스템 개발 현황 분석

### 1.1 활용 가능한 기존 인프라

| 인프라 | 상세 | 재사용 방식 |
|--------|------|------------|
| **CryptoService** | AES-256-GCM 암호화/복호화 | Slack Bot Token 암호화 저장 |
| **amb_api_keys 패턴** | Entity별 API Key 관리 | 워크스페이스 설정 테이블 설계 참조 |
| **Stripe Webhook** | 서명 검증 + HTTP Webhook 수신 | Slack Events API 수신 패턴 동일 |
| **TalkSseService** | RxJS Subject 기반 SSE 이벤트 버스 | Slack 수신 메시지를 기존 SSE 파이프라인에 주입 |
| **MessageService** | 메시지 저장 + 알림 로직 | sendMessage() 후 Slack 아웃바운드 훅 추가 |
| **Entity Settings UI** | 탭 기반 설정 페이지 | 새 "Slack 연동" 탭 추가 |
| **i18n 체계** | ko/en/vi JSON 번역 파일 | Slack 관련 키 추가 |

### 1.2 기술 스택 추가

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@slack/web-api` | latest | Slack API 클라이언트 (chat.postMessage, conversations.list 등) |

---

## 2. 단계별 구현 계획

### Phase 1: 기반 구조 (DB + Slack 모듈 스캐폴딩)

#### Task 1.1: DB 엔티티 & 마이그레이션

**파일 변경:**
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/slack-integration/entity/slack-workspace-config.entity.ts` | 신규 생성 |
| `apps/api/src/domain/slack-integration/entity/slack-channel-mapping.entity.ts` | 신규 생성 |
| `apps/api/src/domain/slack-integration/entity/slack-message-mapping.entity.ts` | 신규 생성 |

**Entity 설계:**

```typescript
// slack-workspace-config.entity.ts
@Entity('amb_slack_workspace_configs')
export class SlackWorkspaceConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'swc_id' })
  swcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'swc_team_id', length: 50 })
  swcTeamId: string;

  @Column({ name: 'swc_team_name', length: 200 })
  swcTeamName: string;

  @Column({ name: 'swc_bot_token_enc', type: 'text' })
  swcBotTokenEnc: string;

  @Column({ name: 'swc_bot_token_iv', length: 100 })
  swcBotTokenIv: string;

  @Column({ name: 'swc_bot_token_tag', length: 100 })
  swcBotTokenTag: string;

  @Column({ name: 'swc_bot_user_id', length: 50 })
  swcBotUserId: string;

  @Column({ name: 'swc_app_id', length: 50, nullable: true })
  swcAppId: string;

  @Column({ name: 'swc_signing_secret_enc', type: 'text' })
  swcSigningSecretEnc: string;

  @Column({ name: 'swc_signing_secret_iv', length: 100 })
  swcSigningSecretIv: string;

  @Column({ name: 'swc_signing_secret_tag', length: 100 })
  swcSigningSecretTag: string;

  @Column({ name: 'swc_is_active', default: true })
  swcIsActive: boolean;

  @Column({ name: 'swc_connected_at', type: 'timestamp' })
  swcConnectedAt: Date;

  @Column({ name: 'swc_connected_by', type: 'uuid' })
  swcConnectedBy: string;

  @CreateDateColumn({ name: 'swc_created_at' })
  swcCreatedAt: Date;

  @UpdateDateColumn({ name: 'swc_updated_at' })
  swcUpdatedAt: Date;

  @DeleteDateColumn({ name: 'swc_deleted_at' })
  swcDeletedAt: Date;
}
```

```typescript
// slack-channel-mapping.entity.ts
@Entity('amb_slack_channel_mappings')
export class SlackChannelMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'scm_id' })
  scmId: string;

  @Column({ name: 'swc_id', type: 'uuid' })
  swcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'scm_slack_channel_id', length: 50 })
  scmSlackChannelId: string;

  @Column({ name: 'scm_slack_channel_name', length: 200 })
  scmSlackChannelName: string;

  @Column({ name: 'chn_id', type: 'uuid' })
  chnId: string;

  @Column({ name: 'scm_status', length: 20, default: 'ACTIVE' })
  scmStatus: string;  // ACTIVE | PAUSED | DISCONNECTED

  @Column({ name: 'scm_direction', length: 20, default: 'BIDIRECTIONAL' })
  scmDirection: string;  // BIDIRECTIONAL | INBOUND_ONLY | OUTBOUND_ONLY

  @CreateDateColumn({ name: 'scm_created_at' })
  scmCreatedAt: Date;

  @UpdateDateColumn({ name: 'scm_updated_at' })
  scmUpdatedAt: Date;

  @DeleteDateColumn({ name: 'scm_deleted_at' })
  scmDeletedAt: Date;
}
```

```typescript
// slack-message-mapping.entity.ts
@Entity('amb_slack_message_mappings')
@Unique(['scmId', 'smmSlackTs'])
@Index(['smmSlackThreadTs'])
export class SlackMessageMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'smm_id' })
  smmId: string;

  @Column({ name: 'scm_id', type: 'uuid' })
  scmId: string;

  @Column({ name: 'smm_slack_ts', length: 50 })
  smmSlackTs: string;

  @Column({ name: 'smm_slack_thread_ts', length: 50, nullable: true })
  smmSlackThreadTs: string;

  @Column({ name: 'msg_id', type: 'uuid' })
  msgId: string;

  @Column({ name: 'smm_direction', length: 10 })
  smmDirection: string;  // INBOUND | OUTBOUND

  @CreateDateColumn({ name: 'smm_created_at' })
  smmCreatedAt: Date;
}
```

---

#### Task 1.2: NestJS 모듈 스캐폴딩

**신규 파일 구조:**
```
apps/api/src/domain/slack-integration/
├── slack-integration.module.ts
├── entity/
│   ├── slack-workspace-config.entity.ts
│   ├── slack-channel-mapping.entity.ts
│   └── slack-message-mapping.entity.ts
├── controller/
│   ├── slack-oauth.controller.ts
│   ├── slack-webhook.controller.ts
│   └── slack-admin.controller.ts
├── service/
│   ├── slack-api.service.ts         # @slack/web-api 래핑
│   ├── slack-oauth.service.ts       # OAuth 2.0 흐름
│   ├── slack-event.service.ts       # 이벤트 처리 (Inbound)
│   ├── slack-outbound.service.ts    # AMA→Slack 전송 (Outbound)
│   └── slack-workspace.service.ts   # 워크스페이스/채널 설정 CRUD
└── dto/
    ├── slack-oauth.dto.ts
    ├── slack-channel-mapping.dto.ts
    └── slack-event.dto.ts
```

**모듈 등록:**

> **⚠️ 사이드 임팩트 분석 업데이트**: `forwardRef(() => AmoebaTalkModule)` 제거 → `EventEmitter2` 기반 느슨한 결합으로 변경. SlackOutboundService가 `@OnEvent` 데코레이터로 이벤트를 수신하므로 AmoebaTalkModule과의 직접 의존성 불필요. TalkSseService는 Inbound 처리 시 필요하므로 별도 import.

```typescript
// slack-integration.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SlackWorkspaceConfigEntity,
      SlackChannelMappingEntity,
      SlackMessageMappingEntity,
      TalkMessageEntity,        // Inbound 메시지 저장용
    ]),
    HttpModule,                 // Slack API 호출용
  ],
  controllers: [
    SlackOAuthController,
    SlackWebhookController,
    SlackAdminController,
  ],
  providers: [
    SlackApiService,
    SlackOAuthService,
    SlackEventService,
    SlackOutboundService,       // @OnEvent로 이벤트 수신 (AmoebaTalkModule 미의존)
    SlackWorkspaceService,
  ],
  exports: [],  // AmoebaTalkModule에서 직접 사용하지 않음 (이벤트 기반)
})
```

---

### Phase 1.5: Raw Body 미들웨어 & 메뉴 권한 마이그레이션

> **⚠️ 사이드 임팩트 분석 결과 추가된 Task**

#### Task 1.5.1: Raw Body 캡처 미들웨어 추가

**배경**: `main.ts`에서 `bodyParser: false` 설정 후 `express.json({ limit: '50mb' })`를 수동 사용 중. Slack Webhook 서명 검증에는 raw body 접근이 필수.

**파일 변경:**
| 파일 | 작업 |
|------|------|
| `apps/api/src/main.ts` | Slack webhook 경로에 raw body 캡처 미들웨어 추가 |

**구현:**
```typescript
// main.ts — Slack webhook raw body 캡처
import { json as expressJson, raw as expressRaw } from 'express';

// Slack webhook 경로만 raw body 캡처
app.use('/api/v1/webhooks/slack', expressRaw({ type: 'application/json' }));
// 나머지는 기존 JSON 파서 유지
app.use(expressJson({ limit: '50mb' }));
```

**위험도**: **하** — Slack webhook 경로에만 적용, 기존 라우트 영향 없음

#### Task 1.5.2: 메뉴 권한 마이그레이션 SQL

**배경**: Entity Settings에 Slack 탭 추가 시 `amb_menu_config` + `amb_menu_permissions` 레코드 필요. 기존 패턴은 `sql/migration_master_role.sql` 참조.

**파일 변경:**
| 파일 | 작업 |
|------|------|
| `sql/migration_slack_integration.sql` | 신규 — 메뉴 코드 + 역할별 권한 INSERT |

**SQL:**
```sql
-- amb_menu_config: Slack 연동 메뉴 추가
INSERT INTO amb_menu_config (mcf_menu_code, mcf_enabled, mcf_sort_order, mcf_label_key, mcf_icon, mcf_path, mcf_category)
VALUES ('ENTITY_SLACK_INTEGRATION', true, 960, 'settings.entitySlack', 'MessageSquare', '/entity-settings/slack-integration', 'ENTITY_SETTINGS')
ON CONFLICT (mcf_menu_code) DO NOTHING;

-- amb_menu_permissions: MASTER, SUPER_ADMIN, ADMIN만 접근 허용
INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES
  ('ENTITY_SLACK_INTEGRATION', 'MASTER', true),
  ('ENTITY_SLACK_INTEGRATION', 'SUPER_ADMIN', true),
  ('ENTITY_SLACK_INTEGRATION', 'ADMIN', true),
  ('ENTITY_SLACK_INTEGRATION', 'MANAGER', false),
  ('ENTITY_SLACK_INTEGRATION', 'USER', false)
ON CONFLICT DO NOTHING;
```

---

### Phase 2: OAuth 2.0 & 워크스페이스 연결

#### Task 2.1: Slack OAuth 흐름 구현

**파일 변경:**
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/slack-integration/controller/slack-oauth.controller.ts` | 신규 |
| `apps/api/src/domain/slack-integration/service/slack-oauth.service.ts` | 신규 |
| `env/backend/.env.development` | SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET 추가 |

**API 엔드포인트:**

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/v1/slack/oauth/install` | Slack OAuth 시작 → Slack authorize URL로 redirect |
| `GET` | `/api/v1/slack/oauth/callback` | Slack OAuth 콜백 → Bot Token 획득 & 저장 |

**구현 핵심:**
```typescript
// slack-oauth.service.ts
async startInstall(entityId: string, userId: string): Promise<string> {
  const state = this.jwtService.sign({ entityId, userId }, { expiresIn: '10m' });
  const scopes = 'channels:history,channels:read,channels:join,chat:write,users:read,users:read.email';
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
}

async handleCallback(code: string, state: string): Promise<void> {
  const { entityId, userId } = this.jwtService.verify(state);
  // POST https://slack.com/api/oauth.v2.access
  const response = await this.slackApi.oauthAccess(code, redirectUri);
  // Bot Token 암호화 저장
  const encrypted = this.cryptoService.encrypt(response.access_token);
  await this.workspaceRepo.save({
    entId: entityId,
    swcTeamId: response.team.id,
    swcTeamName: response.team.name,
    swcBotTokenEnc: encrypted.encrypted,
    swcBotTokenIv: encrypted.iv,
    swcBotTokenTag: encrypted.tag,
    swcBotUserId: response.bot_user_id,
    swcIsActive: true,
    swcConnectedAt: new Date(),
    swcConnectedBy: userId,
  });
}
```

#### Task 2.2: 워크스페이스 관리 API

**API 엔드포인트:**

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/v1/entity-settings/slack/workspaces` | 워크스페이스 연결 목록 조회 |
| `DELETE` | `/api/v1/entity-settings/slack/workspaces/:id` | 특정 워크스페이스 연결 해제 |
| `GET` | `/api/v1/entity-settings/slack/workspaces/:id/channels` | 해당 워크스페이스 Slack 채널 목록 조회 |

---

### Phase 3: 채널 매핑 관리

#### Task 3.1: 채널 매핑 CRUD API

**파일 변경:**
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/slack-integration/controller/slack-admin.controller.ts` | 신규 |
| `apps/api/src/domain/slack-integration/service/slack-workspace.service.ts` | 신규 |
| `apps/api/src/domain/slack-integration/dto/slack-channel-mapping.dto.ts` | 신규 |

**API 엔드포인트:**

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/v1/entity-settings/slack/mappings` | 채널 매핑 목록 |
| `POST` | `/api/v1/entity-settings/slack/mappings` | 채널 매핑 생성 |
| `PATCH` | `/api/v1/entity-settings/slack/mappings/:id` | 매핑 수정 (상태, 방향) |
| `DELETE` | `/api/v1/entity-settings/slack/mappings/:id` | 매핑 삭제 |

**매핑 생성 시 로직:**
1. 워크스페이스(swc_id) 선택 확인
2. Slack 채널 ID 유효성 검증 (conversations.info via 해당 워크스페이스 Bot Token)
3. AMA 채널 존재 여부 확인 또는 신규 생성
4. 중복 매핑 방지 검사 (같은 Slack 채널 이중 매핑 불가)
5. Slack 채널에 Bot 자동 참여 (conversations.join)
6. DB 저장

---

### Phase 4: Slack → AMA 메시지 수신 (Inbound)

#### Task 4.1: Webhook 수신 엔드포인트

**파일 변경:**
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/slack-integration/controller/slack-webhook.controller.ts` | 신규 |
| `apps/api/src/domain/slack-integration/service/slack-event.service.ts` | 신규 |

**엔드포인트:**

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/v1/webhooks/slack/events` | Slack Events API 수신 (public, auth 불필요) |

> **⚠️ 사이드 임팩트 분석 업데이트**: 기존 Postal Webhook 패턴(`@Public()` 데코레이터, `@HttpCode(200)`, 항상 200 반환) 준수. `main.ts`에서 `/api/v1/webhooks/slack` 경로에 raw body 미들웨어 적용 필요 (Task 1.5.1).

**구현 핵심:**
```typescript
// slack-webhook.controller.ts
@Public()  // ← 인증 불필요 (Postal Webhook 패턴 동일)
@Post('events')
@HttpCode(200)
async handleEvents(@Req() req: Request, @Body() body: any) {
  // 1. URL Verification (최초 등록 시)
  if (body.type === 'url_verification') {
    return { challenge: body.challenge };
  }

  // 2. 서명 검증 (req.rawBody 사용 — Task 1.5.1에서 설정)
  await this.slackEventService.verifySignature(req);

  // 3. 즉시 200 응답 (3초 제한), 비동기 처리
  // NestJS에서는 이벤트 기반 비동기 처리
  this.slackEventService.processEvent(body).catch(err => {
    this.logger.error('Slack event processing failed', err);
  });

  return { ok: true };
}
```

#### Task 4.2: 이벤트 처리 로직

```typescript
// slack-event.service.ts
async processEvent(payload: SlackEventPayload): Promise<void> {
  if (payload.type !== 'event_callback') return;

  const event = payload.event;
  const teamId = payload.team_id;

  // 워크스페이스 설정 조회
  const workspace = await this.findWorkspaceByTeamId(teamId);
  if (!workspace || !workspace.swcIsActive) return;

  // Bot 자체 메시지 무시 (루프 방지 #1)
  if (event.bot_id || event.user === workspace.swcBotUserId) return;

  switch (event.type) {
    case 'message':
      if (!event.subtype) {
        await this.handleNewMessage(workspace, event);
      } else if (event.subtype === 'message_changed') {
        await this.handleMessageChanged(workspace, event);
      } else if (event.subtype === 'message_deleted') {
        await this.handleMessageDeleted(workspace, event);
      }
      break;
  }
}

async handleNewMessage(workspace, event): Promise<void> {
  // 채널 매핑 조회
  const mapping = await this.findActiveMapping(workspace.swcId, event.channel);
  if (!mapping) return;
  if (mapping.scmDirection === 'OUTBOUND_ONLY') return;

  // 이미 처리된 메시지 체크 (루프 방지 #2)
  const existing = await this.messageMappingRepo.findOne({
    where: { scmId: mapping.scmId, smmSlackTs: event.ts }
  });
  if (existing) return;

  // Slack 사용자 정보 조회
  const userName = await this.slackApi.getUserDisplayName(workspace, event.user);

  // AMA 메시지 저장 (시스템 사용자)
  const content = `[Slack] ${userName}: ${event.text}`;
  const message = await this.talkMessageRepo.save({
    chnId: mapping.chnId,
    usrId: SYSTEM_USER_ID,  // 또는 slack-bot 전용 사용자
    msgContent: content,
    msgType: 'TEXT',
    msgParentId: await this.resolveThreadParent(mapping, event.thread_ts),
  });

  // 메시지 매핑 저장
  await this.messageMappingRepo.save({
    scmId: mapping.scmId,
    smmSlackTs: event.ts,
    smmSlackThreadTs: event.thread_ts || null,
    msgId: message.msgId,
    smmDirection: 'INBOUND',
  });

  // SSE 브로드캐스트 (기존 파이프라인 활용)
  // ⚠️ 사이드 임팩트 분석: 일반 메시지의 SSE emit은 MessageController에서 발생하지만,
  //    Slack inbound는 Controller 경유 없이 Service에서 직접 처리하므로 여기서 emit 호출.
  //    ChannelService.markAsRead()에서 channel:read를 Service에서 직접 emit하는 선례가 있음.
  this.talkSseService.emit({
    channelId: mapping.chnId,
    type: 'message:new',
    data: message,
  });
}
```

---

### Phase 5: AMA → Slack 메시지 전송 (Outbound)

#### Task 5.1: Outbound 서비스 (EventEmitter2 기반)

> **⚠️ 사이드 임팩트 분석 업데이트**: 원래 계획은 `MessageService`에 `SlackOutboundService`를 직접 주입하는 방식이었으나, 실제 코드 분석 결과 다음 문제를 발견:
> 1. **순환 의존성**: `AmoebaTalkModule ↔ SlackIntegrationModule` 상호 참조 발생
> 2. **SSE emit 위치**: 실제로 `message:new` SSE emit은 `MessageController`에서 발생 (Service가 아님)
> 3. **결합도**: MessageService는 순수 비즈니스 로직만 담당하는 것이 기존 패턴
>
> **해결: EventEmitter2 이벤트 기반 느슨한 결합** — 이미 KMS 이벤트(`MODULE_DATA_EVENTS.CREATED`)가 동일 패턴으로 구현되어 있으므로 이를 따름.

**파일 변경:**
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/slack-integration/service/slack-outbound.service.ts` | 신규 |
| `apps/api/src/domain/slack-integration/event/slack-outbound.event.ts` | 신규 — 이벤트 상수 정의 |
| `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | 수정 — Slack 아웃바운드 이벤트 발행 추가 |

**구현 핵심:**
```typescript
// slack-outbound.service.ts
async trySendToSlack(channelId: string, message: TalkMessageEntity, senderName: string): Promise<void> {
  // 1. 채널 매핑 조회
  const mapping = await this.channelMappingRepo.findOne({
    where: { chnId: channelId, scmStatus: 'ACTIVE' },
    relations: ['workspace'],
  });
  if (!mapping) return;
  if (mapping.scmDirection === 'INBOUND_ONLY') return;

  // 2. Slack 발 메시지는 재전송하지 않음 (루프 방지 #3)
  const isFromSlack = await this.messageMappingRepo.findOne({
    where: { msgId: message.msgId, smmDirection: 'INBOUND' }
  });
  if (isFromSlack) return;

  // 3. Bot Token 복호화
  const botToken = this.cryptoService.decrypt(
    mapping.workspace.swcBotTokenEnc,
    mapping.workspace.swcBotTokenIv,
    mapping.workspace.swcBotTokenTag,
  );

  // 4. Slack API 전송
  const text = `[AMA] ${senderName}: ${message.msgContent}`;
  const threadTs = await this.resolveSlackThreadTs(mapping, message.msgParentId);

  const result = await this.slackApi.postMessage(botToken, {
    channel: mapping.scmSlackChannelId,
    text,
    thread_ts: threadTs || undefined,
  });

  // 5. 메시지 매핑 저장 (루프 방지용)
  if (result.ok) {
    await this.messageMappingRepo.save({
      scmId: mapping.scmId,
      smmSlackTs: result.ts,
      smmSlackThreadTs: threadTs || null,
      msgId: message.msgId,
      smmDirection: 'OUTBOUND',
    });
  }
}
```

#### Task 5.2: MessageController에서 Slack 아웃바운드 이벤트 발행

> **⚠️ 변경**: MessageService 수정 → **MessageController에서 EventEmitter2로 이벤트 발행** 방식으로 전환.
> 기존 패턴과 동일하게 Controller에서 Service 호출 후 사이드 이펙트를 처리.

```typescript
// slack-outbound.event.ts
export const SLACK_OUTBOUND_EVENTS = {
  MESSAGE_CREATED: 'slack.outbound.message.created',
};

export interface SlackOutboundMessageEvent {
  channelId: string;
  messageId: string;
  content: string;
  senderName: string;
  parentId?: string;
}
```

```typescript
// message.controller.ts (기존 sendMessage 엔드포인트 수정)
// sendMessage() 메서드 내 — TalkSseService.emit() 호출 직후

// === 신규 추가: Slack 아웃바운드 이벤트 발행 ===
this.eventEmitter.emit(SLACK_OUTBOUND_EVENTS.MESSAGE_CREATED, {
  channelId,
  messageId: data.id,
  content: data.content,
  senderName: data.senderName,
  parentId: data.parentMessage?.id,
} as SlackOutboundMessageEvent);
```

```typescript
// slack-outbound.service.ts — 이벤트 리스너
@Injectable()
export class SlackOutboundService {
  @OnEvent(SLACK_OUTBOUND_EVENTS.MESSAGE_CREATED, { async: true })
  async handleMessageCreated(event: SlackOutboundMessageEvent): Promise<void> {
    // trySendToSlack 로직 (기존 계획과 동일)
  }
}
```

**장점:**
- MessageService, AmoebaTalkModule 코드 변경 없음 (순환 의존성 제거)
- SlackIntegrationModule이 없어도 AmoebaTalkModule 정상 동작 (이벤트 리스너 없으면 무시)
- KMS 이벤트와 동일한 검증된 패턴

---

### Phase 6: 프론트엔드 UI

#### Task 6.1: Entity Settings - Slack 연동 탭

**신규 파일:**
```
apps/web/src/domain/entity-settings/components/
├── SlackIntegrationTab.tsx          # 메인 탭 컴포넌트
├── SlackWorkspaceConnection.tsx     # 워크스페이스 연결/해제 카드
├── SlackChannelMappingList.tsx      # 채널 매핑 목록
├── SlackChannelMappingForm.tsx      # 매핑 생성/수정 모달
└── SlackConnectionStatus.tsx        # 연결 상태 표시 배지
```

**수정 파일:**
| 파일 | 수정 내용 |
|------|----------|
| Entity Settings 페이지 라우팅 | Slack 탭 추가 |
| i18n `entitySettings.json` (ko/en/vi) | Slack 관련 번역 키 추가 |

**UI 구성:**

```
┌─────────────────────────────────────────┐
│ Entity Settings                          │
│ ┌──────┬──────┬──────┬──────┬─────────┐ │
│ │ 일반 │ AI   │ 사용량│ 통계 │ Slack   │ │
│ └──────┴──────┴──────┴──────┴─────────┘ │
│                                          │
│ ◼ Slack 워크스페이스                      │
│ ┌──────────────────────────────────────┐ │
│ │ 상태: 🟢 연결됨                       │ │
│ │ 워크스페이스: Amoeba Global           │ │
│ │ 연결 일시: 2026-03-22 14:00          │ │
│ │ [연결 해제]                           │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ◼ 채널 매핑                [+ 채널 추가]  │
│ ┌──────────────────────────────────────┐ │
│ │ 워크스페이스 선택   AMA 채널    방향 상태 │ │
│ │ #general     → 일반       ↔  🟢     │ │
│ │ #dev-team    → 개발팀     ↔  🟢     │ │
│ │ #marketing   → 마케팅     →  🟡     │ │
│ └──────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Task 6.2: i18n 번역 키

```json
// entitySettings.json 추가분
{
  "slack": {
    "title": "Slack 연동",
    "workspace": {
      "title": "Slack 워크스페이스",
      "connect": "Slack 연결",
      "disconnect": "연결 해제",
      "connected": "연결됨",
      "disconnected": "연결 안됨",
      "connectedAt": "연결 일시",
      "workspaceName": "워크스페이스 이름",
      "confirmDisconnect": "Slack 워크스페이스 연결을 해제하시겠습니까? 모든 채널 매핑이 비활성화됩니다."
    },
    "channelMapping": {
      "title": "채널 매핑",
      "add": "채널 추가",
      "slackChannel": "Slack 채널",
      "amaChannel": "AMA 채널",
      "direction": "방향",
      "status": "상태",
      "bidirectional": "양방향",
      "inboundOnly": "Slack → AMA",
      "outboundOnly": "AMA → Slack",
      "active": "활성",
      "paused": "일시정지",
      "disconnected": "해제",
      "createNew": "새 AMA 채널 생성",
      "selectExisting": "기존 채널 선택",
      "confirmDelete": "이 채널 매핑을 삭제하시겠습니까?"
    }
  }
}
```

#### Task 6.3: Lobby Chat UI 표시 개선

**수정 파일:**
| 파일 | 수정 내용 |
|------|----------|
| `ChatMessageItem.tsx` (또는 유사) | `[Slack]` prefix 메시지 스타일링 (아이콘, 색상 구분) |
| `ChannelListItem.tsx` (또는 유사) | Slack 연동 채널에 Slack 아이콘 뱃지 표시 |

---

### Phase 7: 테스트 & 배포

#### Task 7.1: 테스트

| 테스트 유형 | 대상 | 방법 |
|------------|------|------|
| **Webhook 서명 검증** | SlackWebhookController | 수동: Slack test payload |
| **OAuth 흐름** | SlackOAuthController | 실제 Slack 워크스페이스 연결 |
| **Inbound 메시지** | SlackEventService | Slack에서 메시지 → AMA 확인 |
| **Outbound 메시지** | SlackOutboundService | AMA에서 메시지 → Slack 확인 |
| **무한 루프** | 양방향 | AMA→Slack→Events→AMA 루프 미발생 확인 |
| **스레드 매핑** | 양방향 | Slack 스레드 ↔ AMA 스레드 매핑 확인 |
| **연결 해제** | SlackWorkspaceService | 해제 후 메시지 전송 중단 확인 |

#### Task 7.2: 배포

```bash
# 1. 스테이징 배포
ssh amb-staging "cd ~/ambManagement && git pull origin main && bash docker/staging/deploy-staging.sh"

# 2. Slack App 설정
# - https://api.slack.com/apps 에서 App 생성
# - Bot Token Scopes 설정
# - Events API Request URL: https://stg-ama.amoeba.site/api/v1/webhooks/slack/events
# - 환경변수 설정: SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_SIGNING_SECRET
```

---

## 3. 사이드 임팩트 분석

> **2026-03-22 업데이트**: 실제 코드 기반 분석 완료. 원래 계획 대비 주요 변경사항 반영.

### 3.0 코드 분석 결과 주요 발견사항

| # | 발견사항 | 원래 가정 | 실제 코드 | 영향 |
|---|---------|----------|----------|------|
| 1 | **SSE emit 위치** | Service에서 emit | **Controller**에서 emit (MessageController L96-100) | Inbound는 Service에서 직접 emit (ChannelService 선례 있음) |
| 2 | **순환 의존성** | forwardRef로 해결 | MessageService에 SlackOutbound 주입 시 순환 참조 발생 | **EventEmitter2 기반으로 전환** (KMS 이벤트 패턴) |
| 3 | **Raw Body** | 미고려 | `main.ts`에 `bodyParser: false` + `express.json()` 사용 중 | Slack webhook 경로에 raw body 미들웨어 추가 필요 |
| 4 | **메뉴 권한** | 미고려 | `amb_menu_config` + `amb_menu_permissions` 테이블 기반 | SQL 마이그레이션 추가 필요 |
| 5 | **기존 Webhook** | Stripe(portal-api) 참조 | **Postal Webhook이 apps/api에 존재** (`@Public()` + token 검증) | 동일 패턴 적용 |
| 6 | **autoLoadEntities** | 미확인 | `autoLoadEntities: true` 설정됨 | Entity 파일만 생성하면 자동 등록 |
| 7 | **MessageService 의존성** | SlackOutbound 직접 주입 | EventEmitter2 이미 주입되어 있음 | 이벤트 발행으로 대체, MessageService 변경 **불필요** |

### 3.1 기존 코드 변경 영향 (업데이트)

| 변경 대상 | 영향 범위 | 위험도 | 대응 |
|----------|----------|--------|------|
| ~~`MessageService.sendMessage()`~~ | ~~모든 메시지 전송~~ | ~~중~~ | **변경 취소** — EventEmitter2로 대체, Service 수정 불필요 |
| `MessageController.sendMessage()` | sendMessage 엔드포인트 | **하** | EventEmitter2.emit() 1줄 추가 (fire-and-forget) |
| ~~`AmoebaTalkModule`~~ | ~~모듈 의존성 추가~~ | ~~하~~ | **변경 취소** — 순환 의존성 회피, 모듈 수정 불필요 |
| `TalkSseService` | Slack 발 메시지 SSE 전파 | **하** | 기존 emit() 메서드 그대로 사용 (SlackEventService에서 직접 호출) |
| `main.ts` | Slack Webhook raw body | **하** | `/api/v1/webhooks/slack` 경로에만 raw body 미들웨어 추가 |
| Entity Settings UI 라우팅 | 새 탭 + 메뉴 추가 | **하** | 기존 탭 구조 확장, SQL 마이그레이션 추가 |
| `app.module.ts` | SlackIntegrationModule import | **하** | imports 배열에 1줄 추가 |

### 3.2 성능 영향

| 항목 | 영향 | 대응 |
|------|------|------|
| 메시지 전송 지연 | Slack API 호출 추가 (100~300ms) | **EventEmitter2 비동기 처리** — Controller 응답 후 백그라운드 실행 |
| DB 쿼리 증가 | 매핑 조회 1회/메시지 | 인덱스 최적화 (scm_status + chn_id), 캐싱 고려 |
| Webhook 부하 | Slack 이벤트 수신 (채널 활발도에 비례) | 비동기 큐 처리, 즉시 200 응답 |
| **Slack 미연동 시** | 매핑 테이블 조회만 추가 | 레코드 없으면 즉시 return (오버헤드 무시 가능) |

### 3.3 의존성 체인 (업데이트)

```
SlackIntegrationModule
  ├── depends → SettingsModule (CryptoService)
  ├── depends → TypeOrmModule.forFeature([SlackEntities + TalkMessageEntity])
  ├── depends → HttpModule (Slack API 호출)
  ├── depends → JwtModule (OAuth state)
  ├── listens → EventEmitter2: 'slack.outbound.message.created'
  └── uses   → TalkSseService (SlackEventService에서 직접 import, 별도 주입)

AmoebaTalkModule (수정 없음)
  └── emits → EventEmitter2: 'slack.outbound.message.created' (MessageController에서)

AppModule
  └── imports → SlackIntegrationModule (신규 추가)
```

### 3.4 기존 기능 회귀 테스트 항목

| 테스트 항목 | 검증 내용 |
|------------|----------|
| Lobby Chat 일반 메시지 | Slack 미연동 채널에서 메시지 전송/수신 정상 동작 |
| 메시지 번역 | 동시번역 후 SSE + KMS 이벤트 정상 발행 |
| 푸시 알림 | 멘션 알림, 뮤트 설정 기존대로 동작 |
| 파일 첨부 | 파일 업로드 + 첨부파일 표시 정상 |
| Entity Settings 접근 | 기존 탭 (Members, Permissions 등) 정상 접근 |
| Postal Webhook | 이메일 수신 webhook 기존대로 동작 (raw body 미들웨어 영향 없음) |

---

## 4. 환경 변수 추가

```env
# Slack App 설정 (env/backend/.env.development)
SLACK_CLIENT_ID=your-slack-app-client-id
SLACK_CLIENT_SECRET=your-slack-app-client-secret
SLACK_SIGNING_SECRET=your-slack-app-signing-secret
SLACK_OAUTH_REDIRECT_URI=http://localhost:3009/api/v1/slack/oauth/callback
```

```env
# 스테이징 (docker/staging/.env.staging)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_OAUTH_REDIRECT_URI=https://stg-ama.amoeba.site/api/v1/slack/oauth/callback
```

---

## 5. Slack App 생성 가이드

### 5.1 사전 작업 (수동)

1. https://api.slack.com/apps → "Create New App" → "From scratch"
2. App Name: `AMA Bot`, Workspace: 대상 워크스페이스 선택
3. **OAuth & Permissions** → Bot Token Scopes 추가:
   - `channels:history`, `channels:read`, `channels:join`
   - `chat:write`, `users:read`, `users:read.email`
4. **Event Subscriptions** → Enable Events → Request URL:
   - 스테이징: `https://stg-ama.amoeba.site/api/v1/webhooks/slack/events`
   - 프로덕션: `https://ama.amoeba.site/api/v1/webhooks/slack/events`
5. Subscribe to bot events: `message.channels`
6. **Basic Information** → Signing Secret 복사 → 환경변수에 등록
7. **Install to Workspace** → Bot Token 확인

---

## 6. 작업 순서 및 체크리스트

| # | Phase | Task | 의존성 | 주요 파일 | 기존 코드 수정 |
|---|-------|------|--------|----------|---------------|
| 1 | 기반 | npm install `@slack/web-api` | - | package.json | ❌ 신규 |
| 2 | 기반 | Entity 3개 생성 | - | entity/*.entity.ts | ❌ 신규 |
| 3 | 기반 | Module 스캐폴딩 | #2 | slack-integration.module.ts | ❌ 신규 |
| 3.5 | 기반 | app.module.ts에 SlackIntegrationModule 등록 | #3 | app.module.ts | ✅ 1줄 추가 |
| 4 | 기반 | Raw Body 미들웨어 추가 | - | main.ts | ✅ 3줄 추가 |
| 5 | 기반 | 메뉴 권한 마이그레이션 SQL | - | migration_slack_integration.sql | ❌ 신규 |
| 6 | OAuth | OAuth Controller + Service | #3 | slack-oauth.*.ts | ❌ 신규 |
| 7 | OAuth | Workspace 관리 API | #3 | slack-workspace.service.ts | ❌ 신규 |
| 8 | 매핑 | 채널 매핑 CRUD API | #7 | slack-admin.controller.ts | ❌ 신규 |
| 9 | Inbound | Webhook 수신 엔드포인트 | #3, #4 | slack-webhook.controller.ts | ❌ 신규 |
| 10 | Inbound | 이벤트 처리 (Slack→AMA) | #8, #9 | slack-event.service.ts | ❌ 신규 |
| 11 | Outbound | Slack 아웃바운드 이벤트 정의 | - | slack-outbound.event.ts | ❌ 신규 |
| 12 | Outbound | AMA→Slack 전송 서비스 (EventEmitter2 리스너) | #8, #11 | slack-outbound.service.ts | ❌ 신규 |
| 13 | Outbound | MessageController에 이벤트 발행 추가 | #11 | message.controller.ts | ✅ 5줄 추가 |
| 14 | UI | Slack 연동 탭 (Entity Settings) | #5, #6, #7, #8 | EntitySlackIntegrationPage.tsx 등 | ✅ 라우터 + 메뉴 항목 |
| 15 | UI | Lobby Chat Slack 메시지 스타일링 | #10 | TalkMessageList.tsx | ✅ 조건부 스타일링 |
| 16 | i18n | Slack 번역 키 추가 | - | entitySettings.json (ko/en/vi) | ✅ JSON 키 추가 |
| 17 | 테스트 | E2E 양방향 테스트 + 회귀 테스트 | #1~#16 | 수동 테스트 |
| 18 | 배포 | 환경변수 + 스테이징 배포 | #17 | .env.staging |

**기존 코드 수정 요약**: 전체 18개 Task 중 **5개만 기존 코드 수정** (나머지 13개는 신규 생성)

---

## 7. 리스크 대응 계획

| Risk | 확률 | 영향 | 대응 |
|------|------|------|------|
| Slack API Rate Limit 초과 | 중 | 메시지 지연 | Retry-After 준수, 큐 기반 전송 |
| OAuth Token 만료 | 하 | 전송 중단 | Bot Token은 만료 안됨 (revoke만) |
| Events API 3초 제한 | 중 | 이벤트 재전송 | 즉시 200 응답 + 비동기 처리 |
| Bot 메시지 무한 루프 | 고 | 시스템 과부하 | 3중 방어 (bot_id + mapping + source 플래그) |
| 스레드 매핑 불일치 | 중 | UX 혼란 | thread_ts ↔ msg_parent_id 매핑 테이블 |
| Slack 서비스 장애 | 하 | 아웃바운드 실패 | fire-and-forget + 에러 로깅, AMA 정상 동작 보장 |
