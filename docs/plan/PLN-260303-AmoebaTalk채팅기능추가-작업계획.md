# 작업 계획서 - Amoeba Talk 채팅 기능 추가

- **문서 번호**: PLAN-AmoebaTalk채팅기능추가-작업계획-20260303
- **참조 분석서**: REQ-AmoebaTalk채팅기능추가-20260303
- **작성일**: 2026-03-03

---

## 1. 구현 범위 요약

| 기능 | 신규 파일 | 수정 파일 |
|------|----------|----------|
| F1 Like/Reaction | 4개 (entity, service, mapper, controller endpoint 통합) | 5개 |
| F2 Delivery Status | 0개 | 4개 |
| F3 Reply UI | 1개 (ReplyPreview 컴포넌트) | 3개 |

---

## 2. 사이드 임팩트 분석

| 변경 대상 | 영향 범위 | 대응 |
|----------|---------|------|
| `TalkMessageResponse` 타입 변경 | BE + FE 동시 반영 필수 | 하위 호환: 모든 신규 필드 optional |
| `TalkSseService` 이벤트 타입 추가 | SSE 구독 클라이언트(`useTalkSSE.ts`) | 신규 이벤트 타입만 추가, 기존 유지 |
| `amb_talk_reactions` 신규 테이블 | DB 마이그레이션 필요 | TypeORM synchronize or migration |
| 메시지 목록 조회 시 reactions/parentMessage 포함 | 쿼리 성능 | reactions는 집계만(COUNT), parentMessage는 1단계만 JOIN |

---

## 3. 단계별 구현 계획

### Phase 1. 공유 타입 변경 (`packages/types`)

**파일**: `packages/types/src/domain.types.ts`

```ts
// TalkReactionType 추가
export type TalkReactionType = 'LIKE' | 'GOOD_JOB' | 'SAD';

// TalkMessageResponse 수정 (optional 필드 추가)
export interface TalkMessageResponse {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: TalkMessageType;
  parentId: string | null;
  parentMessage?: {                    // F3 Reply
    id: string;
    senderName: string;
    content: string;
    isDeleted: boolean;
  } | null;
  reactions?: TalkReactionSummary[];   // F1 Like
  readCount?: number;                  // F2 Delivery Status
  createdAt: string;
  updatedAt: string;
}

export interface TalkReactionSummary {
  type: TalkReactionType;
  count: number;
  reacted: boolean;  // 현재 사용자가 리액션했는지
}
```

---

### Phase 2. Backend - F1 Like/Reaction

#### 2-1. DB Entity 생성
**신규**: `apps/api/src/domain/amoeba-talk/entity/talk-reaction.entity.ts`

```ts
@Entity('amb_talk_reactions')
@Unique(['msgId', 'usrId', 'reaType'])
export class TalkReactionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'rea_id' })
  reaId: string;

  @Column({ name: 'msg_id', type: 'uuid' })
  msgId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'rea_type', length: 20 })
  reaType: string;  // 'LIKE' | 'GOOD_JOB' | 'SAD'

  @CreateDateColumn({ name: 'rea_created_at' })
  reaCreatedAt: Date;
}
```

#### 2-2. Reaction DTO 생성
**신규**: `apps/api/src/domain/amoeba-talk/dto/request/react-message.request.ts`

```ts
export class ReactMessageRequest {
  @IsString()
  @IsIn(['LIKE', 'GOOD_JOB', 'SAD'])
  type: string;
}
```

#### 2-3. MessageService 수정
**수정**: `apps/api/src/domain/amoeba-talk/service/message.service.ts`

- `toggleReaction(messageId, type, userId)` 메서드 추가
- `getMessages()` / `sendMessage()` 반환 시 reactions 집계 포함
  - LEFT JOIN 또는 별도 쿼리 후 attach
  - `SELECT rea_type, COUNT(*) FROM amb_talk_reactions WHERE msg_id IN (...) GROUP BY rea_type, msg_id`
  - 현재 userId 기준 `reacted` 필드 계산

#### 2-4. MessageController 수정
**수정**: `apps/api/src/domain/amoeba-talk/controller/message.controller.ts`

```ts
@Post(':messageId/react')
async reactMessage(
  @Param('channelId') channelId: string,
  @Param('messageId') messageId: string,
  @Body() dto: ReactMessageRequest,
  @CurrentUser() user: UserPayload,
) {
  const data = await this.messageService.toggleReaction(messageId, dto.type, user.userId);
  this.sseService.emit({ channelId, type: 'message:reaction', data });
  return { success: true, data };
}
```

