# 작업 계획서: Redmine 가져오기 UI 개선

- **작성일**: 2026-03-20
- **관련 페이지**: `/admin/redmine-migration`, `/admin/redmine-imported`

## 1. 현황 분석 (AS-IS)

### 문제점
1. **법인 선택 불가**: `useEntityStore`의 `entities`와 `currentEntity`가 관리자 페이지 진입 시 비어있을 수 있음
   - SUPER_ADMIN 계정은 Entity 선택 페이지를 거치지 않고 바로 관리자 페이지 진입 가능
   - `currentEntity?.entityId || ''`로 초기화되어 빈 문자열 → 드롭다운에서 "법인을 선택하세요" 상태
   - `entities` 배열이 비어있으면 드롭다운 옵션 자체가 없음
2. **가져온 이슈 보기 링크 부재**: `/admin/redmine-imported` 페이지로 이동하는 링크가 설정 버튼 옆에 없음

### 현재 법인 데이터 흐름
- `GET /api/v1/hr/entities` → `HrEntityResponse[]` (entityId, code, name, ...)
- `useEntityStore` zustand 스토어에 저장
- 관리자 페이지에서는 스토어 데이터를 직접 참조

## 2. 개선 목표 (TO-BE)

1. **법인 목록 직접 조회**: 스토어 의존 대신 `useEntities()` 훅 + API 직접 호출로 법인 목록 확보
2. **VN01 기본값**: 법인 중 code='VN01'인 법인을 기본 선택
3. **Entity 드롭다운 표시**: `{code} - {name}` 형식으로 표시
4. **가져온 이슈 보기 링크**: 설정 버튼 왼쪽에 `/admin/redmine-imported` 링크 버튼 배치

## 3. 구현 계획

### 3-1. RedmineMigrationPage.tsx 수정

| 항목 | 내용 |
|------|------|
| 법인 목록 | `useEntities()` 훅 또는 직접 API 쿼리로 법인 목록 조회 |
| 기본값 | 법인 로딩 후 `code === 'VN01'`인 법인의 entityId를 `targetEntityId` 기본값으로 설정 |
| 드롭다운 표시 | `{code} - {name}` 형식 |
| 링크 추가 | 헤더 우측에 "가져온 이슈 보기" 링크 버튼 (설정 버튼 왼쪽) |

### 3-2. RedmineImportedIssuesPage.tsx 수정

| 항목 | 내용 |
|------|------|
| 법인 목록 | 동일하게 `useEntities()` 훅 사용 |
| 기본값 | `code === 'VN01'` 기본 선택 |

### 3-3. i18n 번역키

| 키 | ko | en | vi |
|----|----|----|-----|
| `viewImportedIssues` | 가져온 이슈 보기 | View Imported Issues | Xem issue đã nhập |

## 4. 영향 분석

- **변경 파일**: 2개 (RedmineMigrationPage.tsx, RedmineImportedIssuesPage.tsx) + i18n 3개
- **API 변경**: 없음 (기존 `GET /hr/entities` 사용)
- **사이드 임팩트**: 없음 (페이지 내부 로직만 변경)
