# Menu-Sitemap-Detail.md 현행 시스템 갭 분석

> **분석일**: 2026-02-18 (rev.2 — 최근 uncommitted 변경사항 반영)
> **대상 문서**: docs/Menu-Sitemap-Detail.md v1.0.0
> **분석 범위**: 프론트엔드(apps/web) + 백엔드(apps/api) 전체

---

## 1. 분석 요약

| 항목 | 수치 |
|------|------|
| 스펙 정의 페이지 수 | ~79 |
| 시스템 실제 페이지 수 | ~87 (스펙 외 서비스관리 8페이지 포함) |
| 완전 구현(FULL) | 50 (57%) |
| 부분 구현(PARTIAL) | 35 (40%) |
| 스텁/플레이스홀더 | 1 (1%) |
| 미구현 | 0 |

**결론**: 라우트/페이지/백엔드 API는 거의 전부 구현되어 있으나, **1개 페이지(아메바톡)가 스텁 상태**이며 **CHAT/설정 라우트의 MenuGuard 적용이 불완전**합니다.

---

## 2. 최근 변경사항 반영 (Uncommitted Changes)

> ⚠️ rev.1에서 놓쳤던 중요 사항들을 git diff 기반으로 보정합니다.

### 2.1 최근 추가/수정된 모듈

| 변경 | 영향 범위 | 상세 |
|------|----------|------|
| **서비스관리 모듈 신규 구현** | BE 전체 + FE 전체 | `apps/api/src/domain/service-management/` (BE 3컨트롤러, 3서비스, 7엔티티), `apps/web/src/domain/service-management/` (FE 8페이지, 3훅, 3서비스) |
| **권한 시스템 고도화** | BE settings + FE settings | MenuConfig(메뉴 활성/정렬), UserMenuPermission(사용자별 권한), 3-tab 관리 UI |
| **MenuGuard 라우트 적용** | FE router | 기존 미적용 → 주요 14개 라우트에 MenuGuard 추가 |
| **MainLayout 동적 메뉴** | FE layout | 하드코딩 메뉴 → API 기반 `useMyMenus()` 동적 렌더링 |
| **DEFAULT_MENU_CONFIGS** | BE menu-config | 14개 메뉴 기본 설정 등록 (SERVICE_MANAGEMENT 포함) |
| **app.module.ts** | BE 전역 | ServiceManagementModule import + 7개 엔티티 등록 |
| **i18n** | FE 국제화 | `service` 네임스페이스 추가 (en/ko/vi) |

### 2.2 rev.1 분석 오류 정정

| 항목 | rev.1 (오류) | rev.2 (정정) |
|------|------------|------------|
| SERVICE_MANAGEMENT | "메뉴 코드만 존재, 기능 없음" (G-05) | **완전 구현됨** — BE 모듈 + FE 8페이지 + 라우트 + MenuGuard + i18n |
| DEFAULT_MENU_CONFIGS | "13개 메뉴만 포함" | **14개 메뉴** 포함 (SERVICE_MANAGEMENT 추가) |
| MenuGuard 적용 | "17개 라우트만 적용" | **18개 라우트** 적용 (service 추가) |
| 시스템 메뉴 코드 | 31개 | 31개 (정확, 변동 없음) |
| G-05 갭 항목 | "LOW 우선순위" | **삭제** — 해당 없음 |

---

## 3. 도메인별 구현 상태 (수정)

### 3.1 완전 구현 도메인

| 도메인 | 페이지 수 | 백엔드 | 프론트엔드 | 비고 |
|--------|-----------|--------|-----------|------|
| Dashboard | 1 | ✅ | ✅ FULL | 주요 지표, 최근 활동 |
| TODO | 1 | ✅ | ✅ FULL | CRUD + 필터 |
| Work Items | 1 | ✅ | ✅ PARTIAL | ACL 작업 항목 |
| AI 에이전트 | 1 | ✅ | ✅ FULL | 9개 부서 목록 |
| Chat | 10 | ✅ | ✅ FULL | SSE 스트리밍, 대화 이력 |
| 회의록 | 2 | ✅ | ✅ PARTIAL | 목록 + 상세 |
| 근무일정 | 1 | ✅ | ✅ FULL | 캘린더 기반 |
| 공지사항 | 2 | ✅ | ✅ PARTIAL | 목록 + 상세 |
| 문서관리 | 1 | ✅ | ✅ FULL | Google Drive 연동 |
| 회계관리 | 2 | ✅ | ✅ FULL | 계좌 + 거래내역 |
| 인사관리 | 16 | ✅ | ✅ 혼합 | VN+KR 급여, 근태, 퇴직금 |
| 계약/거래처 | 14 | ✅ | ✅ 혼합 | P&L 전체 사이클 |
| 웹메일 | 6 | ✅ | ✅ 혼합 | Postal 연동, IMAP+SMTP |
| 프로젝트 | 5 | ✅ | ✅ 혼합 | AI 제안서, 승인 워크플로우 |
| KMS | 3 | ✅ | ✅ 혼합 | 태그 클라우드, 지식 그래프 |
| 설정 | 8 | ✅ | ✅ 혼합 | 권한, API키, SMTP, Drive 등 |
| 인증 | 4 | ✅ | ✅ FULL | JWT, 비밀번호 재설정 |
| **서비스관리** | **8** | ✅ | ✅ **FULL** | **신규 — 서비스카탈로그, 고객, 구독 관리** |

