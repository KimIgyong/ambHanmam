# 요구사항 분석서: Lobby Chat 기능 개선

> **문서 ID**: REQ-LobbyChatFeatureEnhancement-20260323  
> **작성일**: 2026-03-23  
> **대상 URL**: https://stg-ama.amoeba.site/amoeba-talk  

---

## 1. 요구사항 요약

| # | 요구사항 | 유형 |
|---|---------|------|
| 1 | 대화방 나가기 기능 | 기능 개선 |
| 2 | Owner 대화방 보관(Archive) 기능 | 신규 기능 |
| 3 | DM - 메시지 없는 대화방 삭제 | 기능 개선 |
| 4 | CHANNELS 그룹대화방 입장/삭제/나가기 알림 | 신규 기능 |
| 5 | 삭제된 메시지가 대화방 리스트 마지막 대화에 노출 방지 | 버그 수정 |
| 6 | 메시지 삭제 옵션 (나만 삭제 / 모두에게 삭제) + 1시간 제한 | 기능 개선 |

---

## 2. AS-IS 현황 분석

### 2.1 시스템 아키텍처

| 계층 | 구성 |
|------|------|
| Backend | NestJS — `apps/api/src/domain/amoeba-talk/` |
| Frontend | React — `apps/web/src/domain/amoeba-talk/` |
| 실시간 | SSE (`TalkSseService` — RxJS Subject) |
| DB 엔티티 | 6개 (channels, channel_members, messages, attachments, read_status, reactions) |
| API | 27+ 엔드포인트 (Channel 14개, Message 13개, Presence 3개) |

### 2.2 현행 기능 분석

#### 2.2.1 대화방 나가기 (요구사항 #1)

| 항목 | 상태 |
|------|------|
| **백엔드 API** | ✅ 구현됨 — `DELETE /talk/channels/:id/members/:userId` |
| **백엔드 로직** | `chmLeftAt = new Date()` 설정 (Soft Leave) |
| **프론트 Hook** | ✅ `useRemoveMember()` 존재 |
| **프론트 UI** | ⚠️ **MemberPanel에서만 접근 가능** — 최근 수정으로 MemberPanel이 PC 전용(`hidden md:flex`)이 되어 **모바일에서 나가기 기능 접근 불가** |
| **제약사항** | Owner는 나갈 수 없음 (`CANNOT_LEAVE_OWNED_CHANNEL`) |
| **DIRECT 채널** | 나가기 불가 (UI 미노출) |

**문제점**: 나가기 기능이 MemberPanel 하단에만 존재하여 접근성이 매우 낮음. 모바일에서는 MemberPanel이 숨겨진 상태로 나가기 자체가 불가능.

#### 2.2.2 대화방 보관 — Archive (요구사항 #2)

| 항목 | 상태 |
|------|------|
| **DB 스키마** | ❌ `amb_talk_channels`에 `archived` 컬럼 없음 |
| **백엔드 API** | ❌ 미구현 |
| **프론트엔드** | ❌ 미구현 |
| **ChannelList 구조** | 현재 2개 섹션: CHANNELS / DIRECT MESSAGES |

**현행**: 채널 상태는 `active` 또는 `soft-deleted`만 존재. 보관(Archive) 개념 자체가 없음.

#### 2.2.3 DM 빈 대화방 삭제 (요구사항 #3)

| 항목 | 상태 |
|------|------|
| **채널 삭제 API** | ✅ `DELETE /talk/channels/:id` — Owner만 가능 |
| **프론트 Hook** | ✅ `useDeleteChannel()` 존재 |
| **프론트 UI** | ❌ **채널 삭제 UI가 어디에도 없음** — EditChannelModal에는 이름/설명 변경만 가능 |
| **DM 특성** | DM은 `findOrCreateDm()`으로 생성, 양쪽 모두 Owner가 아닌 경우도 있음 |

**현행**: 백엔드에 삭제 API와 프론트 Hook이 있지만, UI가 없어 사용자가 대화방을 삭제할 수 없음.

#### 2.2.4 그룹대화방 알림 (요구사항 #4)

| 항목 | 상태 |
|------|------|
| **SSE 이벤트** | ✅ `member:join`, `member:leave` 이벤트 발행 |
| **SSE 데이터** | `{ userId: string }` — userId만 전달, userName 없음 |
| **시스템 메시지** | ❌ **SYSTEM 타입 메시지 자동 생성 로직 없음** |
| **메시지 타입** | `msg_type` enum에 `'SYSTEM'` 정의됨 (사용되지 않음) |
| **프론트 렌더링** | SSE에서 member:join/leave 수신 시 쿼리 무효화만 수행, 대화방 내 알림 표시 없음 |

