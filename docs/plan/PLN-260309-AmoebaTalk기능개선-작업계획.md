# 작업 계획서: Amoeba Talk 기능 개선

- **문서번호**: PLAN-AmoebaTalk기능개선-작업계획-20260309
- **작성일**: 2026-03-09
- **요구사항 분석서**: `docs/analysis/REQ-AmoebaTalk멘션및채널리스트개선-20260309.md`

---

## 구현 Phase 개요

| Phase | 작업 | 난이도 | 플랫폼 |
|-------|------|--------|--------|
| **Phase 1** | 버그 수정 및 소규모 개선 | 🟢 | 웹+API+모바일 |
| **Phase 2** | 채널 관리 기능 | 🟢 | 웹+모바일 |
| **Phase 3** | 읽음 확인 + 이미지 뷰어 | 🟡 | API+웹+모바일 |
| **Phase 4** | @멘션 시스템 | 🟡 | 웹+API+모바일 |

---

## Phase 1: 버그 수정 및 소규모 개선

### Task 1-1: DM 이름 표시 버그 수정

**파일**: `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx`

**변경 내용**:
- `getDmDisplayName`에서 `channel.createdByName` 대신 현재 로그인 사용자 이름으로 필터링
- `useAuthStore`에서 `user.name` 가져오기

**코드 변경**:
```typescript
// AS-IS
const getDmDisplayName = (channel: TalkChannelResponse) => {
  if (!currentUserId || !channel.name.includes(',')) return channel.name;
  const names = channel.name.split(',').map((n) => n.trim());
  return names.find((n) => n !== channel.createdByName) || names[0] || channel.name;
};

// TO-BE
const currentUserName = useAuthStore((s) => s.user?.name);
const getDmDisplayName = (channel: TalkChannelResponse) => {
  if (!currentUserName || !channel.name.includes(',')) return channel.name;
  const names = channel.name.split(',').map((n) => n.trim());
  return names.find((n) => n !== currentUserName) || names[0] || channel.name;
};
```

### Task 1-2: DM 채널 누락 수정 (entId 필터)

**파일**: `apps/api/src/domain/amoeba-talk/service/channel.service.ts`

**변경 내용**:
- `getMyChannels`에서 entId 필터 적용 시 DIRECT 채널은 제외
- 쿼리를 2단계로 분리: (1) entId 매칭 채널 + (2) DIRECT 타입 채널 (entId 무관)

**코드 변경**:
```typescript
// AS-IS
const channels = await this.channelRepo.find({
  where: { chnId: In(channelIds), ...(entId ? { entId } : {}), chnDeletedAt: IsNull() },
});

// TO-BE (entId 있을 때 DIRECT 채널도 포함)
const channels = entId
  ? await this.channelRepo.find({
      where: [
        { chnId: In(channelIds), entId, chnDeletedAt: IsNull() },
        { chnId: In(channelIds), chnType: 'DIRECT', chnDeletedAt: IsNull() },
      ],
    })
  : await this.channelRepo.find({
      where: { chnId: In(channelIds), chnDeletedAt: IsNull() },
    });
```

### Task 1-3: DM/CHANNELS 섹션 접기/펼치기

**파일**: `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx`

**변경 내용**:
1. DM / Channels 섹션 라벨을 클릭 가능한 토글 버튼으로 변경
2. `ChevronDown` / `ChevronRight` 아이콘 추가
3. 접힌 상태에서 해당 섹션 미읽음 합산 배지 표시
4. 상태를 `localStorage`에 저장 (`talk-dm-collapsed`, `talk-channels-collapsed`)

**구현 상세**:
```typescript
// localStorage 기반 초기값
const [dmCollapsed, setDmCollapsed] = useState(
  () => localStorage.getItem('talk-dm-collapsed') === 'true'
);
const [channelsCollapsed, setChannelsCollapsed] = useState(
  () => localStorage.getItem('talk-channels-collapsed') === 'true'
);

const toggleDm = () => {
  setDmCollapsed(prev => {
    localStorage.setItem('talk-dm-collapsed', String(!prev));
    return !prev;
  });
};
```

**섹션 헤더 UI**:
```tsx
<button onClick={toggleDm} className="flex items-center gap-1 ...">
  {dmCollapsed ? <ChevronRight /> : <ChevronDown />}
  <span>DIRECT MESSAGES</span>
  {dmCollapsed && dmUnreadTotal > 0 && (
    <span className="badge">{dmUnreadTotal}</span>
  )}
</button>
{!dmCollapsed && dmChannels.map(ch => renderChannel(ch, true))}
```

