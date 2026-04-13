# 작업 계획서: ADMIN_LEVEL 설정 메뉴 /admin 경로 분리

> 작성일: 2026-03-08
> 요구사항 분석서: `docs/analysis/REQ-Admin경로분리-20260308.md`

---

## 1. 작업 개요

`/settings/*` 하위 ADMIN_LEVEL 전용 페이지를 `/admin/*`으로 이동. `/service/*` 및 `/site/*` 관련 페이지도 `/admin/` 하위로 통합.

## 2. 변경 파일 목록

### Phase 1: 라우터 경로 변경 (핵심)

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/router/index.tsx` | `/settings/*` → `/admin/*`, `/service/*` → `/admin/service/*`, `/site/*` → `/admin/site/*` 경로 변경 + 기존 경로 리다이렉트 |

### Phase 2: 네비게이션 및 내부 링크

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/layouts/MainLayout.tsx` | 사이드바 Settings 버튼 경로 `/settings` → `/admin` |
| `apps/web/src/domain/settings/pages/SettingsPage.tsx` | SETTINGS_CARDS 내 경로 변경 |
| `apps/web/src/domain/admin/pages/EntityManagementDetailPage.tsx` | 뒤로가기 navigate 경로 |
| 기타 내부 navigate/Link 참조 | grep으로 전체 검색 후 변경 |

### Phase 3: DB 메뉴 설정 마이그레이션

| 파일 | 변경 내용 |
|------|----------|
| `sql/migration_admin_path.sql` (신규) | `amb_menu_config.mcf_path` 값 `/settings/` → `/admin/` 업데이트 |

## 3. 단계별 구현 계획

### Step 1: 라우터 변경
1. `router/index.tsx`에서 모든 `/settings/*` 경로를 `/admin/*`으로 변경
2. `/service/*` 경로를 `/admin/service/*`로 변경
3. `/site/*` 경로를 `/admin/site/*`로 변경
4. 기존 `/settings/*` → `/admin/*` 리다이렉트 추가
5. `/entity-settings/*`는 변경 없음 (유지)

### Step 2: 네비게이션 업데이트
1. MainLayout.tsx 사이드바 Settings 링크 변경
2. SettingsPage.tsx 카드 메뉴 경로 변경
3. EntityManagementDetailPage.tsx 뒤로가기 경로
4. 프로젝트 전체에서 `/settings/` 참조하는 navigate/Link 검색 → 변경

### Step 3: DB 마이그레이션
1. `amb_menu_config` 테이블의 `mcf_path` 컬럼 업데이트 SQL 작성
2. 스테이징 서버 DB에 마이그레이션 실행

### Step 4: 빌드 및 배포
1. 타입 체크 + 빌드 확인
2. 커밋, 푸시, 스테이징 배포
3. DB 마이그레이션 실행
4. 동작 확인

## 4. 사이드 임팩트 관리

| 위험 | 대응 |
|------|------|
| 기존 북마크 깨짐 | `/settings/*` → `/admin/*` 리다이렉트 추가 |
| DB 경로 불일치 | SQL 마이그레이션으로 일괄 업데이트 |
| `/entity-settings` 혼동 | 변경 대상 아님, 기존 유지 확인 |
| 백엔드 API 경로 | API는 `/api/v1/...`이므로 영향 없음 |

## 5. 검증 항목

- [ ] `/admin` 대시보드 정상 표시
- [ ] 각 `/admin/*` 하위 페이지 접근 확인
- [ ] ADMIN_LEVEL 아닌 사용자 `/admin/*` 접근 시 리다이렉트 확인
- [ ] 기존 `/settings/*` URL 접근 시 `/admin/*`으로 리다이렉트 확인
- [ ] `/entity-settings/*` 기존대로 동작 확인
- [ ] 사이드바 Settings 버튼 → `/admin` 이동 확인
- [ ] DB 메뉴 경로 업데이트 후 메뉴 권한 정상 동작 확인
