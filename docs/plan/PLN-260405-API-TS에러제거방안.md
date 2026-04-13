# PLAN-260405: API TypeScript 에러 제거 방안

## 1. 현황 요약

| 항목 | 값 |
|------|-----|
| **총 에러 수** | 227개 |
| **영향 파일 수** | 61개 |
| **영향 도메인 수** | 25+ |
| **빌드 영향** | `nest build`에는 무영향 (SWC 트랜스파일러 사용), `tsc --noEmit`에서만 검출 |
| **tsconfig 설정** | `strictNullChecks: true`, `noImplicitAny: true`, `strictBindCallApply: true` (개별 strict 플래그, `"strict": true` 미사용) |

### 에러 유형 분포

| 에러 코드 | 설명 | 건수 | 비율 |
|-----------|------|------|------|
| TS2339 | Property does not exist on type | 64 | 28.2% |
| TS2769 | No overload matches this call | 55 | 24.2% |
| TS2322 | Type is not assignable to type | 52 | 22.9% |
| TS2345 | Argument of type is not assignable | 30 | 13.2% |
| TS2531 | Object is possibly 'null' | 13 | 5.7% |
| TS2554 | Expected N arguments, got M | 3 | 1.3% |
| TS2367 | comparison always false | 3 | 1.3% |
| 기타 | TS7024, TS7023, TS7016, TS2740, TS2353, TS2304, TS1016 | 7 | 3.1% |

### 도메인별 분포

| 도메인 | 건수 | 비율 |
|--------|------|------|
| billing | 56 | 24.7% |
| hr | 42 | 18.5% |
| service-management | 20 | 8.8% |
| google-drive (infrastructure) | 17 | 7.5% |
| notices | 12 | 5.3% |
| entity-settings | 11 | 4.8% |
| acl | 9 | 4.0% |
| unit | 7 | 3.1% |
| drive | 8 | 3.5% |
| project | 6 | 2.6% |
| issues | 5 | 2.2% |
| translation | 4 | 1.8% |
| todo | 3 | 1.3% |
| oauth | 3 | 1.3% |
| asana-integration | 3 | 1.3% |
| 기타 (21개 파일) | 21 | 9.3% |

---

## 2. 근본 원인 분석

### 패턴 A: TypeORM `repo.create()` 오버로드 실패 (TS2769 — 55건)

**원인**: TypeORM 0.3의 `Repository.create()` 시그니처가 `DeepPartial<Entity>` 또는 `DeepPartial<Entity>[]`를 받는데, 객체 리터럴을 직접 전달할 때 TypeScript strict 모드에서 타입 추론이 바르게 되지 않는 경우가 발생한다.

```typescript
// 문제 코드
const log = this.auditRepo.create({
  aalUserId: userId,      // TS가 DeepPartial<Entity>[]로 추론하여 실패
  aalAction: action,
  aalEntityId: entityId,
});

// 해결 방법
const log = this.auditRepo.create({
  aalUserId: userId,
  aalAction: action,
  aalEntityId: entityId,
} as DeepPartial<AccessAuditLogEntity>);
```

**대표 파일**: `audit.service.ts`, `comment.service.ts`, `billing-document.service.ts`, `invoice.service.ts`, `employee.service.ts`, `contract.service.ts`

---

### 패턴 B: `save()` 반환값에서 프로퍼티 접근 실패 (TS2339 — 64건)

**원인**: `repo.save(entity)` 반환 타입이 `Entity | Entity[]`로 추론되어, 단일 엔티티의 프로퍼티에 접근할 때 "Property does not exist on type `Entity[]`" 에러 발생.

```typescript
// 문제 코드
const saved = await this.repo.save(entity);
return saved.invId;  // TS2339: Property 'invId' does not exist on type 'Entity[]'

// 해결 방법 1: create 결과에 타입 단언
const entity = this.repo.create({...}) as InvoiceEntity;
const saved = await this.repo.save(entity);
return saved.invId;

// 해결 방법 2: 명시적 타입 주석
const saved: InvoiceEntity = await this.repo.save(entity);
```

