# 테스트 케이스: 메뉴관리 기능 추가

- **문서 ID**: TC-20260401-메뉴관리기능추가-Test
- **작성일**: 2026-04-01

---

## 1. 단위 테스트 케이스

| ID | 대상 | 입력 | 기대 결과 | 검증 항목 |
|----|------|------|-----------|----------|
| UT-01 | `EntityPermissionService.getEntityMenuConfig` | 유효한 `entityId` | 사용 가능한 메뉴 전체 반환 | 제한 메뉴 제외, sortOrder 오름차순 |
| UT-02 | `EntityPermissionService.setEntityMenuConfig` | 전체 메뉴 1회씩 포함된 configs | entity override 저장 성공 | 기존 row 삭제 후 재삽입 |
| UT-03 | `EntityPermissionService.setEntityMenuConfig` | 일부 메뉴 누락 configs | `BadRequestException` | 전체 메뉴 정확히 1회 포함 검증 |
| UT-04 | `MenuPermissionService.getMyMenus` | entity override 존재 | override category/sortOrder 반영 | category 우선 적용 |
| UT-05 | `MenuPermissionService.getMyMenus` | entity override 없음 | 기본 `amb_menu_config` 기준 반환 | fallback 동작 |

---

## 2. 통합 테스트 시나리오

| ID | 시나리오 | 절차 | 기대 결과 |
|----|----------|------|-----------|
| IT-01 | 메뉴관리 탭 노출 | `/entity-settings/permissions` 접속 | 첫 탭으로 `메뉴관리` 노출 |
| IT-02 | 메뉴 순서 저장 | 첫 번째 메뉴를 아래로 이동 후 저장 | 새로고침 후 동일 순서 유지 |
| IT-03 | 카테고리 변경 저장 | 메뉴 1개를 업무도구→업무모듈 변경 후 저장 | MainLayout에서 업무모듈 섹션으로 이동 |
| IT-04 | 초기화 | 메뉴 설정 저장 후 초기화 실행 | 기본 순서/카테고리로 복원 |
| IT-05 | Entity 격리 | Entity A에서 저장 후 Entity B 로그인 | Entity B는 영향 없음 |

---

## 3. 엣지 케이스

| ID | 상황 | 기대 결과 |
|----|------|-----------|
| EC-01 | 메뉴관리 저장 중 중복 menu_code 전송 | 저장 실패 |
| EC-02 | 제한 메뉴(`SETTINGS_*`, `ENTITY_*`) 포함 전송 | 저장 실패 |
| EC-03 | 마지막 행에서 아래 이동 클릭 | 버튼 비활성 |
| EC-04 | 첫 행에서 위 이동 클릭 | 버튼 비활성 |
| EC-05 | 메뉴 설정 미존재 entity | 기본 전역 메뉴 설정으로 렌더링 |

---

## 4. 데이터 격리 검증

| ID | 시나리오 | 기대 결과 |
|----|----------|-----------|
| DS-01 | `USER_LEVEL` 사용자가 타 법인 `entity_id`로 메뉴 설정 조회 시도 | 접근 차단 |
| DS-02 | `USER_LEVEL` 사용자가 타 법인 `entity_id`로 메뉴 설정 저장 시도 | 접근 차단 |
| DS-03 | `ADMIN_LEVEL`이 특정 법인 선택 후 메뉴 설정 저장 | 해당 법인에만 저장 |

---

## 5. 실제 수행 결과

| 항목 | 결과 |
|------|------|
| `npm run -w @amb/api build` | 성공 |
| `npm run -w @amb/web build` | 성공 |
| 브라우저 수동 테스트 | 미수행 |
| 스테이징 배포 | 미수행 |
