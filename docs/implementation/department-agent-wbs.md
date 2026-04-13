---
document_id: DEPT-AGENT-WBS-1.0.0
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

# Department AI Agent — WBS (Work Breakdown Structure)

## Task List (태스크 목록)

| ID | Task | Assignee | Depends On | Effort | Status |
|----|------|----------|------------|--------|--------|
| T-001 | Setup monorepo with npm workspaces and Turborepo (모노레포 초기화) | AMB Team | - | 0.5d | Done |
| T-002 | Configure Docker Compose for PostgreSQL + Adminer (Docker 설정) | AMB Team | - | 0.5d | Done |
| T-003 | Create shared packages — types and common (공유 패키지 생성) | AMB Team | T-001 | 0.5d | Done |
| T-004 | Setup root config files — ESLint, Prettier, tsconfig, .gitignore, .nvmrc (루트 설정 파일) | AMB Team | T-001 | 0.5d | Done |
| T-005 | Initialize NestJS backend with app.module and main.ts (NestJS 백엔드 초기화) | AMB Team | T-001 | 0.5d | Done |
| T-006 | Implement global modules — filters, interceptors, decorators, constants (전역 모듈 구현) | AMB Team | T-005 | 1d | Done |
| T-007 | Implement ClaudeService — Anthropic SDK wrapper with mock mode (Claude 서비스 구현) | AMB Team | T-005 | 1d | Done |
| T-008 | Implement AuthModule — entity, service, controller, DTOs, JWT guard/strategy (인증 모듈 구현) | AMB Team | T-006 | 1d | Done |
| T-009 | Implement BaseAgentService abstract class (BaseAgent 추상 클래스 구현) | AMB Team | T-007 | 0.5d | Done |
| T-010 | Implement 9 department agent services with system prompts (9개 부서 에이전트 서비스 구현) | AMB Team | T-009 | 1d | Done |
| T-011 | Implement AgentFactoryService and AgentController (에이전트 팩토리 및 컨트롤러 구현) | AMB Team | T-010 | 0.5d | Done |
| T-012 | Implement ChatModule — entities, service, controller with SSE streaming (채팅 모듈 구현) | AMB Team | T-009, T-008 | 1.5d | Done |
| T-013 | Initialize React frontend with Vite + TailwindCSS (React 프론트엔드 초기화) | AMB Team | T-001 | 0.5d | Done |
| T-014 | Implement frontend layouts — MainLayout, SubMenuLayout, AuthLayout (레이아웃 구현) | AMB Team | T-013 | 0.5d | Done |
| T-015 | Implement frontend lib — api-client, sse-client, storage (프론트엔드 유틸리티 구현) | AMB Team | T-013 | 0.5d | Done |
| T-016 | Implement auth pages — LoginPage, RegisterPage, auth store/service (인증 페이지 구현) | AMB Team | T-014, T-015 | 1d | Done |
| T-017 | Implement DashboardPage — 9 department card grid (대시보드 페이지 구현) | AMB Team | T-014 | 0.5d | Done |
| T-018 | Implement ChatPage — MessageList, MessageInput, SSE streaming display (채팅 페이지 구현) | AMB Team | T-015, T-016 | 1.5d | Done |
| T-019 | Implement chat hooks and store — useChat, chat.store (채팅 훅 및 스토어 구현) | AMB Team | T-018 | 0.5d | Done |
| T-020 | Implement router with ProtectedRoute/PublicRoute (라우터 구현) | AMB Team | T-016 | 0.5d | Done |
| T-021 | Configure environment variables — backend and frontend .env files (환경 변수 설정) | AMB Team | T-002 | 0.5d | Done |
| T-022 | Write CLAUDE.md, SPEC.md, README.md project documentation (프로젝트 문서 작성) | AMB Team | T-020 | 0.5d | Done |
| T-023 | Generate SDLC documentation — analysis, design, implementation, test docs (SDLC 문서 생성) | AMB Team | T-022 | 1d | In Progress |

**Total Effort (총 공수)**: ~15 days (estimated for single developer)

## Milestones (마일스톤)

| Milestone | Completion Criteria | Target Date | Status |
|-----------|-------------------|-------------|--------|
| Infrastructure Ready (인프라 준비) | T-001~T-004 done | 2026-02-10 | Complete |
| Backend Complete (백엔드 완성) | T-005~T-012 done | 2026-02-12 | Complete |
| Frontend Complete (프론트엔드 완성) | T-013~T-020 done | 2026-02-13 | Complete |
| MVP Release (MVP 릴리즈) | T-001~T-022 done | 2026-02-14 | Complete |
| Documentation (문서화) | T-023 done | 2026-02-14 | In Progress |

## Dependency Graph (의존 관계)

```
T-001 (Monorepo) ──┬── T-002 (Docker) ── T-021 (Env)
                    ├── T-003 (Packages)
                    ├── T-004 (Configs)
                    ├── T-005 (NestJS Init) ──┬── T-006 (Global) ── T-008 (Auth)
                    │                         └── T-007 (Claude)  ── T-009 (BaseAgent)
                    │                                                    │
                    │                              T-010 (9 Agents) ─────┘
                    │                              T-011 (Factory/Ctrl)
                    │                              T-012 (Chat+SSE) ── T-008, T-009
                    │
                    └── T-013 (React Init) ──┬── T-014 (Layouts)
                                             └── T-015 (Lib/Utils)
                                                    │
                                             T-016 (Auth Pages)
                                             T-017 (Dashboard)
                                             T-018 (Chat Page) ── T-015, T-016
                                             T-019 (Chat Hooks)
                                             T-020 (Router)
                                             T-022 (Docs) ── T-023 (SDLC Docs)
```
