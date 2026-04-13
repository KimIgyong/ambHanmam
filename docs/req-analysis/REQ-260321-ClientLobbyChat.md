# 요구사항 분석서: Client Portal Lobby Chat 접근

- **문서 ID**: REQ-ClientLobbyChat-20260321
- **작성일**: 2026-03-21
- **요청 경로**: `https://stg-ama.amoeba.site/client`
- **요약**: CLIENT_LEVEL 사용자에게 소속 Entity의 Amoeba Talk(Lobby Chat) 지정 채널 접근 허용

---

## 1. AS-IS 현황 분석

### 1.1 현재 시스템 구조

#### Amoeba Talk (Lobby Chat)
| 구분 | 내용 |
|------|------|
| **API 경로** | `/api/v1/talk/channels/*`, `/api/v1/talk/channels/:id/messages/*` |
| **프론트 경로** | `/amoeba-talk` |
| **인증** | `JwtAuthGuard` (USER_LEVEL + ADMIN_LEVEL 전용) |
| **접근 제어** | 채널 멤버십 기반 (`amb_talk_channel_members`) |
| **Entity 격리** | `ent_id` 필드로 법인별 격리 |
| **채널 유형** | `DIRECT` (1:1 DM), `GROUP` (그룹 채널) |
| **실시간** | SSE (Server-Sent Events) |

#### Client Portal
| 구분 | 내용 |
|------|------|
| **API 경로** | `/api/v1/client/*`, `/api/v1/client-auth/*` |
| **프론트 경로** | `/client/*` |
| **인증** | `ClientGuard` (CLIENT_LEVEL 전용) |
| **기능** | 프로젝트 조회, 이슈 생성/관리, 코멘트 |
| **실시간** | 없음 (REST 폴링) |

#### 인증 체계 분리
| 구분 | USER_LEVEL | CLIENT_LEVEL |
|------|-----------|-------------|
| **로그인** | `/api/v1/auth/login` (이메일+비밀번호) | `/api/v1/client-auth/login` (법인코드+이메일+비밀번호) |
| **JWT Guard** | `JwtAuthGuard` → `jwt` strategy | `JwtAuthGuard` → 동일한 `jwt` strategy |
| **UserPayload** | `level: 'USER_LEVEL'` / `'ADMIN_LEVEL'` | `level: 'CLIENT_LEVEL'`, `cliId`, `entityId`, `entityCode` |
| **프론트 Guard** | `AuthGuard` → `/login` 리다이렉트 | `ClientAuthGuard` → `/client/login` 리다이렉트 |
| **API Guard** | `RolesGuard` (ROLE_HIERARCHY 기반) | `ClientGuard` (`level === 'CLIENT_LEVEL'` 확인) |

### 1.2 Talk 채널 권한 구조 (현행)

```
사용자 → JwtAuthGuard (JWT 토큰 검증)
       → ChannelController (엔드포인트별 처리)
         → ChannelService.resolveEntityId(user) → entityId 결정
         → ChannelService.assertMember(channelId, userId) → 멤버십 확인
         → ChannelService.assertChannelInEntity(channelId, entId) → 법인 격리 확인
```

**핵심 포인트**:
- Talk API는 `JwtAuthGuard`만 사용 (별도 RolesGuard/ClientGuard 없음)
- 모든 권한은 **서비스 레벨의 멤버십 체크**로 처리
- `UserPayload`에 이미 `entityId` 필드 존재 (CLIENT_LEVEL 로그인 시 설정됨)

### 1.3 차단 지점 분석

| # | 차단 레이어 | 위치 | 원인 |
|---|-----------|------|------|
| 1 | **프론트 라우팅** | `/amoeba-talk` 경로 | `AuthGuard`가 CLIENT_LEVEL 거부 |
| 2 | **프론트 레이아웃** | `ClientLayout.tsx` | Talk 메뉴 항목 없음 |
| 3 | **백엔드 API** | `/api/v1/talk/*` | JwtAuthGuard는 통과 가능 (JWT 유효하면 OK) |
| 4 | **채널 멤버십** | `ChannelService.assertMember()` | CLIENT_LEVEL 사용자가 채널 멤버로 등록되지 않음 |
| 5 | **채널 목록** | `ChannelService.getMyChannels()` | 멤버십 없으면 빈 목록 반환 |

**결론**: 백엔드 API는 JWT만 유효하면 level 구분 없이 접근 가능하지만, **①프론트 라우팅 차단** + **④채널 멤버십 미등록**이 핵심 차단 요인

