# PLAN - AMA Production AWS Deployment Plan
# 작업계획서 - AMA 프로덕션 AWS 배포

- **Date / 작성일**: 2026-03-30
- **Target Server / 대상 서버**: AWS EC2 (18.138.206.18, ap-southeast-1a, Singapore)
- **Domain / 도메인**: https://ama.amoeba.site
- **SSH**: `ssh amb-production` (ec2-user)

---

## 1. Current Server Status (AS-IS) / 현재 서버 현황

| Item / 항목 | Current / 현재 | Target / 변경 후 |
|-------------|---------------|-----------------|
| **OS** | Amazon Linux 2 (x86_64) | No change / 변경 없음 |
| **Instance / 인스턴스** | t3.medium (2 vCPU / 4GB RAM) | No change / 변경 없음 |
| **EBS Storage / 스토리지** | 8GB gp3 (3.3GB free) | **50GB gp3** |
| **Swap** | None / 없음 | **2GB swap file** |
| **Docker** | Not installed / 미설치 | **Docker + Compose plugin** |
| **PostgreSQL** | Not installed / 미설치 | **Docker container (PostgreSQL 15)** |
| **Nginx** | 1.22.1 (static file serving) | Reverse proxy to Docker |
| **SSL** | Wildcard *.amoeba.site (expires 2026-04-13) | No change / 변경 없음 |
| **Git** | 2.40.1 | No change / 변경 없음 |

### Existing Services / 기존 운영 서비스
- `avenue.amoeba.site` - Amoeba Shop (Laravel PHP)
- `bill.amoeba.site` - Billing
- `amoeba.site` - Service introduction page
- `apps.amoeba.site` - Partner/Custom Apps
- `share.amoeba.site`, `cart.amoeba.site`, `www.amoeba.site`

> **Note / 참고**: All existing services must remain operational during and after deployment.
> 기존 서비스는 배포 중/후에도 정상 운영되어야 함.

---

## 2. AWS Changes Summary / AWS 변경 사항 요약

### 2.1 EBS Volume Expansion / EBS 볼륨 확장

| Item / 항목 | Before / 변경 전 | After / 변경 후 |
|-------------|-----------------|-----------------|
| Size / 용량 | 8 GB | **50 GB** |
| Type / 타입 | gp3 | gp3 (no change) |
| Cost / 비용 | $0.72/month | **$4.50/month** |
| **Additional cost / 추가 비용** | | **+$3.78/month (~₩5,200)** |

### 2.2 Monthly Cost Estimate / 월 예상 비용

| Item / 항목 | Cost (USD) | Cost (KRW, approx.) |
|-------------|-----------|---------------------|
| EC2 t3.medium (On-Demand) | $48.18 | ₩66,000 |
| EBS gp3 50GB | $4.50 | ₩6,200 |
| Data Transfer (est.) / 데이터 전송 | ~$2 | ₩2,700 |
| **Total / 합계** | **~$54.68/month** | **~₩75,000/month** |

> Reserved Instance (1yr No Upfront) saves ~37%: **~$36/month (~₩49,000)**
> 1년 예약 인스턴스 시 약 37% 절감

### 2.3 No Additional AWS Service Costs / 추가 AWS 서비스 비용 없음

- **PostgreSQL**: Runs inside Docker container on EC2 (no RDS cost)
  / Docker 컨테이너 내부 실행 (RDS 비용 없음)
- **Docker**: Open-source, no license cost / 오픈소스, 라이선스 비용 없음

---

## 3. Architecture / 아키텍처

### Network Flow / 네트워크 흐름
```
[Client/Browser]
      │
      ▼ HTTPS (443)
[Host Nginx] ─── SSL termination (*.amoeba.site wildcard cert)
      │
      ├─ /ama.amoeba.site → HTTP → localhost:8080
      │                              ↓
      │                    [Docker: amb-web (Nginx)]
      │                              │
      │                              ├─ /api/* → [Docker: amb-api (NestJS :3009)]
      │                              │                      ↓
      │                              │           [Docker: amb-postgres (PG 15 :5432)]
      │                              │
      │                              └─ /* → SPA (React)
      │
      ├─ /avenue.amoeba.site → Laravel (unchanged)
      ├─ /bill.amoeba.site → Laravel (unchanged)
      └─ ... other sites (unchanged)
```

### Docker Compose Services / Docker Compose 서비스 구성

