# Docker Storage 이전 작업 가이드

**작성일**: 2026-03-12  
**목적**: Docker data-root를 `/var/lib/docker` → `/home/docker`로 안전하게 이전  
**대상 환경**: 스테이징 서버 (`amb-staging`, 14.161.40.143)  
**이전 스크립트**: `docker/staging/migrate-docker-storage.sh`

---

## 개요

Docker는 기본적으로 모든 데이터(이미지, 컨테이너, 볼륨, 빌드 캐시)를 `/var/lib/docker`에 저장합니다.  
이 작업은 **data-root 경로를 `/home/docker`로 이전**하여 디스크 여유 공간을 확보하거나 파티션 구조를 개선하는 목적으로 수행합니다.

### 영향 범위

| 대상 | 영향 |
|------|------|
| Docker 이미지 | 이전됨 (재빌드 불필요) |
| Docker 볼륨 (`postgres_data`, `api_uploads`) | 이전됨 (데이터 보존) |
| 컨테이너 상태 | Docker 재시작 시 자동 복구 (`restart: unless-stopped`) |
| 서비스 다운타임 | **약 5~15분** (데이터 크기에 따라 다름) |

---

## 사전 조건 체크리스트

작업 전 반드시 아래 항목을 확인하세요.

### 1. 디스크 여유 공간 확인

SSH로 스테이징 서버에 접속하여 확인합니다.

```bash
ssh amb-staging

# /var/lib/docker 현재 용량 확인
sudo du -sh /var/lib/docker

# /home 파티션 여유 공간 확인 (/home에 충분한 공간이 있어야 함)
df -h /home /var

# 권장: /var/lib/docker 크기의 1.5배 이상 /home 여유 공간 필요
```

> ⚠️ **중요**: `/home` 파티션에 충분한 공간이 없으면 rsync 도중 실패합니다.

### 2. 현재 서비스 상태 확인

```bash
ssh amb-staging "cd ~/ambManagement && docker compose -f docker/staging/docker-compose.staging.yml ps"
```

정상 실행 중인 컨테이너 목록 확인:
- `amb-postgres-staging`
- `amb-api-staging`
- `amb-web-staging`
- `amb-portal-api-staging`
- `amb-portal-web-staging`

### 3. DB 백업 (필수)

데이터 이전 전 반드시 DB 백업을 수행합니다.

```bash
# 스테이징 서버에서 실행
ssh amb-staging

BACKUP_FILE="pgdump_staging_$(date +%Y%m%d_%H%M%S).sql"
docker exec amb-postgres-staging pg_dump -U ${DB_USERNAME} ${DB_DATABASE} > ~/$BACKUP_FILE
echo "백업 완료: ~/$BACKUP_FILE"
ls -lh ~/$BACKUP_FILE
```

### 4. 코드 최신화 확인

로컬에서 스크립트가 서버에 있는지 확인:

```bash
ssh amb-staging "ls -la ~/ambManagement/docker/staging/migrate-docker-storage.sh"
```

없다면 먼저 코드를 최신화합니다:

```bash
ssh amb-staging "cd ~/ambManagement && git pull origin main"
```

---

## 이전 작업 절차

### Step 1: 스테이징 컨테이너 중지

```bash
ssh amb-staging "cd ~/ambManagement && \
  docker compose -f docker/staging/docker-compose.staging.yml down"
```

중지 확인:

```bash
ssh amb-staging "docker ps"
# 실행 중인 amb-* 컨테이너가 없어야 함
```

### Step 2: 이전 스크립트 실행

스테이징 서버에 직접 접속하여 실행합니다 (`sudo` 필요).

```bash
ssh amb-staging

cd ~/ambManagement
sudo bash docker/staging/migrate-docker-storage.sh
```

스크립트가 수행하는 작업 (내부 순서):

```
1. 디스크 상태 출력 및 이전 데이터 크기 확인
2. /home/docker 디렉토리 생성 (chmod 710)
3. Docker 서비스(docker.socket + docker) 중지
4. rsync -aH 로 /var/lib/docker/ → /home/docker/ 전체 복사
5. /etc/docker/daemon.json 백업 후 data-root 업데이트
6. Docker 서비스 시작
7. docker info | grep "Docker Root Dir" 로 검증
8. 이전 결과 출력
```

스크립트 실행 중 `yes` 입력으로 확인 후 진행합니다.

**정상 완료 출력 예시:**

```
[OK]    이전 성공! Docker Root Dir이 /home/docker 로 변경되었습니다.
```

### Step 3: 이전 결과 검증

```bash
# Docker Root Dir 확인
sudo docker info | grep "Docker Root Dir"
# 출력: Docker Root Dir: /home/docker

# daemon.json 확인
cat /etc/docker/daemon.json
# { "data-root": "/home/docker" }

# 이미지 목록 확인 (이전 이미지가 그대로 있어야 함)
docker images

# 볼륨 확인
docker volume ls
# postgres_data 및 api_uploads 볼륨이 있어야 함
```