### Task 1-4: 모바일 대화방 목록 돌아가기 확인

**파일**: `apps/mobile/src/tabs/ChatTab/components/ChatView.tsx`

**확인 사항**:
- `onBack` prop 호출하는 `←` 버튼이 헤더에 표시되는지 확인
- 버튼 클릭 영역(touch target)이 충분한지 확인 (최소 44x44px)
- 필요시 `pt-safe` (safe area) 조정

**수정 (필요한 경우만)**:
- `←` 버튼 touch target 확대
- safe area inset 적용

---

## Phase 2: 채널 관리 기능

### Task 2-1: 웹 채널 나가기 버튼

**파일**: `apps/web/src/domain/amoeba-talk/components/MemberPanel.tsx`

**변경 내용**:
1. 멤버 목록 하단에 "Leave Channel" 버튼 추가
2. Owner에게는 비표시
3. DIRECT 채널에서는 비표시
4. 확인 다이얼로그 후 기존 `removeMember` API 호출 (targetUserId = 본인)
5. 성공 시 채널 목록으로 이동 + 캐시 무효화

**코드 구현**:
```tsx
// MemberPanel.tsx 하단
{!isOwner && channel.type !== 'DIRECT' && (
  <div className="border-t px-4 py-3">
    <button
      onClick={() => {
        if (confirm(t('talk:leaveChannelConfirm'))) {
          removeMember.mutate(
            { channelId: channel.id, userId: userId! },
            { onSuccess: () => {
              setCurrentChannelId(null);
              qc.invalidateQueries({ queryKey: ['talk', 'channels'] });
            }}
          );
        }
      }}
      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
    >
      <LogOut className="h-4 w-4" />
      {t('talk:leaveChannel')}
    </button>
  </div>
)}
```

### Task 2-2: 모바일 채널 나가기 (옵션 메뉴)

**파일**: `apps/mobile/src/tabs/ChatTab/components/ChatView.tsx`

**변경 내용**:
1. 채널 헤더에 `⋯` (MoreVertical) 옵션 메뉴 버튼 추가
2. 탭 시 바텀시트 메뉴 표시: "멤버 보기", "채널 나가기"
3. 나가기 확인 다이얼로그
4. 성공 시 `onBack()` 호출

**파일 추가**: `apps/mobile/src/tabs/ChatTab/components/ChannelOptionMenu.tsx` (신규)

### Task 2-3: i18n 번역 키 추가 (Phase 2)

**파일**: `apps/web/src/locales/{en,ko,vi}/talk.json`

**추가 키**:
```json
{
  "leaveChannel": "Leave Channel / 채널 나가기 / Rời kênh",
  "leaveChannelConfirm": "Are you sure you want to leave this channel? / 정말 이 채널을 나가시겠습니까? / ...",
  "leaveChannelSuccess": "You have left the channel. / 채널을 나갔습니다. / ...",
  "cannotLeaveOwned": "Channel owners cannot leave. Please delete the channel or transfer ownership. / ..."
}
```

---

## Phase 3: 읽음 확인 + 이미지 뷰어

### Task 3-1: 메시지 읽은 사람 API

**파일**: `apps/api/src/domain/amoeba-talk/controller/message.controller.ts`

**엔드포인트**: `GET /talk/channels/:channelId/messages/:messageId/readers`

**구현**:
```typescript
@Get(':messageId/readers')
@Auth()
async getMessageReaders(
  @Param('channelId', ParseUUIDPipe) channelId: string,
  @Param('messageId', ParseUUIDPipe) messageId: string,
  @CurrentUser() user: UserPayload,
) {
  const data = await this.messageService.getMessageReaders(channelId, messageId, user);
  return { success: true, data };
}
```

**파일**: `apps/api/src/domain/amoeba-talk/service/message.service.ts`

**메서드**: `getMessageReaders(channelId, messageId, user)`

**로직**:
1. 멤버십 검증 (`assertMember`)
2. 메시지 조회 → `msgCreatedAt`, `usrId` 확인
3. 채널 활성 멤버 전체 조회 (송신자 제외)
4. `readStatusRepo.find({ where: { chnId: channelId } })`
5. 각 멤버별: `trsLastReadAt >= msgCreatedAt` → reader (readAt = trsLastReadAt)
6. 나머지 → nonReader
7. 사용자 이름 일괄 조회

### Task 3-2: 공유 타입 추가

**파일**: `packages/types/src/domain.types.ts`

