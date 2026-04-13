# Menu-Sitemap 갭 해소 작업 계획서

> **작성일**: 2026-02-18 (rev.2 — 사이드 임팩트 검증 완료)
> **기반 문서**: docs/analysis/menu-sitemap-gap-analysis.md (rev.2)
> **목표**: Menu-Sitemap-Detail.md 스펙 100% 달성 + 라우트 보호 완성

---

## 0. rev.2 변경 사항 (사이드 임팩트 검증 결과)

### 삭제 항목
- ~~G-05 SERVICE_MANAGEMENT 정리~~ → 이미 완전 구현됨 (BE 3컨트롤러 + FE 8페이지 + 라우트 + MenuGuard)

### 추가 발견된 사이드 임팩트

| # | 항목 | 영향 | 조치 방안 |
|---|------|------|----------|
| SI-01 | 설정 라우트 MenuGuard 전환 시 SETTINGS_* 메뉴가 `DEFAULT_MENU_CONFIGS`에 없음 | MenuGuard가 SETTINGS_* 메뉴를 찾지 못해 접근 차단됨 | **Phase 1 선행**: SETTINGS_* 6개를 DEFAULT_MENU_CONFIGS에 추가 |
| SI-02 | CHAT 라우트는 동적 department 파라미터 사용 | 단일 menuCode로 MenuGuard 불가 | ChatMenuGuard 전용 컴포넌트에서 useParams → CHAT_* 매핑 |
| SI-03 | `app.module.ts`에 이미 ServiceManagementModule이 등록됨 | AmoebaTalkModule 추가 시 충돌 없음, entities 배열에 추가 필요 | entities 배열 끝에 추가 |
| SI-04 | `i18n.ts`에 이미 `service` 네임스페이스 등록됨 | `amoeba-talk` 네임스페이스 추가 시 기존 패턴 따라 3개 언어 파일 필요 | en/ko/vi JSON + ns 배열 추가 |
| SI-05 | `useMyPermissions()` deprecated 래퍼 존재 | 새 코드에서 사용 금지, `useMyMenus()` 사용 | 아메바톡에서 useMyMenus 사용 |
| SI-06 | MainLayout의 ICON_MAP에 Building2 추가됨 | 아메바톡이 별도 아이콘 필요 없음 (사이드바에 이미 표시) | 영향 없음 |

---

## 1. 작업 범위

### In Scope
- [G-01] 아메바톡 프론트엔드 구현 (스텁 → 실기능)
- [G-02] 아메바톡 백엔드 API 신규 개발
- [G-03] CHAT 라우트 MenuGuard 적용 (ChatMenuGuard 컴포넌트)
- [G-04] 설정 라우트 MenuGuard 전환 (SETTINGS_* DEFAULT_MENU_CONFIGS 추가 포함)

### Out of Scope
- 기존 PARTIAL 페이지의 기능 확장
- Menu-Sitemap-Detail.md 문서 자체 업데이트 (서비스관리 섹션 추가)

---

## 2. 작업 상세

### Phase 1: 라우트 보호 강화 (G-03, G-04) + 선행 조건 해결

#### Task 1.0 — SETTINGS_* 메뉴를 DEFAULT_MENU_CONFIGS에 추가 (SI-01 해결)

> **⚠️ G-04의 선행 조건**: 이 작업 없이 설정 라우트를 MenuGuard로 전환하면 접근 차단됨

**현재 상태**: `menu-config.service.ts`의 DEFAULT_MENU_CONFIGS에 14개 메뉴만 등록
- WORK_TOOL: TODO, AGENTS, MEETING_NOTES, AMOEBA_TALK, WORK_SCHEDULE, NOTICES, DOCUMENTS
- MODULE: ACCOUNTING, HR, BILLING, MAIL, PROJECT_MANAGEMENT, KMS, SERVICE_MANAGEMENT
- SETTINGS: ❌ 없음

