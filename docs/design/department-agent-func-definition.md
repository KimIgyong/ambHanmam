---
document_id: DEPT-AGENT-FUNC-1.0.0
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

# Department AI Agent — Functional Specification (부서별 AI 에이전트 기능 정의서)

## Module: Authentication (인증 모듈)

### Function 1: Login (로그인)

- **Function ID**: FN-001
- **Description (설명)**: Authenticate user with email/password, return JWT tokens (이메일/비밀번호로 인증, JWT 토큰 반환)
- **Precondition (선행 조건)**: User account exists and is not soft-deleted
- **Postcondition (후행 조건)**: Access token (15min) and refresh token (7d) issued
- **Processing Logic (처리 로직)**:
  1. Validate email format and password minimum length
  2. Find user by email (where usr_deleted_at IS NULL)
  3. Compare bcrypt hash of password
  4. Generate JWT access token (15min expiry) and refresh token (7d expiry)
  5. Return tokens with user profile (id, email, name, department, role)
- **Input Parameters (입력 파라미터)**: `{ email: string, password: string }`
- **Output (출력)**: `{ accessToken: string, refreshToken: string, user: UserInfo }`
- **Error Handling (에러 처리)**:
  - E1001: Invalid email or password (이메일 또는 비밀번호 불일치)
  - E1003: Account deactivated (비활성화된 계정)
- **Related Requirement (연관 요구사항)**: FR-001

### Function 2: Register (회원가입)

- **Function ID**: FN-002
- **Description (설명)**: Create new user account with email, password, name, department (새 사용자 계정 생성)
- **Precondition (선행 조건)**: Email not already registered
- **Postcondition (후행 조건)**: New user record created, JWT tokens returned
- **Processing Logic (처리 로직)**:
  1. Validate input fields (email format, password min 8, name required)
  2. Check email uniqueness
  3. Hash password with bcrypt (12 rounds)
  4. Create user record with UUID
  5. Generate JWT tokens
  6. Return tokens with user profile
- **Input Parameters (입력 파라미터)**: `{ email: string, password: string, name: string, department?: string }`
- **Output (출력)**: `{ accessToken: string, refreshToken: string, user: UserInfo }`
- **Error Handling (에러 처리)**:
  - E1002: Email already exists (이미 등록된 이메일)
- **Related Requirement (연관 요구사항)**: FR-001

### Function 3: Refresh Token (토큰 갱신)

- **Function ID**: FN-003
- **Description (설명)**: Issue new access token using valid refresh token (유효한 리프레시 토큰으로 새 액세스 토큰 발급)
- **Processing Logic (처리 로직)**:
  1. Verify refresh token signature and expiry
  2. Extract user ID from token payload
  3. Find user by ID (ensure not deleted)
  4. Generate new access token
  5. Return new access token
- **Input Parameters (입력 파라미터)**: `{ refresh_token: string }`
- **Output (출력)**: `{ accessToken: string }`
- **Error Handling (에러 처리)**:
  - E1004: Invalid or expired refresh token (유효하지 않거나 만료된 리프레시 토큰)
- **Related Requirement (연관 요구사항)**: FR-001

## Module: Agent (에이전트 모듈)

### Function 4: Get All Agents (전체 에이전트 목록 조회)

- **Function ID**: FN-004
- **Description (설명)**: Return information for all 9 department agents including code, name, description, specialties (9개 부서 에이전트 정보 반환)
- **Processing Logic (처리 로직)**:
  1. Return all entries from AGENT_INFO_MAP constant
- **Output (출력)**: `AgentInfo[]` — Array of 9 agent objects
- **Related Requirement (연관 요구사항)**: FR-002, FR-009

### Function 5: Get Agent by Department (부서별 에이전트 조회)

- **Function ID**: FN-005
- **Description (설명)**: Return specific department agent info by department code (부서 코드로 에이전트 정보 조회)
- **Processing Logic (처리 로직)**:
  1. Validate department code against DepartmentCode enum
  2. Look up AGENT_INFO_MAP[code]
  3. Return agent info
- **Input Parameters (입력 파라미터)**: `department: string` (URL parameter)
- **Error Handling (에러 처리)**:
  - E4001: Invalid department code (유효하지 않은 부서 코드)
