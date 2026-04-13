# PLAN-TalkMentionAll-작업계획-20260406
# AmoebaTalk @all 멘션 알림 기능 — 작업 계획서

## 1. 시스템 개발 현황 분석

### 1.1 멘션 처리 파이프라인

```
TalkMessageInput.tsx → @감지/드롭다운 → 선택 → mentionMapRef
  → 전송 시 @name→<@UUID> 변환 + mention_user_ids[]
  → API: sendMessage(dto) → DB 저장(msgContent) + 알림 발송
  → 조회 시 buildMentionMap() → <@UUID>→{userId,userName} 파싱
```

### 1.2 변경 대상 파일

| 파일 | 역할 | 변경 유형 |
|------|------|-----------|
| `apps/web/src/domain/amoeba-talk/components/TalkMessageInput.tsx` | 멘션 드롭다운 + 변환 | **수정** |
| `apps/api/src/domain/amoeba-talk/service/message.service.ts` | 멘션 파싱 + 알림 발송 | **수정** |
| `apps/web/src/locales/ko/chat.json` | 한국어 번역 | **수정** |
| `apps/web/src/locales/en/chat.json` | 영어 번역 | **수정** |
| `apps/web/src/locales/vi/chat.json` | 베트남어 번역 | **수정** |

## 2. 단계별 구현 계획

### Phase 1: 프론트엔드 — 멘션 드롭다운에 @all 추가

**목표**: `@` 입력 시 드롭다운 최상단에 `@all` 항목 표시, 선택 시 `<@all>` 변환

**변경 내용** (`TalkMessageInput.tsx`):

1. **드롭다운 후보에 @all 추가**
   - 채널 타입이 DIRECT가 아닌 경우에만 @all 표시
   - `mentionCandidates` 배열 앞에 `{userId: 'all', userName: 'all'}` 가상 항목 삽입
   - 드롭다운에서 @all 항목은 아이콘/스타일 구분 (Users 아이콘, 설명 텍스트)

2. **@all 선택 시 처리**
   - `selectMention()` 에서 userId가 `'all'`인 경우 특수 처리
   - `mentionMapRef`에 `{all → 'ALL_MEMBERS'}` 저장
   - 입력창에 `@all ` 삽입

3. **전송 시 @all 변환**
   - `handleSend()` 에서 `@all` → `<@all>` 변환
   - `mention_user_ids`에 채널 전체 멤버 ID 삽입 (발신자 제외)

**사이드 임팩트**: 없음 — 기존 개인 멘션 로직 유지, @all은 추가 분기

### Phase 2: 백엔드 — `<@all>` 파싱 + 전체 알림 발송

**목표**: `<@all>` 포함 메시지 수신 시 채널 전체 멤버에게 TALK_MENTION 알림

**변경 내용** (`message.service.ts`):

1. **`sendMessagePush()` 수정**
   - `msgContent`에 `<@all>` 포함 여부 체크
   - `<@all>` 포함 시 → 전체 활성 멤버를 `mentionSet`에 추가
   - 기존 `mention_user_ids` 와 합산 (중복 제거)

2. **`buildMentionMap()` 수정**
   - 기존 UUID regex 외에 `<@all>` 패턴 별도 처리
   - `<@all>` → `{userId: 'all', userName: 'all'}` 매핑 추가

3. **`resolveMentionsToText()` 수정**
   - `<@all>` → `@all` 텍스트 변환 (알림 미리보기용)

**사이드 임팩트**:
- 뮤트 사용자도 @all 시 알림 수신 (기존 멘션 정책과 동일)
- 대규모 채널의 경우 알림 대상 증가 → 기존 `sendPushToMany` 배치로 처리

### Phase 3: 메시지 표시 — @all 하이라이트

**목표**: 메시지 본문에서 `<@all>`을 파란색 하이라이트로 표시

**변경 내용**: 프론트엔드 메시지 렌더링 컴포넌트에서 `<@all>` → `@all` 하이라이트 처리
- 기존 `<@UUID>` → `@이름` 렌더링 로직과 동일한 패턴

### Phase 4: i18n

**변경 내용**: chat 번역 파일에 @all 관련 키 추가

| 키 | ko | en | vi |
|----|----|----|-----|
| `mention.all` | `모든 멤버` | `All Members` | `Tất cả thành viên` |
| `mention.all_desc` | `채널 전체에게 알림` | `Notify everyone in channel` | `Thông báo cho mọi người` |
| `mention.all_notification` | `{{name}}님이 전체 멘션` | `{{name}} mentioned everyone` | `{{name}} đã nhắc đến mọi người` |

## 3. 사이드 임팩트 분석

| 영향 항목 | 위험도 | 설명 |
|-----------|--------|------|
| 기존 개인 멘션 | 없음 | @all은 별도 분기, 기존 UUID 기반 멘션 유지 |
| DB 스키마 | 없음 | `<@all>`은 텍스트 필드에 저장, 별도 컬럼 불필요 |
| 메시지 조회 성능 | 낮음 | `buildMentionMap` regex에 all 패턴만 추가 |
| 알림 부하 | 중간 | 100명+ 채널의 @all → SSE/Push 다수 발송, 기존 배치 로직으로 처리 |
| DIRECT 채널 | 없음 | DIRECT 타입에서는 @all 드롭다운 미표시 |
| 하위 호환 | 없음 | 기존 메시지에 `<@all>` 패턴 없음 |

## 4. DB 마이그레이션

**불필요** — DB 스키마 변경 없음. `<@all>`은 기존 `msg_content` TEXT 컬럼에 저장.

## 5. 검증 항목

| 시나리오 | 기대 결과 |
|----------|-----------|
| PUBLIC 채널에서 @ 입력 | 드롭다운 최상단에 @all 표시 |
| DIRECT 채널에서 @ 입력 | @all 미표시 (개인 멤버만) |
| @all 선택 후 전송 | 메시지에 `<@all>` 저장 |
| @all 메시지 수신 | 채널 전체 멤버에게 TALK_MENTION 알림 |
| 뮤트한 멤버의 @all 수신 | 알림 수신됨 (뮤트 무시) |
| @all + @개인 혼합 | 전체 멤버 + 개인 중복 제거 후 알림 |
| @all 메시지 표시 | @all 파란색 하이라이트 |
| 100명 채널 @all | 정상 발송 (배치 처리) |
