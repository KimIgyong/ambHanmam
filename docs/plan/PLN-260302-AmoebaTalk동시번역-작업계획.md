# 작업 계획서: Amoeba Talk 동시번역 기능

- **문서 ID**: PLAN-AmoebaTalk동시번역-작업계획-20260302
- **작성일**: 2026-03-02
- **관련 분석서**: REQ-AmoebaTalk동시번역-20260302
- **브랜치**: `feature/talk-translation`

---

## 1. 구현 단계 개요

| 단계 | 작업 | 예상 난이도 |
|------|------|-----------|
| **Phase 1** | 백엔드 - 동시번역 전송 API | ★★☆ |
| **Phase 2** | 백엔드 - 타인 번역 기록 API | ★★☆ |
| **Phase 3** | 백엔드 - KMS 연동 | ★☆☆ |
| **Phase 4** | 프론트엔드 - 동시번역 입력 UI | ★★★ |
| **Phase 5** | 프론트엔드 - 번역 메시지 렌더링 + 타인 번역 기록 | ★★☆ |
| **Phase 6** | i18n + 테스트 + 배포 | ★☆☆ |

---

## 2. Phase 1: 백엔드 - 동시번역 전송 API

### 2.1 SendMessageRequest DTO 확장

**파일**: `apps/api/src/domain/amoeba-talk/dto/request/send-message.request.ts`

```typescript
// 추가 필드
@IsOptional()
@IsString()
@IsIn(['en', 'ko', 'vi', 'ja', 'zh'])
translate_to?: string;  // 동시번역 대상 언어
```

### 2.2 MessageService.sendMessage() 수정

**파일**: `apps/api/src/domain/amoeba-talk/service/message.service.ts`

변경 내용:
- `sendMessage()` 에서 `dto.translate_to`가 있으면:
  1. `MessageTranslateService`를 주입받아 AI 번역 수행
  2. 원문 + 구분선 + 번역문을 합성한 content 생성
  3. 합성 메시지를 DB에 저장
  4. `ContentTranslation`에 번역 캐시도 저장
- `translate_to`가 없으면 기존 로직 그대로

합성 메시지 포맷:
```
{원문}

---
🌐 [{target_lang}] {번역문}
```

### 2.3 KMS 이벤트 발행

`MessageService`에 `EventEmitter2` 주입 → 메시지 저장 후 `MODULE_DATA_EVENTS.CREATED` 발행

### 2.4 사이드 임팩트 분석
- `translate_to`는 Optional이므로 기존 클라이언트(translate_to 미전달)는 영향 없음
- 메시지 content에 번역문이 포함되므로 기존 TalkMessageList에서도 표시 가능

---

## 3. Phase 2: 백엔드 - 타인 번역 기록 API

### 3.1 새 엔드포인트

**파일**: `apps/api/src/domain/amoeba-talk/controller/message.controller.ts`

```
POST /talk/channels/:channelId/messages/:messageId/translate-and-post
Body: { target_lang: string }
```

### 3.2 MessageTranslateService.translateAndPost() 메서드

**파일**: `apps/api/src/domain/amoeba-talk/service/message-translate.service.ts`

로직:
1. 기존 `translateMessage()` 로직으로 번역 수행 (캐시 확인 포함)
2. TRANSLATION 타입 메시지 생성:
   ```typescript
   {
     chnId: channelId,
     usrId: requesterId,         // 번역 요청자
     msgContent: translatedContent,
     msgType: 'TRANSLATION',
     msgParentId: originalMessageId,  // 원문 참조
   }
   ```
3. 메시지 저장 → SSE broadcast
4. KMS 이벤트 발행

### 3.3 메시지 응답에 번역 메타데이터 추가

**파일**: `apps/api/src/domain/amoeba-talk/mapper/message.mapper.ts`

TRANSLATION 타입 메시지의 경우 응답에 추가 필드:
```typescript
{
  // 기존 필드...
  type: 'TRANSLATION',
  parentId: originalMsgId,     // 원문 메시지 ID (이미 있음)
  // 프론트엔드에서 parentId로 원문 메시지 참조하여 원문 작성자 표시
}
```

### 3.4 SendMessageRequest DTO 수정

`msg_type`에 `'TRANSLATION'` 추가:
```typescript
@IsIn(['TEXT', 'FILE', 'SYSTEM', 'TRANSLATION'])
```

### 3.5 사이드 임팩트 분석
- 새 엔드포인트이므로 기존 API에 영향 없음
- TRANSLATION 타입 메시지가 목록에 나오기 시작 → 프론트엔드에서 별도 렌더링 필요 (Phase 5)
- msg_parent_id 기존 용도(스레드 답글)와 TRANSLATION 참조가 겹침 → msg_type으로 구분

---

## 4. Phase 3: 백엔드 - KMS 연동

### 4.1 EventEmitter2 주입

**파일**: `apps/api/src/domain/amoeba-talk/service/message.service.ts`

