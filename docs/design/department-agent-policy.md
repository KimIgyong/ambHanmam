---
document_id: DEPT-AGENT-POL-1.0.0
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

# Department AI Agent — Policy Definition (부서별 AI 에이전트 정책 정의서)

## Policy 1: Authentication Policy (인증 정책)

- **Policy ID**: POL-001
- **Purpose (목적)**: Secure user authentication and session management (안전한 사용자 인증 및 세션 관리)
- **Scope (적용 범위)**: All API endpoints except public routes (/auth/login, /auth/register, /auth/refresh)
- **Rules (규칙)**:
  - Rule 1: Password hashing → bcrypt with 12 salt rounds
  - Rule 2: Access token expiry → 15 minutes (JWT)
  - Rule 3: Refresh token expiry → 7 days (JWT)
  - Rule 4: All non-public endpoints require valid JWT in Authorization header
  - Rule 5: JwtAuthGuard applied globally via APP_GUARD
- **Exception (예외)**: Routes decorated with @Public() bypass authentication

## Policy 2: Rate Limiting Policy (요청 제한 정책)

- **Policy ID**: POL-002
- **Purpose (목적)**: Prevent abuse and ensure fair resource usage (남용 방지, 공정한 리소스 사용)
- **Scope (적용 범위)**: All API endpoints
- **Rules (규칙)**:
  - Rule 1: Login endpoint → 5 requests per 60 seconds per IP
  - Rule 2: Register endpoint → 3 requests per 60 seconds per IP
  - Rule 3: General endpoints → 60 requests per 60 seconds per IP (via ThrottlerModule)
- **Exception (예외)**: SSE streaming connections are long-lived and exempt from general rate limiting

## Policy 3: Data Retention Policy (데이터 보존 정책)

- **Policy ID**: POL-003
- **Purpose (목적)**: Data lifecycle management (데이터 생명주기 관리)
- **Scope (적용 범위)**: All database records
- **Rules (규칙)**:
  - Rule 1: Soft delete pattern → Set `*_deleted_at` timestamp instead of physical deletion
  - Rule 2: Soft-deleted records excluded from all queries by default
  - Rule 3: Conversation messages retained even after conversation soft-delete
  - Rule 4: No automatic data purge in v1.0 (physical deletion requires manual DB operation)

## Policy 4: AI Agent Policy (AI 에이전트 정책)

- **Policy ID**: POL-004
- **Purpose (목적)**: Consistent AI agent behavior and response quality (일관된 AI 에이전트 동작 및 응답 품질)
- **Scope (적용 범위)**: All 9 department agents
- **Rules (규칙)**:
  - Rule 1: Each agent uses department-specific system prompt → maintained in `/prompt/{dept}.prompt.ts`
  - Rule 2: Claude model → `claude-sonnet-4-5-20250514` (consistent across all agents)
  - Rule 3: Max tokens per response → 4096
  - Rule 4: Full conversation history sent as context (no truncation in v1.0)
  - Rule 5: Mock mode → When CLAUDE_API_KEY is not set, return mock responses with setup instructions
- **Exception (예외)**: Future versions may implement context window management for long conversations

## Policy 5: Security Headers Policy (보안 헤더 정책)

- **Policy ID**: POL-005
- **Purpose (목적)**: HTTP security hardening (HTTP 보안 강화)
- **Scope (적용 범위)**: All HTTP responses
- **Rules (규칙)**:
  - Rule 1: Helmet middleware applied → X-Frame-Options, X-Content-Type-Options, etc.
  - Rule 2: CORS → Allow only configured frontend origin (localhost:5179 in dev)
  - Rule 3: SSE endpoints → Additional headers: X-Accel-Buffering: no

## Common Policies (공통 정책)

- **Data preservation (데이터 보존 기간)**: Indefinite (soft delete only, no automatic purge)
- **Authorization (권한 정책)**:
  - USER role: Access own conversations and messages only
  - ADMIN role: Reserved for future admin features
- **Rate Limiting (제한 기준)**: See POL-002 above
