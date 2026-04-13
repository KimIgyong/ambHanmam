# REQ-TalkMentionAll-20260406
# AmoebaTalk 채널 @all 멘션 알림 기능

## 1. 요구사항 요약

| 항목 | 내용 |
|------|------|
| **요청일** | 2026-04-06 |
| **모듈** | AmoebaTalk — CHANNELS 채널 대화방 |
| **요약** | 채널 대화방에서 `@all` 입력 시 해당 채널의 전체 참여자에게 알림을 발송하는 기능 추가 |
| **참조** | Zalo 그룹챗 @All 기능 |

## 2. AS-IS 현황 분석

### 2.1 현재 멘션 시스템 흐름

```
[프론트엔드]
1. 사용자 @ 입력 → TalkMessageInput에서 @뒤 텍스트 감지
2. 채널 멤버 중 이름 필터 → 드롭다운 표시 (최대 8명)
3. 멘션 선택 → mentionMapRef에 {userName → userId} 저장
4. 전송 시 @userName → <@UUID> 변환 + mention_user_ids[] 배열 구성

[백엔드]
5. msgContent에 <@UUID> 형식 저장 (amb_talk_messages.msg_content)
6. mention_user_ids[] 기반으로 알림 발송
7. 멘션된 사용자 → TALK_MENTION 타입 SSE + Web Push
8. 멘션되지 않은 멤버 → TALK_MESSAGE 타입 (뮤트 시 미발송)
9. 멘션된 사용자는 뮤트 상태여도 알림 수신 (뮤트 우선권 상실)
```

### 2.2 관련 파일

| 파일 | 역할 |
|------|------|
| `apps/web/src/domain/amoeba-talk/components/TalkMessageInput.tsx` | 채팅 입력 + 멘션 드롭다운 |
| `apps/api/src/domain/amoeba-talk/service/message.service.ts` | 메시지 전송 + 멘션 파싱 + 알림 발송 |
| `apps/api/src/domain/amoeba-talk/dto/request/send-message.request.ts` | 전송 DTO (`mention_user_ids`) |
| `apps/api/src/domain/amoeba-talk/entity/talk-message.entity.ts` | 메시지 엔티티 |
| `apps/api/src/domain/amoeba-talk/entity/talk-channel-member.entity.ts` | 채널 멤버 엔티티 |
| `apps/api/src/domain/notification/service/notification-sse.service.ts` | SSE 알림 |
| `apps/api/src/domain/notification/service/push.service.ts` | Web Push 알림 |
| `packages/types/src/domain.types.ts` | `TalkMessageResponse` 타입 (mentions 필드) |

### 2.3 현재 제약

| 항목 | 현재 상태 |
|------|-----------|
| 멘션 대상 | 개인별만 가능 (`@사용자이름`) |
| 전체 멘션 | ❌ 미지원 |
| 멘션 드롭다운 | 채널 멤버 중 이름 필터 (본인 제외, 최대 8명) |
| 멘션 저장 형식 | `<@UUID>` (UUID 기반) |
| 알림 발송 | `mention_user_ids[]` 배열 기반, 멤버별 개별 발송 |

## 3. TO-BE 요구사항

### 3.1 @all 멘션 기능

| 항목 | 명세 |
|------|------|
| **트리거** | 채팅 입력창에서 `@` 입력 시 드롭다운 최상단에 `@all` 항목 표시 |
| **표시 텍스트** | `@all` (다국어: 모든 멤버 / All Members / Tất cả thành viên) |
| **저장 형식** | `<@all>` (기존 `<@UUID>`와 구분되는 예약어) |
| **알림 범위** | 채널 활성 멤버 전원 (발신자 제외) |
| **알림 타입** | `TALK_MENTION` (기존 개인 멘션과 동일 — 뮤트 무시) |
| **알림 메시지** | `"{발신자}가 전체 멘션: {메시지 미리보기}"` |
| **표시** | 메시지 본문에서 `@all` 강조 표시 (기존 @이름과 동일 스타일) |

### 3.2 권한/제한 정책

| 조건 | 허용 |
|------|------|
| PUBLIC 채널 | ✅ 모든 멤버 @all 가능 |
| PRIVATE 채널 | ✅ 모든 멤버 @all 가능 |
| DIRECT (1:1) | ❌ @all 불필요 (2명뿐이므로) |
| 대규모 채널 (50명+) | ✅ 허용 (Zalo 동일) |

### 3.3 혼합 멘션 지원

- 하나의 메시지에 `@all` + `@개인` 동시 사용 가능
- `@all` 포함 시 모든 멤버가 `mention_user_ids`에 포함되므로, 개인 멘션은 중복 제거

## 4. 갭 분석

| 구분 | AS-IS | TO-BE | 변경 |
|------|-------|-------|------|
| FE 드롭다운 후보 | 개인 멤버만 | `@all` 항목 + 개인 멤버 | 수정 |
| FE 멘션 선택 | `@userName` → `{name→userId}` | `@all` → 특수 처리 | 수정 |
| FE 전송 변환 | `@name` → `<@UUID>` | `@all` → `<@all>` + 전체 멤버 ID | 수정 |
| BE 메시지 저장 | `<@UUID>` 패턴만 | `<@all>` 패턴 추가 | 수정 |
| BE 멘션 파싱 | UUID regex만 | `<@all>` 파싱 추가 | 수정 |
| BE 알림 발송 | `mention_user_ids[]` 기반 | `<@all>` 감지 시 전체 멤버 발송 | 수정 |
| BE 알림 텍스트 변환 | `<@UUID>` → `@이름` | `<@all>` → `@all` | 수정 |
| 메시지 표시 | `<@UUID>` → 하이라이트 | `<@all>` → 하이라이트 | 수정 |

## 5. 사용자 플로우

```
1. 사용자가 채널 대화방에서 @ 입력
2. 드롭다운 최상단에 "@all — 모든 멤버에게 알림" 표시
3. @all 선택 (또는 "all" 타이핑 후 선택)
4. 입력창에 "@all " 삽입
5. 메시지 작성 후 전송
6. FE: content에서 @all → <@all> 변환 + mention_user_ids에 전체 멤버 ID
7. BE: 메시지 저장 (msgContent에 <@all> 포함)
8. BE: 채널 전체 활성 멤버에게 TALK_MENTION 알림 (뮤트 무시)
9. 수신자: 알림 수신 "OOO가 전체 멘션: 메시지 내용..."
10. 메시지 표시: @all 부분 파란색 하이라이트
```

## 6. 기술 제약사항

| 항목 | 제약 |
|------|------|
| **`<@all>` 예약어** | UUID 형식과 충돌 없음 (`all`은 UUID 패턴 불일치) |
| **대규모 채널 알림** | 100명+ 채널에서 @all 시 SSE/Push 부하 → 기존 `sendPushToMany`가 배치 처리하므로 문제 없음 |
| **DB 스키마** | 변경 없음 — `<@all>`은 msgContent text 필드에 저장 |
| **기존 메시지 호환** | 기존 메시지에 `<@all>` 없으므로 하위 호환 문제 없음 |
| **멘션 파싱 regex** | 기존 `/<@([0-9a-f-]{36})>/g` 와 별도로 `<@all>` 처리 필요 |
