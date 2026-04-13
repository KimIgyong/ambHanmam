# 요구사항 분석서: Amoeba Talk 모바일 PWA 개선

**작성일**: 2026-03-09
**분류**: UI/UX 개선, 모바일 최적화

---

## 1. 요구사항 원문

1. 모바일 PWA 앱에서 로비챗 대화방제목 (나가기, 검색, 멤버보기) 라인이 보이지 않음
2. 상단 고정, 대화메시지 화면의 80% 사용하기
3. 채널리스트에서 주요채널 상단고정 기능
4. 커스텀앱 - talk.amoeba.site refused to connect. iframe 불가시 "이 앱은 새탭으로 연결합니다" 안내문구 노출 (박스 디자인)

---

## 2. AS-IS 현황 분석

### 2.1 Chat Header (ChannelHeader.tsx)
- **구조**: `<div className="border-b bg-white">` — 일반 flow 요소 (position: static)
- **문제**: 모바일에서 키보드가 올라오거나 메시지가 많으면 헤더가 스크롤 밖으로 밀릴 수 있음
- **헤더 구성**: 뒤로가기(모바일) + 채널아이콘 + 채널명 + 검색/멤버 버튼
- **padding**: `px-2 py-2 md:px-4 md:py-3`

### 2.2 메시지 영역 (TalkMessageList.tsx)
- **구조**: `<div className="flex-1 overflow-y-auto px-4 py-2">`
- flex-1으로 나머지 공간을 차지하나, 상위 컨테이너 높이 계산에 따라 실제 표시 면적이 줄어들 수 있음
- 모바일 PWA standalone 모드에서 safe-area 미반영

### 2.3 AmoebaTalkPage 레이아웃
- **전체 높이**: `h-[calc(100vh-3.5rem)]` (모바일), `h-[calc(100vh-4rem)]` (데스크톱)
- **채팅 영역**: `flex-1 flex-col min-w-0` — 헤더 + 메시지리스트 + 입력창이 flex-col로 배치
- 헤더가 sticky가 아닌 일반 요소라서 overflow 시 안 보일 수 있음

### 2.4 채널 리스트 (ChannelList.tsx)
- 채널 분류: DM / Group 2개 섹션으로 나뉘며 접기/펼치기 가능
- **고정 기능 없음**: 채널 타입에 `pinned` 필드 없음, 정렬은 서버 반환 순서 그대로
- 마지막 메시지 시간 기준 암묵적 정렬 (서버 측)

### 2.5 커스텀 앱 (CustomAppHostPage.tsx)
- iframe sandbox: `allow-scripts allow-same-origin allow-popups allow-forms`
- **X-Frame-Options / CSP 문제**: 외부 사이트가 `X-Frame-Options: DENY` 또는 `Content-Security-Policy: frame-ancestors 'none'` 설정 시 iframe 로드 불가
- 현재 에러 핸들링: `error` 상태만 체크 (토큰 발급 실패 시), iframe 자체 로드 실패는 감지 불가
- 이미 "Open in new tab" 버튼은 있으나, iframe 거부 시 사용자에게 명확한 안내 없음

---

## 3. TO-BE 요구사항

### 3.1 Chat Header 상단 고정
- ChannelHeader를 `sticky top-0 z-10`으로 변경
- shrink-0 적용하여 flex 축소 방지
- 모바일에서 항상 보이도록 보장

### 3.2 메시지 영역 80% 확보
- 현재 flex-1로 이미 남은 공간을 차지하고 있으므로, 입력창 높이를 최소화하고 헤더를 컴팩트하게 유지
- PWA standalone 모드에서 safe-area-inset 반영

### 3.3 채널 상단 고정 (Pin)
- 백엔드: 채널 멤버 테이블(amb_talk_channel_members)에 `tcm_pinned` 컬럼 추가 (사용자별 PIN)
- API: `PATCH /talk/channels/:id/pin` 엔드포인트
- 프론트: 고정된 채널을 각 섹션 최상단에 표시, 핀 아이콘으로 구분
- 사용자별 PIN이므로 다른 사용자에게 영향 없음

### 3.4 커스텀 앱 iframe 차단 시 안내
- iframe의 `onError` 이벤트 및 로드 타임아웃으로 차단 감지
- 차단 감지 시 카드형 안내 UI 표시:
  - 앱 이름 + 아이콘
  - "이 앱은 보안 정책으로 인해 앱 내에서 표시할 수 없습니다"
  - "새 탭에서 열기" 버튼 (CTA)
- 박스 디자인으로 보기좋게

---

## 4. 갭 분석

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| Chat Header | position: static | sticky top-0 | CSS 변경만 |
| 메시지 영역 높이 | flex-1 (가변) | flex-1 + safe-area | CSS 미세 조정 |
| 채널 고정 | 미지원 | 사용자별 PIN | DB컬럼 + API + UI |
| 커스텀앱 에러 | 무표시 | 카드형 안내 | iframe 에러감지 + UI |

---

## 5. 기술 제약사항

- **iframe 로드 실패 감지**: 브라우저 보안상 cross-origin iframe의 에러를 직접 감지 불가. `onLoad` 후 `contentWindow` 접근 시 에러 여부로 간접 판단하거나, 일정 시간 후 로드 완료 여부 체크
- **채널 PIN**: 기존 `amb_talk_channel_members` 테이블에 컬럼 추가 방식이 가장 단순
- **PWA safe-area**: `env(safe-area-inset-*)` CSS로 처리 가능

---

## 6. 사용자 플로우

### 채널 고정
1. 채널 리스트에서 채널 길게 누르기(모바일) 또는 우클릭(데스크톱) → "고정" 옵션
2. 또는 채널 항목 옆 핀 아이콘 버튼
3. 고정된 채널은 해당 섹션(DM/Group) 최상단에 📌 표시와 함께 노출
4. 다시 누르면 고정 해제

### 커스텀 앱 iframe 차단
1. 사용자가 사이드바에서 커스텀 앱 클릭
2. 토큰 발급 → iframe 로드 시도
3. 3초 후에도 iframe 로드 안되면 → 카드형 안내 표시
4. "새 탭에서 열기" 클릭 → 새 브라우저 탭에서 앱 오픈
