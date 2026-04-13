# 요구사항 분석서: 웹접근성 WCAG 2.1 AA 적용

- **문서번호**: REQ-웹접근성WCAG-AA적용-20260323
- **작성일**: 2026-03-23
- **상태**: 분석 완료
- **범위**: SYSTEM_LEVEL (프론트엔드 전체)
- **근거**: REPORT-개인정보보호-웹접근성-검토-20260323.md
- **관련 법규**: ADA Section 508 (미국), WCAG 2.1 Level AA (국제), EN 301 549 (EU)

---

## 1. 요구사항 요약

AMA 서비스의 유럽(EU) 및 미국(US) 지역 서비스 제공을 위해, **WCAG 2.1 Level AA** 기준을 충족하는 웹접근성 개선을 수행한다. 미국 **ADA Section 508**은 WCAG 2.1 AA를 참조 표준으로 채택하고 있으므로, WCAG AA 충족 시 ADA도 동시에 준수된다.

### 핵심 요구사항

| # | 요구사항 | 우선순위 | WCAG 기준 | 현황 |
|---|---------|---------|----------|------|
| A-1 | 스킵 내비게이션 (Skip Navigation) | 🔴 Critical | 2.4.1 (A) | ❌ 전혀 없음 |
| A-2 | 폼 접근성 (aria-invalid/required/describedby) | 🔴 Critical | 1.3.1, 3.3.1-2 (A) | ❌ 전혀 없음 |
| A-3 | 테이블 접근성 (caption/scope/aria-sort) | 🔴 Critical | 1.3.1 (A) | ❌ 전혀 없음 |
| A-4 | 모달 포커스 트랩 (Focus Trap) | 🔴 Critical | 2.4.3 (A) | ❌ 미구현 |
| A-5 | aria-live 동적 콘텐츠 알림 | 🟡 Important | 4.1.3 (AA) | ❌ 미구현 |
| A-6 | HTML lang 동적 전환 | 🟡 Important | 3.1.2 (AA) | ❌ 고정값 |
| A-7 | aria-expanded/controls (드롭다운) | 🟡 Important | 4.1.2 (A) | ❌ 미구현 |
| A-8 | prefers-reduced-motion 지원 | 🟢 Recommended | 2.3.3 (AAA) | ❌ 미구현 |
| A-9 | 색상 대비 검증 (axe-core) | 🟢 Recommended | 1.4.3 (AA) | ⚠️ 미검증 |

### 설계 원칙

1. **공유 컴포넌트 우선**: 개별 페이지 수정보다 공유 컴포넌트를 만들어 일괄 적용
2. **점진적 적용**: Level A 필수 항목부터 → Level AA → AAA 순서
3. **자동화 테스트**: axe-core 기반 CI 접근성 검증 파이프라인
4. **시맨틱 HTML 기본**: ARIA는 네이티브 HTML 시맨틱이 부족할 때만 보완

---

## 2. AS-IS 현황 분석

### 2.1 프론트엔드 앱 구조

| 앱 | 프레임워크 | 레이아웃 | 시맨틱 HTML 수준 |
|----|----------|---------|-----------------|
| apps/web | React 18 + TailwindCSS | AdminLayout, MainLayout, AuthLayout, SubMenuLayout, ClientLayout | ⚠️ 제한적 — `<div>` 위주, `<main>`/`<nav>` 부분 적용 |
| apps/portal-web | React 18 + TailwindCSS | PortalLayout, PublicLayout | ✅ 양호 — `<header>`, `<nav>`, `<main>`, `<aside>`, `<section>` 활용 |

### 2.2 기존 접근성 구현 현황

#### ✅ 이미 구현된 항목

