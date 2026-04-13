# 요구사항 분석서: 회원승인 버튼 추가 및 부서관리 설정 연결

**문서번호**: REQ-MemberApproval-DepartmentSettings-20260224  
**작성일**: 2026-02-24  
**작성자**: AI Assistant  
**상태**: 분석 완료  

---

## 1. 요구사항 요약

| # | 요구사항 | 유형 | 우선순위 |
|---|---------|------|---------|
| A | 회원 상세 페이지에 승인/거절 버튼 추가 | UI 기능 보완 | 높음 |
| B | 설정 페이지에 부서관리 카드 추가 | UI 네비게이션 보완 | 높음 |

---

## 2. AS-IS 현황 분석

### 2.1 Feature A: 회원 승인 흐름

#### 현재 흐름
1. 관리자가 사용자를 초대 (이메일 발송)
2. 사용자가 초대 링크로 회원가입 완료
3. 사용자 상태: `PENDING` (승인대기)
4. 관리자가 **회원 목록 탭(MemberListTab)**에서 승인/거절 처리

#### 백엔드 (정상 동작)
- `PUT /api/v1/members/:id/approve` — 승인 (usrStatus → ACTIVE, 승인자 기록)
- `PUT /api/v1/members/:id/reject` — 거절 (usrStatus → WITHDRAWN)
- `PUT /api/v1/members/:id/status` — 범용 상태 변경

#### 프론트엔드 서비스/훅 (정상 동작)
- `membersService.approveMember(id)` — 승인 API 호출
- `membersService.rejectMember(id)` — 거절 API 호출
- `useApproveMember()` — React Query 뮤테이션 훅 (승인)
- `useRejectMember()` — React Query 뮤테이션 훅 (거절)

#### 회원 목록 탭 (MemberListTab.tsx) — 정상 동작
- PENDING 상태 회원에 대해 승인(✓)/거절(✕) 버튼 표시
- `StatusBadge` 컴포넌트로 상태별 색상 배지 표시 (ACTIVE/PENDING/INACTIVE/SUSPENDED/WITHDRAWN)

#### 🔴 회원 상세 페이지 (MemberDetailPage.tsx) — 문제 발견
- 회원 상태(`status`) 정보가 **전혀 표시되지 않음**
- PENDING 상태 회원 상세보기 진입 시 승인/거절 버튼 **없음**
- 관리자는 목록으로 돌아가야만 승인 처리 가능 → UX 단절

#### 영향받는 파일
| 파일 | 경로 | 현재 상태 |
|------|------|----------|
| MemberDetailPage.tsx | `apps/web/src/domain/members/pages/MemberDetailPage.tsx` | ❌ 승인 UI 없음 |
| MemberListTab.tsx | `apps/web/src/domain/members/components/MemberListTab.tsx` | ✅ 승인 UI 있음 (참조용) |
| useMembers.ts | `apps/web/src/domain/members/hooks/useMembers.ts` | ✅ 훅 존재 |
| members.service.ts | `apps/web/src/domain/members/service/members.service.ts` | ✅ API 메서드 존재 |

---

### 2.2 Feature B: 부서관리 설정 연결

#### 현재 상태
- `DepartmentManagementPage.tsx` — **완전히 구현됨** (트리 뷰, CRUD, 사용자 배정)
- 라우트 `/settings/departments` — **등록됨** (메뉴코드 `DEPARTMENTS`로 권한 가드)
- 백엔드 부서 API — **정상 동작** (CRUD, 트리 조회, 멤버 배정)

#### 🔴 설정 페이지 (SettingsPage.tsx) — 문제 발견
- `SETTINGS_CARDS` 배열에 9개 카드만 존재:
  1. Members (회원 관리)
  2. API Keys (API 키 관리)
  3. SMTP Settings (SMTP 설정)
  4. Permissions (권한 관리)
  5. Drive (구글 드라이브)
  6. Entities (법인 관리)
  7. Conversations (대화 관리)
  8. Mail Accounts (메일 계정)
  9. Chat Agents (챗 에이전트)
- **부서관리(Departments) 카드가 빠져있음** → 직접 URL 입력 외에 접근 불가

#### 영향받는 파일
| 파일 | 경로 | 현재 상태 |
|------|------|----------|
| SettingsPage.tsx | `apps/web/src/domain/settings/pages/SettingsPage.tsx` | ❌ 부서 카드 없음 |
| DepartmentManagementPage.tsx | `apps/web/src/domain/settings/pages/DepartmentManagementPage.tsx` | ✅ 페이지 구현 완료 |
| i18n common.json (ko/en/vi) | `apps/web/src/locales/*/common.json` | ❌ 부서 카드 번역 키 없음 |

