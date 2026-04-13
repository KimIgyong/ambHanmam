# 요구사항 분석서: Amoeba Talk 멘션, 채널 리스트 개선, 읽음 확인

- **문서번호**: REQ-AmoebaTalk멘션및채널리스트개선-20260309
- **작성일**: 2026-03-09
- **요청 URL**: https://stg-ama.amoeba.site/amoeba-talk

---

## 1. 요구사항 개요

### 요구사항 1: 대화방 내 @멘션(태그) 기능
메시지 대화창에서 대화방 참여자를 `@아이디` 형태로 지정하여 대화하는 기능 구현 (Zalo 스타일 참조)

### 요구사항 2: PC 화면 DM/CHANNELS 리스트 접기/펼치기 + DM 표시 이슈
PC 화면에서 DM, CHANNELS 섹션을 접기/펼치기(collapse/expand) 할 수 있는 기능 구현 및 DM이 전부 표시되지 않는 이슈 확인

### 요구사항 3: 메시지 읽은 사람 보기
메시지의 ✓✓ (읽음 표시)를 클릭하면 해당 메시지를 읽은 사람 목록을 확인할 수 있는 기능

### 요구사항 4: 모바일 이미지 첨부 보기 시 닫기 버튼 없음
모바일 대화방에서 이미지 첨부파일을 탭해서 볼 때, 이미지를 닫을 수 있는 버튼이 없음 (이미지 뷰어/라이트박스 미구현)

### 요구사항 5: 대화방(DM, 채널) 나가기 기능 없음
DM 또는 그룹 채널에서 나가기(Leave) 기능이 웹/모바일 모두 없음. Owner가 다른 멤버를 제거하는 기능만 존재.

### 요구사항 6: 모바일 대화방에서 대화방 목록 돌아가기
모바일 앱에서 DM/채팅방 진입 후 대화방 목록으로 돌아가는 기능이 없거나 동작하지 않음 (코드상 구현되어 있으나 실동작 확인 필요)

---

## 2. AS-IS 현황 분석

### 2.1 메시지 입력 시스템 (현재)

| 항목 | 현재 상태 |
|------|----------|
| **입력 컴포넌트** | `TalkMessageInput.tsx` — textarea 기반, 자동 높이 조절 |
| **전송 방식** | Enter 전송, Shift+Enter 줄바꿈, IME 입력 처리 |
| **기능** | 텍스트, 파일첨부(5개/10MB), 동시번역, Reply |
| **@멘션** | ❌ 미구현 |
| **메시지 저장** | `msg_content` TEXT 컬럼에 plain text 저장 |
| **멘션 데이터** | ❌ 별도 테이블/컬럼 없음 |

**기존 MentionInput 컴포넌트 존재**:
- 경로: `apps/web/src/components/common/MentionInput.tsx`
- 기능: `@` 입력 시 멤버 드롭다운, 키보드 네비게이션, 선택 시 `@이름` 삽입
- 제한: `<input>` 단일 라인, Talk의 `<textarea>` 다중 라인과 호환 불가
- 데이터: `useMemberList()` 훅 사용 (전체 법인 멤버, Talk 채널 멤버 아님)
- **결론**: 참고용으로만 활용, Talk 전용으로 재구현 필요

### 2.2 채널 리스트 (현재)

| 항목 | 현재 상태 |
|------|----------|
| **컴포넌트** | `ChannelList.tsx` |
| **섹션 구분** | DM / Group Channels — 라벨만 표시, 접기 불가 |
| **DM 표시** | `channels.filter(ch.type === 'DIRECT')` |
| **채널 조회** | `getMyChannels()` — 멤버십 기반 전체 조회 (페이지네이션 없음) |
| **접기/펼치기** | ❌ 미구현 |
| **정렬** | 최신 메시지 시간 DESC |

### 2.3 DM 표시 이슈 분석

#### 2.3.1 DM 이름 표시 버그 (확인됨)

**현재 로직** (`ChannelList.tsx:getDmDisplayName`):
```typescript
const getDmDisplayName = (channel: TalkChannelResponse) => {
  if (!currentUserId || !channel.name.includes(',')) return channel.name;
  const names = channel.name.split(',').map((n) => n.trim());
  return names.find((n) => n !== channel.createdByName) || names[0] || channel.name;
};
```

**버그**: `createdByName` (채널 생성자)을 제외하는 로직이므로, **본인이 생성하지 않은 DM에서 본인 이름이 표시됨**.

| DM 채널명 | 생성자 | Gray.Kim 로그인 시 표시 | 기대값 |
|-----------|--------|------------------------|--------|
| `Gray.Kim, Hien` | Gray.Kim | `Hien` ✅ | Hien |
| `Truc Hoang, Gray.Kim` | Truc Hoang | `Gray.Kim` ❌ | Truc Hoang |