| 항목 | 구현 | 파일 |
|------|------|------|
| aria-label | 알림벨, 로딩스피너, 닫기 버튼 | `NotificationBell.tsx`, `LoadingSpinner.tsx` |
| role="status" | 로딩 스피너 | `LoadingSpinner.tsx` |
| role="switch" | 파트너 관리 토글 | `PartnerManagementPage.tsx` |
| sr-only 텍스트 | 스크린 리더 전용 텍스트 | `LoadingSpinner.tsx`, `AgentConfigEditModal.tsx` |
| Enter 키 전송 | 채팅, 검색 | `TalkMessageInput.tsx`, `MessageInput.tsx` |
| Escape 닫기 | 채널 헤더, 이미지 라이트박스 | `ChannelHeader.tsx`, `ImageLightbox.tsx` |
| tabIndex | 이슈 아이템 | `IssueItem.tsx` |
| focus:ring | Tailwind 포커스 링 | 전역 |
| lang 속성 | `lang="ko"` (web), `lang="en"` (portal) | `index.html` |
| 뷰포트 | `width=device-width, initial-scale=1.0` | `index.html` |
| 다크 모드 | Tailwind `dark:` 클래스 | 전역 |

#### ❌ 미구현 항목 (상세)

| 항목 | 영향 범위 | 스크린 리더 영향 |
|------|----------|-----------------|
| 스킵 내비게이션 | 모든 페이지 (5개 레이아웃) | 매 페이지마다 전체 메뉴 반복 탐색 필요 |
| aria-invalid | 모든 폼 (추산 100+ 입력 필드) | 유효성 에러를 음성으로 인식 불가 |
| aria-required | 모든 필수 입력 필드 | 필수 여부를 시각적 `*`로만 판단 |
| aria-describedby | 모든 폼 에러 메시지 | 에러 메시지와 입력 필드 연결 안됨 |
| `<caption>` + `scope` | 모든 데이터 테이블 (30+ 페이지) | 테이블 구조를 파악 불가 |
| aria-live | 토스트, 검색 결과, AI 스트리밍 | 동적 변경을 인식 불가 |
| 포커스 트랩 | 모든 모달 (50+ 모달) | Tab으로 모달 외부 이탈 |
| aria-expanded | 드롭다운, 아코디언, 사이드바 | 펼침/접힘 상태 인식 불가 |
| htmlFor | 메인앱 폼 라벨 | 라벨 클릭 시 입력 필드 포커스 안됨 |
| lang 동적 갱신 | i18n 언어 전환 시 | 스크린 리더가 잘못된 언어로 읽음 |

### 2.3 공유 UI 컴포넌트 현황

| 컴포넌트 유형 | 현황 | 문제점 |
|-------------|------|--------|
| 폼 입력 (TextInput) | ❌ 공유 컴포넌트 없음 | 네이티브 `<input>` 직접 사용, 접근성 속성 개별 관리 불가 |
| 데이터 테이블 (DataTable) | ❌ 공유 컴포넌트 없음 | 네이티브 `<table>` 직접 사용, `<caption>`/`scope` 개별 추가 필요 |
| 모달 (Modal) | ⚠️ 패턴만 공유 | `fixed inset-0 z-50` + backdrop 패턴, 포커스 트랩 없음 |
| 토스트 (Toast) | ✅ Sonner 라이브러리 | aria-live 설정 확인 필요 |
| 드롭다운/메뉴 | ❌ 공유 컴포넌트 없음 | 개별 구현, aria-expanded 없음 |

### 2.4 Sonner 토스트 라이브러리 현황

| 항목 | 현황 |
|------|------|
| 라이브러리 | Sonner (react-hot-toast 대안) |
| 사용 방식 | `toast.success()`, `toast.error()` |
| aria-live | ⚠️ Sonner 내부적으로 `role="status"` 제공하나 커스텀 설정 미확인 |
| 위치 | 상단 중앙 또는 하단 |

---

## 3. TO-BE 요구사항

### 3.1 A-1: 스킵 내비게이션 (Skip Navigation)

#### 3.1.1 구현 요구사항

| 항목 | 내용 |
|------|------|
| 대상 | 모든 레이아웃: AdminLayout, MainLayout, AuthLayout, SubMenuLayout, ClientLayout, PortalLayout, PublicLayout |
| 동작 | Tab 키 첫 번째 포커스 시 "본문으로 건너뛰기" 링크 표시 |
| 구현 | `<a href="#main-content" class="sr-only focus:not-sr-only ...">` |
| 앵커 대상 | 각 레이아웃의 메인 콘텐츠 영역에 `id="main-content"` |
| 다국어 | ko: "본문으로 건너뛰기", en: "Skip to main content", vi: "Chuyển đến nội dung chính" |

