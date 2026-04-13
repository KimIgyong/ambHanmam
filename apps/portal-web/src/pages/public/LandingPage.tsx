import { useState, useEffect, useRef, useCallback, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { PageHead } from '@/components/seo/PageHead';

import { trackServerEvent } from '@/lib/server-events';

/* ═══════════════════════════════════════════════════════════════
   TYPES & COLORS
   ═══════════════════════════════════════════════════════════════ */
type LangCode = 'en' | 'ko' | 'vi';

const C = {
  navy: '#08122A', navy2: '#0D1B3E',
  blue700: '#1B4FD8', blue600: '#2563EB', blue500: '#3B82F6',
  blue400: '#60A5FA', blue100: '#DBEAFE', blue50: '#EFF6FF',
  slate900: '#0F172A', slate800: '#1E293B', slate700: '#334155',
  slate500: '#64748B', slate400: '#94A3B8', slate300: '#CBD5E1',
  slate200: '#E2E8F0', slate100: '#F1F5F9', slate50: '#F8FAFC',
  orange: '#F37021',
};

/* ═══════════════════════════════════════════════════════════════
   i18n TRANSLATIONS — KO / EN / VI
   ═══════════════════════════════════════════════════════════════ */
const T: Record<LangCode, Record<string, string | string[]>> = {
  ko: {
    'pain.label': '왜 Ạ (아메바) 인가?',
    'pain.title': '지금 이 문제, 겪고 계신가요?',
    'pain.sub': '"어느덧  10년 해외 법인 관리하며 내가 부딪혔던 문제들" — Ạ가 설계된 이유',
    'pain.c1.title': '한국·베트남 팀이 말이 안 통한다',
    'pain.c1.desc': '언어 장벽으로 중요한 지시가 오해되거나 업무 속도가 느려지고 있지 않으신가요?',
    'pain.c1.solve': '채팅 메시지 실시간 AI 번역, 한·영·베 3개 언어 지원',
    'pain.c2.title': '툴이 너무 많아서 관리가 안 된다',
    'pain.c2.desc': 'HR 툴, 회계, 프로젝트 앱, 메신저… 데이터가 여기저기 흩어져 있지 않으신가요?',
    'pain.c2.solve': 'HR·회계·프로젝트·채팅 전부 Ạ 하나로',
    'pain.c3.title': '직원 노하우가 퇴사와 함께 사라진다',
    'pain.c3.desc': '오랫동안 쌓인 업무 경험과 노하우가 담당자 이동 때마다 처음으로 되돌아가지 않으신가요?',
    'pain.c3.solve': 'KMS가 경험을 자동 수집 · 영구 지식으로 보존',
    'pain.c4.title': '보고서 쓰는 데 하루가 사라진다',
    'pain.c4.desc': '주간·월간 보고서 작성, 데이터 정리, 요약까지 매번 반복. 실무자의 가장 소모적인 루틴입니다.',
    'pain.c4.solve': 'AI 에이전트가 초안 작성 → 당신은 검토·승인만',
    'feat.label': 'Ạ (아메바)가  해결하는 방식',
    'feat.reborn': 'reBorn to be AI',
    'feat.title': '사람은 WHAT, AI는 HOW',
    'feat.sub': '4가지 핵심 기능으로 경영 업무의 흐름을 바꿉니다',
    'feat.f1.num': '01 / 04 · 업무 흐름',
    'feat.f1.title': '오늘 미션이 나의 할일로,\n할일이 팀의 이슈로,\n이슈가 프로젝트를 완성합니다.',
    'feat.f1.desc': '목표가 생기면 AI가 할일로 분해합니다. 혼자 해결하기 어려운 건 팀 이슈로 올라가고, 쌓인 이슈들이 프로젝트를 완성합니다. 칸반·간트·리스트 3가지 뷰와 AI 자동 제안서까지.',
    'feat.f1.tags': ['미션 설정', 'AI 할일 분해', '이슈 트래킹', '칸반 / 간트', 'AI 제안서'],
    'feat.f1.s1h': '오늘의 미션', 'feat.f1.s1p': '이번 주 목표가 설정됩니다',
    'feat.f1.s2h': '나의 할일', 'feat.f1.s2p': 'AI가 세부 업무로 자동 분해',
    'feat.f1.s3h': '팀 이슈', 'feat.f1.s3p': '함께 해결해야 할 이슈로 전환',
    'feat.f1.s4h': '프로젝트 완성', 'feat.f1.s4p': '이슈가 모여 완결 · KMS 지식화',
    'feat.f2.num': '02 / 04 · 다국어 소통',
    'feat.f2.title': '언어가 달라도\n하나의 팀',
    'feat.f2.desc': '아메바톡 채널 기반 실시간 메시징에 AI 번역이 내장되어 있습니다. 한국어로 보내면 베트남어로, 베트남어로 보내면 한국어로. 번역 버튼 하나로 다국적 팀이 진짜 소통합니다.',
    'feat.f2.tags': ['실시간 AI 번역', '한·영·베 3개국어', '채널 메시징', 'SSE 스트리밍', '읽음 확인'],
    'feat.f2.msg1': '이번 주 프로젝트 진행 상황 공유해줘!',
    'feat.f2.tr1': '→ Dự án tuần này thế nào?',
    'feat.f2.msg2': 'Dự án đang tiến triển tốt! 85% hoàn thành rồi ạ.',
    'feat.f2.tr2': '→ 프로젝트 잘 진행 중! 85% 완료',
    'feat.f2.msg3': '👍 수고해요! 금요일 배포 예정이죠?',
    'feat.f2.tr3': '→ Deploy thứ 6 đúng không?',
    'feat.f3.num': '03 / 04 · 리포트 자동화',
    'feat.f3.title': 'AI가 대신 쓰는\n주간보고 · 월간리포트',
    'feat.f3.desc': '매주 반복되는 보고서 작성, 이제 AI에게 맡기세요. AI 에이전트가 데이터를 수집·분석하고 초안을 작성합니다. 당신은 검토하고 승인만 하면 됩니다.',
    'feat.f3.tags': ['AI 초안 자동 생성', '승인 워크플로우', 'PDF 출력', 'Excel 리포트', 'AI 에이전트'],
    'feat.f3.rtitle': '주간 업무 보고서 — 2025 W23',
    'feat.f3.r1k': '완료 태스크', 'feat.f3.r1v': '14 / 17',
    'feat.f3.r2k': '이번 주 매출', 'feat.f3.r2v': '₩ 24,800,000',
    'feat.f3.r3k': '출근률', 'feat.f3.r3v': '96.2%',
    'feat.f3.typing': 'AI가 분석 요약을 작성 중입니다...',
    'feat.f4.num': '04 / 04 · 조직 자가성장',
    'feat.f4.title': '아메바처럼\n쓸수록 똑똑해지는 조직',
    'feat.f4.desc': '직원이 AI로 만든 업무 개선 앱을 사내 앱스토어에 공유합니다. 개인의 경험이 팀의 지식이 되고, 팀의 지식이 회사의 경쟁력이 됩니다.',
    'feat.f4.tags': ['사내 AI 앱스토어', '앱 공유·재사용', 'KMS 지식화', '벡터 검색', 'Knowledge Graph'],
    'feat.f4.a1n': '미팅 요약봇', 'feat.f4.a1d': '영업팀 · 247회', 'feat.f4.a1b': '인기',
    'feat.f4.a2n': '계약서 검토 AI', 'feat.f4.a2d': '법무팀 · 89회',
    'feat.f4.a3n': '매출 예측 대시보드', 'feat.f4.a3d': '경영팀 · 156회',
    'feat.f4.a4n': '채용 인터뷰 가이드', 'feat.f4.a4d': 'HR팀 · 43회',
    'cycle.label': '성장 구조',
    'cycle.title': '경험이 지식이 되고\n지식이 경쟁력이 됩니다',
    'cycle.sub': '한 명의 노하우가 조직 전체의 자산이 되는 순환',
    'cycle.n1': '경험', 'cycle.n1s': '업무 노하우',
    'cycle.n2': '공유', 'cycle.n2s': 'AI 앱 · KMS',
    'cycle.n3': '정보', 'cycle.n3s': '데이터 · 문서',
    'cycle.n4': '지식', 'cycle.n4s': '벡터 검색',
    'cycle.n5': '경쟁력', 'cycle.n5s': '조직 자산',
    'cycle.rh': '퇴사해도 지식은 남는다',
    'cycle.rp': '직원의 경험과 노하우가 KMS에 자동 축적됩니다.\n새 직원이 입사해도 조직의 지식은 사라지지 않고 계속 쌓입니다.\n아메바처럼, Ạ는 분열할수록 더 강해집니다.',
    'stats.label': '숫자로 보는 Ạ(아메바)', 'stats.title': '검증된 플랫폼 스펙',
    'stats.u1': '개', 'stats.l1': '업무 도구\n할일·캘린더·메일·채팅 등',
    'stats.u2': '개', 'stats.l2': '업무 모듈\nHR·회계·프로젝트 등',
    'stats.u3': '개국어', 'stats.l3': '기본 지원 언어\n한국어·영어·베트남어\n(추가 언어 확장 가능)',
    'stats.l4': 'AI 에이전트 내재\nAI 에이전트 탑재',
    'stats.l5': '다국가 법인 설정\n국가별 독립 운영 지원',
    'tech.label': '기술 스택', 'tech.title': '엔터프라이즈 수준의 기술 기반',
    'tech.sub': '보안·성능·확장성을 갖춘 프로덕션 아키텍처',
    'tech.db4': '79 엔티티', 'tech.ai': 'AI & 외부 서비스',
    'cta.title': '지금 바로 시작하세요',
    'cta.desc': ' 무료 체험, 신용카드 불필요.\n전담 온보딩 매니저가 첫 설정부터 함께합니다.',
    'cta.btn1': '무료 시작', 'cta.btn2': '도입 상담 문의',
    'sub.title': '제품 소식을 받아보세요',
    'sub.placeholder': '이메일 주소 입력',
    'sub.button': '구독하기',
    'sub.success': '구독해주셔서 감사합니다!',
    'sub.duplicate': '이미 구독 중인 이메일입니다',
    'sub.error': '잠시 후 다시 시도해주세요',
    'sub.privacy': '구독 시 개인정보 처리방침에 동의합니다',
    'preview.btn': '미리보기', 'preview.close': '닫기',
    'freetrial.btn': '무료 체험',
    'guide.label': '사용 가이드',
    'guide.title': 'Ạ(아메바) 활용 가이드',
    'guide.sub': 'Ạ(아메바)의 주요 기능과 설정 방법을 단계별로 안내합니다',
    'guide.g1': '사용자 가이드', 'guide.g1d': 'Ạ 전체 기능 사용법 안내',
    'guide.g2': '사용자 매뉴얼', 'guide.g2d': '상세 조작 매뉴얼 및 스크린샷',
    'guide.g3': 'Smart ToDo', 'guide.g3d': 'AI 기반 스마트 할일 관리 기능',
    'guide.g4': 'Work Tools 가이드', 'guide.g4d': '업무 도구 기능 애니메이션 소개',
    'guide.g5': 'Google Drive 연동', 'guide.g5d': 'Ạ와 Google Drive 연결 설정',
    'guide.g6': '앱 설치 가이드', 'guide.g6d': 'PWA 앱 설치 방법 안내',
    'guide.g7': 'Car Manager', 'guide.g7d': '차량 관리 앱 UI 소개',
  },
  en: {
    'pain.label': 'Why Ạ?',
    'pain.title': 'Do any of these sound familiar?',
    'pain.sub': '"Problems I kept running into managing overseas offices for 10 years" — why Ạ was built',
    'pain.c1.title': "Korean & Vietnamese teams can't communicate",
    'pain.c1.desc': 'Language barriers cause misunderstandings, slow decisions, and delays in cross-border teams.',
    'pain.c1.solve': 'Real-time AI translation built into team chat — KO/EN/VI',
    'pain.c2.title': "Too many tools, nothing connects",
    'pain.c2.desc': 'HR software, accounting apps, project trackers, messengers — your data is scattered everywhere.',
    'pain.c2.solve': 'HR · Accounting · Projects · Chat — all in one platform',
    'pain.c3.title': 'Employee know-how disappears when they leave',
    'pain.c3.desc': 'Years of expertise walk out the door every time someone resigns or transfers.',
    'pain.c3.solve': 'KMS auto-captures experience · knowledge stays forever',
    'pain.c4.title': 'Reports eat up an entire day',
    'pain.c4.desc': 'Writing weekly and monthly reports, gathering data, summarizing — the most repetitive drain on your team.',
    'pain.c4.solve': 'AI agents draft reports → you just review & approve',
    'feat.label': 'How Ạ Solves It',
    'feat.reborn': 'reBorn to be AI',
    'feat.title': 'Humans decide WHAT. AI handles HOW.',
    'feat.sub': 'Four core capabilities that transform how your business operates.',
    'feat.f1.num': '01 / 04 · Workflow',
    'feat.f1.title': "Today's mission becomes your task.\nYour task becomes a team issue.\nIssues complete the project.",
    'feat.f1.desc': 'Set a goal and AI breaks it into tasks. Hard problems escalate to team issues. Accumulated issues become completed projects. Kanban, Gantt, and List views keep everyone aligned.',
    'feat.f1.tags': ['Mission Setting', 'AI Task Breakdown', 'Issue Tracking', 'Kanban / Gantt', 'AI Proposals'],
    'feat.f1.s1h': "Today's Mission", 'feat.f1.s1p': 'Weekly goal is set',
    'feat.f1.s2h': 'My Tasks', 'feat.f1.s2p': 'AI auto-breaks into subtasks',
    'feat.f1.s3h': 'Team Issue', 'feat.f1.s3p': 'Escalated for team resolution',
    'feat.f1.s4h': 'Project Complete', 'feat.f1.s4p': 'Issues resolved · saved to KMS',
    'feat.f2.num': '02 / 04 · Multilingual',
    'feat.f2.title': 'One team,\nno language barrier',
    'feat.f2.desc': 'AmoebaTalk has AI translation built in. Send in Korean, receive in Vietnamese. Send in Vietnamese, receive in Korean. Real communication across borders.',
    'feat.f2.tags': ['Real-time AI Translation', 'KO · EN · VI', 'Channel Messaging', 'SSE Streaming', 'Read Receipts'],
    'feat.f2.msg1': "Share this week's project status!",
    'feat.f2.tr1': '→ Dự án tuần này thế nào?',
    'feat.f2.msg2': 'Dự án đang tiến triển tốt! 85% hoàn thành rồi ạ.',
    'feat.f2.tr2': '→ Project going well! 85% done',
    'feat.f2.msg3': '👍 Great work! Deploy on Friday right?',
    'feat.f2.tr3': '→ Deploy thứ 6 đúng không?',
    'feat.f3.num': '03 / 04 · Report Automation',
    'feat.f3.title': 'AI writes your weekly\nand monthly reports',
    'feat.f3.desc': 'Nine specialized AI agents collect data, analyze it, and draft reports. All you do is review and approve. HR, accounting, sales, project reports — all automated.',
    'feat.f3.tags': ['AI Draft Generation', 'Approval Workflow', 'PDF Export', 'Excel Reports', 'AI Agents'],
    'feat.f3.rtitle': 'Weekly Report — 2025 W23',
    'feat.f3.r1k': 'Completed Tasks', 'feat.f3.r1v': '14 / 17',
    'feat.f3.r2k': 'Weekly Revenue', 'feat.f3.r2v': '₩ 24,800,000',
    'feat.f3.r3k': 'Attendance Rate', 'feat.f3.r3v': '96.2%',
    'feat.f3.typing': 'AI is writing the summary...',
    'feat.f4.num': '04 / 04 · Self-Growth',
    'feat.f4.title': 'Like an amoeba —\nsmarter with every use',
    'feat.f4.desc': 'Employees build AI apps to improve their workflows and share them in the internal app store. Individual experience becomes team knowledge, which becomes company competitive advantage.',
    'feat.f4.tags': ['Internal AI App Store', 'App Sharing', 'KMS Knowledge', 'Vector Search', 'Knowledge Graph'],
    'feat.f4.a1n': 'Meeting Summarizer', 'feat.f4.a1d': 'Sales · 247 uses', 'feat.f4.a1b': 'Popular',
    'feat.f4.a2n': 'Contract Review AI', 'feat.f4.a2d': 'Legal · 89 uses',
    'feat.f4.a3n': 'Revenue Forecast', 'feat.f4.a3d': 'Mgmt · 156 uses',
    'feat.f4.a4n': 'Interview Guide', 'feat.f4.a4d': 'HR · 43 uses',
    'cycle.label': 'Growth Loop',
    'cycle.title': 'Experience becomes knowledge.\nKnowledge becomes competitive edge.',
    'cycle.sub': "One person's know-how becomes the entire organization's asset",
    'cycle.n1': 'Experience', 'cycle.n1s': 'Work expertise',
    'cycle.n2': 'Share', 'cycle.n2s': 'AI apps · KMS',
    'cycle.n3': 'Information', 'cycle.n3s': 'Data · Docs',
    'cycle.n4': 'Knowledge', 'cycle.n4s': 'Vector search',
    'cycle.n5': 'Edge', 'cycle.n5s': 'Org asset',
    'cycle.rh': 'Knowledge stays when people leave',
    'cycle.rp': 'Employee expertise is auto-captured in KMS.\nWhen new people join, the organization\'s knowledge is already there.\nLike an amoeba — Ạ gets stronger the more it divides.',
    'stats.label': 'Ạ by the Numbers', 'stats.title': 'Platform Specifications',
    'stats.u1': ' tools', 'stats.l1': 'Work Tools\nTODO · Calendar · Mail · Chat',
    'stats.u2': ' modules', 'stats.l2': 'Business Modules\nHR · Accounting · Projects',
    'stats.u3': ' languages', 'stats.l3': 'Default Languages\nKorean · English · Vietnamese\n(additional languages available)',
    'stats.l4': 'Embedded AI Agents\nAI Agents built in',
    'stats.l5': 'Multi-Entity Support\nIndependent operation per country',
    'tech.label': 'Tech Stack', 'tech.title': 'Enterprise-Grade Architecture',
    'tech.sub': 'Production-ready with security, performance, and scalability',
    'tech.db4': '79 Entities', 'tech.ai': 'AI & External Services',
    'cta.title': 'Start Today',
    'cta.desc': 'free trial, no credit card required.\nA dedicated onboarding manager is with you from day one.',
    'cta.btn1': 'Start Free', 'cta.btn2': 'Contact Sales',
    'sub.title': 'Stay updated with our news',
    'sub.placeholder': 'Enter your email address',
    'sub.button': 'Subscribe',
    'sub.success': 'Thank you for subscribing!',
    'sub.duplicate': 'This email is already subscribed',
    'sub.error': 'Please try again later',
    'sub.privacy': 'By subscribing, you agree to our Privacy Policy',
    'preview.btn': 'Preview', 'preview.close': 'Close',
    'freetrial.btn': 'Free Trial',
    'guide.label': 'User Guides',
    'guide.title': 'Ạ User Guides',
    'guide.sub': 'Step-by-step guides for Ạ features and setup',
    'guide.g1': 'User Guide', 'guide.g1d': 'Complete Ạ feature walkthrough',
    'guide.g2': 'User Manual', 'guide.g2d': 'Detailed operations manual with screenshots',
    'guide.g3': 'Smart ToDo', 'guide.g3d': 'AI-powered smart task management',
    'guide.g4': 'Work Tools Guide', 'guide.g4d': 'Animated work tools feature overview',
    'guide.g5': 'Google Drive Setup', 'guide.g5d': 'Connect Ạ with Google Drive',
    'guide.g6': 'App Install Guide', 'guide.g6d': 'PWA app installation instructions',
    'guide.g7': 'Car Manager', 'guide.g7d': 'Vehicle management app UI overview',
  },
  vi: {
    'pain.label': 'Tại sao Ạ?',
    'pain.title': 'Bạn có đang gặp vấn đề này?',
    'pain.sub': '"Những vấn đề tôi gặp phải qua 10 năm quản lý văn phòng nước ngoài" — lý do Ạ ra đời',
    'pain.c1.title': 'Đội Hàn Quốc và Việt Nam không thể giao tiếp',
    'pain.c1.desc': 'Rào cản ngôn ngữ gây hiểu nhầm, làm chậm quyết định và trì hoãn công việc xuyên biên giới.',
    'pain.c1.solve': 'Dịch AI thời gian thực trong chat — KO/EN/VI',
    'pain.c2.title': 'Quá nhiều công cụ, không có gì kết nối',
    'pain.c2.desc': 'Phần mềm HR, kế toán, quản lý dự án, tin nhắn — dữ liệu nằm rải rác khắp nơi.',
    'pain.c2.solve': 'HR · Kế toán · Dự án · Chat — tất cả trên một nền tảng',
    'pain.c3.title': 'Kinh nghiệm nhân viên mất đi khi họ nghỉ việc',
    'pain.c3.desc': 'Nhiều năm kinh nghiệm ra đi mỗi khi ai đó nghỉ việc hoặc chuyển vị trí.',
    'pain.c3.solve': 'KMS tự động lưu kinh nghiệm · tri thức tồn tại mãi mãi',
    'pain.c4.title': 'Viết báo cáo mất cả ngày',
    'pain.c4.desc': 'Viết báo cáo tuần, tháng, thu thập dữ liệu, tóm tắt — công việc lặp đi lặp lại tốn kém nhất.',
    'pain.c4.solve': 'AI agent soạn thảo → bạn chỉ xem và phê duyệt',
    'feat.label': 'Ạ giải quyết như thế nào',
    'feat.reborn': 'reBorn to be AI',
    'feat.title': 'Con người quyết định WHAT. AI thực hiện HOW.',
    'feat.sub': 'Bốn tính năng cốt lõi thay đổi cách vận hành doanh nghiệp của bạn.',
    'feat.f1.num': '01 / 04 · Quy trình công việc',
    'feat.f1.title': 'Nhiệm vụ hôm nay thành việc của tôi.\nViệc của tôi thành vấn đề nhóm.\nVấn đề hoàn thành dự án.',
    'feat.f1.desc': 'Đặt mục tiêu và AI phân tách thành nhiệm vụ. Vấn đề khó leo thang thành vấn đề nhóm. Các vấn đề tích lũy tạo nên dự án hoàn chỉnh. Ba chế độ xem Kanban, Gantt, Danh sách.',
    'feat.f1.tags': ['Đặt nhiệm vụ', 'AI phân tách công việc', 'Theo dõi vấn đề', 'Kanban / Gantt', 'Đề xuất AI'],
    'feat.f1.s1h': 'Nhiệm vụ hôm nay', 'feat.f1.s1p': 'Mục tiêu tuần được đặt ra',
    'feat.f1.s2h': 'Việc của tôi', 'feat.f1.s2p': 'AI tự động phân tách',
    'feat.f1.s3h': 'Vấn đề nhóm', 'feat.f1.s3p': 'Chuyển thành vấn đề cần giải quyết',
    'feat.f1.s4h': 'Hoàn thành dự án', 'feat.f1.s4p': 'Vấn đề giải quyết · lưu vào KMS',
    'feat.f2.num': '02 / 04 · Đa ngôn ngữ',
    'feat.f2.title': 'Một đội ngũ,\nkhông rào cản ngôn ngữ',
    'feat.f2.desc': 'AmoebaTalk tích hợp sẵn dịch AI. Gửi tiếng Hàn, nhận tiếng Việt. Gửi tiếng Việt, nhận tiếng Hàn. Giao tiếp thực sự xuyên biên giới.',
    'feat.f2.tags': ['Dịch AI thời gian thực', 'KO · EN · VI', 'Nhắn tin kênh', 'SSE Streaming', 'Xác nhận đã đọc'],
    'feat.f2.msg1': '이번 주 프로젝트 진행 상황 공유해줘!',
    'feat.f2.tr1': '→ Dự án tuần này thế nào?',
    'feat.f2.msg2': 'Dự án đang tiến triển tốt! 85% hoàn thành rồi ạ.',
    'feat.f2.tr2': '→ 프로젝트 잘 진행 중! 85% 완료',
    'feat.f2.msg3': '👍 수고해요! 금요일 배포 예정이죠?',
    'feat.f2.tr3': '→ Deploy thứ 6 đúng không?',
    'feat.f3.num': '03 / 04 · Tự động báo cáo',
    'feat.f3.title': 'AI viết báo cáo tuần\nvà báo cáo tháng thay bạn',
    'feat.f3.desc': 'AI Agent thu thập dữ liệu, phân tích và soạn thảo báo cáo. Bạn chỉ cần xem xét và phê duyệt. Tất cả báo cáo HR, kế toán, kinh doanh, dự án đều được tự động hóa.',
    'feat.f3.tags': ['Tự động tạo bản thảo', 'Quy trình phê duyệt', 'Xuất PDF', 'Báo cáo Excel', 'AI Agent'],
    'feat.f3.rtitle': 'Báo cáo tuần — 2025 W23',
    'feat.f3.r1k': 'Nhiệm vụ hoàn thành', 'feat.f3.r1v': '14 / 17',
    'feat.f3.r2k': 'Doanh thu tuần', 'feat.f3.r2v': '₩ 24,800,000',
    'feat.f3.r3k': 'Tỷ lệ chuyên cần', 'feat.f3.r3v': '96.2%',
    'feat.f3.typing': 'AI đang viết tóm tắt phân tích...',
    'feat.f4.num': '04 / 04 · Tự tăng trưởng',
    'feat.f4.title': 'Như amip —\ncàng dùng càng thông minh',
    'feat.f4.desc': 'Nhân viên xây dựng ứng dụng AI cải thiện quy trình và chia sẻ trong app store nội bộ. Kinh nghiệm cá nhân trở thành tri thức nhóm, trở thành lợi thế cạnh tranh của công ty.',
    'feat.f4.tags': ['App Store nội bộ', 'Chia sẻ ứng dụng', 'KMS tri thức', 'Tìm kiếm Vector', 'Knowledge Graph'],
    'feat.f4.a1n': 'Bot tóm tắt cuộc họp', 'feat.f4.a1d': 'Kinh doanh · 247 lần', 'feat.f4.a1b': 'Phổ biến',
    'feat.f4.a2n': 'AI xem xét hợp đồng', 'feat.f4.a2d': 'Pháp lý · 89 lần',
    'feat.f4.a3n': 'Dự báo doanh thu', 'feat.f4.a3d': 'Quản lý · 156 lần',
    'feat.f4.a4n': 'Hướng dẫn phỏng vấn', 'feat.f4.a4d': 'HR · 43 lần',
    'cycle.label': 'Cấu trúc tăng trưởng',
    'cycle.title': 'Kinh nghiệm thành tri thức.\nTri thức thành lợi thế cạnh tranh.',
    'cycle.sub': 'Kinh nghiệm của một người trở thành tài sản của cả tổ chức',
    'cycle.n1': 'Kinh nghiệm', 'cycle.n1s': 'Chuyên môn công việc',
    'cycle.n2': 'Chia sẻ', 'cycle.n2s': 'App AI · KMS',
    'cycle.n3': 'Thông tin', 'cycle.n3s': 'Dữ liệu · Tài liệu',
    'cycle.n4': 'Tri thức', 'cycle.n4s': 'Tìm kiếm vector',
    'cycle.n5': 'Lợi thế', 'cycle.n5s': 'Tài sản tổ chức',
    'cycle.rh': 'Tri thức ở lại khi người rời đi',
    'cycle.rp': 'Kinh nghiệm nhân viên được KMS tự động lưu trữ.\nKhi nhân viên mới vào, tri thức của tổ chức vẫn còn đó.\nNhư amip — Ạ càng phân chia càng mạnh mẽ hơn.',
    'stats.label': 'Ạ theo con số', 'stats.title': 'Thông số nền tảng',
    'stats.u1': ' công cụ', 'stats.l1': 'Công cụ làm việc\nViệc cần làm · Lịch · Mail · Chat',
    'stats.u2': ' module', 'stats.l2': 'Module nghiệp vụ\nNhân sự · Kế toán · Dự án',
    'stats.u3': ' ngôn ngữ', 'stats.l3': 'Ngôn ngữ mặc định\nHàn Quốc · Tiếng Anh · Tiếng Việt\n(có thể mở rộng thêm ngôn ngữ)',
    'stats.l4': 'AI Agent tích hợp sẵn\nAI Agent tích hợp',
    'stats.l5': 'Hỗ trợ đa pháp nhân\nVận hành độc lập theo quốc gia',
    'tech.label': 'Công nghệ', 'tech.title': 'Kiến trúc cấp doanh nghiệp',
    'tech.sub': 'Sẵn sàng production với bảo mật, hiệu suất và khả năng mở rộng',
    'tech.db4': '79 Thực thể', 'tech.ai': 'AI & Dịch vụ Bên ngoài',
    'cta.title': 'Bắt đầu ngay hôm nay',
    'cta.desc': 'Không cần thẻ tín dụng.\nQuản lý onboarding chuyên trách sẽ đồng hành từ đầu.',
    'cta.btn1': 'Dùng thử miễn phí', 'cta.btn2': 'Tư vấn triển khai',
    'sub.title': 'Nhận tin tức sản phẩm',
    'sub.placeholder': 'Nhập địa chỉ email',
    'sub.button': 'Đăng ký',
    'sub.success': 'Cảm ơn bạn đã đăng ký!',
    'sub.duplicate': 'Email này đã được đăng ký',
    'sub.error': 'Vui lòng thử lại sau',
    'sub.privacy': 'Đăng ký đồng nghĩa bạn đồng ý Chính sách bảo mật',
    'preview.btn': 'Xem trước', 'preview.close': 'Đóng',
    'freetrial.btn': 'Dùng thử miễn phí',
    'guide.label': 'Hướng dẫn sử dụng',
    'guide.title': 'Hướng dẫn sử dụng Ạ',
    'guide.sub': 'Hướng dẫn từng bước về tính năng và cài đặt Ạ',
    'guide.g1': 'Hướng dẫn sử dụng', 'guide.g1d': 'Cách sử dụng toàn bộ tính năng Ạ',
    'guide.g2': 'Sách hướng dẫn', 'guide.g2d': 'Hướng dẫn chi tiết với ảnh chụp màn hình',
    'guide.g3': 'Smart ToDo', 'guide.g3d': 'Quản lý công việc thông minh bằng AI',
    'guide.g4': 'Work Tools', 'guide.g4d': 'Giới thiệu công cụ làm việc',
    'guide.g5': 'Google Drive', 'guide.g5d': 'Kết nối Ạ với Google Drive',
    'guide.g6': 'Cài đặt ứng dụng', 'guide.g6d': 'Hướng dẫn cài đặt PWA',
    'guide.g7': 'Car Manager', 'guide.g7d': 'Giao diện quản lý xe',
  },
};

/* ═══ Intersection Observer Hook ═══ */
function useInView(): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null!);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el); }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, isVisible];
}

