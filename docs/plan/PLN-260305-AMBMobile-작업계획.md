# 작업 계획서: AMB Mobile 앱 구현

| 항목 | 내용 |
|------|------|
| 문서 ID | PLAN-AMBMobile-작업계획-20260305 |
| 작성일 | 2026-03-05 |
| 작성자 | Claude Code |
| 관련 분석서 | REQ-AMBMobile제품컨셉-20260305 |
| 상태 | 계획 수립 |

---

## 1. 시스템 개발 현황 기반 분석

### 1.1 재사용 가능 백엔드 자산

| 자산 | 상태 | 모바일 재사용 | 비고 |
|------|------|-------------|------|
| 인증 API (`/auth/login`, `/auth/refresh`, `/auth/me`) | 완료 | 100% | JWT access(15분) + refresh(7일), Bearer 토큰 지원 |
| 메뉴 권한 API (`/settings/permissions/me`) | 완료 | 100% | MyMenuItemResponse[] 반환, 4계층 판정 |
| 채널/메시지 API (25+ 엔드포인트) | 완료 | 100% | 커서 기반 페이지네이션, ILIKE 검색 |
| SSE 실시간 이벤트 (7종) | 완료 | 100% | RxJS Subject 기반 Observable |
| Presence 서비스 | 완료 | 100% | 하트비트 30초, 타임아웃 60초 |
| 번역 서비스 (`MessageTranslateService`) | 완료 | 90% | `translateMessage()`, `translateInline()` — 캐싱 테이블 확장 필요 |
| 할일/노트/이슈/공지/스케줄 API | 완료 | 100% | 웹뷰에서 기존 웹 페이지로 접근 |
| 표준 응답 형식 | 완료 | 100% | `{ success, data, error?, timestamp }` |

### 1.2 재사용 가능 프론트엔드 자산

| 자산 | 상태 | 모바일 재사용 방식 |
|------|------|------------------|
| API 서비스 클래스 (`talk.service.ts` 등) | 완료 | 복사 후 baseURL 변경 |
| React Query 훅 (`useTalk.ts` 등) | 완료 | 채팅 탭에서 재활용 |
| Zustand 스토어 (`talk.store.ts`) | 완료 | 모바일 UX에 맞게 간소화 |
| i18n 번역 파일 (35 네임스페이스, 3언어) | 완료 | 모바일 전용 키 추가 후 공유 |
| 기존 웹 페이지 (업무도구/모듈) | 완료 | **웹뷰로 직접 접근** (반응형 대응 필요) |

### 1.3 신규 개발 필요 항목 요약

| 구분 | 항목 | 규모 |
|------|------|------|
| **인프라** | Capacitor 프로젝트 셋업 (`apps/mobile/`) | M |
| **인프라** | CORS 설정 확장 (Capacitor 오리진 추가) | S |
| **DB** | `amb_talk_message_translations` 테이블 | M |
| **백엔드** | 번역 캐시 API (캐시 조회/저장) | M |
| **백엔드** | 푸시 알림 서비스 (FCM/APNs) | L |
| **백엔드** | 디바이스 토큰 관리 API | S |
| **프론트** | 모바일 앱 쉘 (5탭 레이아웃) | M |
| **프론트** | 채팅 탭 네이티브 UI (채널/메시지/번역) | XL |
| **프론트** | 업무도구 카드뷰 + WebView 컨테이너 | M |
| **프론트** | 업무모듈 카드뷰 + WebView 컨테이너 | M |
| **프론트** | 사이트 바로가기 (웹뷰) | S |
| **프론트** | 더보기 탭 | S |

### 1.4 기존 코드 변경 필요 항목

| 파일 | 변경 내용 | 영향도 |
|------|-----------|--------|
| `env/backend/.env.development` | `CORS_ORIGINS`에 Capacitor 오리진 추가 | 🟢 무영향 |
| `env/backend/.env.staging` | 스테이징 CORS 추가 | 🟢 무영향 |
| `apps/api/src/domain/amoeba-talk/service/message-translate.service.ts` | 번역 결과를 `amb_talk_message_translations`에도 저장 | 🟡 최소 변경 |
| `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` | 번역 캐시 엔티티 등록 | 🟡 최소 변경 |
| `packages/types/src/domain.types.ts` | 모바일 관련 타입 추가 | 🟢 추가만 |
| `apps/web/src/` (일부 페이지) | 모바일 반응형 CSS 보완 | 🟡 스타일만 |

---

## 2. 단계별 구현 계획

### Phase 1: 로비챗 MVP (6주)

로비챗 채팅 기능을 모바일에서 완전하게 사용할 수 있는 MVP를 목표로 한다.

---

#### Step 1.1: Capacitor 프로젝트 셋업 + 앱 쉘 (3일)

**목표**: 모노레포에 `apps/mobile/` Capacitor 프로젝트를 생성하고, 5탭 레이아웃이 동작하는 빈 앱 쉘 구축

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 1-1 | Capacitor 프로젝트 초기화 | `apps/mobile/` 디렉토리 생성, `npm init`, Capacitor CLI 설치 | `apps/mobile/package.json` |
| 1-2 | Capacitor 설정 | `capacitor.config.ts` 생성 (appId, appName, webDir, server) | `apps/mobile/capacitor.config.ts` |
| 1-3 | Vite 설정 | `apps/web/vite.config.ts` 참고하여 모바일 전용 Vite 설정 | `apps/mobile/vite.config.ts` |
| 1-4 | TypeScript 설정 | `@/*` 경로 에일리어스, `packages/types` 참조 | `apps/mobile/tsconfig.json` |
| 1-5 | 플랫폼 추가 | `npx cap add ios && npx cap add android` | `apps/mobile/ios/`, `apps/mobile/android/` |
| 1-6 | 5탭 레이아웃 구현 | 하단 탭 바 (채팅/업무도구/업무모듈/사이트/더보기) | `apps/mobile/src/layouts/MobileTabLayout.tsx` |
| 1-7 | 라우터 설정 | React Router DOM 기반 모바일 전용 라우팅 | `apps/mobile/src/router/index.tsx` |
| 1-8 | 모노레포 통합 | `package.json` workspaces에 등록, Turborepo 빌드 파이프라인 추가 | `package.json`, `turbo.json` |
| 1-9 | 개발 스크립트 | `npm run dev:mobile`, `npm run build:mobile` | `package.json` |