#### 3.1.2 레이아웃별 `id="main-content"` 적용 위치

| 레이아웃 | 적용 위치 |
|---------|----------|
| AdminLayout | 콘텐츠 래퍼 `<div>` (사이드바 다음 영역) |
| MainLayout | 메인 콘텐츠 `<div>` |
| AuthLayout | 인증 폼 카드 `<div>` |
| SubMenuLayout | 대화 목록 오른쪽 채팅 영역 |
| ClientLayout | 클라이언트 콘텐츠 영역 |
| PortalLayout | `<main>` 태그 (이미 존재) |
| PublicLayout | `<main>` 태그 (이미 존재) |

#### 3.1.3 스타일

```css
/* 평소에는 숨김, Tab 포커스 시 화면 상단에 표시 */
.skip-nav {
  @apply sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0
         focus:z-[9999] focus:bg-indigo-600 focus:text-white
         focus:px-4 focus:py-2 focus:text-sm focus:font-medium;
}
```

### 3.2 A-2: 폼 접근성 (공유 컴포넌트)

#### 3.2.1 공유 FormField 컴포넌트 설계

현재 시스템에 공유 폼 입력 컴포넌트가 없으므로, 접근성 속성을 기본 내장한 `FormField` 래퍼 컴포넌트를 생성한다.

```typescript
interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: (props: {
    id: string;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }) => React.ReactNode;
}
```

#### 3.2.2 자동 생성 ARIA 속성

| 조건 | 생성 속성 |
|------|----------|
| 항상 | `id={name}`, `<label htmlFor={name}>` |
| `required=true` | `aria-required="true"` |
| `error` 존재 시 | `aria-invalid="true"`, `aria-describedby="{name}-error"` |
| `description` 존재 시 | `aria-describedby="{name}-desc"` (에러 + 설명 공존 시 공백 연결) |

#### 3.2.3 에러 메시지 렌더링

```html
<!-- 에러 있을 때 -->
<div id="{name}-error" role="alert" class="text-sm text-red-600 mt-1">
  {error}
</div>

<!-- 설명 텍스트 -->
<div id="{name}-desc" class="text-sm text-gray-500 mt-1">
  {description}
</div>
```

#### 3.2.4 적용 범위

| 도메인 | 대표 폼 | 추산 입력 필드 수 |
|--------|--------|-----------------|
| auth | 로그인, 회원가입, 비밀번호 변경 | ~15 |
| issues | 이슈 등록/수정 | ~20 |
| hr | HR 멤버 정보 | ~30 |
| accounting | 회계 전표 | ~20 |
| settings | 엔티티 설정, SMTP, API Keys | ~25 |
| talk | 채널 생성, 메시지 입력 | ~10 |
| project | 프로젝트 생성/수정 | ~15 |
| kms | 문서 작성 | ~10 |
| billing | 청구서 | ~15 |
| admin | 사용자 관리, 파트너 관리 | ~20 |
| portal | 포털 설정, 프로필 | ~15 |
| **합계** | | **~195** |

> 전략: `FormField` 공유 컴포넌트를 만들고, 주요 도메인부터 점진적으로 교체. Phase 1에서 auth, issues, settings 도메인 우선 적용.

### 3.3 A-3: 테이블 접근성

#### 3.3.1 개선 항목

| 항목 | 현재 | 개선 후 |
|------|------|--------|
| `<caption>` | ❌ 없음 | ✅ 모든 데이터 테이블에 `<caption class="sr-only">` 추가 |
| `<th scope>` | ❌ 없음 | ✅ `scope="col"` (열 헤더), `scope="row"` (행 헤더) |
| `aria-sort` | ❌ 없음 | ✅ 정렬 가능 컬럼: `aria-sort="ascending/descending/none"` |
| `aria-label` | ❌ 없음 | ✅ 정렬 버튼에 "이름 오름차순 정렬" 등 라벨 |

#### 3.3.2 접근성 테이블 래퍼 컴포넌트 설계

