# REQ-커스텀앱JWT-POST전환-20260401-보류

## 1. 요구사항 요약
- 대상 화면
  - `https://stg-ama.amoeba.site/menu/custom-apps`
- 배경
  - 현재 커스텀앱에서 JWT 인증 모드 선택 시 `ama_token`을 URL Query String으로 전달 중
- 요청사항
  - `ama_token` 전달 방식을 Query String이 아닌 POST 기반으로 전환 가능한지 검토
  - 대상 앱(`stg-apps.amoeba.site/{app}`)이 POST 방식 JWT 수신이 가능한지 검증
- 적용 범위
  - 본 요구사항은 아메바 공식 연동 도메인(`apps.amoeba.site`, `stg-apps.amoeba.site`, `talk.amoeba.site`, `dev-ambtalk.amoeba.site`)에만 적용
  - 일반 외부 커스텀앱 연동은 기존 Query String 방식 유지
- 목표
  - 토큰 노출 최소화(브라우저 URL, 로그, 리퍼러 등) 및 앱스토어 연동 보안 강화

## 2. AS-IS 현황 분석
### 2.1 AMA 커스텀앱 JWT 전달 방식
- 프론트 전달 로직
  - `apps/web/src/domain/custom-apps/pages/CustomAppHostPage.tsx`
- 현재 동작
  - `authMode === 'jwt'`일 때 서버에서 토큰 발급 후 iframe `src`를 아래 형태로 구성
  - `{app.url}?ama_token={jwt}&locale={lang}`
- 특성
  - 브라우저 기반 iframe 로딩은 기본적으로 GET 요청이며, URL 기반 전달이 고정됨

### 2.2 App Store(공식/스테이징) URL 전달 방식
- 관련 파일
  - `apps/web/src/domain/entity-settings/util/build-store-url.ts`
  - `apps/web/src/domain/entity-settings/pages/EntityCustomAppsTabPage.tsx`
- 현재 동작
  - Entity/User 정보도 query parameter 중심 (`ent_id`, `ent_code`, `ent_name`, `email`)으로 전달
  - 유틸 주석에 JWT 기반 전환은 `TODO`로만 명시되어 있고 실제 구현은 없음

### 2.3 stg-apps 수신 가능 방식 실측
- 점검 일시: 2026-04-01
- 점검 결과 (HTTP status)
  - `GET https://stg-apps.amoeba.site/` -> `200`
  - `POST https://stg-apps.amoeba.site/` -> `405`
  - `GET https://stg-apps.amoeba.site/app-car-manager/` -> `200`
  - `POST https://stg-apps.amoeba.site/app-car-manager/` -> `405`
- 해석
  - 스테이징 앱스토어 라우팅은 현재 페이지 경로 POST를 허용하지 않음
  - 현 상태에서는 AMA가 POST로 JWT를 전송해도 수신/처리되지 않음

## 3. TO-BE 요구사항
1. 아메바 공식 연동 도메인(`apps.amoeba.site`, `stg-apps.amoeba.site`, `talk.amoeba.site`, `dev-ambtalk.amoeba.site`) 연동에 한해 URL query token(`ama_token`)을 제거한다.
2. 대상 도메인에서 POST 기반 토큰 수신 또는 동등한 보안 전송 메커니즘을 제공한다.
3. 수신한 토큰은 서버측에서 검증 후 세션화(HttpOnly/Secure/Cookie)하여 프론트 URL에 토큰이 노출되지 않게 한다.
4. 일반 외부 커스텀앱 도메인은 기존 Query String 연동을 유지하여 기존 연동 호환성을 보장한다.
5. 기존 `open_mode=iframe/new_tab` UX를 유지하며, 실패 시 폴백 경로를 제공한다.
6. 스테이징(`stg-apps`) 및 프로덕션(`apps`)에서 동일한 인증 흐름을 보장한다.

## 4. 갭 분석
- 전송 계층 갭
  - AS-IS: iframe `src` GET + query token
  - TO-BE: POST 수신 또는 server-side token exchange
- 수신 계층 갭
  - AS-IS: stg-apps 페이지 경로 POST 405
  - TO-BE: POST 수신 endpoint/BFF 제공
- 보안 갭
  - AS-IS: URL에 민감 토큰 포함 가능성
  - TO-BE: URL 비노출(일회성 코드/세션 전환)
- 운영 갭
  - AS-IS: AMA 단독 변경으로는 전환 불가
  - TO-BE: AMA + AppStore(BFF/SSR or API gateway) 동시 변경 필요
- 적용 범위 갭
  - AS-IS: 모든 커스텀앱이 동일 query token 흐름
  - TO-BE: 앱스토어 도메인만 신규 인증 흐름 적용(도메인별 분기 필요)

## 5. 사용자 플로우
### 5.1 목표 플로우 A (권장: Server-side Token Exchange)
1. AMA 사용자가 커스텀앱 실행
2. AMA는 JWT 대신 단기 일회성 교환코드(`launch_code`)를 발급
3. 브라우저는 앱 URL에 `launch_code`만 전달(또는 백엔드 리다이렉트 경유)
4. AppStore BFF가 서버-서버로 AMA 검증 API 호출 후 사용자 컨텍스트 확정
5. BFF가 HttpOnly 세션 쿠키 발급 후 앱 초기 페이지로 리다이렉트
6. 앱 프론트는 세션 기반으로 사용자 상태 조회

### 5.2 목표 플로우 B (대안: Direct POST Submit)
1. AMA가 hidden form + target iframe/new window로 POST 전송
2. AppStore 수신 endpoint가 body JWT 수신
3. 서버 검증 후 세션 쿠키 발급 및 내부 페이지로 302 이동
4. 앱은 세션 기반 접근

