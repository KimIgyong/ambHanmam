# TC-AMA-Apps-OAuth-OpenAPI-Test-20260328

## 테스트 케이스 문서

- **프로젝트**: AMA × Apps (OAuth 2.0 + Open API)
- **작성일**: 2026-03-28
- **관련 문서**: 
  - 요구사항 분석서: `docs/analysis/REQ-AMA-Apps-OAuth-OpenAPI-20260328.md`
  - 작업 계획서: `docs/plan/PLAN-AMA-Apps-OAuth-OpenAPI-작업계획-20260328.md`

---

## 1. Phase 1: OAuth 2.0 서버 테스트

### TC-1.1 OAuth Client 관리

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-1.1.1 | Client ID 생성 | Admin이 OAuth2 앱 승인 | `pap_` prefix + 48자 hex로 시작하는 client_id 반환 | `papClientId` DB 저장 확인 |
| TC-1.1.2 | Client Secret 생성 | Admin이 OAuth2 앱 승인 | 96자 hex 문자열 반환 (평문 1회만) | `papClientSecretHash` bcrypt hash DB 저장 확인 |
| TC-1.1.3 | 중복 승인 시 client_id 유지 | 이미 client_id 있는 앱 재승인 | 기존 client_id 유지, secret만 갱신 | DB client_id 불변 확인 |
| TC-1.1.4 | 비-OAuth 앱 승인 | auth_mode='jwt' 앱 승인 | client credentials 미생성 | `papClientId` = null |
| TC-1.1.5 | Redirect URI 검증 | 등록되지 않은 redirect_uri 전달 | 400 Bad Request | 에러 메시지에 redirect_uri 언급 |

### TC-1.2 Authorization Code Flow

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-1.2.1 | 인가 요청 (정상) | `GET /oauth/authorize?client_id=X&redirect_uri=Y&response_type=code&scope=assets:read` (인증된 사용자) | 앱 정보 + 요청 scope + grantable scope 반환 | `200 OK`, 앱 이름/파트너 포함 |
| TC-1.2.2 | 인가 요청 (미인증) | 동일 요청, 쿠키/토큰 없음 | 401 Unauthorized | |
| TC-1.2.3 | 인가 요청 (잘못된 client_id) | `client_id=invalid` | 400 Bad Request | |
| TC-1.2.4 | 인가 요청 (잘못된 response_type) | `response_type=token` | 400 Bad Request | |
| TC-1.2.5 | 동의 제출 (정상) | `POST /oauth/authorize/consent` + client_id, redirect_uri, scope | authorization code + redirect URL 반환 | code가 64자 hex, 10분 유효 |
| TC-1.2.6 | 동의 제출 (scope 교차검증) | 설치 승인 scope: `[assets:read]`, 요청 scope: `[assets:read, users:read]` | `users:read` 제외, `assets:read`만 부여 | |
| TC-1.2.7 | 코드 만료 | 10분 경과 후 토큰 교환 시도 | 400 Bad Request (code expired) | |

### TC-1.3 Token Exchange

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-1.3.1 | 토큰 교환 (정상) | `POST /oauth/token` grant_type=authorization_code, code, client_id, client_secret, redirect_uri | access_token + refresh_token + expires_in(3600) + scope | JWT format 확인 |
| TC-1.3.2 | PKCE 토큰 교환 | code_challenge (S256) + code_verifier | 정상 토큰 발급 | verifier → SHA256 → base64url == challenge |
| TC-1.3.3 | 잘못된 PKCE verifier | 올바르지 않은 code_verifier | 400 Bad Request | |
| TC-1.3.4 | 코드 재사용 | 이미 사용된 code로 재요청 | 400 + 해당 앱의 모든 토큰 폐기 | DB 토큰 전부 revoked 확인 |
| TC-1.3.5 | Refresh Token | grant_type=refresh_token + refresh_token | 새 access_token + 새 refresh_token (rotation) | 이전 refresh_token 사용 불가 |
| TC-1.3.6 | 만료된 refresh_token | 폐기된 refresh_token | 401 Unauthorized | |
| TC-1.3.7 | ama_session grant | grant_type=ama_session + 유효한 JWT 쿠키 | OAuth access_token 발급 | 동일 user/entity 매핑 |

