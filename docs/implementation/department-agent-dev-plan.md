---
document_id: DEPT-AGENT-DEVPLAN-1.0.0
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

# Department AI Agent — Development Plan (부서별 AI 에이전트 개발계획서)

## 1. Overview (개요)

- **Project**: AMB Management — Department AI Agent System (부서별 AI 에이전트 시스템)
- **Development period**: 2026-02-10 ~ 2026-02-14 (5 days)
- **Team members**: AMB Development Team
- **Scope**: Full-stack implementation of 9-department AI agent system with SSE streaming
- **Reference documents**:
  - Requirements Analysis: `docs/analysis/department-agent-requirements.md`
  - Functional Specification: `docs/design/department-agent-func-definition.md`
  - ERD: `docs/design/department-agent-erd.md`
  - UI Specification: `docs/design/department-agent-ui-spec.md`

## 2. Technical Architecture (기술 아키텍처)

### System Architecture (시스템 아키텍처)

```
┌───────────────────────────────────────────────────────────────┐
│                     Client (Browser)                           │
│  React 18 + TypeScript + TailwindCSS + Zustand + React Query  │
│  Port: 5179 (Vite dev server)                                 │
├───────────────────────────────────────────────────────────────┤
│                       ↕ HTTP / SSE                             │
├───────────────────────────────────────────────────────────────┤
│                   NestJS 10 Backend                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Presentation: Controllers, DTOs, Guards, Interceptors  │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  Application: Services, Mappers, AgentFactory           │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  Domain: Entities, BaseAgentService, 9 Agent Services   │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  Infrastructure: TypeORM, ClaudeService (Anthropic SDK) │  │
│  └─────────────────────────────────────────────────────────┘  │
│  Port: 3009                                                    │
├───────────────────────────────────────────────────────────────┤
│                   PostgreSQL 15                                │
│  Database: db_amb | Port: 5432 (Docker)                       │
│  Tables: amb_users, amb_conversations, amb_messages            │
└───────────────────────────────────────────────────────────────┘
```

### Tech Stack (기술 스택)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 18.2 |
| Frontend language | TypeScript | 5.x |
| Styling | TailwindCSS | 3.4 |
| Build tool | Vite | 5.x |
| State management | Zustand (global), React Query (server) | 4.x, 5.x |
| Routing | React Router | 6.x |
| Icons | Lucide React | latest |
| Markdown | react-markdown | latest |
| Backend framework | NestJS | 10.x |
| ORM | TypeORM | 0.3.x |
| Database | PostgreSQL | 15.x |
| Authentication | Passport + JWT | latest |
| AI SDK | @anthropic-ai/sdk | latest |
| Monorepo | npm workspaces + Turborepo | 2.x |
| Container | Docker Compose | latest |

### New Libraries Introduced (신규 라이브러리)

| Library | Purpose |
|---------|---------|
| @anthropic-ai/sdk | Claude API integration (Claude API 연동) |
| @nestjs/throttler | Rate limiting (요청 제한) |
| helmet | Security headers (보안 헤더) |
| bcrypt | Password hashing (비밀번호 해싱) |
| react-markdown | Markdown rendering in chat (채팅 마크다운 렌더링) |

## 3. Development Environment (개발 환경)

### Environment Configuration (환경 설정)

| Environment | API URL | DB | Note |
|-------------|---------|-----|------|
| Development | http://localhost:3009 | Docker PostgreSQL (5432) | Mock mode available |
| Staging | TBD | TBD | Future |
| Production | TBD | TBD | Future |

### Branch Strategy (브랜치 전략)

```
main        — Production-ready code (운영 코드)
develop     — Integration branch (통합 브랜치)
feature/*   — Feature branches (기능 브랜치)
fix/*       — Bug fix branches (버그 수정 브랜치)
docs/*      — Documentation branches (문서 브랜치)
```

### Development Commands (개발 명령어)

```bash
npm install              # Install all dependencies (전체 의존성 설치)
npm run db:up            # Start PostgreSQL via Docker (PostgreSQL Docker 실행)
npm run dev              # Start API + Web concurrently (API + Web 동시 실행)
npm run dev:api          # Start API only (API만 실행)
npm run dev:web          # Start Web only (Web만 실행)
npm run build            # Build all packages (전체 빌드)
npm run lint             # Run ESLint (린트 검사)
npm run db:down          # Stop PostgreSQL (PostgreSQL 중지)
```

## 4. Schedule Summary (개발 일정)

| Phase | Duration | Deliverable | Status |
|-------|----------|-------------|--------|
| Phase 1: Project initialization (프로젝트 초기화) | Day 1 | Monorepo, Docker, configs | Complete |
| Phase 2: Backend foundation (백엔드 기반) | Day 1-2 | Auth, global modules, Claude service | Complete |
| Phase 3: Agent + Chat modules (에이전트 + 대화) | Day 2-3 | 9 agents, chat with SSE | Complete |
| Phase 4: Frontend (프론트엔드) | Day 3-4 | Auth, Dashboard, Chat UI | Complete |
| Phase 5: Integration & Polish (통합 및 마무리) | Day 4-5 | SSE integration, responsive UI, docs | Complete |

## 5. Risk Management (리스크 관리)

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Claude API rate limits (API 속도 제한) | High | Mock mode for development, error handling in SSE |
| SSE connection drops (SSE 연결 끊김) | Medium | Frontend reconnection logic, error events |
| Long conversation context (긴 대화 컨텍스트) | Medium | Monitor token usage, future: context truncation |
| PostgreSQL single point of failure (DB 단일 장애점) | Low | Docker volume persistence, future: managed DB |

## 6. Communication Plan (커뮤니케이션)

- **Code review**: All PRs require at least 1 reviewer approval
- **Documentation**: SDLC documents maintained in `docs/` directory
- **API documentation**: Swagger UI at `/api-docs`
- **Issue tracking**: GitHub Issues with labels and milestones