**원인**: `createdByName` 대신 **현재 로그인 사용자 이름**을 기준으로 필터링해야 함.

**수정 방안**: `useAuthStore`에서 현재 사용자 이름을 가져와 비교:
```typescript
const currentUserName = useAuthStore((s) => s.user?.name);
const getDmDisplayName = (channel: TalkChannelResponse) => {
  if (!currentUserName || !channel.name.includes(',')) return channel.name;
  const names = channel.name.split(',').map((n) => n.trim());
  return names.find((n) => n !== currentUserName) || names[0] || channel.name;
};
```

#### 2.3.2 DM 채널 누락 가능성 (스테이징 DB 조사 결과)

**스테이징 DB 현황**: 전체 10개 DM 채널
- 9개: `ent_id = 'acce6566-...'` (정상)
- 1개: `ent_id = NULL` (`Cong Hau, Khoa` — ADMIN 생성)

**`getMyChannels` 쿼리의 `entId` 필터**:
```typescript
channelRepo.find({ chnId: In(channelIds), ...(entId ? { entId } : {}), chnDeletedAt: IsNull() })
```
- 일반 사용자(entId 있음): `ent_id = NULL`인 DM은 조회 안 됨 → 해당 DM 멤버에게 안 보임
- ADMIN(entId 없음): 모든 채널 보임

**수정 필요**: DM(DIRECT) 채널은 `entId` 필터에서 제외하거나, DM 생성 시 entId를 항상 설정

### 2.4 메시지 표시 시스템 (현재)

| 항목 | 현재 상태 |
|------|----------|
| **컴포넌트** | `TalkMessageList.tsx` |
| **메시지 렌더링** | plain text, 줄바꿈만 `<br>` 변환 |
| **@멘션 하이라이트** | ❌ 없음 |
| **알림** | Push 알림은 채널 전체 멤버에게 발송 (멘션 대상 구분 없음) |

### 2.5 백엔드 메시지 엔티티 (현재)

```
amb_talk_messages
├── msg_id (UUID PK)
├── chn_id (채널 FK)
├── usr_id (송신자 FK)
├── msg_content (TEXT) ← plain text만
├── msg_type (TEXT/FILE/SYSTEM/TRANSLATION)
├── msg_parent_id (답장 FK)
├── msg_created_at / msg_updated_at / msg_deleted_at
```

**멘션 관련 테이블/컬럼**: 없음

### 2.6 모바일 이미지 첨부 표시 (현재)

**모바일 메시지 렌더링** (`apps/mobile/.../MessageList.tsx`):
- `MessageBubble` 컴포넌트가 `msg.content` 텍스트만 렌더링
- **`msg.attachments` 필드를 완전히 무시** — 이미지/파일 첨부가 있어도 표시하지 않음
- 이미지 뷰어/라이트박스 컴포넌트: **전체 프로젝트에 없음**

**웹 메시지 렌더링** (`apps/web/.../TalkMessageList.tsx`):
- 이미지: `<img>` 태그 + `<a target="_blank">` 링크 (새 탭에서 열기)
- 파일: 다운로드 링크 (파일명 + 크기 표시)
- **이미지 뷰어/라이트박스: 없음** — 이미지 클릭 시 새 탭에서 원본 열기만 가능

### 2.7 채널 나가기 기능 (현재)

**백엔드** (`channel.service.ts:removeMember`):
- `DELETE /talk/channels/:id/members/:userId` — 자기 자신의 userId를 보내면 나가기로 작동
- Owner는 나갈 수 없음 (`CANNOT_LEAVE_OWNED_CHANNEL` 에러)
- **백엔드 로직은 이미 구현됨**

**프론트엔드 (웹)** (`MemberPanel.tsx`):
- Owner만 다른 멤버 제거 가능 (`isOwner && member.role !== 'OWNER'`)
- **자기 자신이 나가기 UI: 없음**
- DM(DIRECT) 채널: 멤버 제거 버튼 없음 (초대 버튼도 없음)

**프론트엔드 (모바일)**:
- 채널 멤버 관리 UI 자체가 없음
- 채널 나가기 UI: 없음

### 2.8 메시지 읽음 시스템 (현재)

**읽음 상태 테이블** (`amb_talk_read_status`):
```
trs_id (UUID PK)
chn_id (채널 FK)
usr_id (사용자 FK)
trs_last_read_at (TIMESTAMP) ← 마지막 읽음 시각
trs_last_msg_id (UUID, nullable) ← 마지막 읽은 메시지 ID
UNIQUE(chn_id, usr_id) ← 채널당 사용자 1개 레코드
```

