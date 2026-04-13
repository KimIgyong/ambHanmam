# PLAN-커스텀앱JWT-POST전환-작업계획-20260401-보류

## 1. 시스템 개발 현황 분석
- AMA 커스텀앱 진입은 현재 iframe URL query 기반 토큰 전달 구조임.
- JWT 인증 모드에서 `ama_token`이 URL에 직접 포함되며, `locale`도 query로 전달됨.
- AppStore 스테이징 도메인(`stg-apps.amoeba.site`)의 페이지 경로는 POST 요청이 405로 차단됨.
- 추가 대상 도메인 `talk.amoeba.site`, `dev-ambtalk.amoeba.site`도 커스텀앱 JWT 연동 대상에 포함 필요.
- 일반 외부 커스텀앱도 현재 동일한 query 기반 인증 흐름을 사용 중임.
- 즉, AMA 단독 구현으로 POST 전환은 불가하며, 앱스토어 도메인 전용 분기 + AppStore 수신계층 개편이 필요함.

## 2. 단계별 구현 계획
### Phase 0. 아키텍처 선택 확정 (Design Decision)
- 목표
  - POST Direct 방식 vs One-time Code Exchange 방식 중 최종안 확정
- 작업
  - 적용 범위 확정: 앱스토어/공식 연동 도메인(`apps.amoeba.site`, `stg-apps.amoeba.site`, `talk.amoeba.site`, `dev-ambtalk.amoeba.site`) 전용 적용
  - 비적용 범위 확정: 일반 외부 커스텀앱은 현행 query 인증 유지
  - 보안성/운영성/호환성 관점 비교
  - 권장안: One-time Code Exchange(BFF/SSR)
- 산출물
  - ADR(Architecture Decision Record) 또는 설계 합의 문서
  - 도메인 allowlist 정책 정의서

### Phase 0-1. Allowlist 매칭 규칙 고정
- 목표
  - 환경별 편차 없이 동일한 도메인 판정 결과 보장
- 규칙
  - 호스트 정확 일치(4개 도메인만 허용)
  - 서브도메인 기본 차단
  - 프로토콜 `https:`만 허용
  - 포트는 기본(빈 값) 또는 `443`만 허용
- 산출물
  - 공통 유틸 함수 스펙(웹/서버 동일 로직)
  - 판정표(allow/deny examples)

### Phase 1. AppStore 수신계층 준비 (선행)
- 목표
  - AppStore가 서버측에서 인증 payload를 안전하게 수신/검증할 수 있도록 구성
- 작업
  - BFF/SSR endpoint 신설
    - 예시: `POST /auth/ama/launch` (direct POST)
    - 또는 `GET /auth/ama/exchange?code=...` (권장)
  - AMA 검증 API 연동(서버-서버)
  - 성공 시 HttpOnly+Secure+SameSite 정책 쿠키 발급
  - Nginx 라우팅/메서드 허용 정책 반영
- 산출물
  - stg-apps POST/교환코드 수신 가능 상태

### Phase 2. AMA 토큰 전달 방식 전환
- 목표
  - 앱스토어/공식 연동 도메인에서만 `ama_token` query 노출 제거
- 작업
  - 도메인 분기 구현
    - allowlist 대상: `apps.amoeba.site`, `stg-apps.amoeba.site`, `talk.amoeba.site`, `dev-ambtalk.amoeba.site`
    - allowlist 비대상(일반 외부앱): 기존 query 인증 유지
    - 정확 일치 규칙 적용: `hostname` normalize 후 Set membership 검사
    - 프로토콜/포트 규칙 적용: `https` + (`port=='' || port=='443'`)만 통과
    - 서브도메인 차단: suffix 기반 허용 금지, exact host만 허용
  - `CustomAppHostPage` 진입 로직 변경
    - direct POST 선택 시: hidden form submit + target iframe/new tab
    - exchange 선택 시: `launch_code` 발급 후 redirect URL 구성
  - `build-store-url` TODO 항목 실제 구현
  - 기존 query 기반 fallback 여부(기능 플래그) 정의
- 산출물
  - AMA -> AppStore 안전 전송 경로 구현

### Phase 3. 보안 강화 및 만료 정책
- 목표
  - 토큰 재사용/탈취 위험 최소화
- 작업
  - launch code TTL(예: 30~60초), one-time use, nonce/jti 검증
  - 재시도 정책 및 실패 응답 코드 표준화
  - 감사 로그(누가/언제/어떤 앱 실행) 추가
- 산출물
  - 보안 정책 반영 완료

### Phase 4. 통합 테스트 및 점진 배포
- 목표
  - 스테이징 안정성 검증 후 프로덕션 확장
