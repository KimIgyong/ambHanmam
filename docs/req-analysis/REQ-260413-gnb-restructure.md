# REQ-260413-gnb-restructure

## 1. 개요

| 항목 | 내용 |
|------|------|
| 문서번호 | REQ-260413-gnb-restructure |
| 작성일 | 2026-04-13 |
| 기능명 | GNB/LNB 메뉴 구조 재편 |
| 요청자 | 프로젝트 관리자 |
| 상태 | 확정 |

## 2. 배경 및 목적

기존 메뉴 체계에서 **나의업무** GNB가 없었으며, 개인 업무 도구(일정공유, 자원예약, 업무연락 등)가 `AMA업무도구` 하위에 혼재되어 있었다. 사용자 역할·목적별 메뉴 분리를 통해 UX를 개선하고, 협업 도구(AMA)와 개인 업무 관리(My Work)를 명확히 구분한다.

## 3. 요구사항

### 3.1 GNB 순서 변경

| 순번 | GNB Key | 레이블 | 변경사항 |
|------|---------|--------|---------|
| 1 | management | 경영정보 | 순서 유지 |
| 2 | sales | 영업업무 | 순서 유지 |
| 3 | service | 서비스업무 | 순서 유지 |
| 4 | support | 업무지원 | 순서 유지 |
| 5 | **my-work** | **나의업무** | **신규 추가** |
| 6 | ama-tools | AMA업무도구 | 순서 이동 (기존 5번 → 6번) |

### 3.2 나의업무 (my-work) LNB 구성

> 경로 패턴: `/my-work/{slug}`

| 레이블 | 경로 | 기존 경로 |
|--------|------|---------|
| 일정공유 | `/my-work/schedule` | `/ama-tools/schedule` |
| 공용자원예약 | `/my-work/reservation` | `/ama-tools/reservation` |
| 나의업무 | `/my-work/daily-tasks` | `/ama-tools/daily-tasks` |
| 업무연락 | `/my-work/business-calls` | `/ama-tools/business-calls` |
| 전자결재 | `/my-work/approval` | `/ama-tools/approval` |
| 쪽지 | `/my-work/messages` | `/ama-tools/messages` |
| AI 채팅 | `/my-work/ai-chat` | `/ama-tools/ai-chat` |

### 3.3 AMA업무도구 (ama-tools) LNB 구성

> 경로 패턴: `/ama-tools/{slug}`  
> 기존 개인 업무 항목들은 my-work로 이동하고, 아래 항목들로 완전 교체한다.

| 레이블 | 경로 | 비고 |
|--------|------|------|
| Today / 오늘 | `/ama-tools/today` | 신규 |
| Task / 나의할일 | `/ama-tools/tasks` | 신규 |
| Issue / 이슈 | `/ama-tools/issues` | 신규 |
| Project / 프로젝트 | `/ama-tools/projects` | 신규 |
| 로비채팅 / Lobby Chat | `/ama-tools/lobby-chat` | 신규 |
| 노트 / Notes | `/ama-tools/notes` | 신규 |
| Calendar / 캘린더 | `/ama-tools/calendar` | 신규 |
| Attendance / 출퇴근 | `/ama-tools/attendance` | 신규 |
| Drive / 드라이브 | `/ama-tools/drive` | 신규 |
| My Leave / 내휴가 | `/ama-tools/my-leave` | 신규 |

## 4. 비기능 요구사항

| 항목 | 내용 |
|------|------|
| 하위 호환 | 기존 `/ama-tools/schedule` 등 이전 경로 접근 시 404 허용 (인트라넷, 북마크 없음) |
| 활성 상태 표시 | 사이드바에서 현재 GNB 선택 강조(bg-blue-50) 유지 |
| 리다이렉트 | `/my-work` → `/my-work/schedule`, `/ama-tools` → `/ama-tools/today` |
| LNB 바로가기 | `LNB_MY_TASKS` 링크를 `/my-work/daily-tasks` 로 수정 |

## 5. 영향 범위

| 파일 | 변경 유형 |
|------|---------|
| `frontend/src/features/navigation/menu.config.ts` | GnbKey 타입, GNB_ITEMS 순서, GNB_SUB_MENUS 경로, LNB_MY_TASKS 경로 수정 |
| `frontend/src/app/(main)/my-work/**/page.tsx` | 신규 디렉토리 생성 및 페이지 이동 |
| `frontend/src/app/(main)/ama-tools/**/page.tsx` | 기존 개인업무 페이지 삭제, 신규 AMA 페이지 생성 |
| `frontend/src/app/(main)/my-work/page.tsx` | 인덱스 리다이렉트 생성 |
| `frontend/src/app/(main)/ama-tools/page.tsx` | 리다이렉트 경로 변경 (`/ama-tools/today`) |

## 6. 제약사항 및 가정

- 현 구현은 목업 데이터 기반이므로 실제 API 연동 시 재검토 불필요
- AMA업무도구 신규 10개 항목은 MVP 단계에서 Placeholder UI로 구현
- 나의업무 7개 항목은 기존 구현 재사용 (경로 변경만)
