# 작업 계획서: 모바일 PWA UI 개선 및 푸시 알림

**작성일**: 2026-03-09
**요구사항 분석서**: `docs/analysis/REQ-모바일PWA-UI개선및푸시알림-20260309.md`

---

## Phase 1: 모바일 PWA 하단 메뉴바

### Step 1-1. PWA standalone 모드 감지 훅

**파일**: `apps/web/src/hooks/usePwaMode.ts` (신규)

```typescript
// CSS matchMedia + display-mode: standalone 감지
// iOS standalone (navigator.standalone) 호환
// 반환: isPwa: boolean
```

**포인트**:
- `window.matchMedia('(display-mode: standalone)')` — Android/Desktop PWA
- `(navigator as any).standalone === true` — iOS Safari PWA
- 한번 감지되면 세션 내내 유지 (상태 변경 없음)

---

### Step 1-2. MobileBottomBar 컴포넌트

**파일**: `apps/web/src/components/layout/MobileBottomBar.tsx` (신규)

**구현 사항**:
- 5개 탭: Messages, Crew, Home, Issues, More
- 아이콘: `lucide-react` — MessageCircle, Users, Home, AlertCircle, Menu
- 활성 탭 감지: `useLocation()` 경로 매칭
- Messages 탭: Talk 미읽음 배지 표시 (빨간 점)
- More 탭: 기존 드로어 열기 (`setDrawerOpen(true)`)
- safe-area-inset-bottom 적용: `padding-bottom: var(--sab)`

**UI 스펙**:
```
┌─────────────────────────────────────────────┐
│ Messages │  Crew  │  Home  │ Issues │  More │
│    💬    │   👥   │   🏠   │   🐛   │   ☰  │
└─────────────────────────────────────────────┘
 ← safe-area-inset-bottom 영역 →
```

- 높이: 56px (아이콘 20px + 텍스트 10px + 패딩)
- 배경: `bg-white border-t border-gray-200`
- 활성: `text-indigo-600`, 비활성: `text-gray-400`
- 폰트: `text-[10px]`

---

### Step 1-3. MainLayout 수정 — PWA 모드 분기

**파일**: `apps/web/src/layouts/MainLayout.tsx` (수정)

**변경 사항**:
1. `usePwaMode()` 훅 사용
2. PWA 모드일 때:
   - 데스크톱 사이드바 (`<aside data-sidebar>`) → hidden
   - 모바일 드로어는 유지 (More 탭에서 열기)
   - 메인 컨텐츠 하단에 `MobileBottomBar` 렌더링
   - 헤더 유지 (축소 가능)
3. 일반 브라우저:
   - 기존 동작 유지 (md 이상: 사이드바, md 미만: 드로어)

**레이아웃 구조 (PWA 모드)**:
```
┌──────── Header (h-14) ────────┐
│                               │
│       Main Content Area       │
│       (flex-1, overflow)      │
│                               │
├──────── BottomBar (56px) ─────┤
│  Msg | Crew | Home | Iss | ☰ │
└─── safe-area-inset-bottom ────┘
```

---

### Step 1-4. Talk 미읽음 카운트 연동

**파일**: `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts` (수정)

**추가**:
- `useTotalUnreadCount()` 훅 — 전체 채널 미읽음 합산
- 기존 `useChannels()` 데이터에서 `unreadCount` 합산
- `MobileBottomBar`에서 사용

---

### Step 1-5. CSS 조정

**파일**: `apps/web/src/styles/globals.css` (수정)

```css
/* PWA standalone 모드에서 바텀바용 컨텐츠 패딩 */
@media (display-mode: standalone) {
  /* 필요시 추가 스타일 */
}
```

---

## Phase 2: 웹 푸시 알림 — 백엔드

### Step 2-1. web-push 패키지 설치 + VAPID 키 생성

**파일**: `apps/api/package.json` (수정)

```bash
npm install web-push --workspace=apps/api
npm install @types/web-push -D --workspace=apps/api
```

