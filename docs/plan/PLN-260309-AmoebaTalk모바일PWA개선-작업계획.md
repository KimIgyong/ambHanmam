# 작업 계획서: Amoeba Talk 모바일 PWA 개선

**작성일**: 2026-03-09
**요구사항 분석서**: `docs/analysis/REQ-AmoebaTalk모바일PWA개선-20260309.md`

---

## 구현 단계

### Step 1: Chat Header 상단 고정 + 메시지 영역 최적화
**수정 파일**: `ChannelHeader.tsx`, `AmoebaTalkPage.tsx`

- ChannelHeader: `shrink-0` 추가하여 flex 축소 방지 (이미 border-b로 구분되므로 sticky 불필요 — flex-col 컨테이너 내에서 shrink-0이 핵심)
- AmoebaTalkPage: PWA standalone safe-area 반영
- 메시지 영역은 이미 `flex-1`이므로 헤더/입력창이 줄어들지 않으면 자동으로 최대 공간 확보

### Step 2: 채널 상단 고정 (Pin) 기능
**수정 파일**:
- `apps/api/src/domain/amoeba-talk/entity/talk-channel-member.entity.ts` — `chm_pinned` 컬럼
- `apps/api/src/domain/amoeba-talk/service/channel.service.ts` — pin/unpin 메서드, getMyChannels 정렬
- `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts` — PATCH 엔드포인트
- `packages/types/src/domain.types.ts` — TalkChannelResponse에 `isPinned` 추가
- `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx` — 핀 UI + 정렬
- `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts` — pin mutation 훅
- `apps/web/src/domain/amoeba-talk/service/talk.service.ts` — pin API 호출

### Step 3: 커스텀 앱 iframe 차단 시 안내 UI
**수정 파일**: `CustomAppHostPage.tsx`

- iframe `onLoad` + `onError` 이벤트 감지
- 3초 타임아웃으로 로드 실패 간주
- 카드형 안내 UI: 앱 이름 + 설명 + "새 탭에서 열기" CTA 버튼

### Step 4: 번역 키 추가
**수정 파일**: `locales/{en,ko,vi}/talk.json`, `locales/{en,ko,vi}/entitySettings.json`

---

## 수정 파일 목록

| 파일 | 작업 |
|------|------|
| `apps/api/.../talk-channel-member.entity.ts` | `chm_pinned` boolean 컬럼 추가 |
| `apps/api/.../channel.service.ts` | togglePin 메서드 + 채널 정렬에 pinned 반영 |
| `apps/api/.../channel.controller.ts` | PATCH pin 엔드포인트 |
| `packages/types/src/domain.types.ts` | isPinned 필드 추가 |
| `apps/web/.../ChannelHeader.tsx` | shrink-0 추가 |
| `apps/web/.../AmoebaTalkPage.tsx` | safe-area 반영 |
| `apps/web/.../ChannelList.tsx` | pinned 채널 상단 정렬 + 핀 버튼 |
| `apps/web/.../talk.service.ts` | togglePin API |
| `apps/web/.../useTalk.ts` | useTogglePin hook |
| `apps/web/.../CustomAppHostPage.tsx` | iframe 차단 감지 + 안내 UI |
| `locales/*/talk.json` | pin 관련 번역 |
| `locales/*/entitySettings.json` | iframe 차단 안내 번역 |

## 사이드 임팩트
- 채널 멤버 테이블에 컬럼 추가 → DB 마이그레이션 필요 (스테이징 수동)
- 기존 채널 목록 API 응답에 isPinned 필드 추가 — 하위호환 (optional 필드)
- 커스텀 앱 페이지 변경은 독립적, 다른 기능에 영향 없음