**현재 읽음 수 계산 로직** (`message.service.ts:buildReadCountMap`):
```typescript
// 채널의 모든 read_status 조회
const readStatuses = await readStatusRepo.find({ where: { chnId: channelId } });
// 각 메시지별로: 메시지 작성시간 이후에 읽음 표시한 사용자 수 (본인 제외)
const count = readStatuses.filter(
  (rs) => rs.usrId !== msg.usrId && rs.trsLastReadAt >= msg.msgCreatedAt
).length;
```

**프론트엔드 표시** (`TalkMessageList.tsx`):
- 내 메시지에만 표시
- `readCount > 0`: ✓✓ (indigo 색상) + 툴팁 "X명이 읽음"
- `readCount === 0`: ✓ (gray 색상) + 툴팁 "전송됨"
- **클릭 이벤트 없음** — 읽은 사람 목록 조회 불가

**현재 제약사항**:
1. **읽은 사람 목록 API 없음** — readCount(숫자)만 반환, 누가 읽었는지 모름
2. **채널 단위 읽음** — 메시지별 읽음이 아닌, 채널별 "마지막 읽은 시각" 기준으로 역산
3. **읽음 인원만 표시** — 미읽음 인원 정보 없음

---

## 3. TO-BE 요구사항

### 3.1 요구사항 1: @멘션 기능

#### 3.1.1 사용자 플로우

```
[메시지 입력창에서 '@' 입력]
    ↓
[채널 참여자 목록 드롭다운 표시]
    ├─ 키보드 입력으로 실시간 필터링
    ├─ ↑↓ 키로 탐색, Enter/클릭으로 선택
    └─ Esc로 닫기
    ↓
[선택된 멤버가 @이름 형태로 삽입]
    ├─ 입력창에서 멘션 텍스트 하이라이트 (색상 구분)
    └─ 여러 명 멘션 가능
    ↓
[메시지 전송]
    ├─ 멘션 사용자 ID 목록 서버 전달
    ├─ 메시지 content에 멘션 텍스트 포함 저장
    └─ 멘션된 사용자에게 특별 Push 알림
    ↓
[메시지 표시]
    ├─ @이름 부분 하이라이트 (파란색/볼드)
    └─ 클릭 시 해당 사용자 프로필 또는 DM 이동
```

#### 3.1.2 기능 상세

| 기능 | 설명 |
|------|------|
| **트리거** | `@` 문자 입력 시 (단어 시작 위치 또는 공백 뒤) |
| **대상 목록** | 현재 채널 참여자만 (DM은 상대방만, 그룹은 전체 멤버) |
| **필터링** | 이름(한/영/베) 실시간 검색, 대소문자 무시 |
| **특수 멘션** | `@all` 또는 `@everyone` — 채널 전체 멤버 멘션 |
| **표시 형태** | 입력: `@홍길동`, 저장: `<@userId>`, 렌더링: `@홍길동` (하이라이트) |
| **알림** | 멘션된 사용자에게 별도 Push 알림 (기존 채널 알림과 구분) |
| **멘션 수 제한** | 메시지당 최대 10명 (DoS 방지) |
| **삭제/수정** | 멘션 텍스트를 Backspace로 한 번에 삭제 (원자적 삭제) |

#### 3.1.3 데이터 모델 변경

**Option A: 메시지 content 내 마크업 (추천)**
```
저장: "안녕하세요 <@user-uuid-1234> 님, <@user-uuid-5678> 님도 확인 부탁드립니다"
전송 DTO에 mention_user_ids: ["user-uuid-1234", "user-uuid-5678"] 추가
```

- 장점: 별도 테이블 불필요, 기존 검색 호환, 간단
- 단점: content 파싱 필요

**Option B: 별도 mention 테이블**
```sql
CREATE TABLE amb_talk_message_mentions (
  mtn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msg_id UUID REFERENCES amb_talk_messages(msg_id),
  usr_id UUID REFERENCES amb_users(usr_id),
  mtn_created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- 장점: 정규화, 멘션 기반 조회 용이
- 단점: 추가 조인, 메시지 렌더링 시 추가 데이터 필요

**권장: Option A** — 심플하고 Talk 규모에서 충분. `mention_user_ids` 배열을 DTO에 추가하여 Push 알림 대상 분리.

#### 3.1.4 API 변경

**SendMessageRequest DTO 변경**:
```typescript
{
  content: string;            // "<@uuid> 님 확인 부탁"
  type?: string;
  parent_id?: string;
  translate_to?: string;
  mention_user_ids?: string[];  // NEW: 멘션 대상 사용자 ID 목록
}
```

**TalkMessageResponse 변경**:
```typescript
{
  ...existing,
  mentions?: { userId: string; userName: string }[];  // NEW
}
```

### 3.2 요구사항 3: 메시지 읽은 사람 보기

#### 3.2.1 사용자 플로우

```
[내가 보낸 메시지의 ✓✓ 클릭]
    ↓