```typescript
interface AccessibleTableProps {
  caption: string;           // sr-only 캡션 (필수)
  captionVisible?: boolean;  // 시각적으로도 캡션 표시 여부
  sortable?: boolean;        // 정렬 기능 포함 여부
}

interface AccessibleThProps {
  scope?: 'col' | 'row';
  sortDirection?: 'ascending' | 'descending' | 'none';
  onSort?: () => void;
  sortLabel?: string;        // 정렬 접근성 라벨
}
```

#### 3.3.3 적용 대상 테이블 (주요)

| 페이지 | 테이블 내용 | 정렬 |
|--------|-----------|------|
| PartnerManagementPage | 파트너 목록 | ✅ |
| UserManagementPage | 사용자 목록 | ✅ |
| IssueListPage | 이슈 목록 | ✅ |
| AttendancePage | 출퇴근 기록 | ✅ |
| AccountingPage | 회계 전표 | ✅ |
| BillingListPage | 청구서 목록 | ✅ |
| HrMemberListPage | HR 멤버 | ✅ |
| MyPage | 내 엔티티 목록 | ❌ |
| EntityRedmineMigrationPage | 마이그레이션 이슈 | ✅ |

### 3.4 A-4: 모달 포커스 트랩

#### 3.4.1 요구사항

| 항목 | 내용 |
|------|------|
| 라이브러리 | `focus-trap-react` (React 래퍼) |
| 동작 | 모달 오픈 시 첫 포커스 가능 요소로 이동, Tab/Shift+Tab으로 모달 내부만 순환 |
| 닫기 | Escape 키로 닫기 (이미 일부 구현), 닫기 후 트리거 요소로 포커스 복귀 |
| 적용 대상 | 모든 모달/다이얼로그 컴포넌트 |

#### 3.4.2 공유 Modal 래퍼 컴포넌트

현재 모달은 각 도메인에서 `fixed inset-0 z-50` 패턴으로 개별 구현되어 있다. 접근성을 포함한 공유 Modal 컴포넌트를 생성하여 점진적으로 교체한다.

```typescript
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;              // aria-labelledby용 모달 제목
  description?: string;       // aria-describedby용 설명
  initialFocusRef?: RefObject<HTMLElement>;  // 초기 포커스 대상
  returnFocusOnClose?: boolean;              // 닫기 시 포커스 복귀 (기본: true)
  children: React.ReactNode;
}
```

자동 적용 속성:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="{id}-title"`
- `aria-describedby="{id}-desc"` (description 있을 때)
- FocusTrap 래핑
- Escape 키 핸들러
- 배경 클릭 시 닫기

#### 3.4.3 적용 대상 모달 (주요)

| 모달 | 도메인 | 우선순위 |
|------|--------|---------|
| IssueFormModal | issues | 🔴 Phase 1 |
| ShareModal | work-items | 🔴 Phase 1 |
| AgentConfigEditModal | settings | 🔴 Phase 1 |
| FilePreviewModal | chat | 🔴 Phase 1 |
| ImageLightbox | common | 🔴 Phase 1 |
| NotificationModal | global | 🟡 Phase 2 |
| MeetingNoteFormModal | meeting-notes | 🟡 Phase 2 |
| 기타 50+ 모달 | 각 도메인 | 🟡 Phase 2 |

### 3.5 A-5: aria-live 동적 콘텐츠 알림

#### 3.5.1 적용 시나리오

| 시나리오 | aria-live 값 | aria-atomic | 비고 |
|----------|-------------|-------------|------|
| 토스트 알림 (성공/에러) | `assertive` | `true` | Sonner 설정 확인 후 보완 |
| 검색 결과 개수 변경 | `polite` | `true` | "검색 결과 N건" |
| AI 스트리밍 응답 | `polite` | `false` | `aria-busy="true"` 병행 |
| 실시간 채팅 메시지 | `polite` | `false` | 새 메시지 도착 알림 |
| 로딩 상태 변경 | `polite` | `true` | "로딩 중..." → "완료" |
| 폼 유효성 검증 결과 | `assertive` | `true` | 에러 메시지 즉시 읽기 |
| 알림 뱃지 업데이트 | `polite` | `true` | "새 알림 N건" |

#### 3.5.2 Sonner 토스트 접근성 설정

```typescript
// main.tsx 또는 App.tsx에 Sonner Toaster 설정
<Toaster
  toastOptions={{
    role: 'alert',                    // 중요 알림
    ariaLive: 'assertive',           // 즉시 읽기
  }}