```typescript
export interface TalkMessageReaderResponse {
  readers: { userId: string; userName: string; readAt: string }[];
  nonReaders: { userId: string; userName: string }[];
}
```

### Task 3-3: 프론트엔드 읽은 사람 팝오버 (웹)

**파일**: `apps/web/src/domain/amoeba-talk/components/MessageReadersPopover.tsx` (신규)

**구현**:
- 팝오버 UI: 메시지 근처에 표시
- 2섹션: "Read" (이름 + 시각), "Unread" (이름)
- 프로필 아바타 (이니셜)
- 외부 클릭 시 닫기
- React Query `useMessageReaders(channelId, messageId)` 활용

**파일**: `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx`

**변경**:
- ✓✓ 부분을 `<button>` + `onClick`으로 변경
- 클릭 시 `readersPopoverMsgId` state 설정
- `MessageReadersPopover` 렌더링

**파일**: `apps/web/src/domain/amoeba-talk/service/talk.service.ts`

**추가**:
```typescript
getMessageReaders = (channelId: string, messageId: string) =>
  apiClient.get<SingleResponse<TalkMessageReaderResponse>>(
    `${this.base}/channels/${channelId}/messages/${messageId}/readers`
  ).then(r => r.data.data);
```

**파일**: `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts`

**추가**:
```typescript
export const useMessageReaders = (channelId: string | null, messageId: string | null) =>
  useQuery({
    queryKey: ['talk', 'readers', channelId, messageId],
    queryFn: () => talkService.getMessageReaders(channelId!, messageId!),
    enabled: !!channelId && !!messageId,
  });
```

### Task 3-4: 모바일 이미지/파일 첨부 렌더링

**파일**: `apps/mobile/src/tabs/ChatTab/components/MessageList.tsx`

**변경**:
- `MessageBubble`에서 `msg.attachments` 렌더링 추가
- 이미지 (`mimeType.startsWith('image/')`) → 썸네일 `<img>` (max-w-[200px])
- 파일 → 파일명 + 크기 + 다운로드 아이콘
- 이미지 탭 시 `ImageLightbox` 열기

**코드 추가** (MessageBubble 내부):
```tsx
{msg.attachments?.map(att => (
  att.mimeType.startsWith('image/') ? (
    <img
      key={att.id}
      src={att.downloadUrl}
      alt={att.originalName}
      className="mt-1 max-w-[200px] rounded-lg"
      onClick={() => setLightboxUrl(att.downloadUrl)}
    />
  ) : (
    <a key={att.id} href={att.downloadUrl} className="flex items-center gap-1 mt-1 text-xs underline">
      <FileDown className="h-3 w-3" />
      {att.originalName} ({formatFileSize(att.fileSize)})
    </a>
  )
))}
```

### Task 3-5: 이미지 라이트박스 (모바일 + 웹)

**파일**: `apps/mobile/src/tabs/ChatTab/components/ImageLightbox.tsx` (신규)

**구현**:
```tsx
interface ImageLightboxProps {
  url: string;
  onClose: () => void;
}

export default function ImageLightbox({ url, onClose }: ImageLightboxProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
         onClick={onClose}>
      <button onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white">
        <X className="h-6 w-6" />
      </button>
      <img src={url} alt="" className="max-h-[90vh] max-w-[95vw] object-contain"
           onClick={e => e.stopPropagation()} />
    </div>
  );
}
```

**파일**: `apps/web/src/domain/amoeba-talk/components/ImageLightbox.tsx` (신규, 동일 구조)

**웹 TalkMessageList.tsx 변경**:
- 이미지 `<a target="_blank">` → `<button onClick={openLightbox}>`
- `lightboxUrl` state + `ImageLightbox` 조건부 렌더링

### Task 3-6: i18n 번역 키 추가 (Phase 3)

**추가 키**:
```json
{
  "readers": "Read by / 읽은 사람 / Đã đọc bởi",
  "nonReaders": "Not read / 안 읽은 사람 / Chưa đọc",
  "readAt": "Read at {{time}} / {{time}}에 읽음 / Đã đọc lúc {{time}}",
  "closeImage": "Close / 닫기 / Đóng",
  "downloadFile": "Download / 다운로드 / Tải xuống"
}
```

---

## Phase 4: @멘션 시스템

### Task 4-1: 백엔드 멘션 DTO 변경

**파일**: `apps/api/src/domain/amoeba-talk/dto/request/send-message.request.ts`

**변경**:
```typescript
@IsOptional()
@IsArray()
@IsUUID('4', { each: true })
mention_user_ids?: string[];
```

