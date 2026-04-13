# 작업계획서: 접근 권한 관리 페이지 개선

| 항목 | 내용 |
|------|------|
| 문서 번호 | PLAN-MenuPermissions-작업계획-20260222 |
| 참조 분석서 | REQ-MenuPermissions-분석서-20260222 |
| 작성일 | 2026-02-22 |
| 예상 기간 | 1일 |
| 우선순위 | HIGH (MEMBER 유저 메뉴 접근 불가 버그 포함) |

---

## 1. 현황 요약

### 핵심 문제

1. **[CRITICAL] MEMBER 역할 유저 4명 메뉴 전체 접근 불가**
   - `amb_menu_permissions`에 `MEMBER` 역할 레코드 없음
   - `getMyMenus()` → 빈 배열 반환 → 사이드바 메뉴 없음

2. **[HIGH] 권한 관리 UI가 실제 역할 체계와 불일치**
   - UI: `USER / MANAGER / ADMIN` (3열)
   - 실제: `SUPER_ADMIN / ADMIN / MANAGER / MEMBER / VIEWER` (5역할, 2그룹)

3. **[MEDIUM] 그룹 개념(ADMIN_GROUP / USER_GROUP) UI에 미반영**

### 이미 완료된 작업 (2026-02-22 패치)

- `admin.guard.ts`: `SUPER_ADMIN` 역할 ADMIN과 동일 처리 ✅
- `menu-permission.service.ts`: `SUPER_ADMIN` 전체 접근 임시 처리 ✅

---

## 2. 사이드 임팩트 분석

| 변경 항목 | 영향 범위 | 위험도 |
|---------|---------|-------|
| `ROLES` 상수에 `MEMBER`, `VIEWER` 추가 | `onModuleInit`에서 신규 레코드만 생성 | **LOW** (기존 레코드 보존) |
| `DEFAULT_PERMISSIONS`에 `MEMBER`, `VIEWER` 추가 | 신규 역할 레코드 생성에만 사용 | **LOW** |
| `RolePermissionTab` 전면 개선 | 프론트엔드 UI 변경, 기존 저장 API 동일 | **LOW** |
| `UserPermissionTab` 유저 필터링 | ADMIN_GROUP 유저만 드롭다운에서 제외 | **LOW** |
| 번역 키 추가 | 기존 키 변경 없이 신규 키만 추가 | **LOW** |

---

## 3. 단계별 구현 계획

### Phase 1: 백엔드 상수 정리 (약 1.5h)

#### 1-1. `menu-code.constant.ts` 수정

**파일**: `apps/api/src/global/constant/menu-code.constant.ts`

**변경 내용:**
```typescript
// BEFORE
export const ROLES = ['USER', 'MANAGER', 'ADMIN'] as const;

// AFTER
export const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'] as const;
```

`DEFAULT_PERMISSIONS` 추가:
- `SUPER_ADMIN`: 전체 `true` (ADMIN과 동일)
- `MEMBER`: 기존 `USER` 설정과 동일한 값으로 초기화
- `VIEWER`: CHAT 메뉴 + AMOEBA_TALK, WORK_SCHEDULE, NOTICES, DOCUMENTS, MAIL, KMS 접근, 나머지 `false`
- `USER` 키: 삭제하지 않고 유지 (하위 호환)

**주의**: `onModuleInit`의 "이미 존재하면 생성하지 않는" 로직 덕분에 기존 DB 레코드는 변경되지 않는다.

#### 1-2. `menu-permission.service.ts` 리팩토링

**파일**: `apps/api/src/domain/settings/service/menu-permission.service.ts`

현재 `role === 'ADMIN' || role === 'SUPER_ADMIN'` 중복 조건 → 헬퍼 메서드로 추출:

```typescript
private isAdminRole(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}
```

`getMyMenus`, `bulkUpdate`에서 `this.isAdminRole(role)` 사용으로 통일.

---

### Phase 2: 번역 키 추가 (약 0.5h)

**파일**: `apps/web/src/locales/{ko,en,vi}/settings.json`

추가 키 (기존 `permissions` 섹션 안):
```json
{
  "permissions": {
    "groups": {
      "ADMIN_GROUP": "관리자 그룹",
      "USER_GROUP": "일반 사용자 그룹"
    },
    "roles": {
      "SUPER_ADMIN": "최고 관리자",
      "ADMIN": "관리자",
      "MANAGER": "매니저",
      "MEMBER": "멤버",
      "VIEWER": "뷰어"
    },
    "adminGroupNote": "관리자 그룹은 모든 메뉴에 항상 접근 가능합니다."
  }
}
```

---

### Phase 3: `RolePermissionTab.tsx` 전면 개선 (약 2.5h)

**파일**: `apps/web/src/domain/settings/components/RolePermissionTab.tsx`

#### 3-1. 그룹 서브탭 상태 추가

```tsx
type GroupTab = 'ADMIN_GROUP' | 'USER_GROUP';
const [activeGroup, setActiveGroup] = useState<GroupTab>('USER_GROUP');
```

#### 3-2. 역할 배열 분리

```tsx
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
const USER_ROLES = ['MANAGER', 'MEMBER', 'VIEWER'] as const;
```

#### 3-3. ADMIN_GROUP 탭 구현