```typescript
constructor(
  // 기존 주입...
  private readonly eventEmitter: EventEmitter2,
) {}
```

### 4.2 이벤트 발행 로직

메시지 저장 후:
```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'talk',
  type: 'NOTE',
  refId: channelId,
  title: `[Talk] ${channelName || 'Channel Message'}`,
  content: messageContent,
  ownerId: userId,
  visibility: 'CELL',
} as ModuleDataEvent);
```

### 4.3 module-data.event.ts 주석 업데이트

**파일**: `apps/api/src/domain/kms/event/module-data.event.ts`

`module` 주석에 `'talk'` 추가

### 4.4 사이드 임팩트 분석
- WorkItemSyncListener가 `module: 'talk'`을 자동 처리 (새 코드 불필요)
- AutoTaggingService도 자동으로 태깅 시도
- 메시지마다 이벤트 발행 시 부하 가능 → 동시번역 메시지와 TRANSLATION 메시지에만 발행하는 것을 권장

---

## 5. Phase 4: 프론트엔드 - 동시번역 입력 UI

### 5.1 TalkMessageInput.tsx 수정

**파일**: `apps/web/src/domain/amoeba-talk/components/TalkMessageInput.tsx`

변경 내용:
1. 동시번역 토글 버튼 추가 (Languages 아이콘)
2. 토글 ON 시 언어 선택 드롭다운 (English / Korean / Vietnamese)
3. 전송 시 `sendMessage({ content, translate_to: selectedLang })` 호출
4. 전송 중 "번역 중..." 로딩 상태 표시

UI 레이아웃:
```
┌─────────────────────────────────────────────┐
│ [🌐 동시번역 ▾ Korean→English]              │
│ ┌─────────────────────────────────────┐ [▶] │
│ │ 메시지를 입력하세요...               │     │
│ └─────────────────────────────────────┘     │
│ Shift+Enter로 줄바꿈, Enter로 전송          │
└─────────────────────────────────────────────┘
```

### 5.2 talk.store.ts 수정

**파일**: `apps/web/src/domain/amoeba-talk/store/talk.store.ts`

추가 상태:
```typescript
simultaneousTranslation: boolean;         // 동시번역 활성화 여부
simultaneousTranslationLang: string;      // 대상 언어

setSimultaneousTranslation: (enabled: boolean) => void;
setSimultaneousTranslationLang: (lang: string) => void;
```

### 5.3 talk.service.ts 수정

**파일**: `apps/web/src/domain/amoeba-talk/service/talk.service.ts`

`sendMessage()` 호출 시 `translate_to` 파라미터 전달:
```typescript
sendMessage = (channelId: string, data: { 
  content: string; 
  type?: string; 
  parent_id?: string;
  translate_to?: string;  // 추가
}) => ...
```

### 5.4 useTalk.ts 수정

**파일**: `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts`

`useSendMessage()` 훅에 `translateTo` 파라미터 추가:
```typescript
mutationFn: ({ channelId, content, translateTo }: { 
  channelId: string; 
  content: string; 
  translateTo?: string;
}) => talkService.sendMessage(channelId, { content, translate_to: translateTo }),
```

---

## 6. Phase 5: 프론트엔드 - 번역 메시지 렌더링

### 6.1 TalkMessageList.tsx 수정

**파일**: `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx`

TRANSLATION 타입 메시지 구분 렌더링:
```tsx
{msg.type === 'TRANSLATION' ? (
  <TranslationMessage msg={msg} allMessages={allMessages} />
) : (
  // 기존 메시지 렌더링
)}
```

### 6.2 TranslationMessage 컴포넌트 생성

**파일**: `apps/web/src/domain/amoeba-talk/components/TranslationMessage.tsx` (신규)

표시 내용:
- 원문 작성자 이름 (parentId로 원문 메시지 찾아서)
- 번역 요청자 이름
- 번역문
- 시간

UI 디자인:
```
🌐 [사용자A] → 번역: [사용자B]
──────────────────
Hello, please check the meeting schedule.
                                    14:35
```

### 6.3 MessageTranslateButton.tsx 수정

**파일**: `apps/web/src/domain/amoeba-talk/components/MessageTranslateButton.tsx`

기존 "클라이언트 사이드만 번역" 동작을 변경:
- 번역 시 `translateAndPost` API 호출 → 대화창에 기록
- 기존 인라인 번역(MessageTranslation)은 유지하되, 추가로 대화 기록도 생성

### 6.4 talk.service.ts에 translateAndPost 추가

```typescript
translateAndPost = (channelId: string, messageId: string, targetLang: string) =>
  apiClient
    .post<BaseSingleResponse<TalkMessageResponse>>(
      `${this.basePath}/channels/${channelId}/messages/${messageId}/translate-and-post`,
      { target_lang: targetLang },
    )
    .then((r) => r.data.data);
```

### 6.5 useTalk.ts에 useTranslateAndPost 훅 추가