### TC-1.4 Token Validation & Revocation

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-1.4.1 | Access Token 검증 | Bearer 헤더에 유효 토큰 | request.oauthContext 설정 | userId, entityId, scopes 포함 |
| TC-1.4.2 | 만료 토큰 검증 | 1시간 경과 토큰 | 401 Unauthorized | |
| TC-1.4.3 | 폐기 토큰 검증 | revoke 후 사용 | 401 Unauthorized | |
| TC-1.4.4 | 토큰 폐기 (access) | `POST /oauth/revoke` token=access_token | 200 OK | DB otkRevokedAt 설정 |
| TC-1.4.5 | 토큰 폐기 (refresh) | `POST /oauth/revoke` token=refresh_token | 200 OK + 연결 access도 폐기 | |
| TC-1.4.6 | Userinfo 엔드포인트 | `GET /oauth/userinfo` + Bearer 토큰 | userId, entityId, scope 반환 | |

### TC-1.5 Scope Guard

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-1.5.1 | 권한 있는 scope | `@RequireScope('assets:read')` + scope 포함 토큰 | 200 OK | |
| TC-1.5.2 | 권한 없는 scope | `@RequireScope('assets:write')` + `assets:read`만 가진 토큰 | 403 Forbidden | |
| TC-1.5.3 | 다중 scope 요구 | `@RequireScope('assets:read', 'issues:read')` + 두 scope 모두 포함 | 200 OK | |
| TC-1.5.4 | 다중 scope 부분 누락 | 위 요구에 `assets:read`만 | 403 Forbidden | |

---

## 2. Phase 2: Open API Gateway 테스트

### TC-2.1 인증/인가

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-2.1.1 | Bearer 토큰 인증 | `Authorization: Bearer {valid_token}` | 200 OK | |
| TC-2.1.2 | 토큰 없음 | 헤더 없이 요청 | 401 Unauthorized | |
| TC-2.1.3 | 잘못된 토큰 | `Bearer invalid_xxx` | 401 Unauthorized | |
| TC-2.1.4 | scope 부족 | `assets:read` 토큰으로 `GET /open/issues` | 403 Forbidden | |

### TC-2.2 Asset API (`GET /api/v1/open/assets`)

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-2.2.1 | 자산 목록 조회 | `assets:read` scope 토큰 | 200 + 해당 entity의 자산 목록 반환 | entityId 필터 적용 확인 |
| TC-2.2.2 | 자산 상세 조회 | `GET /open/assets/:id` | 200 + 자산 상세 | 타 entity 자산 접근 불가 |
| TC-2.2.3 | 페이지네이션 | `?page=1&size=10` | 10개 이하 결과 | |
| TC-2.2.4 | 검색 | `?q=laptop` | 검색어 포함 결과 | |
| TC-2.2.5 | 카테고리 필터 | `?category=IT_EQUIPMENT` | 해당 카테고리만 | |

### TC-2.3 Issue API (`GET /api/v1/open/issues`)

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-2.3.1 | 이슈 목록 조회 | `issues:read` scope | 200 + entity 이슈 목록 | |
| TC-2.3.2 | 이슈 상세 | `GET /open/issues/:id` | 200 + 이슈 상세 | |
| TC-2.3.3 | 이슈 코멘트 | `GET /open/issues/:id/comments` | 200 + 코멘트 배열 | |
| TC-2.3.4 | 상태 필터 | `?status=OPEN` | OPEN 이슈만 | |
| TC-2.3.5 | 프로젝트 필터 | `?project_id=uuid` | 해당 프로젝트 이슈만 | |

### TC-2.4 Project API (`GET /api/v1/open/projects`)

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-2.4.1 | 프로젝트 목록 | `projects:read` scope | 200 + entity 프로젝트 목록 | |
| TC-2.4.2 | 프로젝트 상세 | `GET /open/projects/:id` | 200 + 프로젝트 상세 | |