#### 2-5. TalkSseService 이벤트 타입 확장
**수정**: `apps/api/src/domain/amoeba-talk/service/talk-sse.service.ts`

```ts
type: 'message:new' | 'message:update' | 'message:delete'
    | 'message:reaction'   // 추가
    | 'channel:read'       // 추가 (F2)
    | 'member:join' | 'member:leave'
```

#### 2-6. Module 등록
**수정**: `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts`
- `TalkReactionEntity` TypeORM 등록

---

### Phase 3. Backend - F2 Delivery Status

#### 3-1. MessageService 수정
- `getMessages()` 반환 시 `readCount` 포함
  - 각 메시지의 `createdAt` 이후 읽음 처리한 다른 멤버 수 계산
  - `SELECT COUNT(*) FROM amb_talk_read_status WHERE chn_id = ? AND trs_last_read_at >= msg.created_at AND usr_id != sender_id`
  - **최적화**: 메시지 배치에 대해 한 번에 처리 (N+1 방지)

#### 3-2. ChannelService - mark_as_read SSE 이벤트 발행
**수정**: `apps/api/src/domain/amoeba-talk/service/channel.service.ts`

- `markAsRead()` 실행 시 `channel:read` SSE 이벤트 emit
  ```ts
  this.sseService.emit({ channelId, type: 'channel:read', data: { userId } });
  ```

---

### Phase 4. Backend - F3 Reply (parentMessage 포함)

#### 4-1. MessageService 수정
- `getMessages()` 에서 `parentId`가 있는 메시지에 대해 parent 정보 조회 후 attach
  - 배치로 처리: `parentId` 목록 추출 → WHERE msgId IN (...) 한 번 조회
- `MessageMapper.toMessageResponse()` 수정: `parentMessage` 필드 포함

---

### Phase 5. Frontend - F1 Like/Reaction UI

#### 5-1. talk.service.ts 수정
```ts
reactMessage = (channelId: string, messageId: string, type: string) =>
  apiClient.post(`${this.basePath}/channels/${channelId}/messages/${messageId}/react`, { type })
    .then(r => r.data.data);
```

#### 5-2. useTalk.ts 수정
```ts
export const useReactMessage = () => { ... }  // 훅 추가
```

#### 5-3. TalkMessageList.tsx 수정
- 메시지 hover 시 리액션 피커 버튼 표시
- 리액션 집계 표시 컴포넌트 인라인 추가
  ```
  [👍 2] [🎉 1]  ← 내가 리액션한 것은 파란색 테두리
  ```
- `useTalkSSE.ts`: `message:reaction` 이벤트 처리 추가

---

### Phase 6. Frontend - F2 Delivery Status UI

#### 6-1. TalkMessageList.tsx 수정
- 내 메시지(isOwn) 하단에 상태 아이콘 추가
  ```tsx
  // readCount 기반
  {isOwn && (
    <span className="text-xs">
      {readCount > 0 ? '✓✓' : '✓'}  {/* 파란/회색 */}
    </span>
  )}
  ```
- DM: `readCount > 0` → 파란 체크 2개
- 그룹: `readCount > 0` → "👁 {readCount}"

#### 6-2. useTalkSSE.ts 수정
- `channel:read` 이벤트 수신 시 → 메시지 쿼리 invalidate

---

### Phase 7. Frontend - F3 Reply UI

#### 7-1. talk.store.ts 수정
```ts
replyTo: { id: string; senderName: string; content: string } | null;
setReplyTo: (msg: ...) => void;
clearReplyTo: () => void;
```

#### 7-2. 신규 컴포넌트: `ReplyPreview.tsx`
- 입력창 상단 인용 프리뷰 (발신자 이름 + 본문 30자 + X 취소 버튼)

#### 7-3. TalkMessageInput.tsx 수정
- `replyTo` store 구독 → `ReplyPreview` 렌더링
- 전송 시 `parent_id: replyTo?.id` 포함
- 전송 성공 후 `clearReplyTo()`

#### 7-4. TalkMessageList.tsx 수정
- `parentMessage` 필드가 있는 메시지: 인용 블록 렌더링
  ```tsx
  {msg.parentMessage && (
    <div className="border-l-2 border-indigo-300 pl-2 mb-1 text-xs text-gray-400">
      <span className="font-medium">{msg.parentMessage.senderName}</span>
      <p>{msg.parentMessage.isDeleted ? '삭제된 메시지' : msg.parentMessage.content.slice(0, 50)}</p>
    </div>
  )}
  ```
