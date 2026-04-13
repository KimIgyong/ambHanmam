# PLAN-Today숨김필터및버그수정-작업계획-20260312

> 작성일: 2026-03-12  
> 작성자: AI Assistant  
> 참조 분석서: [REQ-Today숨김필터및버그수정-20260312.md](../analysis/REQ-Today숨김필터및버그수정-20260312.md)  
> 상태: **전체 완료 (Retrospective)**

---

## 1. 작업 범위 요약

| 단계 | 내용 | 커밋 | 완료 시각 |
|------|------|------|----------|
| Phase 0 | usr_unit 데이터 정합성 수정 (DB) | DB only | 세션 초반 |
| Phase 1 | Today 숨김 필터 + MASTER 토글 버튼 | `512e700` | 10:41 |
| Phase 2 | 자산관리 MASTER 역할 권한 추가 | `9b5ff29` | 12:11 |
| Phase 3 | Forecast/Monthly Report API 수정 | `70685a1` | 13:12 |

---

## 2. 시스템 개발 현황 분석

### 관련 모듈 현황

| 모듈 | 경로 | 현황 |
|------|------|------|
| Today UI | `apps/web/src/domain/today/components/` | AllTodayPanel, TeamTodayPanel |
| Today 번역 | `apps/web/src/locales/{ko,en,vi}/today.json` | 기존 키 다수 존재 |
| 자산 서비스 | `apps/api/src/domain/asset/service/asset.service.ts` | `isAdminRole()` 함수 |
| 지출결의서 컨트롤러 | `apps/api/src/domain/expense-request/controller/expense-report.controller.ts` | `GET /forecast` 엔드포인트 |
| Forecast 서비스 | `apps/api/src/domain/expense-request/service/expense-forecast.service.ts` | `getPreview()` |
| Monthly Report 서비스 | `apps/api/src/domain/expense-request/service/expense-report.service.ts` | `getMonthlyReport()` |
| 사용자 DB | `amb_users` 테이블 (`usr_unit` 컬럼) | PostgreSQL, 스테이징 서버 |

---

## 3. 단계별 구현 계획 (완료)

### Phase 0: usr_unit 데이터 정합성 수정 ✅

**작업 내용:**
- `amb_users.usr_unit`과 `amb_units.unt_code` 불일치 18건 조사
- 케이스 분류 및 DB UPDATE 실행

**분류 기준 및 처리:**

| 케이스 | 조건 | 처리 | 건수 |
|--------|------|------|------|
| A | 해당 usr_id가 단일 법인에 primary unit_role 보유 | 해당 unt_code로 업데이트 | 3건 |
| B | 복수 법인 또는 특수 케이스 | Holding으로 업데이트 | 15건 |

**실행 SQL (예시):**
```sql
-- 케이스 A: primary unit으로 업데이트
UPDATE amb_users u
SET usr_unit = um.unt_code
FROM amb_unit_members um
WHERE u.usr_id = um.usm_user_id
  AND um.usm_role = 'primary'
  AND u.usr_id IN ('...', '...', '...');

-- 케이스 B: Holding으로 업데이트
UPDATE amb_users
SET usr_unit = 'Holding'
WHERE usr_id IN ('...', ...15건...);
```

**검증:**
```sql
SELECT u.usr_id, u.usr_unit, unt.unt_code,
       CASE WHEN u.usr_unit = unt.unt_code THEN 'OK' ELSE 'MISMATCH' END as unit_valid
FROM amb_users u
LEFT JOIN amb_units unt ON unt.unt_code = u.usr_unit
WHERE u.usr_id IN (...18건...);
-- 결과: 전 18건 unit_valid = OK 확인
```

---

### Phase 1: Today 숨김 필터 + MASTER 토글 버튼 ✅

**커밋:** `512e700` (2026-03-12 10:41)

#### 1-1. AllTodayPanel.tsx

