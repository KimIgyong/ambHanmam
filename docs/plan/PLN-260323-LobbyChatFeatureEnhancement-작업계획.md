# 작업 계획서: Lobby Chat 기능 개선

> **문서 ID**: PLAN-LobbyChatFeatureEnhancement-작업계획-20260323  
> **작성일**: 2026-03-23  
> **분석서 참조**: `docs/analysis/REQ-LobbyChatFeatureEnhancement-20260323.md`

---

## 1. 시스템 개발 현황

### 1.1 기존 구현 상태

| 컴포넌트 | 파일 수 | 비고 |
|---------|--------|------|
| Frontend 컴포넌트 | 17개 | ChannelList, ChannelHeader, TalkMessageList 등 |
| Frontend Hooks | 4개 | useTalk (27개 API 래핑), useTalkSSE, usePresence, useTalkUser |
| Backend 컨트롤러 | 4개 | Channel, Message, SSE, Presence |
| Backend 서비스 | 5개 | Channel, Message, Translate, SSE, Presence |
| DB 엔티티 | 6개 | channels, members, messages, attachments, read_status, reactions |

### 1.2 재사용 가능한 기존 코드

| 항목 | 코드 위치 | 활용 방안 |
|------|----------|----------|
| `deleteChannel` API | `ChannelController.delete()` | REQ-03 DM 삭제에 그대로 활용 |
| `useDeleteChannel` Hook | `useTalk.ts` | REQ-03 프론트에서 바로 사용 |
| `removeMember` API | `ChannelController.removeMember()` | REQ-01 나가기에 기존 API 활용 |
| `msg_type = 'SYSTEM'` | `TalkMessageEntity` | REQ-04 시스템 메시지 타입 이미 정의됨 |
| `softRemove` 패턴 | 다수 서비스 | REQ-02 Archive에 유사 패턴 적용 |

---

## 2. 단계별 구현 계획

### Phase 1: 기반 작업 (DB + 공유 타입)

#### Step 1-1: DB 스키마 변경

**`TalkChannelEntity` — Archive 컬럼 추가**
```
chn_archived_at  TIMESTAMP  NULLABLE  — 보관 일시
chn_archived_by  UUID       NULLABLE  — 보관 실행자
```

**`TalkMessageHideEntity` — 신규 테이블 생성**
```sql
CREATE TABLE amb_talk_message_hides (
  tmh_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msg_id         UUID NOT NULL REFERENCES amb_talk_messages(msg_id),
  usr_id         UUID NOT NULL,
  tmh_hidden_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(msg_id, usr_id)
);
```

**변경 파일:**
- `apps/api/src/domain/amoeba-talk/entity/talk-channel.entity.ts`
- `apps/api/src/domain/amoeba-talk/entity/talk-message-hide.entity.ts` (신규)
- `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` (엔티티 등록)

#### Step 1-2: 공유 타입 업데이트

**변경 파일:**
- `packages/types/src/domain.types.ts`

**추가/수정 타입:**
```typescript
// TalkChannelResponse에 추가
archivedAt?: string | null;
archivedBy?: string | null;

// 신규 이벤트 타입
TalkSseEventType에 'channel:archive' | 'channel:unarchive' 추가

// 삭제 옵션 타입
TalkMessageDeleteMode: 'FOR_ME' | 'FOR_ALL'
```

---

### Phase 2: 백엔드 API 구현

#### Step 2-1: [REQ-05] lastMessage 삭제 메시지 필터 — SSE 연동 (소규모)

이미 백엔드 쿼리는 정상 (`msg_deleted_at IS NULL`). 프론트 SSE 핸들러 수정만 필요 (Phase 3에서 처리).

#### Step 2-2: [REQ-04] 시스템 메시지 자동 생성

**변경 파일:**
- `apps/api/src/domain/amoeba-talk/service/channel.service.ts`

**구현 내용:**
- `addMember()` 완료 후 → SYSTEM 메시지 INSERT: `"user_joined:{userName}"`
- `removeMember()` 완료 후 → SYSTEM 메시지 INSERT: `"user_left:{userName}"` (본인 나가기) / `"user_removed:{userName}"` (강퇴)
- 메시지 content는 영어 키 형태로 저장, 프론트에서 i18n 해석
- SSE `message:new` 이벤트로 발행 (기존 신규 메시지 흐름 동일)

#### Step 2-3: [REQ-02] 채널 Archive API

**변경 파일:**
- `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts`
- `apps/api/src/domain/amoeba-talk/service/channel.service.ts`

