# Menu Sitemap 구현 보고서

**작업일**: 2026-02-18
**기반 문서**: `docs/Menu-Sitemap-Detail.md`
**분석 문서**: `docs/analysis/menu-sitemap-gap-analysis.md`
**작업 계획서**: `docs/plan/menu-sitemap-implementation-plan.md`

---

## 1. 구현 요약

Menu-Sitemap-Detail.md 문서 대비 현행 시스템 Gap 분석 후, 미구현 항목 3개 영역을 구현 완료:

| Phase | 작업 | 상태 |
|-------|------|------|
| Phase 1 | SETTINGS_* DEFAULT_MENU_CONFIGS 추가 | ✅ 완료 |
| Phase 1 | ChatMenuGuard 컴포넌트 생성 | ✅ 완료 |
| Phase 1 | 설정 라우트 MenuGuard 전환 (AdminRoute → MenuGuard) | ✅ 완료 |
| Phase 2 | 아메바톡 백엔드 API (NestJS) | ✅ 완료 |
| Phase 3 | 아메바톡 프론트엔드 (React) | ✅ 완료 |

---

## 2. Phase 1: 라우트 보호 및 권한 체계 통합

### 2.1 SETTINGS_* DEFAULT_MENU_CONFIGS 추가

**파일**: `apps/api/src/domain/settings/service/menu-config.service.ts`

6개 SETTINGS 메뉴를 DEFAULT_MENU_CONFIGS에 추가하여 MenuGuard 전환 시 접근 차단 방지:

| menuCode | labelKey | path | sortOrder |
|----------|----------|------|-----------|
| SETTINGS_MEMBERS | settings:nav.members | /settings/members | 2100 |
| SETTINGS_API_KEYS | settings:nav.apiKeys | /settings/api-keys | 2200 |
| SETTINGS_SMTP | settings:nav.smtp | /settings/smtp | 2300 |
| SETTINGS_PERMISSIONS | settings:nav.permissions | /settings/permissions | 2400 |
| SETTINGS_DRIVE | settings:nav.drive | /settings/drive | 2500 |
| SETTINGS_ENTITIES | settings:nav.entities | /settings/entities | 2600 |

### 2.2 ChatMenuGuard 컴포넌트

**파일**: `apps/web/src/components/common/ChatMenuGuard.tsx`

URL의 `:department` 파라미터를 `CHAT_*` 메뉴 코드로 매핑하는 전용 가드:

```
management → CHAT_MANAGEMENT
accounting → CHAT_ACCOUNTING
hr → CHAT_HR
... (총 9개 부서)
```

권한 없을 시 `/agents`로 리다이렉트.

### 2.3 설정 라우트 MenuGuard 전환

**파일**: `apps/web/src/router/index.tsx`

7개 설정 라우트를 `AdminRoute`/`ManagerRoute` → `MenuGuard`로 전환:

```typescript
// Before
{ path: 'settings/api-keys', element: <AdminRoute><ApiKeyManagementPage /></AdminRoute> }

// After
{ path: 'settings/api-keys', element: <MenuGuard menuCode="SETTINGS_API_KEYS"><ApiKeyManagementPage /></MenuGuard> }
```

---

## 3. Phase 2: 아메바톡 백엔드 API

### 3.1 데이터베이스 엔티티 (4개)

| 엔티티 | 테이블 | 설명 |
|--------|--------|------|
| TalkChannelEntity | amb_talk_channels | 채널 (PUBLIC/PRIVATE/DIRECT) |
| TalkChannelMemberEntity | amb_talk_channel_members | 채널 멤버십 (OWNER/ADMIN/MEMBER) |
| TalkMessageEntity | amb_talk_messages | 메시지 (TEXT/FILE/SYSTEM) |
| TalkReadStatusEntity | amb_talk_read_status | 읽음 상태 추적 |

### 3.2 API 엔드포인트

**Channel Controller** (`/api/v1/talk/channels`):
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 내 채널 목록 |
| GET | /unread | 안 읽은 메시지 수 |
| GET | /:id | 채널 상세 (멤버 포함) |
| POST | / | 채널 생성 |
| PATCH | /:id | 채널 수정 |
| DELETE | /:id | 채널 삭제 |
| POST | /:id/members | 멤버 추가 |
| DELETE | /:id/members/:userId | 멤버 제거/나가기 |
| POST | /:id/read | 읽음 표시 |