### Step 4: 스테이징 서비스 재시작

검증이 완료되면 서비스를 다시 시작합니다.

```bash
cd ~/ambManagement
bash docker/staging/deploy-staging.sh up
```

> `up` 옵션을 사용하면 이미 빌드된 이미지를 그대로 사용하므로 빌드를 다시 하지 않아도 됩니다.

서비스 정상 기동 확인:

```bash
docker compose -f docker/staging/docker-compose.staging.yml ps
```

모든 컨테이너가 `Up` 상태이고 `amb-postgres-staging`의 healthcheck가 통과해야 합니다.

### Step 5: 스테이징 사이트 동작 확인

```bash
# API 헬스체크
curl -s https://stg-ama.amoeba.site/api/v1/health | jq .

# 웹 접속 확인
curl -o /dev/null -s -w "%{http_code}" https://stg-ama.amoeba.site/
# 200 또는 301/302 응답 정상
```

브라우저에서 `https://stg-ama.amoeba.site` 접속하여 로그인 및 주요 기능 점검.

---

## 롤백 절차

이전 실패 또는 서비스 이상 발생 시 다음 순서로 롤백합니다.

### 자동 롤백 (스크립트 실패 시)

`migrate-docker-storage.sh` 스크립트는 Docker 재시작 실패 시 자동으로 `daemon.json`을 백업본으로 복원하고 Docker를 `/var/lib/docker`로 재시작합니다.

### 수동 롤백

```bash
# 1. Docker 서비스 중지
sudo systemctl stop docker

# 2. daemon.json 백업 복원
#    백업 파일명 예: /etc/docker/daemon.json.bak.20260312-143022
sudo ls /etc/docker/daemon.json.bak.*
sudo cp /etc/docker/daemon.json.bak.{TIMESTAMP} /etc/docker/daemon.json

# 3. Docker 서비스 시작
sudo systemctl start docker

# 4. 정상 확인
sudo docker info | grep "Docker Root Dir"
# Docker Root Dir: /var/lib/docker
```

롤백 성공 시 `deploy-staging.sh up`으로 서비스를 재시작합니다.

---

## 이전 후 정리 (선택)

이전이 완전히 검증된 후(최소 1~2일 운영 확인) 기존 디렉토리를 삭제하여 공간을 확보합니다.

```bash
# 반드시 /home/docker가 정상 사용 중임을 먼저 확인
sudo docker info | grep "Docker Root Dir"
# Docker Root Dir: /home/docker  ← 반드시 이 상태여야만 삭제 가능

# 기존 디렉토리 삭제
sudo rm -rf /var/lib/docker

# 디스크 여유 공간 확인
df -h /var
```

> ⚠️ **절대 주의**: `docker info`에서 `Docker Root Dir`이 `/home/docker`임을 확인한 후에만 `/var/lib/docker`를 삭제하세요.

---

## 트러블슈팅

### rsync 도중 디스크 풀

```
No space left on device
```

**원인**: `/home` 파티션 여유 공간 부족  
**조치**:
1. `/home`에서 불필요한 파일 삭제
2. `/home` 파티션 확장 후 재시도
3. 또는 다른 파티션(예: `/data`)으로 타겟 변경 후 스크립트 내 `NEW_ROOT` 값 수정

### Docker 서비스 시작 실패

```
Job for docker.service failed
```

**조치**:
```bash
sudo journalctl -u docker.service -n 50 --no-pager
sudo cat /etc/docker/daemon.json  # JSON 문법 오류 확인
```

`daemon.json` 형식 오류 시 백업 파일로 복원 후 재시작.

### 이전 후 볼륨 데이터 누락

```bash
# 볼륨 실제 데이터 경로 확인
docker volume inspect ambmanagement_postgres_data
# "Mountpoint": "/home/docker/volumes/..." 로 표시되어야 함
```

데이터가 없으면 rsync 중 오류가 발생했을 가능성 — 수동 롤백 후 재시도.

---

## 빠른 참조 명령어

```bash
# 전체 작업을 로컬에서 SSH로 원격 실행 (Step 1 + 스크립트 실행은 수동 필요)

# 사전 확인
ssh amb-staging "sudo du -sh /var/lib/docker && df -h /home"

# 서비스 중지
ssh amb-staging "cd ~/ambManagement && docker compose -f docker/staging/docker-compose.staging.yml down"

# 스크립트 실행 (서버에서 직접)
ssh amb-staging "sudo bash ~/ambManagement/docker/staging/migrate-docker-storage.sh"

# 검증
ssh amb-staging "sudo docker info | grep 'Docker Root Dir'"

# 서비스 재시작
ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh up"

# 최종 상태 확인
ssh amb-staging "cd ~/ambManagement && docker compose -f docker/staging/docker-compose.staging.yml ps"
```