[읽은 사람 팝오버/모달 표시]
    ├─ 읽은 사람 목록 (프로필 아바타 + 이름 + 읽은 시각)
    ├─ 안 읽은 사람 목록 (프로필 아바타 + 이름 + "미읽음")
    └─ 읽음/미읽음 탭 또는 섹션 구분
    ↓
[닫기: 외부 클릭 또는 X 버튼]
```

#### 3.2.2 기능 상세

| 기능 | 설명 |
|------|------|
| **트리거** | 내 메시지의 ✓✓ 읽음 표시 클릭 |
| **대상** | 내가 보낸 메시지만 (타인 메시지는 해당 없음) |
| **표시 UI** | 메시지 근처 팝오버 (또는 소형 모달) |
| **읽은 사람** | 이름 + 읽은 시각 (예: "Gray.Kim — 10:32 AM") |
| **안 읽은 사람** | 채널 멤버 중 아직 읽지 않은 사람 목록 |
| **정렬** | 읽은 사람: 읽은 시각 DESC, 안 읽은 사람: 이름순 |
| **DM 채널** | 1:1이므로 간략 표시 (읽음/안읽음만) |
| **실시간 갱신** | SSE `channel:read` 이벤트 수신 시 자동 반영 |

#### 3.2.3 API 신규

**`GET /talk/channels/:channelId/messages/:messageId/readers`**

Response:
```typescript
{
  success: true,
  data: {
    readers: [
      { userId: string, userName: string, readAt: string }
    ],
    nonReaders: [
      { userId: string, userName: string }
    ]
  }
}
```

**구현 로직**:
1. 메시지 조회 → `msgCreatedAt` 확인
2. 채널 멤버 전체 조회 (활성 멤버, 메시지 송신자 제외)
3. `amb_talk_read_status`에서 `trsLastReadAt >= msgCreatedAt`인 사용자 = 읽은 사람
4. 나머지 = 안 읽은 사람

#### 3.2.4 데이터 모델 변경

**DB 스키마 변경 불필요** — 기존 `amb_talk_read_status` 테이블의 `trs_last_read_at`으로 메시지별 읽음 여부 역산 가능 (현재 `buildReadCountMap`과 동일 로직)

#### 3.2.5 타입 추가

```typescript
// packages/types
interface TalkMessageReaderResponse {
  readers: { userId: string; userName: string; readAt: string }[];
  nonReaders: { userId: string; userName: string }[];
}
```

### 3.3 요구사항 2: DM/CHANNELS 접기/펼치기 + DM 이슈

#### 3.2.1 접기/펼치기 기능

| 기능 | 설명 |
|------|------|
| **대상 섹션** | "DIRECT MESSAGES", "CHANNELS" 각각 독립 |
| **UI** | 섹션 라벨 옆 토글 아이콘 (ChevronDown/ChevronRight) |
| **클릭 동작** | 라벨 또는 아이콘 클릭 시 해당 섹션 접기/펼치기 |
| **상태 저장** | localStorage에 저장 (새로고침 후에도 유지) |
| **기본값** | 둘 다 펼침(expanded) |
| **애니메이션** | 부드러운 높이 전환 (transition) |
| **미읽음 표시** | 접힌 상태에서도 섹션 내 총 미읽음 수 배지 표시 |

#### 3.2.2 DM 미표시 이슈 조사

**확인 필요 사항**:
1. 스테이징 DB에서 전체 DIRECT 채널 수 vs API 반환 채널 수 비교
2. `entId` 필터 조건이 DM에 영향을 주는지
3. DM 채널 `chnDeletedAt` 상태
4. DM 멤버십 `chmLeftAt` 상태
5. DM 채널명 표시 로직 (`getDmDisplayName`) 정확성

### 3.4 요구사항 4: 모바일 이미지 첨부 보기 + 닫기

#### 3.4.1 기능 상세

| 기능 | 설명 |
|------|------|
| **모바일 이미지 표시** | 메시지 버블 내 첨부 이미지 썸네일 표시 |
| **이미지 탭** | 탭 시 전체화면 라이트박스로 확대 |
| **닫기 버튼** | 라이트박스 우상단 X 버튼 (또는 하단 스와이프 닫기) |
| **핀치 줌** | 두 손가락으로 확대/축소 |
| **파일 첨부 표시** | 이미지가 아닌 파일은 파일명 + 크기 + 다운로드 아이콘 |
| **웹 개선** | 웹에서도 이미지 클릭 시 라이트박스 표시 (현재: 새 탭 열기) |

#### 3.4.2 라이트박스 UI

```
┌─────────────────────────┐
│                     [X] │  ← 닫기 버튼
│                         │
│      ┌───────────┐      │
│      │           │      │
│      │   이미지   │      │  ← 핀치 줌 가능
│      │           │      │
│      └───────────┘      │
│                         │
│  파일명.jpg  1.2MB      │  ← 하단 정보
└─────────────────────────┘
```

#### 3.4.3 구현 범위

| 대상 | 변경 내용 |
|------|----------|
| **모바일 MessageList** | `msg.attachments` 렌더링 추가 (이미지 썸네일 + 파일 링크) |
| **모바일 ImageLightbox** | 신규 — 전체화면 이미지 뷰어 (닫기 버튼 + 핀치 줌) |
| **웹 TalkMessageList** | 이미지 클릭 시 라이트박스 (기존 새 탭 → 라이트박스) |
| **웹 ImageLightbox** | 신규 — 오버레이 이미지 뷰어 |

### 3.5 요구사항 5: 채널 나가기 기능

#### 3.5.1 사용자 플로우

```
[웹] 멤버 패널 하단 "채널 나가기" 버튼 클릭
[모바일] 채널 헤더 ⋯ 메뉴 → "나가기" 선택
    ↓
