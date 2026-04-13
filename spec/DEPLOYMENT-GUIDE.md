# AMB Management - 배포 가이드

> 최종 업데이트: 2026-04-14

---

## 빠른 참조

### 개발 환경
```bash
# DB + 개발 서버 시작 (api + web)
bash docker/dev/deploy-dev.sh

# DB만 시작
bash docker/dev/deploy-dev.sh db

# 상태 확인
bash docker/dev/deploy-dev.sh status

# DB 중지
bash docker/dev/deploy-dev.sh stop

# Portal 포함 전체 실행
npm run dev:all
```

### 스테이징 환경
```bash
# 배포
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh"

# 상태 확인
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh status"

# 로그 확인
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh logs"

# 재시작 (빌드 없이)
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh restart"
```

### 프로덕션 환경
```bash
# 배포
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh"

# 상태 확인
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh status"

# 로그 확인
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh logs"

# 재시작 (빌드 없이)
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh restart"
```

---

## 환경별 서버 접속 정보

| 항목 | 개발 | 스테이징 | 프로덕션 |
|------|------|----------|----------|
| SSH alias | _(로컬)_ | `amb-staging` | `amb-production` / `amoeba-shop` |
| IP | localhost | 222.112.235.159 | 18.138.206.18 (AWS 싱가포르) |
| User | _(로컬)_ | fremd | ec2-user |
| 프로젝트 경로 | 로컬 워크스페이스 | `~/ambManagement` | `~/ambManagement` |
| 도메인 | localhost | https://hm-stg.hanmam.kr | https://hm-amb.hanmam.kr |
| Git branch | _(자유)_ | `main` | `production` |

---

## 배포 스크립트 상세

### 개발 (`docker/dev/deploy-dev.sh`)

| 명령 | 설명 |
|------|------|
| `deploy-dev.sh` | DB 시작 + 개발 서버 실행 (기본값) |
| `deploy-dev.sh start` | DB + 개발 서버 (기본값과 동일) |
| `deploy-dev.sh db` | DB만 시작 (PostgreSQL + Adminer) |
| `deploy-dev.sh stop` | DB 중지 |
| `deploy-dev.sh status` | DB 상태 + 포트(3019, 5189, 5442) 확인 |
| `deploy-dev.sh logs` | DB 로그 |
| `deploy-dev.sh reset` | DB 초기화 (볼륨 삭제 후 재시작) |

**방식**: DB는 Docker, 개발 서버는 로컬 `npm run dev` (Turborepo)

> **Portal 개발 실행**: `npm run dev:portal` (Portal API + Portal Web) 또는 `npm run dev:all` (전체)

### 스테이징 (`docker/staging/deploy-staging.sh`)

| 명령 | 설명 |
|------|------|
| `deploy-staging.sh` | 전체 배포 (git pull + build + up) |
| `deploy-staging.sh build` | Docker 이미지 빌드만 (`--no-cache`) |
| `deploy-staging.sh up` | 컨테이너 시작 |
| `deploy-staging.sh down` | 컨테이너 중지 |
| `deploy-staging.sh restart` | 재시작 (빌드 없이) |
| `deploy-staging.sh logs` | 전체 로그 (`logs [service]`로 특정 서비스) |
| `deploy-staging.sh status` | 상태 확인 |
| `deploy-staging.sh rollback` | 이전 백업 이미지로 롤백 |
| `deploy-staging.sh cleanup` | 미사용 Docker 리소스 정리 |

**방식**: 전체 Docker Compose (DB + API + Web)

### 프로덕션 (`docker/production/deploy-production.sh`)

| 명령 | 설명 |
|------|------|
| `deploy-production.sh` | 전체 배포 (확인 프롬프트 포함) |
| `deploy-production.sh build` | Docker 이미지 빌드만 (캐시 활용) |
| `deploy-production.sh up` | 컨테이너 시작 |
| `deploy-production.sh down` | 컨테이너 중지 |
| `deploy-production.sh restart` | 재시작 (빌드 없이) |
| `deploy-production.sh logs` | 전체 로그 (`logs [service]`로 특정 서비스) |
| `deploy-production.sh status` | 상태 확인 |
| `deploy-production.sh rollback` | 이전 백업 이미지로 롤백 |
| `deploy-production.sh cleanup` | 미사용 Docker 리소스 정리 |

**방식**: Docker Compose (스테이징과 동일 구조) + 이중 확인 프롬프트

**스테이징과의 차이점**:
- 모든 변경 작업에 `Are you sure? [y/N]` 확인 프롬프트
- main 브랜치가 아닌 경우 추가 경고
- 빌드 시 캐시 활용 (`--no-cache` 미사용, 안정성 우선)
- 컨테이너명: `*-production` (스테이징: `*-staging`)
- Web 포트: 8080 (스테이징: 8088), Portal Web 포트: 8081 (스테이징: 8089)