### Task 4-2: 백엔드 멘션 알림 로직

**파일**: `apps/api/src/domain/amoeba-talk/service/message.service.ts`

**변경** (sendMessage 메서드):
1. `mention_user_ids` 수신
2. content 내 `<@uuid>` 파싱하여 mentions 배열 생성
3. 메시지 응답에 `mentions` 필드 추가
4. `sendMessagePush`에서 멘션 대상에게 특별 Push 메시지

**코드**:
```typescript
// sendMessage 내부
const mentionUserIds = dto.mention_user_ids || [];

// Push 알림 분기
if (mentionUserIds.includes(memberId)) {
  // "OOO님이 회원님을 멘션했습니다: 메시지내용"
} else {
  // 기존 알림: "OOO: 메시지내용"
}
```

### Task 4-3: 메시지 응답 멘션 매핑

**파일**: `apps/api/src/domain/amoeba-talk/mapper/message.mapper.ts`

**변경**:
- `toMessageResponse`에 `mentions` 파라미터 추가
- content에서 `<@uuid>` 추출 → 사용자 이름 매핑

**파일**: `packages/types/src/domain.types.ts`

**변경**:
```typescript
export interface TalkMessageResponse {
  // ... existing
  mentions?: { userId: string; userName: string }[];
}
```

### Task 4-4: 프론트엔드 멘션 입력 드롭다운

**파일**: `apps/web/src/domain/amoeba-talk/components/TalkMessageInput.tsx`

**변경 내용**:
1. textarea의 `onChange`에서 `@` 뒤 텍스트 감지
2. 채널 멤버 목록 필터링 (useChannelDetail → members)
3. 입력창 위에 드롭다운 표시
4. 키보드 네비게이션 (↑↓, Enter, Esc)
5. 선택 시 `@이름 ` 삽입 + 내부 멘션 맵에 `{이름: userId}` 저장
6. 전송 시 content 내 `@이름`을 `<@userId>`로 치환 + `mention_user_ids` 생성

**내부 상태**:
```typescript
const [mentionQuery, setMentionQuery] = useState('');
const [mentionStart, setMentionStart] = useState(-1);
const [showMentionDropdown, setShowMentionDropdown] = useState(false);
const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
const mentionMapRef = useRef<Map<string, string>>(new Map()); // name → userId
```

**멘션 파싱 로직** (onChange):
```typescript
const cursorPos = textareaRef.current?.selectionStart || 0;
const textBeforeCursor = value.slice(0, cursorPos);
const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);
if (atMatch) {
  setShowMentionDropdown(true);
  setMentionQuery(atMatch[1]);
  setMentionStart(cursorPos - atMatch[1].length - 1);
} else {
  setShowMentionDropdown(false);
}
```

**전송 전 치환**:
```typescript
let processedContent = content;
const mentionUserIds: string[] = [];
mentionMapRef.current.forEach((userId, name) => {
  const regex = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
  if (processedContent.match(regex)) {
    processedContent = processedContent.replace(regex, `<@${userId}>`);
    mentionUserIds.push(userId);
  }
});
```

### Task 4-5: 프론트엔드 멘션 하이라이트 렌더링

**파일**: `apps/web/src/domain/amoeba-talk/components/TalkMessageList.tsx`

**변경 내용**:
- 메시지 content 렌더링 시 `<@uuid>` 패턴 파싱
- `mentions` 배열에서 userId → userName 매핑
- `@이름` 부분을 `<span className="text-indigo-500 font-medium cursor-pointer">` 으로 렌더링
- 클릭 시 해당 사용자에게 DM 이동 (선택사항)

**렌더링 유틸 함수**:
```typescript
function renderMentionedContent(
  content: string,
  mentions?: { userId: string; userName: string }[]
): React.ReactNode {
  if (!mentions?.length) return content;

  const mentionMap = new Map(mentions.map(m => [m.userId, m.userName]));
  const parts = content.split(/(<@[0-9a-f-]{36}>)/g);

  return parts.map((part, i) => {
    const match = part.match(/^<@([0-9a-f-]{36})>$/);
    if (match) {
      const name = mentionMap.get(match[1]) || 'Unknown';
      return <span key={i} className="text-indigo-500 font-medium">@{name}</span>;
    }
    return part;
  });
}
```

### Task 4-6: 모바일 멘션 렌더링

**파일**: `apps/mobile/src/tabs/ChatTab/components/MessageList.tsx`