> 비고: 플로우 B는 현재 stg-apps가 POST 405 상태이므로 수신 endpoint/라우팅 추가 없이는 불가

## 6. 기술 제약사항
- 브라우저 제약
  - iframe `src`는 GET 기반, body 전송 불가
  - cross-origin iframe 환경에서 부모 JS로 자식 페이지 request body 직접 주입 불가
- 인프라 제약
  - stg-apps Nginx/라우팅에서 페이지 경로 POST 미허용(405)
  - AppStore 서버 측(BFF/SSR/API) 변경이 선행되어야 함
- 보안 제약
  - JWT를 URL에 노출하지 않으려면 최소 one-time code + 서버 검증 구조 필요
  - replay attack 방지를 위한 code TTL, one-time use, nonce 검증 필요
- 호환성 제약
  - 일반 외부 앱은 기존 query 기반을 유지해야 하므로 도메인 allowlist 기반 분기 필수
  - 앱스토어 대상만 신규 방식을 적용하는 기능 플래그/정책 테이블 필요
- 배포 제약
  - stg/prod 환경별 동시 반영 필요(AMA만 선배포 시 인증 실패 위험)

## 6.1 Allowlist 매칭 규칙 상세
### A. 허용 도메인(고정)
- `apps.amoeba.site`
- `stg-apps.amoeba.site`
- `talk.amoeba.site`
- `dev-ambtalk.amoeba.site`

### B. 정확 일치(Exact Match) 규칙
- URL 파싱 후 `hostname`이 허용 도메인 문자열과 완전히 동일할 때만 allow 처리
- 대소문자는 소문자로 정규화 후 비교
- URL trailing dot(`apps.amoeba.site.`)은 trim 후 비교
- `origin` 전체 문자열 비교가 아니라 `hostname` 비교를 기준으로 판정

### C. 서브도메인 차단 규칙
- 허용 도메인의 하위 도메인은 기본 차단
  - 예: `foo.apps.amoeba.site` -> 차단
  - 예: `api.talk.amoeba.site` -> 차단
- 사용자 정보가 포함된 URL(`https://user@apps.amoeba.site`)은 차단
- IDN/Punycode 우회(`xn--`) 또는 혼동 문자 도메인은 차단

### D. 프로토콜 정책
- 허용 프로토콜: `https:`만 허용
- `http:`는 개발 환경이라도 기본 차단(정책 예외 승인 시에만 허용)
- `javascript:`, `data:`, `file:`, `blob:` 등 비HTTP(S) 스킴 전면 차단

### E. 포트 정책
- 허용 포트: 빈 값(기본 443) 또는 명시적 `443`만 허용
- 차단 포트 예시: `:80`, `:3000`, `:5173`, `:8080`, 기타 임의 포트
- 포트가 존재하면 숫자 파싱 후 allowlist 포트 집합과 정확 일치할 때만 허용

### F. 예시 판정표
- 허용: `https://apps.amoeba.site/app-abc`
- 허용: `https://stg-apps.amoeba.site/app-car-manager`
- 허용: `https://talk.amoeba.site/channel/general`
- 허용: `https://dev-ambtalk.amoeba.site/room/1`
- 차단: `http://apps.amoeba.site/app-abc` (http)
- 차단: `https://apps.amoeba.site:8443/app-abc` (비허용 포트)
- 차단: `https://foo.apps.amoeba.site/app-abc` (서브도메인)
- 차단: `javascript:alert(1)` (비허용 스킴)

### G. 실패 처리 규칙
- allowlist 불일치 시 신규 인증(POST/exchange) 미적용
- 일반 외부 커스텀앱 경로로 안전하게 fallback
- 보안 로그에 차단 사유 기록(스킴/호스트/포트)

## 7. 영향 범위
- AMA Web
  - `apps/web/src/domain/custom-apps/pages/CustomAppHostPage.tsx`
  - `apps/web/src/domain/entity-settings/util/build-store-url.ts`
- AMA API (예상)
  - 커스텀앱 토큰 발급/검증 API 확장 또는 launch code 발급 API 추가
- App Store (외부 시스템)
  - `stg-apps.amoeba.site` / `apps.amoeba.site`의 BFF/SSR/API/Nginx 라우팅 변경

## 8. 수용 기준(AC)
- AC-1: 공식 연동 도메인 연동 시 커스텀앱 실행 URL에서 `ama_token` query parameter가 제거된다.
- AC-2: 대상 도메인 측이 POST 또는 교환코드 방식으로 토큰을 수신/검증할 수 있다.
- AC-3: 인증 완료 후 앱 접근은 세션 쿠키 기반으로 동작한다.
- AC-4: 스테이징에서 `custom-apps -> stg-apps/{app}` 실행 시 인증 성공한다.
- AC-5: 일반 외부 커스텀앱은 기존 Query String 방식으로 기존 동작이 유지된다.
- AC-6: `talk.amoeba.site`, `dev-ambtalk.amoeba.site` 연동 경로에서도 인증 성공 및 URL 비노출이 보장된다.
- AC-7: 공식 연동 경로에서 로그/리퍼러/브라우저 주소창에 JWT 원문이 남지 않는다.
- AC-8: allowlist는 정확 호스트 일치 + HTTPS + 443 정책을 준수한다.
- AC-9: 허용 도메인의 서브도메인/비허용 포트/비HTTPS는 모두 차단된다.

## 9. 결론
- 현재 구조 기준으로 "AMA에서 POST 전송" 단독 변경은 실현 불가.
- AppStore 수신계층(BFF/SSR/API)에서 POST 허용 및 검증/세션화 기능을 먼저 제공해야 함.
- 보안/운영 안정성을 고려할 때 direct JWT POST보다 one-time code + server-side exchange 방식이 우선 권장됨.