**Capacitor 설정 상세**:

```typescript
// apps/mobile/capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.amoeba.management',
  appName: 'AMB',
  webDir: 'dist',
  server: {
    // 개발 시 로컬 서버 연결
    url: 'http://localhost:5180',  // 모바일 전용 포트
    cleartext: true,
  },
  plugins: {
    SplashScreen: { launchShowDuration: 2000 },
  },
};
```

**5탭 구조**:

```
┌────────────────────────────────────────────┐
│ [콘텐츠 영역]                                │
│                                            │
├────────────────────────────────────────────┤
│ 💬채팅  🔧도구  📦모듈  🌐사이트  ⋯더보기     │
└────────────────────────────────────────────┘
```

**필수 의존성**:

```json
{
  "@capacitor/core": "^6.x",
  "@capacitor/cli": "^6.x",
  "@capacitor/app": "^6.x",
  "@capacitor/network": "^6.x",
  "@capacitor/status-bar": "^6.x",
  "@capacitor/splash-screen": "^6.x",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "@tanstack/react-query": "^5.28.0",
  "zustand": "^4.5.0",
  "i18next": "^25.8.7",
  "react-i18next": "^16.5.4",
  "tailwindcss": "^3.4.0",
  "vite": "^5.2.0"
}
```

**사이드 임팩트**: 없음 — 기존 코드 무변경, 신규 디렉토리 추가만

---

#### Step 1.2: 모바일 인증 (2일)

**목표**: JWT 토큰 기반 로그인/자동 로그인/토큰 갱신이 동작하는 인증 레이어 구축

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 2-1 | Secure Storage 플러그인 설치 | `@capacitor/preferences` (또는 `@capacitor-community/secure-storage`) | `apps/mobile/package.json` |
| 2-2 | 인증 서비스 구현 | login, refresh, logout, getMe API 호출 + 토큰 저장/조회 | `apps/mobile/src/services/auth.service.ts` |
| 2-3 | API 클라이언트 설정 | Axios 인스턴스 (baseURL, Bearer 토큰 자동 첨부, 401 인터셉터) | `apps/mobile/src/services/api-client.ts` |
| 2-4 | 인증 스토어 | Zustand (user, isAuthenticated, login, logout 액션) | `apps/mobile/src/stores/auth.store.ts` |
| 2-5 | 로그인 페이지 | 이메일/비밀번호 입력, 에러 표시, Throttle 안내 | `apps/mobile/src/pages/LoginPage.tsx` |
| 2-6 | 인증 가드 | 미인증 시 로그인 페이지 리다이렉트 | `apps/mobile/src/components/AuthGuard.tsx` |
| 2-7 | 자동 토큰 갱신 | refresh_token으로 access_token 자동 갱신 (만료 1분 전) | `api-client.ts` 인터셉터 |

**인증 플로우**:

```
앱 실행
  ↓
Secure Storage에서 access_token + refresh_token 조회
  ├─ 없음 → 로그인 페이지
  └─ 있음 → GET /auth/me 호출
       ├─ 200 OK → 메인 화면 (채팅 탭)
       ├─ 401 → POST /auth/refresh (refresh_token)
       │    ├─ 200 → 새 토큰 저장 → 메인 화면
       │    └─ 401 → 로그인 페이지
       └─ mustChangePw=true → 비밀번호 변경 화면
```

**백엔드 변경**:

| 파일 | 변경 |
|------|------|
| `env/backend/.env.development` | `CORS_ORIGINS`에 `http://localhost:5180,capacitor://localhost,http://localhost` 추가 |

**사이드 임팩트**: CORS 설정 추가만 — 기존 웹 앱에 영향 없음

---

#### Step 1.3: 채널 목록 + DM 목록 UI (4일)

**목표**: 로비챗의 채널/DM 목록을 모바일 최적화 UI로 표시

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 3-1 | Talk API 서비스 | 기존 `talk.service.ts` 기반, baseURL 변경 | `apps/mobile/src/services/talk.service.ts` |
| 3-2 | React Query 훅 | `useChannels()`, `useUnreadCounts()`, `useEntityMembers()` | `apps/mobile/src/hooks/useTalk.ts` |
| 3-3 | Talk 스토어 | currentChannelId, 검색 등 상태 관리 | `apps/mobile/src/stores/talk.store.ts` |
| 3-4 | 채널 목록 화면 | 채널/DM 섹션 분리, 미읽음 뱃지, 최신 메시지 미리보기 | `apps/mobile/src/tabs/ChatTab/ChannelListPage.tsx` |
| 3-5 | 채널 아이템 | 아이콘(PUBLIC/PRIVATE/DIRECT), 이름, 미읽음 수, 마지막 메시지 | `apps/mobile/src/tabs/ChatTab/components/ChannelItem.tsx` |
| 3-6 | 채널 생성 | 바텀시트 폼 (채널명, 설명, 유형, 멤버 선택) | `apps/mobile/src/tabs/ChatTab/components/CreateChannelSheet.tsx` |
| 3-7 | DM 시작 | 법인 멤버 검색 + 선택 → findOrCreateDm | `apps/mobile/src/tabs/ChatTab/components/NewDmSheet.tsx` |
| 3-8 | 검색 | 채널명 필터링 | `ChannelListPage.tsx` 내 검색 바 |
| 3-9 | 메뉴 권한 연동 | `GET /settings/permissions/me` 호출, AMOEBA_TALK 권한 확인 | `apps/mobile/src/hooks/useMenuPermissions.ts` |

