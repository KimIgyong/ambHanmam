---
document_id: DEPT-AGENT-SEQ-1.0.0
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

# Department AI Agent — Sequence Diagram (부서별 AI 에이전트 시퀀스 다이어그램)

## Scenario 1: User Login (사용자 로그인)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Backend as NestJS Backend
    participant DB as PostgreSQL

    User->>Frontend: Enter email & password (이메일/비밀번호 입력)
    Frontend->>Backend: POST /api/v1/auth/login {email, password}
    Backend->>Backend: Validate input (DTO validation)
    Backend->>DB: SELECT * FROM amb_users WHERE usr_email = ?
    DB-->>Backend: User record
    Backend->>Backend: Compare bcrypt hash
    alt Credentials valid (인증 성공)
        Backend->>Backend: Generate JWT access + refresh tokens
        Backend-->>Frontend: 200 {accessToken, refreshToken, user}
        Frontend->>Frontend: Store tokens in localStorage
        Frontend-->>User: Redirect to Dashboard (대시보드로 이동)
    else Credentials invalid (인증 실패)
        Backend-->>Frontend: 401 {error: E1001}
        Frontend-->>User: Display error message (에러 메시지 표시)
    end
```

## Scenario 2: Department Agent Selection (부서 에이전트 선택)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Backend as NestJS Backend

    User->>Frontend: Navigate to Dashboard (대시보드 접속)
    Frontend->>Backend: GET /api/v1/agents
    Backend-->>Frontend: 200 AgentInfo[9]
    Frontend-->>User: Display 9 department cards (9개 부서 카드 표시)
    User->>Frontend: Click department card (부서 카드 클릭)
    Frontend->>Backend: GET /api/v1/conversations?department=SALES
    Backend-->>Frontend: 200 {data: Conversation[], pagination}
    Frontend-->>User: Navigate to /chat/SALES with conversation list (채팅 페이지 이동)
```

## Scenario 3: SSE Streaming Chat (SSE 스트리밍 대화) — Core Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant ChatCtrl as ChatController
    participant ChatSvc as ChatService
    participant AgentFactory as AgentFactoryService
    participant Agent as SalesAgentService
    participant Claude as ClaudeService
    participant API as Anthropic API
    participant DB as PostgreSQL

    User->>Frontend: Type message & press Enter (메시지 입력 후 엔터)
    Frontend->>ChatCtrl: POST /api/v1/conversations/:id/messages {content}

    ChatCtrl->>ChatSvc: sendMessage(id, content, userId)
    ChatSvc->>DB: Verify conversation ownership
    ChatSvc->>DB: INSERT amb_messages (role='user', order=N)
    ChatSvc->>DB: SELECT previous messages for context
    ChatSvc->>AgentFactory: getAgent(department)
    AgentFactory-->>ChatSvc: SalesAgentService instance

    ChatSvc->>Agent: chatStream(messages)
    Agent->>Claude: streamMessage(systemPrompt, messages)
    Claude->>API: messages.stream({model, system, messages})

    ChatCtrl->>Frontend: Set SSE headers (text/event-stream)

    loop Token streaming (토큰 스트리밍)
        API-->>Claude: text chunk
        Claude-->>Agent: {type:'content', content:'...'}
        Agent-->>ChatCtrl: SSE event via Observable
        ChatCtrl-->>Frontend: data: {"content":"...", "done":false}
        Frontend-->>User: Append token to message (토큰 실시간 표시)
    end

    API-->>Claude: stream end
    Claude-->>Agent: {type:'done'}
    Agent-->>ChatCtrl: SSE done event
    ChatCtrl-->>Frontend: data: {"content":"", "done":true, "fullContent":"..."}

    ChatSvc->>DB: INSERT amb_messages (role='assistant', order=N+1)
    ChatSvc->>DB: UPDATE amb_conversations SET cvs_message_count += 2

    Frontend-->>User: Render complete markdown message (마크다운 렌더링)
```

## Scenario 4: Token Refresh (토큰 갱신)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant AxiosInterceptor as Axios Interceptor
    participant Backend as NestJS Backend
    participant DB as PostgreSQL

    User->>Frontend: Any API request (API 요청)
    Frontend->>Backend: GET /api/v1/conversations (expired token)
    Backend-->>Frontend: 401 Unauthorized
    AxiosInterceptor->>AxiosInterceptor: Detect 401, check refresh token
    AxiosInterceptor->>Backend: POST /api/v1/auth/refresh {refresh_token}
    Backend->>Backend: Verify refresh token
    Backend->>DB: Find user by ID
    Backend-->>AxiosInterceptor: 200 {accessToken}
    AxiosInterceptor->>AxiosInterceptor: Update stored token
    AxiosInterceptor->>Backend: Retry original request with new token
    Backend-->>Frontend: 200 {data}
    Frontend-->>User: Display data (데이터 표시)
```

## Scenario 5: Create New Conversation (새 대화 생성)

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Frontend
    participant Backend as NestJS Backend
    participant DB as PostgreSQL

    User->>Frontend: Click "New Conversation" (새 대화 클릭)
    Frontend->>Backend: POST /api/v1/conversations {department_code: "SALES"}
    Backend->>DB: INSERT amb_conversations (cvs_id=UUID, usr_id, cvs_department='SALES')
    DB-->>Backend: New conversation record
    Backend-->>Frontend: 200 {conversationId, department, title, ...}
    Frontend->>Frontend: Add to conversation list sidebar
    Frontend-->>User: Show empty chat area ready for input (빈 채팅 영역 표시)
```