VAPID 키 생성 (1회):
```bash
npx web-push generate-vapid-keys
```

**환경변수 추가**:
- `VAPID_PUBLIC_KEY` — 프론트엔드와 공유
- `VAPID_PRIVATE_KEY` — 백엔드 전용
- `VAPID_SUBJECT` — `mailto:admin@amoeba.com`

프론트엔드 환경변수:
- `VITE_VAPID_PUBLIC_KEY` — 동일한 public key

---

### Step 2-2. PushSubscription 엔티티

**파일**: `apps/api/src/domain/notification/entity/push-subscription.entity.ts` (신규)

**테이블**: `amb_push_subscription`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `psb_id` | UUID PK | 구독 ID |
| `usr_id` | UUID FK | 사용자 |
| `ent_id` | UUID FK | 법인 |
| `psb_endpoint` | varchar(500) | Push 엔드포인트 URL |
| `psb_p256dh` | varchar(200) | p256dh 키 |
| `psb_auth` | varchar(100) | auth 시크릿 |
| `psb_user_agent` | varchar(300) | 브라우저/디바이스 정보 |
| `psb_created_at` | timestamp | 생성일 |

---

### Step 2-3. Push 구독 API

**파일**: `apps/api/src/domain/notification/controller/push.controller.ts` (신규)

**엔드포인트**:
- `POST /push/subscribe` — 구독 등록 (endpoint, p256dh, auth)
- `DELETE /push/subscribe` — 구독 해제 (endpoint 기반)
- `GET /push/vapid-key` — VAPID public key 반환

**파일**: `apps/api/src/domain/notification/service/push.service.ts` (신규)

**주요 메서드**:
- `subscribe(userId, entityId, subscription)` — 구독 저장 (endpoint 중복 시 update)
- `unsubscribe(endpoint)` — 구독 삭제
- `sendPush(userId, payload)` — 해당 유저의 모든 구독에 push 전송
- `sendPushToMany(userIds, payload)` — 다수 유저에게 push 전송
- `cleanupExpired(endpoint)` — 만료/실패 구독 정리 (410 응답 시)

---

### Step 2-4. NotificationListener에 Push 전송 추가

**파일**: `apps/api/src/domain/notification/service/notification.listener.ts` (수정)

**변경**:
- `PushService` 주입
- `handleAssigneeAssigned()`: SSE 전송 후 Push 전송 추가
- `handleCommentMention()`: 동일

```typescript
// 기존: SSE만 전송
this.notificationSseService.emit(recipientId, response);

// 추가: Push도 전송
await this.pushService.sendPush(recipientId, {
  title: response.ntfTitle,
  body: response.ntfMessage,
  data: { url: this.getResourceUrl(response) },
});
```

---

### Step 2-5. 이슈 상태 변경 알림 추가

**파일**: `apps/api/src/domain/notification/constant/notification-type.constant.ts` (수정)

**추가**:
```typescript
ISSUE_STATUS_CHANGED: 'ISSUE_STATUS_CHANGED',
```

**이벤트**:
```typescript
export const ISSUE_STATUS_EVENT = 'issue.status_changed' as const;

export interface IssueStatusChangedEvent {
  issueId: string;
  issueTitle: string;
  fromStatus: string;
  toStatus: string;
  changerId: string;
  changerName: string;
  reporterId: string;
  assigneeId: string | null;
  entityId: string;
}
```

**파일**: `apps/api/src/domain/issues/service/issue.service.ts` (수정)

`updateIssueStatus()` 메서드에 이벤트 emit 추가:
```typescript
// 상태 변경 후
this.eventEmitter.emit(ISSUE_STATUS_EVENT, {
  issueId: id,
  issueTitle: entity.issTitle,
  fromStatus: currentStatus,
  toStatus: newStatus,
  changerId: userId,
  changerName: changerName,
  reporterId: entity.issReporterId,
  assigneeId: entity.issAssigneeId,
  entityId: entity.entId,
});
```