**UI 와이어프레임**:

```
┌────────────────────────────────┐
│ 로비챗              [+] [✉️]   │  ← 채널 생성, DM 시작
│────────────────────────────────│
│ 🔍 채널 검색...                 │
│────────────────────────────────│
│ ■ 채널                          │
│ ┌──────────────────────────┐   │
│ │ # dev-ambkms       (3)  │   │  ← 미읽음 3
│ │  김개발: DB 마이그레이...   │   │  ← 마지막 메시지
│ ├──────────────────────────┤   │
│ │ # marketing             │   │
│ │  이마케팅: 캠페인 결과...   │   │
│ └──────────────────────────┘   │
│                                │
│ ■ 다이렉트 메시지                │
│ ┌──────────────────────────┐   │
│ │ 🟢 Nguyễn Văn A    (1)  │   │  ← 온라인 + 미읽음
│ │  확인했습니다               │   │
│ └──────────────────────────┘   │
├────────────────────────────────┤
│ 💬채팅  🔧도구  📦모듈  🌐  ⋯  │
└────────────────────────────────┘
```

**API 호출**: 기존 백엔드 API 100% 재사용

---

#### Step 1.4: 대화 화면 — 메시지 송수신 + SSE (7일)

**목표**: 채널/DM 선택 시 메시지 목록 표시, 메시지 전송, SSE 실시간 수신

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 4-1 | 메시지 목록 훅 | 커서 기반 무한 스크롤 (`useMessages`) | `useTalk.ts` 확장 |
| 4-2 | SSE 연결 훅 | 채널 SSE 구독 + 자동 재연결 (지수 백오프) | `apps/mobile/src/hooks/useTalkSSE.ts` |
| 4-3 | Presence 훅 | 하트비트 + 상태 SSE 구독 | `apps/mobile/src/hooks/usePresence.ts` |
| 4-4 | 대화 화면 | 메시지 목록 + 입력 바 + 헤더 | `apps/mobile/src/tabs/ChatTab/ChatRoomPage.tsx` |
| 4-5 | 메시지 버블 | 내 메시지/상대 메시지 분리, 시간 표시, 읽음 수 | `apps/mobile/src/tabs/ChatTab/components/MessageBubble.tsx` |
| 4-6 | 메시지 입력 | 텍스트 입력 + 전송 버튼 + 번역 포함 전송 토글 | `apps/mobile/src/tabs/ChatTab/components/MessageInput.tsx` |
| 4-7 | 채널 헤더 | 채널명, 멤버 수, 온라인 상태, 검색 버튼 | `apps/mobile/src/tabs/ChatTab/components/ChatHeader.tsx` |
| 4-8 | 날짜 구분선 | 메시지 간 날짜 변경 시 구분선 표시 | `MessageBubble.tsx` 내 |
| 4-9 | 대댓글 (Reply) | 대댓글 대상 미리보기, 부모 메시지 링크 | `apps/mobile/src/tabs/ChatTab/components/ReplyPreview.tsx` |
| 4-10 | 리액션 | 리액션 토글 (LIKE/GOOD_JOB/SAD), 리액션 요약 표시 | `MessageBubble.tsx` 내 |
| 4-11 | 메시지 액션 시트 | 롱프레스 → 답장/번역/할일변환/이슈변환/노트변환/복사/고정 | `apps/mobile/src/tabs/ChatTab/components/MessageActionSheet.tsx` |
| 4-12 | 메시지 검색 | 채널 내 메시지 검색 (ILIKE) | `ChatRoomPage.tsx` 내 검색 모드 |
| 4-13 | 읽음 표시 | 채널 진입 시 `markAsRead()` 호출 | `ChatRoomPage.tsx` useEffect |
| 4-14 | 멤버 패널 | 채널 멤버 목록 (바텀시트) | `apps/mobile/src/tabs/ChatTab/components/MemberSheet.tsx` |

**UI 와이어프레임**:

```
┌────────────────────────────────┐
│ ← # dev-ambkms    3명  [🔍][⋮]│  ← 뒤로가기, 검색, 멤버
│────────────────────────────────│
│         2026년 3월 5일          │  ← 날짜 구분선
│                                │
│              ┌────────────────┐│
│              │ DB 마이그레이션 ││  ← 내 메시지 (우측)
│              │ 완료했습니다.    ││
│              │         09:30 ✓││
│              └────────────────┘│
│                                │
│ ┌────────────────┐             │
│ │ Tôi sẽ kiểm    │             │  ← 상대 메시지 (좌측)
│ │ tra phía FE.   │             │
│ │ 09:45  [🌐]    │             │  ← 번역 버튼
│ └────────────────┘             │
│                                │
│────────────────────────────────│
│ ☑ [KO→EN] 번역 포함 전송       │  ← 번역 토글
│ ┌──────────────────┐          │
│ │ 메시지 입력...     │ [📎] [⬆]│
│ └──────────────────┘          │
└────────────────────────────────┘
```

**SSE 재연결 전략**:

```
연결 끊김 감지
  ↓
재연결 시도 (지수 백오프: 1s → 2s → 4s → 8s → 16s, 최대 5회)
  ↓
재연결 성공 시:
  1. 마지막 수신 메시지 이후의 메시지 조회 (커서 기반)
  2. 미읽음 수 갱신
  3. SSE 재구독
```