| Service / 서비스 | Container / 컨테이너 | Internal Port / 내부 포트 | External Port / 외부 포트 | Image |
|---------|-----------|------------|------------|-------|
| amb-postgres | amb-postgres-production | 5432 | Internal only / 내부 전용 | postgres:15-alpine |
| amb-api | amb-api-production | 3009 | Internal only / 내부 전용 | Custom (NestJS) |
| amb-web | amb-web-production | 80 | **8080** | Custom (Nginx+React) |
| amb-portal-api | amb-portal-api-production | 3010 | Internal only / 내부 전용 | Custom (NestJS) |
| amb-portal-web | amb-portal-web-production | 80 | **8081** | Custom (Nginx+React) |

---

## 4. Step-by-Step Execution Plan / 단계별 실행 계획

### Phase 1: AWS Infrastructure / AWS 인프라 준비

#### Step 1.1: EBS Volume Expansion (8GB → 50GB) / EBS 볼륨 확장

**Where / 작업 위치**: AWS Console (or AWS CLI)

```
AWS Console → EC2 → Volumes → Select volume → Modify → Size: 50
```

- Online expansion, no reboot required / 온라인 확장, 재부팅 불필요
- Side impact: None / 사이드 임팩트: 없음

#### Step 1.2: Extend File System / 파일시스템 확장

```bash
ssh amb-production

# Extend partition / 파티션 확장
sudo growpart /dev/xvda 1

# Extend XFS filesystem / XFS 파일시스템 확장
sudo xfs_growfs /

# Verify / 확인
df -h /
# Expected: Size=50G, Used=4.8G, Avail=45G
```

#### Step 1.3: Create Swap File (2GB) / Swap 파일 생성

```bash
# Create 2GB swap / 2GB 스왑 생성
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Persist on reboot / 재부팅 시 유지
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab

# Verify / 확인
free -h
# Expected: Swap total=2.0G
```

---

### Phase 2: Install Docker / Docker 설치

#### Step 2.1: Install Docker Engine

```bash
# Install Docker / Docker 설치
sudo amazon-linux-extras install docker -y
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group / docker 그룹에 ec2-user 추가
sudo usermod -aG docker ec2-user

# IMPORTANT: Re-login required for group change to take effect
# 중요: 그룹 변경 적용을 위해 재접속 필요
exit
ssh amb-production

# Verify / 확인
docker --version
```

#### Step 2.2: Install Docker Compose Plugin

```bash
# Install Compose plugin / Compose 플러그인 설치
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Verify / 확인
docker compose version
```

---

### Phase 3: Project Setup / 프로젝트 설정

#### Step 3.1: Git Clone

```bash
cd ~
git clone git@github.com:KimIgyong/ambManagement.git
cd ambManagement
git checkout production
```

> **Prerequisite / 전제조건**: 
> - GitHub SSH deploy key must be configured on the server
>   / GitHub SSH deploy key가 서버에 설정되어 있어야 함
> - `production` branch must exist (create from `main` if not)
>   / `production` 브랜치가 존재해야 함 (없으면 main에서 생성)

#### Step 3.2: Create .env.production / 환경변수 파일 생성

```bash
cp docker/production/.env.production.example docker/production/.env.production
vi docker/production/.env.production
```

**Required values / 필수 설정값:**

| Variable / 변수 | Value / 값 | Note / 비고 |
|----------|-----|------|
| `DB_HOST` | amb-postgres | Docker internal / Docker 내부 |
| `DB_PORT` | 5432 | |
| `DB_USERNAME` | amb_user | |
| `DB_PASSWORD` | (generate strong password) | 강력한 비밀번호 생성 |
| `DB_DATABASE` | db_amb | |
| `NODE_ENV` | production | |
| `JWT_SECRET` | (min 32 chars random) | 최소 32자 랜덤 |
| `CORS_ORIGINS` | https://ama.amoeba.site | |
| `FRONTEND_URL` | https://ama.amoeba.site | |
| `SWAGGER_ENABLED` | false | |
| `API_KEY_ENCRYPTION_SECRET` | (32 bytes) | |
| `ENCRYPTION_KEY` | (64 hex chars) | |
| `CLAUDE_API_KEY` | (Anthropic API key) | AI feature required / AI 기능 필수 |
| `VITE_API_BASE_URL` | https://ama.amoeba.site/api/v1 | **Build-time inlined / 빌드 시 인라인** |