**추가 필요 항목**:
```typescript
{ menuCode: 'SETTINGS_MEMBERS', labelKey: 'settings:nav.members', icon: 'Users', path: '/settings/members', category: 'SETTINGS', sortOrder: 2100 },
{ menuCode: 'SETTINGS_API_KEYS', labelKey: 'settings:nav.apiKeys', icon: 'Key', path: '/settings/api-keys', category: 'SETTINGS', sortOrder: 2200 },
{ menuCode: 'SETTINGS_SMTP', labelKey: 'settings:nav.smtp', icon: 'Mail', path: '/settings/smtp', category: 'SETTINGS', sortOrder: 2300 },
{ menuCode: 'SETTINGS_PERMISSIONS', labelKey: 'settings:nav.permissions', icon: 'Shield', path: '/settings/permissions', category: 'SETTINGS', sortOrder: 2400 },
{ menuCode: 'SETTINGS_DRIVE', labelKey: 'settings:nav.drive', icon: 'HardDrive', path: '/settings/drive', category: 'SETTINGS', sortOrder: 2500 },
{ menuCode: 'SETTINGS_ENTITIES', labelKey: 'settings:nav.entities', icon: 'Building', path: '/settings/entities', category: 'SETTINGS', sortOrder: 2600 },
```

**수정 파일**:
- `apps/api/src/domain/settings/service/menu-config.service.ts` — DEFAULT_MENU_CONFIGS에 6개 추가
- `apps/web/src/layouts/MainLayout.tsx` — ICON_MAP에 Key, Shield, HardDrive, Building 추가

#### Task 1.1 — ChatMenuGuard 컴포넌트 생성 (SI-02 해결)

**핵심 로직**: URL의 `:department` 파라미터를 CHAT_* 메뉴 코드로 매핑

```tsx
// ChatMenuGuard.tsx 핵심 로직
const DEPT_TO_MENU: Record<string, string> = {
  management: 'CHAT_MANAGEMENT',
  accounting: 'CHAT_ACCOUNTING',
  hr: 'CHAT_HR',
  legal: 'CHAT_LEGAL',
  sales: 'CHAT_SALES',
  it: 'CHAT_IT',
  marketing: 'CHAT_MARKETING',
  'general-affairs': 'CHAT_GENERAL_AFFAIRS',
  planning: 'CHAT_PLANNING',
};

const { department } = useParams();
const menuCode = DEPT_TO_MENU[department || ''];
// → MenuGuard와 동일 로직으로 권한 검증
```

**수정 파일**:
- `apps/web/src/components/common/ChatMenuGuard.tsx` (신규)
- `apps/web/src/router/index.tsx` (수정 — chat 라우트에 ChatMenuGuard 적용)

#### Task 1.2 — 설정 라우트 MenuGuard 전환

> ⚠️ Task 1.0 완료 후 진행

**변경 (7개 라우트)**:
```tsx
// Before
<AdminRoute><ApiKeyManagementPage /></AdminRoute>

// After
<MenuGuard menuCode="SETTINGS_API_KEYS"><ApiKeyManagementPage /></MenuGuard>
```

**수정 파일**:
- `apps/web/src/router/index.tsx` (수정)

---

### Phase 2: 아메바톡 백엔드 API (G-02)

#### Task 2.1 — DB 엔티티 설계

**테이블 설계** (기존 DB 네이밍 컨벤션 준수: `amb_` prefix + snake_case):