---

## 2. TO-BE 요구사항

### 2.1 핵심 요구사항

> CLIENT_LEVEL 사용자가 소속 Entity의 Amoeba Talk에서 **관리자가 지정한 특정 채널**에 접근하여 실시간 메시지 교환 가능

### 2.2 상세 요구사항

#### FR-1: 클라이언트 채널 지정 (Admin 기능)
| 항목 | 내용 |
|------|------|
| **설명** | MANAGER 이상 역할의 내부 사용자가 특정 Talk 채널을 "클라이언트 공개" 채널로 지정 |
| **방법** | 채널 설정에서 "클라이언트 접근 허용" 토글 또는 클라이언트 사용자를 직접 채널 멤버로 초대 |
| **제약** | DIRECT(DM) 채널은 클라이언트 공개 불가, GROUP 채널만 가능 |

#### FR-2: 클라이언트 Talk 접근 (Client Portal)
| 항목 | 내용 |
|------|------|
| **설명** | Client Portal (`/client`) 내에서 지정된 채널 목록 확인 및 대화 참여 |
| **UI** | Client Portal 사이드바에 "채팅" 메뉴 추가 → 채널 목록 + 메시지 화면 |
| **기능** | 메시지 보기/쓰기, 파일 첨부, 번역 기능 (기존 Talk 기능 재사용) |

#### FR-3: 실시간 메시지 (SSE)
| 항목 | 내용 |
|------|------|
| **설명** | 클라이언트 사용자도 기존 SSE 스트림을 통한 실시간 메시지 수신 |
| **제약** | 멤버로 등록된 채널의 SSE만 수신 가능 |

#### FR-4: 클라이언트 권한 제한
| 항목 | 내용 |
|------|------|
| **설명** | 클라이언트 사용자는 제한된 Talk 기능만 사용 가능 |
| **허용** | 메시지 읽기/쓰기, 파일 첨부, 번역, 리액션, 읽음 표시 |
| **금지** | 채널 생성, 채널 삭제, 멤버 초대/제거, 채널 설정 변경, DM 생성 |

### 2.3 비기능 요구사항

| 구분 | 내용 |
|------|------|
| **보안** | 클라이언트는 멤버로 등록된 채널만 접근 (기존 메커니즘 활용) |
| **격리** | Entity 격리 유지 — 다른 Entity 채널 접근 불가 |
| **성능** | 기존 SSE 인프라 재사용, 추가 부하 최소화 |
| **호환** | 기존 내부 사용자 Talk 기능에 영향 없음 |

---

## 3. 갭 분석

### 3.1 백엔드 갭

| # | 영역 | 현황 | 필요 변경 | 난이도 |
|---|------|------|----------|-------|
| G1 | **Talk API 인증** | JwtAuthGuard만 사용 → CLIENT_LEVEL JWT도 통과 | **변경 불필요** (이미 호환) | - |
| G2 | **채널 멤버 추가** | 내부 사용자만 대상으로 설계 | 클라이언트 사용자도 멤버 추가 허용하는 API 또는 기능 필요 | 중 |
| G3 | **Entity 격리** | `resolveEntityId(user)` → `user.entityId \|\| user.companyId` | CLIENT_LEVEL의 `entityId`가 이미 JWT에 포함됨 → **변경 불필요** | - |
| G4 | **멤버십 체크** | `assertMember(channelId, userId)` | **변경 불필요** (userId 기반, level 무관) | - |
| G5 | **채널 생성 제한** | 모든 인증 사용자 가능 | 클라이언트 사용자의 채널 생성/삭제/멤버 관리 차단 필요 | 중 |
| G6 | **멤버 목록 조회** | Entity 내 USER_LEVEL만 반환 | 클라이언트 사용자도 멤버 목록에 표시되어야 함 (역할 구분) | 하 |
| G7 | **온라인 상태** | 내부 사용자만 추적 | 클라이언트 heartbeat도 동일 처리 가능 (변경 불필요) | - |

### 3.2 프론트엔드 갭

