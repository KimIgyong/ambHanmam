# 요구사항 분석서: Amoeba Talk 동시번역 기능

- **문서 ID**: REQ-AmoebaTalk동시번역-20260302
- **작성일**: 2026-03-02
- **작성자**: AI Agent
- **상태**: 분석 완료

---

## 1. 요구사항 요약

Amoeba Talk(로비 채팅)에서 다음 3가지 번역 기능을 구현한다:

| # | 요구사항 | 설명 |
|---|---------|------|
| R1 | **동시번역 입력** | 대화 입력 완료 시 "동시번역" 버튼으로 원문+번역문을 동시에 대화창에 입력 |
| R2 | **타인 메시지 번역 기록** | 다른 사람 대화 번역 시 "대화소유자 - 번역요청자" 형태로 대화창에 기록 |
| R3 | **KMS 지식 연동** | 모든 대화와 번역을 KMS 지식관리에서 컨트롤 |

---

## 2. AS-IS 현황 분석

### 2.1 Amoeba Talk 백엔드 구조

| 구성요소 | 경로 | 역할 |
|---------|------|------|
| `TalkMessageEntity` | `apps/api/src/domain/amoeba-talk/entity/talk-message.entity.ts` | 메시지 엔티티 (amb_talk_messages) |
| `TalkChannelEntity` | `apps/api/src/domain/amoeba-talk/entity/talk-channel.entity.ts` | 채널 엔티티 (amb_talk_channels) |
| `TalkChannelMemberEntity` | `apps/api/src/domain/amoeba-talk/entity/talk-channel-member.entity.ts` | 채널 멤버 엔티티 |
| `MessageService` | `apps/api/src/domain/amoeba-talk/service/message.service.ts` | 메시지 CRUD, 검색 |
| `MessageTranslateService` | `apps/api/src/domain/amoeba-talk/service/message-translate.service.ts` | AI 메시지 번역 + DB 캐싱 |
| `TalkSseService` | `apps/api/src/domain/amoeba-talk/service/talk-sse.service.ts` | SSE 실시간 이벤트 브로드캐스트 |
| `MessageController` | `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | REST API 엔드포인트 |
| `SendMessageRequest` | `apps/api/src/domain/amoeba-talk/dto/request/send-message.request.ts` | 메시지 전송 DTO |

#### 현재 메시지 엔티티 (TalkMessageEntity)
```
amb_talk_messages
├── msg_id (PK, UUID)
├── chn_id (채널 ID)
├── usr_id (발신자 ID)
├── msg_content (TEXT)
├── msg_type (VARCHAR 20, default 'TEXT') → 현재: TEXT | FILE | SYSTEM
├── msg_parent_id (UUID, nullable) → 스레드 답글용
├── msg_created_at
├── msg_updated_at
└── msg_deleted_at (soft delete)
```

#### 현재 메시지 전송 DTO (SendMessageRequest)
```typescript
{
  content: string;       // 필수
  type?: string;         // TEXT | FILE | SYSTEM
  parent_id?: string;    // 스레드 답글
}
```

#### 현재 번역 서비스 (MessageTranslateService)
- `translateMessage()`: 단일 메시지 AI 번역 → `ContentTranslationEntity`에 캐시
- `getTranslations()`: 메시지별 번역 목록 조회
- 번역은 `ContentTranslationEntity`(amb_content_translations)에 SourceType='TALK_MESSAGE'로 저장

### 2.2 Amoeba Talk 프론트엔드 구조

| 구성요소 | 경로 | 역할 |
|---------|------|------|
| `TalkMessageInput` | `components/TalkMessageInput.tsx` | 메시지 입력/전송 UI |
| `TalkMessageList` | `components/TalkMessageList.tsx` | 메시지 목록 표시 |
| `MessageTranslateButton` | `components/MessageTranslateButton.tsx` | 메시지별 번역 버튼 (Languages 아이콘 → 언어 드롭다운) |
| `MessageTranslation` | `components/MessageTranslation.tsx` | 번역 결과 인라인 표시 |
| `talk.store.ts` | `store/talk.store.ts` | Zustand 상태 (translations 캐시) |
| `talk.service.ts` | `service/talk.service.ts` | API 클라이언트 |
| `useTalk.ts` | `hooks/useTalk.ts` | React Query 훅 |

#### 현재 번역 UX 플로우
1. 메시지 hover → Languages 아이콘 표시
2. 클릭 → 언어 선택 드롭다운 (English/Korean/Vietnamese)
3. 언어 선택 → API 호출 (`POST /translate`)
4. 결과 → Zustand store에 임시 저장 → 메시지 하단에 인라인 표시
5. X 버튼으로 닫기 가능
6. **한계**: 새로고침하면 번역 결과 사라짐 (store 기반이므로)

### 2.3 번역 저장소 (ContentTranslationEntity)

```
amb_content_translations
├── trn_id (PK)
├── ent_id (법인 ID)
├── trn_source_type ('TALK_MESSAGE')
├── trn_source_id (메시지 ID)
├── trn_source_field ('content')
├── trn_source_lang / trn_target_lang
├── trn_content (번역된 내용)
├── trn_method ('AI')
├── trn_translated_by (번역 요청자 ID)
├── trn_is_stale (원문 변경 시 true)
└── trn_created_at / trn_updated_at
```

### 2.4 KMS 연동 구조

| 구성요소 | 설명 |
|---------|------|
| `ModuleDataEvent` | 모듈 데이터 이벤트 인터페이스 (module, type, refId, title, content, ownerId, entityId, visibility) |
| `MODULE_DATA_EVENTS` | `CREATED`, `UPDATED` 이벤트 상수 |
| `WorkItemSyncListener` | 이벤트 감청 → WorkItem 자동 생성/업데이트 |
| `AutoTaggingService` | 워크아이템 AI 자동 태깅 |

현재 KMS 연동 모듈: `todo`, `billing`, `webmail`, `meeting-notes`, `drive`, `issue`, `partner`, `notice`, `service`, `client`  
**→ `talk` 모듈은 아직 KMS에 연동되지 않음**

### 2.5 SSE 이벤트 구조

현재 TalkSseService 이벤트 타입:
- `message:new` - 새 메시지
- `message:update` - 메시지 수정
- `message:delete` - 메시지 삭제
- `member:join` - 멤버 참가
- `member:leave` - 멤버 탈퇴

---

## 3. TO-BE 요구사항 상세

### 3.1 R1: 동시번역 입력

#### 사용자 플로우
```
[사용자] 메시지 작성 → "동시번역" 토글 ON → 대상 언어 선택 (예: English)
→ Enter 또는 전송 버튼 클릭
→ 원문 AI 번역 수행
→ 대화창에 원문 + 번역문이 함께 표시 (하나의 메시지로)
```

#### 메시지 표시 형태 (예시)
```
[김이경] 14:32
안녕하세요, 회의 일정을 확인해주세요.