[확인 다이얼로그] "정말 이 채널을 나가시겠습니까?"
    ↓
[확인] → DELETE /talk/channels/:id/members/:myUserId (기존 API 활용)
    ↓
[채널 목록으로 돌아감, 해당 채널 제거됨]
```

#### 3.5.2 기능 상세

| 기능 | 설명 |
|------|------|
| **대상** | 그룹 채널 (PUBLIC/PRIVATE) — OWNER 제외 |
| **DM 채널** | DM은 나가기 대신 대화 숨기기/삭제 (선택사항) |
| **Owner** | 나가기 불가 — "채널을 삭제하거나 소유권을 이전하세요" 안내 |
| **백엔드** | 기존 `removeMember` API 활용 (`targetUserId = 본인`) |
| **프론트 (웹)** | MemberPanel 하단에 "채널 나가기" 버튼 추가 |
| **프론트 (모바일)** | ChannelHeader에 옵션 메뉴 추가 → 나가기 항목 |
| **SSE 이벤트** | `member:leave` 이벤트 → 다른 멤버에게 알림 |

#### 3.5.3 플랫폼별 UI

**웹 — MemberPanel 하단**:
```
┌───────────────────────┐
│ Members (5)       [+] │
├───────────────────────┤
│ 👑 Gray.Kim    Owner  │
│ 🛡 Hien        Admin  │
│ 👤 Truc Hoang  Member │
│ ...                   │
├───────────────────────┤
│  [🚪 Leave Channel]   │  ← 빨간 텍스트, Owner에게는 비표시
└───────────────────────┘
```

**모바일 — 채널 헤더 옵션 메뉴**:
```
┌─────────────────────┐
│ ← Channel Name  [⋯] │  ← 옵션 메뉴 버튼
└─────────────────────┘
     ┌──────────────┐
     │ 멤버 보기     │
     │ 채널 나가기   │  ← 빨간 텍스트
     └──────────────┘