- 작업
  - 시나리오 테스트
    - iframe mode 성공/실패
    - new_tab mode 성공/실패
    - 만료 코드/위조 코드/재사용 코드 차단
  - 성능/에러율 모니터링
  - 스테이징 -> 프로덕션 순차 배포
- 산출물
  - 배포 승인 기준 충족

## 3. 변경 파일 목록
### AMA (본 저장소)
- 수정 예정
  - `apps/web/src/domain/custom-apps/pages/CustomAppHostPage.tsx`
  - `apps/web/src/domain/entity-settings/util/build-store-url.ts`
  - `apps/api/src/domain/entity-settings/controller/*` (launch/exchange API 추가 시)
  - `apps/api/src/domain/entity-settings/service/*` (토큰/코드 발급 로직 확장 시)

### AppStore (외부 저장소, 동시 작업 필요)
- 수정 예정
  - BFF/SSR 인증 수신 endpoint
  - 세션 발급/검증 미들웨어
  - Nginx method/routing 설정

## 4. 사이드 임팩트 분석
- 인증 호환성 영향
  - 앱스토어만 전환하고 일반 외부앱은 유지하므로 전체 중단 리스크는 낮음
  - 단, 도메인 분기 오탐/미탐 시 인증 실패 가능 -> allowlist 검증 테스트 필수
- 보안 영향
  - URL 토큰 노출 제거로 보안성 향상
  - 반면 세션 관리/쿠키 정책 미흡 시 CSRF/XSS 대응 필요
- 운영 영향
  - AMA와 AppStore 배포 타이밍이 어긋나면 로그인 실패 가능
  - 환경별(stg/prod) 설정 불일치 시 장애 위험
- UX 영향
  - iframe POST 전환 시 로딩/리다이렉트 단계가 추가될 수 있음

## 5. DB 마이그레이션
- AMA: 기본안 기준 스키마 변경 없음(선택)
- 선택적 추가
  - one-time launch code 저장소를 DB 테이블로 운영할 경우 신규 테이블 필요
  - 예: `amb_app_launch_codes` (`alc_id`, `alc_code_hash`, `alc_ent_id`, `alc_usr_id`, `alc_app_code`, `alc_expires_at`, `alc_used_at`)
- 주의
  - staging/production은 `synchronize=false`이므로 스키마 변경 시 수동 SQL 필수

## 6. 테스트 전략
- 단위 테스트
  - 코드 발급/만료/재사용 방지 로직
  - 검증 실패 코드(만료, 위조, 권한 없음)
  - allowlist 매칭 테스트
    - 허용: 4개 공식 도메인 + https + 443(또는 기본 포트)
    - 차단: 서브도메인, http, 비443 포트, 비HTTP 스킴
- 통합 테스트
  - AMA -> AppStore 인증 성공 end-to-end
  - iframe/new_tab 모두 검증
  - `talk.amoeba.site`, `dev-ambtalk.amoeba.site` 경로에서 동일 규칙 검증
- 보안 테스트
  - URL/Referer/로그에 JWT 노출 여부 확인
  - replay attack 시도 차단 검증
  - allowlist 우회 시도(`user@host`, punycode, mixed-case, trailing dot) 차단 검증

## 6.1 Allowlist 구현 의사코드
```ts
const ALLOWED_HOSTS = new Set([
  'apps.amoeba.site',
  'stg-apps.amoeba.site',
  'talk.amoeba.site',
  'dev-ambtalk.amoeba.site',
]);

function isOfficialDomainUrl(rawUrl: string): boolean {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return false;
  }

  if (u.protocol !== 'https:') return false;

  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!ALLOWED_HOSTS.has(host)) return false;

  if (u.username || u.password) return false;

  if (u.port !== '' && u.port !== '443') return false;

  return true;
}
```

## 7. 완료 기준
- 앱스토어/공식 연동 도메인 경로에서만 URL `ama_token` 제거
- `stg-apps.amoeba.site`에서 POST 또는 exchange 인증 수신 성공
- `talk.amoeba.site` 및 `dev-ambtalk.amoeba.site`에서 인증 연동 시나리오 검증 성공
- 세션 쿠키 기반 앱 접근 성공
- 주요 앱 1개 이상(stg) 실제 검증 통과
- 일반 외부 커스텀앱의 기존 query 인증 동작 유지
- 장애 발생 시 fallback 또는 롤백 경로 확보
- allowlist 정확 일치/서브도메인 차단/프로토콜·포트 정책 테스트 100% 통과

## 8. 선행 의사결정 요청사항
1. 최종 방식 확정: `Direct POST` vs `One-time Code Exchange`
2. AppStore 저장소/담당자 확정(병행 개발 필요)
3. 전환 전략 확정: 빅뱅 전환 vs 기능 플래그 점진 전환
4. 운영 정책 확정: 토큰 TTL, 세션 유지시간, 감사로그 보존기간