**현행**: 멤버 변동 시 SSE 이벤트로 실시간 쿼리 리프레시는 되지만, 대화방 내에 "OOO님이 입장했습니다" 같은 시스템 메시지가 생성/표시되지 않음.

#### 2.2.5 삭제된 메시지 → 대화방 리스트 노출 (요구사항 #5)

| 항목 | 상태 |
|------|------|
| **백엔드 쿼리** | ✅ `msg_deleted_at IS NULL` 조건 적용됨 |
| **SSE 이벤트** | `message:delete` 이벤트 발행 → 프론트 쿼리 무효화 |
| **프론트 캐시** | ⚠️ `message:delete` SSE 수신 시 `messages` 쿼리만 무효화, **`channels` 쿼리는 무효화하지 않음** |

**문제점**: 메시지 삭제 시 `channels` 목록 쿼리가 갱신되지 않아 캐시된 `lastMessage`가 삭제된 메시지를 계속 표시할 수 있음. 새로고침하면 정상 표시됨 (백엔드 쿼리는 정확함).

#### 2.2.6 메시지 삭제 방식 (요구사항 #6)

| 항목 | 상태 |
|------|------|
| **현행 삭제 방식** | Soft Delete (`msg_deleted_at` 설정) — **전체 사용자에게 삭제** |
| **"나만 삭제"** | ❌ 미구현 — 개인별 메시지 숨김 테이블 없음 |
| **삭제 시간 제한** | ❌ 없음 — 본인 메시지면 시간 무관 삭제 가능 |
| **삭제자 추적** | ❌ `msg_deleted_by` 컬럼 없음 |
| **프론트 삭제 UI** | 휴지통 아이콘 → `confirm()` → 즉시 삭제 (옵션 없음) |

**현행**: 삭제하면 모든 사용자에게서 사라짐. 시간 제한 없음. "나만 삭제" 기능 없음.

---

## 3. TO-BE 요구사항

### 3.1 [REQ-01] 대화방 나가기 기능 접근성 개선

**기능 설명**: 대화방에서 쉽게 나가기 할 수 있는 UI 제공

| 항목 | 내용 |
|------|------|
| **접근 위치** | ChannelHeader 우측 액션 영역 (⋯ 더보기 메뉴 또는 직접 버튼) |
| **대상 채널** | PUBLIC, PRIVATE 그룹 채널 (Owner 제외) |
| **비대상 채널** | DIRECT 채널 (나가기 불가), Owner 본인 채널 |
| **동작** | confirm 다이얼로그 → removeMember API → 채널 목록에서 제거 |
| **모바일 대응** | 모바일/PWA에서도 동일하게 접근 가능 |

### 3.2 [REQ-02] Owner 대화방 보관(Archive) 기능

**기능 설명**: Owner가 참여자가 본인 1명뿐인 대화방을 보관 처리

| 항목 | 내용 |
|------|------|
| **조건** | 대화방 Owner + 현재 활성 멤버가 본인 1명 |
| **보관 처리** | 채널의 `chn_archived_at` 타임스탬프 설정 |
| **UI 위치** | ChannelHeader 더보기 메뉴 또는 EditChannelModal |
| **보관 채널 표시** | ChannelList에 CHANNELS > DIRECT MESSAGES > **ARCHIVE** 순서로 3번째 섹션 추가 |
| **보관 해제** | Archive 섹션에서 채널 클릭 시 복원 가능 (보관 해제 버튼) |
| **보관 채널 특성** | 읽기 전용, 새 메시지 전송 불가, 멤버 초대 불가 |

### 3.3 [REQ-03] DM 빈 대화방 삭제

**기능 설명**: 메시지가 없는 DM 대화방을 삭제 가능

| 항목 | 내용 |
|------|------|
| **조건** | DIRECT 채널 + lastMessage가 없음 (No messages yet) |
| **UI 위치** | ChannelList DM 항목에 삭제 버튼 (hover 시 X 아이콘) 또는 우클릭/길게누르기 메뉴 |
| **동작** | confirm → deleteChannel API → 목록에서 제거 |
| **권한** | DM 생성자 (chn_created_by) 만 삭제 가능 |