**신규 엔드포인트:**
| 메서드 | 경로 | 기능 |
|--------|------|------|
| PATCH | `/talk/channels/:id/archive` | 채널 보관 (Owner + 활성 멤버 1명 조건 검증) |
| PATCH | `/talk/channels/:id/unarchive` | 보관 해제 |

**Service 로직:**
```
archiveChannel(channelId, userId, entId):
  1. 채널 조회 (soft-delete 제외)
  2. Owner 확인 (chn_created_by === userId)
  3. 활성 멤버 수 확인 (chmLeftAt IS NULL → count === 1)
  4. chn_archived_at = new Date(), chn_archived_by = userId
  5. SSE emit('channel:archive')

unarchiveChannel(channelId, userId, entId):
  1. 채널 조회 (archived 상태 확인)
  2. Owner 확인
  3. chn_archived_at = null, chn_archived_by = null
  4. SSE emit('channel:unarchive')
```

**getMyChannels 수정:**
- archived 채널도 포함하여 반환하되, `archivedAt` 필드 추가로 프론트에서 섹션 분리

#### Step 2-4: [REQ-06] 메시지 "나만 삭제" API + 시간 제한

**변경 파일:**
- `apps/api/src/domain/amoeba-talk/controller/message.controller.ts`
- `apps/api/src/domain/amoeba-talk/service/message.service.ts`

**신규 엔드포인트:**
| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/talk/channels/:channelId/messages/:messageId/hide` | 나만 삭제 |

**deleteMessage 수정 (시간 제한 추가):**
```
deleteMessage(messageId, userId):
  1. 메시지 조회
  2. 본인 메시지 확인
  3. ★ 시간 검증: (now - msg_created_at) > 3600000ms → ForbiddenException
  4. softRemove 실행
```

**hideMessage 구현:**
```
hideMessage(messageId, userId):
  1. 메시지 존재 확인
  2. amb_talk_message_hides INSERT (msg_id, usr_id)
  3. 중복 시 무시 (UNIQUE constraint)