```
amb_talk_channels (채널)
├── chn_id          UUID PK
├── chn_name        VARCHAR(100)
├── chn_type        ENUM('PUBLIC', 'PRIVATE', 'DIRECT')
├── chn_description TEXT
├── ent_id          UUID FK → amb_entities
├── chn_created_by  UUID FK → amb_users
├── chn_created_at  TIMESTAMP
├── chn_updated_at  TIMESTAMP
├── chn_deleted_at  TIMESTAMP (soft delete)

amb_talk_channel_members (채널 멤버)
├── chm_id          UUID PK
├── chn_id          UUID FK → amb_talk_channels
├── usr_id          UUID FK → amb_users
├── chm_role        ENUM('OWNER', 'ADMIN', 'MEMBER')
├── chm_joined_at   TIMESTAMP
├── chm_left_at     TIMESTAMP

amb_talk_messages (메시지)
├── msg_id          UUID PK
├── chn_id          UUID FK → amb_talk_channels
├── usr_id          UUID FK → amb_users (발신자)
├── msg_content     TEXT
├── msg_type        ENUM('TEXT', 'FILE', 'SYSTEM')
├── msg_parent_id   UUID FK → self (스레드 답장)
├── msg_read_count  INT DEFAULT 0
├── msg_created_at  TIMESTAMP
├── msg_updated_at  TIMESTAMP
├── msg_deleted_at  TIMESTAMP (soft delete)

amb_talk_read_status (읽음 상태)
├── trs_id          UUID PK
├── chn_id          UUID FK → amb_talk_channels
├── usr_id          UUID FK → amb_users
├── trs_last_read_at TIMESTAMP
├── trs_last_msg_id  UUID FK → amb_talk_messages
```

#### Task 2.2 — NestJS 모듈 구조

```
apps/api/src/domain/amoeba-talk/
├── amoeba-talk.module.ts
├── controller/
│   ├── channel.controller.ts
│   └── message.controller.ts
├── service/
│   ├── channel.service.ts
│   ├── message.service.ts
│   └── talk-sse.service.ts
├── entity/
│   ├── talk-channel.entity.ts
│   ├── talk-channel-member.entity.ts
│   ├── talk-message.entity.ts
│   └── talk-read-status.entity.ts
├── dto/request/
│   ├── create-channel.request.ts
│   ├── update-channel.request.ts
│   ├── send-message.request.ts
│   └── update-message.request.ts
└── mapper/
    ├── channel.mapper.ts
    └── message.mapper.ts
```

#### Task 2.3 — API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/v1/talk/channels` | 내 채널 목록 |
| POST | `/api/v1/talk/channels` | 채널 생성 |
| GET | `/api/v1/talk/channels/:id` | 채널 상세 + 멤버 |
| PATCH | `/api/v1/talk/channels/:id` | 채널 수정 |
| DELETE | `/api/v1/talk/channels/:id` | 채널 삭제 (soft) |
| POST | `/api/v1/talk/channels/:id/members` | 멤버 초대 |
| DELETE | `/api/v1/talk/channels/:id/members/:userId` | 멤버 제거 |
| GET | `/api/v1/talk/channels/:id/messages` | 메시지 목록 (cursor 페이지네이션) |
| POST | `/api/v1/talk/channels/:id/messages` | 메시지 전송 |
| PATCH | `/api/v1/talk/messages/:id` | 메시지 수정 |
| DELETE | `/api/v1/talk/messages/:id` | 메시지 삭제 (soft) |
| POST | `/api/v1/talk/channels/:id/read` | 읽음 처리 |
| GET | `/api/v1/talk/unread` | 미읽 카운트 요약 |
| GET | `/api/v1/talk/channels/:id/sse` | SSE 실시간 이벤트 스트림 |

#### Task 2.4 — app.module.ts 등록 (SI-03)

```typescript
// 추가 필요
import { AmoebaTalkModule } from './domain/amoeba-talk/amoeba-talk.module';
// entities 배열에 4개 엔티티 추가
// imports 배열에 AmoebaTalkModule 추가
```

#### Task 2.5 — 에러 코드 추가

```
// error-code.constant.ts
E6001: CHANNEL_NOT_FOUND
E6002: CHANNEL_ACCESS_DENIED
E6003: CHANNEL_MEMBER_ALREADY_EXISTS
E6004: MESSAGE_NOT_FOUND
E6005: MESSAGE_ACCESS_DENIED
E6006: CANNOT_LEAVE_OWNED_CHANNEL
```

---