**파일**: `apps/api/src/domain/notification/service/notification.listener.ts` (수정)

```typescript
@OnEvent(ISSUE_STATUS_EVENT, { async: true })
async handleIssueStatusChanged(event: IssueStatusChangedEvent): Promise<void> {
  // 수신자: 작성자 + 담당자 (변경자 본인 제외)
  const recipientIds = [event.reporterId, event.assigneeId]
    .filter((id): id is string => !!id && id !== event.changerId);

  // 중복 제거
  const uniqueRecipientIds = [...new Set(recipientIds)];

  // DB 저장 + SSE + Push 전송
}
```

---

### Step 2-6. Talk 메시지 푸시 알림

**파일**: `apps/api/src/domain/amoeba-talk/service/message.service.ts` (수정)

**변경**: `sendMessage()` 메서드에서 메시지 저장 후:
1. 채널 멤버 목록 조회 (발신자 제외)
2. PushService를 통해 푸시 전송

```typescript
// 메시지 저장 후
const members = await this.memberRepo.find({ where: { chlId: channelId } });
const recipientIds = members
  .map(m => m.usrId)
  .filter(id => id !== userId); // 발신자 제외

await this.pushService.sendPushToMany(recipientIds, {
  title: `${senderName}`,
  body: content.substring(0, 100),
  data: { url: '/amoeba-talk', channelId },
  tag: `talk-${channelId}`, // 같은 채널 알림은 교체
});
```

**중복 방지**: 포그라운드 SSE 수신 중인 사용자는 Push 불필요 → 초기에는 중복 허용, 추후 최적화

---

## Phase 3: 웹 푸시 알림 — 프론트엔드

### Step 3-1. vite-plugin-pwa를 injectManifest 모드로 전환

**파일**: `apps/web/vite.config.ts` (수정)

```typescript
VitePWA({
  strategies: 'injectManifest',  // generateSW → injectManifest
  srcDir: 'src',
  filename: 'sw.ts',             // 커스텀 Service Worker
  registerType: 'prompt',
  // ... manifest, workbox 설정 유지
})
```

**파일**: `apps/web/src/sw.ts` (신규)

```typescript
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Workbox precache
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching (기존 설정 유지)
registerRoute(/^\/api\//, new NetworkFirst({ cacheName: 'api-cache' }));
registerRoute(/^https:\/\/cdn\.jsdelivr\.net\//, new CacheFirst({ cacheName: 'cdn-cache' }));

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'AMA', {
      body: data.body,
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-192x192.png',
      data: data.data,
      tag: data.tag,
    })
  );
});

// Notification click handler → 해당 페이지로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // 이미 열린 창이 있으면 포커스 + 이동
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // 없으면 새 창 열기
      return clients.openWindow(url);
    })
  );
});
```

---

### Step 3-2. Push 구독 훅

**파일**: `apps/web/src/hooks/usePushSubscription.ts` (신규)

**로직**:
1. 로그인 상태 + SW 준비 완료 시 자동 실행
2. `Notification.permission` 확인
3. 권한 없으면 `Notification.requestPermission()` 요청
4. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
5. 구독 정보를 `POST /push/subscribe`로 전송

```typescript
export function usePushSubscription() {
  // 로그인 상태에서 1회 실행
  // 이미 구독된 경우 스킵 (pushManager.getSubscription())
  // 구독 실패 시 조용히 무시 (권한 거부 등)
}
```

---

### Step 3-3. main.tsx에서 Push 구독 초기화

**파일**: `apps/web/src/main.tsx` (수정)

기존 `registerSW` 이후 push 구독은 React 컴포넌트 내부에서 처리하므로 main.tsx 변경 최소화.

**파일**: `apps/web/src/App.tsx` (수정)

`usePushSubscription()` 훅을 App 레벨에서 호출.

---

## 수정 파일 목록

### Phase 1: 하단 메뉴바