```

---

## 4. 갭 분석

### 4.1 @멘션 기능 갭

| 영역 | 현재 | 필요 | 갭 |
|------|------|------|-----|
| 입력 UI | textarea (plain) | @트리거 + 드롭다운 | 🔴 신규 |
| 멘션 파싱 | 없음 | `<@userId>` 파싱 | 🔴 신규 |
| 메시지 렌더링 | plain text | 멘션 하이라이트 | 🔴 신규 |
| Push 알림 | 채널 전체 | 멘션 대상 우선 | 🟡 수정 |
| 메시지 DTO | content만 | mention_user_ids 추가 | 🟡 수정 |
| 채널 멤버 조회 | channelDetail API | 입력 시 멤버 참조 필요 | 🟢 기존 활용 |
| DB 스키마 | 변경 없음 | content 내 마크업 방식 | 🟢 변경 없음 |

### 4.2 메시지 읽은 사람 보기 갭

| 영역 | 현재 | 필요 | 갭 |
|------|------|------|-----|
| 읽음 수 표시 | ✓✓ + 숫자 (readCount) | 유지 | 🟢 기존 |
| 읽은 사람 목록 API | 없음 | `GET .../readers` | 🔴 신규 |
| 읽은 사람 팝오버 UI | 없음 | 클릭 시 팝오버 | 🔴 신규 |
| 안 읽은 사람 표시 | 없음 | 채널 멤버 - 읽은 사람 | 🔴 신규 |
| DB 스키마 | 변경 없음 | 기존 read_status 활용 | 🟢 변경 없음 |

### 4.3 채널 리스트 개선 갭

| 영역 | 현재 | 필요 | 갭 |
|------|------|------|-----|
| 섹션 접기 | 없음 | 독립 토글 | 🔴 신규 |
| 상태 유지 | 없음 | localStorage | 🟡 추가 |
| 접힌 상태 미읽음 | 없음 | 섹션별 합산 배지 | 🟡 추가 |
| DM 전체 표시 | 확인 필요 | 전체 DM 표시 보장 | 🔴 조사 필요 |

### 4.4 모바일 이미지 첨부 보기 갭

| 영역 | 현재 | 필요 | 갭 |
|------|------|------|-----|
| 모바일 이미지 표시 | 미표시 (attachments 무시) | 썸네일 렌더링 | 🔴 신규 |
| 모바일 이미지 뷰어 | 없음 | 라이트박스 + 닫기 버튼 | 🔴 신규 |
| 모바일 파일 표시 | 미표시 | 파일명 + 다운로드 링크 | 🔴 신규 |
| 웹 이미지 뷰어 | 새 탭 열기 | 라이트박스 (선택사항) | 🟡 개선 |

### 4.5 채널 나가기 갭

| 영역 | 현재 | 필요 | 갭 |
|------|------|------|-----|
| 백엔드 API | removeMember로 지원 | 그대로 활용 | 🟢 기존 |
| 웹 나가기 UI | 없음 | MemberPanel 하단 버튼 | 🔴 신규 |
| 모바일 나가기 UI | 없음 | 옵션 메뉴 항목 | 🔴 신규 |
| Owner 제한 | 백엔드에서 차단 | 프론트에서도 버튼 숨김 | 🟡 추가 |
| DM 나가기 | 미정의 | 대화 숨기기 또는 나가기 | 🟡 정책 결정 필요 |

### 4.6 모바일 대화방 목록 돌아가기 갭

| 영역 | 현재 | 필요 | 갭 |
|------|------|------|-----|
| 뒤로가기 버튼 | ✅ `ArrowLeft` 있음 (`ChatView.tsx:131`) | — | 🟢 구현됨 |
| 목록 전환 | ✅ `onBack → setSelectedChannelId(null)` | — | 🟢 구현됨 |
| **실제 동작** | 스테이징 테스트 필요 | 정상 작동 확인 | 🟡 테스트 |

**참고**: 코드상 구현됨. 실제 모바일에서 안 되면 UI 렌더링 이슈 (버튼 가림, 클릭 영역 등) 가능성

---

## 5. 기술 제약사항

### 5.1 @멘션 입력 구현 방식

**선택지**:

| 방식 | 장점 | 단점 |
|------|------|------|
| **A) contentEditable div** | 멘션 인라인 하이라이트, 원자적 삭제 | 복잡한 커서 관리, IME 이슈 |
| **B) textarea + 오버레이** | 기존 textarea 유지, 안정적 | 하이라이트 동기화 어려움 |
| **C) textarea + 드롭다운만** | 가장 간단, 기존 코드 최소 변경 | 입력 중 하이라이트 없음 |

**권장: C) textarea + 드롭다운** — 구현 복잡도 대비 UX 충분. Zalo, Slack 모바일도 이 방식 사용. 렌더링 시에만 하이라이트 처리.

### 5.2 멘션 텍스트 저장/파싱 규칙

```
저장 형식: <@user-uuid>
표시 변환: <@user-uuid> → @홍길동 (파란색 하이라이트)
정규식: /<@([0-9a-f-]{36})>/g
```

- 사용자 이름은 표시 시 실시간 조회 (이름 변경 반영)
- 번역 시 멘션 마크업 보존 (AI 프롬프트에 이미 "@user" 보존 규칙 있음)

### 5.3 성능 고려사항

- 채널 멤버 목록: 이미 `channelDetail` API에서 조회 — 캐시 활용
- 멘션 드롭다운: 프론트엔드 필터링 (서버 호출 불필요)
- 메시지 렌더링: 멘션 파싱은 O(n) 문자열 처리, 성능 영향 미미
- DM 리스트: 현재 페이지네이션 없이 전체 조회 — 채널 수가 극히 많지 않은 한 문제 없음

---

## 6. 사용자 플로우 다이어그램

### 6.1 @멘션 플로우

```
사용자 ──→ 메시지 입력창 "@" 타이핑
         ↓
    [채널 멤버 드롭다운 표시]
    │  - 현재 채널 멤버 목록
    │  - 프로필 아바타 + 이름 + 부서
    │  - "@all" 옵션 (그룹채널만)
         ↓
    사용자 ──→ 문자 추가 입력으로 필터
    사용자 ──→ ↑↓ 탐색 후 Enter 선택
         ↓
    [@홍길동 ] 입력창에 삽입 (공백 자동 추가)
         ↓
    사용자 ──→ 메시지 작성 계속 + 추가 멘션 가능
         ↓
    사용자 ──→ Enter 전송
         ↓
    [프론트엔드]
    │  - content: "확인 부탁 <@uuid1> <@uuid2>"
    │  - mention_user_ids: ["uuid1", "uuid2"]
         ↓
    [백엔드]
    │  - 메시지 저장
    │  - SSE emit (message:new)
    │  - Push 알림 (멘션 대상 우선 표시: "OOO님이 회원님을 멘션했습니다")
         ↓
    [수신자 화면]
    │  - @홍길동 파란색 하이라이트 표시
    │  - 알림 뱃지/토스트