/>
```

Sonner 최신 버전이 기본적으로 `role="status"`를 제공하는지 확인 필요. 미제공 시 커스텀 aria-live 리전으로 보완.

#### 3.5.3 글로벌 aria-live 리전

각 레이아웃에 숨겨진 aria-live 리전을 추가하여, 프로그래밍적으로 동적 메시지를 주입:

```html
<!-- 각 레이아웃 하단 -->
<div id="aria-live-polite" aria-live="polite" aria-atomic="true" class="sr-only"></div>
<div id="aria-live-assertive" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
```

### 3.6 A-6: HTML lang 동적 전환

#### 3.6.1 요구사항

| 항목 | 현재 | 개선 후 |
|------|------|--------|
| `<html lang>` | 고정: `ko` (web), `en` (portal) | i18n 언어 전환 시 동적 갱신 |
| 갱신 시점 | 없음 | `i18n.changeLanguage()` 콜백에서 `document.documentElement.lang` 업데이트 |

#### 3.6.2 구현 위치

```typescript
// apps/web/src/i18n.ts (및 apps/portal-web/src/i18n.ts)
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});
```

#### 3.6.3 부분 언어 태깅

다국어 콘텐츠가 혼재하는 경우 (예: AI 번역 결과) 해당 영역에 개별 `lang` 속성:

```html
<div lang="en">Translated English content</div>
<div lang="vi">Nội dung tiếng Việt</div>
```

### 3.7 A-7: aria-expanded/controls (드롭다운/아코디언)

#### 3.7.1 적용 대상

| 컴포넌트 | 위치 | 현황 |
|---------|------|------|
| 사이드바 메뉴 | AdminLayout | ❌ 서브메뉴 확장 시 aria-expanded 없음 |
| 알림 드롭다운 | NotificationBell | ❌ 드롭다운 열림 상태 미공지 |
| 프로필 드롭다운 | 각 레이아웃 헤더 | ❌ |
| 필터 드롭다운 | 이슈, 할일 등 | ❌ |
| 아코디언 | FAQ, 설정 섹션 | ❌ |
| MultiSelectFilter | 공통 컴포넌트 | ❌ |
| OrgSelector | 공통 컴포넌트 | ❌ |
| LanguageSelector | 공통 컴포넌트 | ❌ |

#### 3.7.2 속성 적용 패턴

```html
<!-- 드롭다운 트리거 버튼 -->
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu-id"
  aria-haspopup="true"
>
  메뉴
</button>

<!-- 드롭다운 패널 -->
<div
  id="dropdown-menu-id"
  role="menu"
  aria-hidden={!isOpen}
>
  <button role="menuitem">항목 1</button>
  <button role="menuitem">항목 2</button>
</div>
```

### 3.8 A-8: prefers-reduced-motion 지원

#### 3.8.1 적용 방법

```css
/* Tailwind CSS 설정 (tailwind.config.js) */
/* TailwindCSS 3.x는 기본적으로 motion-reduce 변형 지원 */

/* 적용 예시: AI 스트리밍 커서 애니메이션 */
.streaming-cursor {
  @apply animate-pulse motion-reduce:animate-none;
}

/* 페이지 전환 애니메이션 */
.page-transition {
  @apply transition-all duration-300 motion-reduce:transition-none;
}