### 3.4 [REQ-04] CHANNELS 그룹대화방 액션 알림 (System Messages)

**기능 설명**: 그룹 채널에서 멤버 입장/나가기/삭제 등의 액션 시 시스템 메시지 생성

| 항목 | 내용 |
|------|------|
| **알림 대상 액션** | 멤버 입장 (join), 멤버 나가기 (leave), 멤버 강퇴 (remove), 채널 삭제 예정 |
| **메시지 타입** | `msg_type = 'SYSTEM'` |
| **메시지 형식** | `"OOO님이 대화방에 참여했습니다"`, `"OOO님이 대화방을 나갔습니다"` 등 |
| **저장** | DB에 SYSTEM 메시지로 저장 (lastMessage에 반영) |
| **프론트 렌더링** | 일반 메시지와 구분되는 중앙정렬 회색 텍스트 스타일 |
| **대상 채널** | PUBLIC, PRIVATE 그룹 채널만 (DIRECT 제외) |

### 3.5 [REQ-05] 삭제된 메시지 → 대화방 리스트 실시간 갱신

**기능 설명**: 메시지 삭제 시 대화방 리스트의 lastMessage가 즉시 갱신

| 항목 | 내용 |
|------|------|
| **문제** | `message:delete` SSE 이벤트 수신 시 `channels` 쿼리가 무효화되지 않음 |
| **해결** | SSE `message:delete` 핸들러에서 `channels` 쿼리도 함께 무효화 |
| **기대 동작** | 메시지 삭제 → 대화방 리스트에서 직전 유효 메시지가 lastMessage로 표시 |

### 3.6 [REQ-06] 메시지 삭제 옵션 (나만 삭제 / 모두에게 삭제) + 1시간 제한

**기능 설명**: 메시지 삭제 시 두 가지 옵션 제공 및 시간 제한

| 항목 | 내용 |
|------|------|
| **나만 삭제** | 현재 사용자에게만 메시지 숨김 (다른 사용자에게는 여전히 보임) |
| **모두에게 삭제** | 기존 Soft Delete 방식 (전체 사용자에게 삭제) |
| **시간 제한** | 작성 후 1시간 이내 메시지만 "모두에게 삭제" 가능 |
| **1시간 초과** | "나만 삭제"만 가능, "모두에게 삭제" 비활성 |
| **삭제 UI** | 기존 휴지통 아이콘 클릭 → 드롭다운 메뉴 (나만 삭제 / 모두에게 삭제) |
| **나만 삭제 DB** | 새 테이블 `amb_talk_message_hides` (usr_id, msg_id, hidden_at) |

---

## 4. 갭 분석

| # | 요구사항 | AS-IS | TO-BE | 갭 |
|---|---------|-------|-------|-----|
| 1 | 대화방 나가기 | MemberPanel에만 존재 (모바일 접근 불가) | ChannelHeader에서 접근 가능 | **프론트 UI 추가** |
| 2 | Archive | 미구현 | DB 컬럼 + API + UI | **Full Stack 신규 개발** |
| 3 | DM 빈 방 삭제 | 백엔드 API 존재, UI 없음 | ChannelList에 삭제 UI | **프론트 UI 추가** |
| 4 | 시스템 메시지 | SYSTEM 타입만 정의, 로직 없음 | 멤버 변동 시 자동 생성 | **백엔드 로직 + 프론트 렌더링** |
| 5 | lastMessage 실시간 갱신 | channels 쿼리 무효화 누락 | SSE 핸들러에서 무효화 추가 | **프론트 SSE 핸들러 수정** (소규모) |
| 6 | 삭제 옵션 + 시간 제한 | "모두에게 삭제"만 | 나만 삭제 + 시간 제한 | **DB 테이블 + 백엔드 API + 프론트 UI** |

---

## 5. 사용자 플로우

### 5.1 대화방 나가기 플로우

```
그룹 채널 선택 → ChannelHeader [⋯] 더보기 → "나가기" 클릭
→ confirm("정말 이 대화방을 나가시겠습니까?")
→ [확인] → DELETE /channels/:id/members/:userId
→ 시스템 메시지 "OOO님이 대화방을 나갔습니다" 생성
→ 채널 목록에서 제거 → 빈 화면으로 전환
```

### 5.2 보관(Archive) 플로우