| # | 영역 | 현황 | 필요 변경 | 난이도 |
|---|------|------|----------|-------|
| G8 | **Client Portal 라우팅** | `/client/chat` 경로 없음 | 새 라우트 추가 | 하 |
| G9 | **Client Portal 사이드바** | Talk 메뉴 없음 | "채팅" 메뉴 항목 추가 | 하 |
| G10 | **채팅 UI 컴포넌트** | 기존 Amoeba Talk 컴포넌트 존재 | Client Portal용 래퍼 컴포넌트 (Read-only 헤더, 채널 생성 숨김 등) | 중 |
| G11 | **API 서비스** | `talk.service.ts` → main app 인증 토큰 사용 | Client Portal에서 같은 JWT 토큰으로 Talk API 호출 가능 여부 확인 필요 | 중 |
| G12 | **SSE 연결** | 기존 AmoebaTalkPage에서만 연결 | Client Portal 채팅 페이지에서도 SSE 연결 | 하 |

### 3.3 관리 기능 갭

| # | 영역 | 현황 | 필요 변경 | 난이도 |
|---|------|------|----------|-------|
| G13 | **채널 멤버 초대 UI** | 내부 사용자 목록만 표시 | 클라이언트 사용자도 초대 가능하도록 목록 확장 | 중 |
| G14 | **멤버 역할 표시** | OWNER / MEMBER만 | CLIENT 역할 표시 (또는 뱃지) 추가 고려 | 하 |

---

## 4. 구현 접근 방식 비교

### 방식 A: 기존 멤버십 메커니즘 활용 (최소 변경)

```
관리자가 채널 멤버 초대 시 → CLIENT_LEVEL 사용자를 직접 멤버로 추가
→ 기존 assertMember() 통과
→ 기존 getMyChannels() 에서 자동 노출
```

**장점**: 백엔드 변경 최소화, 기존 권한 체계 그대로 활용
**단점**: 관리자가 클라이언트 사용자를 수동 초대해야 함

### 방식 B: 채널에 "클라이언트 공개" 플래그

```
채널에 chn_client_visible = true 플래그 추가
→ 해당 Entity의 CLIENT_LEVEL 사용자가 자동으로 목록에 표시
→ 첫 접근 시 자동 멤버 등록 또는 읽기 전용 접근
```

**장점**: 관리 편의성 높음, 자동화
**단점**: 스키마 변경, 추가 로직 필요

### 권장: 방식 A (기존 멤버십 활용)

- 기존 `addMember()` API로 클라이언트 사용자를 채널에 초대
- 백엔드 Talk API 자체는 변경 최소 (level 체크 없이 멤버십만 검증)
- 프론트엔드에서 클라이언트 권한 제한 (채널 생성/삭제 UI 숨김)
- 관리자 측 InviteMemberModal에서 클라이언트 사용자 검색/초대 기능 추가

---

## 5. 사용자 플로우

### 5.1 관리자: 클라이언트를 채널에 초대

```
1. 관리자 → Amoeba Talk → 채널 선택
2. 채널 헤더 → 멤버 관리 → "멤버 초대" 클릭
3. 초대 모달에서 "클라이언트" 탭 선택 → 고객사 사용자 검색
4. 클라이언트 사용자 선택 → 초대 완료
5. 시스템 → amb_talk_channel_members에 클라이언트 userId 추가 (role: 'MEMBER')
```

### 5.2 클라이언트: 채팅 접근

```
1. 클라이언트 사용자 → Client Portal 로그인 (/client/login)
2. 사이드바 → "채팅" 메뉴 클릭 → /client/chat
3. 채널 목록 표시 (멤버로 등록된 채널만)
4. 채널 선택 → 메시지 히스토리 표시 + SSE 연결
5. 메시지 입력 → 전송 → 실시간 반영
```

### 5.3 시퀀스 다이어그램

```
Client User              Client Portal           Talk API            Database
    │                         │                      │                   │
    ├─── /client/chat ───────>│                      │                   │
    │                         ├── GET /talk/channels ─>│                  │
    │                         │   (JWT: CLIENT_LEVEL) │                  │
    │                         │                      ├── assertMember ──>│
    │                         │                      │<── channel list ──│
    │                         │<─── 채널 목록 ────────│                   │
    │<── 채널 목록 표시 ────────│                      │                   │
    │                         │                      │                   │
    ├─── 채널 선택 ───────────>│                      │                   │
    │                         ├── GET /talk/:id/messages ──>│            │
    │                         ├── GET /talk/:id/sse  ──────>│            │
    │                         │<── SSE stream ──────────────│            │
    │<── 메시지 표시 ──────────│                      │                   │
    │                         │                      │                   │
    ├─── 메시지 전송 ─────────>│                      │                   │
    │                         ├── POST /talk/:id/messages ─>│            │
    │                         │                      ├── assertMember ──>│
    │                         │                      ├── save message ──>│
    │                         │<── SSE: message:new ────────│            │
    │<── 실시간 메시지 ────────│                      │                   │
```