/* ═══ Animated Section Wrapper ═══ */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ═══ Section Label ═══ */
function SectionLabel({ children, light }: { children: string; light?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-[.73rem] font-bold uppercase tracking-[.1em] mb-3" style={{ color: light ? C.blue400 : C.blue600 }}>
      <span className="inline-block w-4 h-0.5" style={{ background: 'currentColor' }} />
      {children}
    </p>
  );
}

/* ═══ Slide Card SVG Icons ═══ */
const CARD_ICONS = [
  /* Phone */ <svg key="phone" viewBox="0 0 24 24" fill="none" stroke={C.blue500} strokeWidth={1.5}><path d="M3 5h4l2 5-2.5 1.5a11 11 0 005 5L13 14l5 2v4a2 2 0 01-2 2A16 16 0 012 7a2 2 0 012-2z" /></svg>,
  /* Grid */ <svg key="grid" viewBox="0 0 24 24" fill="none" stroke={C.blue400} strokeWidth={1.5}><rect x="2" y="3" width="7" height="7" rx="1" /><rect x="15" y="3" width="7" height="7" rx="1" /><rect x="15" y="14" width="7" height="7" rx="1" /><rect x="2" y="14" width="7" height="7" rx="1" /></svg>,
  /* Users */ <svg key="users" viewBox="0 0 24 24" fill="none" stroke={C.blue400} strokeWidth={1.5}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  /* Table */ <svg key="table" viewBox="0 0 24 24" fill="none" stroke={C.blue500} strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
];