---

## 7. Phase 6: i18n + 테스트 + 배포

### 7.1 i18n 키 추가

**파일**: `apps/web/src/locales/{ko,en,vi}/talk.json`

| 키 | ko | en | vi |
|---|---|---|---|
| `simultaneousTranslation` | 동시번역 | Simultaneous Translation | Dịch đồng thời |
| `translateEnabled` | 동시번역 활성화 | Translation enabled | Đã bật dịch |
| `translateDisabled` | 동시번역 비활성화 | Translation disabled | Đã tắt dịch |
| `selectTargetLang` | 번역 대상 언어 | Target language | Ngôn ngữ đích |
| `translatingMessage` | 번역 중... | Translating... | Đang dịch... |
| `translateAndPost` | 번역하고 대화에 기록 | Translate & post to chat | Dịch và đăng vào chat |
| `translatedByUser` | {{sender}}의 메시지를 {{translator}}이(가) 번역 | {{translator}} translated {{sender}}'s message | {{translator}} đã dịch tin nhắn của {{sender}} |
| `translationPosted` | 번역이 대화에 기록되었습니다 | Translation posted to chat | Bản dịch đã được đăng vào chat |
| `translationFailed` | 번역에 실패했습니다 | Translation failed | Dịch thất bại |

### 7.2 테스트 시나리오

1. **동시번역 전송**
   - 토글 ON → 영어 선택 → 한국어 메시지 전송 → 원문+번역문 합성 메시지 확인
   - 토글 OFF → 일반 메시지 전송 확인 (기존 동작)
   - 번역 실패 시 원문만 전송 확인

2. **타인 메시지 번역 기록**
   - 타인 메시지 번역 → TRANSLATION 메시지가 대화창에 표시 확인
   - "소유자 - 번역자" 표기 확인
   - SSE로 다른 멤버에게 실시간 표시 확인

3. **KMS 연동**
   - 동시번역 전송 시 WorkItem 생성 확인
   - KMS 화면에서 Talk 대화 검색 확인

### 7.3 배포

```bash
# 1. feature 브랜치 생성
git checkout -b feature/talk-translation main

# 2. 구현 후 커밋
git add . && git commit -m "feat: Amoeba Talk 동시번역 + 번역기록 + KMS 연동"

# 3. PR → main 머지
# 4. 스테이징 배포
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh"
```

---

## 8. 파일 변경 목록

### 신규 파일
| 파일 | 설명 |
|------|------|
| `apps/web/src/domain/amoeba-talk/components/TranslationMessage.tsx` | TRANSLATION 타입 메시지 렌더링 컴포넌트 |

### 수정 파일 (백엔드)
| 파일 | 변경 내용 |
|------|----------|
| `apps/api/src/domain/amoeba-talk/dto/request/send-message.request.ts` | `translate_to` 필드 추가 |
| `apps/api/src/domain/amoeba-talk/service/message.service.ts` | 동시번역 로직 + KMS 이벤트 발행 |
| `apps/api/src/domain/amoeba-talk/service/message-translate.service.ts` | `translateAndPost()` 메서드 추가 |
| `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` | 새 엔드포인트 추가 |
| `apps/api/src/domain/amoeba-talk/service/talk-sse.service.ts` | 이벤트 타입 추가 (선택) |
| `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` | EventEmitter2 import 확인 |
| `apps/api/src/domain/kms/event/module-data.event.ts` | module 주석에 'talk' 추가 |

### 수정 파일 (프론트엔드)
| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/domain/amoeba-talk/components/TalkMessageInput.tsx` | 동시번역 토글 + 언어 선택 UI |
| `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx` | TRANSLATION 메시지 구분 렌더링 |
| `apps/web/src/domain/amoeba-talk/components/MessageTranslateButton.tsx` | translateAndPost 옵션 추가 |
| `apps/web/src/domain/amoeba-talk/store/talk.store.ts` | 동시번역 상태 추가 |
| `apps/web/src/domain/amoeba-talk/service/talk.service.ts` | 새 API 함수 추가 |
| `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts` | 새 mutation 훅 추가 |
| `apps/web/src/locales/ko/talk.json` | i18n 키 추가 |
| `apps/web/src/locales/en/talk.json` | i18n 키 추가 |
| `apps/web/src/locales/vi/talk.json` | i18n 키 추가 |

---

## 9. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| AI 번역 지연으로 전송 UX 저하 | 중 | 로딩 상태 표시, 번역 실패 시 원문만 전송 fallback |
| KMS 이벤트 과다 발행 | 하 | 동시번역/TRANSLATION 메시지에만 발행, 일반 TEXT 제외 |
| 합성 메시지 포맷 파싱 이슈 | 하 | 포맷 규약 문서화, 프론트엔드 파서 방어 코딩 |
| 기존 번역 기능과 중복 | 하 | 기존 인라인 번역은 유지 (빠른 확인용), translateAndPost는 기록용으로 분리 |