### 3.2 미구현 / 스텁 항목

| # | 도메인 | 페이지 | 현재 상태 | 스펙 요구사항 | 심각도 |
|---|--------|--------|----------|-------------|--------|
| 1 | 아메바톡 | AmoebaTalkPage | **STUB** (18줄, "Coming Soon") | 사내 실시간 메시지 커뮤니케이션 | **HIGH** |

---

## 4. 권한 시스템 갭 분석 (수정)

### 4.1 MenuGuard 라우트 보호 현황

**적용됨 (18개 라우트)** — 최근 변경으로 대폭 개선:
- TODO, WORK_ITEMS, AGENTS, MEETING_NOTES, AMOEBA_TALK
- WORK_SCHEDULE, NOTICES, DOCUMENTS, ACCOUNTING
- HR, MAIL, BILLING, PROJECT_MANAGEMENT, KMS
- **SERVICE_MANAGEMENT** (신규)

**미적용 (여전히 문제)**:

| 라우트 | 현재 보호 방식 | 스펙 권한 코드 | 문제점 |
|--------|--------------|--------------|--------|
| `/chat/:department` | 없음 | `CHAT_*` (9개) | 부서별 에이전트 접근 제어 없음 |
| `/settings/api-keys` | `AdminRoute` | `SETTINGS_API_KEYS` | MenuGuard 대신 역할 하드코딩 |
| `/settings/members` | `ManagerRoute` | `SETTINGS_MEMBERS` | MenuGuard 대신 역할 하드코딩 |
| `/settings/smtp` | `AdminRoute` | `SETTINGS_SMTP` | MenuGuard 대신 역할 하드코딩 |
| `/settings/permissions` | `AdminRoute` | `SETTINGS_PERMISSIONS` | MenuGuard 대신 역할 하드코딩 |
| `/settings/drive` | `AdminRoute` | `SETTINGS_DRIVE` | MenuGuard 대신 역할 하드코딩 |
| `/settings/entities` | `AdminRoute` | `SETTINGS_ENTITIES` | MenuGuard 대신 역할 하드코딩 |
| `/settings/departments` | `AdminRoute` | `DEPARTMENTS` | MenuGuard 대신 역할 하드코딩 |

### 4.2 사이드 임팩트: Settings 라우트 MenuGuard 전환 시 주의사항

**위험**: 설정 라우트를 `AdminRoute` → `MenuGuard`로 전환하면:
- 현재 `AdminRoute`는 역할이 ADMIN이 아니면 `/`로 리다이렉트
- `MenuGuard`는 `useMyMenus()` API 결과 기반으로 판단
- **전환 시 백엔드 `getMyMenus()`에서 SETTINGS_* 메뉴를 정상 반환하는지 확인 필수**
- 현재 `DEFAULT_MENU_CONFIGS`에는 SETTINGS_* 메뉴가 **포함되어 있지 않음** (14개 중 SETTINGS_* 없음)
- → **MenuGuard 전환 전에 SETTINGS_* 메뉴를 DEFAULT_MENU_CONFIGS에 추가해야 함**

### 4.3 사이드 임팩트: CHAT 라우트 MenuGuard 적용 시 주의사항

**문제점**: 현재 `/chat/:department` 라우트는 URL의 department 값이 동적
- 단일 `MenuGuard menuCode="CHAT_*"`로는 처리 불가
- department → CHAT_MANAGEMENT 등의 매핑 로직 필요
- `ChatMenuGuard` 전용 컴포넌트 필요 (useParams + 매핑)

---

## 5. 백엔드 API 구현 상태 (수정)