---

#### Step 1.5: 메시지 번역 캐시 테이블 + API (3일)

**목표**: `amb_talk_message_translations` 전용 테이블 생성, 번역 캐시 조회/저장 API 구축

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 5-1 | Entity 생성 | `TalkMessageTranslationEntity` (tmt_id, msg_id, tmt_lang, tmt_content, tmt_method, tmt_source_hash) | `apps/api/src/domain/amoeba-talk/entity/talk-message-translation.entity.ts` |
| 5-2 | Migration 생성 | `CREATE TABLE amb_talk_message_translations` + 인덱스 + UNIQUE 제약 | `apps/api/src/migrations/` |
| 5-3 | 모듈 등록 | `AmoebaeTalkModule`에 Entity 등록 | `apps/api/src/domain/amoeba-talk/amoeba-talk.module.ts` |
| 5-4 | 캐시 서비스 | 캐시 조회 (msg_id + lang) → HIT/MISS 판정, MISS 시 AI 번역 → 저장 | `apps/api/src/domain/amoeba-talk/service/message-translation-cache.service.ts` |
| 5-5 | API 확장 | `POST /talk/messages/{msgId}/translate-cached` (캐시 우선 번역) | `apps/api/src/domain/amoeba-talk/controller/message.controller.ts` |
| 5-6 | 메시지 발송 확장 | `translate_to` 파라미터 시 캐시 테이블에도 저장 | `message-translate.service.ts` 확장 |
| 5-7 | 타입 추가 | `TalkMessageTranslationResponse` | `packages/types/src/domain.types.ts` |

**DB 스키마**:

```sql
CREATE TABLE amb_talk_message_translations (
  tmt_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msg_id          UUID NOT NULL REFERENCES amb_talk_messages(msg_id) ON DELETE CASCADE,
  tmt_lang        VARCHAR(5) NOT NULL,
  tmt_content     TEXT NOT NULL,
  tmt_method      VARCHAR(20) DEFAULT 'AI',
  tmt_source_hash VARCHAR(64),
  tmt_created_at  TIMESTAMPTZ DEFAULT NOW(),
  tmt_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(msg_id, tmt_lang)
);

CREATE INDEX idx_tmt_msg_lang ON amb_talk_message_translations(msg_id, tmt_lang);
```

**캐시 서비스 로직**:

```typescript
async translateWithCache(msgId: string, targetLang: string, userId: string): Promise<TranslationResult> {
  // 1. 캐시 조회
  const cached = await this.repo.findOne({ where: { msgId, tmtLang: targetLang } });
  if (cached) {
    // 원문 해시 비교 → 변경 시 재번역
    const message = await this.messageRepo.findOne({ where: { msgId } });
    const currentHash = sha256(message.msgContent);
    if (cached.tmtSourceHash === currentHash) {
      return { content: cached.tmtContent, fromCache: true };
    }
  }

  // 2. AI 번역
  const result = await this.translateService.translateInline(message.msgContent, targetLang, userId);

  // 3. 캐시 저장 (UPSERT)
  await this.repo.upsert({
    msgId, tmtLang: targetLang, tmtContent: result.translatedContent,
    tmtMethod: 'AI', tmtSourceHash: sha256(message.msgContent),
  }, ['msgId', 'tmtLang']);

  return { content: result.translatedContent, fromCache: false };
}
```

**사이드 임팩트**:
- 기존 `translateMessage()` 메서드는 변경 없이 유지
- 신규 `translateWithCache()` 메서드를 추가하여 모바일에서 사용
- 기존 `amb_content_translations` 테이블에는 영향 없음

---

#### Step 1.6: 사용자 선택 번역 UI (4일)

**목표**: 메시지 작성 시 번역 포함 전송, 읽을 때 번역 요청 기능 구현

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 6-1 | 번역 요청 훅 | `useTranslateMessage()` — 캐시 우선 번역 API 호출 | `useTalk.ts` 확장 |
| 6-2 | 번역 상태 스토어 | `translations: Record<msgId, Record<lang, string>>` | `talk.store.ts` 확장 |
| 6-3 | 번역 버튼 | 메시지 버블 하단 [🌐] 버튼 → 언어 선택 팝오버 | `apps/mobile/src/tabs/ChatTab/components/TranslationButton.tsx` |
| 6-4 | 번역 결과 표시 | 메시지 버블 내 인라인 번역 표시 (접기/펼치기) | `apps/mobile/src/tabs/ChatTab/components/TranslationResult.tsx` |
| 6-5 | 작성 시 번역 | MessageInput에 번역 포함 전송 토글 + 언어 선택 | `MessageInput.tsx` 확장 |
| 6-6 | 번역 로딩 | 번역 요청 중 스피너 표시 | `TranslationButton.tsx` 내 |

**번역 UX 플로우**:

```
[읽을 때 번역]
메시지 버블의 [🌐] 버튼 탭
  ↓
언어 선택 팝오버: [KO] [EN] [VI]
  ↓
POST /talk/messages/{msgId}/translate-cached
  ├─ 캐시 HIT → 즉시 표시 (0ms)
  └─ 캐시 MISS → 로딩 스피너 (1-3초) → 결과 인라인 표시

[작성 시 번역]
메시지 입력 → [☑ 번역 포함 전송] 토글 ON → [EN ▼] 언어 선택
  ↓
POST /talk/channels/{id}/messages { content, translate_to: "en" }
  ↓
원문 + 번역이 함께 저장/표시됨
```

---

#### Step 1.7: 푸시 알림 (5일)