```

### 6.2 접기/펼치기 플로우

```
사용자 ──→ "DIRECT MESSAGES" 라벨 클릭
         ↓
    [DM 리스트 접힘]
    │  - ChevronRight 아이콘으로 변경
    │  - 접힌 상태에서 미읽음 합산 배지 표시
    │  - localStorage에 상태 저장
         ↓
    사용자 ──→ 다시 클릭
         ↓
    [DM 리스트 펼침]
    │  - ChevronDown 아이콘으로 변경
    │  - 개별 채널 미읽음 배지 표시
```

---

## 7. 영향 범위 분석

### 7.1 변경 대상 파일

**요구사항 1: @멘션**

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/.../TalkMessageInput.tsx` | @트리거 감지, 멘션 드롭다운, 멤버 선택 삽입 |
| `apps/web/.../TalkMessageList.tsx` | 멘션 파싱 및 하이라이트 렌더링 |
| `apps/web/.../service/talk.service.ts` | sendMessage에 mention_user_ids 추가 |
| `apps/web/.../hooks/useTalk.ts` | sendMessage 뮤테이션 수정 |
| `apps/api/.../dto/request/send-message.request.ts` | mention_user_ids 필드 추가 |
| `apps/api/.../service/message.service.ts` | 멘션 알림 로직 추가 |
| `apps/api/.../mapper/message.mapper.ts` | mentions 필드 매핑 |
| `packages/types/src/domain.types.ts` | TalkMessageResponse에 mentions 추가 |
| `apps/web/src/locales/*/talk.json` | 멘션 관련 번역 키 추가 |

