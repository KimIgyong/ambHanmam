# REQ-지출결의서 Forecast Report 기능 개선

> 작성일: 2026-03-12  
> 작성자: AI Assistant  
> 상태: 분석 완료

---

## 목차

1. [요구사항 원문](#1-요구사항-원문)
2. [AS-IS 현황 분석](#2-as-is-현황-분석)
3. [버그 수정 내역 (이번 세션)](#3-버그-수정-내역-이번-세션)
4. [TO-BE 요구사항](#4-to-be-요구사항)
5. [갭 분석](#5-갭-분석)
6. [사용자 플로우](#6-사용자-플로우)
7. [기술 제약사항](#7-기술-제약사항)
8. [우선순위](#8-우선순위)

---

## 1. 요구사항 원문

> 지출결의서 중 정기 지출로 등록된 건을 기반으로 다음달 지출해야 할 예상 리포트 화면이 구현되지 않았다.
> 이 기능 구성 현황을 조사하고 추가 작업해야 할 사항들을 정리하라.

**접근 URL**: `https://stg-ama.amoeba.site/expense-requests/reports/forecast`

**발생 에러**: `TypeError: Cannot read properties of undefined (reading 'map')`

---

## 2. AS-IS 현황 분석

### 2.1 구현 완료된 것들

| 영역 | 파일 | 상태 |
|------|------|------|
| DB 테이블 | `amb_expense_forecast_reports` | ✅ 생성됨 |
| DB 테이블 | `amb_expense_forecast_items` | ✅ 생성됨 |
| API 엔드포인트 | `GET /forecast?year&month` | ✅ 단건 조회 |
| API 엔드포인트 | `GET /forecast/preview?year&month` | ✅ 정기 지출 미리보기 |
| API 엔드포인트 | `POST /forecast` | ✅ 리포트 저장 |
| API 엔드포인트 | `PATCH /forecast/:id` | ✅ 리포트 수정 |
| API 엔드포인트 | `GET /forecast/:id/export` | ✅ Excel 다운로드 |
| 프론트 페이지 | `ForecastReportPage.tsx` | ✅ 기본 UI 구현 |
| 프론트 훅 | `useForecastReport`, `useForecastPreview` 등 | ✅ 구현 |

### 2.2 현재 브라우저 에러 발생 원인 (4가지)

#### 원인 1: TransformInterceptor 응답 래핑 미대응
```
NestJS 응답: { success: true, data: ForecastReport, timestamp: "..." }
Axios 반환:  AxiosResponse.data = { success: true, data: ..., timestamp: ... }
useQuery select: (res) => res.data  →  { success, data, timestamp } 반환
ForecastReportPage: report.items.map() → "items" undefined 에러
```
**영향**: `useForecastReport`, `useForecastPreview`, `useMonthlyReport` 3개 훅 모두 해당

#### 원인 2: `report.items` 옵셔널 체이닝 없음
```tsx
// ForecastReportPage.tsx View Mode
{report.items.map((item, idx) => (  // ← items가 null/undefined이면 에러
```

#### 원인 3: `ForecastReport.status` 필드 미반환
- 프론트 인터페이스: `status: 'DRAFT' | 'SUBMITTED' | 'APPROVED'`
- 백엔드 엔티티: `efr_status` 컬럼 없음 → `toReportResponse()`에서 반환하지 않음
- 결과: `t('forecast.status.undefined')` 표시 (에러는 아님, 표시 버그)

#### 원인 4: 저장 요청 필드명 불일치
- 프론트 `ForecastItemBody`: `name` 필드 전송
- 백엔드 `ForecastItemDto`: `title` 필드 기대 (`@IsString() title: string`)
- `ValidationPipe(whitelist: true)` → `name` 제거, `title` undefined → 400 Bad Request

### 2.3 정기 지출 미리보기 로직 (`getPreview()`) 현재 구현

```typescript
// expense-forecast.service.ts
const recurringRequests = await this.requestRepo.find({
  where: {
    entId: entityId,
    exrFrequency: 'RECURRING',
    exrStatus: 'APPROVED',
  },
});
```

**문제점:**
1. `exrPeriod` (MONTHLY/QUARTERLY/SEMI_ANNUAL/ANNUAL) 무시 → QUARTERLY인 건도 매월 포함
2. `exrNextDueDate` 미활용 → 당월 해당 여부 판단 없음
3. `exrEndDate` 미체크 → 만료된 정기 지출도 포함
4. `exrStartDate` 미체크 → 아직 시작 안 된 정기 지출도 포함

### 2.4 DB 스키마 현재 상태

#### `amb_expense_forecast_reports` 테이블 (현재)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `efr_id` | UUID PK | - |
| `ent_id` | varchar | 법인 ID |
| `efr_year` | int | 년도 |
| `efr_month` | int | 월 |
| `efr_title` | varchar(200) nullable | 리포트 제목 |
| `efr_note` | text nullable | 메모 |
| `efr_creator_id` | varchar | 작성자 ID |
| `efr_total_vnd` | decimal(18,2) | VND 합계 |
| `efr_total_usd` | decimal(18,2) | USD 합계 |
| `efr_total_krw` | decimal(18,2) | KRW 합계 |
| `efr_created_at` | timestamp | - |
| `efr_updated_at` | timestamp | - |
| **`efr_status`** | **없음** | **→ 추가 필요** |

#### `amb_expense_forecast_items` 테이블 (현재)

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `efi_id` | UUID PK | - |
| `efr_id` | UUID FK | - |
| `efi_type` | varchar(20) | RECURRING/MANUAL |
| `exr_id` | UUID nullable | 원본 지출결의서 ID |
| `efi_title` | varchar(200) | 항목명 |
| `efi_category` | varchar(50) nullable | 카테고리 |
| `efi_prev_amount` | decimal nullable | 전월 실적 |
| `efi_amount` | decimal | 예정 금액 |
| `efi_currency` | varchar(10) | 통화 |
| `efi_note` | text nullable | 메모 |
| `efi_sort_order` | int | 정렬 순서 |
| **`efi_quantity`** | **없음** | **→ 추가 필요** |

### 2.5 카테고리 불일치

| 영역 | 카테고리 목록 |
|------|-------------|
| **백엔드 엔티티** (`ExpenseCategory`) | TRANSPORTATION, ENTERTAINMENT, OFFICE_SUPPLIES, MEALS, SOFTWARE, RENT, UTILITIES, MARKETING, TRAINING, HR_BENEFITS, OTHER |
| **프론트 폼** (`CATEGORIES`) | TRAVEL, ENTERTAINMENT, SUPPLIES, TRAINING, MARKETING, IT_INFRASTRUCTURE, MAINTENANCE, UTILITIES, OTHER |

→ TRAVEL vs TRANSPORTATION, SUPPLIES vs OFFICE_SUPPLIES 등 불일치

---

## 3. 버그 수정 내역 (이번 세션, 커밋 e3625ef)

| 버그 | 수정 방법 | 상태 |
|------|----------|------|
| `res.data.data` 미추출 | `useExpenseReport.ts` select 3개 수정 | ✅ |
| `report.items.map()` TypeError | 옵셔널 체이닝 `(report.items ?? []).map()` | ✅ |
| `status` 필드 미반환 | `toReportResponse()`에 `status: 'DRAFT'` 추가 | ✅ (임시) |
| `name` vs `title` 불일치 | DTO `@IsOptional()` + service fallback | ✅ |
| `prevAmount/currency` 미반환 | `toReportResponse()` 필드 추가 | ✅ |

---

## 4. TO-BE 요구사항

### REQ-01: 정기 지출 기간 필터링 (핵심)

**현재**: RECURRING + APPROVED 상태 전부를 preview에 포함  
**개선**: forecast 대상 연월에 실제 지불이 발생하는 건만 포함

**기간별 판단 기준**:

| `exrPeriod` | 포함 조건 |
|------------|---------|
| `MONTHLY` | 매월 포함 (`exrStartDate` 이후, `exrEndDate` 이전) |
| `QUARTERLY` | 3개월 간격: `(forecastMonth - startMonth) % 3 === 0` |
| `SEMI_ANNUAL` | 6개월 간격: `(forecastMonth - startMonth) % 6 === 0` |
| `ANNUAL` | 12개월 간격: forecastMonth === startMonth |

**추가 조건**:
- `exrStartDate ≤ forecast 대상 월의 마지막 날`
- `exrEndDate`가 있는 경우: `exrEndDate ≥ forecast 대상 월의 첫 날`
- `exrPaymentDay`: 지불일 정보를 forecast 항목 메모에 포함

### REQ-02: `exrNextDueDate` 활용

현재 `exrNextDueDate`는 Index가 있지만 미활용.  
매월 정기 지출 배치 처리 후 해당 필드를 업데이트하는 로직과 연계:
- `getPreview(year, month)`에서 `exrNextDueDate`가 해당 월 범위인 건 포함

### REQ-03: Forecast 리포트 상태 관리

**현재**: 상태 개념 없음 (항상 DRAFT 반환)  
**개선**: 

```
DRAFT → SUBMITTED → APPROVED(final)
  ↑          ↑
작성자    회계/MASTER 승인
```

- `efr_status` 컬럼 추가: `'DRAFT' | 'SUBMITTED' | 'APPROVED'`
- SUBMITTED: 회계 검토 요청
- APPROVED: MASTER/회계 승인 완료 → 수정 불가

### REQ-04: Quantity(수량) 저장

**현재**: `efi_quantity` 컬럼 없음, 항상 1로 고정  
**개선**: `efi_quantity int default 1` 컬럼 추가 및 저장/조회 로직 구현

프론트 `ForecastItemBody.quantity` → DB 저장 → 조회 시 반환

### REQ-05: 카테고리 표준화

백엔드 `ExpenseCategory` ↔ 프론트 `CATEGORIES` 통일:  
권장: 프론트 카테고리를 백엔드 기준으로 맞추거나, 공용 타입으로 관리

### REQ-06: 전월 실적 vs 예정 비교 컬럼 추가 (View 모드)

- `efi_prev_amount`가 이미 저장되지만 View 모드에서 미표시  
- View 모드 테이블에 "전월 실적" 컬럼 추가  
- 증감률 표시 (예정 vs 전월 실적 %)

### REQ-07: 작성자 이름 조회

- `toReportResponse()`에서 `createdByName: ''` 하드코딩  
- 사용자 테이블 조인하여 실제 이름 반환

### REQ-08: Forecast vs Monthly Actual 비교 리포트

- 특정 월의 예정(Forecast) vs 실적(Monthly Report) 비교 화면  
- 항목별 예정/실적/차이 표시

### REQ-09: Forecast 여러 달 목록 화면

- 현재 단건 조회만; 과거 forecast 목록 조회 없음
- `GET /forecast` (쿼리 없이)는 목록 반환하지만 프론트 화면 없음

### REQ-10: 정기 지출 manualItems 저장 시 ForecastItemBody 통일

- 프론트 ForecastItemBody: `name` 필드 사용
- 백엔드 DTO: `title` 필드 사용
- 이번에 fallback 처리로 해소했지만, 인터페이스 통일 필요

---

## 5. 갭 분석

| 요구사항 | 현재 상태 | 구현 필요 범위 |
|---------|---------|--------------|
| REQ-01: 기간 필터링 | ❌ 미구현 | BE service 수정 | 높음 |
| REQ-02: NextDueDate 활용 | ❌ 미구현 | BE service 수정 | 중간 |
| REQ-03: 리포트 상태 관리 | ❌ 미구현 | DB 컬럼 + BE + FE | 중간 |
| REQ-04: Quantity 저장 | ❌ 미구현 (하드코딩) | DB 컬럼 + BE + FE | 낮음 |
| REQ-05: 카테고리 통일 | ❌ 불일치 존재 | 데이터 마이그레이션 | 중간 |
| REQ-06: 전월 실적 비교 표시 | ❌ 미표시 | FE 레이아웃 수정 | 낮음 |
| REQ-07: 작성자 이름 | ❌ 빈 문자열 | BE join 추가 | 낮음 |
| REQ-08: Forecast vs Actual | ❌ 미구현 | 신규 기능 | 낮음 |
| REQ-09: Forecast 목록 화면 | ❌ 미구현 | FE 신규 페이지 | 낮음 |
| REQ-10: DTO 인터페이스 통일 | ⚠️ fallback 임시 해결 | 인터페이스 통일 | 낮음 |

---

## 6. 사용자 플로우

### 현재 (AS-IS) 플로우

```
회계/MASTER 접근: /expense-requests/reports/forecast
  ├── 년/월 선택
  ├── [리포트 만들기] 클릭 → 편집 모드 진입
  │     ├── [정기지출 불러오기] → getPreview() 호출
  │     │     └── RECURRING + APPROVED 전체 항목 (기간 미필터)
  │     ├── 수동 항목 추가
  │     └── [저장] → POST /forecast
  └── 리포트 존재 시 View 모드
        └── items 테이블 표시 (prevAmount 미표시)
```

### TO-BE 플로우

```
회계/MASTER 접근: /expense-requests/reports/forecast
  ├── 년/월 선택 (기본값: 익월)
  ├── 저장된 리포트 없음 → [리포트 만들기] 버튼
  │     ├── 편집 모드 진입 + 자동 미리보기 로드
  │     │     └── getPreview():
  │     │           ├── RECURRING + APPROVED
  │     │           ├── 기간(period) 기반 당월 해당 여부 필터
  │     │           ├── 시작일/종료일 범위 체크
  │     │           └── 전월 실적 금액 함께 반환
  │     ├── 정규 항목(자동) + 수동 항목 편집
  │     └── [저장] → DRAFT 상태로 저장
  │
  ├── DRAFT 리포트 존재 → View 모드
  │     ├── 항목 테이블 (예정금액 + 전월실적 + 증감)
  │     ├── [수정] 버튼
  │     └── [검토 요청] → SUBMITTED 상태 변경
  │
  └── SUBMITTED 리포트 (MASTER/회계 검토)
        ├── [승인] → APPROVED (수정 불가)
        └── [반려] → DRAFT 복귀
```

---

## 7. 기술 제약사항

- **DB 마이그레이션**: `efr_status`, `efi_quantity` 컬럼 추가는 기존 데이터에 default 값 필요
- **backward compatibility**: TypeORM synchronize로 컬럼 추가는 무중단 가능
- **카테고리 마이그레이션**: 기존 저장된 forecast items의 카테고리 값 변경 시 별도 migration SQL 필요
- **정기 지출 date 계산**: 타임존 (`Asia/Ho_Chi_Minh` 기준) 주의

---

## 8. 우선순위

| 우선순위 | 요구사항 | 난이도 | 예상 작업 |
|---------|---------|--------|---------|
| P1 (즉시) | REQ-01: 기간 필터링 | 중 | BE service 수정 (~2h) |
| P1 (즉시) | REQ-06: 전월 실적 표시 | 하 | FE 레이아웃 (~1h) |
| P2 | REQ-03: 리포트 상태 관리 | 상 | DB+BE+FE (~4h) |
| P2 | REQ-04: Quantity 저장 | 하 | DB+BE+FE (~1h) |
| P3 | REQ-05: 카테고리 통일 | 중 | DB migration+FE (~2h) |
| P3 | REQ-07: 작성자 이름 | 하 | BE join (~0.5h) |
| P3 | REQ-10: DTO 통일 | 하 | 인터페이스 정리 (~1h) |
| P4 | REQ-08: vs Actual 비교 | 상 | 신규 기능 (~6h) |
| P4 | REQ-09: Forecast 목록 화면 | 중 | FE 신규 페이지 (~3h) |
| P4 | REQ-02: NextDueDate 활용 | 중 | BE 배치+service (~3h) |