- 모든 메뉴에 대해 항상 ON 토글 (disabled + bg-indigo-400)
- 상단 파란색 안내 배너 표시
- 저장 버튼 없음

```tsx
{activeGroup === 'ADMIN_GROUP' && (
  <>
    <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
      <Info className="inline h-4 w-4 mr-1" />
      {t('settings:permissions.adminGroupNote')}
    </div>
    {/* 테이블: SUPER_ADMIN, ADMIN 컬럼, 전체 잠금 */}
  </>
)}
```

#### 3-4. USER_GROUP 탭 구현

- 역할 컬럼: `MANAGER`, `MEMBER`, `VIEWER`
- `localState` 키 구조 동일: `${menuCode}_${role}`
- 저장 로직 동일, 단 role 필터를 USER_ROLES 기준으로 적용

#### 3-5. 역할 헤더 표시

```tsx
// 역할 코드 + 번역명 2줄 표시
<th>
  <div className="text-xs font-semibold">{t(`settings:permissions.roles.${role}`)}</div>
  <div className="text-xs text-gray-400">{role}</div>
</th>
```

---

### Phase 4: `UserPermissionTab.tsx` 소폭 개선 (약 0.5h)

**파일**: `apps/web/src/domain/settings/components/UserPermissionTab.tsx`

#### 4-1. 유저 선택 드롭다운 필터링

```tsx
// ADMIN_GROUP 유저 제외 (항상 전체 접근이므로 개별 설정 불필요)
const selectableMembers = members?.filter(m => m.group !== 'ADMIN_GROUP') ?? [];
```

#### 4-2. 유저 목록에 역할 뱃지 추가

유저 이름 옆에 역할/그룹 정보 표시:
```tsx
<span className="text-xs text-gray-500">
  {t(`settings:permissions.roles.${member.role}`, { defaultValue: member.role })}
</span>
```

---

## 4. 변경 파일 목록

| 파일 | 변경 유형 | 예상 변경 규모 |
|------|---------|-------------|
| `apps/api/src/global/constant/menu-code.constant.ts` | 수정 | +40줄 |
| `apps/api/src/domain/settings/service/menu-permission.service.ts` | 수정 | +5줄 (헬퍼 추출) |
| `apps/web/src/domain/settings/components/RolePermissionTab.tsx` | 전면 개선 | 기존 262줄 → 약 320줄 |
| `apps/web/src/domain/settings/components/UserPermissionTab.tsx` | 소폭 수정 | +15줄 |
| `apps/web/src/locales/ko/settings.json` | 수정 | +12행 |
| `apps/web/src/locales/en/settings.json` | 수정 | +12행 |
| `apps/web/src/locales/vi/settings.json` | 수정 | +12행 |

**이미 완료 (2026-02-22 패치, 재수정 불필요)**:
- `apps/api/src/domain/settings/guard/admin.guard.ts` ✅
- `apps/api/src/domain/settings/service/menu-permission.service.ts` (SUPER_ADMIN 부분) ✅

---

## 5. 배포 계획

| 단계 | 작업 | 비고 |
|------|------|------|
| 1 | Phase 1~4 구현 + 로컬 빌드 확인 | `npm run build` |
| 2 | `git push origin main` | - |
| 3 | 스테이징 배포 | `ssh amb-staging "... deploy-staging.sh"` |
| 4 | 스테이징 검증 | 아래 체크리스트 참조 |

---

## 6. 검증 체크리스트

### 백엔드 검증
- [ ] 스테이징 재배포 후 `amb_menu_permissions`에 `MEMBER`, `VIEWER` 역할 레코드 생성 확인
- [ ] `SUPER_ADMIN` 유저 로그인 → `GET /api/v1/settings/permissions/me` → 35개 메뉴 반환
- [ ] `MEMBER` 유저 로그인 → `GET /api/v1/settings/permissions/me` → 업무 메뉴 반환 (빈 배열 아님)

### 프론트엔드 검증
- [ ] `/settings/permissions` → [역할별 권한] 탭
  - ADMIN_GROUP 서브탭: SUPER_ADMIN, ADMIN 컬럼 전체 ON 잠금 상태 표시
  - USER_GROUP 서브탭: MANAGER, MEMBER, VIEWER 컬럼 표시 및 토글 동작
- [ ] 저장 후 DB `amb_menu_permissions` 반영 확인
- [ ] [사용자별 권한] 탭: 유저 드롭다운에서 ADMIN_GROUP 유저(admin@amoeba.group) 미표시

### 회귀 테스트
- [ ] `MANAGER` 유저 로그인 후 기존 메뉴 접근 정상 확인
- [ ] 관리자(`SUPER_ADMIN`) 로그인 후 설정 메뉴 정상 접근 확인 (오늘 패치 유지)

---

## 7. 예상 소요 시간

| Phase | 작업 | 시간 |
|-------|------|------|
| Phase 1 | 백엔드 상수/서비스 정리 | 1.5h |
| Phase 2 | 번역 키 추가 | 0.5h |
| Phase 3 | RolePermissionTab 개선 | 2.5h |
| Phase 4 | UserPermissionTab 개선 | 0.5h |
| 배포/검증 | 스테이징 배포 + 검증 | 1h |
| **합계** | | **6h (약 1일)** |