```

**getMessages 수정:**
```
기존 쿼리에 LEFT JOIN amb_talk_message_hides ON msg.msg_id = hide.msg_id AND hide.usr_id = :userId
WHERE hide.tmh_id IS NULL (숨김 처리된 메시지 제외)
```

**getMyChannels lastMessage 수정:**
```
lastMessage 쿼리에도 동일하게 hide 테이블 LEFT JOIN 추가
→ 나만 삭제한 메시지는 나의 채널 목록 lastMessage에서도 제외
```

---

### Phase 3: 프론트엔드 구현

#### Step 3-1: [REQ-05] SSE message:delete → channels 쿼리 무효화

**변경 파일:**
- `apps/web/src/domain/amoeba-talk/hooks/useTalkSSE.ts`

**구현:** `message:delete` 이벤트 핸들러에 `queryClient.invalidateQueries({ queryKey: talkKeys.channels() })` 추가

#### Step 3-2: [REQ-01] ChannelHeader 더보기 메뉴 (나가기 + 보관 + 기타)

**변경 파일:**
- `apps/web/src/domain/amoeba-talk/components/ChannelHeader.tsx`

**구현 내용:**
- `⋮` (EllipsisVertical) 더보기 버튼 추가 → 드롭다운 메뉴
- 메뉴 항목:
  - **나가기** (LogOut 아이콘) — Owner가 아닌 경우, DIRECT가 아닌 경우
  - **보관하기** (Archive 아이콘) — Owner + 활성 멤버 1명인 경우
  - **보관 해제** — 이미 보관된 채널인 경우
- confirm 후 해당 API 호출
- MemberPanel의 기존 나가기 버튼은 유지 (PC에서 중복 접근 가능)

#### Step 3-3: [REQ-02] ChannelList ARCHIVE 섹션 추가

**변경 파일:**
- `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx`
- `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts`

**구현 내용:**
- `useMemo`에서 channels를 3그룹으로 분리: `groupChannels`, `dmChannels`, `archivedChannels` (archivedAt 존재 여부)
- CHANNELS > DIRECT MESSAGES > ARCHIVE 순서로 렌더링
- ARCHIVE 섹션: 접기/펼치기, 회색 아이콘 스타일, "(보관됨)" 표시
- `useArchiveChannel`, `useUnarchiveChannel` 훅 추가

#### Step 3-4: [REQ-03] DM 빈 대화방 삭제 UI

**변경 파일:**
- `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx`

**구현 내용:**
- DM 채널 중 `lastMessage === null` 인 항목에 hover 시 `X` 삭제 버튼 표시
- 클릭 → confirm → `deleteChannel` mutation 호출
- 삭제 성공 → channels 쿼리 무효화

#### Step 3-5: [REQ-04] SYSTEM 메시지 렌더링

**변경 파일:**
- `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx`

**구현 내용:**
- `msg.type === 'SYSTEM'` 체크 → 별도 렌더링 컴포넌트
- 스타일: 중앙 정렬, 회색 텍스트, 점선 구분
- content 파싱: `"user_joined:홍길동"` → `t('talk:systemMessage.userJoined', { name: '홍길동' })`
- 시스템 메시지에는 리액션/삭제/답장 등 액션 버튼 미표시

#### Step 3-6: [REQ-06] 메시지 삭제 드롭다운 UI

**변경 파일:**
- `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx`
- `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts`

**구현 내용:**
- 기존 삭제 아이콘 클릭 → 드롭다운 팝업 (confirm 대체)
  ```
  ┌──────────────────────────┐
  │ 🙈 나만 삭제              │
  │ 🗑 모두에게 삭제           │  ← 1시간 초과 시 disabled + (시간 초과)
  └──────────────────────────┘
  ```
- "나만 삭제" → `useHideMessage` mutation (새 훅)
- "모두에게 삭제" → 기존 `useDeleteMessage` mutation
- 1시간 경과 여부: `Date.now() - new Date(msg.createdAt).getTime() > 3600000`
- 삭제 후 channels 쿼리도 함께 무효화

#### Step 3-7: i18n 번역 키 추가

**변경 파일:**
- `apps/web/src/locales/ko/talk.json`
- `apps/web/src/locales/en/talk.json`
- `apps/web/src/locales/vi/talk.json`

**추가 키:**
```json
{
  "leaveChannelMenu": "나가기",
  "archiveChannel": "보관하기",
  "unarchiveChannel": "보관 해제",
  "archived": "보관됨",
  "archiveSection": "ARCHIVE",
  "archiveConfirm": "이 대화방을 보관하시겠습니까?",
  "unarchiveConfirm": "보관을 해제하시겠습니까?",
  "deleteEmptyDm": "빈 대화방 삭제",
  "deleteEmptyDmConfirm": "이 대화방을 삭제하시겠습니까?",
  "deleteForMe": "나만 삭제",
  "deleteForAll": "모두에게 삭제",
  "deleteExpired": "시간 초과 (1시간)",
  "systemMessage": {
    "userJoined": "{{name}}님이 대화방에 참여했습니다",
    "userLeft": "{{name}}님이 대화방을 나갔습니다",
    "userRemoved": "{{name}}님이 대화방에서 제거되었습니다"
  },
  "moreActions": "더보기"
}
```

---

## 3. 사이드 임팩트 분석

| 변경 사항 | 영향 범위 | 위험도 | 대응 방안 |
|----------|----------|--------|----------|
| `getMessages` hide JOIN 추가 | 메시지 조회 성능 | 중 | `(msg_id, usr_id)` UNIQUE INDEX 활용, EXPLAIN 확인 |
| `getMyChannels` hide JOIN 추가 | 채널 목록 성능 | 중 | lastMessage 서브쿼리에만 적용 (채널 자체 쿼리 무관) |
| 시스템 메시지 INSERT | 멤버 추가/제거 시 추가 DB 쓰기 | 낮 | 비동기 처리, 실패 시 무시 (알림은 보조적) |
| Archive 채널 → 채널 목록 반환 | 기존 API 응답 구조 변경 | 중 | `archivedAt` nullable 필드 추가 (하위 호환) |
| `deleteMessage` 시간 제한 추가 | 기존 동작 변경 | 중 | 프론트에서 1시간 초과 시 "모두에게 삭제" 비활성화하여 UX 안내 |
| SSE `message:delete` → channels 무효화 | 추가 API 호출 발생 | 낮 | 이미 channels 폴링 존재, 추가 부하 미미 |
| MemberPanel에서 나가기 유지 + ChannelHeader에도 추가 | 중복 진입점 | 낮 | 동일 API 호출, UI 일관성 유지 |
| Client Portal (`isClientMode`) | 보관/삭제 기능 노출 여부 | 낮 | 클라이언트 모드에서는 보관/삭제 메뉴 숨김 처리 |

---

## 4. 구현 순서 (의존성 기반)

```
Step 1-1  DB 스키마 변경 (엔티티)
  ↓
Step 1-2  공유 타입 업데이트
  ↓
Step 2-1 ~ 2-4  백엔드 API (병렬 가능)
  ↓
