# 요구사항 분석서 - Amoeba Talk 채팅 기능 추가

- **문서 번호**: REQ-AmoebaTalk채팅기능추가-20260303
- **작성일**: 2026-03-03
- **작성자**: Copilot
- **대상 URL**: https://stg-mng.amoeba.site/amoeba-talk

---

## 1. 요구사항 개요

Amoeba Talk (Lobbu Chat) 에 다음 3가지 기능을 추가한다.

| # | 기능 | 설명 |
|---|------|------|
| F1 | **Like 버튼** | 메시지에 Like / Good Job / Sad 이모지 리액션 |
| F2 | **메시지 수신 상태** | Sent → Delivered → Read 상태 표시 |
| F3 | **Reply 기능** | 특정 메시지를 인용하여 답장 |

---

## 2. AS-IS 현황 분석

### 2.1 DB 스키마 현황

| 테이블 | 주요 컬럼 | 비고 |
|--------|----------|------|
| `amb_talk_channels` | chn_id, chn_name, chn_type (PUBLIC/DM/CELL) | ✅ 구현됨 |
| `amb_talk_messages` | msg_id, chn_id, usr_id, msg_content, msg_type, **msg_parent_id** | ✅ reply 컬럼 있음 |
| `amb_talk_channel_members` | chm_id, chn_id, usr_id, chm_role, chm_left_at | ✅ 구현됨 |
| `amb_talk_read_status` | trs_id, chn_id, usr_id, **trs_last_read_at**, **trs_last_msg_id** | ⚠️ 채널 단위 읽음만 |
| `amb_talk_reactions` | - | ❌ 없음 |

### 2.2 Backend 현황

**`message.controller.ts`** - 현재 지원 엔드포인트:

| Method | Path | 상태 |
|--------|------|------|
| GET | `/talk/channels/:id/messages` | ✅ |
| POST | `/talk/channels/:id/messages` | ✅ (parent_id 파라미터 있음) |
| PATCH | `/talk/channels/:id/messages/:msgId` | ✅ |
| DELETE | `/talk/channels/:id/messages/:msgId` | ✅ |
| POST | `/talk/channels/:id/messages/:msgId/translate` | ✅ |
| GET | `/talk/channels/:id/events` (SSE) | ✅ |
| POST | `/talk/channels/:id/messages/:msgId/react` | ❌ 없음 |

**`TalkSseService` 이벤트 타입:**
- `message:new`, `message:update`, `message:delete`, `member:join`, `member:leave`
- `message:reaction`, `message:status` → **없음**

**`TalkMessageResponse` (packages/types):**
```ts
{
  id, channelId, senderId, senderName, content, type,
  parentId,       // ✅ 있음
  createdAt, updatedAt
  // reactions   ❌ 없음
  // deliveryStatus ❌ 없음
}
```

### 2.3 Frontend 현황

| 컴포넌트 | 현황 |
|---------|------|
| `TalkMessageList.tsx` | 메시지 렌더링, 삭제, 번역 버튼 있음 |
| `TalkMessageInput.tsx` | 텍스트 입력, 동시 번역 지원. parent_id 전달 UI 없음 |
| `useTalk.ts` | 메시지 CRUD 훅 존재. reaction/reply 훅 없음 |
| `talk.store.ts` | 번역 상태 관리. reply/reaction 상태 없음 |

### 2.4 Reply 기능 현황 상세

- DB `msg_parent_id` 컬럼 → ✅ 이미 존재
- API `SendMessageRequest.parent_id` → ✅ 이미 지원
- `TalkMessageResponse.parentId` → ✅ 타입에 존재
- **FE Reply UI** → ❌ 전혀 없음 (호버 버튼, 인용 표시, 입력창 컨텍스트 모두 없음)

---

## 3. TO-BE 요구사항

### F1. Like 버튼 (Reactions)

