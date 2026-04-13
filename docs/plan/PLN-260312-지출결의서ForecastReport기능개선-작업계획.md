# PLAN-지출결의서 Forecast Report 기능 개선 작업 계획서

> 작성일: 2026-03-12  
> 작성자: AI Assistant  
> 참조 분석서: [REQ-지출결의서ForecastReport기능개선-20260312.md](../analysis/REQ-지출결의서ForecastReport기능개선-20260312.md)  
> 상태: Phase 0 완료 / Phase 1~ 미시작

---

## 목차

1. [구현 범위 요약](#1-구현-범위-요약)
2. [시스템 현황 분석](#2-시스템-현황-분석)
3. [단계별 구현 계획](#3-단계별-구현-계획)
4. [변경 파일 목록](#4-변경-파일-목록)
5. [사이드 임팩트 분석](#5-사이드-임팩트-분석)
6. [배포 체크리스트](#6-배포-체크리스트)

---

## 1. 구현 범위 요약

### Phase 0 — 즉시 버그 수정 (완료, 커밋 `e3625ef`)

| 항목 | 내용 |
|------|------|
| map TypeError 수정 | TransformInterceptor 응답 래핑 대응 |
| items 옵셔널 처리 | `report.items?.map()` |
| status 기본값 | `toReportResponse()`에 `status: 'DRAFT'` 추가 |
| name/title 불일치 | DTO + service fallback 처리 |

### Phase 1 — P1 핵심 기능 (즉시 착수)

| 영역 | 작업 항목 | 규모 |
|------|---------|------|
| BE — Service | 정기 지출 기간(period) 기반 필터링 | 중 |
| FE — View | 전월 실적(prevAmount) 컬럼 표시 | 소 |

### Phase 2 — P2 기능 (Phase 1 완료 후)

| 영역 | 작업 항목 | 규모 |
|------|---------|------|
| DB | `efr_status`, `efi_quantity` 컬럼 추가 | 소 |
| BE — Entity | 신규 컬럼 매핑 | 소 |
| BE — Service | 상태 워크플로우, quantity 저장/반환 | 중 |
| BE — Controller | SUBMITTED/APPROVED 엔드포인트 | 소 |
| FE — Page | 상태 표시, 검토 요청 버튼 | 중 |

### Phase 3 — P3 정리 (선택적)

| 영역 | 작업 항목 | 규모 |
|------|---------|------|
| BE/FE | 카테고리 통일 | 중 |
| BE | 작성자 이름 join 조회 | 소 |
| FE/BE | ForecastItemBody name/title 인터페이스 통일 | 소 |

---

## 2. 시스템 현황 분석

### 2.1 관련 파일 목록

**Backend**

| 파일 | 역할 |
|------|------|
| `apps/api/src/domain/expense-request/entity/expense-forecast-report.entity.ts` | 리포트 엔티티 |
| `apps/api/src/domain/expense-request/entity/expense-forecast-item.entity.ts` | 항목 엔티티 |
| `apps/api/src/domain/expense-request/service/expense-forecast.service.ts` | 핵심 비즈니스 로직 |
| `apps/api/src/domain/expense-request/controller/expense-report.controller.ts` | API 엔드포인트 |
| `apps/api/src/domain/expense-request/dto/expense-report.dto.ts` | Request DTO |

**Frontend**

| 파일 | 역할 |
|------|------|
| `apps/web/src/domain/expense-request/pages/ForecastReportPage.tsx` | Forecast 화면 |
| `apps/web/src/domain/expense-request/hooks/useExpenseReport.ts` | React Query 훅 |
| `apps/web/src/domain/expense-request/service/expenseRequest.service.ts` | API 서비스 |

### 2.2 현재 `getPreview()` 로직 (AS-IS)

```typescript
// expense-forecast.service.ts
const recurringRequests = await this.requestRepo.find({
  where: {
    entId: entityId,
    exrFrequency: 'RECURRING',  // ← 정기 지출 필터
    exrStatus: 'APPROVED',       // ← 승인된 건만
  },
});
// → period/startDate/endDate 무시, 전체 반환
```

### 2.3 정기 지출 엔티티 관련 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `exrFrequency` | `'ONE_TIME' \| 'RECURRING'` | 정기 여부 |
| `exrPeriod` | `'MONTHLY' \| 'QUARTERLY' \| 'SEMI_ANNUAL' \| 'ANNUAL' \| null` | 반복 주기 |
| `exrStartDate` | `date \| null` | 정기 지출 시작일 |
| `exrEndDate` | `date \| null` | 정기 지출 종료일 |
| `exrPaymentDay` | `int \| null` | 월 지불일 (1~31) |
| `exrNextDueDate` | `date \| null` | 다음 지불 예정일 |

### 2.4 현재 DB 스키마 갭

| 테이블 | 없는 컬럼 | 필요 이유 |
|--------|---------|---------|
| `amb_expense_forecast_reports` | `efr_status varchar(20) DEFAULT 'DRAFT'` | 리포트 상태 관리 |
| `amb_expense_forecast_items` | `efi_quantity int DEFAULT 1` | 수량 저장 |

---

## 3. 단계별 구현 계획

### Phase 1-A: 정기 지출 기간 필터링 (BE)

**파일**: `apps/api/src/domain/expense-request/service/expense-forecast.service.ts`

#### 구현 로직

```typescript
async getPreview(entityId: string, year: number, month: number) {
  const recurringRequests = await this.requestRepo.find({
    where: {
      entId: entityId,
      exrFrequency: 'RECURRING',
      exrStatus: 'APPROVED',
    },
  });

  // forecast 대상 월의 첫날/마지막날
  const targetFirstDay = new Date(year, month - 1, 1);
  const targetLastDay = new Date(year, month, 0);

  // 기간 필터링
  const filtered = recurringRequests.filter((req) => {
    // 시작일 이후인지 확인
    if (req.exrStartDate) {
      const startDate = new Date(req.exrStartDate);
      if (startDate > targetLastDay) return false; // 아직 시작 안 함
    }

    // 종료일 이전인지 확인
    if (req.exrEndDate) {
      const endDate = new Date(req.exrEndDate);
      if (endDate < targetFirstDay) return false; // 이미 종료됨
    }

    // 기간별 해당 월 여부
    const period = req.exrPeriod ?? 'MONTHLY';
    if (period === 'MONTHLY') return true;

    // 시작 월 기준으로 계산
    if (!req.exrStartDate) return true; // startDate 없으면 포함
    const startDate = new Date(req.exrStartDate);
    const startMonth = startDate.getFullYear() * 12 + startDate.getMonth();
    const targetMonthNum = year * 12 + (month - 1);
    const diff = targetMonthNum - startMonth;

    if (period === 'QUARTERLY') return diff >= 0 && diff % 3 === 0;
    if (period === 'SEMI_ANNUAL') return diff >= 0 && diff % 6 === 0;
    if (period === 'ANNUAL') return diff >= 0 && diff % 12 === 0;

    return true;
  });

  // 전월 실적 조회 (기존 로직 유지)
  // ...

  return filtered.map((req) => ({
    type: 'RECURRING' as const,
    category: (req.exrCategory ?? 'OTHER') as any,
    name: req.exrTitle,
    amount: Number(req.exrTotalAmount),
    quantity: 1,
    note: req.exrPaymentDay ? `지불일: ${req.exrPaymentDay}일` : null,
    currency: req.exrCurrency,
    prevAmount: prevAmountMap.get(req.exrId) || null,
    period: req.exrPeriod,
    exrId: req.exrId,
  }));
}
```

#### 주의사항
- `exrPeriod`가 null인 경우 MONTHLY로 간주
- `exrStartDate`가 null인 경우 시작일 체크 생략 (항상 포함)
- 타임존: `Date` 객체 비교 시 UTC 기준; date 문자열 파싱 주의

---

### Phase 1-B: View 모드 전월 실적 컬럼 표시 (FE)

**파일**: `apps/web/src/domain/expense-request/pages/ForecastReportPage.tsx`

#### 변경 내용

**View 모드 테이블 헤더에 "전월 실적" 컬럼 추가:**

```tsx
<thead>
  <tr>
    <th>{t('forecast.itemName')}</th>
    <th>{t('forecast.itemCategory')}</th>
    <th className="text-center">유형</th>
    <th className="text-right">전월 실적</th>   {/* 신규 */}
    <th className="text-right">예정 금액</th>
    <th className="text-right">증감</th>          {/* 신규 */}
  </tr>
</thead>
```

**각 행에 prevAmount 표시:**

```tsx
<td className="text-right text-gray-500">
  {item.prevAmount != null ? item.prevAmount.toLocaleString() : '-'}
</td>
<td className="text-right font-medium">
  {(item.amount * item.quantity).toLocaleString()}
</td>
<td className="text-right text-xs">
  {item.prevAmount != null && item.prevAmount > 0 ? (
    <span className={diff > 0 ? 'text-red-500' : 'text-green-600'}>
      {diff > 0 ? '▲' : '▼'} {Math.abs(Math.round((diff / item.prevAmount) * 100))}%
    </span>
  ) : '-'}
</td>
```

#### `ForecastItem` 인터페이스 수정 (expenseRequest.service.ts)

```typescript
export interface ForecastItem {
  type: ForecastItemType;
  category: ExpenseCategory;
  name: string;
  amount: number;
  quantity: number;
  note: string | null;
  currency?: string;
  prevAmount?: number | null;   // 신규
  period?: string | null;       // 신규
  exrId?: string | null;        // 신규
}
```

---

### Phase 2-A: DB 컬럼 추가

**SQL 마이그레이션 (스테이징/프로덕션 직접 실행):**

```sql
-- efr_status 컬럼 추가
ALTER TABLE amb_expense_forecast_reports
  ADD COLUMN IF NOT EXISTS efr_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- efi_quantity 컬럼 추가
ALTER TABLE amb_expense_forecast_items
  ADD COLUMN IF NOT EXISTS efi_quantity INT NOT NULL DEFAULT 1;
```

---

### Phase 2-B: 엔티티 수정

**`expense-forecast-report.entity.ts`:**

```typescript
@Column({ name: 'efr_status', type: 'varchar', length: 20, default: 'DRAFT' })
efrStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
```

**`expense-forecast-item.entity.ts`:**

```typescript
@Column({ name: 'efi_quantity', type: 'int', default: 1 })
efiQuantity: number;
```

---

### Phase 2-C: Service 수정

#### 상태 전환 메서드 추가

```typescript
/** 검토 요청 (DRAFT → SUBMITTED) */
async submit(id: string, entityId: string) {
  const report = await this.findOneOrFail(id, entityId);
  if (report.efrStatus !== 'DRAFT') throw new ConflictException('DRAFT 상태만 검토 요청 가능');
  report.efrStatus = 'SUBMITTED';
  return this.reportRepo.save(report);
}

/** 승인 (SUBMITTED → APPROVED) */
async approve(id: string, entityId: string) {
  const report = await this.findOneOrFail(id, entityId);
  if (report.efrStatus !== 'SUBMITTED') throw new ConflictException('SUBMITTED 상태만 승인 가능');
  report.efrStatus = 'APPROVED';
  return this.reportRepo.save(report);
}

/** 반려 (SUBMITTED → DRAFT) */
async reject(id: string, entityId: string) {
  const report = await this.findOneOrFail(id, entityId);
  if (report.efrStatus !== 'SUBMITTED') throw new ConflictException('SUBMITTED 상태만 반려 가능');
  report.efrStatus = 'DRAFT';
  return this.reportRepo.save(report);
}
```

#### `create()` / `update()` 수정

```typescript
// create: 수정 가능 여부 체크 생략 (신규는 항상 DRAFT)
// update: APPROVED 상태면 수정 불가
if (report.efrStatus === 'APPROVED') throw new ForbiddenException('승인된 리포트는 수정 불가');
```

#### `toReportResponse()` 업데이트

```typescript
toReportResponse(report: ExpenseForecastReportEntity) {
  return {
    // ...기존...
    status: report.efrStatus ?? 'DRAFT',   // 엔티티 컬럼 사용
    items: (report.items ?? []).map((item) => ({
      // ...기존...
      quantity: item.efiQuantity ?? 1,     // 엔티티 컬럼 사용
    })),
  };
}
```

---

### Phase 2-D: Controller 엔드포인트 추가

**`expense-report.controller.ts`:**

```typescript
@Post('forecast/:id/submit')
@ApiOperation({ summary: '예정 리포트 검토 요청 (DRAFT → SUBMITTED)' })
submitForecast(@Param('id') id: string, @CurrentUser() user: UserPayload) {
  return this.forecastService.submit(id, user.entityId!);
}

@Post('forecast/:id/approve')
@ApiOperation({ summary: '예정 리포트 승인 (SUBMITTED → APPROVED)' })
approveForecast(@Param('id') id: string, @CurrentUser() user: UserPayload) {
  return this.forecastService.approve(id, user.entityId!);
}

@Post('forecast/:id/reject')
@ApiOperation({ summary: '예정 리포트 반려 (SUBMITTED → DRAFT)' })
rejectForecast(@Param('id') id: string, @CurrentUser() user: UserPayload) {
  return this.forecastService.reject(id, user.entityId!);
}
```

---

### Phase 2-E: Frontend 상태 워크플로우 (FE)

**`expenseRequest.service.ts` 메서드 추가:**

```typescript
submitForecast(id: string) {
  return apiClient.post<ForecastReport>(`/expense-requests/reports/forecast/${id}/submit`);
},
approveForecast(id: string) {
  return apiClient.post<ForecastReport>(`/expense-requests/reports/forecast/${id}/approve`);
},
rejectForecast(id: string) {
  return apiClient.post<ForecastReport>(`/expense-requests/reports/forecast/${id}/reject`);
},
```

**`useExpenseReport.ts` 훅 추가:**

```typescript
export function useSubmitForecastReport() { ... }
export function useApproveForecastReport() { ... }
export function useRejectForecastReport() { ... }
```

**`ForecastReportPage.tsx` View 모드 버튼 추가:**

```tsx
{report.status === 'DRAFT' && (
  <button onClick={handleSubmit} className="... bg-blue-600 ...">
    검토 요청
  </button>
)}
{report.status === 'SUBMITTED' && isMasterOrAccounting && (
  <>
    <button onClick={handleApprove} className="... bg-green-600 ...">승인</button>
    <button onClick={handleReject} className="... border ...">반려</button>
  </>
)}
```

---

### Phase 3-A: 카테고리 통일

**백엔드 기준으로 통일 (권장):**

| 프론트 현재 | → 변경 후 (BE 기준) |
|-----------|-------------------|
| `TRAVEL` | `TRANSPORTATION` |
| `SUPPLIES` | `OFFICE_SUPPLIES` |
| `IT_INFRASTRUCTURE` | `SOFTWARE` |
| `MAINTENANCE` | `OTHER` |

**수정 파일:**
- `ForecastReportPage.tsx` — `CATEGORIES` 배열 수정
- `expenseRequest.service.ts` — `ExpenseCategory` 타입 수정
- 번역 파일 (`ko/en/vi/expenseRequest.json`) — 신규 키 추가

**DB 마이그레이션 (기존 데이터):**
```sql
UPDATE amb_expense_forecast_items
SET efi_category = 'TRANSPORTATION' WHERE efi_category = 'TRAVEL';
UPDATE amb_expense_forecast_items
SET efi_category = 'OFFICE_SUPPLIES' WHERE efi_category = 'SUPPLIES';
```

---

### Phase 3-B: 작성자 이름 join 조회

**`expense-forecast.service.ts` `toReportResponse()` 수정:**

```typescript
// 단건 조회 시 loadEagerRelations 활용 또는 별도 user 조회
const creator = await this.userRepo.findOne({ where: { usrId: report.efrCreatorId } });
return {
  // ...
  createdByName: creator ? (creator.usrName ?? creator.usrEmail) : '',
};
```

또는 `findByMonth()` 시 user join 쿼리:

```typescript
const report = await this.reportRepo
  .createQueryBuilder('r')
  .leftJoinAndMapOne('r.creator', AmbUserEntity, 'u', 'u.usr_id = r.efr_creator_id')
  .where('r.entId = :entityId AND r.efrYear = :year AND r.efrMonth = :month', ...)
  .getOne();
```

---

### Phase 3-C: ForecastItemBody 인터페이스 통일

**현재 불일치:**
- 프론트 `ForecastItemBody.name` → 백엔드 DTO `ForecastItemDto.title`

**통일 방향:** 프론트 `name` → `title`로 변경 (백엔드 기준)

```typescript
// expenseRequest.service.ts
export interface ForecastItemBody {
  type: ForecastItemType;
  category: ExpenseCategory;
  title: string;      // name → title 으로 변경
  amount: number;
  quantity: number;
  currency?: string;
  note?: string;
  exr_id?: string;
  prev_amount?: number;
}
```

**`ForecastReportPage.tsx` 수정:**
```tsx
// manualItems 초기값
{ type: 'MANUAL', category: 'OTHER', title: '', amount: 0, quantity: 1 }
// addManualItem, updateManualItem 등 name → title
```

---

## 4. 변경 파일 목록

### Phase 1

| 파일 | 변경 유형 |
|------|---------|
| `apps/api/src/domain/expense-request/service/expense-forecast.service.ts` | 기능 수정 |
| `apps/web/src/domain/expense-request/pages/ForecastReportPage.tsx` | 화면 수정 |
| `apps/web/src/domain/expense-request/service/expenseRequest.service.ts` | 인터페이스 추가 |

### Phase 2

| 파일 | 변경 유형 |
|------|---------|
| DB SQL | 컬럼 추가 ALTER TABLE |
| `apps/api/src/.../entity/expense-forecast-report.entity.ts` | 컬럼 추가 |
| `apps/api/src/.../entity/expense-forecast-item.entity.ts` | 컬럼 추가 |
| `apps/api/src/.../service/expense-forecast.service.ts` | 상태 메서드 추가 |
| `apps/api/src/.../controller/expense-report.controller.ts` | 엔드포인트 3개 추가 |
| `apps/web/src/.../service/expenseRequest.service.ts` | API 메서드 3개 추가 |
| `apps/web/src/.../hooks/useExpenseReport.ts` | 훅 3개 추가 |
| `apps/web/src/.../pages/ForecastReportPage.tsx` | 상태 버튼 UI 추가 |

### Phase 3

| 파일 | 변경 유형 |
|------|---------|
| `apps/web/src/.../pages/ForecastReportPage.tsx` | 카테고리/필드명 변경 |
| `apps/web/src/.../service/expenseRequest.service.ts` | 타입 변경 |
| `apps/web/src/locales/*/expenseRequest.json` | 번역 키 추가 |
| `apps/api/src/.../service/expense-forecast.service.ts` | User join 추가 |
| DB SQL (Phase 3 카테고리) | 데이터 UPDATE |

---

## 5. 사이드 임팩트 분석

| 변경 | 잠재적 영향 | 완화 방법 |
|------|-----------|---------|
| 기간 필터링 추가 | 기존에 preview에 보이던 항목 일부 사라짐 | 의도된 변경. 사용자에게 필터 기준 노출 |
| `efr_status` 컬럼 추가 | 기존 리포트 모두 DRAFT로 설정 | DEFAULT 'DRAFT' 으로 안전 |
| `efi_quantity` 컬럼 추가 | 기존 항목 모두 수량 1로 설정 | DEFAULT 1 으로 안전 |
| 카테고리 변경 | 기존 저장 데이터와 불일치 | 마이그레이션 SQL 선 실행 후 코드 배포 |
| name → title 변경 | 기존 저장 리포트 열람 시 항목명 빈칸 | 이미 title fallback 처리로 수정됨 |

---

## 6. 배포 체크리스트

### Phase 1 배포

```
□ BE: getPreview() 기간 필터링 수정
□ FE: ForecastItem 인터페이스에 prevAmount, currency 추가
□ FE: View 모드 전월 실적 컬럼 추가
□ git commit & push
□ 스테이징 배포: ssh amb-staging "... deploy-staging.sh"
□ 스테이징 검증:
  - MONTHLY 정기 지출 → 해당 월 포함 확인
  - QUARTERLY 정기 지출 → 3개월 단위만 포함 확인
  - 종료된 정기 지출 → 미포함 확인
  - View 모드 전월 실적 컬럼 표시 확인
```

### Phase 2 배포

```
□ DB 마이그레이션 먼저 실행 (스테이징):
  ALTER TABLE amb_expense_forecast_reports ADD COLUMN IF NOT EXISTS efr_status ...
  ALTER TABLE amb_expense_forecast_items ADD COLUMN IF NOT EXISTS efi_quantity ...
□ BE: 엔티티/서비스/컨트롤러 수정
□ FE: 서비스/훅/페이지 수정
□ git commit & push
□ 스테이징 배포
□ 스테이징 검증:
  - 리포트 저장 후 상태 DRAFT 확인
  - [검토 요청] 버튼 → SUBMITTED 전환 확인
  - MASTER 계정으로 [승인]/[반려] 버튼 확인
  - APPROVED 리포트 수정 불가 확인
  - 수량 입력 후 저장 → 재조회 시 반영 확인
```

### Phase 3 배포

```
□ DB 데이터 마이그레이션 먼저 실행 (카테고리 UPDATE)
□ 코드 변경 사항 배포
□ 기존 리포트 카테고리 정상 표시 확인
```
