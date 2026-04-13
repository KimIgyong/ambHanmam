# Work Plan (작업 계획서)
## AMA + WWW 프로덕션 서버 배포 작업계획

- 문서 ID: PLAN-AMA-WWW-프로덕션서버배포-작업계획-20260402
- 작성일: 2026-04-02
- 대상 도메인: https://ama.amoeba.site, https://www.amoeba.site
- 대상 환경: Production
- 참조 문서:
  - `spec/DEPLOYMENT-GUIDE.md`
  - `docker/production/deploy-production.sh`
  - `docs/plan/PLAN-Git브랜치전략-20260228.md`

---

## 1. System Baseline (시스템 개발 현황 분석)

### 1.1 AMA (ambManagement)

1. 프로덕션 배포는 `production` 브랜치 기준이며, 스크립트에서 브랜치 강제 검증을 수행한다.
2. 배포 명령은 `docker/production/deploy-production.sh` 단일 진입점이다.
3. 스크립트는 `git pull -> image backup -> build -> down -> up -> health check -> cleanup` 순서로 동작한다.
4. `VITE_*` 변수는 빌드 시점 인라인이므로 `.env.production` 값 정확성이 배포 성공의 핵심이다.

### 1.2 WWW (포털)

1. 본 저장소 기준으로는 `amb-portal-api`, `amb-portal-web` 컨테이너가 프로덕션 Compose에 포함되어 있다.
2. 다만 실제 `www.amoeba.site`가 별도 서버/별도 리포지토리(`amoeba-shop` 계열)에서 운영될 수 있으므로, 배포 직전 운영 대상 서버를 확정해야 한다.
3. 본 계획서는 다음 2개 트랙을 모두 포함한다.
- Track A: 동일 서버/동일 스택 배포 (amb-production의 portal 컨테이너)
- Track B: 별도 서버 배포 (www 전용 인프라)

---

## 2. Phase-by-Phase Execution Plan (단계별 배포 실행 계획)

### Phase 0. Release Freeze & Scope Lock (사전 확정)

목표:
1. 배포 범위와 대상 서버를 확정한다.
2. 롤백 기준과 담당자를 확정한다.

작업:
1. `production` 브랜치 반영 커밋 SHA 확정
2. ama/www 각각 대상 서버 확정
3. 배포 창구(시간대) 및 담당자 지정
4. 롤백 기준 정의 (HTTP 5xx, 로그인 실패, 결제 실패)

산출물:
1. 배포 대상 SHA 목록
2. 배포 승인/롤백 승인자 목록

사이드 임팩트:
1. 대상 서버 미확정 상태로 진행 시 부분 배포 발생 위험

---

### Phase 1. Preflight Validation (배포 전 점검)

목표:
1. 배포 실패 요인을 배포 전에 제거한다.

작업:
1. 로컬 빌드 확인
- `npm run build -- --filter=@amb/api`
- `npm run build -- --filter=@amb/web`
2. 프로덕션 환경변수 점검
- `docker/production/.env.production` 존재 및 필수값 점검
- `VITE_API_BASE_URL=https://ama.amoeba.site/api/v1`
- `PORTAL_VITE_API_BASE_URL=https://www.amoeba.site/api/v1` (Track A 기준)
3. DB 스키마 변경 여부 확인
- 변경 존재 시 SQL 선반영/백업 완료 여부 확인
4. 외부 연동 키 점검
- `CLAUDE_API_KEY`, Polar/Stripe 등 결제 관련 시크릿 점검

산출물:
1. Preflight 체크리스트 완료 기록

사이드 임팩트:
1. 환경변수 오기입 시 정상 기동 후에도 CORS/redirect 오류 발생 가능

---

### Phase 2. AMA Production Deployment (ama.amoeba.site)

목표:
1. AMA 메인 서비스(api/web)를 무중단에 가깝게 전환한다.

작업:
1. 프로덕션 서버 배포 실행
- `ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh"`
2. 상태 점검
- `ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh status"`
- `ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh logs amb-api"`
3. 헬스체크
- `curl -s -o /dev/null -w '%{http_code}' https://ama.amoeba.site`
- `curl -s -o /dev/null -w '%{http_code}' https://ama.amoeba.site/api/v1/open/entity`

산출물:
1. AMA 배포 완료 및 상태 확인 로그

