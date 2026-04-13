# 작업 계획서: 포탈 계정 생성 시 Entity 생성 기능 추가

- **작성일**: 2026-03-04
- **분석서**: `docs/analysis/REQ-포탈계정생성시Entity생성기능-20260304.md`
- **범위**: 프론트엔드 전용 (백엔드 변경 없음)

---

## 시스템 현황 분석

### 재사용 가능한 기존 코드
- `useEntityList()` — 법인 목록 조회 (hooks/useEntities.ts)
- `useCreateEntity()` — 법인 생성 mutation (hooks/useEntities.ts)
- `entityApiService.createEntity()` — Entity 생성 API (POST /hr/entities)
- `portalBridgeService.createInternalAccount()` — 계정 생성 API
- Entity 생성 API 필수 필드: `code`, `name`, `country`, `currency`

### 핵심 포인트
- **백엔드 변경 불필요**: 기존 `POST /hr/entities` + `POST /portal-bridge/customers/:pctId/create-account` 순차 호출
- 프론트엔드 `CreateAccountModal` 컴포넌트만 수정

---

## 구현 단계

### Step 1: CreateAccountModal 리팩토링

**파일**: `apps/web/src/domain/portal-bridge/pages/PortalCustomerPage.tsx`

**변경 내용**:

1. **모드 전환 추가**: `entityMode` 상태 ('select' | 'create')
   - 'select': 기존 Entity 드롭다운 (기본값)
   - 'create': 새 Entity 생성 폼

2. **Department 필드 삭제**

3. **새 Entity 생성 폼 필드 추가** (entityMode === 'create' 일 때):
   - Company Name (필수) — `customer.pctCompanyName`으로 초기화
   - Entity Code (필수) — 회사명 기반 자동 생성
   - Country (필수) — `customer.pctCountry` 매핑하여 초기화 ('KR' | 'VN')
   - Currency (필수) — country에 따라 자동 선택 (KR→KRW, VN→VND)

4. **Role 조건부 처리**:
   - `entityMode === 'select'`: 기존대로 4가지 중 자유 선택
   - `entityMode === 'create'`: MASTER 고정, disabled 표시

5. **Submit 로직 2단계 처리**:
   ```
   if (entityMode === 'create') {
     1. POST /hr/entities → entityId 반환
     2. POST /portal-bridge/customers/:pctId/create-account (entity_id = 새 entityId, role = 'MASTER')
   } else {
     기존 로직 유지
   }
   ```

### Step 2: 헬퍼 로직

**같은 파일 내 유틸리티**:

1. **Entity Code 자동 생성**:
   ```typescript
   // 회사명 → 코드 변환 예시:
   // "Amoeba Vietnam" → "AMOVN"
   // "ABC Company" → "ABCCO"
   // 영문만 추출 → 대문자 → 최대 5자 + 랜덤 3자리
   ```

2. **Country → Currency 매핑**:
   ```typescript
   const COUNTRY_CURRENCY: Record<string, string> = {
     KR: 'KRW',
     VN: 'VND',
   };
   ```

3. **포탈 Country → Entity Country 매핑**:
   ```typescript
   // pctCountry가 'KR'이 아니면 'VN' 기본값
   ```

---

## 사이드 임팩트 분석

| 영향 범위 | 위험도 | 설명 |
|-----------|--------|------|
| 기존 Entity 선택 플로우 | 낮음 | 기존 로직 그대로 유지, 모드 전환만 추가 |
| Entity 목록 | 낮음 | 새 Entity 생성 시 useCreateEntity → invalidateQueries로 자동 갱신 |
| 백엔드 API | 없음 | 변경 없음 |
| 다른 페이지 | 없음 | CreateAccountModal은 PortalCustomerPage 내부 컴포넌트 |

---

## 수정 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `apps/web/src/domain/portal-bridge/pages/PortalCustomerPage.tsx` | 수정 | CreateAccountModal 리팩토링 |

**총 1개 파일 수정** (프론트엔드 전용, 백엔드 변경 없음)

---

## TO-BE 모달 UI 설계

```
┌──────────────────────────────────────────┐
│ Create Internal Account              [X] │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Portal Customer                    │   │
│ │ Kim Minji                          │   │
│ │ minji@company.com                  │   │
│ │ ABC Vietnam Co., Ltd               │   │
│ └────────────────────────────────────┘   │
│                                          │
│ Entity *                                 │
│ ┌──────────────────┬─────────────────┐   │
│ │ Select Existing  │ Create New      │   │
│ └──────────────────┴─────────────────┘   │
│                                          │
│ [Select Existing 선택 시]                │
│ ┌────────────────────────────────────┐   │
│ │ Select entity...                 ▼ │   │
│ └────────────────────────────────────┘   │
│                                          │
│ [Create New 선택 시]                     │
│ Company Name *                           │
│ ┌────────────────────────────────────┐   │
│ │ ABC Vietnam Co., Ltd (자동입력)     │   │
│ └────────────────────────────────────┘   │
│ Entity Code *                            │
│ ┌────────────────────────────────────┐   │
│ │ ABCVN001 (자동생성)                │   │
│ └────────────────────────────────────┘   │
│ ┌─────────────────┬──────────────────┐   │
│ │ Country *       │ Currency *       │   │
│ │ [Vietnam   ▼]  │ [VND        ▼]  │   │
│ └─────────────────┴──────────────────┘   │
│                                          │
│ Role                                     │
│ ┌────────────────────────────────────┐   │
│ │ MASTER (고정 / 기존: 자유선택)      │   │
│ └────────────────────────────────────┘   │
├──────────────────────────────────────────┤
│              [Cancel]  [Create Account]  │
└──────────────────────────────────────────┘
```

---

## 검증 방법
1. `npm run build` 빌드 확인
2. 기존 Entity 선택 → 계정 생성 정상 동작 확인
3. 새 Entity 생성 → 계정 생성 정상 동작 확인
4. 새 Entity 생성 시 Role이 MASTER로 고정되는지 확인
5. 포탈 고객의 회사명/국가가 기본값으로 채워지는지 확인
6. Entity 생성 실패 시 에러 처리 확인 (코드 중복 등)