**Message Controller** (`/api/v1/talk/channels/:channelId/messages`):
| Method | Path | 설명 |
|--------|------|------|
| GET | / | 메시지 목록 (커서 기반 페이지네이션) |
| POST | / | 메시지 전송 |
| PATCH | /:messageId | 메시지 수정 |
| DELETE | /:messageId | 메시지 삭제 |

**SSE Controller** (`/api/v1/talk/channels/:channelId/events`):
| Method | Path | 설명 |
|--------|------|------|
| SSE | /events | 실시간 이벤트 스트림 |

### 3.3 에러 코드 (E6xxx)

| 코드 | 상수명 | 메시지 |
|------|--------|--------|
| E6001 | CHANNEL_NOT_FOUND | Channel not found. |
| E6002 | CHANNEL_ACCESS_DENIED | Access denied to this channel. |
| E6003 | CHANNEL_MEMBER_ALREADY_EXISTS | User is already a member of this channel. |
| E6004 | TALK_MESSAGE_NOT_FOUND | Message not found. |
| E6005 | TALK_MESSAGE_ACCESS_DENIED | You can only edit/delete your own messages. |
| E6006 | CANNOT_LEAVE_OWNED_CHANNEL | Channel owner cannot leave. Transfer ownership first. |

### 3.4 공유 타입 (packages/types)

```typescript
// 상수
TALK_CHANNEL_TYPE: PUBLIC | PRIVATE | DIRECT
TALK_MEMBER_ROLE: OWNER | ADMIN | MEMBER
TALK_MESSAGE_TYPE: TEXT | FILE | SYSTEM

// 인터페이스
TalkChannelResponse, TalkChannelDetailResponse,
TalkChannelMemberResponse, TalkMessageResponse, TalkUnreadSummary
```

---

## 4. Phase 3: 아메바톡 프론트엔드

### 4.1 파일 구조

```
apps/web/src/domain/amoeba-talk/
├── pages/
│   └── AmoebaTalkPage.tsx          ← 메인 페이지 (3-panel layout)
├── components/
│   ├── ChannelList.tsx              ← 채널 목록 사이드바
│   ├── ChannelHeader.tsx            ← 채널 헤더 (이름, 멤버 수)
│   ├── TalkMessageList.tsx          ← 메시지 목록 (무한 스크롤)
│   ├── TalkMessageInput.tsx         ← 메시지 입력 (Shift+Enter/Enter)
│   ├── CreateChannelModal.tsx       ← 채널 생성 모달
│   └── MemberPanel.tsx             ← 멤버 패널 (슬라이드)
├── hooks/
│   ├── useTalk.ts                   ← React Query 훅 (CRUD)
│   └── useTalkSSE.ts               ← SSE 실시간 이벤트 훅
├── service/
│   └── talk.service.ts              ← API 클라이언트 서비스
└── store/
    └── talk.store.ts                ← Zustand 상태 관리
```

### 4.2 주요 기능

- **채널 목록**: 안 읽은 메시지 수 배지, 최근 메시지 미리보기, 시간 포맷
- **메시지 영역**: 커서 기반 무한 스크롤, 날짜 구분선, 본인 메시지 우측 정렬
- **실시간**: SSE EventSource로 새 메시지/멤버 변경 자동 반영
- **채널 생성**: PUBLIC/PRIVATE 유형 선택, 설명 입력
- **멤버 관리**: 역할(OWNER/ADMIN/MEMBER) 표시, 소유자만 멤버 제거 가능
- **읽음 표시**: 채널 진입 시 자동 읽음 처리

### 4.3 i18n (3개 언어)

| 파일 | 키 수 |
|------|-------|
| locales/en/talk.json | 44개 |
| locales/ko/talk.json | 44개 |
| locales/vi/talk.json | 44개 |

`i18n.ts`에 `talk` 네임스페이스 등록 완료.

---

## 5. 수정된 파일 목록

### 신규 생성 (20개)

