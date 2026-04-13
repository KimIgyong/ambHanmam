# AMB Management - 인프라 구성 명세서

> 최종 업데이트: 2026-04-14

---

## 1. 환경 요약

| 구분 | 개발 (Development) | 스테이징 (Staging) | 프로덕션 (Production) |
|------|--------------------|--------------------|----------------------|
| **위치** | 로컬 macOS (개발자 PC) | 원격 서버 222.112.235.159 | AWS 18.138.206.18 (싱가포르) |
| **AMA 도메인** | localhost | hm-stg.hanmam.kr | hm-amb.hanmam.kr |
| **Portal 도메인** | localhost | (미정) | (미정) |
| **프로토콜** | HTTP | HTTPS (Let's Encrypt) | HTTPS (와일드카드 SSL) |
| **Web 포트** | 5189 (Vite dev server) | 8088 (Docker) → 443 (Nginx SSL) | 8080 (Docker) → 443 (Nginx SSL) |
| **API 포트** | 3019 (NestJS dev) | 3019 (Docker 내부) | 3019 (Docker 내부) |
| **Portal Web 포트** | 5190 (Vite dev server) | 8089 (Docker) → 443 (Nginx SSL) | 8081 (Docker) → 443 (Nginx SSL) |
| **Portal API 포트** | 3020 (NestJS dev) | 3020 (Docker 내부) | 3020 (Docker 내부) |
| **DB 포트** | 5442 (Docker) | 5442 (Docker 내부) | 5442 (Docker 내부) |
| **빌드 방식** | Vite HMR + NestJS watch | Docker multi-stage build | Docker multi-stage build |

---

## 2. 개발 서버 (localhost)

### 2.1 시스템 환경

| 항목 | 값 |
|------|-----|
| OS | macOS (Darwin ARM64) |
| Node.js | v24.x |
| npm | 11.x |
| Docker | 29.x |
| Turborepo | 2.8.x |

### 2.2 서비스 구성

```
[개발자 브라우저] http://localhost:5189 (AMA) / http://localhost:5190 (Portal)
        |
        v
[Vite Dev Server] :5189  ──proxy──> [NestJS Dev] :3019 (api)
[Vite Dev Server] :5190  ──proxy──> [NestJS Dev] :3020 (portal-api)
                                          |
                                          v
                                   [PostgreSQL Docker] :5442
                                   [Adminer] :8099
```

### 2.3 환경 변수 파일

| 용도 | 경로 |
|------|------|
| 백엔드 | `env/backend/.env.development` |
| 프론트엔드 | `env/frontend/.env.development` |
| 포털 프론트엔드 | `env/portal-frontend/.env.development` |
| 포털 백엔드 | `env/backend/.env.development` (공용) |

### 2.4 주요 설정값

```
# 백엔드
NODE_ENV=development
API_PORT=3019
DB_HOST=localhost
DB_PORT=5442
DB_USERNAME=amb_user
DB_PASSWORD=amb_password
DB_DATABASE=db_amb_hanmam
CORS_ORIGINS=http://localhost:5189
SWAGGER_ENABLED=true

# 프론트엔드
VITE_API_BASE_URL=http://localhost:3019/api/v1
VITE_WEB_PORT=5189
```

### 2.5 개발 시작 명령

```bash
npm run db:up          # PostgreSQL + Adminer Docker 시작
npm run dev            # API(:3019) + Web(:5189) 동시 시작
npm run dev:api        # 백엔드만
npm run dev:web        # 프론트엔드만
npm run dev:portal     # Portal API(:3020) + Portal Web(:5190) 동시 시작
npm run dev:portal-api # 포털 백엔드만
npm run dev:portal-web # 포털 프론트엔드만
npm run dev:all        # 전체 실행 (api + web + portal-api + portal-web)
npm run db:down        # DB 중지
```

### 2.6 Docker Compose (개발 DB)

- 파일: `docker/docker-compose.dev.yml`
- PostgreSQL: `pgvector/pgvector:pg15` (벡터 검색 지원)
- Adminer: `http://localhost:8099`

---

## 3. 스테이징 서버 (222.112.235.159)

### 3.1 서버 스펙

| 항목 | 값 |
|------|-----|
| 호스트명 | vnpt-dev01 |
| OS | Ubuntu 22.04+ LTS |
| CPU | 6코어 |
| 메모리 | 16GB (가용 ~12GB) |
| 디스크 | 30GB (사용 ~4GB) |
| 내부 IP | 192.168.1.150 |
| Node.js | v18.19.1 |
| npm | 9.2.0 |
| Git | 2.43.0 |
| Docker | 29.2.1 |
| Docker Compose | v5.0.2 |

### 3.2 SSH 접속 정보

```bash
# ~/.ssh/config 에 등록됨
Host amb-staging
    HostName 222.112.235.159
    User fremd
    Port 20002
```

**접속 방법:**
```bash
ssh amb-staging
```

### 3.3 프로젝트 경로

```
~/ambManagement/                    # Git 저장소 (main 브랜치)
~/ambManagement/docker/staging/     # Docker 관련 설정
```

### 3.4 Git 저장소

```
Remote: git@github.com:KimIgyong/ambManagement.git
Branch: main
```

### 3.5 트래픽 흐름 (아키텍처)

#### AMA (hm-stg.hanmam.kr)

```
[인터넷] https://hm-stg.hanmam.kr
        |
        v
[호스트 Nginx 1.24.0] :443 (Let's Encrypt SSL 종단)
        |
        v  proxy_pass http://127.0.0.1:8088
[Docker: amb-web-staging] :8088 → :80 (컨테이너 내 Nginx)
        |
        |── /api/*  →  [Docker: amb-api-staging] :3019 (내부 네트워크만)
        |                        |
        |                        v
        |                [Docker: amb-postgres-staging] :5442 (내부)
        |
        |── /*  →  React SPA (index.html)
```

#### Portal (hm-stg.hanmam.kr - 포털)

```
[인터넷] https://hm-stg.hanmam.kr (포털)
        |
        v
[호스트 Nginx] :443 (Let's Encrypt SSL 종단)
        |
        |── /api/v1/cms/*          →  [Docker: amb-api-staging] :3019
        |── /api/v1/site-errors    →  [Docker: amb-api-staging] :3019
        |── /api/*                 →  [Docker: amb-portal-api-staging] :3020
        |── /*                     →  [Docker: amb-portal-web-staging] :8099 → :80
```

### 3.6 Docker 컨테이너

| 컨테이너 | 이미지 | 포트 | 역할 |
|----------|--------|------|------|
| amb-web-staging | staging-amb-web (Nginx Alpine) | 8088→80 | React SPA + API 리버스 프록시 |
| amb-api-staging | staging-amb-api (Node 20 Alpine) | 3019 (내부) | NestJS API 서버 |
| amb-portal-web-staging | staging-amb-portal-web (Nginx Alpine) | 8089→80 | Portal React SPA |
| amb-portal-api-staging | staging-amb-portal-api (Node 20 Alpine) | 3020 (내부) | Portal NestJS API 서버 |
| amb-postgres-staging | postgres:15-alpine | 5442 (내부) | PostgreSQL 데이터베이스 |

**참고**: API와 PostgreSQL 포트는 Docker 내부 네트워크(`amb-network`)에서만 접근 가능. 외부 노출 없음.

### 3.7 환경 변수

- 파일: `docker/staging/.env.staging` (git에 포함되지 않음)
- 예시: `docker/staging/.env.staging.example`

**주요 설정:**
```
NODE_ENV=production
API_PORT=3019
DB_HOST=amb-postgres          # Docker 내부 호스트명
DB_DATABASE=db_amb_hanmam
DB_USERNAME=amb_user
CORS_ORIGINS=https://hm-stg.hanmam.kr
FRONTEND_URL=https://hm-stg.hanmam.kr
SWAGGER_ENABLED=false
VITE_API_BASE_URL=https://hm-stg.hanmam.kr/api/v1
```

### 3.8 호스트 Nginx 설정 (hm-stg.hanmam.kr)

```nginx
# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name hm-stg.hanmam.kr;
    return 301 https://$host$request_uri;
}

# HTTPS 메인
server {
    listen 443 ssl;
    server_name hm-stg.hanmam.kr;
    client_max_body_size 50M;

    ssl_certificate /etc/letsencrypt/live/hm-stg.hanmam.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hm-stg.hanmam.kr/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;            # SSE 지원
        proxy_read_timeout 86400s;      # 24시간 (SSE 장기 연결)
    }
}

# 기존 도메인 → 새 도메인 리다이렉트
server {
    listen 80;
    listen 443 ssl;
    server_name stg-ama.amoeba.site;

    ssl_certificate /etc/letsencrypt/live/stg-ama.amoeba.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stg-ama.amoeba.site/privkey.pem;

    return 301 https://hm-stg.hanmam.kr$request_uri;
}
```

### 3.9 SSL 인증서

| 도메인 | 유형 | 경로 |
|--------|------|------|
| hm-stg.hanmam.kr | Let's Encrypt (Certbot 자동 갱신) | `/etc/letsencrypt/live/hm-stg.hanmam.kr/` |
| stg-ama.amoeba.site | Let's Encrypt (Certbot 자동 갱신) | `/etc/letsencrypt/live/stg-ama.amoeba.site/` |
| *.hanmam.kr (기타) | 자체 와일드카드 | `/etc/nginx/ssl/hanmam.kr.crt` |

### 3.10 같은 서버의 다른 서비스

- 다수의 Odoo 인스턴스 (리버스 프록시로 내부 서버에 전달)

---

## 4. 프로덕션 서버

### 4.1 서버 스펙

| 항목 | 값 |
|------|-----|
| 환경 | AWS EC2 (ap-southeast-1, 싱가포르) |
| IP | 18.138.206.18 |
| OS | Amazon Linux / Ubuntu |
| Docker | 29.x |
| Docker Compose | v5.x |
| SSL | 와일드카드 인증서 `*.hanmam.kr` |

### 4.2 SSH 접속 정보

```bash
# ~/.ssh/config 에 등록됨
Host amoeba-shop
    HostName 18.138.206.18
    User ec2-user
    IdentityFile ~/.ssh/amoeba.pem

# 또는
Host amb-production
    HostName 18.138.206.18
    User ec2-user
    IdentityFile ~/.ssh/amoeba.pem
```

**접속 방법:**
```bash
ssh amoeba-shop
# 또는
ssh amb-production
```

### 4.3 프로젝트 경로

```
~/ambManagement/                    # Git 저장소 (production 브랜치)
~/ambManagement/docker/production/  # Docker 관련 설정
```

### 4.4 트래픽 흐름 (아키텍처)

#### AMA (hm-amb.hanmam.kr)

```
[인터넷] https://hm-amb.hanmam.kr
        |
        v
[호스트 Nginx] :443 (와일드카드 SSL 종단)
        |
        |── /api/*  →  proxy_pass http://127.0.0.1:3019
        |                        |
        |                        v
        |                [Docker: amb-api-production] :3019
        |                        |
        |                        v
        |                [Docker: amb-postgres-production] :5442 (내부)
        |
        |── /*  →  proxy_pass http://127.0.0.1:8080
                         |
                         v
                  [Docker: amb-web-production] :8080 → :80
```

> **주의**: 프로덕션 nginx는 Docker 컨테이너 프록시 방식. 정적 파일 서빙이 아닌 컨테이너에 프록시하여 Docker 이미지 재빌드 시 프론트엔드가 자동 갱신됨.

#### Portal (hm-amb.hanmam.kr - 포털)

```
[인터넷] https://hm-amb.hanmam.kr (포털)
        |
        v
[호스트 Nginx] :443 (와일드카드 SSL 종단)
        |
        |── /api/v1/cms/*          →  proxy_pass http://127.0.0.1:3019 (amb-api)
        |── /api/v1/site-errors    →  proxy_pass http://127.0.0.1:3019 (amb-api)
        |── /api/*                 →  proxy_pass http://127.0.0.1:3020 (amb-portal-api)
        |── /*                     →  proxy_pass http://127.0.0.1:8081 (amb-portal-web)
```

### 4.5 Docker 컨테이너

| 컨테이너 | 이미지 | 포트 | 역할 |
|----------|--------|------|------|
| amb-web-production | production-amb-web (Nginx Alpine) | 8080→80 | React SPA |
| amb-api-production | production-amb-api (Node 20 Alpine) | 3019 | NestJS API 서버 |
| amb-portal-web-production | production-amb-portal-web (Nginx Alpine) | 8081→80 | Portal React SPA |
| amb-portal-api-production | production-amb-portal-api (Node 20 Alpine) | 3020 | Portal NestJS API 서버 |
| amb-postgres-production | postgres:15-alpine | 5442 (내부) | PostgreSQL 데이터베이스 |

**참고**: Dockerfile은 스테이징과 공유 (`docker/staging/Dockerfile.*`). 컨테이너명과 포트만 구분.

### 4.6 환경 변수

- 파일: `docker/production/.env.production` (git에 포함되지 않음)
- 예시: `docker/production/.env.production.example`

**주요 설정:**
```
NODE_ENV=production
API_PORT=3019
DB_HOST=amb-postgres
DB_DATABASE=db_amb_hanmam
DB_USERNAME=amb_user
CORS_ORIGINS=https://hm-amb.hanmam.kr
FRONTEND_URL=https://hm-amb.hanmam.kr
PORTAL_FRONTEND_URL=https://hm-amb.hanmam.kr
AMA_API_URL=http://amb-api:3019
PORTAL_BRIDGE_INTERNAL_TOKEN={secret}
SWAGGER_ENABLED=false
VITE_API_BASE_URL=https://hm-amb.hanmam.kr/api/v1
PORTAL_VITE_API_BASE_URL=https://hm-amb.hanmam.kr/api/v1
```

### 4.7 같은 서버의 다른 서비스

| 도메인 | 용도 | 서버 경로 |
|--------|------|----------|
| hanmam.kr | 서비스 소개 | `/var/www/hanmam_site` |
| app.hanmam.kr | 한맘오더 | `/var/www/Hanmam_Shop/public` |
| apps.hanmam.kr | 파트너 앱 플랫폼 (ambAppStore) | `/var/www/apps_hanmam` |
| avenue/cart/share/bill.hanmam.kr | Hanmam Shop 서브도메인 | - |

---

## 5. 배포

### 4.1 환경별 배포 명령

```bash
# 개발 (로컬)
bash docker/dev/deploy-dev.sh

# 스테이징 (원격)
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh"

# 프로덕션 (원격)
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh"
```

**주의**: 각 환경의 배포 스크립트는 반드시 **해당 서버에서** 실행해야 합니다. 로컬에서 실행하면 로컬 Docker에 배포됩니다.

### 4.2 배포 스크립트 명령어

#### 개발 (`deploy-dev.sh`)

| 명령 | 설명 |
|------|------|
| `deploy-dev.sh` | DB 시작 + 개발 서버 실행 |
| `deploy-dev.sh db` | DB만 시작 |
| `deploy-dev.sh stop` | DB 중지 |
| `deploy-dev.sh status` | DB 상태 + 포트 확인 |
| `deploy-dev.sh logs` | DB 로그 |
| `deploy-dev.sh reset` | DB 초기화 (볼륨 삭제 후 재시작) |

#### 스테이징 (`deploy-staging.sh`) / 프로덕션 (`deploy-production.sh`)

| 명령 | 설명 |
|------|------|
| `deploy-*.sh` | 전체 배포 (git pull + build + up) |
| `deploy-*.sh build` | Docker 이미지 빌드만 |
| `deploy-*.sh up` | 컨테이너 시작 |
| `deploy-*.sh down` | 컨테이너 중지 |
| `deploy-*.sh restart` | 재시작 (빌드 없이) |
| `deploy-*.sh logs` | 전체 로그 (`logs [service]`로 특정 서비스) |
| `deploy-*.sh status` | 상태 확인 |
| `deploy-*.sh rollback` | 이전 백업 이미지로 롤백 |
| `deploy-*.sh cleanup` | 미사용 Docker 리소스 정리 |

### 4.3 배포 흐름 (스테이징/프로덕션)

```
1. git pull origin main          (최신 코드)
2. 현재 이미지 백업 태그            (롤백용)
3. docker compose build           (새 이미지 빌드)
4. docker compose down            (기존 컨테이너 중지)
5. docker compose up -d           (새 컨테이너 시작)
6. health check                   (PostgreSQL → API → Web)
7. docker image prune             (미사용 이미지 정리)
```

---

## 6. SMTP 메일 발송 정책

| 구분 | SMTP 서버 | 용도 |
|------|-----------|------|
| **시스템 발송 (초대메일, 인증메일, 알림 등)** | `smtp.gmail.com:587` (Gmail SMTP) | 유일한 발송 수단 |

- Gmail App Password 사용 (Google 계정 → 2단계 인증 → 앱 비밀번호)
- 환경변수: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

---

## 7. 주요 파일 경로

### 7.1 환경 설정

| 파일 | 용도 |
|------|------|
| `env/backend/.env.development` | 로컬 백엔드 환경 변수 (api + portal-api 공용) |
| `env/frontend/.env.development` | 로컬 프론트엔드 환경 변수 |
| `env/portal-frontend/.env.development` | 로컬 포털 프론트엔드 환경 변수 |
| `docker/staging/.env.staging` | 스테이징 환경 변수 (git 미포함) |
| `docker/staging/.env.staging.example` | 스테이징 환경 변수 템플릿 |
| `docker/production/.env.production` | 프로덕션 환경 변수 (git 미포함) |
| `docker/production/.env.production.example` | 프로덕션 환경 변수 템플릿 |

### 7.2 Docker 설정

| 파일 | 용도 |
|------|------|
| `docker/docker-compose.dev.yml` | 로컬 개발 DB (PostgreSQL + Adminer) |
| `docker/staging/docker-compose.staging.yml` | 스테이징 전체 구성 |
| `docker/production/docker-compose.production.yml` | 프로덕션 전체 구성 |
| `docker/staging/Dockerfile.api` | API 빌드 (Node 20 Alpine, multi-stage, 공유) |
| `docker/staging/Dockerfile.web` | Web 빌드 (Vite build + Nginx Alpine, 공유) |
| `docker/staging/Dockerfile.portal-api` | Portal API 빌드 (공유) |
| `docker/staging/Dockerfile.portal-web` | Portal Web 빌드 (공유) |
| `docker/staging/nginx.conf` | 컨테이너 내부 Nginx 설정 |
| `docker/dev/deploy-dev.sh` | 개발 배포 스크립트 |
| `docker/staging/deploy-staging.sh` | 스테이징 배포 스크립트 |
| `docker/production/deploy-production.sh` | 프로덕션 배포 스크립트 |

### 7.3 빌드 설정

| 파일 | 용도 |
|------|------|
| `package.json` | 루트 워크스페이스 + 스크립트 |
| `turbo.json` | Turborepo 파이프라인 설정 |
| `apps/api/package.json` | 백엔드 의존성 |
| `apps/web/package.json` | 프론트엔드 의존성 |
| `apps/portal-api/package.json` | 포털 백엔드 의존성 |
| `apps/portal-web/package.json` | 포털 프론트엔드 의존성 |
| `apps/web/vite.config.ts` | Vite 설정 (포트, 프록시) |
| `apps/portal-web/vite.config.ts` | Portal Vite 설정 (포트, 프록시) |

---

## 8. 문제 해결

### 8.1 배포 오류: "로컬에 배포됨"
- **원인**: 배포 스크립트를 로컬에서 실행함
- **해결**: 반드시 해당 서버에서 실행하거나 `ssh <서버> "cd ~/ambManagement && bash <스크립트>"` 사용

### 8.2 API 헬스체크 타임아웃
- **원인**: NestJS 초기 부트스트랩이 느림 (TypeORM 동기화 등)
- **해결**: 경고 수준이며, 실제로는 정상 작동. `status` 명령으로 컨테이너 상태 확인

### 8.3 포트 충돌 (개발)
```bash
lsof -i :3019    # API 포트
lsof -i :5189    # Web 포트
lsof -i :5442    # DB 포트
kill -9 <PID>
```

### 7.4 DB 연결 실패 (개발)
```bash
bash docker/dev/deploy-dev.sh stop
bash docker/dev/deploy-dev.sh db
```

### 7.5 스테이징 컨테이너 로그 확인
```bash
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh logs amb-api"
```

### 7.6 프로덕션 컨테이너 로그 확인
```bash
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh logs amb-api"
```