const SOLVE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0 mt-0.5">
    <polyline points="13,5 19,5 19,11" /><polyline points="13,19 7,19 7,13" /><line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

/* ═══ Pain Slider (Hero) ═══ */
function PainSlider({ t }: { t: (k: string) => string }) {
  const [cur, setCur] = useState(0);
  const vpRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const cards = [
    { num: '01 / 04', icon: 0, primary: false, titleKey: 'pain.c1.title', descKey: 'pain.c1.desc', solveKey: 'pain.c1.solve', iconBg: 'rgba(255,255,255,.06)' },
    { num: '02 / 04', icon: 1, primary: true, titleKey: 'pain.c2.title', descKey: 'pain.c2.desc', solveKey: 'pain.c2.solve', iconBg: 'rgba(37,99,235,.2)' },
    { num: '03 / 04', icon: 2, primary: true, titleKey: 'pain.c3.title', descKey: 'pain.c3.desc', solveKey: 'pain.c3.solve', iconBg: 'rgba(37,99,235,.2)' },
    { num: '04 / 04', icon: 3, primary: false, titleKey: 'pain.c4.title', descKey: 'pain.c4.desc', solveKey: 'pain.c4.solve', iconBg: 'rgba(255,255,255,.06)' },
  ];

  const vis = useCallback(() => {
    const w = vpRef.current?.offsetWidth ?? 1200;
    return w < 640 ? 1 : w < 960 ? 2 : 3;
  }, []);

  const go = useCallback((i: number) => {
    const max = cards.length - vis();
    setCur(Math.max(0, Math.min(i, max)));
  }, [vis, cards.length]);

  useEffect(() => {
    const start = () => {
      timerRef.current = setInterval(() => {
        setCur(prev => {
          const max = cards.length - vis();
          return prev + 1 > max ? 0 : prev + 1;
        });
      }, 4200);
    };
    start();
    return () => clearInterval(timerRef.current);
  }, [vis, cards.length]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCur(prev => {
        const max = cards.length - vis();
        return prev + 1 > max ? 0 : prev + 1;
      });
    }, 4200);
  };

  return (
    <>
      <div ref={vpRef} className="overflow-hidden relative z-[2]" onMouseEnter={pause} onMouseLeave={resume}>
        <div className="flex ama-slider-track" style={{ transform: `translateX(-${cur * (100 / vis())}%)`, padding: '0 calc(6vw - .7rem)' }}>
          {cards.map((c, i) => (
            <div key={i} className="shrink-0 px-[.7rem]" style={{ flex: `0 0 calc(100% / ${vis()})` }}>
              <div
                className={`bg-white rounded-[14px] p-[1.65rem] h-full flex flex-col gap-[.85rem] transition-all duration-300 relative overflow-hidden cursor-default hover:-translate-y-[3px] hover:shadow-lg ${c.primary ? 'border-t-[3px]' : ''}`}
                style={{
                  border: `1px solid ${C.slate200}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,.05)',
                  borderTopColor: c.primary ? C.blue600 : C.slate200,
                }}
              >
                <span className="font-mono-jb text-[.68rem] font-semibold tracking-[.08em]" style={{ color: C.blue500 }}>{c.num}</span>
                <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center [&>svg]:w-[21px] [&>svg]:h-[21px]" style={{ background: c.iconBg }}>
                  {CARD_ICONS[c.icon]}
                </div>
                <h4 className="font-sora font-bold text-[.98rem] leading-[1.3]" style={{ color: C.blue700 }}>{t(c.titleKey)}</h4>
                <p className="text-[.83rem] leading-[1.65] flex-1" style={{ color: C.slate500 }}>{t(c.descKey)}</p>
                <div className="flex items-start gap-[.38rem] text-[.76rem] font-semibold leading-[1.45] mt-auto pt-[.55rem]" style={{ borderTop: `1px solid ${C.slate100}`, color: C.blue600 }}>
                  {SOLVE_ICON}
                  <span>{t(c.solveKey)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Slider controls */}
      <div className="flex items-center justify-center gap-3 pt-7 relative z-[2]" style={{ padding: '1.8rem 6vw 0' }}>
        <button onClick={() => go(cur - 1)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all hover:border-blue-400" style={{ border: '1.5px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)' }}>
          <ChevronLeft size={14} style={{ color: C.slate300 }} />
        </button>
        <div className="flex gap-2 items-center">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-all duration-300"
              style={{
                background: i === cur ? '#fff' : 'rgba(255,255,255,.25)',
                transform: i === cur ? 'scale(1.25)' : 'scale(1)',
                boxShadow: i === cur ? '0 0 0 2px rgba(96,165,250,.4)' : 'none',
              }}
            />
          ))}
        </div>
        <button onClick={() => go(cur + 1)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all hover:border-blue-400" style={{ border: '1.5px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)' }}>
          <ChevronRight size={14} style={{ color: C.slate300 }} />
        </button>
      </div>
    </>
  );
}

/* ═══ Feature Visuals ═══ */
function MissionFlow({ t }: { t: (k: string) => string }) {
  const steps = [
    { key: 'f1.s1', color: '#2563EB', bg: '#EFF6FF', badge: 'MISSION', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={1.5}><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg> },
    { key: 'f1.s2', color: '#16A34A', bg: '#F0FDF4', badge: 'MY TASK', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={1.5}><polyline points="9,11 12,14 22,4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg> },
    { key: 'f1.s3', color: '#EA580C', bg: '#FFF7ED', badge: 'ISSUE', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> },
    { key: 'f1.s4', color: '#7C3AED', bg: '#F5F3FF', badge: 'PROJECT', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={1.5}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg> },
  ];
  return (
    <div className="relative z-[1] w-full flex flex-col gap-0">
      {steps.map((s, i) => (
        <div key={i}>
          {i > 0 && (
            <div className="h-4 flex items-center justify-center relative">
              <div className="absolute left-[1.75rem] top-0 bottom-0 w-px" style={{ background: C.slate200 }} />
              <div className="w-[5px] h-[5px] rounded-full z-[1]" style={{ background: C.blue400 }} />
            </div>
          )}
          <div className="flex items-center gap-[.9rem] bg-white rounded-[10px] p-[.8rem_1rem] relative" style={{ border: `1px solid ${C.slate200}` }}>
            <div className="w-[33px] h-[33px] shrink-0 rounded-lg flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <h5 className="text-[.84rem] font-bold" style={{ color: C.slate800 }}>{t(`feat.${s.key}h`)}</h5>
              <p className="text-[.73rem] mt-[.08rem] leading-[1.35]" style={{ color: C.slate400 }}>{t(`feat.${s.key}p`)}</p>
            </div>
            <span className="ml-auto shrink-0 text-[.64rem] font-bold tracking-[.04em] px-2 py-[.17rem] rounded" style={{ background: s.bg, color: s.color }}>{s.badge}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatBubbles({ t }: { t: (k: string) => string }) {
  const TransBadge = ({ text, dark }: { text: string; dark?: boolean }) => (
    <span className="inline-flex items-center gap-1 rounded text-[.65rem] font-semibold px-[.4rem] py-[.08rem] mt-[.2rem]"
      style={{
        background: dark ? 'rgba(255,255,255,.1)' : 'rgba(37,99,235,.07)',
        border: `1px solid ${dark ? 'rgba(255,255,255,.2)' : 'rgba(37,99,235,.15)'}`,
        color: dark ? 'rgba(255,255,255,.75)' : C.blue600,
      }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[10px] h-[10px]"><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" /></svg>
      {text}
    </span>
  );
  return (
    <div className="relative z-[1] w-full flex flex-col gap-[.6rem]">
      {/* Left msg */}
      <div className="flex items-end gap-[.45rem]">
        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[.57rem] font-bold shrink-0" style={{ background: '#EFF6FF', color: '#2563EB' }}>KR</div>
        <div>
          <div className="max-w-[72%] px-[.82rem] py-[.52rem] rounded-xl rounded-bl-[3px] bg-white text-[.79rem] leading-[1.5]" style={{ border: `1px solid ${C.slate200}`, color: C.slate700 }}>{t('feat.f2.msg1')}</div>
          <TransBadge text={t('feat.f2.tr1')} />
        </div>
      </div>
      {/* Right msg */}
      <div className="flex items-end gap-[.45rem] flex-row-reverse">
        <div>
          <div className="max-w-[72%] px-[.82rem] py-[.52rem] rounded-xl rounded-br-[3px] text-white text-[.79rem] leading-[1.5] ml-auto" style={{ background: C.blue600 }}>{t('feat.f2.msg2')}</div>
          <div className="float-right"><TransBadge text={t('feat.f2.tr2')} dark /></div>
        </div>
        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[.57rem] font-bold shrink-0 text-white" style={{ background: C.blue700 }}>VN</div>
      </div>
      {/* Left msg */}
      <div className="flex items-end gap-[.45rem]">
        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[.57rem] font-bold shrink-0" style={{ background: '#EFF6FF', color: '#2563EB' }}>KR</div>
        <div>
          <div className="max-w-[72%] px-[.82rem] py-[.52rem] rounded-xl rounded-bl-[3px] bg-white text-[.79rem] leading-[1.5]" style={{ border: `1px solid ${C.slate200}`, color: C.slate700 }}>{t('feat.f2.msg3')}</div>
          <TransBadge text={t('feat.f2.tr3')} />
        </div>
      </div>
    </div>
  );
}

function ReportCard({ t }: { t: (k: string) => string }) {
  return (
    <div className="relative z-[1] w-full">
      <div className="bg-white rounded-t-[9px] px-[.95rem] py-[.65rem] flex items-center gap-[.42rem]" style={{ border: `1px solid ${C.slate200}` }}>
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: '#EF4444' }} />
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: '#F59E0B' }} />
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: '#10B981' }} />
        <span className="text-[.69rem] ml-[.4rem]" style={{ color: C.slate400 }}>{t('feat.f3.rtitle')}</span>
      </div>
      <div className="bg-white rounded-b-[9px] p-[.85rem]" style={{ border: `1px solid ${C.slate200}`, borderTop: 'none' }}>
        {[['f3.r1k', 'f3.r1v'], ['f3.r2k', 'f3.r2v'], ['f3.r3k', 'f3.r3v']].map(([kk, vk], i) => (
          <div key={i} className="flex items-center gap-2 py-[.36rem] text-[.78rem]" style={{ borderBottom: i < 2 ? `1px solid ${C.slate100}` : 'none' }}>
            <span style={{ color: C.slate400 }}>{t(`feat.${kk}`)}</span>
            <strong className="ml-auto" style={{ color: C.slate700 }}>{t(`feat.${vk}`)}</strong>
          </div>
        ))}
        <div className="flex items-center gap-[.35rem] mt-[.6rem] px-[.7rem] py-[.5rem] rounded-[7px] text-[.76rem]" style={{ background: C.blue50, border: `1px solid ${C.blue100}`, color: C.blue700 }}>
          <span className="ama-typing-dot" style={{ background: C.blue500 }} />
          <span className="ama-typing-dot" style={{ background: C.blue500 }} />
          <span className="ama-typing-dot" style={{ background: C.blue500 }} />
          <span className="ml-[.22rem]">{t('feat.f3.typing')}</span>
        </div>
      </div>
    </div>
  );
}

function AppGrid({ t }: { t: (k: string) => string }) {
  const apps = [
    { n: 'feat.f4.a1n', d: 'feat.f4.a1d', badge: 'feat.f4.a1b', iconBg: '#EFF6FF', iconStroke: '#2563EB', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={1.5}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
    { n: 'feat.f4.a2n', d: 'feat.f4.a2d', iconBg: '#F0FDF4', iconStroke: '#16A34A', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={1.5}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg> },
    { n: 'feat.f4.a3n', d: 'feat.f4.a3d', badge: undefined, iconBg: '#FFF7ED', iconStroke: '#EA580C', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={1.5}><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg>, newBadge: true },
    { n: 'feat.f4.a4n', d: 'feat.f4.a4d', iconBg: '#F5F3FF', iconStroke: '#7C3AED', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg> },
  ];
  return (
    <div className="relative z-[1] grid grid-cols-2 gap-2 w-full max-sm:grid-cols-1">
      {apps.map((a, i) => (
        <div key={i} className="bg-white rounded-[9px] p-3 flex items-center gap-2 transition-shadow hover:shadow-md" style={{ border: `1px solid ${C.slate200}` }}>
          <div className="w-8 h-8 rounded-[7px] flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4" style={{ background: a.iconBg }}>{a.icon}</div>
          <div>
            <h5 className="text-[.74rem] font-semibold" style={{ color: C.slate800 }}>{t(a.n)}</h5>
            <p className="text-[.66rem] mt-[.08rem]" style={{ color: C.slate400 }}>{t(a.d)}</p>
          </div>
          {a.badge && <span className="ml-auto text-[.59rem] font-bold px-[.38rem] py-[.12rem] rounded-[3px] text-white whitespace-nowrap" style={{ background: C.blue600 }}>{t(a.badge)}</span>}
          {a.newBadge && <span className="ml-auto text-[.59rem] font-bold px-[.38rem] py-[.12rem] rounded-[3px] text-white whitespace-nowrap" style={{ background: C.blue600 }}>NEW</span>}
        </div>
      ))}
    </div>
  );
}

/* ═══ Feature Block ═══ */
function FeatureBlock({ num, title, desc, tags, visual, flip, t }: {
  num: string; title: string; desc: string; tags: string[]; visual: React.ReactNode; flip?: boolean; t: (k: string) => string;
}) {
  return (
    <Reveal>
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-[5rem] items-center py-16 ${flip ? 'md:[direction:rtl] md:[&>*]:[direction:ltr]' : ''}`} style={{ borderBottom: `1px solid ${C.slate100}` }}>
        <div className="flex flex-col gap-[1.1rem]">
          <span className="font-mono-jb text-[.68rem] font-semibold tracking-[.1em]" style={{ color: C.blue500 }}>{t(num)}</span>
          <h3 className="font-sora font-bold text-[clamp(1.3rem,2.2vw,1.8rem)] leading-[1.2] whitespace-pre-line" style={{ color: C.slate900 }}>{t(title)}</h3>
          <p className="text-[.91rem] leading-[1.82]" style={{ color: C.slate500 }}>{t(desc)}</p>
          <div className="flex flex-wrap gap-[.38rem]">
            {tags.map((tag, i) => (
              <span key={i} className="px-[.65rem] py-[.24rem] rounded-[5px] text-[.7rem] font-semibold" style={{ background: C.blue50, color: C.blue700, border: `1px solid ${C.blue100}` }}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-[1.7rem] min-h-[280px] flex items-center justify-center relative overflow-hidden" style={{ background: C.slate50, border: `1px solid ${C.slate200}` }}>
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(59,130,246,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.03) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
          {visual}
        </div>
      </div>
    </Reveal>
  );
}

/* ═══ Cycle Node SVG Icons ═══ */
const CYCLE_ICONS = [
  <svg key="exp" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>,
  <svg key="share" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
  <svg key="info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>,
  <svg key="know" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" /></svg>,
  <svg key="edge" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><polyline points="22,7 13.5,15.5 8.5,10.5 2,17" /><polyline points="16,7 22,7 22,13" /></svg>,
];

/* ═══ Tech Stack Icons ═══ */
const TECH_ICONS = [
  <svg key="fe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  <svg key="be" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>,
  <svg key="db" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
  <svg key="ai" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="3" /><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" /></svg>,
];

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith('ko') ? 'ko' : i18n.language?.startsWith('vi') ? 'vi' : 'en') as LangCode;

  const t = useCallback((key: string): string => {
    const val = T[lang]?.[key] ?? T.en?.[key] ?? key;
    return typeof val === 'string' ? val : key;
  }, [lang]);

  const ta = useCallback((key: string): string[] => {
    const val = T[lang]?.[key] ?? T.en?.[key] ?? [];
    return Array.isArray(val) ? val : [];
  }, [lang]);

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    window.gtag?.('event', 'landing_page_view');
    trackServerEvent({ event_type: 'page_view', page_path: '/', referrer: document.referrer || undefined });
  }, []);

  /* ── Tech stack data ── */
  const techData = [
    { title: 'Frontend', icon: TECH_ICONS[0], items: ['React 18 + TypeScript 5', 'TailwindCSS 3 + Vite 5', 'Zustand + TanStack Query', 'i18next (EN/KO/VI)'] },
    { title: 'Backend', icon: TECH_ICONS[1], items: ['NestJS 10 + TypeORM 0.3', 'JWT httpOnly Cookie', 'Helmet + CORS + RBAC', 'AES-256-GCM'] },
    { title: 'Database', icon: TECH_ICONS[2], items: ['PostgreSQL 15', 'pgvector (Vector Search)', 'pg_trgm (Text Search)', t('tech.db4')] },
    { title: t('tech.ai'), icon: TECH_ICONS[3], items: ['Anthropic Claude API', 'SSE Streaming', 'Google Drive API', 'Gmail SMTP'] },
  ];

  /* ── Cycle nodes ── */
  const cycleNodes = Array.from({ length: 5 }, (_, i) => ({
    icon: CYCLE_ICONS[i],
    label: t(`cycle.n${i + 1}`),
    sub: t(`cycle.n${i + 1}s`),
  }));

  /* ── Stats ── */
  const statsData = [
    { num: '10', unit: t('stats.u1'), label: t('stats.l1') },
    { num: '7', unit: t('stats.u2'), label: t('stats.l2') },
    { num: '3', unit: t('stats.u3'), label: t('stats.l3') },
    { label: t('stats.l4'), iconIdx: 3 },
    { label: t('stats.l5'), iconIdx: 4 },
  ];

  return (
    <div className="font-dm" style={{ background: '#fff', color: C.slate900, WebkitFontSmoothing: 'antialiased' }}>
      <PageHead path="/" />

      {/* ═══ HERO / PAIN SLIDER ═══ */}
      <div id="why" className="relative overflow-hidden" style={{ padding: '96px 0 72px', background: C.navy }}>
        {/* Grid background */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Glow */}
        <div className="absolute w-[600px] h-[600px] -top-[150px] -right-[100px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,.16) 0%, transparent 65%)' }} />

        <Reveal>
          <div className="relative z-[2] px-[6vw] mb-10">
            <SectionLabel light>{t('pain.label')}</SectionLabel>
            <h2 className="font-sora font-extrabold text-white leading-[1.1] mb-2" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)' }}>{t('pain.title')}</h2>
            <p className="text-base leading-[1.7]" style={{ color: C.slate400 }}>{t('pain.sub')}</p>
          </div>
        </Reveal>

        <PainSlider t={t} />

        {/* 서비스 미리보기 버튼 */}
        <Reveal delay={200}>
          <div className="flex justify-center gap-3 pt-10 relative z-[2]">
            <button
              onClick={() => setShowPreview(true)}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-[.95rem] transition-all duration-300 hover:scale-[1.04] hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(37,99,235,.35)',
              }}
            >
              <Play size={18} className="transition-transform group-hover:scale-110" />
              {t('preview.btn')}
            </button>
            <Link
              to="/register"
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-[.95rem] transition-all duration-300 hover:scale-[1.04] hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(249,115,22,.35)',
              }}
            >
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              {t('freetrial.btn')}
            </Link>
          </div>
        </Reveal>
      </div>

      {/* 서비스 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShowPreview(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-[95vw] h-[90vh] max-w-[1400px] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900/80 text-white text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              <X size={16} />
              {t('preview.close')}
            </button>
            <iframe
              src="/service/ama/AMA_WorkTools_animated.html"
              className="w-full h-full border-0"
              title="AMA Service Preview"
            />
          </div>
        </div>
      )}

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="bg-white" style={{ padding: '88px 6vw' }}>
        <Reveal>
          <SectionLabel>{t('feat.label')}</SectionLabel>
          <p className="font-sora font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 mb-2" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}>{t('feat.reborn')}</p>
          <h2 className="font-sora font-bold leading-[1.15] mb-[.6rem]" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.5rem)', color: C.slate900 }}>{t('feat.title')}</h2>
          <p className="text-[.97rem] leading-[1.75] max-w-[520px]" style={{ color: C.slate500 }}>{t('feat.sub')}</p>
        </Reveal>

        <FeatureBlock num="feat.f1.num" title="feat.f1.title" desc="feat.f1.desc" tags={ta('feat.f1.tags') as string[]} visual={<MissionFlow t={t} />} t={t} />
        <FeatureBlock num="feat.f2.num" title="feat.f2.title" desc="feat.f2.desc" tags={ta('feat.f2.tags') as string[]} visual={<ChatBubbles t={t} />} flip t={t} />
        <FeatureBlock num="feat.f3.num" title="feat.f3.title" desc="feat.f3.desc" tags={ta('feat.f3.tags') as string[]} visual={<ReportCard t={t} />} t={t} />
        <FeatureBlock num="feat.f4.num" title="feat.f4.title" desc="feat.f4.desc" tags={ta('feat.f4.tags') as string[]} visual={<AppGrid t={t} />} flip t={t} />
      </section>

      {/* ═══ GUIDE ═══ */}
      <section id="guide" style={{ background: C.slate50, padding: '88px 6vw' }}>
        <Reveal>
          <SectionLabel>{t('guide.label')}</SectionLabel>
          <h2 className="font-sora font-bold leading-[1.15] mb-[.6rem]" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.5rem)', color: C.slate900 }}>{t('guide.title')}</h2>
          <p className="text-[.97rem] leading-[1.75] max-w-[520px]" style={{ color: C.slate500 }}>{t('guide.sub')}</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[.9rem] mt-[2.2rem]">
          {[
            { key: 'g1', slug: 'user-guide', icon: '📖' },
            { key: 'g2', slug: 'user-manual', icon: '📋' },
            { key: 'g3', slug: 'smart-todo', icon: '✅' },
            { key: 'g4', slug: 'work-tools', icon: '🛠️' },
            { key: 'g5', slug: 'google-drive', icon: '📁' },
            { key: 'g6', slug: 'app-install', icon: '📲' },
            { key: 'g7', slug: 'car-manager', icon: '🚗' },
          ].map((g, i) => (
            <Reveal key={i} delay={i * 80}>
              <Link
                to={`/guide/${g.slug}`}
                className="group flex flex-col gap-3 rounded-xl bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ border: `1px solid ${C.slate200}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{g.icon}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.blue500 }} />
                </div>
                <div>
                  <h4 className="font-sora font-semibold text-[.9rem] mb-1" style={{ color: C.slate800 }}>{t(`guide.${g.key}`)}</h4>
                  <p className="text-[.78rem] leading-[1.5]" style={{ color: C.slate500 }}>{t(`guide.${g.key}d`)}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ CYCLE ═══ */}
      <section id="cycle" className="text-white" style={{ background: C.slate900, padding: '88px 6vw' }}>
        <Reveal>
          <SectionLabel light>{t('cycle.label')}</SectionLabel>
          <h2 className="font-sora font-bold text-white leading-[1.15] mb-[.6rem] whitespace-pre-line" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.5rem)' }}>{t('cycle.title')}</h2>
          <p className="text-[.97rem] leading-[1.75]" style={{ color: C.slate400 }}>{t('cycle.sub')}</p>
        </Reveal>
        <Reveal delay={200}>
          <div className="flex items-center justify-center flex-wrap mt-[3.2rem] max-sm:flex-col">
            {cycleNodes.map((n, i) => (
              <div key={i} className="flex items-center max-sm:flex-col">
                <div className="flex flex-col items-center gap-[.6rem] text-center px-[1.2rem]">
                  <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-[1.07] [&>svg]:w-[26px] [&>svg]:h-[26px]" style={{ border: '1.5px solid rgba(96,165,250,.28)', background: 'rgba(37,99,235,.1)', color: C.blue400 }}>
                    {n.icon}
                  </div>
                  <span className="text-[.78rem] font-semibold" style={{ color: C.slate300 }}>{n.label}</span>
                  <span className="text-[.68rem] -mt-[.18rem]" style={{ color: C.slate500 }}>{n.sub}</span>
                </div>
                {i < cycleNodes.length - 1 && (
                  <span className="text-[1.25rem] px-1 self-center max-sm:rotate-90 max-sm:py-1 max-sm:px-0" style={{ color: C.slate500, paddingBottom: '1.8rem' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-10 text-center px-[2.3rem] py-[1.6rem] rounded-[14px] max-w-[560px] mx-auto" style={{ border: '1px solid rgba(96,165,250,.18)', background: 'rgba(37,99,235,.07)' }}>
            <h3 className="font-sora font-bold text-[1.1rem] mb-[.48rem]" style={{ color: C.blue400 }}>{t('cycle.rh')}</h3>
            <p className="text-[.85rem] leading-[1.75] whitespace-pre-line" style={{ color: C.slate400 }}>{t('cycle.rp')}</p>
          </div>
        </Reveal>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ background: C.blue50, padding: '88px 6vw' }}>
        <Reveal>
          <SectionLabel>{t('stats.label')}</SectionLabel>
          <h2 className="font-sora font-bold leading-[1.15] mb-[.6rem]" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.5rem)', color: C.slate900 }}>{t('stats.title')}</h2>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[1.1rem] mt-[2.4rem]">
          {statsData.map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center gap-2" style={{ border: `1px solid ${C.slate200}` }}>
                {s.num ? (
                  <div className="font-sora font-extrabold text-[2.2rem] tracking-tight leading-none" style={{ color: C.blue600 }}>
                    {s.num}<span className="text-[.88rem] font-semibold" style={{ color: C.blue400 }}>{s.unit}</span>
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5" style={{ background: C.blue50, border: `1.5px solid ${C.blue100}`, color: C.blue600 }}>
                    {TECH_ICONS[s.iconIdx!]}
                  </div>
                )}
                <p className="text-[.79rem] leading-[1.5] whitespace-pre-line" style={{ color: C.slate500 }}>{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ TECH ═══ */}
      <section className="bg-white" style={{ padding: '88px 6vw' }}>
        <Reveal>
          <SectionLabel>{t('tech.label')}</SectionLabel>
          <h2 className="font-sora font-bold leading-[1.15] mb-[.6rem]" style={{ fontSize: 'clamp(1.7rem, 3vw, 2.5rem)', color: C.slate900 }}>{t('tech.title')}</h2>
          <p className="text-[.97rem] leading-[1.75] max-w-[520px]" style={{ color: C.slate500 }}>{t('tech.sub')}</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[.9rem] mt-[2.2rem]">
          {techData.map((td, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="rounded-[11px] p-[1.35rem]" style={{ border: `1px solid ${C.slate200}` }}>
                <div className="flex items-center gap-2 mb-[.8rem] [&>svg]:w-[15px] [&>svg]:h-[15px]" style={{ color: C.blue500 }}>
                  {td.icon}
                  <h4 className="font-sora font-semibold text-[.85rem]" style={{ color: C.slate700 }}>{td.title}</h4>
                </div>
                <div className="flex flex-col gap-1">
                  {td.items.map((item, j) => (
                    <span key={j} className="font-mono-jb text-[.75rem] px-[.45rem] py-[.18rem] rounded" style={{ color: C.slate500, background: C.slate50 }}>{item}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="contact" className="relative text-center overflow-hidden" style={{ background: C.navy, padding: '88px 6vw' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, rgba(37,99,235,.2) 0%, transparent 70%)' }} />
        <Reveal>
          <div className="relative z-[2] max-w-[580px] mx-auto">
            <h2 className="font-sora font-extrabold text-white leading-[1.15] mb-[.8rem]" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.7rem)' }}>{t('cta.title')}</h2>
            <p className="text-[.97rem] leading-[1.75] mb-7 whitespace-pre-line" style={{ color: C.slate400 }}>{t('cta.desc')}</p>
            <div className="flex gap-[.8rem] justify-center flex-wrap">
              <Link
                to="/register"
                onClick={() => window.gtag?.('event', 'cta_register_click', { location: 'bottom_cta' })}
                className="flex items-center gap-[.42rem] px-[1.8rem] py-[.85rem] rounded-[9px] font-bold text-[.93rem] transition-all hover:-translate-y-[2px]"
                style={{ background: '#fff', color: C.blue700, boxShadow: '0 4px 18px rgba(0,0,0,.2)' }}
              >
                <ArrowRight size={16} />
                {t('cta.btn1')}
              </Link>
              <a
                href="mailto:contact@amoeba.group"
                className="flex items-center gap-[.42rem] px-[1.6rem] py-[.85rem] rounded-[9px] font-medium text-[.93rem] transition-all hover:bg-white/[.06]"
                style={{ background: 'transparent', color: C.slate300, border: '1px solid rgba(255,255,255,.18)' }}
              >
                {t('cta.btn2')}
              </a>
            </div>
            <p className="mt-5 text-[.76rem]" style={{ color: C.slate500 }}>📧 contact@amoeba.group &nbsp;·&nbsp; 🌐 https://a.amoeba.site</p>
          </div>
        </Reveal>
      </section>


    </div>
  );
}