/* 글로벌 기본 설정 (globals.css 또는 index.css) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 3.8.2 영향 받는 애니메이션

| 애니메이션 | 위치 | 대응 |
|-----------|------|------|
| AI 스트리밍 커서 깜빡임 | 채팅 UI | `motion-reduce:animate-none` |
| 토스트 슬라이드 인/아웃 | Sonner | `motion-reduce:transition-none` |
| 로딩 스피너 회전 | LoadingSpinner | 정적 인디케이터로 대체 |
| 사이드바 슬라이드 | AdminLayout | 즉시 표시/숨김 |
| 알림 벨 흔들림 | NotificationBell | 정적 아이콘 |

### 3.9 A-9: 색상 대비 검증 (axe-core CI 통합)

#### 3.9.1 도입 방안

| 도구 | 용도 | 단계 |
|------|------|------|
| `@axe-core/react` | 개발 시 브라우저 콘솔에 접근성 경고 | Phase 1 |
| `axe-core` + Playwright | CI/CD 파이프라인에서 자동 검증 | Phase 2 |
| `pa11y` | CLI 기반 페이지 단위 검증 | Phase 3 |

#### 3.9.2 설정 예시

```typescript
// apps/web/src/main.tsx (개발 환경만)
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

---

## 4. 갭 분석

### 4.1 웹접근성 AS-IS vs TO-BE 비교

| # | 항목 | AS-IS | TO-BE | 갭 | 구현 난이도 |
|---|------|-------|-------|-----|-----------|
| 1 | 스킵 내비게이션 | ❌ 없음 | 7개 레이아웃 모두 적용 | 🟢 소규모 | 하 |
| 2 | 폼 접근성 | ❌ 없음 | FormField 공유 컴포넌트 + 195개 필드 점진 교체 | 🔴 대규모 | 상 |
| 3 | 테이블 접근성 | ❌ 없음 | caption/scope 전체 테이블 적용 | 🟡 중규모 | 중 |
| 4 | 모달 포커스 트랩 | ❌ 없음 | focus-trap-react + Modal 래퍼 + 50+ 모달 교체 | 🔴 대규모 | 상 |
| 5 | aria-live | ❌ 없음 | 글로벌 리전 + 7개 시나리오 적용 | 🟡 중규모 | 중 |
| 6 | lang 동적 전환 | ❌ 고정 | i18n 이벤트 리스너 1줄 추가 | 🟢 소규모 | 하 |
| 7 | aria-expanded | ❌ 없음 | 8+ 드롭다운/아코디언 컴포넌트 수정 | 🟡 중규모 | 중 |
| 8 | reduced-motion | ❌ 없음 | CSS 미디어 쿼리 + Tailwind 변형 | 🟢 소규모 | 하 |
| 9 | 색상 대비 | ⚠️ 미검증 | axe-core 개발 도구 + CI 통합 | 🟡 도구 도입 | 중 |
| 10 | 시맨틱 HTML (web) | ⚠️ 부분 | `<main>`, `<nav>`, `<header>`, `<aside>` 적용 | 🟡 중규모 | 중 |

### 4.2 영향도 분석

| 영향 대상 | 변경 유형 | 상세 |
|----------|----------|------|
| `apps/web/src/layouts/` | 수정 | 5개 레이아웃에 스킵 내비게이션 + `id="main-content"` + 시맨틱 태그 |
| `apps/portal-web/src/pages/` | 수정 | 2개 레이아웃에 스킵 내비게이션 |
| `apps/web/src/components/` | 신규 | `FormField.tsx`, `AccessibleTable.tsx`, `AccessibleModal.tsx` 공유 컴포넌트 |
| `apps/web/src/domain/*/` | 점진 수정 | 각 도메인 폼/테이블/모달 교체 (장기) |
| `apps/web/src/i18n.ts` | 수정 | `languageChanged` 이벤트 리스너 추가 |
| `apps/web/src/main.tsx` | 수정 | axe-core 개발 도구 추가 |
| `apps/web/src/index.css` | 수정 | prefers-reduced-motion 글로벌 CSS |
| `package.json` | 수정 | `focus-trap-react`, `@axe-core/react` (devDeps) 추가 |
| i18n JSON | 수정 | skip-nav 번역 키 추가 (각 네임스페이스 또는 common) |

### 4.3 WCAG 2.1 AA 준수율 변화 예측

| 원칙 | 현재 | Phase 1 후 | Phase 2 후 |
|------|------|-----------|-----------|
| 인식의 용이성 (Perceivable) | ~45% | ~70% | ~85% |
| 운용의 용이성 (Operable) | ~50% | ~75% | ~90% |
| 이해의 용이성 (Understandable) | ~60% | ~80% | ~90% |
| 견고성 (Robust) | ~40% | ~65% | ~85% |
| **전체** | **~50%** | **~73%** | **~88%** |

---

## 5. 사용자 플로우

### 5.1 스크린 리더 사용자의 페이지 탐색 (개선 후)

```
[사용자가 페이지 접속]