---
🌐 Hello, please check the meeting schedule.
```

#### 기술 요구사항
- TalkMessageInput에 동시번역 토글 버튼 추가
- 토글 활성화 시 대상 언어 선택 드롭다운 표시
- 전송 시 원문과 번역문을 결합한 단일 메시지로 저장
- 메시지 타입: `TEXT` (기존 호환) 또는 새로운 `TRANSLATED` 타입
- 번역 결과는 ContentTranslation에도 기록 (캐시/추적용)

#### 방안 비교

| 방안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A. 단일 메시지 (합쳐서 저장) | 원문+번역문을 `\n---\n🌐 번역문` 형태로 합체 | 기존 구조 변경 최소, 다른 사용자에게 자연스럽게 보임 | 원문/번역문 분리 파싱 필요 |
| B. 두 개 메시지 (원문+번역) | 원문 메시지 + TRANSLATION 타입 메시지 2개 전송 | 데이터 명확, 번역 표시 커스텀 용이 | 메시지 수 2배, UX 복잡 |
| C. 메시지 본문 + 메타데이터 | msg_content에 원문만 저장, 번역은 별도 필드/JSON | 데이터 정규화 깔끔 | 엔티티 컬럼 추가 필요, 스키마 변경 |

**권장: 방안 A** (단일 메시지로 합쳐서 저장) - 기존 구조 변경 최소, 모든 클라이언트에서 호환

### 3.2 R2: 타인 메시지 번역 기록

#### 사용자 플로우
```
[사용자B] 타인(사용자A)의 메시지에서 번역 버튼 클릭 → 언어 선택
→ 번역 결과가 대화창에 새 메시지(TRANSLATION 타입)로 기록
→ 기록 형태: "[사용자A]의 메시지를 [사용자B]이(가) 번역" + 번역문
```

#### 메시지 표시 형태 (예시)
```
[시스템] 14:35
🌐 사용자A → 번역: 사용자B (Korean → English)
─────
Hello, please check the meeting schedule.
```

#### 기술 요구사항
- 번역 완료 시 `msg_type = 'TRANSLATION'` 메시지를 채널에 자동 추가
- 원본 메시지 참조: `msg_parent_id` 활용
- 발신자: 번역 요청자(사용자B)
- 프론트엔드: TRANSLATION 타입 메시지는 특별한 UI로 렌더링
  - 원문 작성자, 번역 요청자, 원문/번역문 언어, 번역문 표시
- ContentTranslation에도 캐시 저장 (기존 로직 유지)

### 3.3 R3: KMS 지식 연동

#### 연동 범위
1. **채널 대화 → WorkItem 동기화**: 채널별로 대화 내용을 KMS WorkItem으로 동기화
2. **번역 기록 → WorkItem 업데이트**: 번역 발생 시 해당 WorkItem 업데이트

#### 이벤트 발행 시점
| 시점 | 이벤트 | 설명 |
|------|--------|------|
| 메시지 전송 | `MODULE_DATA_EVENTS.CREATED` | 새 대화 메시지 → WorkItem 생성/업데이트 |
| 동시번역 전송 | `MODULE_DATA_EVENTS.CREATED` | 동시번역 메시지 → WorkItem 생성/업데이트 |
| 타인 번역 기록 | `MODULE_DATA_EVENTS.UPDATED` | 번역 메시지 → 기존 WorkItem에 번역 이력 추가 |

#### KMS 데이터 매핑
```typescript
{
  module: 'talk',
  type: 'NOTE',            // 대화 메모로 분류
  refId: channelId,        // 채널 ID를 기준으로 집약
  title: `[Talk] ${channelName}`,
  content: messageContent,  // 최근 N개 메시지 요약 또는 개별 메시지
  ownerId: senderId,
  entityId: userEntityId,
  visibility: channelType === 'PUBLIC' ? 'ENTITY' : 'CELL',
}
```

---

## 4. 갭 분석

| # | 현재 상태 | 필요 변경 | 영향 범위 |
|---|----------|----------|----------|
| G1 | TalkMessageInput에 동시번역 기능 없음 | 동시번역 토글 + 언어 선택 UI 추가 | 프론트엔드 |
| G2 | 메시지 전송 시 번역 처리 없음 | 전송 전 AI 번역 + 합성 메시지 생성 | 백엔드 + 프론트엔드 |
| G3 | 타인 메시지 번역은 클라이언트 사이드만 | TRANSLATION 타입 메시지 대화창 기록 | 백엔드 + 프론트엔드 |
| G4 | msg_type에 TRANSLATION 없음 | TRANSLATION 타입 추가 + DTO 검증 | 백엔드 + 공유 타입 |
| G5 | TRANSLATION 메시지용 UI 없음 | 번역 메시지 전용 렌더 컴포넌트 | 프론트엔드 |
| G6 | Talk 모듈 KMS 미연동 | EventEmitter2로 MODULE_DATA_EVENTS 발행 | 백엔드 |
| G7 | TalkMessageResponse에 번역 관련 필드 없음 | 메타데이터 필드 추가 검토 | 공유 타입 |
| G8 | SSE에 translation 이벤트 없음 | `message:translated` 이벤트 타입 추가 | 백엔드 + 프론트엔드 |

---

## 5. 기술 제약사항

1. **AI 번역 지연**: Claude API 호출에 1-3초 소요 → 전송 시 "번역 중..." 로딩 필요
2. **메시지 구조 호환성**: msg_type에 TRANSLATION 추가 시 기존 데이터/UI에 영향 없음 확인 필요
3. **SSE 브로드캐스트**: TRANSLATION 메시지도 `message:new`로 브로드캐스트하여 모든 채널 멤버에게 실시간 표시
4. **i18n**: 번역 관련 새 UI 텍스트를 ko/en/vi 3개 언어로 추가 필요
5. **KMS WorkItem 빈도**: 메시지마다 이벤트 발행 시 부하 → 채널 단위 일괄 처리 또는 디바운스 검토

---

## 6. 사용자 플로우 다이어그램

### 6.1 동시번역 전송 플로우
```
[사용자] → "동시번역" 토글 ON → 대상 언어 선택 (예: English)
  ↓