**목표**: 앱 백그라운드/종료 상태에서 새 메시지 알림 수신

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 7-1 | 디바이스 토큰 테이블 | `amb_push_device_tokens` (usr_id, pdt_token, pdt_platform, pdt_created_at) | `apps/api/src/domain/push/entity/push-device-token.entity.ts` |
| 7-2 | 디바이스 토큰 API | POST `/push/register`, DELETE `/push/unregister` | `apps/api/src/domain/push/controller/push.controller.ts` |
| 7-3 | 푸시 서비스 | FCM Admin SDK 연동, 토큰별 발송 | `apps/api/src/domain/push/service/push.service.ts` |
| 7-4 | SSE→푸시 연동 | `message:new` 이벤트 시 오프라인 멤버에게 푸시 발송 | `talk-sse.service.ts` 확장 |
| 7-5 | Capacitor 푸시 플러그인 | `@capacitor/push-notifications` 설치 + 설정 | `apps/mobile/package.json` |
| 7-6 | 푸시 초기화 | 앱 시작 시 권한 요청 + 토큰 등록 | `apps/mobile/src/plugins/push.ts` |
| 7-7 | 알림 탭 핸들링 | 알림 탭 시 해당 채널/메시지로 네비게이션 | `push.ts` 확장 |

**푸시 알림 발송 조건**:

```
message:new 이벤트 발생
  ↓
채널 멤버 목록 조회
  ↓
각 멤버:
  ├─ SSE 연결 중 (온라인) → 푸시 발송 안 함 (SSE로 수신)
  └─ SSE 미연결 (오프라인) → amb_push_device_tokens에서 토큰 조회 → FCM 발송
```

**DB 스키마**:

```sql
CREATE TABLE amb_push_device_tokens (
  pdt_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usr_id        UUID NOT NULL REFERENCES amb_users(usr_id) ON DELETE CASCADE,
  pdt_token     VARCHAR(500) NOT NULL,
  pdt_platform  VARCHAR(10) NOT NULL,  -- 'ios' | 'android'
  pdt_created_at TIMESTAMPTZ DEFAULT NOW(),
  pdt_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usr_id, pdt_token)
);
```

---

### Phase 2: 업무도구/모듈 웹뷰 + 업무 변환 (3주)

업무도구/업무모듈을 카드뷰 메뉴로 보여주고, 웹뷰로 기존 웹 페이지에 접근한다.

---

#### Step 2.1: WebView 컨테이너 공통 컴포넌트 (3일)

**목표**: 인증이 주입된 WebView 컨테이너를 만들어 기존 웹 페이지를 앱 내에서 탐색

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 8-1 | WebView 컨테이너 | Capacitor `@capacitor/browser` 또는 인앱 WebView 래퍼 | `apps/mobile/src/components/WebViewContainer.tsx` |
| 8-2 | 인증 주입 | JWT 토큰을 WebView에 Cookie 또는 URL 파라미터로 전달 | `WebViewContainer.tsx` 내 |
| 8-3 | 네비게이션 바 | 뒤로가기, 새로고침, 닫기 버튼 | `WebViewContainer.tsx` 상단 바 |
| 8-4 | 로딩/에러 상태 | WebView 로딩 스피너, 네트워크 에러 화면 | `WebViewContainer.tsx` 내 |
| 8-5 | 환경별 URL 매핑 | 개발/스테이징/프로덕션 URL 자동 선택 | `apps/mobile/src/config/environment.ts` |

**WebView 인증 주입 방식**:

```typescript
// 방법 1: Cookie 주입 (권장)
// Capacitor의 CapacitorCookies API로 access_token 쿠키 설정
import { CapacitorCookies } from '@capacitor/core';

await CapacitorCookies.setCookie({
  url: API_BASE_URL,
  key: 'access_token',
  value: storedToken,
});

// 방법 2: URL 파라미터 (fallback)
// WebView URL에 token 쿼리 파라미터 추가
const url = `${WEB_URL}/todos?mobile_token=${storedToken}`;
```

**환경별 URL 매핑**:

```typescript
const ENVIRONMENTS = {
  development: {
    api: 'http://localhost:3009/api/v1',
    web: 'http://localhost:5179',
  },
  staging: {
    api: 'https://stg-mng.amoeba.site/api/v1',
    web: 'https://stg-mng.amoeba.site',
  },
  production: {
    api: 'https://mng.amoeba.com/api/v1',
    web: 'https://mng.amoeba.com',
  },
};
```

---

#### Step 2.2: 업무도구 탭 — 카드뷰 메뉴 (2일)

**목표**: WORK_TOOL 카테고리 메뉴를 카드뷰로 표시, 탭 시 웹뷰로 이동

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 9-1 | 카드 메뉴 컴포넌트 | 아이콘 + 라벨 카드 그리드 (2열) | `apps/mobile/src/components/CardMenu.tsx` |
| 9-2 | 업무도구 탭 페이지 | `useMyMenus()` → WORK_TOOL 필터 → CardMenu 렌더링 | `apps/mobile/src/tabs/WorkToolsTab/WorkToolsPage.tsx` |
| 9-3 | 웹뷰 연결 | 카드 탭 → WebViewContainer로 해당 경로 오픈 | `WorkToolsPage.tsx` 내 |

**카드 매핑** (권한에 따라 동적 표시):

