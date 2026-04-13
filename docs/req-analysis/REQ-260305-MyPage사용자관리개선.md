# 요구사항 분석서: MyPage 사용자 관리 개선

**문서번호**: REQ-MyPage사용자관리개선-20260305
**작성일**: 2026-03-05
**URL**: https://stg-mng.amoeba.site/my-page

---

## 1. AS-IS 현황

### 1.1 MyPage 현재 섹션 순서

| 순서 | 섹션 | 아이콘 | 현재 상태 |
|------|------|--------|----------|
| 1 | Profile Information (기본 정보) | - | 이메일, 이름, **department(MANAGEMENT)**, 역할, 회사 이메일, 가입일 |
| 2 | Unit Assignment (Unit 배정 현황) | Building2 teal | **units.noDepartments 번역 키 미존재** |
| 3 | Organization Membership (소속 법인 현황) | Landmark emerald | 법인 테이블 |
| 4 | Leave Balance (연차 현황) | CalendarDays blue | 부여/사용/잔여/이월 |
| 5 | Password Change (비밀번호 변경) | Lock | 비밀번호 변경 폼 |
| 6 | Timezone & Language | Globe | 타임존/언어 설정 |

### 1.2 발견된 문제점

#### i18n 키 불일치 (번역 깨짐)
| 코드에서 사용하는 키 | locale 파일의 실제 키 | 화면 표시 |
|---------------------|---------------------|----------|
| `profile.department` | `profile.unit` | **profile.department** (raw 키 노출) |
| `units.noDepartments` | `units.noUnits` | **units.noDepartments** (raw 키 노출) |

#### 용어 혼선
- 코드 변수명: `dept` (department 약자)로 Unit 데이터를 순회
- Profile 항목: `department` 라벨로 Unit 값 표시
- 실제 표시 값: `dbUser.usrUnit` → "MANAGEMENT" (하드코딩된 레거시 값)

#### Cell 소속 정보 미표시
- MyPage에 Cell Assignment 섹션이 없음
- 사용자가 속한 Cell 정보를 확인할 방법이 없음
- 백엔드 `getMyProfile` API에 Cell 데이터 미포함

### 1.3 조직 구조 현황

```
HrEntity (법인 - ROOT/SUBSIDIARY)
  ├── Unit (Level 1: 부서/사업부)
  │   └── Unit (Level 2: 팀) ← Section 정책 기반
  ├── Cell (평면 구조, 부서 경계 무관 그룹)
  └── 사용자 할당:
      ├── amb_user_unit_roles (역할: MEMBER/TEAM_LEAD/UNIT_HEAD, 주부서 지정 가능)
      └── amb_user_cells (단순 멤버십, 역할 없음)
```

**정책**: Units는 하위에 Section을 만들 수 있음 (Level 1 → Level 2)

---

## 2. TO-BE 요구사항

### 2.1 MyPage 섹션 순서 변경

| 순서 | 섹션 | 변경 사항 |
|------|------|----------|
| 1 | **Profile Information** | `profile.department` → `profile.unit` 키 수정 |
| 2 | **Organization Membership** (소속 법인) | ↑ 위로 이동 (현재 3번) |
| 3 | **Unit Assignment** (Unit 배정) | ↓ 아래로 이동 (현재 2번) |
| 4 | **Cell Assignment** (셀 배정) | **신규 추가** |
| 5 | Leave Balance | 기존 유지 |
| 6 | Password Change | 기존 유지 |
| 7 | Timezone & Language | 기존 유지 |

### 2.2 Profile Information 수정

- `profile.department` → `profile.unit` i18n 키 수정
- 표시 값: `profile.unit` (레거시 usrUnit) 대신 **주요 Unit(isPrimary=true)의 unitName** 표시
- Unit 미배정 시 소속 법인의 기본 Unit "Holding" 표시

### 2.3 Unit Assignment - 기본값 정책

