# PLAN - AMA 프로덕션 AWS 배포 작업계획

- **작성일**: 2026-03-29
- **대상 서버**: AWS EC2 (18.138.206.18, ap-southeast-1a)
- **도메인**: https://ama.amoeba.site
- **SSH**: `ssh amb-production` (ec2-user)

---

## 1. 현재 서버 현황 (AS-IS)

| 항목 | 상태 |
|------|------|
| **OS** | Amazon Linux 2 (x86_64) |
| **CPU** | 2 vCPU |
| **RAM** | 3.8GB (2.4GB available) |
| **디스크** | 8GB EBS (3.3GB 여유, 60% 사용) |
| **Swap** | 없음 |
| **Nginx** | 1.22.1 설치됨, 80/443 리스닝 |
| **SSL** | `/etc/nginx/ssl/amoeba.site.crt` (와일드카드, 2026-04-13 만료) |
| **Docker** | **미설치** |
| **Node.js** | **미설치** |
| **Git** | 2.40.1 설치됨 |
| **프로젝트** | `~/ambManagement` 없음 |
| **ama.amoeba.site** | Nginx 설정 있음 (Coming Soon 페이지) |

### 기존 운영 서비스
- `avenue.amoeba.site` - Amoeba Shop (Laravel)
- `bill.amoeba.site` - Billing
- `amoeba.site` - 서비스 소개
- `apps.amoeba.site` - Partner/Custom Apps
- `share.amoeba.site`, `cart.amoeba.site`, `www.amoeba.site` 등

---

## 2. 배포 방식: Docker 기반 (방식 A - 권장)

스테이징 서버(amb-staging)와 동일한 Docker Compose 구조를 사용하여 운영 안정성과 배포 일관성을 확보한다.

### Docker Compose 서비스 구성

| 서비스 | 컨테이너 | 내부 포트 | 외부 포트 |
|--------|----------|-----------|-----------|
| amb-postgres | amb-postgres-production | 5432 | (내부전용) |
| amb-api | amb-api-production | 3009 | (내부전용) |
| amb-web | amb-web-production | 80 | 8080 |
| amb-portal-api | amb-portal-api-production | 3010 | (내부전용) |
| amb-portal-web | amb-portal-web-production | 80 | 8081 |

### 네트워크 구조
```
[Client] → HTTPS(443) → [Host Nginx (SSL 종료)]
                              ↓
                    HTTP → localhost:8080 → [Docker amb-web]
                              ↓ (/api/)
                         [Docker amb-api:3009]
                              ↓
                         [Docker amb-postgres:5432]
```

---

## 3. 단계별 구현 계획

### Phase 1: 서버 인프라 준비

#### Step 1.1: EBS 볼륨 확장 (8GB → 30GB)
- **작업 위치**: AWS Console 또는 AWS CLI
- **방법**: EC2 > Volumes > Modify Volume (온라인 확장, 재부팅 불필요)
- **사이드 임팩트**: 없음 (기존 서비스 영향 없음)

#### Step 1.2: 파일시스템 확장
```bash
# SSH 접속 후
sudo growpart /dev/xvda 1
sudo xfs_growfs /        # Amazon Linux 2는 XFS
df -h /                  # 확인
```

#### Step 1.3: Swap 파일 생성 (2GB)
```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h  # 확인
```

#### Step 1.4: Docker 설치
```bash
# Docker
sudo amazon-linux-extras install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose Plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 재접속 후 확인
docker --version
docker compose version
```

---

### Phase 2: 프로젝트 설정

#### Step 2.1: Git Clone
```bash
cd ~
git clone git@github.com:KimIgyong/ambManagement.git
cd ambManagement
git checkout production
```
> **주의**: production 브랜치가 존재하는지 확인 필요. 없으면 main에서 생성.

#### Step 2.2: .env.production 생성
```bash
cp docker/production/.env.production.example docker/production/.env.production
vi docker/production/.env.production
```

**필수 설정 항목:**
```env
# Database
DB_HOST=amb-postgres
DB_PORT=5432
DB_USERNAME=amb_user
DB_PASSWORD=<강력한_비밀번호_생성>
DB_DATABASE=db_amb

# API
NODE_ENV=production
API_PORT=3009
API_PREFIX=api/v1
JWT_SECRET=<32자_이상_랜덤_시크릿>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGINS=https://ama.amoeba.site
FRONTEND_URL=https://ama.amoeba.site
SWAGGER_ENABLED=false
API_KEY_ENCRYPTION_SECRET=<32바이트_암호화_키>
ENCRYPTION_KEY=<64자_HEX_문자열>

# Claude AI
CLAUDE_API_KEY=<Anthropic_API_키>

# Frontend (빌드 시점 인라인)
VITE_API_BASE_URL=https://ama.amoeba.site/api/v1

# Portal
PORTAL_API_PORT=3010
PORTAL_JWT_SECRET=<포탈용_JWT_시크릿>
PORTAL_CORS_ORIGINS=https://www.amoeba.site
PORTAL_FRONTEND_URL=https://www.amoeba.site
PORTAL_VITE_API_BASE_URL=https://www.amoeba.site/api/v1
```

> **⚠️ 중요**: `VITE_API_BASE_URL`은 빌드 시점에 JS에 인라인되므로 반드시 정확한 값 설정 후 빌드해야 함

---

### Phase 3: 호스트 Nginx 설정 변경

#### Step 3.1: ama.amoeba.site.conf 수정