---

## 6. 기술 제약사항

### 6.1 인증 토큰 호환성
- CLIENT_LEVEL 로그인 시 생성되는 JWT 토큰이 Talk API의 `JwtAuthGuard`를 통과하는지 확인 필요
- **확인 결과**: `JwtAuthGuard`는 `jwt` strategy만 검증, level 체크 안 함 → **호환**
- `UserPayload.entityId`가 CLIENT_LEVEL JWT에 포함됨 → `resolveEntityId()` 호환

### 6.2 Cookie 기반 인증 (Client Portal)
- Client Portal은 `httpOnly` 쿠키 기반 인증 사용
- Talk API도 동일 도메인이므로 쿠키 자동 전송 → **호환**

### 6.3 SSE 연결
- SSE 엔드포인트 `/talk/channels/:id/sse`는 JWT 인증만 필요
- 동일 JWT 토큰으로 SSE 연결 가능

### 6.4 파일 업로드
- Talk 파일 업로드는 Google Cloud Storage 사용
- CLIENT_LEVEL에서도 동일 업로드 경로 사용 가능

### 6.5 클라이언트 권한 제한 (서비스 레벨)
- 채널 생성: `createChannel()` → CLIENT_LEVEL 차단 필요
- 채널 삭제: `deleteChannel()` → Owner 체크 + CLIENT_LEVEL 차단
- 멤버 초대/제거: `addMember()`, `removeMember()` → CLIENT_LEVEL 차단 필요
- DM 생성: `findOrCreateDm()` → CLIENT_LEVEL 차단 필요

---

## 7. 영향 범위 요약

| 영역 | 변경 사항 | 영향도 |
|------|----------|-------|
| **Backend Talk API** | 채널 생성/삭제/멤버 관리에 CLIENT_LEVEL 제한 추가 | 낮음 |
| **Backend Talk API** | 멤버 초대 시 클라이언트 사용자 허용 | 낮음 |
| **Backend Talk API** | 멤버 목록 조회에서 클라이언트 사용자 포함 | 낮음 |
| **Frontend Client Portal** | 채팅 라우트 + 페이지 + 사이드바 메뉴 추가 | 중간 |
| **Frontend Client Portal** | Talk 컴포넌트 재사용 (권한 제한 적용) | 중간 |
| **Frontend Amoeba Talk** | InviteMemberModal에 클라이언트 사용자 검색 추가 | 낮음 |
| **Database** | 스키마 변경 없음 (기존 멤버십 테이블 활용) | 없음 |
| **i18n** | Client Portal 채팅 관련 번역 키 추가 | 낮음 |

---

## 8. 리스크 및 고려사항

| # | 리스크 | 대응 방안 |
|---|--------|----------|
| R1 | 클라이언트가 내부 대화 내용에 접근 | 관리자가 명시적으로 멤버 초대해야만 접근 가능 (기본 차단) |
| R2 | 클라이언트 과다 메시지 | 필요 시 클라이언트별 메시지 전송 빈도 제한 추가 |
| R3 | SSE 연결 수 증가 | 현재 SSE 구조가 스케일러블한지 모니터링 필요 |
| R4 | 기존 내부 사용자 Talk 영향 | 방식 A(기존 멤버십 활용)로 기존 코드 변경 최소화 |
| R5 | 클라이언트 사용자가 내부 사용자 목록 열람 | 채널 멤버 목록에서만 남의 정보 노출 (이름 정도) |

---

## 9. 결론

**구현 가능성**: 높음 — 기존 Talk 인프라와 멤버십 체계를 거의 그대로 활용 가능

**핵심 작업**:
1. **Backend**: Talk API에 CLIENT_LEVEL 사용자의 채널 생성/삭제/멤버 관리 차단 로직 추가
2. **Frontend (Client Portal)**: `/client/chat` 라우트 + 채팅 페이지 추가 (Talk 컴포넌트 재사용)
3. **Frontend (Amoeba Talk)**: InviteMemberModal에서 클라이언트 사용자 초대 지원
4. **i18n**: 클라이언트 채팅 UI 번역 키 추가

**DB 스키마 변경**: 없음 (기존 `amb_talk_channel_members` 테이블 그대로 활용)