1. Tab 키 → "본문으로 건너뛰기" 링크에 포커스 (스킵 내비게이션)
   → Enter 시: 메인 콘텐츠 영역으로 즉시 이동

2. 메뉴 내비게이션:
   → 사이드바 메뉴: aria-expanded 상태 읽음
   → "관리 메뉴, 접힘" → Enter → "관리 메뉴, 펼침"
   → 서브메뉴 항목 탐색

3. 데이터 테이블 도착:
   → caption 읽음: "이슈 목록 테이블"
   → th scope="col" 읽음: "제목, 컬럼 헤더, 오름차순 정렬"
   → 셀 탐색: "이슈 #123, 제목 컬럼"

4. 폼 작성:
   → label 읽음 + aria-required: "제목, 필수 입력"
   → 유효성 에러: "제목, 필수, 유효하지 않음, 제목을 입력해주세요"
   → aria-describedby: 에러 메시지 자동 읽기

5. 모달 열기:
   → 포커스가 모달 내부로 이동
   → aria-labelledby: "이슈 등록"
   → Tab 순환: 모달 내부에서만 순환
   → Escape: 모달 닫기 → 트리거 버튼으로 포커스 복귀

6. 동적 알림:
   → 토스트: aria-live="assertive" → "저장되었습니다"
   → 검색 결과: aria-live="polite" → "검색 결과 5건"
   → AI 응답: aria-live="polite" + aria-busy → "AI가 응답 중..."
