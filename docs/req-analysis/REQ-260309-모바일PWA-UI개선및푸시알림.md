# 요구사항 분석서: 모바일 PWA UI 개선 및 푸시 알림

**작성일**: 2026-03-09
**요청자**: gray.kim@amoeba.group

---

## 1. 요구사항 요약

### 1-1. 모바일 PWA 하단 메뉴바
- PWA 모드(standalone)에서 화면 하단에 5개 탭 네비게이션 표시
- 탭 구성: **Messages** | **Crew** | **Home(Today)** | **Issue** | **(추가 1개)**

### 1-2. 푸시 알림
- 채팅 메시지 수신 시 푸시 알림
- 이슈 등록 시 담당자에게 푸시 알림
- 내가 관련된 이슈 상태 변경 시 푸시 알림

---

## 2. AS-IS 현황 분석

### 2-1. 모바일 네비게이션

| 항목 | 현재 상태 |
|------|----------|
| 모바일 메뉴 | 좌측 드로어(햄버거 메뉴) — 전체 메뉴 목록 |
| 하단 바 | 없음 |
| PWA 감지 | 없음 (`display-mode: standalone` 미감지) |
| 모바일 앱 (Capacitor) | 별도 앱 (`apps/mobile/`) — 5탭 바텀 네비게이션 있음 |

**모바일 앱(Capacitor)의 5탭 구성** (참고):
1. Chat → `/chat`
2. Work Tools → `/work-tools`
3. Work Modules → `/work-modules`
4. Site → `/site`
5. More → `/more`

### 2-2. 알림 시스템

| 항목 | 현재 상태 |
|------|----------|
| 인앱 알림 | SSE 기반 실시간 알림 + sonner toast 팝업 |
| 알림 벨 | 헤더 우측 상단 NotificationBell (미읽음 배지 + 드롭다운) |
| 알림 저장 | `amb_notification` 테이블 (DB 저장 + SSE 전송) |
| 웹 푸시 | **미구현** (Service Worker는 있지만 Push API 미사용) |
| 알림 유형 | `TODO_ASSIGNED`, `ISSUE_ASSIGNED`, `NOTE_ASSIGNED`, `CALENDAR_INVITED`, `COMMENT_MENTION` |

### 2-3. 이슈 알림 현황

| 이벤트 | 알림 여부 | 비고 |
|--------|----------|------|
| 이슈 생성 → 담당자 지정 | **O** | `ISSUE_ASSIGNED` 이벤트 emit |
| 이슈 수정 → 담당자 변경 | **O** | 새 담당자에게 `ISSUE_ASSIGNED` |
| 이슈 상태 변경 | **X** | `updateIssueStatus()`에 알림 로직 없음 |
| 이슈 코멘트 멘션 | **O** | `COMMENT_MENTION` 이벤트 emit |

### 2-4. Talk(채팅) 알림 현황

| 이벤트 | 알림 여부 | 비고 |
|--------|----------|------|
| 새 메시지 수신 | **X (인앱만)** | Talk SSE로 실시간 메시지 표시, 별도 푸시 알림 없음 |
| DM 메시지 | **X** | SSE 구독 중인 채널만 실시간 수신 |
| 그룹 채널 메시지 | **X** | 동일 |

**핵심 이슈**: 현재 Talk은 SSE 구독 중일 때만 메시지 수신 → 앱이 비활성/닫혀있으면 알림 없음

---

## 3. TO-BE 요구사항

### 3-1. 모바일 PWA 하단 메뉴바

**표시 조건**: `display-mode: standalone` (PWA 설치 모드)에서만 하단 바 노출

**5탭 구성**:

| 순서 | 아이콘 | 라벨 | 경로 | 설명 |
|------|--------|------|------|------|
| 1 | MessageCircle | Messages | `/amoeba-talk` | Amoeba Talk 채팅 |
| 2 | Users | Crew | `/hr/employees` | 동료 목록 (법인 멤버) |
| 3 | Home | Home | `/` | Today 대시보드 |
| 4 | AlertCircle | Issues | `/issues` | 이슈 관리 |
| 5 | Menu | More | - | 드로어 열기 (기존 전체 메뉴) |

**UI 스펙**:
- 높이: 56px + safe-area-inset-bottom
- 배경: 흰색, 상단 border
- 활성 탭: indigo-600 (아이콘 + 텍스트)
- 비활성 탭: gray-400
- 미읽음 배지: Messages 탭에 빨간 점 (Talk 미읽음 있을 때)

**레이아웃 영향**:
- PWA 모드에서 MainLayout의 메인 컨텐츠 하단에 바텀바 높이만큼 패딩 추가
- 기존 데스크톱 사이드바는 PWA에서 hidden (드로어로만 접근)
- 데스크톱 브라우저에서는 기존 레이아웃 유지