메시지 입력 → Enter 클릭
  ↓
[프론트엔드] → POST /talk/channels/:chnId/messages/translate-send
  ↓
[백엔드] 
  ├── 1. AI 번역 수행 (Claude API)
  ├── 2. 원문+번역문 합성 메시지 생성 → DB 저장
  ├── 3. ContentTranslation에 번역 캐시 저장
  ├── 4. SSE broadcast (message:new)
  └── 5. KMS 이벤트 발행 (MODULE_DATA_EVENTS.CREATED)
  ↓
[모든 채널 멤버] → SSE 수신 → 원문+번역문 표시
```

### 6.2 타인 메시지 번역 + 기록 플로우
```
[사용자B] → 사용자A의 메시지에서 번역 버튼 클릭 → 언어 선택
  ↓
[프론트엔드] → POST /talk/channels/:chnId/messages/:msgId/translate-and-post
  ↓
[백엔드]
  ├── 1. 기존 번역 캐시 확인
  ├── 2. 없으면 AI 번역 수행
  ├── 3. ContentTranslation에 저장
  ├── 4. TRANSLATION 타입 메시지 생성 (parent_id = 원문 msgId)
  ├── 5. SSE broadcast (message:new)
  └── 6. KMS 이벤트 발행 (MODULE_DATA_EVENTS.UPDATED)
  ↓