#### 3.1.1 기능 정의
- 메시지에 마우스 호버 시 리액션 피커 버튼(😊) 노출
- 3가지 리액션: **Like** (👍) / **Good Job** (🎉) / **Sad** (😢)
- 동일 리액션 재클릭 시 취소 (토글)
- 리액션 집계를 메시지 하단에 표시 (예: 👍 3)
- 내가 선택한 리액션은 강조 표시

#### 3.1.2 필요 DB
```sql
CREATE TABLE amb_talk_reactions (
  rea_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msg_id       UUID NOT NULL,          -- FK → amb_talk_messages.msg_id
  usr_id       UUID NOT NULL,          -- FK → amb_users.usr_id
  rea_type     VARCHAR(20) NOT NULL,   -- 'LIKE' | 'GOOD_JOB' | 'SAD'
  rea_created_at TIMESTAMP DEFAULT now(),
  UNIQUE (msg_id, usr_id, rea_type)
);
```

#### 3.1.3 필요 API
| Method | Path | 설명 |
|--------|------|------|
| POST | `/talk/channels/:channelId/messages/:msgId/react` | 리액션 추가/취소 (토글) |
| GET  | `/talk/channels/:channelId/messages/:msgId/reactions` | 리액션 목록 조회 |

- 메시지 목록 응답(`TalkMessageResponse`)에 `reactions` 집계 포함:
```ts
reactions: Array<{ type: 'LIKE' | 'GOOD_JOB' | 'SAD'; count: number; reacted: boolean }>
```

#### 3.1.4 SSE 이벤트
- `message:reaction` 이벤트 추가 → 리얼타임 리액션 반영

---

### F2. 메시지 수신 상태 (Delivery Status)

#### 3.2.1 상태 정의

| 상태 | 아이콘 | 조건 |
|------|--------|------|
| **SENDING** | 회색 시계 🕐 | 낙관적 업데이트 중 (API 응답 전) |
| **SENT** | 체크 1개 ✓ | 서버 저장 완료 |
| **READ** | 체크 2개 (파란) ✓✓ | 상대방(들)이 `mark_as_read` 실행 |

> **Delivered 단계 분리 여부**: 실시간 SSE 연결 추적은 구현 복잡도가 높아 **SENT / READ 2단계**로 단순화. DM 채널은 상대방 1명 기준, 그룹 채널은 읽은 멤버 수(n명 읽음) 표시.

#### 3.2.2 구현 방법

**내 메시지의 읽음 상태 계산:**
```
READ 조건:
  - DM: 상대방의 trs_last_msg_id >= 해당 메시지 순서 (createdAt 비교)
  - Group: 1명 이상의 다른 멤버가 해당 메시지 이후 읽음 처리
```

**TalkMessageResponse 변경:**
```ts
// 내 메시지에만 포함 (senderId === currentUser)
readCount?: number   // 읽은 멤버 수 (0이면 SENT)
```

**SSE 이벤트 추가:**
- `channel:read` → 누군가 채널을 읽으면 → 내 메시지 읽음 상태 갱신

#### 3.2.3 표시 위치
- 내 메시지(오른쪽) 하단 우측에 상태 아이콘 표시
- DM: 체크 아이콘 (파란 = 읽음, 회색 = 전송됨)
- 그룹: 읽은 인원 수 숫자 표시 (예: "👁 3")

---

### F3. Reply 기능

#### 3.3.1 기능 정의
- 메시지 호버 시 Reply 버튼(↩) 표시
- 클릭 시 입력창 상단에 **인용 프리뷰** (원 메시지 발신자 + 첫 30자) 표시
- 메시지 전송 시 `parent_id` 포함
- 답장 메시지에 인용된 원본 메시지 미리보기 표시 (원 메시지 삭제 시 "삭제된 메시지" 표시)
- 인용 메시지 클릭 시 원본 메시지로 스크롤 이동

