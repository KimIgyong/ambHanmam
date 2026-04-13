# 작업 계획서: Client Portal Lobby Chat 접근

- **문서 ID**: PLAN-ClientLobbyChat-작업계획-20260321
- **요구사항 분석서**: `docs/analysis/REQ-ClientLobbyChat-20260321.md`
- **작성일**: 2026-03-21

---

## 1. 시스템 개발 현황 분석

### 1.1 Talk API 인증 호환성 검증 결과

| 항목 | USER_LEVEL | CLIENT_LEVEL | 호환성 |
|------|-----------|-------------|--------|
| JWT 서명 검증 | ✅ `jwt` strategy | ✅ 동일 strategy | **호환** |
| `JwtAuthGuard` 통과 | ✅ | ✅ | **호환** |
| Talk Controller 접근 | ✅ | ✅ (level 미검사) | **호환** |
| `UserPayload.userId` | ✅ | ✅ | **호환** |
| `UserPayload.entityId` | ✅ (JWT에 포함) | ❌ **JWT에 미포함** | ⚠️ 수정 필요 |
| `UserPayload.companyId` | ✅ (`usrCompanyId`) | ❌ (`null`) | ⚠️ 수정 필요 |

**핵심 이슈**: CLIENT_LEVEL JWT 토큰에 `entityId`가 포함되지 않아 `resolveEntityId(user)`가 빈 문자열 반환 → Entity 격리 미작동

### 1.2 기존 코드 재사용 가능 영역

| 영역 | 내용 | 재사용 수준 |
|------|------|-----------|
| Talk API 전체 | 채널/메시지/SSE/번역/리액션 | 그대로 사용 (권한 제한만 추가) |
| Talk 프론트 컴포넌트 | ChannelList, MessageList, MessageInput 등 17개 | 래퍼 컴포넌트로 감싸서 사용 |
| Talk Store | `talk.store.ts` (Zustand) | 그대로 사용 |
| Talk Service | `talk.service.ts` (API 클라이언트) | 그대로 사용 |
| 멤버십 체계 | `amb_talk_channel_members` | 그대로 사용 |

---

## 2. 단계별 구현 계획

### Phase 1: 백엔드 — JWT Entity 격리 수정 + 권한 제한

#### 1-1. CLIENT_LEVEL JWT에 `entityId` 포함
**파일**: `apps/api/src/domain/client-portal/service/client-auth.service.ts`

**변경 내용**:
- `generateTokens()` 메서드에서 JWT payload에 `entityId` 추가
- 고객사(`SvcClientEntity`)의 `cliEntId` → JWT `entityId`로 매핑

**Before**:
```typescript
const payload: JwtPayload = {
  // ...
  companyId: null,
  // entityId 없음
};
```

**After**:
```typescript
const payload: JwtPayload = {
  // ...
  companyId: null,
  entityId: user.client?.cliEntId || undefined,  // 고객사 소속 법인
};
```

#### 1-2. Talk API CLIENT_LEVEL 권한 제한
**파일**: `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts`

**변경 내용**: CLIENT_LEVEL 사용자가 호출하면 안 되는 엔드포인트에 가드 추가
- `POST /talk/channels` (채널 생성) → CLIENT_LEVEL 차단
- `DELETE /talk/channels/:id` (채널 삭제) → CLIENT_LEVEL 차단
- `PATCH /talk/channels/:id` (채널 수정) → CLIENT_LEVEL 차단
- `POST /talk/channels/:id/members` (멤버 초대) → CLIENT_LEVEL 차단
- `DELETE /talk/channels/:id/members/:userId` (멤버 제거) → CLIENT_LEVEL 차단
- `POST /talk/channels/dm` (DM 생성) → CLIENT_LEVEL 차단

**방법**: 컨트롤러 메서드 상단에 level 체크 추가
```typescript
if (user.level === 'CLIENT_LEVEL') {
  throw new ForbiddenException('Client users cannot create channels');
}
```

#### 1-3. 멤버 초대 시 클라이언트 사용자 조회 API
**파일**: `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts`, `channel.service.ts`

**변경 내용**: 기존 `getEntityMembers()` 확장 또는 별도 엔드포인트
- `GET /talk/channels/client-members?entityId=xxx` → 해당 법인의 CLIENT_LEVEL 사용자 목록 반환
- 쿼리: `amb_users WHERE usr_level = 'CLIENT_LEVEL'` + 고객사 → Entity 연결

---

### Phase 2: 프론트엔드 — Client Portal 채팅 페이지

#### 2-1. 라우트 추가
**파일**: `apps/web/src/router/index.tsx`