- 인용 블록 클릭 시 해당 메시지로 스크롤 (`element.scrollIntoView`)
- 메시지 호버 시 ↩ Reply 버튼 추가
  - `parentId`가 있는 메시지는 Reply 버튼 비노출 (1단계만 지원)

---

## 4. 파일 변경 목록

### 신규 파일
| 파일 경로 | 설명 |
|----------|------|
| `apps/api/src/domain/amoeba-talk/entity/talk-reaction.entity.ts` | 리액션 DB 엔티티 |
| `apps/api/src/domain/amoeba-talk/dto/request/react-message.request.ts` | 리액션 요청 DTO |
| `apps/web/src/domain/amoeba-talk/components/ReplyPreview.tsx` | 답장 인용 프리뷰 컴포넌트 |

### 수정 파일
| 파일 경로 | 변경 내용 |
|----------|---------|
| `packages/types/src/domain.types.ts` | TalkMessageResponse 필드 추가, TalkReactionType/Summary 추가 |
| `apps/api/src/domain/amoeba-talk/entity/talk-message.entity.ts` | (변경 없음, parent_id 이미 있음) |
| `apps/api/src/domain/amoeba-talk/service/message.service.ts` | reactions 집계, readCount, parentMessage, toggleReaction 추가 |
| `apps/api/src/domain/amoeba-talk/service/channel.service.ts` | markAsRead 시 channel:read SSE emit 추가 |
| `apps/api/src/domain/amoeba-talk/service/talk-sse.service.ts` | message:reaction, channel:read 이벤트 타입 추가 |
| `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | POST :msgId/react 엔드포인트 추가 |
| `apps/api/src/domain/amoeba-talk/mapper/message.mapper.ts` | parentMessage, reactions, readCount 매핑 추가 |
| `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` | TalkReactionEntity 등록 |
| `apps/web/src/domain/amoeba-talk/service/talk.service.ts` | reactMessage API 추가 |
| `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts` | useReactMessage 훅 추가 |
| `apps/web/src/domain/amoeba-talk/store/talk.store.ts` | replyTo 상태 추가 |
| `apps/web/src/domain/amoeba-talk/hooks/useTalkSSE.ts` | message:reaction, channel:read 이벤트 처리 |
| `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx` | 리액션 UI, 수신 상태, 답장 인용 블록, Reply 버튼 추가 |
| `apps/web/src/domain/amoeba-talk/components/TalkMessageInput.tsx` | ReplyPreview 통합, parent_id 전달 |

---

## 5. 구현 순서 (의존성 기반)

```
Phase 1 (타입)
  ↓
Phase 2 (BE Reaction)  →  Phase 3 (BE Status)  →  Phase 4 (BE Reply)
  ↓                            ↓                         ↓
Phase 5 (FE Reaction)   Phase 6 (FE Status)      Phase 7 (FE Reply)
```

- Phase 1 완료 후 BE/FE 병렬 진행 가능
- FE는 BE 완료 후 통합 테스트

---

## 6. i18n 키 추가 목록

`apps/web/src/locales/*/talk.json` 에 추가 필요:

```json
{
  "reaction": {
    "like": "좋아요",
    "goodJob": "잘했어요",
    "sad": "슬퍼요"
  },
  "reply": {
    "replyTo": "{{name}}에게 답장",
    "cancel": "취소",
    "deletedMessage": "삭제된 메시지",
    "replyButton": "답장"
  },
  "deliveryStatus": {
    "sending": "전송 중",
    "sent": "전송됨",
    "read": "읽음",
    "readCount": "{{count}}명이 읽음"
  }
}
```

---

## 7. 주요 기술 결정 사항

| 항목 | 결정 | 근거 |
|------|------|------|
| Delivery 단계 수 | Sent / Read 2단계 | SSE 연결 추적 복잡도 > 사용자 가치 |
| Reaction 집계 방식 | 메시지 목록 응답에 포함 (count + reacted) | 별도 API 불필요, 캐시 효율적 |
| Reply 깊이 | 1단계만 | 복잡도 제한, Slack 스타일 |
| parentMessage 조회 | 배치 IN 쿼리 | N+1 방지 |
| Reaction 피커 | hover 시 노출 (인라인) | 모달 불필요 |