---

## 배포 전 체크리스트

### 공통
- [ ] 스테이징은 `main`, 프로덕션은 `production` 브랜치 기준인지 확인
- [ ] 로컬에서 `npm run build` 성공 확인

### 스테이징
- [ ] `docker/staging/.env.staging` 파일 존재 확인
- [ ] URL 변수에 `hm-stg.hanmam.kr`만 사용되는지 확인

### 프로덕션
- [ ] `docker/production/.env.production` 파일 존재 확인
- [ ] 스테이징에서 먼저 테스트 완료
- [ ] `main` → `production` 브랜치 동기화(PR/승인) 완료
- [ ] URL 변수에 `hm-amb.hanmam.kr`만 사용되는지 확인
- [ ] DB 마이그레이션 필요 시 백업 완료
- [ ] **새 엔티티/컬럼 추가 시 수동 SQL 먼저 실행** (TypeORM synchronize=false)

### DB 마이그레이션 주의사항

> ⚠️ **스테이징·프로덕션은 `synchronize: false`**. 새 테이블/컬럼은 코드 배포 **전에** 수동 SQL로 적용해야 합니다.

```bash
# 스테이징 DB 수동 마이그레이션
ssh amb-staging "docker exec amb-postgres-staging psql -U amb_user -d db_amb_hanmam -c 'ALTER TABLE ...'"

# 프로덕션 DB 수동 마이그레이션
ssh amb-production "docker exec amb-postgres-production psql -U amb_user -d db_amb_hanmam -c 'ALTER TABLE ...'"
```

### URL 변수 필수 점검 항목
- [ ] `FRONTEND_URL`
- [ ] `PORTAL_FRONTEND_URL`
- [ ] `AMA_API_URL`
- [ ] `VITE_API_BASE_URL`
- [ ] `PORTAL_VITE_API_BASE_URL`

---

## 배포 흐름

### 스테이징 배포 (`main` 브랜치)

```
1. git pull origin main              (최신 코드)
2. 현재 이미지 백업 태그               (롤백용)
3. docker compose build              (새 이미지 빌드)
4. docker compose down               (기존 컨테이너 중지)
5. docker compose up -d              (새 컨테이너 시작)
6. health check                      (PostgreSQL → API → Web)
7. docker image prune                (미사용 이미지 정리)
```

### 프로덕션 배포 (`production` 브랜치)

```
1. main 브랜치 스테이징 검증 완료
2. main → production 브랜치 동기화 (PR + 승인)
3. production 브랜치에서 배포 실행
4. health check 및 도메인(hm-amb) URL 동작 확인
```

### 개발

```
1. docker compose up -d              (DB 시작)
2. PostgreSQL 준비 대기
3. npm run dev                       (API + Web 동시 시작)
```

---

## 주의사항

- **스크립트 실행 위치**: 각 환경의 배포 스크립트는 반드시 **해당 서버**에서 실행
  - 로컬에서 스테이징/프로덕션 스크립트 실행 시 로컬 Docker에 잘못 배포됨
- 커밋/푸시를 먼저 완료한 후 배포 (스크립트가 `git pull` 수행)
- `.env.*` 파일은 git에 포함되지 않음 (각 서버에 직접 관리)
- Dockerfile은 스테이징과 프로덕션이 공유 (`docker/staging/Dockerfile.*`)

---

## 문제 해결

### "로컬에 배포됨"
- **원인**: 배포 스크립트를 로컬에서 실행함
- **해결**: 반드시 `ssh <서버>` 후 실행하거나 `ssh <서버> "cd ~/ambManagement && bash <스크립트>"` 사용

### API 헬스체크 타임아웃
- **원인**: NestJS 초기 부트스트랩이 느림 (TypeORM 동기화 등)
- **해결**: 경고 수준이며, 실제로는 정상 작동. `status` 명령으로 컨테이너 상태 확인

### 포트 충돌 (개발)
```bash
lsof -i :3019    # API 포트
lsof -i :5189    # Web 포트
lsof -i :5442    # DB 포트
kill -9 <PID>
```

### DB 연결 실패 (개발)
```bash
bash docker/dev/deploy-dev.sh stop
bash docker/dev/deploy-dev.sh db
```

### 스테이징 컨테이너 로그 확인
```bash
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh logs amb-api"
```

### 프로덕션 컨테이너 로그 확인
```bash
ssh amb-production "cd ~/ambManagement && bash docker/production/deploy-production.sh logs amb-api"
```