```

---

## 6. 기술적 고려사항

### 6.1 프론트엔드 구조 변경

```
apps/web/src/
├── components/
│   ├── accessible/                # 접근성 공유 컴포넌트 (신규)
│   │   ├── FormField.tsx          # 폼 필드 래퍼 (label + error + aria)
│   │   ├── AccessibleTable.tsx    # 테이블 래퍼 (caption + scope)
│   │   ├── AccessibleModal.tsx    # 모달 래퍼 (focus-trap + aria)
│   │   ├── SkipNavigation.tsx     # 스킵 내비게이션 링크
│   │   ├── AriaLiveRegion.tsx     # 글로벌 aria-live 리전
│   │   └── index.ts               # 배럴 export
│   └── common/ (기존)
│
├── hooks/
│   └── useAriaLive.ts             # aria-live 리전에 메시지 전달 훅 (신규)
│
├── layouts/ (기존 수정)
│   ├── AdminLayout.tsx            # + SkipNavigation + id="main-content"
│   ├── MainLayout.tsx             # + SkipNavigation + id="main-content"
│   ├── AuthLayout.tsx             # + SkipNavigation + id="main-content"
│   ├── SubMenuLayout.tsx          # + SkipNavigation + id="main-content"
│   └── ...
│
├── i18n.ts                        # + languageChanged 이벤트 리스너
├── main.tsx                       # + axe-core (DEV only)
└── index.css                      # + prefers-reduced-motion 글로벌 CSS
```

### 6.2 외부 의존성

| 패키지 | 용도 | 타입 | 비고 |
|--------|------|------|------|
| `focus-trap-react` | 모달 포커스 트랩 | dependencies | ~5KB gzip |
| `@axe-core/react` | 개발 시 접근성 검증 | devDependencies | DEV 환경만 로드 |

### 6.3 점진적 적용 전략

폼/테이블/모달 교체는 대규모 작업이므로, 공유 컴포넌트를 먼저 만들고 도메인별로 점진 적용:

| 단계 | 대상 도메인 | 교체 내용 |
|------|-----------|----------|
| Phase 1 (필수) | auth, settings, admin | 로그인/회원가입 폼, 설정 폼, 관리 테이블 |
| Phase 2 (주요) | issues, project, talk | 이슈 폼/테이블, 프로젝트, 채팅 모달 |
| Phase 3 (기타) | hr, accounting, billing, kms | 나머지 도메인 폼/테이블/모달 |

### 6.4 테스트 전략

| 테스트 유형 | 도구 | 시점 |
|------------|------|------|
| 개발 시 콘솔 경고 | `@axe-core/react` | 즉시 (Phase 1) |
| 스크린 리더 수동 테스트 | VoiceOver (macOS), NVDA (Windows) | Phase 1 완료 후 |
| 키보드 탐색 테스트 | 수동 (Tab/Enter/Escape/Arrow) | 각 Phase 완료 후 |
| 색상 대비 검증 | Chrome DevTools, axe | Phase 2 |
| CI 자동화 접근성 검증 | axe-core + Playwright | Phase 3 |

### 6.5 포털앱(portal-web) 적용 범위

portal-web은 시맨틱 HTML이 web보다 잘 적용되어 있으므로, 다음 사항만 추가:

| 항목 | 적용 |
|------|------|
| 스킵 내비게이션 | PortalLayout, PublicLayout에 추가 |
| FormField 컴포넌트 | 포털 전용 공유 컴포넌트 생성 또는 packages/로 공유 |
| lang 동적 전환 | portal-web i18n.ts에 동일 적용 |
| focus-trap-react | 포털 모달에 적용 |

### 6.6 i18n 번역 키 추가

```json
// locales/ko/common.json (추가)
{
  "accessibility": {
    "skipToMainContent": "본문으로 건너뛰기",
    "loadingComplete": "로딩 완료",
    "searchResults": "검색 결과 {{count}}건",
    "newNotifications": "새 알림 {{count}}건",
    "sortAscending": "{{column}} 오름차순 정렬",
    "sortDescending": "{{column}} 내림차순 정렬",
    "required": "필수",
    "invalid": "유효하지 않음"
  }
}
```

---

## 7. 구현 우선순위 및 로드맵

### Phase 1: 필수 (WCAG Level A 충족) — 예상 변경 파일 ~30개

| # | 작업 | 난이도 |
|---|------|--------|
| 1-1 | `SkipNavigation.tsx` 컴포넌트 생성 | 하 |
| 1-2 | 7개 레이아웃에 스킵 내비게이션 적용 | 하 |
| 1-3 | `FormField.tsx` 공유 컴포넌트 생성 | 중 |
| 1-4 | auth 도메인 폼 FormField 교체 | 중 |
| 1-5 | `AccessibleTable.tsx` 생성 + 주요 테이블 5개 적용 | 중 |
| 1-6 | `AccessibleModal.tsx` + focus-trap-react 도입 | 중 |
| 1-7 | 주요 모달 5개 교체 (IssueFormModal 등) | 중 |
| 1-8 | i18n lang 동적 전환 (1줄 추가 × 2앱) | 하 |
| 1-9 | prefers-reduced-motion 글로벌 CSS | 하 |

### Phase 2: 중요 (WCAG Level AA 대부분 충족) — 예상 변경 파일 ~50개

| # | 작업 | 난이도 |
|---|------|--------|
| 2-1 | aria-live 글로벌 리전 + useAriaLive 훅 | 중 |
| 2-2 | Sonner 토스트 접근성 설정 검증/보완 | 하 |
| 2-3 | 드롭다운/아코디언 aria-expanded 적용 (8+ 컴포넌트) | 중 |
| 2-4 | issues, project, talk 도메인 폼/테이블 교체 | 상 |
| 2-5 | 나머지 모달 교체 (50+ 모달) | 상 |
| 2-6 | 시맨틱 HTML 보강 (web 레이아웃 `<main>`, `<nav>` 등) | 중 |
| 2-7 | `@axe-core/react` 개발 도구 도입 | 하 |

### Phase 3: 권장 (WCAG Level AA 완전 충족 + AAA 일부)

| # | 작업 | 난이도 |
|---|------|--------|
| 3-1 | 나머지 도메인(hr, accounting, billing, kms) 전면 교체 | 상 |
| 3-2 | 색상 대비 전수 검사 + 조정 | 중 |
| 3-3 | axe-core + Playwright CI 자동화 | 중 |
| 3-4 | 부분 언어 태깅 (AI 번역 결과) | 하 |
| 3-5 | 포털앱(portal-web) 전면 접근성 적용 | 중 |

---

## 문서 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0 | 2026-03-23 | AI 분석 | 최초 작성 — WCAG 2.1 AA 웹접근성 요구사항 분석 |