### 3-2. 웹 푸시 알림 (Web Push Notification)

**아키텍처**:
```
[브라우저/PWA]                    [백엔드]
 Service Worker  ← Push Event ←  web-push 라이브러리
 PushSubscription → 구독 API →   amb_push_subscription 테이블
```

**알림 트리거**:

| 트리거 | 수신자 | 알림 내용 |
|--------|--------|----------|
| Talk 새 메시지 | 채널 멤버 (발신자 제외) | "{발신자}: {메시지 미리보기}" |
| 이슈 담당자 지정 | 담당자 | 기존 `ISSUE_ASSIGNED` 알림에 푸시 추가 |
| 이슈 상태 변경 | 작성자 + 담당자 (변경자 제외) | "이슈 '{제목}' 상태: {이전} → {이후}" |

**구독 관리**:
- 프론트엔드: Service Worker의 `pushManager.subscribe()` → VAPID 키 기반
- 백엔드: `POST /push/subscribe` — 구독 정보 저장
- 백엔드: `DELETE /push/subscribe` — 구독 해제
- 테이블: `amb_push_subscription` (userId, endpoint, p256dh, auth, userAgent, createdAt)

**VAPID 키**:
- 서버에서 생성, 환경변수로 관리 (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`)
- 프론트엔드는 `VITE_VAPID_PUBLIC_KEY`로 참조

---

## 4. 갭 분석

### 4-1. 하단 메뉴바

| 항목 | 갭 | 난이도 |
|------|-----|--------|
| PWA 모드 감지 | CSS `@media (display-mode: standalone)` + JS `matchMedia` | 낮음 |
| 하단 바 컴포넌트 | 신규 개발 필요 | 낮음 |
| MainLayout 조건부 렌더링 | PWA 모드에서 사이드바 hidden, 바텀바 표시 | 중간 |
| Talk 미읽음 배지 | Talk API에 unread count 있음 → 훅 연결 | 낮음 |
| safe-area-inset-bottom | 이미 CSS 변수 `--sab` 정의됨 | 낮음 |

### 4-2. 푸시 알림

| 항목 | 갭 | 난이도 |
|------|-----|--------|
| VAPID 키 생성 | `web-push` npm 패키지로 1회 생성 | 낮음 |
| Push 구독 API (백엔드) | 엔티티 + 컨트롤러 + 서비스 신규 | 중간 |
| Push 구독 (프론트) | Service Worker에 push 이벤트 핸들러 + 구독 로직 | 중간 |
| 기존 알림에 Push 추가 | NotificationListener에서 push 전송 추가 | 낮음 |
| Talk 메시지 Push | message.service.ts에 푸시 발송 로직 추가 | 중간 |
| 이슈 상태 변경 Push | issue.service.ts에 이벤트 emit 추가 | 낮음 |

---

## 5. 사용자 플로우

### 5-1. PWA 하단 메뉴바 플로우
```
1. 사용자가 PWA(홈 화면 추가)로 앱 실행
2. display-mode: standalone 감지 → 하단 바 표시
3. 상단 헤더 유지 (로고, 알림, 프로필)
4. 사이드바 숨김 → More 탭으로 드로어 접근
5. 하단 5탭으로 주요 기능 빠른 접근
6. 일반 브라우저 접근 시 기존 레이아웃 유지
```

### 5-2. 푸시 알림 플로우
```
1. 로그인 후 푸시 알림 권한 요청 팝업
2. 허용 시 → PushSubscription 생성 → 백엔드 저장
3. 앱이 백그라운드/닫혀있을 때:
   a. Talk 메시지 수신 → 백엔드가 web-push 전송 → SW가 Notification 표시
   b. 이슈 담당자 지정 → 동일
   c. 이슈 상태 변경 → 동일
4. 알림 클릭 → PWA 활성화 + 해당 페이지로 이동
```

---

## 6. 기술 제약사항

1. **iOS Safari PWA 제한**: iOS 16.4+에서만 Web Push 지원. 그 이하 버전은 Push 불가
2. **VAPID 키 영속성**: 한번 생성한 키는 변경하면 기존 구독이 모두 무효화 → 환경변수로 관리 필수
3. **Service Worker Scope**: vite-plugin-pwa가 생성하는 SW에 push 이벤트 핸들러를 추가해야 함 → `injectManifest` 모드 또는 커스텀 SW 필요
4. **Talk SSE vs Push**: 앱이 포그라운드일 때는 SSE로 수신, 백그라운드일 때만 Push → 중복 알림 방지 필요
5. **safe-area-inset-bottom**: 하단 바 + 홈 인디케이터 영역 겹침 방지 (이미 CSS 변수 적용됨)