**변경 내용:**
```typescript
// 추가: showHidden state
const [showHidden, setShowHidden] = useState(false);

// 변경: filteredMembers - isHidden 필터 적용
const filteredMembers = useMemo(() => {
  if (!data) return [];
  let members = (isMaster && showHidden) ? data.members : data.members.filter((m) => !m.isHidden);
  if (deptFilter) members = members.filter((m) => m.department === deptFilter);
  return members;
}, [data, deptFilter, showHidden, isMaster]);

// 추가: MASTER 전용 토글 버튼
{isMaster && (
  <button
    onClick={() => setShowHidden(!showHidden)}
    className={`... ${showHidden ? 'amber 스타일' : 'gray 스타일'}`}
    title={showHidden ? t('all.showActiveOnly') : t('all.showAllIncludingHidden')}
  >
    {showHidden ? <Eye /> : <EyeOff />}
    {showHidden ? t('all.showActiveOnly') : t('all.showAllIncludingHidden')}
  </button>
)}
```

#### 1-2. TeamTodayPanel.tsx

**변경 내용:**
```typescript
// 추가: showHidden state
const [showHidden, setShowHidden] = useState(false);
const isMaster = useAuthStore((s) => s.user?.role === 'MASTER');

// 변경: visibleMembers - isHidden 필터 적용
const visibleMembers = useMemo(() => {
  if (!members) return [];
  return (isMaster && showHidden) ? members : members.filter((m) => !m.isHidden);
}, [members, showHidden, isMaster]);

// 추가: MASTER 전용 토글 버튼 (AllTodayPanel과 동일 패턴)
```

#### 1-3. 번역 파일 (ko/en/vi)

**추가 키:**
```json
// ko/today.json
{
  "all": {
    "showAllIncludingHidden": "전체보기(숨김포함)",
    "showActiveOnly": "활성멤버만 보기"
  }
}

// en/today.json
{
  "all": {
    "showAllIncludingHidden": "Show All (incl. Hidden)",
    "showActiveOnly": "Show Active Only"
  }
}

// vi/today.json
{
  "all": {
    "showAllIncludingHidden": "Xem tất cả (bao gồm ẩn)",
    "showActiveOnly": "Chỉ xem thành viên hoạt động"
  }
}
```

**변경 파일:**
- `apps/web/src/domain/today/components/AllTodayPanel.tsx`
- `apps/web/src/domain/today/components/TeamTodayPanel.tsx`
- `apps/web/src/locales/ko/today.json`
- `apps/web/src/locales/en/today.json`
- `apps/web/src/locales/vi/today.json`

---

### Phase 2: 자산관리 MASTER 역할 권한 추가 ✅

**커밋:** `9b5ff29` (2026-03-12 12:11)

**변경 파일:** `apps/api/src/domain/asset/service/asset.service.ts`

**변경 내용:**
```typescript
// 수정 전
private isAdminRole(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SYSTEM_ADMIN';
}

// 수정 후
private isAdminRole(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SYSTEM_ADMIN' || role === 'MASTER';
}
```

**영향 메서드 (isAdminRole 사용처):**
- `createAsset()` — 자산 등록
- `ensureManagerOrAdmin()` — 관리자/담당자 권한 검증 (수정, 삭제, 상태변경 등)

---

### Phase 3: Forecast/Monthly Report API 수정 ✅

**커밋:** `70685a1` (2026-03-12 13:12)

#### 3-1. expense-report.controller.ts

**문제:** `GET /forecast` 시 year+month 쿼리가 있어도 `findAll()` 호출 → 배열 반환

**수정:**
```typescript
@Get('forecast')
async getForecast(
  @Query('year') year?: string,
  @Query('month') month?: string,
) {
  if (year && month) {
    // 단건 조회 (프론트가 기대하는 형태)
    return this.expenseReportService.findByMonth(+year, +month);
  }
  return this.expenseReportService.findAll();
}
```

#### 3-2. expense-forecast.service.ts

**문제:** `getPreview()` entity 필드명 그대로 반환 (`efi_title` 등)

**수정:**
```typescript
// toReportResponse() 매퍼 추가
private toReportResponse(item: ExpenseForecastItem): ForecastItem {
  return {
    id: item.efi_id,
    title: item.efi_title,
    amount: item.efi_amount,
    // ...camelCase 변환
  };
}

// getPreview() 반환값 변경
async getPreview(year: number, month: number): Promise<ForecastItem[]> {
  const items = await this.repo.find({ where: { year, month } });
  return items.map(this.toReportResponse.bind(this));
}
```

#### 3-3. expense-report.service.ts

**문제:** `getMonthlyReport()` 반환값이 `MonthlyReport` 프론트 인터페이스와 불일치

