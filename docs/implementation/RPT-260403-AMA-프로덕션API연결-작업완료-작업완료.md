# RPT-AMA-프로덕션API연결 작업완료보고

- 작성일: 2026-04-03
- 작업자: AI Agent (GitHub Copilot)
- 대상 도메인: https://ama.amoeba.site
- 관련 계획서: docs/plan/PLAN-AMA-WWW-프로덕션서버배포-작업계획-20260402.md

---

## 1. 작업 배경

ama.amoeba.site에서 웹 정적 페이지는 정상 응답했으나, `/api/v1/open/entity`가 404로 응답했다.
원인 분석 결과, ama 도메인은 정적 경로(`/var/www/ama_amoeba`)만 바라보고 있었고 API 프록시는 `ambManagement` 백엔드가 아닌 다른 스택으로 연결되어 있었다.

---

## 2. 수행 작업 요약

1. Nginx 도메인 분리/정리
- `www.amoeba.site`와 `app.amoeba.site`를 별도 서비스로 분리 유지
- `www.amoeba.site.new.conf` 내용을 활성 설정으로 반영
- 중복 로드되는 `www.amoeba.site.new.conf`는 비활성화 처리

2. AMA 웹 정적 배포
- 로컬 `@amb/web` 프로덕션 빌드 수행
- 산출물(`apps/web/dist`)을 tar로 패키징 후 프로덕션 업로드
- `/var/www/ama_amoeba` 백업 후 정적 파일 교체 배포

3. ambManagement API 프로덕션 기동
- 프로덕션 서버 GitHub clone 권한 이슈로 직접 clone 실패
- 로컬 소스를 tar로 패키징하여 서버 `~/ambManagement`에 배치
- `docker/production/.env.production` 구성 후 `amb-postgres`, `amb-api` 기동
- `amb-api` 호스트 포트 `3009:3009` 노출

4. ama 도메인 API 라우팅 전환
- `/etc/nginx/conf.d/ama.amoeba.site.conf`의 `/api` 프록시를 `127.0.0.1:3009`로 전환
- `nginx -t` 및 `systemctl reload nginx` 완료

5. 운영 모드 안정화
- 일시적으로 스키마 생성 필요 구간 이후 `NODE_ENV=production`으로 복귀
- 재기동 후 애플리케이션 포트 3009 정상 구동 확인

---

## 3. 검증 결과

1. 도메인 응답
- ama.amoeba.site: 200
- www.amoeba.site: 200
- apps.amoeba.site: 200

2. API 라우팅
- `https://ama.amoeba.site/api/v1/open/entity`: 401 (`missing_token`)
- 의미: 404가 아닌 OAuth 보호 엔드포인트까지 정상 도달

3. OAuth 토큰 엔드포인트 도달 확인
- `POST /api/v1/oauth/token` 빈 payload: 400 (유효성 에러)
- `POST /api/v1/oauth/token` 부분 payload: 400 (`invalid_request`)
- 의미: 토큰 발급 엔드포인트 라우팅 정상

---

## 4. 변경된 서버 측 핵심 항목

1. Nginx
- `/etc/nginx/conf.d/ama.amoeba.site.conf` (`/api` -> `127.0.0.1:3009`)
- `/etc/nginx/conf.d/www.amoeba.site.conf` (www 설정 적용)
- `/etc/nginx/conf.d/app.amoeba.site.conf` (app 분리 생성)

2. 애플리케이션 경로
- AMA 정적 경로: `/var/www/ama_amoeba`
- API 코드 경로: `~/ambManagement`

3. 컨테이너
- `amb-postgres-production`
- `amb-api-production` (host `3009` 노출)

---

## 5. 이슈 및 대응

1. GitHub 권한 이슈
- 증상: 프로덕션 서버에서 `git clone git@github.com:KimIgyong/ambManagement.git` 실패
- 대응: 로컬 아카이브를 서버로 전송해 배포 진행

2. 신규 DB 스키마 부재로 API 부팅 실패
- 증상: `relation "amb_hr_system_params" does not exist`
- 대응: 초기 기동 안정화 후 `NODE_ENV=production` 복귀, API 정상 기동 확인

---

## 6. 잔여 작업 (권장)

1. OAuth 실토큰 발급 검증
- 유효 `client_id/client_secret` 및 승인 flow로 access token 발급
- `/api/v1/open/entity` 200 응답까지 E2E 확인

2. 프로덕션 배포 체계 정식화
- 프로덕션 서버의 `ambManagement` Git 접근 권한(Deploy Key) 정비
- tar 수동 배포 대신 표준 `production` 브랜치 pull 기반 전환

3. DB 마이그레이션 체계 정비
- 수동 SQL 마이그레이션 문서/체크리스트 확정
- 초기 스키마 누락 재발 방지

---

## 7. 결론

ama.amoeba.site는 현재 웹 정적 자원과 ambManagement API가 정상 연결된 상태이며,
핵심 목적이었던 `/api/v1/open/entity`의 404는 해소되었다.
현재 응답은 OAuth 정책에 따른 401로 정상이며, 다음 단계는 실토큰 발급을 통한 200 E2E 검증이다.
