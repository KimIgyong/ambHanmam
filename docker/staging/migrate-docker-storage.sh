#!/usr/bin/env bash
# ============================================
# Docker data-root 이전 스크립트
# /var/lib/docker → /home/docker
# ============================================
# ⚠️  스테이징 서버에서 직접 실행 (sudo 필요)
# Usage:
#   sudo bash docker/staging/migrate-docker-storage.sh

set -euo pipefail

# ── 설정 ──────────────────────────────────
OLD_ROOT="/var/lib/docker"
NEW_ROOT="/home/docker"
DAEMON_JSON="/etc/docker/daemon.json"
DAEMON_JSON_BACKUP="/etc/docker/daemon.json.bak.$(date +%Y%m%d-%H%M%S)"

# ── 색상 ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── root 권한 체크 ────────────────────────
if [ "$EUID" -ne 0 ]; then
  log_error "이 스크립트는 sudo 로 실행해야 합니다."
  log_info "  sudo bash docker/staging/migrate-docker-storage.sh"
  exit 1
fi

echo ""
echo "============================================"
log_warn "Docker data-root 이전 작업"
log_info "  FROM: $OLD_ROOT"
log_info "  TO:   $NEW_ROOT"
echo "============================================"
echo ""
log_warn "이 작업 중 Docker 서비스가 잠시 중지됩니다."
echo ""
read -r -p "계속하시겠습니까? (yes 입력 후 Enter): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  log_info "작업이 취소되었습니다."
  exit 0
fi

# ── 1. 현재 용량 확인 ─────────────────────
echo ""
log_info "현재 디스크 상태:"
df -h "$OLD_ROOT" /home 2>/dev/null | column -t
echo ""

OLD_SIZE=$(du -sh "$OLD_ROOT" 2>/dev/null | awk '{print $1}')
log_info "이전할 데이터 크기: $OLD_SIZE"
echo ""

# ── 2. 타겟 디렉토리 생성 ─────────────────
log_info "대상 디렉토리를 생성합니다..."
mkdir -p "$NEW_ROOT"
chmod 710 "$NEW_ROOT"
log_ok "디렉토리 생성: $NEW_ROOT"

# ── 3. Docker 서비스 중지 ─────────────────
log_info "Docker 서비스를 중지합니다..."
systemctl stop docker.socket 2>/dev/null || true
systemctl stop docker
log_ok "Docker 서비스 중지됨"

# ── 4. 데이터 복사 (rsync) ────────────────
log_info "데이터를 복사합니다 (시간이 걸릴 수 있습니다)..."
rsync -aH --info=progress2 "$OLD_ROOT/" "$NEW_ROOT/"
log_ok "데이터 복사 완료"

# ── 5. daemon.json 업데이트 ───────────────
log_info "Docker daemon 설정을 업데이트합니다..."

# 기존 daemon.json 백업
if [ -f "$DAEMON_JSON" ]; then
  cp "$DAEMON_JSON" "$DAEMON_JSON_BACKUP"
  log_info "기존 설정 백업: $DAEMON_JSON_BACKUP"
  # 기존 파일에 data-root 추가/수정
  EXISTING=$(cat "$DAEMON_JSON")
  # data-root 키가 이미 존재하면 교체, 없으면 추가
  if echo "$EXISTING" | grep -q '"data-root"'; then
    python3 -c "
import json, sys
with open('$DAEMON_JSON') as f:
    d = json.load(f)
d['data-root'] = '$NEW_ROOT'
with open('$DAEMON_JSON', 'w') as f:
    json.dump(d, f, indent=2)
print('data-root 업데이트 완료')
"
  else
    python3 -c "
import json, sys
with open('$DAEMON_JSON') as f:
    d = json.load(f)
d['data-root'] = '$NEW_ROOT'
with open('$DAEMON_JSON', 'w') as f:
    json.dump(d, f, indent=2)
print('data-root 추가 완료')
"
  fi
else
  # daemon.json이 없으면 새로 생성
  cat > "$DAEMON_JSON" << EOF
{
  "data-root": "$NEW_ROOT"
}
EOF
fi

log_ok "daemon.json 업데이트 완료"
log_info "현재 설정:"
cat "$DAEMON_JSON"
echo ""

# ── 6. Docker 서비스 시작 ─────────────────
log_info "Docker 서비스를 시작합니다..."
systemctl start docker
sleep 3

if systemctl is-active docker &>/dev/null; then
  log_ok "Docker 서비스 정상 시작"
else
  log_error "Docker 서비스 시작 실패!"
  log_info "daemon.json을 복원합니다..."
  [ -f "$DAEMON_JSON_BACKUP" ] && cp "$DAEMON_JSON_BACKUP" "$DAEMON_JSON"
  systemctl start docker
  exit 1
fi

# ── 7. 검증 ──────────────────────────────
ACTUAL_ROOT=$(docker info 2>/dev/null | grep "Docker Root Dir" | awk '{print $NF}')
log_info "Docker Root Dir: $ACTUAL_ROOT"

if [ "$ACTUAL_ROOT" = "$NEW_ROOT" ]; then
  log_ok "이전 성공! Docker Root Dir이 $NEW_ROOT 로 변경되었습니다."
else
  log_error "이전 실패. Docker Root Dir이 예상과 다릅니다: $ACTUAL_ROOT"
  exit 1
fi

# ── 8. 최종 상태 ──────────────────────────
echo ""
echo "============================================"
log_ok "Docker data-root 이전 완료"
echo "============================================"
echo ""
log_info "디스크 상태:"
df -h "$OLD_ROOT" "$NEW_ROOT" 2>/dev/null | column -t
echo ""

log_info "이제 스테이징 서비스를 재시작합니다..."
log_info "  cd ~/ambManagement && bash docker/staging/deploy-staging.sh"
echo ""
log_warn "기존 /var/lib/docker 폴더는 수동으로 삭제하여 공간을 확보하세요:"
log_warn "  sudo rm -rf $OLD_ROOT"
echo ""