---

## 3. TO-BE 요구사항

### 3.1 Feature A: 회원 상세 페이지 승인/거절 버튼

#### 기능 요구사항

| ID | 요구사항 | 상세 |
|---|---------|------|
| A-1 | 회원 상태 배지 표시 | 상세 페이지 헤더 영역에 회원 상태(PENDING/ACTIVE/INACTIVE/SUSPENDED/WITHDRAWN)를 컬러 배지로 표시 |
| A-2 | 승인 버튼 | PENDING 상태일 때 "승인" 버튼 표시. 클릭 시 `useApproveMember` 훅으로 승인 처리 |
| A-3 | 거절 버튼 | PENDING 상태일 때 "거절" 버튼 표시. 클릭 시 확인 다이얼로그 후 `useRejectMember` 훅으로 거절 처리 |
| A-4 | 승인 후 UI 갱신 | 승인/거절 처리 후 상세 데이터 리프레시. 상태 배지 즉시 반영 |
| A-5 | 권한 제어 | ADMIN 역할 사용자만 승인/거절 버튼 표시 |
| A-6 | 토스트 알림 | 승인/거절 성공/실패 시 토스트 메시지 표시 |

#### UI 디자인 가이드

```
┌─────────────────────────────────────────────────────────────┐
│  ← 뒤로    회원 상세                                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  👤 회원 이름                                         │   │
│  │  email@example.com                                    │   │
│  │  상태: [🟡 승인대기]                    [거절] [승인]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  기본 정보                                                   │
│  ... (기존 내용 유지)                                        │
└─────────────────────────────────────────────────────────────┘
```

- 승인 버튼: `bg-green-600 text-white` (기존 MemberListTab 스타일 참조)
- 거절 버튼: `bg-red-50 text-red-600 border-red-200` (기존 MemberListTab 스타일 참조)
- 상태 배지: MemberListTab의 `StatusBadge` 컴포넌트 재사용 또는 공통 컴포넌트화

---

### 3.2 Feature B: 설정 페이지 부서관리 카드 추가

#### 기능 요구사항

| ID | 요구사항 | 상세 |
|---|---------|------|
| B-1 | 부서관리 카드 추가 | SettingsPage의 SETTINGS_CARDS 배열에 Departments 카드 추가 |
| B-2 | 아이콘 | `Network` 아이콘 사용 (DepartmentManagementPage에서 이미 사용 중) |
| B-3 | 메뉴코드 | `DEPARTMENTS` (라우터 가드에서 이미 사용 중인 코드) |
| B-4 | 경로 | `/settings/departments` (이미 등록된 라우트) |
| B-5 | i18n | ko/en/vi 3개 언어 번역 키 추가 (`settings.departments.title`, `settings.departments.description`) |
| B-6 | 카드 위치 | Entities(법인 관리) 카드 다음 (조직 관련 설정의 논리적 그룹) |

---

## 4. 갭 분석

### 4.1 Feature A: 구현 갭

| 구분 | 항목 | 현재(AS-IS) | 목표(TO-BE) | 갭 |
|------|------|-------------|-------------|-----|
| Backend | API | ✅ 존재 | 변경 없음 | 없음 |
| Frontend | 서비스 메서드 | ✅ 존재 | 변경 없음 | 없음 |
| Frontend | React Query 훅 | ✅ 존재 | 변경 없음 | 없음 |
| Frontend | MemberDetailPage 상태 표시 | ❌ 없음 | 상태 배지 추가 | **추가 필요** |
| Frontend | MemberDetailPage 승인 버튼 | ❌ 없음 | PENDING일 때 버튼 표시 | **추가 필요** |
| Frontend | MemberDetailPage 거절 버튼 | ❌ 없음 | PENDING일 때 버튼 표시 | **추가 필요** |
| Frontend | 상세 상세 리프레시 | ⚠️ 목록만 invalidate | 상세도 invalidate | **수정 필요** |
| i18n | 승인/거절 텍스트 | ✅ 목록 탭에서 사용 중 | 공유 사용 | 없음 |

### 4.2 Feature B: 구현 갭

| 구분 | 항목 | 현재(AS-IS) | 목표(TO-BE) | 갭 |
|------|------|-------------|-------------|-----|
| Backend | API | ✅ 존재 | 변경 없음 | 없음 |
| Frontend | DepartmentManagementPage | ✅ 존재 | 변경 없음 | 없음 |
| Frontend | 라우트 | ✅ 존재 | 변경 없음 | 없음 |
| Frontend | SettingsPage 카드 | ❌ 없음 | 카드 추가 | **추가 필요** |
| i18n | 카드 제목/설명 | ❌ 없음 | 3개 언어 추가 | **추가 필요** |

