# REQ-Today숨김필터및버그수정-20260312

> 작성일: 2026-03-12  
> 작성자: AI Assistant  
> 상태: 구현 완료 (Retrospective)

---

## 1. 배경 및 목적

본 문서는 2026-03-12 세션에서 처리된 아래 4가지 작업에 대한 요구사항 분석서이다.

| 구분 | 제목 | 유형 |
|------|------|------|
| REQ-01 | Today 화면 숨김 멤버 기본 미표시 | 기능 요구사항 |
| REQ-02 | MASTER 전체보기(숨김포함) 토글 버튼 | 기능 요구사항 |
| REQ-03 | 자산관리 MASTER 역할 권한 누락 | 버그 수정 |
| REQ-04 | 지출결의서 Forecast/Monthly Report API 응답 불일치 | 버그 수정 |
| REQ-05 | usr_unit 데이터 정합성 수정 | DB 유지보수 |

---

## 2. AS-IS 현황 분석

### 2.1 Today 화면 숨김 멤버 표시 (REQ-01, REQ-02)

**현재 동작:**
- `AllTodayPanel` (Everyone's Today) / `TeamTodayPanel` (Unit Today) 모두 `isHidden` 여부와 무관하게 전체 멤버를 표시
- MASTER가 특정 멤버를 숨김 처리해도 Today 화면에 계속 노출
- 숨김 필터 토글 버튼 없음

**문제점:**
- 숨김 처리된 비활성 멤버가 Active 멤버와 함께 노출되어 Today 대시보드의 정보 품질 저하
- MASTER가 숨김 처리한 멤버를 필요시 다시 확인할 방법 없음

### 2.2 자산관리 MASTER 권한 누락 (REQ-03)

**현재 동작:**
```typescript
// asset.service.ts - isAdminRole() 기존 구현
return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SYSTEM_ADMIN';
```
- `MASTER` 역할이 `isAdminRole()` 목록에서 누락
- 자산 등록/수정/삭제 시 403 Forbidden 반환

**영향 범위:**
- `createAsset()` - 자산 등록
- `ensureManagerOrAdmin()` - 관리자/담당자 접근 제어
- 자산 관련 쓰기 작업 전체

### 2.3 지출결의서 Forecast/Monthly Report 에러 (REQ-04)

**현재 동작:**

**(1) GET /forecast API:**
- `findAll()` 배열 반환 → 프론트에서 단일 `report.items.map()` 호출 시 `TypeError` 발생

**(2) getPreview() 응답 형식 불일치:**
- 백엔드 반환: `{ year, month, items: { efi_title, ... } }` (entity 필드명 그대로)
- 프론트 기대: `ForecastItem[]` (`{ title, amount, ... }` camelCase)

**(3) Monthly Report 응답 불일치:**
- 백엔드 반환: entity 컬럼명 그대로 (`exr_title` 등)
- 프론트 기대: `MonthlyReport` 인터페이스 camelCase 필드

**에러 메시지:**
```
TypeError: Cannot read properties of undefined (reading 'map')
```

### 2.4 usr_unit 데이터 정합성 불일치 18건 (REQ-05)

**현재 상태:**
- `amb_users.usr_unit` 값이 `amb_units.unt_code`와 불일치하는 레코드 18건 존재
- `unit_valid = MISMATCH` 상태였던 사용자들
- 원인: 과거 unit 코드 변경/조직 개편 시 users 테이블 미반영

---

## 3. TO-BE 요구사항

### REQ-01: Today 숨김 멤버 기본 미표시

**요구사항:**
- `AllTodayPanel` (Everyone's Today), `TeamTodayPanel` (Unit Today) 모두에서
- `isHidden: true` 인 멤버는 기본 화면에 노출하지 않음
- 일반 사용자 및 MASTER 모두 기본값은 숨김 제외 표시

**수용 기준:**
- Today 화면 진입 시 `isHidden` 멤버 카드 미표시
- 숨김 멤버 제외 후 나머지 멤버 정상 표시

### REQ-02: MASTER 전체보기(숨김포함) 토글 버튼

**요구사항:**
- MASTER 역할 사용자에게만 [전체보기(숨김포함)] / [활성멤버만보기] 토글 버튼 표시
- 버튼 클릭 시 숨김 멤버 포함 전체 표시 ↔ 숨김 제외 표시 전환
- `AllTodayPanel`, `TeamTodayPanel` 두 컴포넌트 모두 적용

**수용 기준:**
- MASTER만 버튼 노출 (일반 사용자 미표시)
- 버튼 상태에 따라 amber 색상(전체보기 활성) / 기본 gray 색상 구분
- 한/영/베트남어 i18n 지원

### REQ-03: 자산관리 MASTER 역할 권한 허용

**요구사항:**
- `isAdminRole()` 함수에 `MASTER` 역할 포함
- MASTER → 자산 등록, 수정, 삭제 모두 허용

**수용 기준:**
- MASTER 역할로 자산 등록 시 403 에러 없이 정상 처리
- 기존 SUPER_ADMIN, ADMIN, SYSTEM_ADMIN 권한 유지

### REQ-04: Forecast/Monthly Report API 응답 형식 정합성

**요구사항:**
- `GET /forecast?year&month` → 해당 월 단건 report 반환 (배열 X)
- `getPreview()` → `ForecastItem[]` (camelCase) 형식으로 반환
- `getMonthlyReport()` → `MonthlyReport` 인터페이스에 맞는 camelCase 필드 반환

**수용 기준:**
- 지출결의서 Forecast 탭 정상 로드 (map 에러 없음)
- Monthly Report 탭 정상 로드
- 에러 없이 항목 목록 렌더링

### REQ-05: usr_unit 데이터 정합성 수정

**요구사항:**
- `amb_users.usr_unit` 값이 실제 존재하는 `unt_code`와 일치
- 불일치 18건 → 정합 unit으로 업데이트

**분류:**
- **케이스 A (3건)**: primary unit_role로 업데이트 (단일 법인 primary인 경우)
- **케이스 B (15건)**: Holding (`AX`, `MS`, `경영지원팀` 등 특수 케이스 제외) → `Holding` 업데이트

---

## 4. 갭 분석

| 항목 | AS-IS | TO-BE | 구현 방식 |
|------|-------|-------|-----------|
| Today 숨김 필터 | 전체 표시 | 숨김 제외 기본 표시 | `filteredMembers` / `visibleMembers`에 `!m.isHidden` 필터 |
| MASTER 버튼 | 없음 | MASTER에게만 토글 버튼 | `isMaster && <button>` 조건부 렌더링 |
| 자산 MASTER 권한 | 403 | 정상 | `isAdminRole()`에 `MASTER` 추가 |
| Forecast API | 배열/entity 필드 | 단건/camelCase | controller 쿼리 라우팅 + service 매퍼 추가 |
| Monthly Report API | entity 필드 | camelCase | `MonthlyReportResult` 인터페이스 + 매퍼 함수 |
| usr_unit 정합성 | 18건 불일치 | 전건 일치 | DB UPDATE 직접 실행 |

---

## 5. 사용자 플로우

### Today 숨김 필터 플로우

```
[일반 사용자]
  └── Today 접근
        └── isHidden=false 멤버만 표시 (자동 필터)

[MASTER]
  └── Today 접근
        ├── 기본: isHidden=false 멤버만 표시
        └── [전체보기(숨김포함)] 버튼 클릭
              └── 전체 멤버 표시 (isHidden=true 포함)
                    └── [활성멤버만보기] 버튼 클릭
                          └── isHidden=false 멤버만 다시 표시
```

### 자산 등록 플로우 (MASTER)

```
[MASTER]
  └── 자산관리 접근 → 자산 등록
        └── isAdminRole('MASTER') = true → 등록 허용 (이전: 403)
```

---

## 6. 기술 제약사항

- **React state**: `showHidden` 로컬 state — 페이지 이동 시 초기화 (의도된 동작)
- **i18n**: `today` 네임스페이스 추가 키 — 번역 파일 ko/en/vi 모두 업데이트 필요
- **API 하위호환**: `GET /forecast` (쿼리 없이)는 기존 동작 유지
- **DB 변경**: `amb_users` 직접 UPDATE — 롤백 불가 (실행 전 확인 필요)
- **권한 변경**: `MASTER` 추가는 전체 자산 관리 권한 허용 의미 — 정책 확인 후 적용

---

## 7. 비기능 요구사항

| 항목 | 내용 |
|------|------|
| 성능 | 숨김 필터는 클라이언트 사이드 처리 (추가 API 호출 없음) |
| 보안 | MASTER 버튼은 서버에서도 role 검증 (기존 Guard 유지) |
| 접근성 | 버튼에 `title` 속성으로 툴팁 제공 |
| 국제화 | ko/en/vi 3개 언어 지원 |
