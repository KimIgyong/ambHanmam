# 요구사항 분석서: 접근 권한 관리 페이지 개선

| 항목 | 내용 |
|------|------|
| 문서 번호 | REQ-MenuPermissions-20260222 |
| 참조 URL | https://mng.amoeba.site/settings/permissions |
| 작성일 | 2026-02-22 |
| 상태 | 확정 |

---

## 1. AS-IS 현황 분석

### 1.1 현재 UI 구조

`/settings/permissions` 페이지는 3개의 탭으로 구성된다.

| 탭 | 컴포넌트 | 기능 |
|----|---------|------|
| 메뉴 설정 | `MenuConfigTab` | 메뉴 활성화/비활성화, 정렬 순서 설정 |
| 역할별 권한 | `RolePermissionTab` | 역할별 메뉴 접근 ON/OFF 토글 |
| 사용자별 권한 | `UserPermissionTab` | 특정 사용자에게 개별 권한 부여/차단 |

### 1.2 현재 역할 체계 (코드 기준)

**`RolePermissionTab.tsx` 하드코딩 값:**
```ts
const ROLES = ['USER', 'MANAGER', 'ADMIN']
```

**`apps/api/src/global/constant/menu-code.constant.ts`:**
```ts
export const ROLES = ['USER', 'MANAGER', 'ADMIN'] as const;
export const DEFAULT_PERMISSIONS = {
  ADMIN: /* 전체 true */,
  MANAGER: { ... },
  USER: { ... },
};
```

### 1.3 DB 실측 현황 (스테이징 2026-02-22 기준)

**`amb_menu_permissions` 테이블:**

| 역할(mpm_role) | 레코드 수 |
|--------------|---------|
| ADMIN | 35 |
| MANAGER | 34 |
| USER | 34 |

**`amb_users` 테이블 (실제 사용 중인 역할/그룹):**

| usr_role | usr_group_code | 인원 |
|---------|---------------|-----|
| SUPER_ADMIN | ADMIN_GROUP | 1명 |
| MANAGER | USER_GROUP | 1명 |
| MEMBER | USER_GROUP | 4명 |

### 1.4 시스템 설계 정의

`apps/api/src/domain/auth/interface/jwt-payload.interface.ts`:
```
그룹(group): ADMIN_GROUP | USER_GROUP
역할(role):  SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER
상태(status): PENDING | ACTIVE | INACTIVE | SUSPENDED | WITHDRAWN
```

`apps/api/src/domain/auth/entity/user.entity.ts`:
- `usr_group_code`: 기본값 `USER_GROUP`
- `usr_role`: 기본값 `MEMBER`
- `usr_status`: 기본값 `PENDING`

---

## 2. 갭(Gap) 분석

### 2.1 중대 버그

| 등급 | 내용 | 영향 |
|------|------|------|
| **CRITICAL** | `MEMBER` 역할 유저 4명의 메뉴 권한 레코드(`amb_menu_permissions`)가 없음 | `getMyMenus()` 호출 시 빈 배열 반환 → 사이드바 전체 메뉴 미표시 (로그인은 되나 아무 메뉴도 안 보임) |
| **HIGH** | `SUPER_ADMIN` 역할이 `DEFAULT_PERMISSIONS`에 정의되어 있지 않음 | 2026-02-22 코드 패치로 `getMyMenus`에서 SUPER_ADMIN과 ADMIN을 동일하게 처리하는 임시 수정이 이루어졌으나, 근본적인 정리 필요 |

### 2.2 UI/UX 불일치

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 역할별 권한 탭 컬럼 | USER, MANAGER, ADMIN (3개) | SUPER_ADMIN, ADMIN, MANAGER, MEMBER, VIEWER (5개) |
| 그룹 개념 | 없음 | ADMIN_GROUP / USER_GROUP 탭 분리 |
| SUPER_ADMIN | UI에 표시 안 됨 | 잠금 상태로 전체 ON 표시 |
| MEMBER 역할 | UI에 없음 ("USER"로 표기됨) | MEMBER 컬럼 추가 |
| ADMIN_GROUP 안내 | 없음 | "관리자 그룹은 모든 메뉴에 항상 접근 가능" 안내 배너 |