| 메뉴 코드 | 아이콘 | 라벨 | 웹뷰 경로 |
|----------|--------|------|-----------|
| TODO | CheckSquare | 할일 | `/todos` |
| MEETING_NOTES | FileText | 노트/회의록 | `/meeting-notes` |
| ISSUES | AlertCircle | 이슈 | `/issues` |
| AMOEBA_TALK | MessageSquare | 로비챗 (PC) | `/amoeba-talk` |
| ATTENDANCE | Clock | 출근/근태 | `/attendances` |
| NOTICES | Bell | 공지사항 | `/notices` |
| CALENDAR | Calendar | 캘린더 | `/calendar` |
| PROJECT_MANAGEMENT | Briefcase | 프로젝트 | `/projects` |

**UI 와이어프레임**:

```
┌────────────────────────────────┐
│ 업무도구                        │
│────────────────────────────────│
│ ┌──────────┐  ┌──────────┐    │
│ │    ☑     │  │    📝    │    │
│ │   할일    │  │ 노트/회의록│    │
│ └──────────┘  └──────────┘    │
│ ┌──────────┐  ┌──────────┐    │
│ │    🔴    │  │    🕐    │    │
│ │   이슈    │  │  출근/근태 │    │
│ └──────────┘  └──────────┘    │
│ ┌──────────┐  ┌──────────┐    │
│ │    🔔    │  │    📅    │    │
│ │  공지사항  │  │   캘린더   │    │
│ └──────────┘  └──────────┘    │
├────────────────────────────────┤
│ 💬채팅  🔧도구  📦모듈  🌐  ⋯  │
└────────────────────────────────┘
```

---

#### Step 2.3: 업무모듈 탭 — 카드뷰 메뉴 (2일)

**목표**: MODULE 카테고리 메뉴를 카드뷰로 표시, 탭 시 웹뷰로 이동

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 10-1 | 업무모듈 탭 페이지 | `useMyMenus()` → MODULE 필터 → CardMenu 렌더링 | `apps/mobile/src/tabs/WorkModulesTab/WorkModulesPage.tsx` |
| 10-2 | 웹뷰 연결 | 카드 탭 → WebViewContainer로 해당 경로 오픈 | `WorkModulesPage.tsx` 내 |

**카드 매핑**:

| 메뉴 코드 | 아이콘 | 라벨 | 웹뷰 경로 |
|----------|--------|------|-----------|
| HR | Users | HR 관리 | `/hr` |
| ACCOUNTING | Calculator | 회계 | `/accounting` |
| BILLING | Receipt | 청구/계약 | `/billing` |
| MAIL | Mail | 웹메일 | `/mail` |
| KMS | BookOpen | 지식관리 | `/kms` |
| ASSET_MANAGEMENT | Package | 자산관리 | `/assets` |
| SERVICE_MANAGEMENT | Settings | 서비스관리 | `/services` |

---

#### Step 2.4: 사이트 바로가기 탭 (1일)

**목표**: 아메바매니지먼트 포탈 웹사이트를 앱 내 웹뷰로 접근

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 11-1 | 사이트 탭 페이지 | WebViewContainer로 포탈 URL 로드 | `apps/mobile/src/tabs/SiteTab/SitePage.tsx` |
| 11-2 | 환경별 URL | 포탈 URL 환경 설정 | `environment.ts` 확장 |

---

#### Step 2.5: 메시지 → 업무 변환 액션 (3일)

**목표**: 채팅 메시지를 할일/노트/이슈로 변환하는 기능

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 12-1 | 빠른 생성 폼 | 바텀시트 (제목 자동 채움 + 마감일/타입 선택) | `apps/mobile/src/tabs/ChatTab/components/QuickCreateForm.tsx` |
| 12-2 | 할일 변환 | 메시지 내용 → 할일 제목, `POST /todos` 호출 | `QuickCreateForm.tsx` 내 |
| 12-3 | 노트 변환 | 메시지 내용 → 노트 본문, `POST /meeting-notes` 호출 | `QuickCreateForm.tsx` 내 |
| 12-4 | 이슈 변환 | 메시지 내용 → 이슈 제목, `POST /issues` 호출 | `QuickCreateForm.tsx` 내 |
| 12-5 | 액션 시트 연결 | MessageActionSheet에서 변환 옵션 선택 시 QuickCreateForm 열기 | `MessageActionSheet.tsx` 연결 |

**변환 플로우**:

```
메시지 롱프레스 → [☑ 할일로 만들기] 선택
  ↓
QuickCreateForm 바텀시트:
  제목: "DB 마이그레이션 완료했습니다" (자동 채움, 50자 제한)
  마감일: [날짜 선택]
  [생성]
  ↓
POST /api/v1/todos { title, due_date, ... }
  ↓
토스트: "할일이 생성되었습니다" + [보기] 링크 → 업무도구 탭 웹뷰
```

---

#### Step 2.6: 기존 웹 모바일 반응형 대응 (4일)

**목표**: 웹뷰에서 표시될 주요 페이지의 모바일 반응형 레이아웃 보완

**작업 항목**:

| # | 작업 | 대상 페이지 | 파일 |
|---|------|-----------|------|
| 13-1 | 할일 페이지 반응형 | 목록 뷰 모바일 최적화 | `apps/web/src/domain/todos/` |
| 13-2 | 노트 페이지 반응형 | 목록/상세 뷰 모바일 최적화 | `apps/web/src/domain/meeting-notes/` |
| 13-3 | 이슈 페이지 반응형 | 목록 뷰 모바일 최적화 (칸반/간트 숨기기) | `apps/web/src/domain/issues/` |
| 13-4 | 공통 레이아웃 | 모바일 웹뷰 접근 시 사이드바 숨기기 | `apps/web/src/layouts/MainLayout.tsx` |

**반응형 전략**:
- 기존 TailwindCSS 반응형 클래스 활용 (`sm:`, `md:`, `lg:`)
- 웹뷰 접근 시 쿼리 파라미터 (`?mobile=true`) 또는 User-Agent 감지로 사이드바 숨기기
- 테이블 뷰 → 카드 뷰 전환 (모바일)
- 모달 → 바텀시트 전환은 하지 않음 (기존 모달 그대로 사용)