| 도메인 | 모듈 | 컨트롤러 | 서비스 | 엔티티 | 상태 |
|--------|------|---------|--------|--------|------|
| auth | ✅ | ✅ | ✅ | ✅ | FULL |
| chat | ✅ | ✅ | ✅ | ✅ | FULL |
| agent | ✅ | - | ✅ (11) | - | FULL |
| dashboard | ✅ | ✅ | ✅ | - | FULL |
| todo | ✅ | ✅ | ✅ | ✅ | FULL |
| work-items (ACL) | ✅ | ✅ (3) | ✅ (5) | ✅ (4) | FULL |
| meeting-notes | ✅ | ✅ | ✅ | ✅ | FULL |
| **amoeba-talk** | ❌ | ❌ | ❌ | ❌ | **MISSING** |
| work-schedule | ✅ | ✅ | ✅ | ✅ | FULL |
| notices | ✅ | ✅ | ✅ | ✅ (3) | FULL |
| documents (drive) | ✅ | ✅ | ✅ | ✅ | FULL |
| accounting | ✅ | ✅ (2) | ✅ (2) | ✅ (2) | FULL |
| hr | ✅ | ✅ (15) | ✅ (25) | ✅ (19) | FULL |
| billing | ✅ | ✅ (8) | ✅ (15) | ✅ (9) | FULL |
| mail (webmail) | ✅ | ✅ | ✅ (7) | ✅ (4) | FULL |
| project | ✅ | ✅ (2) | ✅ (4) | ✅ (4) | FULL |
| kms | ✅ | ✅ (3) | ✅ (14) | ✅ (4) | FULL |
| settings | ✅ | ✅ (5) | ✅ (7) | ✅ (6) | FULL |
| department | ✅ | ✅ | ✅ (3) | ✅ (2) | FULL |
| members | ✅ | ✅ (2) | ✅ (2) | ✅ (2) | FULL |
| invitation | ✅ | ✅ | ✅ | ✅ | FULL |
| **service-management** | ✅ | ✅ (3) | ✅ (3) | ✅ (7) | **FULL (신규)** |

---

## 6. 우선순위별 갭 목록 (수정)

### Priority 1 (HIGH) — 핵심 기능 미구현

| # | 항목 | 설명 | 영향도 |
|---|------|------|--------|
| G-01 | 아메바톡 프론트엔드 구현 | 스텁 → 실시간 메시지 UI | 사용자 커뮤니케이션 불가 |
| G-02 | 아메바톡 백엔드 API | 모듈/컨트롤러/서비스/엔티티 전체 신규 | 기능 동작 불가 |

### Priority 2 (MEDIUM) — 보안/권한 개선

| # | 항목 | 설명 | 사이드 임팩트 |
|---|------|------|-------------|
| G-03 | CHAT 라우트 MenuGuard | ChatMenuGuard 전용 컴포넌트 필요 | department→CHAT_* 매핑 로직 필요 |
| G-04 | 설정 라우트 MenuGuard 전환 | AdminRoute → MenuGuard | **⚠️ SETTINGS_* 메뉴가 DEFAULT_MENU_CONFIGS에 없음 → 추가 필수** |

### ~~Priority 3 (LOW) — G-05 삭제~~

~~G-05: SERVICE_MANAGEMENT 정리~~ → **삭제 (이미 완전 구현됨)**

---

## 7. 스펙 문서 정합성

Menu-Sitemap-Detail.md 문서 자체에 다음 항목이 누락되어 있음:

| 누락 항목 | 설명 |
|----------|------|
| 서비스관리 메뉴 | `/service/*` 8개 페이지 (Dashboard, Services, Clients, Subscriptions) |
| SERVICE_MANAGEMENT 권한코드 | 섹션 6 권한 코드 목록에 포함되어 있으나, 섹션 4 서브메뉴 상세에 없음 |

---

## 8. 결론

현행 시스템은 Menu-Sitemap-Detail.md 스펙의 **약 98%를 구현**하고 있으며, 스펙 범위 외에도 서비스관리 모듈이 추가 구현되어 있습니다.

**남은 갭은 3가지**:
1. **아메바톡(Amoeba Talk)**: 프론트엔드 스텁 + 백엔드 미구현 → 실시간 사내 메시징 전체 개발 필요
2. **CHAT 라우트 MenuGuard**: ChatMenuGuard 전용 컴포넌트 개발 필요
3. **설정 라우트 MenuGuard 전환**: DEFAULT_MENU_CONFIGS에 SETTINGS_* 추가가 선행 조건