### TC-2.5 기타 API

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-2.5.1 | 부서 목록 | `GET /open/units` + `units:read` | 부서 목록 반환 | |
| TC-2.5.2 | 부서 트리 | `GET /open/units/tree` + `units:read` | 트리 구조 반환 | |
| TC-2.5.3 | 사용자 목록 | `GET /open/users` + `users:read` | 사용자 목록 반환 | |
| TC-2.5.4 | 법인 정보 | `GET /open/entity` + `entity:read` | 단일 법인 정보 | |

### TC-2.6 API 감사 로그

| TC ID | 테스트 항목 | 입력 | 기대 결과 | 검증 |
|-------|-----------|------|----------|------|
| TC-2.6.1 | 성공 요청 로그 | 정상 API 호출 | `amb_open_api_logs` 테이블에 기록 | method, path, status_code, client_id, entity_id |
| TC-2.6.2 | 실패 요청 로그 | 403 응답 발생 | 에러 포함 로그 기록 | oalError 필드 |
| TC-2.6.3 | 응답 시간 기록 | 모든 API 호출 | `oalResponseMs` 양수 | |

---

## 3. Phase 3: 프론트엔드 테스트

### TC-3.1 OAuth 동의 화면 (`/oauth/consent`)

| TC ID | 테스트 항목 | 시나리오 | 기대 결과 | 검증 |
|-------|-----------|---------|----------|------|
| TC-3.1.1 | 정상 로딩 | 유효한 client_id, redirect_uri, scope params | 앱 이름, 파트너명, scope 목록 표시 | |
| TC-3.1.2 | 잘못된 client_id | `client_id=invalid` | 에러 화면 표시 (AlertTriangle 아이콘) | |
| TC-3.1.3 | 파라미터 누락 | client_id 없는 URL | "잘못된 클라이언트" 에러 | |
| TC-3.1.4 | 동의 승인 | scope 선택 후 "허용" 클릭 | redirect_uri로 code+state 포함 리다이렉트 | |
| TC-3.1.5 | 동의 거부 | "거부" 클릭 | redirect_uri로 error=access_denied 리다이렉트 | |
| TC-3.1.6 | scope 선택/해제 | 체크박스 토글 | selectedScopes 상태 업데이트 | |
| TC-3.1.7 | scope 0개 선택 | 모든 체크 해제 | "허용" 버튼 disabled | |
| TC-3.1.8 | 미인증 사용자 | 로그인 안 된 상태 | AuthGuard가 로그인 페이지로 리다이렉트 | |
| TC-3.1.9 | i18n 전환 | 언어 변경 (ko→en→vi) | consent 문구 해당 언어로 표시 | scope 설명 포함 |
| TC-3.1.10 | PKCE 파라미터 전달 | code_challenge, code_challenge_method params | consent POST에 파라미터 포함 | |

### TC-3.2 앱 마켓플레이스 (`/entity-settings/apps`)

| TC ID | 테스트 항목 | 시나리오 | 기대 결과 | 검증 |
|-------|-----------|---------|----------|------|
| TC-3.2.1 | 탭 전환 | "사용 가능" / "설치됨" 탭 클릭 | 해당 목록 표시 | |
| TC-3.2.2 | PUBLISHED 앱 목록 | 마켓플레이스 탭 | PUBLISHED 상태 앱 카드 표시 | 앱명, 파트너명, 버전, 카테고리 |
| TC-3.2.3 | 설치 다이얼로그 | "설치" 버튼 클릭 | scope 선택 모달 표시 | 체크박스로 scope 선택 가능 |
| TC-3.2.4 | 앱 설치 | scope 선택 후 "앱 설치" 클릭 | API 호출 → 설치 성공 | "설치됨" 탭에 추가됨 |
| TC-3.2.5 | 이미 설치된 앱 | 설치된 앱 카드 | "설치됨" 체크 아이콘, 설치 버튼 비노출 | |
| TC-3.2.6 | 앱 제거 확인 | 설치 탭 → 삭제 아이콘 | 확인 다이얼로그 표시 | |
| TC-3.2.7 | 앱 제거 실행 | 확인 다이얼로그에서 "제거" 클릭 | API 호출 → 목록에서 제거 | |
| TC-3.2.8 | scope 편집 | 설치 앱 확장 → 체크박스 변경 → 저장 | scope 업데이트 성공 | |
| TC-3.2.9 | 앱 없음 상태 | PUBLISHED 앱 0개 | "사용 가능한 앱이 없습니다" 표시 | |
| TC-3.2.10 | 로딩 상태 | API 요청 중 | Loader2 스피너 표시 | |
| TC-3.2.11 | EntitySettingsGuard | MASTER 아닌 사용자 | 접근 차단 | |

