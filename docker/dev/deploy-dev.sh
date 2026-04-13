#!/usr/bin/env bash
# ============================================
# AMB Management - Development Environment Script
# ============================================
# Usage:
#   ./deploy-dev.sh              # DB 시작 + 개발 서버 실행
#   ./deploy-dev.sh start        # DB + 개발 서버 (기본값과 동일)
#   ./deploy-dev.sh db           # DB만 시작
#   ./deploy-dev.sh stop         # DB 중지
#   ./deploy-dev.sh status       # DB 상태 + 포트 확인
#   ./deploy-dev.sh logs         # DB 로그
#   ./deploy-dev.sh reset        # DB 초기화 (볼륨 삭제 후 재시작)

set -euo pipefail

# ── 경로 설정 ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.dev.yml"

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

# ── 사전 검증 ─────────────────────────────
check_prerequisites() {
  if ! command -v docker &>/dev/null; then
    log_error "docker가 설치되어 있지 않습니다."
    exit 1
  fi

  if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
    log_error "docker compose가 설치되어 있지 않습니다."
    exit 1
  fi

  if ! command -v node &>/dev/null; then
    log_error "Node.js가 설치되어 있지 않습니다."
    exit 1
  fi

  if ! command -v npm &>/dev/null; then
    log_error "npm이 설치되어 있지 않습니다."
    exit 1
  fi
}

# ── Docker Compose 래퍼 ───────────────────
dc() {
  if docker compose version &>/dev/null; then
    docker compose -f "$COMPOSE_FILE" "$@"
  else
    docker-compose -f "$COMPOSE_FILE" "$@"
  fi
}

# ── DB 시작 ───────────────────────────────
db_up() {
  log_info "PostgreSQL + Adminer를 시작합니다..."
  dc up -d
  log_ok "DB 컨테이너 시작됨"

  # PostgreSQL 준비 대기
  log_info "PostgreSQL 준비 대기 중..."
  local MAX_RETRIES=20
  for i in $(seq 1 $MAX_RETRIES); do
    if dc exec -T postgres pg_isready -U amb_user &>/dev/null; then
      log_ok "PostgreSQL 준비 완료"
      return 0
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
      log_warn "PostgreSQL 준비 대기 타임아웃 (로그를 확인하세요)"
      return 0
    fi
    sleep 1
  done
}

# ── DB 중지 ───────────────────────────────
db_down() {
  log_info "DB 컨테이너를 중지합니다..."
  dc down
  log_ok "DB 컨테이너 중지됨"
}

# ── 개발 서버 시작 ────────────────────────
dev_server() {
  log_info "개발 서버를 시작합니다 (Turborepo)..."
  cd "$PROJECT_ROOT"
  npm run dev
}

# ── 상태 확인 ─────────────────────────────
status() {
  echo ""
  log_info "=== DB 컨테이너 상태 ==="
  dc ps
  echo ""

  # PostgreSQL 연결 확인
  if dc exec -T postgres pg_isready -U amb_user &>/dev/null; then
    log_ok "PostgreSQL: 연결 가능"
  else
    log_warn "PostgreSQL: 연결 불가"
  fi

  echo ""
  log_info "=== 포트 사용 현황 ==="

  for PORT_INFO in "3019:API" "5189:Web" "5442:PostgreSQL" "8099:Adminer"; do
    PORT="${PORT_INFO%%:*}"
    NAME="${PORT_INFO##*:}"
    if lsof -i ":$PORT" &>/dev/null; then
      log_ok "$NAME (포트 $PORT): 사용 중"
    else
      log_warn "$NAME (포트 $PORT): 미사용"
    fi
  done

  echo ""
  log_info "=== Git 정보 ==="
  cd "$PROJECT_ROOT"
  echo "  브랜치: $(git branch --show-current)"
  echo "  최근 커밋:"
  git log --oneline -3 | sed 's/^/    /'
}

# ── 로그 보기 ─────────────────────────────
logs() {
  dc logs -f --tail=100
}

# ── DB 리셋 ───────────────────────────────
reset() {
  log_warn "DB를 초기화합니다 (모든 데이터가 삭제됩니다)..."
  echo ""
  read -rp "정말 초기화하시겠습니까? [y/N]: " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    log_info "취소되었습니다."
    exit 0
  fi

  log_info "DB 컨테이너 중지 및 볼륨 삭제..."
  dc down -v
  log_ok "볼륨 삭제 완료"

  db_up
  log_ok "DB 초기화 완료"
}

# ── 전체 시작 (DB + 개발 서버) ────────────
start() {
  echo "============================================"
  echo "  AMB Management - Development Environment"
  echo "  $(date '+%Y-%m-%d %H:%M:%S')"
  echo "============================================"
  echo ""

  check_prerequisites
  db_up
  echo ""
  dev_server
}

# ── 메인 ──────────────────────────────────
check_prerequisites

case "${1:-start}" in
  start)   start ;;
  db)      db_up ;;
  stop)    db_down ;;
  status)  status ;;
  logs)    logs ;;
  reset)   reset ;;
  *)
    echo "Usage: $0 {start|db|stop|status|logs|reset}"
    echo ""
    echo "Commands:"
    echo "  start     DB 시작 + 개발 서버 실행 [기본값]"
    echo "  db        DB만 시작 (PostgreSQL + Adminer)"
    echo "  stop      DB 중지"
    echo "  status    DB 상태 + 포트 확인"
    echo "  logs      DB 로그"
    echo "  reset     DB 초기화 (볼륨 삭제 후 재시작)"
    exit 1
    ;;
esac