**변경 내용**: `/client` 하위에 채팅 라우트 추가
```typescript
{ path: 'chat', element: <ClientChatPage /> },
{ path: 'chat/:channelId', element: <ClientChatPage /> },
```

#### 2-2. Client Portal 사이드바 메뉴 추가
**파일**: `apps/web/src/domain/client-portal/layout/ClientLayout.tsx`

**변경 내용**: NAV_ITEMS에 채팅 메뉴 추가
```typescript
{ label: 'chat', icon: MessageCircle, path: '/client/chat' },
```

#### 2-3. ClientChatPage 컴포넌트 생성
**파일**: `apps/web/src/domain/client-portal/pages/ClientChatPage.tsx` (신규)

**설계**:
- 기존 `AmoebaTalkPage.tsx` 구조를 재사용
- 채널 생성 버튼, DM 버튼, 멤버 초대 모달 등 관리 기능 숨김
- `ChannelList` → 읽기 전용 (삭제/수정 컨텍스트 메뉴 숨김)
- `TalkMessageList` + `TalkMessageInput` → 그대로 사용
- `ChannelHeader` → 멤버 패널은 보이되 초대/제거 기능 숨김

**구현 방식**: 기존 Talk 컴포넌트에 `isClientMode` 또는 `readOnlyAdmin` prop 전달
```typescript
<ChannelList channels={channels} isLoading={isLoading} isClientMode={true} />
<ChannelHeader isClientMode={true} />
```

#### 2-4. Talk 컴포넌트 isClientMode 대응
**수정 파일**:
- `ChannelList.tsx` — 채널 생성 버튼 숨김, DM 버튼 숨김
- `ChannelHeader.tsx` — 채널 수정/삭제 버튼 숨김  
- `MemberPanel.tsx` — 초대/제거 버튼 숨김
- `TalkMessageInput.tsx` — 변경 없음 (메시지 전송 허용)

#### 2-5. Talk API 서비스 Client Portal 연동
**고려사항**:
- `talk.service.ts`는 main app의 axios 인스턴스 사용 (Bearer 토큰)
- Client Portal은 httpOnly 쿠키 인증 사용
- **같은 도메인** (`stg-ama.amoeba.site`)이므로 쿠키 자동 전송
- Talk API의 `JwtAuthGuard`는 `Authorization` 헤더 또는 쿠키의 `access_token` 모두 지원 필요

**확인 사항**: JWT strategy가 쿠키에서도 토큰을 추출하는지 확인
- 추출한다면: `talk.service.ts` 그대로 사용 가능
- 추출 안 한다면: Client Portal 전용 API 서비스 필요 (쿠키 기반 axios)

---

### Phase 3: 관리자 측 — 클라이언트 사용자 초대 기능

#### 3-1. InviteMemberModal 확장
**파일**: `apps/web/src/domain/amoeba-talk/components/InviteMemberModal.tsx`

**변경 내용**:
- 탭 UI 추가: "내부 직원" | "클라이언트"
- "클라이언트" 탭: Phase 1-3 API로 클라이언트 사용자 목록 조회
- 클라이언트 사용자에 뱃지 표시 (역할 구분)

#### 3-2. Talk Service에 클라이언트 멤버 조회 API 추가
**파일**: `apps/web/src/domain/amoeba-talk/service/talk.service.ts`

```typescript
getClientMembers(entityId?: string): Promise<TalkEntityMember[]>
```

---

### Phase 4: i18n + 마무리

#### 4-1. 번역 키 추가
**파일**: `apps/web/src/locales/{ko,en,vi}/client.json` 또는 신규 네임스페이스

**추가 키**: 채팅 메뉴 라벨, 빈 채널 안내 등

#### 4-2. SSE 연결 교차 검증

Client Portal 채팅에서 SSE 스트림 연결 테스트:
- `/api/v1/talk/channels/:id/sse` 요청 시 쿠키/토큰 전달 확인
- 실시간 메시지 수신 확인

---

## 3. 파일 변경 목록 (예상)

