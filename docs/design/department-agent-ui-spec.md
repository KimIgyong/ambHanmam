---
document_id: DEPT-AGENT-UI-1.0.0
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

# Department AI Agent — UI Specification (부서별 AI 에이전트 화면 기획서)

## Screen List (화면 목록)

| Screen ID | Screen Name | Route | Note |
|-----------|------------|-------|------|
| SCR-001 | Login Page (로그인) | /login | Public |
| SCR-002 | Register Page (회원가입) | /register | Public |
| SCR-003 | Dashboard (대시보드) | / | Protected |
| SCR-004 | Chat Page (채팅) | /chat/:department | Protected |

## SCR-001: Login Page (로그인 페이지)

### Layout (레이아웃)
```
┌──────────────────────────────────────────┐
│              AuthLayout                   │
│  ┌────────────────────────────────────┐  │
│  │         Logo / Title               │  │
│  │     "AMB Management"              │  │
│  ├────────────────────────────────────┤  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │  Email Input                 │  │  │
│  │  └──────────────────────────────┘  │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │  Password Input             │  │  │
│  │  └──────────────────────────────┘  │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │      Login Button            │  │  │
│  │  └──────────────────────────────┘  │  │
│  │  "Don't have an account? Register" │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Components (구성 요소)

| Element | Type | Description | Action |
|---------|------|-------------|--------|
| Email input | Input | Email address field (이메일 입력) | Validate email format |
| Password input | Input (password) | Password field (비밀번호 입력) | Min 8 chars validation |
| Login button | Button (primary) | Submit login form (로그인 제출) | POST /api/v1/auth/login |
| Register link | Link | Navigate to register (회원가입 이동) | Navigate to /register |

### Interaction (인터랙션)
- Loading state: Button shows spinner during API call (로딩: 버튼 스피너)
- Error state: Error message below form (에러: 폼 아래 에러 메시지)
- Success: Redirect to dashboard (성공: 대시보드로 이동)

## SCR-002: Register Page (회원가입 페이지)

### Layout (레이아웃)
- Same as Login Page layout with additional fields: Name, Department (optional)
- Link to login page at bottom

### Components (구성 요소)

| Element | Type | Description | Action |
|---------|------|-------------|--------|
| Name input | Input | User name (이름 입력) | Required |
| Email input | Input | Email address (이메일 입력) | Validate email format |
| Password input | Input (password) | Password (비밀번호 입력) | Min 8 chars |
| Department select | Select (optional) | Department selection (부서 선택) | 9 department options |
| Register button | Button (primary) | Submit registration (회원가입 제출) | POST /api/v1/auth/register |

## SCR-003: Dashboard (대시보드)

### Layout (레이아웃)
```
┌──────────────────────────────────────────────────────┐
│  Header (64px) — Logo, App Name, User Menu           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ 경영     │  │ 회계     │  │ 인사     │              │
│  │ SWOT,KPI │  │ K-IFRS  │  │ 근로기준법│              │
│  └─────────┘  └─────────┘  └─────────┘              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ 법무     │  │ 영업     │  │ IT      │              │
│  │ 계약검토  │  │ CRM,B2B │  │ ISMS-P  │              │
│  └─────────┘  └─────────┘  └─────────┘              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │ 마케팅   │  │ 총무     │  │ 기획     │              │
│  │ STP,ROI  │  │ 자산관리  │  │ PM/WBS  │              │
│  └─────────┘  └─────────┘  └─────────┘              │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Components (구성 요소)

| Element | Type | Description | Action |
|---------|------|-------------|--------|
| Header | Component | App logo, name, user info (로고, 앱명, 사용자 정보) | Logout button |
| Department cards | Card grid (3x3) | 9 department cards with icon, name, specialties (9개 부서 카드) | Click → navigate to /chat/:dept |
| Department icon | Icon (Lucide) | Visual identifier per department (부서별 아이콘) | — |

### Interaction (인터랙션)
- Loading: Skeleton cards while fetching agent info (로딩: 스켈레톤 카드)
- Hover: Card elevation/shadow change (호버: 카드 음영 변화)
- Click: Navigate to /chat/:department (클릭: 채팅 페이지 이동)

### Responsive Design (반응형 대응)
- Desktop (>=1024px): 3-column grid
- Tablet (768-1023px): 2-column grid
- Mobile (<768px): 1-column grid

## SCR-004: Chat Page (채팅 페이지)

### Layout (레이아웃) — Basic-A-2-L
```
┌──────────────────────────────────────────────────────┐
│  Header (64px) — Logo, App Name, User Menu           │
├──────────┬───────────────────────────────────────────┤
│ SubMenu  │  Chat Content Area                        │
│ (240px)  │                                           │
│          │  ┌─────────────────────────────────────┐  │
│ [+New]   │  │  User message                       │  │
│          │  │  ┌─────────────────────────────┐    │  │
│ Conv 1   │  │  │ You: "매출 분석해줘"          │    │  │
│ Conv 2   │  │  └─────────────────────────────┘    │  │
│ Conv 3   │  │                                     │  │
│ Conv 4   │  │  ┌─────────────────────────────┐    │  │
│          │  │  │ AI: "안녕하세요! 영업 에이전트 │    │  │
│          │  │  │ 입니다. 매출 분석을..."       │    │  │
│          │  │  └─────────────────────────────┘    │  │
│          │  │                                     │  │
│          │  ├─────────────────────────────────────┤  │
│          │  │ [Message Input] [Send]               │  │
│          │  └─────────────────────────────────────┘  │
├──────────┴───────────────────────────────────────────┤
└──────────────────────────────────────────────────────┘
```

### Components (구성 요소)

| Element | Type | Description | Action |
|---------|------|-------------|--------|
| Conversation list | Sidebar list | Conversations for current department (현재 부서 대화 목록) | Click to load |
| New conversation button | Button | Create new conversation (새 대화 생성) | POST /api/v1/conversations |
| Delete button | Icon button | Delete conversation (대화 삭제) | DELETE with confirmation |
| Message list | Scroll area | Chat messages with role distinction (역할 구분된 메시지 목록) | Auto-scroll to bottom |
| User message | Card (right-aligned) | User's message (사용자 메시지) | Plain text |
| AI message | Card (left-aligned) | Agent's response (에이전트 응답) | Markdown rendered |
| Streaming indicator | Animation | Typing indicator during SSE (SSE 중 타이핑 표시) | Animated dots |
| Message input | Textarea | Message compose area (메시지 작성) | Shift+Enter: line break, Enter: send |
| Send button | Button (primary) | Send message (메시지 전송) | POST with SSE response |

### Interaction (인터랙션)
- Streaming: AI message content appears token by token (스트리밍: 토큰별 실시간 표시)
- Empty state: "대화를 시작해 보세요" message with department description (빈 상태: 안내 메시지)
- Error state: Error message in chat bubble (에러: 채팅 버블에 에러 메시지)
- Loading: Spinner in message list while loading history (로딩: 이력 로딩 중 스피너)
- Auto-scroll: Scroll to latest message on new message/streaming (자동 스크롤)

### Responsive Design (반응형 대응)
- Desktop (>=1024px): SubMenu (240px) + Content area
- Tablet (768-1023px): SubMenu collapsible (64px collapsed)
- Mobile (<768px): SubMenu hidden, toggle button in header

### Frontend Framework (프론트엔드 프레임워크)
- **Framework**: React 18.2
- **State management**: Zustand (global), React Query (server state)
- **Routing**: React Router v6
- **Styling**: TailwindCSS 3.4
- **Icons**: Lucide React
- **Markdown**: react-markdown