### Phase 3: 아메바톡 프론트엔드 (G-01)

#### Task 3.1 — 공유 타입 정의

**파일**: `packages/types/src/domain.types.ts`

```typescript
// Talk 관련 타입 추가
export interface TalkChannelResponse { ... }
export interface TalkMessageResponse { ... }
export interface TalkChannelMemberResponse { ... }
export interface TalkUnreadSummary { ... }
```

#### Task 3.2 — 서비스/훅 레이어

**파일**:
- `apps/web/src/domain/amoeba-talk/service/talk.service.ts`
- `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts`

**주요 훅** (SI-05: `useMyMenus()` 사용, `useMyPermissions()` 사용 금지):
```typescript
useMyChannels()            // 채널 목록
useChannelDetail(id)       // 채널 상세
useChannelMessages(id)     // 메시지 목록 (무한 스크롤)
useCreateChannel()         // 채널 생성
useSendMessage()           // 메시지 전송
useUpdateMessage()         // 메시지 수정
useDeleteMessage()         // 메시지 삭제
useMarkAsRead(channelId)   // 읽음 처리
useUnreadCounts()          // 미읽 카운트
useTalkSSE(channelId)      // SSE 구독
```

#### Task 3.3 — UI 컴포넌트

**레이아웃**: 3-column (채널목록 | 메시지 | 상세패널)

```
apps/web/src/domain/amoeba-talk/
├── pages/
│   └── AmoebaTalkPage.tsx        ← 기존 스텁 교체
├── components/
│   ├── ChannelList.tsx
│   ├── ChannelListItem.tsx
│   ├── CreateChannelModal.tsx
│   ├── MessageArea.tsx
│   ├── MessageItem.tsx
│   ├── MessageInput.tsx
│   ├── ChannelDetailPanel.tsx
│   └── MemberInviteModal.tsx
├── hooks/
│   └── useTalk.ts
└── service/
    └── talk.service.ts
```

#### Task 3.4 — i18n 번역 (SI-04)

기존 패턴 (`i18n.ts` 참고) 따라:
- `apps/web/src/locales/en/amoeba-talk.json` (신규)
- `apps/web/src/locales/ko/amoeba-talk.json` (신규)
- `apps/web/src/locales/vi/amoeba-talk.json` (신규)
- `apps/web/src/i18n.ts` — import 추가 + ns 배열에 `'amoeba-talk'` 추가

---

## 3. 작업 순서 및 의존성 (수정)

```
Task 1.0 (SETTINGS_* 메뉴 추가)
    │
    ├──→ Task 1.2 (설정 MenuGuard 전환)
    │
Task 1.1 (ChatMenuGuard) ──→ 라우트 적용
    │
    │   (Phase 1 완료)
    │
Task 2.1~2.5 (아메바톡 BE) ──→ Task 3.1 (타입)
                                   │
                                   ├──→ Task 3.2 (훅/서비스)
                                   │       │
                                   │       └──→ Task 3.3 (UI)
                                   │               │
                                   └──→ Task 3.4 (i18n)
```

**병렬 가능**:
- Phase 1 전체와 Phase 2는 독립적으로 병렬 진행 가능
- Phase 3은 Phase 2 완료 후 진행

---

## 4. 수정 파일 목록 (최종)

### 신규 파일 (~25개)