**대표 파일**: `invoice.service.ts`, `billing-automation.service.ts`, `partner.service.ts`, `sow.service.ts`, `notice.service.ts`

---

### 패턴 C: null vs undefined 타입 불일치 (TS2322 — 52건)

**원인**: TypeORM `DeepPartial<Entity>`와 엔티티 컬럼의 nullable 정의 간 `null`과 `undefined` 불일치. 엔티티에서 `@Column({ nullable: true })` 컬럼은 `string | null`이지만, TypeORM의 `DeepPartial`은 `string | undefined`를 기대한다.

```typescript
// 문제 코드
entity.empMiddleName = null;  // TS2322: 'null' → 'string | undefined'

// 해결 방법 1: undefined 사용
entity.empMiddleName = undefined;

// 해결 방법 2: 엔티티 컬럼 타입에 null 포함
@Column({ type: 'varchar', nullable: true })
empMiddleName: string | null;  // 또는 string | null | undefined
```

**대표 파일**: `employee-kr.service.ts`, `employee-seed.service.ts`, `payroll.service.ts`, `insurance-params-kr.service.ts`

---

### 패턴 D: 배열/단일 엔티티 타입 불일치 (TS2345 — 30건)

**원인**: `repo.create()`가 오버로드로 인해 `Entity | Entity[]`로 추론될 때, 이를 `repo.save()`에 전달하면 단일 시그니처와 불일치.

```typescript
// 문제 코드
const entities = items.map(item => this.repo.create({...}));
await this.repo.save(entities);  // TS2345: Entity[] → DeepPartial<Entity>

// 해결 방법: as 단언 또는 명시적 타입
const entities: ContractEntity[] = items.map(item =>
  this.repo.create({...} as DeepPartial<ContractEntity>)
);
await this.repo.save(entities);
```

**대표 파일**: `contract-seed.service.ts`, `partner-seed.service.ts`, `subscription.service.ts`

---

### 패턴 E: Google Drive API null 체인 (TS2531 — 13건)

**원인**: Google Drive API(`googleapis`)의 응답 타입이 대부분 `T | null | undefined`로 정의되어 있어, `res.data.drives`, `res.data.files` 등에 직접 접근하면 null 가능성 에러 발생.

```typescript
// 문제 코드
const files = res.data.files;  // TS2531: 'files' is possibly null

// 해결 방법 1: non-null assertion (API가 항상 반환하는 것이 확실할 때)
const files = res.data.files!;

// 해결 방법 2: 옵셔널 체이닝 + 기본값
const files = res.data.files ?? [];
```

**대표 파일**: `google-drive.service.ts`, `google-sheets.service.ts`

---

### 패턴 F: 기타 개별 이슈 (10건)

| 에러 | 파일 | 원인 | 수정 방법 |
|------|------|------|----------|
| TS2554 | `unit.service.ts` | 함수 인자 수 불일치 | 누락된 인자 추가 |
| TS2367 | `oauth.service.ts` | 불가능한 비교 | enum 값 추가 또는 조건 제거 |
| TS7016 | `push.service.ts` | `web-push` 모듈 타입 없음 | `@types/web-push` 설치 또는 `declare module` |
| TS2304 | `asana-admin.controller.ts` | `UserPayload` 타입 미임포트 | import 추가 |
| TS2353 | `expense-request.spec.ts` | 테스트 mock 타입 불일치 | mock 타입 수정 |
| TS2740 | `partner-auth.service.ts` | 타입 프로퍼티 누락 | 누락 프로퍼티 추가 |
| TS1016 | `claude.service.ts` | 필수 파라미터 순서 | 선택적 파라미터를 뒤로 이동 |
| TS7023/7024 | `drive.mapper.ts` | 반환 타입 명시 누락 | 반환 타입 추가 |