#### 3.3.2 DB/API 현황
- DB `msg_parent_id`: ✅ 이미 있음 (추가 마이그레이션 불필요)
- API `parent_id`: ✅ 이미 지원
- API 메시지 조회 시 parent 메시지 정보 포함 필요 (현재 없음)

**TalkMessageResponse 변경:**
```ts
parentId: string | null    // 기존
parentMessage?: {          // 신규: 부모 메시지 요약
  id: string;
  senderName: string;
  content: string;         // 첫 50자
  deletedAt?: string | null;
} | null;
```

#### 3.3.3 Frontend 변경
- `TalkMessageList.tsx`: 답장 메시지에 인용 블록 렌더링
- `TalkMessageInput.tsx`: 답장 컨텍스트 표시 영역 추가 (X 버튼으로 취소)
- `talk.store.ts`: `replyTo` 상태 추가
- `useTalk.ts`: `sendMessage` mutationFn에 parentId 전달

---

## 4. 갭 분석 (Gap Analysis)

| 기능 | DB | Backend API | SSE 이벤트 | Frontend UI | 타입 정의 |
|------|----|-----------|----|------|------|
| **F1 Like** | ❌ 신규 테이블 | ❌ 신규 엔드포인트 2개 | ❌ 신규 이벤트 | ❌ 전체 신규 | ❌ 타입 추가 |
| **F2 Delivery Status** | ✅ (기존 read_status 활용) | ⚠️ response 필드 추가 | ❌ 신규 이벤트 | ❌ 전체 신규 | ⚠️ 필드 추가 |
| **F3 Reply** | ✅ (parent_id 있음) | ⚠️ parentMessage 포함 필요 | ✅ (기존 이벤트 사용) | ❌ 전체 신규 | ⚠️ 필드 추가 |

---

## 5. 사용자 플로우

### F1 리액션 플로우
```
사용자 메시지 호버
  → 😊 피커 버튼 노출
  → 버튼 클릭 → 👍/🎉/😢 선택
  → POST /react (toggle)
  → SSE message:reaction 브로드캐스트
  → 채널 내 모든 사용자 UI 실시간 업데이트
```

### F2 수신 상태 플로우
```
메시지 전송
  → UI: SENDING 표시 (낙관적)
  → API 성공: SENT 표시 (✓)
  → 상대방 mark_as_read 실행
  → SSE channel:read 이벤트
  → 내 메시지: READ 표시 (✓✓ 파란)
```

### F3 Reply 플로우
```
메시지 호버 → ↩ Reply 버튼 클릭
  → 입력창 상단 인용 프리뷰 표시
  → 메시지 입력 후 전송
  → POST /messages { content, parent_id }
  → 답장 메시지에 인용 블록 렌더링
  → 인용 블록 클릭 → 원본 메시지로 스크롤
```

---

## 6. 기술 제약사항

1. **SSE 구조**: 현재 채널 단위 SSE 연결 (`TalkSseService`)을 그대로 활용. 새 이벤트 타입만 추가.
2. **DB 마이그레이션**: `amb_talk_reactions` 신규 테이블만 필요. 나머지는 기존 테이블 활용.
3. **타입 공유**: `packages/types/src/domain.types.ts`의 `TalkMessageResponse` 변경 시 BE/FE 동시 반영 필요.
4. **읽음 상태 정확도**: Delivery(전달됨) 구분을 위한 SSE 연결 추적은 현재 아키텍처로 어렵고 복잡함 → **Sent/Read 2단계** 단순화.
5. **Reply 깊이**: 1단계 reply만 지원 (대댓글 미지원). parent_id가 있는 메시지는 reply 버튼 비노출.

---

## 7. 비기능 요구사항

- 리액션 토글 응답시간 < 500ms
- SSE 이벤트로 실시간 동기화 (폴링 없음)
- 기존 메시지 로딩/전송 성능에 영향 없어야 함 (reactions lazy loading 또는 메시지 응답에 집계만 포함)