**백엔드 (10개)**:
- `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts`
- `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts`
- `apps/api/src/domain/amoeba-talk/controller/message.controller.ts`
- `apps/api/src/domain/amoeba-talk/service/channel.service.ts`
- `apps/api/src/domain/amoeba-talk/service/message.service.ts`
- `apps/api/src/domain/amoeba-talk/service/talk-sse.service.ts`
- `apps/api/src/domain/amoeba-talk/entity/talk-channel.entity.ts`
- `apps/api/src/domain/amoeba-talk/entity/talk-channel-member.entity.ts`
- `apps/api/src/domain/amoeba-talk/entity/talk-message.entity.ts`
- `apps/api/src/domain/amoeba-talk/entity/talk-read-status.entity.ts`
- `apps/api/src/domain/amoeba-talk/dto/request/create-channel.request.ts`
- `apps/api/src/domain/amoeba-talk/dto/request/update-channel.request.ts`
- `apps/api/src/domain/amoeba-talk/dto/request/send-message.request.ts`
- `apps/api/src/domain/amoeba-talk/dto/request/update-message.request.ts`
- `apps/api/src/domain/amoeba-talk/mapper/channel.mapper.ts`
- `apps/api/src/domain/amoeba-talk/mapper/message.mapper.ts`

**프론트엔드 (10개)**:
- `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx`
- `apps/web/src/domain/amoeba-talk/components/ChannelHeader.tsx`
- `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx`
- `apps/web/src/domain/amoeba-talk/components/TalkMessageInput.tsx`
- `apps/web/src/domain/amoeba-talk/components/CreateChannelModal.tsx`
- `apps/web/src/domain/amoeba-talk/components/MemberPanel.tsx`
- `apps/web/src/domain/amoeba-talk/service/talk.service.ts`
- `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts`
- `apps/web/src/domain/amoeba-talk/hooks/useTalkSSE.ts`
- `apps/web/src/domain/amoeba-talk/store/talk.store.ts`

**공통 (4개)**:
- `apps/web/src/components/common/ChatMenuGuard.tsx`
- `apps/web/src/locales/en/talk.json`
- `apps/web/src/locales/ko/talk.json`
- `apps/web/src/locales/vi/talk.json`

### 수정 (6개)

- `apps/api/src/app.module.ts` — AmoebaTalkModule + 4 엔티티 등록
- `apps/api/src/global/constant/error-code.constant.ts` — E6xxx 에러 코드 추가
- `apps/api/src/domain/settings/service/menu-config.service.ts` — SETTINGS_* 6개 항목 추가
- `apps/web/src/router/index.tsx` — ChatMenuGuard + Settings MenuGuard 전환
- `apps/web/src/i18n.ts` — talk 네임스페이스 등록
- `apps/web/src/domain/amoeba-talk/pages/AmoebaTalkPage.tsx` — 스텁 → 전체 구현
- `packages/types/src/domain.types.ts` — Talk 타입 추가

---

## 6. 사이드 임팩트 처리 결과

| ID | 이슈 | 해결 방법 | 상태 |
|----|------|-----------|------|
| SI-01 | SETTINGS_* 메뉴가 DEFAULT_MENU_CONFIGS에 없음 → MenuGuard 전환 시 접근 차단 | 6개 항목 추가 후 전환 | ✅ 해결 |
| SI-02 | CHAT 라우트의 동적 department 파라미터 → 일반 MenuGuard 사용 불가 | ChatMenuGuard 전용 컴포넌트 생성 | ✅ 해결 |
| SI-03 | AdminRoute/ManagerRoute 삭제 여부 | 삭제하지 않고 유지 (다른 곳에서 사용 가능성) | ✅ 안전 처리 |
| SI-04 | E6xxx 에러 코드 번호 충돌 (기존 Invitation E6xxx) | 의도적으로 Talk과 공유 (컨텍스트로 구분) | ✅ 확인 |

---

## 7. 기술적 결정 사항

1. **커서 기반 페이지네이션**: 메시지 조회에 오프셋 대신 커서 기반 채택 (실시간 메시지 추가 시 데이터 중복/누락 방지)
2. **SSE (Server-Sent Events)**: 기존 Chat 모듈의 SSE 패턴 재사용, RxJS Subject 기반 이벤트 버스
3. **Soft Delete**: 모든 엔티티에 DeleteDateColumn 적용, 완전 삭제 없이 논리적 삭제
4. **React Query + Zustand**: 서버 상태는 React Query, UI 상태는 Zustand으로 분리
5. **Infinite Query**: 메시지 무한 스크롤에 `useInfiniteQuery` 사용
