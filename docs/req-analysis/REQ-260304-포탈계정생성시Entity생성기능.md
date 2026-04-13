# 요구사항 분석서: 포탈 계정 생성 시 Entity 생성 기능 추가

- **작성일**: 2026-03-04
- **요청**: 포탈 고객 → 내부 계정 생성 시 새로운 법인(Entity) 생성 기능 추가
- **페이지**: `/settings/portal-bridge` > Create Account 모달

---

## 1. AS-IS 현황

### 1.1 현재 Create Internal Account 모달 구조
```
┌─────────────────────────────────────┐
│ Create Internal Account         [X] │
├─────────────────────────────────────┤
│ Portal Customer (읽기 전용)          │
│ ├─ Name / Email / Company           │
│                                     │
│ Entity * (기존 법인 선택만 가능)      │
│ └─ [Select entity... ▼]            │
│                                     │
│ Role (MASTER/MANAGER/MEMBER/VIEWER) │
│                                     │
│ Department (optional)               │
├─────────────────────────────────────┤
│            [Cancel] [Create Account]│
└─────────────────────────────────────┘
```

### 1.2 현재 제약사항
- **기존 Entity만 선택 가능**: 새로운 고객사가 포탈에서 가입했을 때, 관리자가 먼저 Settings > Entities 페이지에서 법인을 생성한 후 돌아와서 계정을 생성해야 함
- Department 필드가 있으나 실제 사용되지 않음 (기본값 'GENERAL'로 처리)
- Role 선택이 자유롭지만, 새 Entity 생성 시에는 MASTER 고정이 적합

### 1.3 관련 백엔드 API

| API | 용도 | 상태 |
|-----|------|------|
| `POST /portal-bridge/customers/:pctId/create-account` | 내부 계정 생성 | 구현 완료 |
| `POST /hr/entities` | 법인 생성 | 구현 완료 |
| `GET /hr/entities` | 법인 목록 조회 | 구현 완료 |

### 1.4 Entity 생성 API 필수/선택 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `code` | string (max 10) | O | 법인 코드 (UNIQUE) |
| `name` | string (max 200) | O | 법인명 |
| `country` | 'KR' \| 'VN' | O | 국가 |
| `currency` | 'KRW' \| 'VND' \| 'USD' | O | 통화 |
| `name_en` | string | X | 영문명 |
| `registration_no` | string | X | 사업자번호 |
| `address` | string | X | 주소 |
| `representative` | string | X | 대표자 |
| `phone` | string | X | 전화번호 |
| `email` | string | X | 이메일 |
| `pay_day` | number (1-31) | X | 급여일 (기본 25) |

---

## 2. TO-BE 요구사항

### 2.1 핵심 요구사항
1. **Create Account 모달에서 "새 Entity 생성" 기능 추가**
   - 기존 Entity 선택 기능은 유지
   - "Create New Entity" 옵션 추가로 인라인 Entity 생성 가능
2. **새 Entity 생성 시 역할은 MASTER 고정**
   - 새 법인의 최초 사용자이므로 MASTER 역할이 적합
3. **Department 필드 삭제**
   - 사용하지 않는 필드 제거
4. **포탈 고객의 회사명/국가 정보를 Entity 생성 시 기본값으로 활용**

### 2.2 TO-BE 모달 구조
```
┌─────────────────────────────────────────┐
│ Create Internal Account             [X] │
├─────────────────────────────────────────┤
│ Portal Customer (읽기 전용)              │
│ ├─ Name / Email / Company               │
│                                         │
│ Entity *                                │
│ ┌─ (●) Select Existing                 │
│ │  └─ [Select entity... ▼]             │
│ │                                       │
│ └─ (○) Create New Entity               │
│    ├─ Company Name * [포탈 회사명 기본]  │
│    ├─ Entity Code *  [자동 생성 제안]    │
│    ├─ Country *      [포탈 국가 기본 ▼] │
│    └─ Currency *     [국가 연동 자동 ▼] │
│                                         │
│ Role                                    │
│ └─ [기존 선택 시 자유 / 신규 시 MASTER]  │
├─────────────────────────────────────────┤
│            [Cancel]  [Create Account]   │
└─────────────────────────────────────────┘
```

### 2.3 사용자 플로우

**플로우 A: 기존 Entity 선택 (기존과 동일)**
1. Create Account 클릭
2. "Select Existing" 라디오 선택 (기본)
3. 드롭다운에서 Entity 선택
4. Role 자유 선택
5. Create Account 클릭

**플로우 B: 새 Entity 생성**
1. Create Account 클릭
2. "Create New Entity" 라디오 선택
3. 회사명 자동 입력됨 (포탈 고객의 pctCompanyName)
4. Entity Code 자동 생성됨 (회사명 기반)
5. Country 자동 선택됨 (포탈 고객의 pctCountry, 없으면 'VN')
6. Currency 국가에 따라 자동 선택 (KR→KRW, VN→VND)
7. Role은 MASTER 고정 (변경 불가)
8. Create Account 클릭 → Entity 생성 → 계정 생성 순차 실행

---

## 3. 갭 분석

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| Entity 선택 | 기존 목록에서만 선택 | 기존 선택 + 새로 생성 | 프론트엔드 모달 UI 변경 |
| Role 선택 | 4가지 자유 선택 | 기존 Entity: 자유 / 신규 Entity: MASTER 고정 | 조건부 UI 로직 |
| Department | optional 입력 | 삭제 | 필드 제거 |
| Entity 생성 | 별도 페이지 필요 | 모달 내 인라인 생성 | 프론트엔드 2-step API 호출 |
| 백엔드 API | - | 변경 없음 | 없음 (기존 API 재사용) |

---

## 4. 기술 제약사항

### 4.1 백엔드 변경 불필요
- `POST /hr/entities` 기존 API로 Entity 생성
- `POST /portal-bridge/customers/:pctId/create-account` 기존 API로 계정 생성
- 프론트엔드에서 **2단계 순차 호출**로 처리

### 4.2 Entity Code 유니크 제약
- `entCode`는 DB UNIQUE 제약이 있으므로 자동 생성 시 중복 검사 필요
- 회사명 기반 코드 생성 로직: 영문 대문자 변환 + 숫자 suffix

### 4.3 Country 제약
- Entity country는 'KR' 또는 'VN'만 허용
- 포탈 고객의 pctCountry가 이 외의 값이면 기본값 'VN' 사용

### 4.4 Currency 매핑
- KR → KRW
- VN → VND
- 기타 → USD 선택 가능