사이드 임팩트:
1. deploy 스크립트 health check가 간헐 경고를 보여도 실서비스는 정상일 수 있으므로 도메인 실측 검증 필수

---

### Phase 3. WWW Production Deployment (www.amoeba.site)

목표:
1. 포털(www) 경로를 운영 인프라 기준으로 안전 배포한다.

작업:
1. Track A (동일 서버/동일 스택)
- `ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh"`
- 이후 `amb-portal-api`, `amb-portal-web` 상태 점검
2. Track B (별도 서버/별도 리포)
- 운영 서버에서 해당 리포의 표준 deploy 스크립트 실행
- `www.amoeba.site` API/웹 라우팅 및 SSL 상태 점검
3. 공통 검증
- 메인 페이지/로그인/회원가입/결제 진입 시나리오 점검
- 브라우저 콘솔 CORS/혼합콘텐츠 오류 확인

산출물:
1. WWW 배포 완료 보고 및 스크린샷/접속 결과

사이드 임팩트:
1. www 배포 대상을 잘못 선택하면 ama만 갱신되고 www는 구버전 유지될 수 있음

---

### Phase 4. Post-Deployment Verification & Rollback Readiness (사후 검증 및 롤백 준비)

목표:
1. 사용자 영향 구간을 빠르게 검증하고 필요 시 즉시 롤백한다.

작업:
1. 스모크 테스트(우선순위)
- AMA: 로그인, 대시보드, 주요 API 3개
- WWW: 랜딩, 회원가입/로그인, 구독/결제 진입
2. 모니터링
- 30분 집중 모니터링 (5xx, 인증 실패, 결제 실패)
3. 장애 시 롤백
- `ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh rollback"`

산출물:
1. 배포 결과 체크리스트
2. 장애/롤백 여부 기록

사이드 임팩트:
1. 롤백 후 캐시/세션 불일치가 발생할 수 있어 재로그인 안내 필요 가능성

---

## 3. Change File List (변경 파일 목록)

### 3.1 이번 계획서 작성으로 변경되는 파일

1. `docs/plan/PLAN-AMA-WWW-프로덕션서버배포-작업계획-20260402.md` (신규)

### 3.2 배포 수행 시 점검 대상 파일

1. `docker/production/deploy-production.sh`
2. `docker/production/docker-compose.production.yml`
3. `docker/production/.env.production` (서버 내 파일)

---

## 4. Side Impact Analysis (사이드 임팩트 분석)

1. 환경변수 리스크
- `VITE_*` 오기입 시 정상 배포 후 프론트만 오동작 가능

2. 도메인/리버스프록시 리스크
- ama/www 라우팅이 동일 호스트 Nginx에서 분기될 경우 설정 누락 시 일부 도메인만 장애 발생

3. DB 리스크
- 스키마 변경이 포함된 릴리즈에서 SQL 미반영 시 런타임 500 발생

4. 외부 결제 리스크
- Polar/Stripe webhook URL 또는 secret 불일치 시 결제 후 상태 반영 실패

5. 운영 리스크
- 배포 시점 트래픽 급증 시간대와 겹치면 복구 시간 체감 증가

---

## 5. DB Migration Plan (DB 마이그레이션 계획)

필요 여부:
1. 이번 릴리즈에 스키마 변경이 있으면 필요
2. 스키마 변경이 없으면 생략 가능

절차:
1. 프로덕션 DB 백업
2. SQL 선반영 (코드 배포 전)
3. 배포 후 핵심 쿼리 스모크 검증

주의:
1. production 환경은 synchronize 비활성 가정
2. 마이그레이션 누락 시 API 전체 장애로 확산 가능

---

## 6. Final Go/No-Go Checklist (최종 배포 체크리스트)

1. `production` 브랜치 최신 커밋 확인
2. Preflight 체크 완료
3. AMA 배포 완료 + 200 응답 확인
4. WWW 배포 트랙(A/B) 확정 및 검증 완료
5. 스모크 테스트 PASS
6. 롤백 절차 사전 리허설 완료

---

## 7. Definition of Done (완료 기준)

1. `ama.amoeba.site` 웹/API 정상 응답
2. `www.amoeba.site` 주요 사용자 여정 정상 동작
3. 배포 로그/검증 로그/결과 요약 문서화 완료
4. 장애 발생 시 롤백 수행 가능 상태 확인 완료