---

## 3. 수정 전략

### 전략 1: 일괄 타입 단언 (Quick Fix) — 권장

> **목표**: `as DeepPartial<Entity>` 단언으로 TS2769, TS2339, TS2345의 대부분을 해결
> **예상 해결**: ~149건 (65.6%)
> **리스크**: 낮음 — 런타임 동작 변경 없음, 타입 안전성 약간 감소
> **소요**: 반나절

**작업 방법**:
1. 모든 `repo.create({...})` 호출에 `as DeepPartial<Entity>` 추가
2. `repo.create()` 결과를 변수에 저장할 때 명시적 타입 주석 추가
3. `repo.save()` 반환값에 명시적 타입 주석 추가

```typescript
// Before
const entity = this.invoiceRepo.create({ invNumber: num, invAmount: amt });
const saved = await this.invoiceRepo.save(entity);
return saved.invId;

// After
const entity = this.invoiceRepo.create({ invNumber: num, invAmount: amt } as DeepPartial<InvoiceEntity>);
const saved: InvoiceEntity = await this.invoiceRepo.save(entity);
return saved.invId;
```

---

### 전략 2: null 안전성 강화 — 병행

> **목표**: TS2322 (null/undefined), TS2531 (possibly null) 해결
> **예상 해결**: ~65건 (28.6%)
> **리스크**: 낮음 — 더 안전한 코드로 개선
> **소요**: 반나절

**작업 방법**:
1. Google API 반환값에 `?? []` 또는 `?? ''` 기본값 패턴 적용
2. nullable 컬럼 할당에서 `null` → `undefined` 변환 또는 엔티티 타입 조정
3. 옵셔널 체이닝(`?.`) 추가

---

### 전략 3: 개별 수정 — 나머지

> **목표**: 기타 에러 (TS2554, TS2367, TS7016 등) 개별 해결
> **예상 해결**: ~13건 (5.7%)
> **리스크**: 낮음
> **소요**: 1-2시간

**작업 방법**:
- `@types/web-push` 설치
- 누락 import 추가
- 함수 시그니처 수정
- 테스트 mock 타입 보정

---

## 4. 실행 계획 (배치별)

### Phase 1: Infrastructure + 기타 개별 이슈 (20건)
> 가장 단순한 수정부터 시작하여 패턴 검증

| # | 파일/영역 | 예상 건수 | 수정 유형 |
|---|----------|----------|----------|
| 1-1 | `google-drive.service.ts` | 17 | null 안전성 (`?? []`, `?.`) |
| 1-2 | `google-sheets.service.ts` | 2 | null 안전성 |
| 1-3 | `push.service.ts` | 1 | `@types/web-push` 또는 declare module |
| **소계** | | **20** | |

### Phase 2: billing 도메인 (56건)
> 가장 에러가 많은 도메인 — create/save 패턴 일괄 수정

| # | 파일 | 예상 건수 | 수정 유형 |
|---|------|----------|----------|
| 2-1 | `billing-document.service.ts` | ~15 | create 타입 단언 + save 타입 주석 |
| 2-2 | `invoice.service.ts` | ~12 | create 타입 단언 + save 타입 주석 |
| 2-3 | `billing-automation.service.ts` | ~8 | create 타입 단언 + save 타입 주석 |
| 2-4 | `contract.service.ts` | ~6 | create 타입 단언 |
| 2-5 | `contract-seed.service.ts` | ~4 | create 타입 단언 |
| 2-6 | `partner.service.ts` / `partner-seed.service.ts` | ~5 | create 타입 단언 |
| 2-7 | `payment.service.ts` / `sow.service.ts` | ~6 | create 타입 단언 + null 처리 |
| **소계** | | **~56** | |

### Phase 3: hr 도메인 (42건)