**현재 (static file serving):**
```nginx
server {
    listen 443 ssl;
    server_name ama.amoeba.site;
    ssl_certificate /etc/nginx/ssl/amoeba.site.crt;
    ssl_certificate_key /etc/nginx/ssl/amoeba.site.key;
    root /var/www/ama_amoeba;
    index index.html index.php;
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**변경 후 (reverse proxy to Docker):**
```nginx
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
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';

    client_max_body_size 50M;

    # Reverse Proxy to Docker amb-web (8080)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE Support
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
```

#### Step 3.2: Nginx 검증 및 재시작
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Phase 4: 빌드 및 배포

#### Step 4.1: 최초 배포 실행
```bash
cd ~/ambManagement
bash docker/production/deploy-production.sh
```

배포 스크립트가 자동으로 수행:
1. production 브랜치 확인 및 git pull
2. 기존 이미지 백업 (태그)
3. Docker 이미지 빌드 (with --env-file)
4. 컨테이너 시작
5. Health check (PostgreSQL → API → Web)

#### Step 4.2: 검증
```bash
# 컨테이너 상태 확인
docker ps

# Web 응답 확인
curl -s http://localhost:8080 | head -5

# API 응답 확인
curl -s http://localhost:8080/api/v1/health

# 외부 접속 확인
curl -s https://ama.amoeba.site | head -5

# 빌드된 JS에 올바른 도메인 확인
docker exec amb-web-production grep -rl "ama.amoeba.site" /usr/share/nginx/html/ | head -5
```

---

### Phase 5: DB 초기 데이터 (선택)

#### Option A: Fresh 시작 (빈 DB)
- TypeORM synchronize가 production에서 비활성화이므로, 초기 스키마 SQL 실행 필요
- `sql/` 폴더의 마이그레이션 SQL 적용

#### Option B: 스테이징 DB 마이그레이션
```bash
# 스테이징에서 덤프
ssh amb-staging "docker exec amb-postgres-staging pg_dump -U amb_user db_amb > /tmp/amb_dump.sql"
scp amb-staging:/tmp/amb_dump.sql /tmp/

# 프로덕션으로 전송
scp /tmp/amb_dump.sql amb-production:/tmp/

# 프로덕션 DB에 복원
ssh amb-production "docker exec -i amb-postgres-production psql -U amb_user db_amb < /tmp/amb_dump.sql"
```

---

## 4. 사전 확인 체크리스트

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 1 | AWS Console EBS 볼륨 확장 권한 | ⬜ 확인 필요 | 8GB → 30GB |
| 2 | `production` 브랜치 존재 여부 | ⬜ 확인 필요 | 없으면 main에서 생성 |
| 3 | GitHub SSH 키 (서버) | ⬜ 확인 필요 | git clone용 deploy key |
| 4 | `.env.production` 시크릿 값 결정 | ⬜ 준비 필요 | DB_PASSWORD, JWT_SECRET 등 |
| 5 | CLAUDE_API_KEY 준비 | ⬜ 준비 필요 | Anthropic API 키 |
| 6 | DB 초기 데이터 방식 결정 | ⬜ 결정 필요 | Fresh vs 스테이징 마이그레이션 |
| 7 | SSL 인증서 갱신 계획 | ⚠️ 주의 | 2026-04-13 만료 (15일 남음) |
| 8 | AWS Security Group 포트 | ⬜ 확인 필요 | 80, 443 인바운드 허용 확인 |

---

## 5. 사이드 임팩트 분석

| 영향 범위 | 리스크 | 대응 |
|-----------|--------|------|
| 기존 Nginx 서비스 | Nginx reload 시 일시적 영향 | `nginx -t` 검증 후 reload |
| 디스크 사용량 | Docker 이미지로 디스크 증가 | EBS 30GB로 확장 |
| 메모리 | Docker 컨테이너 메모리 사용 | Swap 2GB 추가 |
| ama.amoeba.site | Coming Soon → AMA 서비스 전환 | 의도된 변경 |
| 포트 충돌 | 8080, 8081 사용 | 기존 미사용 확인됨 |

---

## 6. 롤백 계획

### 즉시 롤백 (Nginx)
```bash
# 호스트 Nginx를 원래 static 설정으로 복원
sudo cp /etc/nginx/conf.d/ama.amoeba.site.conf.bak /etc/nginx/conf.d/ama.amoeba.site.conf
sudo nginx -t && sudo systemctl reload nginx
```

### Docker 롤백
```bash
bash docker/production/deploy-production.sh rollback
```

---

## 7. 예상 배포 명령어 요약

```bash
# 1. 서버 인프라 (Phase 1)
ssh amb-production
sudo growpart /dev/xvda 1 && sudo xfs_growfs /
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
sudo amazon-linux-extras install docker -y && sudo systemctl start docker && sudo systemctl enable docker && sudo usermod -aG docker ec2-user

# 2. 프로젝트 (Phase 2)
git clone git@github.com:KimIgyong/ambManagement.git ~/ambManagement
cd ~/ambManagement && git checkout production
cp docker/production/.env.production.example docker/production/.env.production
vi docker/production/.env.production

# 3. Nginx (Phase 3)
sudo cp /etc/nginx/conf.d/ama.amoeba.site.conf /etc/nginx/conf.d/ama.amoeba.site.conf.bak
sudo vi /etc/nginx/conf.d/ama.amoeba.site.conf
sudo nginx -t && sudo systemctl reload nginx

# 4. 배포 (Phase 4)
bash docker/production/deploy-production.sh
```