---

## 4. 데이터 격리 검증 (보안 크리티컬)

### TC-4.1 법인 간 데이터 격리

| TC ID | 테스트 항목 | 시나리오 | 기대 결과 | 검증 |
|-------|-----------|---------|----------|------|
| TC-4.1.1 | Open API 자산 격리 | Entity-A 토큰으로 Entity-B 자산 조회 | Entity-A 자산만 반환 | entityId 필터 확인 |
| TC-4.1.2 | Open API 이슈 격리 | Entity-A 토큰으로 이슈 조회 | Entity-A 이슈만 반환 | |
| TC-4.1.3 | Open API 프로젝트 격리 | Entity-A 토큰으로 프로젝트 조회 | Entity-A 프로젝트만 반환 | |
| TC-4.1.4 | 토큰 entity 바인딩 | 토큰 생성 시 user의 entityId 바인딩 | 다른 entity 자산 접근 불가 | |
| TC-4.1.5 | 앱 설치 격리 | Entity-A 설치 앱이 Entity-B에 미노출 | 각 entity 독립 설치 | `paiEntityId` 필터 |
| TC-4.1.6 | ADMIN_LEVEL Open API | ADMIN 사용자의 OAuth 토큰 | OwnEntityGuard 적용 시 entity 기반 필터 | 토큰 entityId 사용 |

### TC-4.2 OAuth 토큰 격리

| TC ID | 테스트 항목 | 시나리오 | 기대 결과 | 검증 |
|-------|-----------|---------|----------|------|
| TC-4.2.1 | 토큰-앱 바인딩 | App-A 토큰으로 App-B 리소스 접근 | scope 기반 접근 제어 | |
| TC-4.2.2 | 앱 제거 시 토큰 | 앱 제거 후 해당 앱 토큰 사용 | 401 Unauthorized | |
| TC-4.2.3 | 사용자 변경 | 사용자가 entity 이동 후 기존 토큰 | 이전 entity 데이터 접근 (토큰 유효기간 내) | 필요시 토큰 폐기 정책 |

---

## 5. 엣지 케이스

### TC-5.1 동시성/경합 조건

| TC ID | 테스트 항목 | 시나리오 | 기대 결과 |
|-------|-----------|---------|----------|
| TC-5.1.1 | 동시 토큰 교환 | 동일 code로 2개 병렬 교환 요청 | 하나만 성공, 나머지 실패 + 모든 토큰 폐기 |
| TC-5.1.2 | 동시 앱 설치 | 동일 앱 + entity로 2개 병렬 설치 | 하나만 성공 (UNIQUE 제약) |
| TC-5.1.3 | Refresh 동시 사용 | 동일 refresh_token 2번 사용 | 첫 번째만 성공, 두 번째 401 |

### TC-5.2 입력 검증

| TC ID | 테스트 항목 | 시나리오 | 기대 결과 |
|-------|-----------|---------|----------|
| TC-5.2.1 | 잘못된 scope 형식 | `scope=invalid_scope` | 400 Bad Request |
| TC-5.2.2 | 빈 scope | `scope=` | 400 Bad Request |
| TC-5.2.3 | SQL Injection 시도 | `client_id=' OR 1=1--` | 400 Bad Request (TypeORM 파라미터 바인딩) |
| TC-5.2.4 | XSS in redirect_uri | `redirect_uri=javascript:alert(1)` | 400 (URL 형식 검증) |
| TC-5.2.5 | 초대형 scope 문자열 | 1000개 scope 나열 | 400 또는 적절한 에러 |
| TC-5.2.6 | 존재하지 않는 앱 ID | UUID 형식이지만 미존재 | 404 Not Found |