### 신규 파일
| 파일 | 설명 |
|------|------|
| `apps/web/src/domain/client-portal/pages/ClientChatPage.tsx` | Client Portal 채팅 페이지 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `apps/api/src/domain/client-portal/service/client-auth.service.ts` | JWT에 entityId 추가 |
| `apps/api/src/domain/amoeba-talk/controller/channel.controller.ts` | CLIENT_LEVEL 권한 제한 |
| `apps/api/src/domain/amoeba-talk/service/channel.service.ts` | 클라이언트 사용자 조회 메서드 추가 |
| `apps/web/src/router/index.tsx` | `/client/chat` 라우트 추가 |
| `apps/web/src/domain/client-portal/layout/ClientLayout.tsx` | 채팅 메뉴 추가 |
| `apps/web/src/domain/amoeba-talk/components/ChannelList.tsx` | `isClientMode` prop 대응 |
| `apps/web/src/domain/amoeba-talk/components/ChannelHeader.tsx` | `isClientMode` prop 대응 |
| `apps/web/src/domain/amoeba-talk/components/MemberPanel.tsx` | `isClientMode` prop 대응 |
| `apps/web/src/domain/amoeba-talk/components/InviteMemberModal.tsx` | 클라이언트 사용자 탭 추가 |
| `apps/web/src/domain/amoeba-talk/service/talk.service.ts` | 클라이언트 멤버 조회 API 추가 |
| `apps/web/src/locales/{ko,en,vi}/*.json` | 채팅 관련 번역 키 |

---

## 4. 사이드 임팩트 분석

### 4.1 기존 Amoeba Talk 영향도

| 영향 항목 | 영향도 | 설명 |
|----------|-------|------|
| Talk 컴포넌트 `isClientMode` prop 추가 | **낮음** | 기본값 `false` → 기존 동작에 영향 없음 |
| InviteMemberModal 탭 추가 | **낮음** | 기존 "내부 직원" 탭이 기본 → 동작 변경 없음 |
| Channel Controller 권한 가드 | **없음** | CLIENT_LEVEL만 차단, USER_LEVEL 영향 없음 |

### 4.2 Client Portal 영향도

| 영향 항목 | 영향도 | 설명 |
|----------|-------|------|
| JWT payload 변경 | **중간** | `entityId` 추가 → 기존 토큰 무효화 (재로그인 필요) |
| 라우트 추가 | **낮음** | 새 경로만 추가, 기존 경로 변경 없음 |
| 사이드바 메뉴 추가 | **낮음** | 기존 메뉴 하단에 추가 |

### 4.3 보안 영향

| 항목 | 위험도 | 대응 |
|------|-------|------|
| 클라이언트가 타 Entity 채널 접근 | 낮음 | 멤버십 + Entity 격리로 이중 차단 |
| 클라이언트 채널 관리 기능 접근 | 낮음 | 백엔드 + 프론트 이중 차단 |
| SSE를 통한 타 채널 엿보기 | 없음 | SSE도 멤버십 검증 |

---

## 5. 구현 순서 및 의존 관계

```
Phase 1 (백엔드) ──────────────────────────────────────────
  │
  ├── 1-1. JWT entityId 추가 ━━━━━━┓
  │                                ┃
  ├── 1-2. CLIENT_LEVEL 권한 제한 ━━╋━━ Phase 2 (프론트엔드) ──────
  │                                ┃   │
  └── 1-3. 클라이언트 멤버 조회 API ━┛   ├── 2-1. 라우트 추가
                                       ├── 2-2. 사이드바 메뉴
                                       ├── 2-3. ClientChatPage 생성
                                       ├── 2-4. 컴포넌트 isClientMode
                                       └── 2-5. API 서비스 연동
                                              │
                                              ▼
                                    Phase 3 (관리자) ──────
                                       ├── 3-1. InviteMemberModal
                                       └── 3-2. 클라이언트 멤버 API
                                              │
                                              ▼
                                    Phase 4 (i18n + 테스트) ──
                                       ├── 4-1. 번역 키
                                       └── 4-2. SSE 교차 검증
```

**Phase 1은 Phase 2의 선행 조건** (JWT entityId 없으면 Entity 격리 불가)
**Phase 3은 Phase 2와 병행 가능** (서로 독립적)

---

## 6. DB 스키마 변경

**없음** — 기존 `amb_talk_channel_members` 테이블의 멤버십 메커니즘을 그대로 활용

---

## 7. 테스트 시나리오 (요약)

| # | 시나리오 | 검증 포인트 |
|---|---------|-----------|
| T1 | 클라이언트 로그인 후 채팅 메뉴 접근 | `/client/chat` 정상 노출 |
| T2 | 멤버 등록된 채널만 목록 표시 | 미등록 채널 미노출 |
| T3 | 메시지 전송/수신 | 실시간 SSE 동작 |
| T4 | 채널 생성/삭제 시도 → 403 | 권한 차단 확인 |
| T5 | 관리자가 클라이언트를 채널에 초대 | 멤버 추가 성공 |
| T6 | 타 Entity 채널 접근 시도 → 차단 | Entity 격리 확인 |
| T7 | 파일 업로드 | 정상 첨부 |
| T8 | 번역 기능 | 메시지 번역 동작 |