**변경**: `MessageBubble`에서 동일한 `renderMentionedContent` 유틸 적용

### Task 4-7: 프론트엔드 서비스/훅 수정

**파일**: `apps/web/src/domain/amoeba-talk/service/talk.service.ts`

**변경**: `sendMessage`에 `mention_user_ids` 필드 추가

```typescript
// FormData 또는 JSON 전송 시
if (mentionUserIds.length > 0) {
  formData.append('mention_user_ids', JSON.stringify(mentionUserIds));
}
```

### Task 4-8: i18n 번역 키 추가 (Phase 4)

**추가 키**:
```json
{
  "mentionEveryone": "@all - Notify everyone / @all - 전체 알림 / @all - Thông báo tất cả",
  "mentionUser": "{{name}} mentioned you / {{name}}님이 회원님을 멘션했습니다 / ..."
}
```

---

## 전체 변경 파일 목록

### 백엔드 (apps/api)
| 파일 | Phase | 변경 |
|------|-------|------|
| `service/channel.service.ts` | 1 | DM entId 필터 수정 |
| `controller/message.controller.ts` | 3 | readers 엔드포인트 추가 |
| `service/message.service.ts` | 3,4 | getMessageReaders + 멘션 알림 |
| `dto/request/send-message.request.ts` | 4 | mention_user_ids 필드 |
| `mapper/message.mapper.ts` | 4 | mentions 매핑 |

### 프론트엔드 - 웹 (apps/web)
| 파일 | Phase | 변경 |
|------|-------|------|
| `components/ChannelList.tsx` | 1 | DM 이름 수정 + 접기/펼치기 |
| `components/MemberPanel.tsx` | 2 | 채널 나가기 버튼 |
| `components/TalkMessageList.tsx` | 3,4 | 읽음 팝오버 + 멘션 하이라이트 + 라이트박스 |
| `components/MessageReadersPopover.tsx` | 3 | 신규 |
| `components/ImageLightbox.tsx` | 3 | 신규 |
| `components/TalkMessageInput.tsx` | 4 | 멘션 드롭다운 |
| `service/talk.service.ts` | 3,4 | readers API + mention_user_ids |
| `hooks/useTalk.ts` | 2,3 | useLeaveChannel + useMessageReaders |

### 프론트엔드 - 모바일 (apps/mobile)
| 파일 | Phase | 변경 |
|------|-------|------|
| `components/ChatView.tsx` | 1,2 | 뒤로가기 확인 + 옵션 메뉴 |
| `components/MessageList.tsx` | 3,4 | 이미지/파일 렌더링 + 멘션 렌더링 |
| `components/ImageLightbox.tsx` | 3 | 신규 |
| `components/ChannelOptionMenu.tsx` | 2 | 신규 |

### 공유 패키지
| 파일 | Phase | 변경 |
|------|-------|------|
| `packages/types/src/domain.types.ts` | 3,4 | TalkMessageReaderResponse + mentions 타입 |

### i18n
| 파일 | Phase | 변경 |
|------|-------|------|
| `locales/en/talk.json` | 2,3,4 | 번역 키 추가 |
| `locales/ko/talk.json` | 2,3,4 | 번역 키 추가 |
| `locales/vi/talk.json` | 2,3,4 | 번역 키 추가 |

---

## 사이드 임팩트 체크리스트

- [ ] DM entId 필터 수정 후 ADMIN 사용자의 채널 목록 정상 확인
- [ ] 접기/펼치기 상태가 페이지 전환 후에도 유지되는지 확인
- [ ] 채널 나가기 후 SSE 연결 정리 확인
- [ ] 이미지 라이트박스에서 Esc 키로 닫히는지 확인
- [ ] 멘션 `<@uuid>` 마크업이 검색 결과에서 정상 파싱되는지 확인
- [ ] 동시번역 시 `<@uuid>` 마크업이 보존되는지 확인
- [ ] 기존 메시지 (멘션 없음)가 정상 렌더링되는지 확인
- [ ] 모바일 이미지 로딩 시 네트워크 에러 처리

---

## 배포 계획

| Phase | 배포 단위 | DB 변경 |
|-------|----------|---------|
| Phase 1 | 웹+API 동시 배포 | 없음 |
| Phase 2 | 웹+모바일 배포 | 없음 |
| Phase 3 | API 먼저 → 웹+모바일 | 없음 |
| Phase 4 | API 먼저 → 웹+모바일 | 없음 (DTO만 추가) |

**DB 마이그레이션 불필요** — 모든 변경이 기존 스키마 위에서 동작