| 파일 | 작업 | 설명 |
|------|------|------|
| `apps/web/src/hooks/usePwaMode.ts` | **신규** | PWA standalone 모드 감지 |
| `apps/web/src/components/layout/MobileBottomBar.tsx` | **신규** | 5탭 하단 바 |
| `apps/web/src/layouts/MainLayout.tsx` | 수정 | PWA 모드 분기 + 바텀바 렌더링 |
| `apps/web/src/domain/amoeba-talk/hooks/useTalk.ts` | 수정 | 미읽음 카운트 훅 추가 |

### Phase 2: 백엔드 Push

| 파일 | 작업 | 설명 |
|------|------|------|
| `apps/api/package.json` | 수정 | `web-push` 추가 |
| `apps/api/src/domain/notification/entity/push-subscription.entity.ts` | **신규** | 구독 엔티티 |
| `apps/api/src/domain/notification/controller/push.controller.ts` | **신규** | 구독 API |
| `apps/api/src/domain/notification/service/push.service.ts` | **신규** | Push 전송 서비스 |
| `apps/api/src/domain/notification/service/notification.listener.ts` | 수정 | Push 전송 추가 |
| `apps/api/src/domain/notification/constant/notification-type.constant.ts` | 수정 | ISSUE_STATUS_CHANGED 추가 |
| `apps/api/src/domain/notification/notification.module.ts` | 수정 | 새 서비스/컨트롤러 등록 |
| `apps/api/src/domain/issues/service/issue.service.ts` | 수정 | 상태 변경 이벤트 emit |
| `apps/api/src/domain/amoeba-talk/service/message.service.ts` | 수정 | 메시지 발송 후 Push |
| `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` | 수정 | PushService import |
| `env/backend/.env.development` | 수정 | VAPID 키 추가 |
| `docker/staging/.env.staging` | 수정 | VAPID 키 추가 |

### Phase 3: 프론트엔드 Push

| 파일 | 작업 | 설명 |
|------|------|------|
| `apps/web/vite.config.ts` | 수정 | injectManifest 모드 전환 |
| `apps/web/src/sw.ts` | **신규** | 커스텀 Service Worker (push + notificationclick) |
| `apps/web/src/hooks/usePushSubscription.ts` | **신규** | Push 구독 관리 훅 |
| `apps/web/src/App.tsx` | 수정 | usePushSubscription 훅 연결 |
| `env/frontend/.env.development` | 수정 | VITE_VAPID_PUBLIC_KEY |

---

## 사이드 임팩트 분석

| 영역 | 영향 | 대응 |
|------|------|------|
| vite-plugin-pwa 모드 전환 | `generateSW` → `injectManifest`로 빌드 방식 변경, 기존 캐싱 동작 유지 필요 | workbox 런타임 캐싱을 sw.ts에 수동 등록 |
| MainLayout 구조 변경 | PWA 모드에서 사이드바 hidden → 모든 메뉴는 드로어로만 접근 | More 탭에서 드로어 열림 보장 |
| Talk 메시지 Push 부하 | 그룹 채널에 많은 멤버 → 다수에게 push 전송 | web-push 비동기 전송, 실패 시 구독 정리 |
| 이슈 상태 변경 이벤트 | 기존 없던 이벤트 추가 → NotificationListener 확장 | 새 이벤트만 추가, 기존 로직 불변 |
| 기존 SSE + Push 중복 | 포그라운드에서 SSE toast + Push 알림 동시 표시 가능 | 초기: 중복 허용 (UX 큰 문제 아님), 추후: 포그라운드 감지 시 Push 억제 |

---

## 구현 순서 (권장)

1. **Phase 1** (하단 메뉴바) — 프론트엔드만, 독립적 → 즉시 구현 가능
2. **Phase 2** (백엔드 Push) — VAPID 키 생성 → 엔티티 → 서비스 → 리스너 확장
3. **Phase 3** (프론트엔드 Push) — SW 전환 → 구독 → 테스트

Phase 1은 독립적이므로 먼저 구현하고 배포 후 확인.
Phase 2-3은 함께 구현하여 통합 테스트.