| 경로 | 설명 |
|------|------|
| `apps/web/src/components/common/ChatMenuGuard.tsx` | CHAT 라우트 가드 |
| `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` | 모듈 |
| `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts` | 채널 API |
| `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | 메시지 API |
| `apps/api/src/domain/amoeba-talk/service/channel.service.ts` | 채널 서비스 |
| `apps/api/src/domain/amoeba-talk/service/message.service.ts` | 메시지 서비스 |
| `apps/api/src/domain/amoeba-talk/service/talk-sse.service.ts` | SSE 서비스 |
| `apps/api/src/domain/amoeba-talk/entity/*.ts` | 엔티티 4개 |
| `apps/api/src/domain/amoeba-talk/dto/request/*.ts` | 요청 DTO 4개 |
| `apps/api/src/domain/amoeba-talk/mapper/*.ts` | 매퍼 2개 |
| `apps/web/src/domain/amoeba-talk/service/talk.service.ts` | FE 서비스 |
| `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts` | React Query 훅 |
| `apps/web/src/domain/amoeba-talk/components/*.tsx` | UI 컴포넌트 7개 |
| `apps/web/src/locales/*/amoeba-talk.json` | 번역 파일 3개 |

### 수정 파일 (~6개)

| 경로 | 수정 내용 | 사이드 임팩트 |
|------|----------|-------------|
| `apps/api/src/domain/settings/service/menu-config.service.ts` | SETTINGS_* 6개 DEFAULT_MENU_CONFIGS 추가 | SI-01 해결, 기존 14개 메뉴에 영향 없음 |
| `apps/web/src/router/index.tsx` | ChatMenuGuard + 설정 MenuGuard 전환 | 기존 라우트 동작 변경 — 테스트 필수 |
| `apps/web/src/domain/amoeba-talk/pages/AmoebaTalkPage.tsx` | 스텁 → 실제 구현 | 기존 18줄 완전 교체 |
| `apps/web/src/i18n.ts` | amoeba-talk 네임스페이스 추가 | 기존 service 네임스페이스 바로 뒤에 추가 |
| `apps/api/src/app.module.ts` | AmoebaTalkModule + 4 엔티티 등록 | SI-03, entities 배열 끝에 추가 |
| `apps/api/src/global/constant/error-code.constant.ts` | E6xxx 에러코드 추가 | 기존 E22xxx 뒤에 추가, 번호 충돌 없음 |
| `packages/types/src/domain.types.ts` | Talk 관련 타입 추가 | 파일 끝에 추가, 기존 타입에 영향 없음 |

---

## 5. 사이드 임팩트 체크리스트

| # | 검증 항목 | 확인 방법 | 상태 |
|---|----------|----------|------|
| ✅ | app.module.ts에 ServiceManagementModule 이미 등록 | git diff 확인 | 충돌 없음 |
| ✅ | i18n.ts에 service 네임스페이스 이미 등록 | git diff 확인 | 충돌 없음 |
| ✅ | router.tsx에 /service 라우트 이미 등록 | git diff 확인 | 충돌 없음 |
| ✅ | useMyPermissions() deprecated | 코드 확인 | 새 코드에서 useMyMenus() 사용 |
| ⚠️ | SETTINGS_* DEFAULT_MENU_CONFIGS 미등록 | menu-config.service.ts | **Task 1.0에서 해결** |
| ⚠️ | CHAT 라우트 동적 department 매핑 | router.tsx | **Task 1.1에서 해결** |
| ✅ | error-code E6xxx 번호 범위 미사용 | error-code.constant.ts | 사용 가능 (E22xxx 다음) |
| ✅ | MainLayout ICON_MAP 확장 가능 | MainLayout.tsx | 새 아이콘 추가 시 Map에 등록만 하면 됨 |

---

## 6. 리스크 및 완화 방안

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 설정 MenuGuard 전환 후 접근 불가 | ADMIN이 설정 페이지 접근 못할 수 있음 | Task 1.0 선행 + ADMIN은 `getMyMenus()`에서 모든 활성 메뉴 반환 (코드 확인 완료) |
| SSE 연결 관리 복잡성 | 다수 채널 동시 구독 시 서버 부하 | 활성 채널만 SSE 구독, heartbeat 관리 |
| 메시지 페이지네이션 성능 | 대량 메시지 시 쿼리 느림 | cursor 기반 페이지네이션, 인덱스 최적화 |
| AdminRoute 제거 후 역호환성 | 다른 곳에서 AdminRoute 사용 가능 | AdminRoute 함수 자체는 유지, 설정 라우트에서만 교체 |