[모든 채널 멤버] → SSE 수신 → 번역 메시지 표시 (소유자-번역자 표기)
```

---

## 7. 영향 범위 요약

### 백엔드 변경
| 파일 | 변경 내용 |
|------|----------|
| `send-message.request.ts` | `translate_to` 필드 추가 |
| `message.service.ts` | `sendTranslatedMessage()` 메서드 추가 |
| `message-translate.service.ts` | `translateAndPost()` 메서드 추가 |
| `message.controller.ts` | 새 엔드포인트 2개 추가 |
| `talk-sse.service.ts` | `message:translated` 이벤트 타입 추가 (선택) |
| `message.mapper.ts` | TRANSLATION 타입 메시지 매핑 |
| KMS 연동 | `EventEmitter2`로 `ModuleDataEvent` 발행 로직 |

### 프론트엔드 변경
| 파일 | 변경 내용 |
|------|----------|
| `TalkMessageInput.tsx` | 동시번역 토글 + 언어 선택 UI |
| `TalkMessageList.tsx` | TRANSLATION 타입 메시지 렌더링 |
| `MessageTranslateButton.tsx` | 번역 + 대화 기록 옵션 추가 |
| `talk.service.ts` | 새 API 함수 추가 |
| `useTalk.ts` | 새 mutation 훅 추가 |
| `talk.store.ts` | 동시번역 상태 관리 |
| locales (ko/en/vi) `talk.json` | 새 i18n 키 추가 |

### 공유 타입 변경
| 파일 | 변경 내용 |
|------|----------|
| `@amb/types` | TalkMessageResponse에 type 'TRANSLATION' 추가, 번역 메타 필드 |

---

## 8. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| 성능 | 동시번역 전송 → 응답 5초 이내 |
| 호환성 | 기존 TEXT/FILE/SYSTEM 메시지 표시에 영향 없음 |
| i18n | 모든 새 UI 텍스트를 ko/en/vi 3개 언어 지원 |
| 접근성 | 번역 토글, 언어 선택에 키보드 접근성 보장 |
| 데이터 무결성 | 번역 실패 시 원문만 전송 (fallback) |