| # | 파일 | 예상 건수 | 수정 유형 |
|---|------|----------|----------|
| 3-1 | `employee.service.ts` | ~8 | create 타입 단언 + null→undefined |
| 3-2 | `employee-kr.service.ts` | ~7 | null→undefined 변환 |
| 3-3 | `employee-seed.service.ts` | ~5 | create 타입 단언 |
| 3-4 | `payroll.service.ts` | ~6 | null→undefined + create 단언 |
| 3-5 | `insurance-params-kr.service.ts` | ~4 | null→undefined |
| 3-6 | 기타 hr 서비스 | ~12 | 혼합 |
| **소계** | | **~42** | |

### Phase 4: 나머지 도메인 (109건)

| # | 도메인 | 예상 건수 |
|---|--------|----------|
| 4-1 | service-management | 20 |
| 4-2 | notices | 12 |
| 4-3 | entity-settings | 11 |
| 4-4 | acl | 9 |
| 4-5 | drive | 8 |
| 4-6 | unit | 7 |
| 4-7 | project | 6 |
| 4-8 | issues | 5 |
| 4-9 | 기타 (translation, todo, oauth, asana 등) | ~31 |
| **소계** | | **~109** | |

---

## 5. 수정 원칙

### DO
- `repo.create()` 호출에 `as DeepPartial<Entity>` 타입 단언 적용
- `repo.save()` 반환값에 명시적 타입 주석 `const saved: Entity = ...`
- Google API 응답에 `?? []` 또는 옵셔널 체이닝 사용
- nullable 할당에서 `null` → `undefined` 변환 (TypeORM DeepPartial 호환)
- 매 Phase 완료 후 `npx tsc --noEmit --project apps/api/tsconfig.json 2>&1 | grep "error TS" | wc -l` 로 감소 확인

### DO NOT
- `@ts-ignore` 또는 `@ts-expect-error` 사용 금지
- `as any` 남용 금지 (타입 정보 완전 손실)
- 엔티티 정의 변경으로 인한 마이그레이션 필요 사항 발생 금지
- 런타임 동작이 변경되는 수정 금지
- `strict: false` 또는 strictNullChecks 끄는 것 금지

---

## 6. 검증 방법

```bash
# 1. tsc 에러 수 감소 확인
npx tsc --noEmit --project apps/api/tsconfig.json 2>&1 | grep "error TS" | wc -l
# 목표: 0

# 2. nest build 성공 확인
cd apps/api && npm run build
# 목표: 정상 빌드

# 3. 개발 서버 구동 확인
npm run dev:api
# 목표: 정상 구동

# 4. 기존 기능 리그레션 없음 확인
# 각 도메인 API 호출 테스트 (Postman 또는 프론트엔드)
```

---

## 7. 사이드 임팩트 분석

| 항목 | 리스크 | 설명 |
|------|--------|------|
| 런타임 동작 변경 | **없음** | 모든 수정이 타입 수준 변경 (타입 단언, 타입 주석, null 처리) |
| DB 마이그레이션 | **없음** | 엔티티 구조 변경 없음 |
| API 응답 변경 | **없음** | 비즈니스 로직 변경 없음 |
| 의존성 추가 | **최소** | `@types/web-push` devDependency 1건 |
| 빌드 시간 | **무변경** | `nest build`(SWC) 사용으로 tsc 영향 없음 |

---

## 8. 우선순위 권고

**즉시 실행 권장**: Phase 1 (20건) → 패턴 검증 후 Phase 2-4 일괄 진행

**이유**:
1. 현재 `nest build`가 정상 동작하므로 긴급도는 낮음
2. 그러나 `tsc --noEmit`이 CI/CD에 추가되면 즉시 빌드 실패 → 선제 대응 필요
3. 에러 존재 시 IDE 경고가 실제 버그를 놓치기 쉬움 → 코드 품질 유지 필수
4. 모든 수정이 타입 수준이므로 리그레션 리스크 최소
