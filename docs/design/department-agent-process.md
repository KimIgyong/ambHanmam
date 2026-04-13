---
document_id: DEPT-AGENT-PRC-1.0.0
version: 1.0.0
status: Approved
created: 2026-02-14
updated: 2026-02-14
author: AMB Team
reviewers: []
change_log:
  - version: 1.0.0
    date: 2026-02-14
    author: AMB Team
    description: Initial draft
---

# Department AI Agent — Process Definition (부서별 AI 에이전트 프로세스 정의서)

## Process 1: User Authentication Flow (사용자 인증 흐름)

- **Process ID**: PRC-001
- **Purpose (목적)**: Authenticate users and manage JWT session lifecycle (사용자 인증 및 JWT 세션 생명주기 관리)
- **Start Condition (시작 조건)**: User accesses the application (사용자가 앱에 접속)
- **End Condition (종료 조건)**: User is authenticated with valid tokens (유효한 토큰으로 인증 완료)

### Processing Steps (처리 단계)

| Step | Actor | Action | Input | Output | Branch |
|------|-------|--------|-------|--------|--------|
| 1 | User | Access application (앱 접속) | URL | Login page | If token exists → Step 5 |
| 2 | User | Enter credentials (인증 정보 입력) | email, password | Form data | |
| 3 | System | Validate and authenticate (검증 및 인증) | email, password | JWT tokens | Fail → Error display |
| 4 | System | Store tokens (토큰 저장) | tokens | localStorage | |
| 5 | System | Verify token validity (토큰 유효성 확인) | access token | User payload | Expired → Step 6 |
| 6 | System | Refresh token (토큰 갱신) | refresh token | New access token | Fail → Step 1 |
| 7 | System | Grant access (접근 허용) | valid token | Dashboard | |

### Exception Handling (예외 처리)

| Exception | Step | Resolution |
|-----------|------|------------|
| Invalid credentials (잘못된 인증 정보) | 3 | Display E1001 error, allow retry |
| Expired refresh token (리프레시 토큰 만료) | 6 | Redirect to login page, clear tokens |
| Rate limit exceeded (요청 제한 초과) | 3 | Display cooldown message |

## Process 2: AI Agent Conversation Flow (AI 에이전트 대화 흐름)

- **Process ID**: PRC-002
- **Purpose (목적)**: Enable department-specific AI conversation with SSE streaming (부서별 AI 대화 및 SSE 스트리밍)
- **Start Condition (시작 조건)**: Authenticated user selects department (인증된 사용자가 부서 선택)
- **End Condition (종료 조건)**: AI response fully streamed and saved (AI 응답 스트리밍 완료 및 저장)

### Processing Steps (처리 단계)

| Step | Actor | Action | Input | Output | Branch |
|------|-------|--------|-------|--------|--------|
| 1 | User | Select department from dashboard (대시보드에서 부서 선택) | Click | Department page | |
| 2 | User | Create or select conversation (대화 생성/선택) | department code | Conversation ID | Existing → Step 4 |
| 3 | System | Create conversation record (대화 레코드 생성) | dept, userId | New conversation | |
| 4 | User | Type and send message (메시지 입력 및 전송) | text content | | |
| 5 | System | Save user message (사용자 메시지 저장) | content, order | DB record | |
| 6 | System | Load conversation context (대화 컨텍스트 로드) | conversation ID | Message history | |
| 7 | System | Resolve department agent (부서 에이전트 결정) | dept code | Agent instance | Invalid → Error |
| 8 | System | Stream AI response via SSE (SSE로 AI 응답 스트리밍) | system prompt, messages | Token stream | Error → Error event |
| 9 | Frontend | Display tokens in real-time (토큰 실시간 표시) | SSE events | UI update | |
| 10 | System | Save assistant message (어시스턴트 메시지 저장) | fullContent | DB record | |
| 11 | System | Update conversation metadata (대화 메타데이터 업데이트) | message count | Updated record | |

### Exception Handling (예외 처리)

| Exception | Step | Resolution |
|-----------|------|------------|
| Invalid department code (유효하지 않은 부서 코드) | 7 | Return E4001 error, redirect to dashboard |
| Claude API error (Claude API 오류) | 8 | SSE error event, display in chat UI |
| Network disconnection during SSE (SSE 중 네트워크 단절) | 9 | Auto-reconnect attempt, show error toast |
| Mock mode (API key not configured) | 8 | Return mock streaming response |

## Process 3: Conversation Management Flow (대화 관리 흐름)

- **Process ID**: PRC-003
- **Purpose (목적)**: Manage conversation lifecycle including list, detail, delete (대화 생명주기 관리)
- **Start Condition (시작 조건)**: User navigates to department chat page (사용자가 부서 채팅 페이지 접속)
- **End Condition (종료 조건)**: Conversation action completed (대화 관련 액션 완료)

### Processing Steps (처리 단계)

| Step | Actor | Action | Input | Output | Branch |
|------|-------|--------|-------|--------|--------|
| 1 | System | Load conversation list (대화 목록 로드) | userId, dept | Paginated list | Empty → Empty state |
| 2 | User | Select conversation (대화 선택) | conversation ID | | New → PRC-002 Step 3 |
| 3 | System | Load messages (메시지 로드) | conversation ID | Message list | |
| 4 | User | Continue conversation or delete (대화 계속/삭제) | | | Continue → PRC-002 Step 4 |
| 5 | System | Soft delete conversation (대화 소프트 삭제) | conversation ID | 204 No Content | |
| 6 | System | Refresh sidebar list (사이드바 새로고침) | | Updated list | |