> **CRITICAL / 중요**: `VITE_API_BASE_URL` is inlined at build time. Wrong value causes CORS errors.
> `VITE_API_BASE_URL`은 빌드 시점에 JS에 인라인됨. 잘못된 값은 CORS 에러 유발.

---

### Phase 4: Host Nginx Configuration / 호스트 Nginx 설정 변경

#### Step 4.1: Backup current config / 현재 설정 백업

```bash
sudo cp /etc/nginx/conf.d/ama.amoeba.site.conf /etc/nginx/conf.d/ama.amoeba.site.conf.bak
```

#### Step 4.2: Update to reverse proxy / 리버스 프록시로 변경

```bash
sudo tee /etc/nginx/conf.d/ama.amoeba.site.conf << 'NGINX'
# =================================
# ama.amoeba.site - AMA AI Management Assistant
# Reverse Proxy to Docker containers
# =================================
server {
    listen 80;
    listen [::]:80;
    server_name ama.amoeba.site;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ama.amoeba.site;
    ssl_certificate /etc/nginx/ssl/amoeba.site.crt;
    ssl_certificate_key /etc/nginx/ssl/amoeba.site.key;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    client_max_body_size 50M;

    # Reverse Proxy to Docker amb-web (port 8080)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE (Server-Sent Events) Support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
    }

    error_log /var/log/nginx/ama.amoeba.site-error.log;
    access_log /var/log/nginx/ama.amoeba.site-access.log;
}
NGINX
```

#### Step 4.3: Validate and reload / 검증 및 재시작

```bash
sudo nginx -t          # Must show "syntax is ok"
sudo systemctl reload nginx
```

---

### Phase 5: Build & Deploy / 빌드 및 배포

#### Step 5.1: First Deployment / 최초 배포

```bash
cd ~/ambManagement
bash docker/production/deploy-production.sh
```

The script automatically performs / 스크립트가 자동 수행:
1. Verify production branch / production 브랜치 확인
2. Git pull latest code / 최신 코드 pull
3. Backup current images (tags) / 현재 이미지 백업
4. Build Docker images (with --env-file) / Docker 이미지 빌드
5. Start containers / 컨테이너 시작
6. Health check (PostgreSQL → API → Web) / 상태 확인

#### Step 5.2: Verification / 검증

```bash
# Container status / 컨테이너 상태
docker ps

# Web response / 웹 응답
curl -s http://localhost:8080 | head -5

# API health / API 상태
curl -s http://localhost:8080/api/v1/health

# External access / 외부 접속
curl -s https://ama.amoeba.site | head -5

# Verify correct domain in built JS / 빌드된 JS 도메인 확인
docker exec amb-web-production grep -rl "ama.amoeba.site" /usr/share/nginx/html/ | head -5

# Check NO wrong domain / 잘못된 도메인 없는지 확인
docker exec amb-web-production grep -rl "stg-ama\|mng.amoeba\|localhost" /usr/share/nginx/html/ 2>/dev/null
# Expected: no output / 출력 없어야 함
```

---

### Phase 6: Database Initialization / DB 초기화 (선택)

#### Option A: Fresh Start / 새로 시작
- TypeORM `synchronize` is disabled in production / 프로덕션에서 synchronize 비활성화
- Must apply schema SQL manually / 스키마 SQL 수동 적용 필요

```bash
# Apply migration SQL files / 마이그레이션 SQL 파일 적용
docker exec -i amb-postgres-production psql -U amb_user -d db_amb < sql/init.sql
```

#### Option B: Migrate from Staging / 스테이징에서 마이그레이션

```bash
# Dump from staging / 스테이징에서 덤프
ssh amb-staging "docker exec amb-postgres-staging pg_dump -U amb_user db_amb" > /tmp/amb_staging_dump.sql

# Transfer and restore / 전송 및 복원
scp /tmp/amb_staging_dump.sql amb-production:/tmp/
ssh amb-production "docker exec -i amb-postgres-production psql -U amb_user -d db_amb < /tmp/amb_staging_dump.sql"
```

---

## 5. Pre-deployment Checklist / 사전 확인 체크리스트