### TC-5.3 TTL/만료

| TC ID | 테스트 항목 | 시나리오 | 기대 결과 |
|-------|-----------|---------|----------|
| TC-5.3.1 | Authorization Code 10분 만료 | 10분 후 토큰 교환 | 400 (code expired) |
| TC-5.3.2 | Access Token 1시간 만료 | 1시간 후 API 호출 | 401 Unauthorized |
| TC-5.3.3 | Refresh Token 30일 만료 | 30일 후 refresh | 401 Unauthorized |

---

## 6. 테스트 실행 가이드

### 6.1 사전 조건

1. DB 마이그레이션 실행: `sql/migration_oauth_open_api.sql`
2. 파트너 앱 등록 + 승인 + 발행 (PUBLISHED 상태)
3. 테스트 법인 2개 (Entity-A, Entity-B) with 각각 사용자
4. 파트너 앱 auth_mode = 'oauth2' 설정

### 6.2 API 테스트 (cURL 예시)

```bash
# 1) Authorization Request
curl -b cookie.txt 'http://localhost:3009/api/v1/oauth/authorize?client_id=pap_xxx&redirect_uri=https://partner-app.com/callback&response_type=code&scope=assets:read%20issues:read'

# 2) Consent Submit
curl -X POST -b cookie.txt -H 'Content-Type: application/json' \
  'http://localhost:3009/api/v1/oauth/authorize/consent' \
  -d '{"client_id":"pap_xxx","redirect_uri":"https://partner-app.com/callback","scope":"assets:read issues:read"}'

# 3) Token Exchange
curl -X POST -H 'Content-Type: application/json' \
  'http://localhost:3009/api/v1/oauth/token' \
  -d '{"grant_type":"authorization_code","code":"XXX","client_id":"pap_xxx","client_secret":"YYY","redirect_uri":"https://partner-app.com/callback"}'

# 4) Open API Call
curl -H 'Authorization: Bearer {access_token}' \
  'http://localhost:3009/api/v1/open/assets?page=1&size=10'

# 5) Token Revoke
curl -X POST -H 'Content-Type: application/json' \
  'http://localhost:3009/api/v1/oauth/revoke' \
  -d '{"token":"xxx","client_id":"pap_xxx","client_secret":"YYY"}'
```

### 6.3 프론트엔드 테스트 (수동)

1. **동의 화면**: `http://localhost:5179/oauth/consent?client_id=pap_xxx&redirect_uri=https://partner.com/cb&response_type=code&scope=assets:read`
2. **마켓플레이스**: `http://localhost:5179/entity-settings/apps` (EntitySettings > Apps)
3. **i18n**: 설정에서 언어 변경 후 OAuth/마켓플레이스 페이지 문구 확인

---

## 7. 테스트 커버리지 요약

| 영역 | TC 수 | 우선순위 |
|------|-------|---------|
| OAuth Client 관리 | 5 | HIGH |
| Authorization Code Flow | 7 | CRITICAL |
| Token Exchange | 7 | CRITICAL |
| Token Validation/Revocation | 6 | CRITICAL |
| Scope Guard | 4 | HIGH |
| Open API 인증/인가 | 4 | CRITICAL |
| Open API Asset | 5 | HIGH |
| Open API Issue | 5 | HIGH |
| Open API Project | 2 | MEDIUM |
| Open API 기타 | 4 | MEDIUM |
| API 감사 로그 | 3 | HIGH |
| OAuth 동의 화면 (FE) | 10 | HIGH |
| 앱 마켓플레이스 (FE) | 11 | HIGH |
| 데이터 격리 (엔티티) | 6 | CRITICAL |
| OAuth 토큰 격리 | 3 | HIGH |
| 동시성 | 3 | HIGH |
| 입력 검증 | 6 | HIGH |
| TTL/만료 | 3 | HIGH |
| **합계** | **94** | |