**요구사항 2: 접기/펼치기 + DM 이슈**

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/.../ChannelList.tsx` | 섹션 토글 UI, 접힌 상태 미읽음 배지 |
| `apps/web/.../store/talk.store.ts` | 섹션 펼침 상태 (또는 localStorage 직접) |
| `apps/api/.../service/channel.service.ts` | DM 필터 이슈 수정 (조사 후) |

**요구사항 3: 읽은 사람 보기**

| 파일 | 변경 내용 |
|------|----------|
| `apps/api/.../controller/message.controller.ts` | `GET .../:messageId/readers` 엔드포인트 추가 |
| `apps/api/.../service/message.service.ts` | `getMessageReaders()` 메서드 추가 |
| `apps/web/.../components/TalkMessageList.tsx` | ✓✓ 클릭 이벤트 + 팝오버 트리거 |
| `apps/web/.../components/MessageReadersPopover.tsx` | 신규 — 읽은/안읽은 사람 목록 팝오버 |
| `apps/web/.../service/talk.service.ts` | `getMessageReaders()` API 클라이언트 추가 |
| `apps/web/.../hooks/useTalk.ts` | `useMessageReaders()` 쿼리 훅 추가 |
| `packages/types/src/domain.types.ts` | `TalkMessageReaderResponse` 타입 추가 |
| `apps/web/src/locales/*/talk.json` | 읽음 확인 관련 번역 키 추가 |

**요구사항 4: 모바일 이미지 첨부 보기**

| 파일 | 변경 내용 |
|------|----------|
| `apps/mobile/.../MessageList.tsx` | attachments 렌더링 (이미지 썸네일 + 파일 링크) |
| `apps/mobile/.../components/ImageLightbox.tsx` | 신규 — 전체화면 이미지 뷰어 + 닫기 버튼 |
| `apps/web/.../TalkMessageList.tsx` | 이미지 클릭 → 라이트박스 (선택적 개선) |
| `apps/web/.../components/ImageLightbox.tsx` | 신규 — 오버레이 이미지 뷰어 (선택적) |

**요구사항 5: 채널 나가기**

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/.../MemberPanel.tsx` | 하단 "채널 나가기" 버튼 추가 |
| `apps/web/.../hooks/useTalk.ts` | `useLeaveChannel()` 훅 추가 (기존 removeMember 활용) |
| `apps/mobile/.../ChannelHeader.tsx` | 옵션 메뉴(⋯) + 나가기 항목 |
| `apps/web/src/locales/*/talk.json` | 나가기 관련 번역 키 추가 |

**요구사항 6: 모바일 대화방 목록 돌아가기**

| 파일 | 변경 내용 |
|------|----------|
| `apps/mobile/.../ChatTab.tsx` | 대화방↔목록 전환 로직 확인/수정 |
| `apps/mobile/.../components/ChannelHeader.tsx` | ← 뒤로가기 버튼 확인/추가 |

### 7.2 사이드 임팩트

| 영역 | 임팩트 | 위험도 |
|------|--------|--------|
| 기존 메시지 표시 | `<@uuid>` 마크업이 없는 기존 메시지는 영향 없음 | 🟢 낮음 |
| 메시지 검색 | `<@uuid>` 마크업이 검색 결과에 노출될 수 있음 → 파싱 적용 필요 | 🟡 중간 |
| 번역 기능 | AI 프롬프트에 이미 "@user 보존" 규칙 존재 → `<@uuid>` 보존 확인 필요 | 🟡 중간 |
| 모바일 앱 | 멘션 렌더링 공유 컴포넌트 필요 (향후) | 🟢 낮음 |
| Push 알림 | 멘션 전용 알림 메시지 분기 필요 | 🟡 중간 |
| 읽은 사람 조회 성능 | 채널 멤버 수 많을 시 쿼리 부하 | 🟢 낮음 (현재 규모) |

---

## 8. 우선순위 및 구현 순서 권장

| 순서 | 작업 | 난이도 | 예상 규모 | 플랫폼 |
|------|------|--------|----------|--------|
| 1 | DM 이름 표시 버그 수정 + DM 누락 수정 | 🟢 | 소 | 웹+API |
| 2 | 모바일 대화방 목록 돌아가기 확인/수정 | 🟢 | 소 | 모바일 |
| 3 | DM/CHANNELS 접기/펼치기 | 🟢 | 소 | 웹 |
| 4 | 채널 나가기 UI | 🟢 | 소 | 웹+모바일 |
| 5 | 모바일 이미지/파일 첨부 표시 + 라이트박스 | 🟡 | 중 | 모바일 |
| 6 | 메시지 읽은 사람 보기 (API + UI) | 🟡 | 중 | API+웹 |
| 7 | @멘션 입력 드롭다운 + 백엔드 DTO | 🟡 | 중 | 웹+API |
| 8 | 멘션 하이라이트 렌더링 | 🟡 | 중 | 웹+모바일 |
| 9 | 멘션 Push 알림 분기 | 🟢 | 소 | API |

---

## 9. 참고: Zalo 멘션 UX 분석

Zalo의 @멘션 구현 특징:
- **트리거**: `@` 입력 시 즉시 멤버 목록 표시
- **위치**: 입력창 바로 위에 드롭다운 (bottom-to-top)
- **정보**: 프로필 사진 + 이름
- **선택 후**: `@이름 ` (파란색 텍스트 + 자동 공백)
- **렌더링**: 메시지 내 @이름 파란색 하이라이트
- **알림**: 별도 멘션 알림 ("OOO님이 회원님을 태그했습니다")
- **@all**: 그룹 채팅에서 전체 멤버 알림

---

## 10. 결론

6가지 요구사항 모두 현재 Amoeba Talk 아키텍처 위에 자연스럽게 확장 가능합니다.

- **@멘션**: 기존 textarea에 드롭다운 추가 + content 내 `<@uuid>` 마크업 + 렌더링 시 파싱으로 구현. DB 스키마 변경 불필요 (Option A).
- **접기/펼치기**: `ChannelList.tsx`에 토글 상태 추가 + localStorage 저장.
- **DM 이슈**: `getDmDisplayName`이 `createdByName` 기준으로 제외 → 현재 사용자 이름 기준으로 변경. `ent_id=NULL` DM 누락도 수정 필요.
- **읽은 사람 보기**: 기존 `amb_talk_read_status` 테이블 활용하여 DB 변경 없이 구현 가능. 신규 API 1개 + 프론트 팝오버 컴포넌트 추가.
- **모바일 이미지 뷰어**: 모바일 `MessageList`에서 `attachments` 렌더링 추가 + `ImageLightbox` 컴포넌트 신규 작성 (닫기 버튼 포함).
- **채널 나가기**: 백엔드 API 이미 지원 (`removeMember`에 본인 userId). 웹 MemberPanel + 모바일 옵션 메뉴에 UI 추가.
- **모바일 대화방 목록 돌아가기**: ChatTab의 채팅뷰 → 채널목록 전환 로직 확인/수정 + 헤더 뒤로가기 버튼 확인.
