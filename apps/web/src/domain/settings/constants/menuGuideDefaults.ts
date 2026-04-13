export const MENU_GUIDE_DEFAULTS: Record<string, { title: string; content: string }> = {
  DASHBOARD: {
    title: '오늘의 미션 Today',
    content: `<h2>오늘의 미션 Today</h2><p>로그인 직후 표시되는 통합 대시보드입니다. 오늘의 미션에서 시작된 실행이 태스크, 이슈, 프로젝트, KMS로 이어지며 Today AI Analysis를 통해 진행 상황 점검과 다음 액션 계획을 지원합니다.</p>`,
  },
  TODOS: {
    title: '할일 TODO',
    content: `<h2>할일 TODO</h2><p>개인 및 유닛 단위의 실행 업무를 칸반으로 관리합니다. 태그, 이슈 연결, 참여자 관리, 상태 전환으로 업무 진행을 구조화할 수 있습니다.</p>`,
  },
  MEETING_NOTES: {
    title: '노트 Meeting Notes',
    content: `<h2>노트 Meeting Notes</h2><p>회의록과 메모를 작성하고 공개 범위를 제어할 수 있습니다. 공유된 노트는 번역 패널과 함께 다국적 협업 지식으로 활용됩니다.</p>`,
  },
  NOTICES: {
    title: '공지사항 Notices',
    content: `<h2>공지사항 Notices</h2><p>전사 또는 유닛 범위 공지를 등록합니다. 중요 안내는 번역 기능을 통해 다국적 구성원에게 일관되게 전달할 수 있습니다.</p>`,
  },
  DOCUMENTS: {
    title: '문서함 Documents',
    content: `<h2>문서함 Documents</h2><p>Google Drive 기반으로 문서를 조회, 검색, 다운로드합니다. 엔티티별 문서 자산을 표준화해 운영 효율을 높입니다.</p>`,
  },
  CHAT: {
    title: 'AI 에이전트 AI Agents',
    content: `<h2>AI 에이전트 AI Agents</h2><p>업무 맥락을 기반으로 답변, 초안, 권고를 제공하는 부서별 AI 에이전트 허브입니다. 번역 협업과 실시간 질의 대응을 지원합니다.</p>`,
  },
  LOBBY_CHAT: {
    title: '로비채팅 Lobby Chat',
    content: `<h2>로비채팅 Lobby Chat</h2><p>조직 구성원 간 실시간 협업 채널입니다. 채널/멘션/번역 기능을 통해 빠른 커뮤니케이션을 지원합니다.</p>`,
  },
  CREW: {
    title: '크루 Crew',
    content: `<h2>크루 Crew</h2><p>유닛 구성원 상태를 확인하고 1:1 또는 그룹 협업을 시작할 수 있는 구성원 디렉터리입니다.</p>`,
  },
  ISSUES: {
    title: '이슈 Issues',
    content: `<h2>이슈 Issues</h2><p>실행 과정에서 발생한 문제를 추적 가능한 단위로 관리합니다. 보드/그리드/타임라인 보기로 진행 상태를 추적하고 프로젝트 및 지식 자산과 연결합니다.</p>`,
  },
  PROJECTS: {
    title: '프로젝트 Projects',
    content: `<h2>프로젝트 Projects</h2><p>제안, 이슈, 일정, 산출물, 협업 이력을 프로젝트 단위로 축적합니다. 실행 결과를 조직 자산으로 정리하는 핵심 영역입니다.</p>`,
  },
  CALENDAR: {
    title: '일정관리 Calendar',
    content: `<h2>일정관리 Calendar</h2><p>개인/팀 일정과 마일스톤을 관리합니다. 태스크와 프로젝트 일정을 연동해 실행 계획을 시각화합니다.</p>`,
  },
  BILLING: {
    title: '거래처관리 Billing',
    content: `<h2>거래처관리 Billing</h2><p>거래처, 계약, SOW, 인보이스, 결제 내역을 통합 관리합니다. 수익/정산 흐름을 표준화하는 모듈입니다.</p>`,
  },
  CONTRACTS: {
    title: '계약서 조회 Contracts',
    content: `<h2>계약서 조회 Contracts</h2><p>계약서와 관련 메타데이터를 조회하고 버전/상태를 관리합니다. 프로젝트와 재무 운영의 기준 자료를 제공합니다.</p>`,
  },
  WORK_ITEMS: {
    title: '업무항목 Work Items',
    content: `<h2>업무항목 Work Items</h2><p>표준 작업 분류와 업무 단위를 정의하여 태스크, 이슈, 프로젝트의 실행 기준을 통일합니다.</p>`,
  },
  WEBMAIL: {
    title: '웹메일 Webmail',
    content: `<h2>웹메일 Webmail</h2><p>조직 메일 송수신과 계정 운영을 지원합니다. 고객/파트너 커뮤니케이션과 내부 협업 기록을 통합합니다.</p>`,
  },
  HR: {
    title: '인사관리 HR',
    content: `<h2>인사관리 HR</h2><p>직원/근태/휴가/급여/정산을 관리합니다. 법인별 인사 운영 데이터를 분리하고 정책 기반 처리를 지원합니다.</p>`,
  },
  ACCOUNTING: {
    title: '회계관리 Accounting',
    content: `<h2>회계관리 Accounting</h2><p>계좌/거래/전표/재무 리포트를 관리합니다. 운영 데이터와 연결된 재무 가시성을 제공합니다.</p>`,
  },
  KMS: {
    title: '지식관리 KMS',
    content: `<h2>지식관리 KMS</h2><p>미션, 태스크, 이슈, 문서, 프로젝트에서 생성된 정보를 태그/그래프/AI 구조화로 축적해 검색 가능한 조직 지식으로 전환합니다.</p>`,
  },
  ASSET: {
    title: '자산관리 Asset',
    content: `<h2>자산관리 Asset</h2><p>조직 자산의 등록, 현황, 사용 상태를 관리합니다. 프로젝트 및 구성원과 자산 이력을 연동합니다.</p>`,
  },
  SETTINGS_MEMBERS: {
    title: '회원 관리 Members',
    content: `<h2>회원 관리</h2><p>구성원 초대, 상태, 역할, 법인 소속, Unit/Cell 연계를 관리합니다.</p>`,
  },
  SETTINGS_PERMISSIONS: {
    title: '메뉴 설정 및 권한관리',
    content: `<h2>메뉴 설정 및 권한관리</h2><p>메뉴 노출과 역할 권한, 메뉴별 운영 가이드를 함께 관리합니다.</p>`,
  },
};