**수정:**
```typescript
// MonthlyReportResult 인터페이스 정의 (프론트 MonthlyReport에 맞춤)
interface MonthlyReportResult {
  id: string;
  year: number;
  month: number;
  title: string;
  status: string;
  items: MonthlyReportItem[];
  // ...
}

// getMonthlyReport() entity 필드 → camelCase 변환 후 반환
```

**변경 파일:**
- `apps/api/src/domain/expense-request/controller/expense-report.controller.ts`
- `apps/api/src/domain/expense-request/service/expense-forecast.service.ts`
- `apps/api/src/domain/expense-request/service/expense-report.service.ts`

---

## 4. 사이드 임팩트 분석

| 변경 | 잠재적 영향 | 평가 |
|------|------------|------|
| Today isHidden 필터 | 기존 표시되던 숨김 멤버가 사라짐 → 의도된 동작 | 낮음 |
| MASTER 버튼 추가 | UI 레이아웃 버튼 영역 증가 (소폭) | 낮음 |
| isAdminRole MASTER 추가 | MASTER의 모든 자산 관리 작업 허용 | 중간 (정책 확인 완료) |
| GET /forecast 분기 | 기존 쿼리 없는 호출은 `findAll()` 그대로 | 낮음 |
| getPreview() 반환형 변경 | 프론트 외 다른 호출처 없음 확인 | 낮음 |
| DB usr_unit 업데이트 | 18건 조직 단위 변경 → UI 소속 표시 변경 | 낮음 (비활성/불일치 계정) |

---

## 5. 테스트 시나리오

### Phase 1 — Today 숨김 필터

| 시나리오 | 기대 결과 |
|---------|----------|
| 일반 사용자로 Today 접근 | 숨김 멤버 미표시, 토글 버튼 없음 |
| MASTER로 Today 접근 | 숨김 멤버 미표시, 토글 버튼 표시 |
| MASTER — 토글 버튼 클릭 | 전체 멤버 표시 (숨김 포함), amber 색상 버튼 |
| MASTER — 다시 토글 클릭 | 숨김 멤버 제외, gray 색상 버튼 |
| TeamTodayPanel 동일 시나리오 | 동일 동작 |

### Phase 2 — 자산 MASTER 권한

| 시나리오 | 기대 결과 |
|---------|----------|
| MASTER 역할로 자산 등록 | 200 OK |
| MASTER 역할로 자산 수정 | 200 OK |
| MASTER 역할로 자산 삭제 | 200 OK |
| 일반 USER로 자산 등록 시도 | 403 Forbidden (기존 동작 유지) |

### Phase 3 — Forecast/Monthly Report

| 시나리오 | 기대 결과 |
|---------|----------|
| Forecast 탭 접근 | 에러 없이 항목 리스트 렌더링 |
| Monthly Report 탭 접근 | 에러 없이 리포트 데이터 표시 |
| map 관련 TypeError | 재현 불가 (수정 완료) |

---

## 6. 변경 파일 전체 목록

### Frontend (apps/web)

| 파일 | 변경 유형 | 커밋 |
|------|----------|------|
| `src/domain/today/components/AllTodayPanel.tsx` | 기능 추가 | 512e700 |
| `src/domain/today/components/TeamTodayPanel.tsx` | 기능 추가 | 512e700 |
| `src/locales/ko/today.json` | 번역 키 추가 | 512e700 |
| `src/locales/en/today.json` | 번역 키 추가 | 512e700 |
| `src/locales/vi/today.json` | 번역 키 추가 | 512e700 |

### Backend (apps/api)

| 파일 | 변경 유형 | 커밋 |
|------|----------|------|
| `src/domain/asset/service/asset.service.ts` | 버그 수정 | 9b5ff29 |
| `src/domain/expense-request/controller/expense-report.controller.ts` | 버그 수정 | 70685a1 |
| `src/domain/expense-request/service/expense-forecast.service.ts` | 버그 수정 | 70685a1 |
| `src/domain/expense-request/service/expense-report.service.ts` | 버그 수정 | 70685a1 |

### Database

| 대상 | 변경 유형 | 방법 |
|------|----------|------|
| `amb_users.usr_unit` (18건) | 데이터 수정 | SQL UPDATE 직접 실행 |

---

## 7. 배포 상태

| 환경 | 배포 시각 | 상태 |
|------|----------|------|
| 스테이징 | 2026-03-12 세션 중 | ✅ 완료 |
| 프로덕션 | 미정 | ⏳ 대기 |
