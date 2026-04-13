---
document_id: DEPT-AGENT-UG-1.0.0
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

# Department AI Agent — User Guide (부서별 AI 에이전트 사용자 가이드)

## Getting Started (시작하기)

### Access (접근 방법)
- **URL**: http://localhost:5179 (development environment)
- **Supported browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Required**: User account (register or login)

### Required Permissions (필요 권한)
- Any registered user can access all 9 department AI agents
- No special permissions required for basic usage

---

## Basic Usage (기본 사용법)

### 1. Registration and Login (회원가입 및 로그인)

1. Navigate to the application URL (앱 URL 접속)
2. Click "Register" to create a new account (회원가입 클릭)
   - Enter your name, email, and password (minimum 8 characters)
   - Optionally select your department
3. After registration, you will be automatically logged in (가입 후 자동 로그인)
4. For subsequent visits, use "Login" with your email and password (재방문 시 로그인)

> **Note**: Sessions remain active for 7 days via refresh token. You won't need to login frequently. (세션은 리프레시 토큰으로 7일간 유지됩니다.)

### 2. Selecting a Department Agent (부서 에이전트 선택)

1. After login, you will see the Dashboard with 9 department cards (로그인 후 대시보드에 9개 부서 카드 표시)
2. Each card displays:
   - Department name (부서명)
   - AI agent description (에이전트 설명)
   - Key specialties (주요 전문 영역)
3. Click on any department card to start a conversation (부서 카드 클릭으로 대화 시작)

### Available Departments (이용 가능한 부서)

| Department | Specialties | Use When... |
|-----------|-------------|-------------|
| Management (경영) | SWOT/BCG, KPI/BSC, Risk management | Strategic planning, executive decisions (전략 기획, 경영 의사결정) |
| Accounting (회계) | K-IFRS, Tax, Budget, Settlement | Financial questions, tax planning (재무 질문, 세무 계획) |
| HR (인사) | Labor law, 52-hour work week, Insurance | Employment rules, hiring, evaluation (고용 규정, 채용, 평가) |
| Legal (법무) | Contract review, Privacy law, Compliance | Legal advice, contract questions (법률 자문, 계약 관련) |
| Sales (영업) | CRM, B2B/B2G, Proposals | Sales strategy, customer management (영업 전략, 고객 관리) |
| IT | ISMS-P, System management, DX | Technology decisions, security (기술 결정, 보안) |
| Marketing (마케팅) | STP, Digital marketing, Campaign ROI | Marketing plans, campaign analysis (마케팅 계획, 캠페인 분석) |
| General Affairs (총무) | Procurement, Assets, Facilities | Office management, procurement (사무 관리, 구매) |
| Planning (기획) | Business plans, New business, PM/WBS | Project planning, business development (프로젝트 기획, 사업 개발) |

### 3. Having a Conversation (대화하기)

1. After selecting a department, you enter the Chat Page (부서 선택 후 채팅 페이지 진입)
2. Click "New Conversation" in the left sidebar to start a new chat (좌측 사이드바에서 새 대화 클릭)
3. Type your question or request in the message input at the bottom (하단 입력창에 질문 입력)
4. Press **Enter** to send the message (엔터로 메시지 전송)
5. Press **Shift + Enter** to add a line break without sending (줄바꿈은 Shift+Enter)
6. The AI agent will respond in real-time — you'll see the response appearing word by word (AI가 실시간으로 응답 — 단어별 표시)
7. The response supports **markdown formatting** including headers, lists, tables, and code blocks (마크다운 포맷 지원)

### 4. Managing Conversations (대화 관리)

- **View conversation list**: Left sidebar shows all conversations for the current department (좌측 사이드바에 현재 부서 대화 목록)
- **Switch between conversations**: Click any conversation in the sidebar (사이드바에서 대화 클릭으로 전환)
- **Delete a conversation**: Click the delete button on the conversation item and confirm (삭제 버튼 클릭 후 확인)
- **Conversation history**: All messages are saved and available when you return (모든 메시지 저장, 재방문 시 이용 가능)

---

## FAQ (자주 묻는 질문)

| Question | Answer |
|----------|--------|
| Can I use multiple department agents? (여러 부서 에이전트를 사용할 수 있나요?) | Yes, you can create conversations with any of the 9 departments. Switch between them via the dashboard. (네, 9개 부서 모두 사용 가능합니다.) |
| Are my conversations private? (대화가 비공개인가요?) | Yes, each user can only see their own conversations. (네, 각 사용자는 자신의 대화만 볼 수 있습니다.) |
| What happens when I delete a conversation? (대화를 삭제하면 어떻게 되나요?) | The conversation is soft-deleted — it won't appear in your list but data is preserved in the database. (소프트 삭제됩니다 — 목록에서 사라지지만 DB에 보존됩니다.) |
| Can I upload files? (파일 업로드가 가능한가요?) | Not in v1.0. File upload is planned for a future release. (v1.0에서는 불가. 향후 버전에서 지원 예정.) |
| What AI model is used? (어떤 AI 모델을 사용하나요?) | Anthropic Claude (claude-sonnet-4-5-20250514). (Anthropic Claude 모델 사용.) |
| Why do I see "[Mock 응답]"? (왜 "[Mock 응답]"이 보이나요?) | The Claude API key is not configured. Contact your admin to set up the API key. (Claude API 키가 미설정. 관리자에게 API 키 설정 요청.) |

## Troubleshooting (문제 해결)

| Symptom | Cause | Solution |
|---------|-------|----------|
| "이메일 또는 비밀번호가 일치하지 않습니다" | Wrong email or password (잘못된 이메일/비밀번호) | Check email and password, try again (이메일과 비밀번호 확인 후 재시도) |
| Login button not responding | Rate limit exceeded (요청 제한 초과) | Wait 60 seconds and try again (60초 후 재시도) |
| AI response shows error | Claude API error or network issue (API 오류 또는 네트워크 문제) | Check network connection, retry. If persistent, contact admin (네트워크 확인, 재시도) |
| Streaming stops mid-response | Network disconnection during SSE (SSE 중 네트워크 단절) | Refresh the page and resend the message (페이지 새로고침 후 재전송) |
| Page shows "Loading..." indefinitely | API server not running (API 서버 미실행) | Ensure backend is running: `npm run dev:api` (백엔드 실행 확인) |
| Empty dashboard | Agent API not responding (에이전트 API 미응답) | Check API server status and network (API 서버 상태 및 네트워크 확인) |