**사이드 임팩트**: CSS 스타일 변경만 — 기존 PC 레이아웃에 영향 없음 (`lg:` 이상 브레이크포인트 유지)

---

### Phase 3: 완성도 (3주)

---

#### Step 3.1: 더보기 탭 (3일)

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 14-1 | 더보기 메뉴 | 설정 항목 리스트 | `apps/mobile/src/tabs/MoreTab/MorePage.tsx` |
| 14-2 | 프로필 | 사용자 정보 표시, 언어 설정, 로그아웃 | `apps/mobile/src/tabs/MoreTab/ProfileSection.tsx` |
| 14-3 | 알림 설정 | 푸시 알림 ON/OFF | `MorePage.tsx` 내 |
| 14-4 | 공지사항 | 웹뷰로 `/notices` 접근 | `MorePage.tsx` 내 |
| 14-5 | AI 에이전트 | 웹뷰로 AI 채팅 접근 | `MorePage.tsx` 내 |

---

#### Step 3.2: 오프라인 메시지 큐 (4일)

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 15-1 | 네트워크 상태 감지 | `@capacitor/network` 플러그인 | `apps/mobile/src/hooks/useNetwork.ts` |
| 15-2 | 메시지 큐 | 오프라인 시 전송 대기열 (localStorage) | `apps/mobile/src/services/message-queue.service.ts` |
| 15-3 | 재전송 로직 | 온라인 복귀 시 큐 순차 전송 | `message-queue.service.ts` 내 |
| 15-4 | UI 표시 | 오프라인 배너, 전송 대기 메시지 표시 | `ChatRoomPage.tsx` 확장 |

---

#### Step 3.3: 생체인증 앱 잠금 (2일)

**작업 항목**:

| # | 작업 | 상세 | 파일 |
|---|------|------|------|
| 16-1 | 생체인증 플러그인 | `@capacitor-community/biometric-auth` | `apps/mobile/package.json` |
| 16-2 | 잠금 화면 | 앱 복귀 시 Face ID/지문 인증 | `apps/mobile/src/pages/LockScreen.tsx` |
| 16-3 | 설정 | 생체인증 ON/OFF 토글 | `MorePage.tsx` 설정 연결 |

---

#### Step 3.4: 앱스토어 배포 준비 (5일)

**작업 항목**:

| # | 작업 | 상세 |
|---|------|------|
| 17-1 | 앱 아이콘/스플래시 | 1024x1024 아이콘, 스플래시 이미지 제작 |
| 17-2 | iOS 설정 | Info.plist (카메라/갤러리 권한, 푸시 설정) |
| 17-3 | Android 설정 | AndroidManifest.xml (권한, FCM 설정) |
| 17-4 | 빌드 최적화 | Vite 프로덕션 빌드 + 코드 스플리팅 |
| 17-5 | TestFlight/내부 테스트 | iOS TestFlight, Android 내부 테스트 배포 |
| 17-6 | 앱스토어 메타데이터 | 앱 설명, 스크린샷, 카테고리 |

---

## 3. 사이드 임팩트 분석

### 3.1 기존 시스템 영향

| 영향 대상 | 변경 내용 | 심각도 | 대응 |
|-----------|-----------|--------|------|
| `env/backend/.env.*` | CORS_ORIGINS 추가 | 🟢 없음 | 기존 오리진 유지, 추가만 |
| `apps/api/` DB | 2개 테이블 추가 (번역캐시, 디바이스토큰) | 🟢 없음 | 기존 테이블 무변경 |
| `apps/api/` 번역 서비스 | `translateWithCache()` 메서드 추가 | 🟢 없음 | 기존 메서드 무변경 |
| `apps/api/` SSE 서비스 | 푸시 알림 트리거 추가 | 🟡 최소 | 기존 SSE 로직 유지, 훅 추가만 |
| `apps/web/` CSS | 모바일 반응형 보완 | 🟢 없음 | `sm:`/`md:` 클래스 추가, PC 레이아웃 무변경 |
| `packages/types/` | 모바일 관련 타입 추가 | 🟢 없음 | 기존 타입 무변경 |
| DB 부하 | 모바일 사용자 추가 → API/SSE 연결 증가 | 🟡 중간 | 모니터링 필요 |

### 3.2 번역 비용 영향

| 시나리오 | API 호출 | 비용 영향 |
|----------|---------|-----------|
| 작성 시 번역 (사용자 선택) | 선택 시에만 호출 | 🟢 낮음 |
| 읽을 때 번역 — 캐시 HIT | 0 (DB 조회만) | 🟢 없음 |
| 읽을 때 번역 — 캐시 MISS | 1회 호출 → 이후 캐시 | 🟡 초기만 |
| 동일 메시지 재번역 | 0 (캐시 반환) | 🟢 없음 |

**결론**: 사용자 선택 방식 + 캐싱으로 번역 비용은 통제 가능

---

## 4. 프로젝트 구조 (최종)

