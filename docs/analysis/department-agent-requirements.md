---
document_id: DEPT-AGENT-REQ-1.0.0
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

# Department AI Agent System — Requirements Analysis (부서별 AI 에이전트 시스템 요구사항 분석서)

## 1. Project Overview (프로젝트 개요)

- **Project**: AMB Management — Department AI Agent System (부서별 AI 에이전트 시스템)
- **Version**: 1.0.0
- **Date**: 2026-02-14
- **Background and Purpose (배경 및 목적)**: Amoeba Company requires an intelligent assistant system that provides specialized AI agents for each of its 9 departments (Management, Accounting, HR, Legal, Sales, IT, Marketing, General Affairs, Planning). Each agent has deep domain expertise and supports real-time streaming conversation via SSE (Server-Sent Events). The system aims to enhance productivity by providing instant, contextual business advice. (아메바 회사의 9개 부서별 전문 업무 지원을 위한 AI 에이전트 시스템. 각 에이전트는 부서 고유의 전문 지식을 갖추고 SSE 기반 실시간 스트리밍 대화를 지원하여 업무 생산성을 향상시킨다.)
- **Expected Benefits (기대 효과)**:
  - Instant expert-level business advice for all 9 departments (9개 부서 전문가 수준의 즉시 업무 자문)
  - Reduced dependency on external consulting (외부 컨설팅 의존도 감소)
  - Standardized business process guidance (표준화된 업무 프로세스 가이드)
  - Real-time streaming responses for natural conversation experience (실시간 스트리밍으로 자연스러운 대화 경험)

## 2. Stakeholders (이해관계자)

| Role | Person/Team | Responsibility |
|------|-------------|----------------|
| Product Owner | AMB Management Team | Requirements approval, priority decisions (요구사항 승인, 우선순위 결정) |
| Development Lead | AMB Dev Team | Technical architecture, implementation (기술 아키텍처, 구현) |
| End Users | All department employees | System usage, feedback (시스템 사용, 피드백) |
| AI Provider | Anthropic | Claude API service (Claude API 서비스 제공) |

## 3. Requirements (요구사항 목록)

### Functional Requirements (기능 요구사항)

| ID | Requirement | Priority | Note |
|----|-------------|----------|------|
| FR-001 | User authentication with JWT (JWT 기반 사용자 인증) | P0 | Login, register, token refresh |
| FR-002 | 9 department-specific AI agents (9개 부서별 전문 AI 에이전트) | P0 | Management, Accounting, HR, Legal, Sales, IT, Marketing, General Affairs, Planning |
| FR-003 | SSE-based real-time streaming responses (SSE 기반 실시간 스트리밍 응답) | P0 | Server-Sent Events for streaming AI responses |
| FR-004 | Conversation management — create, list, detail, delete (대화 관리 — 생성, 목록, 상세, 삭제) | P0 | CRUD with soft delete |
| FR-005 | Message history with ordering (메시지 이력 관리 및 순서 보장) | P0 | Messages stored with order index |
| FR-006 | Department agent selection on dashboard (대시보드에서 부서 에이전트 선택) | P1 | 9-department grid layout |
| FR-007 | Conversation list per department (부서별 대화 이력 목록) | P1 | Left sidebar with conversation history |
| FR-008 | Markdown rendering in messages (메시지 마크다운 렌더링) | P1 | AI responses support markdown |
| FR-009 | Agent information listing API (에이전트 정보 목록 API) | P1 | Department metadata, specialties |
| FR-010 | Pagination for conversation list (대화 목록 페이지네이션) | P2 | Configurable page size |

### Non-Functional Requirements (비기능 요구사항)

| ID | Requirement | Criteria |
|----|-------------|----------|
| NFR-001 | SSE streaming latency | First token < 2s (첫 토큰 2초 이내) |
| NFR-002 | API response time | < 200ms for CRUD operations (CRUD 작업 200ms 이내) |
| NFR-003 | Security | bcrypt password hashing, JWT with 15min access / 7d refresh (비밀번호 bcrypt, JWT 15분/7일) |
| NFR-004 | Rate limiting | Auth: 5 req/min, General: 60 req/min (인증: 5회/분, 일반: 60회/분) |
| NFR-005 | Responsive UI | Desktop and mobile support (데스크탑/모바일 대응) |
| NFR-006 | Soft delete | Data preservation via soft delete pattern (소프트 삭제로 데이터 보존) |

## 4. Scope Definition (범위 정의)

- **In-Scope (범위 내)**:
  - JWT-based authentication (login, register, token refresh)
  - 9 department AI agents with specialized system prompts
  - SSE streaming conversation
  - Conversation CRUD with message history
  - Dashboard with department grid
  - Chat UI with markdown rendering
  - Mock mode for development without API key

- **Out-of-Scope (범위 외)**:
  - Multi-tenant support (멀티테넌트)
  - File upload in conversations (파일 업로드)
  - Agent-to-agent communication (에이전트 간 통신)
  - Admin dashboard / user management (관리자 대시보드)
  - Push notifications (푸시 알림)
  - Mobile native app (모바일 네이티브 앱)

- **MVP vs Full (MVP 대 전체)**:
  - MVP: Authentication + 9 agents + SSE streaming + conversation management + basic UI
  - Future: File attachments, admin panel, analytics, multi-language

## 5. Constraints and Assumptions (제약사항 및 가정)

### Constraints (제약사항)
- Claude API rate limits and token limits apply (Claude API 속도/토큰 제한 적용)
- SSE requires persistent HTTP connection (SSE는 지속적 HTTP 연결 필요)
- PostgreSQL single instance (PostgreSQL 단일 인스턴스)

### Assumptions (가정)
- Users have Anthropic Claude API key (사용자가 Anthropic API 키 보유)
- Docker available for local development (로컬 개발용 Docker 사용 가능)
- Node.js 20+ environment (Node.js 20+ 환경)
- Modern browser with SSE support (SSE 지원 최신 브라우저)

## 6. Related Systems (연관 시스템)

| System | Relationship | Note |
|--------|-------------|------|
| Anthropic Claude API | External AI service | Primary AI inference provider (주요 AI 추론 제공자) |
| PostgreSQL | Database | User, conversation, message storage (사용자, 대화, 메시지 저장) |
| Docker | Infrastructure | Local development environment (로컬 개발 환경) |

## 7. Success Metrics (성공 지표)

| KPI | Measurement | Target |
|-----|-------------|--------|
| Agent response quality | User satisfaction score (사용자 만족도) | > 4.0/5.0 |
| Streaming latency | Time to first token (첫 토큰 시간) | < 2 seconds |
| System availability | Uptime (가동률) | > 99% |
| API response time | p95 latency for CRUD (CRUD p95 지연) | < 200ms |
| Department coverage | Number of specialized agents (전문 에이전트 수) | 9/9 departments |
