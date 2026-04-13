# PLAN-EntityLoginPage-작업계획-20260406

## 1. 시스템 개발 현황 분석

### 기존 인증 구조
- 4개 독립 로그인 페이지 (Login, AdminLogin, ClientLogin, PartnerLogin)
- 각 페이지가 별도 인증 서비스/스토어 사용
- Entity 검색/선택 → 이메일/비밀번호 → API 호출 → JWT → 리다이렉트
- 백엔드 `POST /api/v1/auth/login`은 `entity_code`(optional) + `email` + `password` 수신

### `entCode` 기반 Entity 조회 가능 여부
- `GET /api/v1/auth/entities/search?q={entCode}` — 기존 공개 API 활용 가능
- `ent_code`는 UNIQUE, 정확 매칭 시 1건 반환

## 2. 단계별 구현 계획

### Phase 1: EntityLoginPage 컴포넌트 (신규)

**목표**: `/:entCode/login` 경로에서 조직 사전 선택 + 탭 메뉴 로그인 페이지

**구현 항목**:
1. `apps/web/src/domain/auth/pages/EntityLoginPage.tsx` — 신규 생성
   - URL param `entCode`로 Entity 정보 조회 (`useEffect` + `authService.searchEntities`)
   - 조직 정보 읽기 전용 표시 (국기 + 코드 + 이름)
   - 탭: "사용자 로그인" | "고객사 로그인" (기본: 사용자)
   - 사용자 탭: `authService.login(email, password, entCode)` → `/select-entity`
   - 고객사 탭: `clientPortalApiService.login(entCode, email, password)` → `/client`
   - 잘못된 entCode: 에러 + `/login` 안내 링크
   - "비밀번호를 잊으셨나요?" 링크
   - "다른 조직으로 로그인" 링크 (→ `/login`)

### Phase 2: 라우터 등록

**구현 항목**:
1. `apps/web/src/router/index.tsx` — 라우트 추가
   - `/:entCode/login` → `EntityLoginPage` (PublicRoute 래핑, AuthLayout 사용)
   - 기존 `/login`, `/client/login` 등은 변경 없이 유지
   - **라우트 순서 주의**: `/:entCode/login`은 정적 경로(`/admin/login` 등) 뒤에 배치

### Phase 3: i18n 번역 키 추가

**구현 항목**:
1. `apps/web/src/locales/ko/auth.json` — 신규 키 추가
2. `apps/web/src/locales/en/auth.json` — 신규 키 추가
3. `apps/web/src/locales/vi/auth.json` — 신규 키 추가

**신규 키**:
```json
{
  "entityLogin.userTab": "사용자 로그인",
  "entityLogin.clientTab": "고객사 로그인",
  "entityLogin.entityNotFound": "존재하지 않는 조직입니다.",
  "entityLogin.entityInactive": "비활성 조직입니다.",
  "entityLogin.goToLogin": "다른 조직으로 로그인",
  "entityLogin.loading": "조직 정보를 불러오는 중..."
}
```

## 3. 변경 파일 목록

| 파일 | 유형 | 내용 |
|------|------|------|
| `apps/web/src/domain/auth/pages/EntityLoginPage.tsx` | **신규** | 탭 메뉴 통합 로그인 페이지 |
| `apps/web/src/router/index.tsx` | 수정 | `/:entCode/login` 라우트 추가 |
| `apps/web/src/locales/ko/auth.json` | 수정 | 신규 번역 키 |
| `apps/web/src/locales/en/auth.json` | 수정 | 신규 번역 키 |
| `apps/web/src/locales/vi/auth.json` | 수정 | 신규 번역 키 |

## 4. 사이드 임팩트 분석

| 영역 | 영향도 | 설명 |
|------|--------|------|
| 기존 `/login` | **없음** | 기존 LoginPage 코드 변경 없음 |
| 기존 `/client/login` | **없음** | 기존 ClientLoginPage 코드 변경 없음 |
| 기존 `/admin/login`, `/partner/login` | **없음** | 변경 없음 |
| 백엔드 API | **없음** | 기존 `POST /auth/login` 재사용 |
| 라우트 충돌 | **낮음** | `/:entCode/login`은 `/admin/login` 등 정적 경로보다 후순위 배치로 회피 |
| 인증 스토어 | **없음** | 기존 `authStore`, `clientAuthStore` 그대로 사용 |

### 라우트 충돌 방지 전략
```
정적 경로 (우선 매칭):
  /login
  /admin/login
  /client/login
  /partner/login

동적 경로 (후순위):
  /:entCode/login  ← 위 정적 경로에 매칭되지 않을 때만 도달
```

react-router v6에서 정적 경로가 동적 경로보다 우선 매칭되므로, 단순히 라우트 배열에 추가하면 됨.

## 5. DB 마이그레이션

없음 (프론트엔드 전용 변경)