- Unit 미배정 사용자: entity-settings/organization에서 생성된 Units 목록에서 지정
- **기본값**: 없으면 "Holding" Unit 자동 지정
- `units.noDepartments` → `units.noUnits` 키 수정

### 2.4 Cell Assignment 섹션 신규 추가

- 사용자가 속한 Cell 목록 표시
- 테이블 컬럼: Cell명 | 소속 법인
- 빈 상태: "소속된 Cell이 없습니다"

---

## 3. 갭 분석

### 3.1 프론트엔드

| 항목 | AS-IS | TO-BE | 작업 |
|------|-------|-------|------|
| 섹션 순서 | Profile → Unit → Entity | Profile → Entity → Unit → Cell | MyPage.tsx 순서 변경 |
| Profile department | `profile.department` 키 | `profile.unit` 키 | ProfileSection.tsx 수정 |
| Profile Unit 값 | `dbUser.usrUnit` (레거시) | 주요 Unit명 | API 수정 필요 |
| Unit 빈 상태 | `units.noDepartments` | `units.noUnits` | MyPage.tsx 키 수정 |
| Cell 섹션 | 없음 | Cell 테이블 | MyPage.tsx 신규 |
| i18n | 키 불일치 | 정상 매핑 | locale 파일 수정 |

### 3.2 백엔드

| 항목 | AS-IS | TO-BE | 작업 |
|------|-------|-------|------|
| `getMyProfile` API | units, entities만 반환 | units, entities, **cells** 반환 | user.controller.ts 수정 |
| Profile unit 필드 | `dbUser.usrUnit` (문자열) | 주요 Unit명 또는 Holding | 매핑 로직 수정 |

### 3.3 타입 정의

| 항목 | 변경 |
|------|------|
| `MyProfileResponse` | `cells: MyCellInfo[]` 필드 추가 |
| `MyCellInfo` (신규) | `cellId`, `cellName`, `entityName` |

---

## 4. Units 계층 구조 설명

### entity-settings/organization 에서의 Units 관리

```
법인(HrEntity)
  └── Units 관리
       ├── Top Level (Level 1): 사업부/부서 단위
       │   └── Section (Level 2): 팀/섹션 단위
       └── Holding: 시스템 기본 Unit (미배정자 자동 소속)
```

| 구분 | Level | 설명 | 예시 |
|------|-------|------|------|
| Top Level | 1 | 최상위 조직 단위, parent_id = NULL | 경영지원본부, 개발본부, 영업본부 |
| Section | 2 | Top Level 하위 세부 단위 | 인사팀, 재무팀, 백엔드팀 |
| Holding | 1 | 시스템 예약, 삭제 불가 | 미배정 사용자 기본 소속 |

**정책 확인 사항**:
- Units는 하위에 Section을 만들 수 있다 (2단계 계층)
- 사용자는 여러 Unit에 소속 가능 (주 Unit 1개 지정)
- Cell은 Unit과 독립적인 평면 그룹 (프로젝트팀, 태스크포스 등)

---

## 5. 영향도 분석

### 수정 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `apps/web/src/domain/my-page/pages/MyPage.tsx` | 섹션 순서 변경, Cell 섹션 추가, i18n 키 수정 |
| `apps/web/src/domain/my-page/components/ProfileSection.tsx` | department → unit 키 수정 |
| `apps/web/src/locales/ko/myPage.json` | Cell 관련 키 추가, 키 정리 |
| `apps/web/src/locales/en/myPage.json` | 동일 |
| `apps/web/src/locales/vi/myPage.json` | 동일 |
| `apps/api/src/domain/auth/controller/user.controller.ts` | Cell 데이터 추가, unit 필드 매핑 수정 |
| `packages/types/src/domain.types.ts` | MyCellInfo 타입 추가, MyProfileResponse 확장 |

### 사이드 임팩트
- MyPage만 영향받으며 다른 페이지에 영향 없음
- API 응답에 `cells` 필드 추가는 하위 호환 (기존 필드 유지)
- Holding Unit 자동 지정은 기존 데이터에 영향 없음 (표시만 변경)