```
ambManagement/
├── apps/
│   ├── api/                          ← 기존 (최소 변경)
│   │   └── src/domain/
│   │       ├── amoeba-talk/
│   │       │   ├── entity/
│   │       │   │   └── talk-message-translation.entity.ts  🆕
│   │       │   └── service/
│   │       │       └── message-translation-cache.service.ts  🆕
│   │       └── push/                  🆕 푸시 알림 모듈
│   │           ├── entity/push-device-token.entity.ts
│   │           ├── controller/push.controller.ts
│   │           └── service/push.service.ts
│   ├── web/                          ← 기존 (반응형 CSS 보완만)
│   └── mobile/                       🆕 Capacitor 모바일 앱
│       ├── android/
│       ├── ios/
│       ├── capacitor.config.ts
│       ├── vite.config.ts
│       ├── package.json
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── config/
│           │   └── environment.ts
│           ├── router/
│           │   └── index.tsx
│           ├── layouts/
│           │   └── MobileTabLayout.tsx
│           ├── pages/
│           │   ├── LoginPage.tsx
│           │   └── LockScreen.tsx
│           ├── tabs/
│           │   ├── ChatTab/
│           │   │   ├── ChannelListPage.tsx
│           │   │   ├── ChatRoomPage.tsx
│           │   │   └── components/
│           │   │       ├── ChannelItem.tsx
│           │   │       ├── MessageBubble.tsx
│           │   │       ├── MessageInput.tsx
│           │   │       ├── ChatHeader.tsx
│           │   │       ├── TranslationButton.tsx
│           │   │       ├── TranslationResult.tsx
│           │   │       ├── MessageActionSheet.tsx
│           │   │       ├── QuickCreateForm.tsx
│           │   │       ├── ReplyPreview.tsx
│           │   │       ├── MemberSheet.tsx
│           │   │       ├── CreateChannelSheet.tsx
│           │   │       └── NewDmSheet.tsx
│           │   ├── WorkToolsTab/
│           │   │   └── WorkToolsPage.tsx
│           │   ├── WorkModulesTab/
│           │   │   └── WorkModulesPage.tsx
│           │   ├── SiteTab/
│           │   │   └── SitePage.tsx
│           │   └── MoreTab/
│           │       ├── MorePage.tsx
│           │       └── ProfileSection.tsx
│           ├── components/
│           │   ├── AuthGuard.tsx
│           │   ├── CardMenu.tsx
│           │   └── WebViewContainer.tsx
│           ├── hooks/
│           │   ├── useTalk.ts
│           │   ├── useTalkSSE.ts
│           │   ├── usePresence.ts
│           │   ├── useMenuPermissions.ts
│           │   └── useNetwork.ts
│           ├── stores/
│           │   ├── auth.store.ts
│           │   └── talk.store.ts
│           ├── services/
│           │   ├── api-client.ts
│           │   ├── auth.service.ts
│           │   ├── talk.service.ts
│           │   └── message-queue.service.ts
│           └── plugins/
│               ├── push.ts
│               └── biometrics.ts
├── packages/
│   ├── types/                        ← 모바일 타입 추가
│   └── common/                       ← 변경 없음
└── turbo.json                        ← 모바일 빌드 태스크 추가
```

---

## 5. 일정 요약

| Phase | 기간 | Step | 작업 | 일수 |
|-------|------|------|------|------|
| **Phase 1** | **6주** | 1.1 | Capacitor 셋업 + 앱 쉘 | 3일 |
| | | 1.2 | 모바일 인증 | 2일 |
| | | 1.3 | 채널/DM 목록 UI | 4일 |
| | | 1.4 | 대화 화면 (메시지 + SSE) | 7일 |
| | | 1.5 | 번역 캐시 테이블 + API | 3일 |
| | | 1.6 | 사용자 선택 번역 UI | 4일 |
| | | 1.7 | 푸시 알림 | 5일 |
| | | | **소계** | **28일** |
| **Phase 2** | **3주** | 2.1 | WebView 컨테이너 | 3일 |
| | | 2.2 | 업무도구 카드뷰 | 2일 |
| | | 2.3 | 업무모듈 카드뷰 | 2일 |
| | | 2.4 | 사이트 바로가기 | 1일 |
| | | 2.5 | 메시지→업무 변환 | 3일 |
| | | 2.6 | 웹 반응형 대응 | 4일 |
| | | | **소계** | **15일** |
| **Phase 3** | **3주** | 3.1 | 더보기 탭 | 3일 |
| | | 3.2 | 오프라인 큐 | 4일 |
| | | 3.3 | 생체인증 | 2일 |
| | | 3.4 | 앱스토어 배포 | 5일 |
| | | | **소계** | **14일** |
| | | | **총계** | **57일 (약 12주)** |

---

## 6. 기술 의사결정 사항

| 결정 항목 | 선택 | 근거 |
|-----------|------|------|
| 모바일 프레임워크 | Capacitor 6 | React 코드 재사용, 팀 기술 스택 일치 |
| 모바일 앱 위치 | `apps/mobile/` (별도 앱) | `apps/web/`에 Capacitor 통합 시 PC 웹 빌드에 영향 |
| 인증 토큰 저장 | `@capacitor/preferences` (Secure Storage) | 네이티브 키체인/키스토어, Cookie 대비 안전 |
| 웹뷰 인증 주입 | CapacitorCookies API | WebView에 Cookie 설정하여 기존 인증 로직 재사용 |
| 업무도구/모듈 접근 | 카드뷰 → 웹뷰 | 네이티브 UI 개발 불필요, 기존 웹 페이지 100% 재사용 |
| 번역 방식 | 사용자 선택 + 캐싱 | 자동 번역 대비 비용 통제, UX 제어권 |
| 번역 캐시 | `amb_talk_message_translations` 전용 테이블 | 기존 `amb_content_translations`와 분리, 메시지별 최적화 |
| 푸시 알림 | FCM (Android + iOS) | 단일 서비스로 양 플랫폼 지원 |
| 메뉴 권한 | 기존 API 100% 재사용 | `GET /settings/permissions/me` 동일 호출 |
| 반응형 대응 | CSS 보완만 (TailwindCSS) | 기존 컴포넌트 구조 무변경, 스타일만 추가 |