```
Owner 채널 (참여자 1명) 선택 → ChannelHeader [⋯] 더보기 → "보관하기" 클릭
→ confirm("이 대화방을 보관하시겠습니까?")
→ [확인] → PATCH /channels/:id/archive
→ 채널이 ARCHIVE 섹션으로 이동
→ ARCHIVE 섹션에서 선택 → "보관 해제" 가능
```

### 5.3 DM 빈 방 삭제 플로우

```
DM 대화방 (No messages yet) → hover 시 X 버튼 표시
→ X 클릭 → confirm("이 대화방을 삭제하시겠습니까?")
→ [확인] → DELETE /channels/:id
→ 채널 목록에서 제거
```

### 5.4 메시지 삭제 플로우

```
내 메시지에 hover → 🗑 삭제 아이콘 클릭
→ 드롭다운 표시:
  ┌─────────────────────────────┐
  │ 🙈 나만 삭제                 │
  │ 🗑 모두에게 삭제 (1시간 이내) │   ← 1시간 초과 시 비활성 (회색)
  └─────────────────────────────┘
→ "나만 삭제" 선택 → POST /messages/:id/hide → 내 화면에서만 숨김
→ "모두에게 삭제" 선택 → confirm → DELETE /messages/:id → 전체 삭제
```

---

## 6. 기술 제약사항

| 항목 | 제약사항 |
|------|---------|
| **DB Migration** | Archive 컬럼 추가, message_hides 테이블 생성 필요 — TypeORM synchronize 사용 중이면 자동 반영 |
| **SSE 이벤트** | 기존 이벤트 타입에 `channel:archive`, `channel:unarchive` 추가 필요 |
| **시스템 메시지 다국어** | SYSTEM 메시지 content를 영어 키로 저장하고 프론트에서 i18n 변환하는 방식 권장 |
| **나만 삭제 성능** | 메시지 조회 시 hide 테이블 LEFT JOIN 필요 — 대량 메시지 시 성능 고려 |
| **1시간 제한** | 서버 시간 기준 — 클라이언트 시간 조작 방지를 위해 백엔드에서 검증 |
| **사이드 임팩트** | lastMessage 쿼리에 "나만 삭제" 메시지도 필터링 필요 |
| **Client Portal** | `isClientMode` 플래그로 일부 기능 제한됨 — Archive, 삭제 등은 Client에서도 동일 적용 필요 여부 결정 |

---

## 7. 영향 범위 (Impact Analysis)

### Backend
| 파일 | 변경 유형 |
|------|----------|
| `TalkChannelEntity` | 컬럼 추가 (`chn_archived_at`, `chn_archived_by`) |
| `TalkMessageEntity` | (변경 없음 — 기존 구조 활용) |
| **신규** `TalkMessageHideEntity` | 신규 엔티티 |
| `ChannelService` | archiveChannel, unarchiveChannel 메서드 추가, getMyChannels에 archive 필터 |
| `ChannelController` | archive/unarchive 엔드포인트 추가 |
| `MessageService` | hideMessage 메서드, deleteMessage에 시간 제한 추가, getMessages에 hide 필터 |
| `MessageController` | hideMessage 엔드포인트 추가 |
| `ChannelService.removeMember` | 시스템 메시지 생성 로직 추가 |
| `ChannelService.addMember` | 시스템 메시지 생성 로직 추가 |
| `TalkSseService` | 이벤트 타입 추가 (`channel:archive`, `channel:unarchive`) |

### Frontend
| 파일 | 변경 유형 |
|------|----------|
| `ChannelHeader.tsx` | 더보기 메뉴 추가 (나가기, 보관, 삭제) |
| `ChannelList.tsx` | ARCHIVE 섹션 추가, DM 빈 방 삭제 버튼 |
| `TalkMessageList.tsx` | 삭제 드롭다운 UI, SYSTEM 메시지 렌더링, 시간 제한 표시 |
| `useTalk.ts` | useArchiveChannel, useHideMessage 등 훅 추가 |
| `useTalkSSE.ts` | message:delete 시 channels 쿼리 무효화 추가 |
| `talk.store.ts` | archive 관련 상태 (필요 시) |
| i18n (`talk.json`) | 시스템 메시지, Archive, 삭제 옵션 다국어 키 추가 |

### Shared Types
| 파일 | 변경 유형 |
|------|----------|
| `domain.types.ts` | `TalkChannelResponse`에 `archivedAt?` 추가, 시스템 메시지 관련 타입 |
