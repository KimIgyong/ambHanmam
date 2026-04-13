---
document_id: DEPT-AGENT-REQDEF-1.0.0
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

# Department AI Agent — Requirements Definition (부서별 AI 에이전트 요구사항 정의서)

## FR-001: User Authentication (사용자 인증)

- **Description (설명)**: JWT-based authentication system supporting login, registration, and token refresh. Passwords are hashed with bcrypt (12 rounds). Access tokens expire in 15 minutes, refresh tokens in 7 days. (JWT 기반 인증 시스템. bcrypt 해싱, 액세스 토큰 15분, 리프레시 토큰 7일)
- **Input (입력)**: Email (VARCHAR 200, unique), password (VARCHAR 200, min 8 chars), name (VARCHAR 50)
- **Output (출력)**: JWT access token, refresh token, user profile info
- **Business Rules (비즈니스 룰)**:
  - Email must be unique across all users
  - Password must be minimum 8 characters
  - Rate limit: login 5 req/min, register 3 req/min
  - Soft delete for user accounts (usr_deleted_at)
- **Acceptance Criteria (인수 조건)**:
  - [x] Login with valid credentials returns JWT tokens
  - [x] Invalid credentials return E1001 error
  - [x] Token refresh with valid refresh token succeeds
  - [x] Expired access token triggers auto-refresh
- **Priority (우선순위)**: P0
- **Related Requirements (연관 요구사항)**: NFR-003, NFR-004

## FR-002: 9 Department AI Agents (9개 부서별 전문 AI 에이전트)

- **Description (설명)**: Nine specialized AI agents, each with unique system prompts containing domain expertise. Implemented using Strategy Pattern (BaseAgentService abstract class) + Factory Pattern (AgentFactoryService). (전략 패턴 + 팩토리 패턴으로 구현된 9개 부서별 전문 에이전트)
- **Input (입력)**: Department code (DepartmentCode enum), conversation messages
- **Output (출력)**: AI-generated response with department-specific expertise
- **Business Rules (비즈니스 룰)**:
  - Each agent has a unique system prompt (50-70 lines each)
  - Valid department codes: MANAGEMENT, ACCOUNTING, HR, LEGAL, SALES, IT, MARKETING, GENERAL_AFFAIRS, PLANNING
  - Invalid department code returns E4001 error
  - AgentFactoryService maps department code to agent instance
- **Acceptance Criteria (인수 조건)**:
  - [x] All 9 department agents respond with domain-specific knowledge
  - [x] GET /api/v1/agents returns all 9 agent info
  - [x] GET /api/v1/agents/:department returns specific agent info
  - [x] Invalid department returns 404 with E4001 error code
- **Priority (우선순위)**: P0
- **Related Requirements (연관 요구사항)**: FR-003, FR-004

## FR-003: SSE Streaming Responses (SSE 기반 실시간 스트리밍 응답)

- **Description (설명)**: AI responses are delivered via Server-Sent Events (SSE) for real-time streaming. The POST endpoint returns Content-Type: text/event-stream with chunked response data. (SSE를 통한 실시간 AI 응답 스트리밍)
- **Input (입력)**: Message content (string), conversation ID (UUID)
- **Output (출력)**: SSE stream with events: {content, done} for each chunk, {content, done, fullContent} at completion
- **Business Rules (비즈니스 룰)**:
  - SSE headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
  - Each chunk: `data: {"content":"...", "done":false}\n\n`
  - Final event: `data: {"content":"", "done":true, "fullContent":"..."}\n\n`
  - Error event: `data: {"error":"...", "done":true}\n\n`
  - Mock mode available when CLAUDE_API_KEY is not set
- **Acceptance Criteria (인수 조건)**:
  - [x] SSE stream delivers tokens in real-time
  - [x] Frontend displays streaming content progressively
  - [x] Errors are properly communicated via SSE error events
  - [x] Mock mode works without API key
- **Priority (우선순위)**: P0
- **Related Requirements (연관 요구사항)**: FR-002, FR-004

## FR-004: Conversation Management (대화 관리)

- **Description (설명)**: Full CRUD operations for conversations. Each conversation belongs to a user and a department. Messages are stored with ordering. Soft delete pattern is used. (대화 CRUD. 각 대화는 사용자와 부서에 속함. 메시지 순서 관리. 소프트 삭제)
- **Input (입력)**: department_code (string), title (optional string), content (string for messages)
- **Output (출력)**: Conversation with messages, pagination metadata
- **Business Rules (비즈니스 룰)**:
  - Conversations are scoped to authenticated user (userId from JWT)
  - Message order tracked via msg_order column
  - Token count tracked per message (msg_token_count)
  - Conversation message count maintained (cvs_message_count)
  - Pagination: configurable page/size, default page=1, size=20
  - Delete sets cvs_deleted_at (soft delete)
- **Acceptance Criteria (인수 조건)**:
  - [x] Create conversation with department code
  - [x] List conversations with pagination and department filter
  - [x] Get conversation detail with all messages
  - [x] Delete conversation (soft delete, HTTP 204)
  - [x] Messages stored in correct order
- **Priority (우선순위)**: P0
- **Related Requirements (연관 요구사항)**: FR-002, FR-003, FR-005

## FR-005: Message History (메시지 이력 관리)

- **Description (설명)**: All messages are persisted with role (user/assistant), content, token count, and order. Messages are loaded with conversation detail. (모든 메시지를 역할, 내용, 토큰수, 순서와 함께 저장)
- **Input (입력)**: Conversation ID, message content
- **Output (출력)**: Ordered message list with metadata
- **Business Rules (비즈니스 룰)**:
  - msg_role: 'user' or 'assistant'
  - msg_order: auto-incremented per conversation
  - Previous messages sent as context to Claude API
- **Acceptance Criteria (인수 조건)**:
  - [x] Messages persist across sessions
  - [x] Message order is maintained
  - [x] Previous context sent to AI for continuity
- **Priority (우선순위)**: P0
- **Related Requirements (연관 요구사항)**: FR-003, FR-004

## FR-006: Department Dashboard (부서 대시보드)

- **Description (설명)**: Landing page displaying all 9 department agents as cards in a grid layout. Each card shows department name, description, and specialties. (9개 부서 에이전트를 카드 그리드로 표시하는 대시보드)
- **Input (입력)**: GET /api/v1/agents
- **Output (출력)**: 3x3 grid of department cards
- **Acceptance Criteria (인수 조건)**:
  - [x] All 9 departments displayed as cards
  - [x] Click navigates to department chat page
  - [x] Responsive grid layout
- **Priority (우선순위)**: P1

## FR-007: Conversation Sidebar (대화 이력 사이드바)

- **Description (설명)**: Left sidebar showing conversation history for the selected department. Part of SubMenuLayout (Basic-A-2-L layout pattern). (선택된 부서의 대화 이력을 보여주는 좌측 사이드바)
- **Acceptance Criteria (인수 조건)**:
  - [x] Conversations listed per department
  - [x] Click loads conversation messages
  - [x] New conversation button
- **Priority (우선순위)**: P1

## FR-008: Markdown Message Rendering (마크다운 메시지 렌더링)

- **Description (설명)**: AI assistant messages rendered with markdown support using react-markdown. Supports headers, lists, code blocks, bold, italic. (react-markdown으로 AI 응답 마크다운 렌더링)
- **Acceptance Criteria (인수 조건)**:
  - [x] Code blocks with syntax highlighting
  - [x] Headings, lists, tables rendered correctly
  - [x] User messages displayed as plain text
- **Priority (우선순위)**: P1