Step 3-1  SSE lastMessage 갱신 (독립, 가장 작은 변경)
Step 3-2  ChannelHeader 더보기 메뉴 (나가기 + 보관)
Step 3-3  ChannelList ARCHIVE 섹션
Step 3-4  DM 빈 방 삭제
Step 3-5  SYSTEM 메시지 렌더링
Step 3-6  메시지 삭제 드롭다운
Step 3-7  i18n 번역 키
```

---

## 5. 변경 파일 총 목록

### 신규 파일
| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/amoeba-talk/entity/talk-message-hide.entity.ts` | 나만 삭제 엔티티 |

### 수정 파일 — Backend (7개)
| 파일 | 변경 내용 |
|------|----------|
| `apps/api/src/domain/amoeba-talk/entity/talk-channel.entity.ts` | `chn_archived_at`, `chn_archived_by` 컬럼 추가 |
| `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` | `TalkMessageHideEntity` 등록 |
| `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts` | archive/unarchive 엔드포인트 추가 |
| `apps/api/src/domain/amoeba-talk/service/channel.service.ts` | archive/unarchive 메서드, addMember/removeMember에 시스템 메시지, getMyChannels에 hide 필터 |
| `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | hide 엔드포인트 추가 |
| `apps/api/src/domain/amoeba-talk/service/message.service.ts` | hideMessage, deleteMessage 시간 제한, getMessages hide 필터 |
| `apps/api/src/domain/amoeba-talk/service/talk-sse.service.ts` | 이벤트 타입 추가 |

### 수정 파일 — Frontend (8개)
| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/domain/amoeba-talk/components/ChannelHeader.tsx` | 더보기 드롭다운 메뉴 추가 |
| `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx` | ARCHIVE 섹션, DM 삭제 버튼 |
| `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx` | SYSTEM 렌더링, 삭제 드롭다운 |
| `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts` | archive/unarchive/hide 훅 추가 |
| `apps/web/src/domain/amoeba-talk/hooks/useTalkSSE.ts` | message:delete → channels 무효화 |
| `apps/web/src/locales/ko/talk.json` | 한국어 번역 키 |
| `apps/web/src/locales/en/talk.json` | 영어 번역 키 |
| `apps/web/src/locales/vi/talk.json` | 베트남어 번역 키 |

### 수정 파일 — Shared Types (1개)
| 파일 | 변경 내용 |
|------|----------|
| `packages/types/src/domain.types.ts` | TalkChannelResponse에 archivedAt 추가, 삭제 모드 타입 |

---

## 6. 테스트 포인트

| # | 테스트 항목 | 검증 방법 |
|---|-----------|----------|
| 1 | 그룹 채널 나가기 (Owner 아닌 경우) | ChannelHeader [⋯] → 나가기 → 채널 목록에서 사라짐 |
| 2 | Owner 나가기 차단 | Owner에게는 나가기 메뉴 미표시 |
| 3 | Archive 조건 (Owner + 1명) | 멤버 2명 이상일 때 보관하기 미표시, 1명일 때 표시 |
| 4 | Archive → ARCHIVE 섹션 이동 | 보관 후 채널 목록 하단 ARCHIVE 섹션에 표시 |
| 5 | 보관 해제 | ARCHIVE 채널 선택 → 보관 해제 → CHANNELS 섹션 복귀 |
| 6 | DM 빈 방 삭제 | No messages DM에 X 버튼 → 삭제 → 목록에서 제거 |
| 7 | DM 메시지 있는 방 | X 버튼 미표시 (삭제 불가) |
| 8 | 시스템 메시지 — 입장 | 멤버 추가 시 "OOO님이 참여했습니다" 표시 |
| 9 | 시스템 메시지 — 나가기 | 나가기 시 "OOO님이 나갔습니다" 표시 |
| 10 | 삭제 메시지 → lastMessage 즉시 갱신 | 마지막 메시지 삭제 → 채널 리스트에 이전 메시지 표시 |
| 11 | 나만 삭제 | 삭제 후 내 화면에서만 안 보임, 상대방 화면에는 보임 |
| 12 | 모두에게 삭제 (1시간 이내) | 1시간 이내 메시지 삭제 → 양쪽 모두 안 보임 |
| 13 | 모두에게 삭제 (1시간 초과) | 버튼 disabled + "시간 초과" 표시 |
| 14 | 모바일/PWA 나가기 접근 | 모바일에서 ChannelHeader 더보기로 나가기 가능 |
| 15 | Client Portal 제한 | isClientMode에서 보관/삭제 메뉴 미표시 |