### 2.3 백엔드 상수 불일치

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| `ROLES` 상수 | `['USER', 'MANAGER', 'ADMIN']` | `['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']` |
| `DEFAULT_PERMISSIONS` 키 | ADMIN, MANAGER, USER | SUPER_ADMIN, ADMIN, MANAGER, MEMBER, VIEWER |
| `bulkUpdate` 잠금 | `role === 'ADMIN'` only | `SUPER_ADMIN`과 `ADMIN` 모두 잠금 (이미 수정됨) |

---

## 3. TO-BE 요구사항

### 3.1 역할별 권한 탭 — 그룹 서브탭 분리

**레이아웃:**
```
[ADMIN_GROUP]  [USER_GROUP]
```

**ADMIN_GROUP 서브탭:**
- 역할 컬럼: `SUPER_ADMIN`, `ADMIN`
- 모든 메뉴 토글이 ON + 잠금 상태 (수정 불가)
- 상단 안내 배너: "관리자 그룹은 모든 메뉴에 항상 접근 가능합니다"
- 저장 버튼 없음

**USER_GROUP 서브탭:**
- 역할 컬럼: `MANAGER`, `MEMBER`, `VIEWER`
- 기존과 동일하게 토글 조작 및 저장 가능

### 3.2 역할 표기 정의

| 역할 | 한국어 | 영어 | 베트남어 |
|------|-------|------|---------|
| SUPER_ADMIN | 최고 관리자 | Super Admin | Quản trị tối cao |
| ADMIN | 관리자 | Admin | Quản trị viên |
| MANAGER | 매니저 | Manager | Quản lý |
| MEMBER | 멤버 | Member | Thành viên |
| VIEWER | 뷰어 | Viewer | Người xem |

### 3.3 백엔드 상수 정리

`apps/api/src/global/constant/menu-code.constant.ts` 수정:

- `ROLES`에 `SUPER_ADMIN`, `MEMBER`, `VIEWER` 추가
- `DEFAULT_PERMISSIONS`에 `MEMBER`, `VIEWER` 정의
  - `MEMBER` 기본값 = 기존 `USER` 기본값과 동일
  - `VIEWER` 기본값 = CHAT 메뉴 + 기본 업무도구만 접근, 관리 기능 모두 비허용
- `onModuleInit`에서 새 역할 레코드 자동 생성 (기존 레코드 보존)

### 3.4 사용자별 권한 탭 개선

- 유저 선택 드롭다운에서 `ADMIN_GROUP` 유저 제외 (전체 접근이므로 개별 설정 불필요)
- 유저 목록에 역할(`role`) + 그룹(`group`) 뱃지 표시

---

## 4. 제약 사항

1. **기존 레코드 보존**: `ADMIN`, `MANAGER`, `USER` 역할 레코드 삭제 금지
2. **`USER` 역할 유지**: DB에 `USER` 역할 유저가 있을 경우에 대비, `DEFAULT_PERMISSIONS.USER` 정의 유지
3. **이미 완료된 수정 (2026-02-22)**:
   - `admin.guard.ts`: SUPER_ADMIN 처리 추가 ✅
   - `menu-permission.service.ts`: SUPER_ADMIN 임시 처리 추가 ✅
4. **스테이징 DB 자동 반영**: `onModuleInit` 로직으로 배포 재시작 시 `MEMBER`, `VIEWER` 레코드 자동 생성

---

## 5. 사용자 플로우 (TO-BE)

```
관리자 로그인
  └─ /settings/permissions 진입
       ├─ [메뉴 설정 탭] (변경 없음)
       │    └─ 메뉴 ON/OFF + 정렬 수정 → 저장
       ├─ [역할별 권한 탭] (개선)
       │    ├─ [ADMIN_GROUP] 서브탭
       │    │    └─ SUPER_ADMIN, ADMIN 컬럼 → 전체 ON 잠금 표시
       │    └─ [USER_GROUP] 서브탭
       │         ├─ MANAGER / MEMBER / VIEWER 컬럼 토글
       │         └─ 저장
       └─ [사용자별 권한 탭] (소폭 개선)
            ├─ USER_GROUP 유저만 선택 가능
            ├─ 유저에게 특정 메뉴 개별 권한 부여/차단
            └─ 저장/삭제
```
