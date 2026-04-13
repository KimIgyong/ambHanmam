---
document_id: DEPT-AGENT-EVT-1.0.0
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

# Department AI Agent — Event Scenario (부서별 AI 에이전트 이벤트 시나리오)

## Scenario 1: User Login (사용자 로그인)

| Order | Actor | Event | System Response | Note |
|-------|-------|-------|-----------------|------|
| 1 | User | Enter email and password (이메일, 비밀번호 입력) | Validate input format | |
| 2 | User | Click login button (로그인 버튼 클릭) | POST /api/v1/auth/login | |
| 3 | System | Verify credentials | Return JWT access + refresh token | Rate limit: 5/min |
| 4 | System | Store tokens | Save to localStorage | |
| 5 | System | Redirect to dashboard | Navigate to / | |

### Exception Scenarios (예외 시나리오)

| Condition | System Response |
|-----------|-----------------|
| Invalid credentials (잘못된 인증 정보) | Display error: "이메일 또는 비밀번호가 일치하지 않습니다" (E1001) |
| Rate limit exceeded (요청 제한 초과) | Display error: "Too many attempts. Please try again later." |
| Access token expired (액세스 토큰 만료) | Auto-refresh using refresh token, retry request |

## Scenario 2: Select Department Agent (부서 에이전트 선택)

| Order | Actor | Event | System Response | Note |
|-------|-------|-------|-----------------|------|
| 1 | User | View dashboard (대시보드 진입) | GET /api/v1/agents — Display 9 department cards | Grid layout |
| 2 | User | Click department card (부서 카드 클릭) | Navigate to /chat/:department | |
| 3 | System | Load conversation list | GET /api/v1/conversations?department=:code | Left sidebar |
| 4 | System | Display empty state or last conversation | Show chat area | |

## Scenario 3: Create New Conversation (새 대화 생성)

| Order | Actor | Event | System Response | Note |
|-------|-------|-------|-----------------|------|
| 1 | User | Click "New Conversation" (새 대화 버튼 클릭) | POST /api/v1/conversations | department_code required |
| 2 | System | Create conversation record | Return conversation with ID | |
| 3 | System | Navigate to conversation | Display empty message area | |
| 4 | User | Type message and press Enter (메시지 입력 후 엔터) | POST /api/v1/conversations/:id/messages | |
| 5 | System | Stream AI response via SSE | Display tokens in real-time | |

## Scenario 4: Chat with AI Agent via SSE Streaming (AI 에이전트와 SSE 스트리밍 대화)

| Order | Actor | Event | System Response | Note |
|-------|-------|-------|-----------------|------|
| 1 | User | Type message in input field (메시지 입력) | Shift+Enter for line break | |
| 2 | User | Press Enter to send (엔터로 전송) | POST /api/v1/conversations/:id/messages | Content-Type: text/event-stream |
| 3 | System | Save user message to DB | msg_role = 'user', msg_order = N | |
| 4 | System | Invoke Claude API with system prompt | Use department-specific prompt | |
| 5 | System | Stream response chunks | SSE: data: {"content":"...", "done":false} | Real-time tokens |
| 6 | System | Complete streaming | SSE: data: {"content":"", "done":true, "fullContent":"..."} | |
| 7 | System | Save assistant message to DB | msg_role = 'assistant', msg_order = N+1 | |
| 8 | Frontend | Render complete message | Markdown rendering with react-markdown | |

### Exception Scenarios (예외 시나리오)

| Condition | System Response |
|-----------|-----------------|
| Claude API error (Claude API 오류) | SSE: data: {"error":"...", "done":true} — Display error in chat |
| Network disconnection (네트워크 단절) | Retry connection, show error toast |
| Mock mode (API key not set) | Return mock streaming response with setup instructions |

## Scenario 5: Delete Conversation (대화 삭제)

| Order | Actor | Event | System Response | Note |
|-------|-------|-------|-----------------|------|
| 1 | User | Click delete button on conversation (대화 삭제 버튼 클릭) | Show confirmation dialog | |
| 2 | User | Confirm deletion (삭제 확인) | DELETE /api/v1/conversations/:id | |
| 3 | System | Soft delete conversation | Set cvs_deleted_at timestamp | HTTP 204 |
| 4 | System | Refresh conversation list | Remove from sidebar | |