| # | Item / 항목 | Status / 상태 | Note / 비고 |
|---|------------|--------------|-------------|
| 1 | AWS Console - EBS volume modify permission | ⬜ | 8GB → 50GB |
| 2 | `production` branch exists on GitHub | ⬜ | Create from main if not / 없으면 main에서 생성 |
| 3 | GitHub SSH deploy key on server | ⬜ | For git clone |
| 4 | `.env.production` secret values ready | ⬜ | DB_PASSWORD, JWT_SECRET, etc. |
| 5 | CLAUDE_API_KEY available | ⬜ | Anthropic API key |
| 6 | DB initialization method decided | ⬜ | Fresh vs staging migration |
| 7 | SSL certificate renewal plan | ⚠️ | Expires 2026-04-13 (14 days left) |
| 8 | AWS Security Group: ports 80, 443 inbound | ⬜ | Must be open / 오픈 필수 |
| 9 | AWS Security Group: port 8080, 8081 NOT public | ⬜ | Should be internal only / 내부 전용이어야 함 |

---

## 6. Side Impact Analysis / 사이드 임팩트 분석

| Scope / 영향 범위 | Risk / 리스크 | Mitigation / 대응 |
|-------------------|-------------|-------------------|
| Existing Nginx services | Brief disruption on reload | `nginx -t` validation before reload |
| 기존 Nginx 서비스 | reload 시 일시적 영향 | reload 전 `nginx -t` 검증 |
| Disk usage / 디스크 사용량 | Docker images increase disk | Expanded to 50GB (sufficient) |
| 디스크 사용량 | Docker 이미지로 디스크 증가 | 50GB로 확장 (충분) |
| Memory / 메모리 | Docker containers use RAM | 2GB swap added as buffer |
| 메모리 | Docker 컨테이너 메모리 사용 | 2GB swap 추가로 버퍼 확보 |
| Port conflict / 포트 충돌 | 8080, 8081 usage | Verified: currently unused |
| 포트 충돌 | 8080, 8081 사용 | 확인: 현재 미사용 |
| ama.amoeba.site | Coming Soon → AMA service | Intended change / 의도된 변경 |

---

## 7. Rollback Plan / 롤백 계획

### Immediate Rollback (Nginx) / 즉시 롤백

```bash
# Restore original Nginx config / 원래 Nginx 설정 복원
sudo cp /etc/nginx/conf.d/ama.amoeba.site.conf.bak /etc/nginx/conf.d/ama.amoeba.site.conf
sudo nginx -t && sudo systemctl reload nginx
```

### Docker Rollback / Docker 롤백

```bash
cd ~/ambManagement
bash docker/production/deploy-production.sh rollback
```

### Full Rollback / 완전 롤백

```bash
# Stop all Docker containers / 모든 Docker 컨테이너 중지
cd ~/ambManagement
bash docker/production/deploy-production.sh down

# Restore Nginx / Nginx 복원
sudo cp /etc/nginx/conf.d/ama.amoeba.site.conf.bak /etc/nginx/conf.d/ama.amoeba.site.conf
sudo nginx -t && sudo systemctl reload nginx
```

---

## 8. Quick Command Reference / 빠른 명령어 참조

```bash
# === Phase 1: Infrastructure / 인프라 ===
ssh amb-production
sudo growpart /dev/xvda 1 && sudo xfs_growfs /
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab

# === Phase 2: Docker ===
sudo amazon-linux-extras install docker -y && sudo systemctl start docker && sudo systemctl enable docker && sudo usermod -aG docker ec2-user
# Re-login / 재접속
sudo mkdir -p /usr/local/lib/docker/cli-plugins && sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose && sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# === Phase 3: Project / 프로젝트 ===
git clone git@github.com:KimIgyong/ambManagement.git ~/ambManagement
cd ~/ambManagement && git checkout production
cp docker/production/.env.production.example docker/production/.env.production

# === Phase 4: Nginx ===
sudo cp /etc/nginx/conf.d/ama.amoeba.site.conf /etc/nginx/conf.d/ama.amoeba.site.conf.bak
# Edit config (see Phase 4.2 above)
sudo nginx -t && sudo systemctl reload nginx

# === Phase 5: Deploy / 배포 ===
bash docker/production/deploy-production.sh

# === Ongoing: Deploy updates / 업데이트 배포 ===
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh"
```

---

## 9. SSL Certificate Renewal Warning / SSL 인증서 갱신 경고

| Item / 항목 | Value / 값 |
|-------------|-----------|
| Certificate / 인증서 | `/etc/nginx/ssl/amoeba.site.crt` |
| Expiry / 만료일 | **2026-04-13** (14 days from now) |
| Type / 타입 | Wildcard (*.amoeba.site) |
| Action Required / 조치 필요 | Renew before expiry to avoid service outage |
| | 서비스 중단 방지를 위해 만료 전 갱신 필요 |