---

## 5. 사용자 플로우

### 5.1 회원 승인 (개선 후)

```
관리자 → 설정 → 회원관리 → 회원 목록 → PENDING 회원 클릭
    → 회원 상세 페이지 진입
    → 상태: [🟡 승인대기] 배지 확인
    → [승인] 버튼 클릭
    → 토스트: "회원이 승인되었습니다"
    → 상태 배지: [🟢 활성] 으로 변경
    → 승인/거절 버튼 사라짐
```

### 5.2 부서관리 접근 (개선 후)

```
관리자 → 설정 페이지
    → [부서관리] 카드 클릭
    → /settings/departments 페이지 진입
    → 부서 트리 / CRUD / 멤버 배정 사용
```

---

## 6. 기술 제약사항 및 고려사항

### 6.1 기존 훅의 캐시 무효화 범위

현재 `useApproveMember`와 `useRejectMember` 훅의 `onSuccess`는 `memberKeys.all`만 무효화합니다:

```typescript
// 현재 코드
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: memberKeys.all });
}
```

회원 상세 페이지에서 호출할 경우, 상세 데이터(`memberKeys.detail(id)`)도 무효화되어야 합니다. `memberKeys.all`이 detail을 포함하는 prefix 구조라면 추가 수정 불필요하지만, 별도 키라면 수정이 필요합니다.

### 6.2 StatusBadge 컴포넌트 재사용

`MemberListTab.tsx` 내부에 로컬 함수로 정의된 `StatusBadge`를 공통 컴포넌트로 분리하거나, MemberDetailPage에서 동일 로직을 인라인으로 구현할 수 있습니다. 공통 컴포넌트 분리를 권장합니다.

### 6.3 entityId 의존성

`DepartmentManagementPage`는 `entityId`를 URL 쿼리 파라미터로 받습니다. SettingsPage 카드에서 이동 시 entityId가 없으면 빈 트리가 표시될 수 있으므로, 사용자의 기본 엔터티를 자동 선택하는 로직이 있는지 확인 필요합니다.

---

## 7. 구현 범위 요약

### 변경 필요 파일

| # | 파일 | 변경 내용 | 예상 작업량 |
|---|------|----------|-----------|
| 1 | `MemberDetailPage.tsx` | 상태 배지 + 승인/거절 버튼 추가 | 중간 |
| 2 | `SettingsPage.tsx` | SETTINGS_CARDS에 Departments 카드 추가 | 소규모 |
| 3 | `useMembers.ts` | approve/reject 훅 캐시 무효화 범위 확장 (필요 시) | 소규모 |
| 4 | `common.json` (ko) | 부서 카드 title/description 번역 추가 | 소규모 |
| 5 | `common.json` (en) | 부서 카드 title/description 번역 추가 | 소규모 |
| 6 | `common.json` (vi) | 부서 카드 title/description 번역 추가 | 소규모 |

### 변경 불필요 영역
- Backend API (승인/거절/부서 모두 구현 완료)
- DB 스키마 (변경 없음)
- 라우터 설정 (이미 등록됨)
- Frontend 서비스 계층 (이미 구현됨)

---

## 8. 사이드 이펙트 분석

| 변경 | 잠재적 영향 | 위험도 | 대응 |
|------|------------|--------|------|
| MemberDetailPage 버튼 추가 | MemberListTab의 기존 승인 로직과 중복 가능 | 낮음 | 동일 훅 재사용으로 일관성 유지 |
| 캐시 무효화 범위 확장 | 불필요한 리페칭 증가 | 낮음 | prefix key 구조 확인 후 최소 범위 적용 |
| SettingsPage 카드 추가 | 기존 카드 레이아웃 변경 (10→11개) | 낮음 | 3열 그리드 유지, 자연스러운 배치 |
| i18n 키 추가 | 번역 누락 위험 | 낮음 | ko/en/vi 동시 추가 |

---

## 9. 결론

두 이슈 모두 **백엔드/서비스 레이어는 이미 완성**되어 있으며, **프론트엔드 UI 연결만 누락**된 상태입니다.

- **Feature A** (회원 승인 버튼): MemberDetailPage.tsx 1개 파일 수정 + 훅 캐시 무효화 보완
- **Feature B** (부서관리 카드): SettingsPage.tsx 1개 파일 수정 + i18n 3개 파일 추가

예상 총 구현 시간: **1-2시간** (테스트 포함)