- **Related Requirement (연관 요구사항)**: FR-002

### Function 6: Agent Chat (에이전트 대화 — 동기)

- **Function ID**: FN-006
- **Description (설명)**: Send messages to department-specific agent and get full response (부서 에이전트에 메시지 전송, 전체 응답 수신)
- **Processing Logic (처리 로직)**:
  1. BaseAgentService.chat() calls ClaudeService.sendMessage()
  2. System prompt from department-specific prompt file
  3. Messages array sent as conversation context
  4. Return full response string
- **Related Requirement (연관 요구사항)**: FR-002

### Function 7: Agent Chat Stream (에이전트 스트리밍 대화)

- **Function ID**: FN-007
- **Description (설명)**: Stream AI responses in real-time via SSE using RxJS Observable (RxJS Observable로 SSE 실시간 스트리밍)
- **Processing Logic (처리 로직)**:
  1. BaseAgentService.chatStream() calls ClaudeService.streamMessage()
  2. ClaudeService creates Anthropic stream with system prompt and messages
  3. Stream events mapped to SSE format via RxJS pipe
  4. Content chunks: {content, done:false}
  5. Completion: {content:'', done:true, fullContent}
  6. Error: {error, done:true}
- **Related Requirement (연관 요구사항)**: FR-002, FR-003

## Module: Chat (대화 모듈)

### Function 8: Create Conversation (대화 생성)

- **Function ID**: FN-008
- **Description (설명)**: Create new conversation for authenticated user in specified department (인증된 사용자로 지정 부서에 새 대화 생성)
- **Processing Logic (처리 로직)**:
  1. Extract userId from JWT
  2. Validate department code
  3. Create amb_conversations record with UUID, department, initial title
  4. Return conversation response DTO
- **Input Parameters (입력 파라미터)**: `{ department_code: string, title?: string }`
- **Related Requirement (연관 요구사항)**: FR-004

### Function 9: Get Conversations (대화 목록 조회)

- **Function ID**: FN-009
- **Description (설명)**: List user's conversations with pagination, optional department filter (사용자 대화 목록, 페이지네이션, 부서 필터)
- **Processing Logic (처리 로직)**:
  1. Query amb_conversations WHERE usr_id = :userId AND cvs_deleted_at IS NULL
  2. Optional: filter by cvs_department
  3. Order by cvs_updated_at DESC
  4. Apply pagination (page, size)
  5. Return data with pagination metadata
- **Input Parameters (입력 파라미터)**: `page?: number, size?: number, department?: string`
- **Related Requirement (연관 요구사항)**: FR-004, FR-007, FR-010

### Function 10: Send Message with SSE (메시지 전송 — SSE 스트리밍)

- **Function ID**: FN-010
- **Description (설명)**: Core function — save user message, invoke agent, stream response via SSE, save assistant message (핵심 기능 — 사용자 메시지 저장, 에이전트 호출, SSE 스트리밍 응답, 어시스턴트 메시지 저장)
- **Processing Logic (처리 로직)**:
  1. Verify conversation belongs to user
  2. Save user message (msg_role='user', msg_order=N)
  3. Load conversation history (previous messages)
  4. Get department agent via AgentFactoryService
  5. Call agent.chatStream(messages)
  6. Set SSE response headers
  7. Pipe RxJS Observable to HTTP response
  8. On stream completion, save assistant message (msg_role='assistant', msg_order=N+1)
  9. Update cvs_message_count
- **Input Parameters (입력 파라미터)**: `id: string` (URL), `{ content: string }` (body)
- **Related Requirement (연관 요구사항)**: FR-003, FR-004, FR-005

### Function 11: Delete Conversation (대화 삭제)

- **Function ID**: FN-011
- **Description (설명)**: Soft delete conversation by setting cvs_deleted_at (대화 소프트 삭제)
- **Processing Logic (처리 로직)**:
  1. Verify conversation belongs to user
  2. Set cvs_deleted_at = NOW()
  3. Return HTTP 204 No Content
- **Error Handling (에러 처리)**:
  - E3001: Conversation not found (대화를 찾을 수 없음)
  - E3002: Unauthorized access to conversation (권한 없는 대화 접근)
- **Related Requirement (연관 요구사항)**: FR-004
